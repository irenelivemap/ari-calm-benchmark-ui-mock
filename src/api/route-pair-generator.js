(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriRoutePairGenerator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_API_BASE = '/api/v1/routing';
  const DEFAULT_STORAGE_KEY = 'ari-benchmark-route-pairs-v1';
  const DEFAULT_GOOGLE_STORAGE_KEY = 'ari-fast-google-benchmark-route-pairs-v1';

  /** O/D pairs whose two engines snap the start or end more than this far apart
   *  are unfair matchups — the engines disagree on where the trip begins/ends —
   *  and are redrawn. Imported from the livemap-routing bench. */
  const SNAP_AGREE_MAX_M = 40;

  /**
   * Hand-drawn central-Zurich sampling region for random origin/destination
   * pairs, imported from the livemap-routing guided blind benchmark. Points are
   * drawn inside this polygon (not just its bounding box) so endpoints stay on
   * the walkable core and clear of the lake. Ring is [lng, lat], closed.
   */
  const ZURICH_POLYGON = [
    [8.5355835, 47.3585861],
    [8.5075933, 47.3626448],
    [8.4882483, 47.3827599],
    [8.5106748, 47.3997966],
    [8.5299342, 47.3980005],
    [8.5507342, 47.3913948],
    [8.5616051, 47.382586],
    [8.5596363, 47.3690801],
    [8.5620076, 47.3496018],
    [8.5528487, 47.3539511],
    [8.544717, 47.367287],
    [8.5360717, 47.3636924],
    [8.5355835, 47.3585861]
  ];

  /** O/D pairs must be at least this far apart, and no farther (keeps it walkable). */
  const MIN_OD_METERS = 400;
  const MAX_OD_METERS = 3000;

  /** How many random draws to attempt before giving up on a routable pair. The
   *  polygon constraint rejects most draws, so allow plenty of attempts. */
  const MAX_OD_TRIES = 40;

  /** How many facade "cannot route this pair" responses to tolerate per round
   *  before treating the API as unusable for this draw. */
  const MAX_ROUTE_ERRORS = 5;

  const EARTH_M_PER_DEG_LAT = 111320;
  const toRad = degrees => (degrees * Math.PI) / 180;

  /** Axis-aligned bounds of a [lng, lat] ring — the box we draw samples from. */
  function bboxOfPolygon(ring) {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return { minLat, maxLat, minLng, maxLng };
  }

  const ZURICH_BBOX = bboxOfPolygon(ZURICH_POLYGON);

  /** Ray-casting point-in-polygon. point and ring vertices are [lng, lat]. */
  function pointInPolygon(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  /** Equirectangular metric distance between [lng, lat] points — fine at city scale. */
  function metersBetween(a, b) {
    const mPerDegLng = EARTH_M_PER_DEG_LAT * Math.cos(toRad((a[1] + b[1]) / 2));
    const dx = (b[0] - a[0]) * mPerDegLng;
    const dy = (b[1] - a[1]) * EARTH_M_PER_DEG_LAT;
    return Math.hypot(dx, dy);
  }

  /** Uniform random point in a bbox. `rng` is injectable so tests stay deterministic. */
  function randomPointInBbox(bbox, rng = Math.random) {
    return {
      lng: bbox.minLng + rng() * (bbox.maxLng - bbox.minLng),
      lat: bbox.minLat + rng() * (bbox.maxLat - bbox.minLat)
    };
  }

  /**
   * Draw one random O/D candidate inside `bbox`. Returns null when either point
   * falls outside the sampling polygon, or the two points fall outside
   * [min, max] meters — the caller re-draws (and also re-draws when the router
   * cannot connect them). Geometry validity is the router's job, not ours.
   */
  function pickRandomOdCandidate(bbox, rng = Math.random, opts = {}) {
    const min = opts.min ?? MIN_OD_METERS;
    const max = opts.max ?? MAX_OD_METERS;
    const polygon = opts.polygon === undefined ? ZURICH_POLYGON : opts.polygon;
    const origin = randomPointInBbox(bbox, rng);
    const destination = randomPointInBbox(bbox, rng);
    if (
      polygon &&
      (!pointInPolygon([origin.lng, origin.lat], polygon) ||
        !pointInPolygon([destination.lng, destination.lat], polygon))
    ) {
      return null;
    }
    const distance = metersBetween(
      [origin.lng, origin.lat],
      [destination.lng, destination.lat]
    );
    if (distance < min || distance > max) return null;
    return {
      points: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat]
      ],
      origin,
      destination,
      distance
    };
  }

  const round5 = value => Number(value).toFixed(5);

  /** Stable O/D pair id. points = [[lng, lat], [lng, lat]]. */
  function pairIdFromPoints(points) {
    const fmt = point => `${round5(point[1])}-${round5(point[0])}`;
    return `zurich-random-${fmt(points[0])}-to-${fmt(points[1])}`;
  }

  /** GeoJSON [lng, lat] coordinates → benchmark-shell [lat, lng] tuples. */
  function toLatLngTuples(coordinates) {
    return (coordinates || []).map(point => [point[1], point[0]]);
  }

  /**
   * Shape one facade response into the shell's BenchmarkRoutePair. `routeTypes`
   * maps benchmark route keys to facade profiles, e.g.
   * `{ fast: 'foot_fast', calm: 'foot_calm' }`.
   */
  function buildRoutePair(candidate, facadeRoutes, routeTypes) {
    const pairId = pairIdFromPoints(candidate.points);
    const routes = {};
    for (const [routeType, profile] of Object.entries(routeTypes)) {
      const route = (facadeRoutes || []).find(item => item.profile === profile);
      const coordinates = route?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return null;
      }
      routes[routeType] = {
        routeId: `${pairId}-${profile}`,
        source: 'model',
        metadata: {
          profile,
          distanceMeters: route.distanceMeters ?? route.distance ?? null,
          durationSeconds: route.timeMillis != null
            ? Math.round(route.timeMillis / 1000)
            : route.time != null ? Math.round(route.time / 1000) : null,
          resolvedBucket: route.resolvedBucket || null
        },
        geometry: toLatLngTuples(coordinates)
      };
    }

    const firstType = Object.keys(routeTypes)[0];
    const snapped = routes[firstType].geometry;
    return {
      pairId,
      origin: { lat: snapped[0][0], lng: snapped[0][1] },
      destination: {
        lat: snapped[snapped.length - 1][0],
        lng: snapped[snapped.length - 1][1]
      },
      routes
    };
  }

  /* ------------------------------------------------------ google directions
   *
   * Google's route geometry is never persisted (Maps ToS): caches keep only
   * metrics, snapped endpoints, and our own route. The Google path is re-fetched
   * live from the stored snapped endpoints whenever a cached round is loaded,
   * mirroring how the livemap-routing bench reproduces routes in review.
   */

  /** Pinned DirectionsService request so re-fetches reproduce the same route.
   *  Every result-shaping option is explicit; WALKING has no departureTime. */
  function googleDirectionsRequest(origin, destination, walkingMode) {
    return {
      origin,
      destination,
      travelMode: walkingMode,
      provideRouteAlternatives: false,
      avoidFerries: false,
      avoidHighways: false,
      avoidTolls: false
    };
  }

  /** Read a Google LatLng (accessor methods) or a plain {lat,lng} into [lng, lat]. */
  function lngLatOf(latLng) {
    if (!latLng) return null;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  }

  /** Metrics, snapped endpoints, and in-memory path of a Google DirectionsRoute. */
  function summarizeGoogleRoute(gRoute) {
    const legs = (gRoute && gRoute.legs) || [];
    let distanceMeters = 0;
    let durationSeconds = 0;
    let steps = 0;
    for (const leg of legs) {
      distanceMeters += leg.distance?.value || 0;
      durationSeconds += leg.duration?.value || 0;
      steps += leg.steps?.length || 0;
    }
    const coordinates = ((gRoute && gRoute.overview_path) || [])
      .map(lngLatOf)
      .filter(Boolean);
    return {
      distanceMeters,
      durationSeconds,
      steps,
      snapStart: lngLatOf(legs[0]?.start_location) || coordinates[0] || null,
      snapEnd: lngLatOf(legs[legs.length - 1]?.end_location) || coordinates[coordinates.length - 1] || null,
      coordinates
    };
  }

  /** True when either endpoint's engine snap gap exceeds `max` meters. Unknown
   *  gaps never trip it: only measured disagreements reject a matchup. */
  function snapTooFar(oursLngLats, googleSummary, max = SNAP_AGREE_MAX_M) {
    if (!Array.isArray(oursLngLats) || !oursLngLats.length) return false;
    const start = googleSummary?.snapStart
      ? metersBetween(oursLngLats[0], googleSummary.snapStart)
      : null;
    const end = googleSummary?.snapEnd
      ? metersBetween(oursLngLats[oursLngLats.length - 1], googleSummary.snapEnd)
      : null;
    return (start != null && start > max) || (end != null && end > max);
  }

  function hasGoogleDirections() {
    return typeof window !== 'undefined' && !!window.google?.maps?.DirectionsService;
  }

  /** Default Directions transport: the Maps JS SDK already loaded on the page. */
  function createBrowserDirectionsProvider() {
    let service = null;
    return function browserDirections(origin, destination) {
      const maps = window.google?.maps;
      if (!maps?.DirectionsService) {
        return Promise.reject(new Error('Google Maps SDK is not loaded.'));
      }
      service ||= new maps.DirectionsService();
      return new Promise((resolve, reject) => {
        service.route(
          googleDirectionsRequest(origin, destination, maps.TravelMode.WALKING),
          (result, status) => {
            if (status === 'OK' && result?.routes?.[0]) resolve(result.routes[0]);
            else reject(new Error(`Google Directions: ${status}`));
          }
        );
      });
    };
  }

  /**
   * Random route-pair provider against the LiveMap routing facade
   * (`POST {apiBase}/route`), imported from the livemap-routing runtime bench.
   *
   * Behavior:
   * - Draws random O/D candidates in the Zurich sampling polygon and requests
   *   both configured profiles in one facade call.
   * - Persists each generated pair per session so retries and resumed sessions
   *   load the identical pair (the shell verifies `expectedPairId` on resume).
   * - Falls back to `fallbackProvider` (usually the mock fixtures) when the
   *   facade is unreachable, and stops retrying the network for that session.
   */
  function createLivemapRoutePairProvider(options = {}) {
    const apiBase = options.apiBase ?? DEFAULT_API_BASE;
    const routeTypes = options.routeTypes || { fast: 'foot_fast', calm: 'foot_calm' };
    const polygon = options.polygon === undefined ? ZURICH_POLYGON : options.polygon;
    const bbox = options.bbox || (polygon ? bboxOfPolygon(polygon) : ZURICH_BBOX);
    const rng = options.rng || Math.random;
    const maxTries = options.maxTries ?? MAX_OD_TRIES;
    const maxRouteErrors = options.maxRouteErrors ?? MAX_ROUTE_ERRORS;
    const fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    const fallbackProvider = options.fallbackProvider || null;
    const storage = options.storage !== undefined
      ? options.storage
      : typeof localStorage !== 'undefined' ? localStorage : null;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const warn = options.onWarning || (message => console.warn(`[ARI route pairs] ${message}`));

    let apiUnavailable = false;

    function readCache(sessionId) {
      if (!storage) return { sessionId, rounds: {} };
      try {
        const stored = JSON.parse(storage.getItem(storageKey) || 'null');
        if (stored && stored.sessionId === sessionId && stored.rounds) return stored;
      } catch (error) {
        warn(`Ignoring unreadable pair cache: ${error.message}`);
      }
      return { sessionId, rounds: {} };
    }

    function writeCache(cache) {
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify(cache));
      } catch (error) {
        warn(`Could not persist generated pair: ${error.message}`);
      }
    }

    async function fetchPairFromFacade(points) {
      const response = await fetchImpl(`${apiBase}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points,
          profiles: Object.values(routeTypes),
          details: true
        })
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        const message = data.routeErrors?.[0]?.message || data.message || `HTTP ${response.status}`;
        const error = new Error(message);
        error.routeError = true;
        throw error;
      }
      return data.routes || [];
    }

    async function generatePair() {
      if (!fetchImpl) throw new Error('No fetch implementation available.');
      let routeErrors = 0;
      for (let attempt = 0; attempt < maxTries; attempt++) {
        const candidate = pickRandomOdCandidate(bbox, rng, { polygon });
        if (!candidate) continue;
        let facadeRoutes;
        try {
          facadeRoutes = await fetchPairFromFacade(candidate.points);
        } catch (error) {
          if (!error.routeError) throw error;
          routeErrors += 1;
          if (routeErrors >= maxRouteErrors) {
            throw new Error(`Routing facade rejected ${routeErrors} pairs in a row (${error.message}).`);
          }
          continue;
        }
        const pair = buildRoutePair(candidate, facadeRoutes, routeTypes);
        if (pair) return pair;
        routeErrors += 1;
        if (routeErrors >= maxRouteErrors) {
          throw new Error('Routing facade responses were missing the configured profiles.');
        }
      }
      throw new Error(`No routable pair found in ${maxTries} draws.`);
    }

    async function useFallback({ sessionId, roundIndex }, reason) {
      if (!fallbackProvider) throw reason;
      warn(`Falling back to fixture pairs: ${reason.message}`);
      return fallbackProvider({ sessionId, roundIndex });
    }

    return async function routePairProvider({ sessionId, roundIndex }) {
      const cache = readCache(sessionId);
      const cached = cache.rounds[roundIndex];
      if (cached) return cached;

      if (apiUnavailable) {
        return useFallback({ sessionId, roundIndex }, new Error('Routing API marked unavailable.'));
      }

      let pair;
      try {
        pair = await generatePair();
      } catch (error) {
        apiUnavailable = true;
        return useFallback({ sessionId, roundIndex }, error);
      }
      cache.rounds[roundIndex] = pair;
      writeCache(cache);
      return pair;
    };
  }

  /**
   * Random route-pair provider for the Fast vs Google Fast challenge: ARI's
   * `foot_fast` comes from the routing facade, Google's walking route from the
   * Directions SDK at run time. Pairs are persisted per session WITHOUT the
   * Google geometry (Maps ToS): a cached round stores our route, the candidate
   * points, Google's snapped endpoints, and metrics; loading it re-fetches the
   * Google path live from those snapped endpoints so the request snapping is a
   * no-op and the tester sees the same matchup.
   */
  function createLivemapGoogleRoutePairProvider(options = {}) {
    const apiBase = options.apiBase ?? DEFAULT_API_BASE;
    const fastProfile = options.fastProfile || 'foot_fast';
    const polygon = options.polygon === undefined ? ZURICH_POLYGON : options.polygon;
    const bbox = options.bbox || (polygon ? bboxOfPolygon(polygon) : ZURICH_BBOX);
    const rng = options.rng || Math.random;
    const maxTries = options.maxTries ?? MAX_OD_TRIES;
    const maxRouteErrors = options.maxRouteErrors ?? MAX_ROUTE_ERRORS;
    const snapAgreeMaxMeters = options.snapAgreeMaxMeters ?? SNAP_AGREE_MAX_M;
    const fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    const directionsProvider = options.directionsProvider
      || (typeof window !== 'undefined' ? createBrowserDirectionsProvider() : null);
    const directionsAvailable = options.directionsAvailable || hasGoogleDirections;
    const fallbackProvider = options.fallbackProvider || null;
    const storage = options.storage !== undefined
      ? options.storage
      : typeof localStorage !== 'undefined' ? localStorage : null;
    const storageKey = options.storageKey || DEFAULT_GOOGLE_STORAGE_KEY;
    const warn = options.onWarning || (message => console.warn(`[ARI route pairs] ${message}`));

    let apiUnavailable = false;
    const memoryPairs = new Map();

    function readCache(sessionId) {
      if (!storage) return { sessionId, rounds: {} };
      try {
        const stored = JSON.parse(storage.getItem(storageKey) || 'null');
        if (stored && stored.sessionId === sessionId && stored.rounds) return stored;
      } catch (error) {
        warn(`Ignoring unreadable pair cache: ${error.message}`);
      }
      return { sessionId, rounds: {} };
    }

    function writeCache(cache) {
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify(cache));
      } catch (error) {
        warn(`Could not persist generated pair: ${error.message}`);
      }
    }

    async function fetchFastRoute(points) {
      const response = await fetchImpl(`${apiBase}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, profiles: [fastProfile], details: true })
      });
      const data = await response.json();
      const route = (data.routes || []).find(item => item.profile === fastProfile);
      if (!response.ok || data.status !== 'ok' || !route?.geometry?.coordinates?.length) {
        const message = data.routeErrors?.[0]?.message || data.message || `HTTP ${response.status}`;
        const error = new Error(message);
        error.routeError = response.ok || response.status < 500;
        throw error;
      }
      return route;
    }

    function buildGooglePair(points, fastRoute, googleSummary) {
      const pairId = pairIdFromPoints(points);
      const fastGeometry = toLatLngTuples(fastRoute.geometry.coordinates);
      return {
        pairId,
        origin: { lat: fastGeometry[0][0], lng: fastGeometry[0][1] },
        destination: {
          lat: fastGeometry[fastGeometry.length - 1][0],
          lng: fastGeometry[fastGeometry.length - 1][1]
        },
        routes: {
          livemap_fast: {
            routeId: `${pairId}-${fastProfile}`,
            source: 'livemap_fast',
            metadata: {
              profile: fastProfile,
              distanceMeters: fastRoute.distanceMeters ?? fastRoute.distance ?? null,
              durationSeconds: fastRoute.timeMillis != null
                ? Math.round(fastRoute.timeMillis / 1000)
                : null,
              resolvedBucket: fastRoute.resolvedBucket || null
            },
            geometry: fastGeometry
          },
          google: {
            routeId: `${pairId}-google`,
            source: 'google',
            metadata: {
              distanceMeters: googleSummary.distanceMeters,
              durationSeconds: googleSummary.durationSeconds,
              steps: googleSummary.steps
            },
            geometry: toLatLngTuples(googleSummary.coordinates)
          }
        }
      };
    }

    /** Storable form of a pair: everything except the Google path (Maps ToS). */
    function persistableEntry(points, pair, googleSummary) {
      const stored = JSON.parse(JSON.stringify(pair));
      stored.routes.google.geometry = null;
      return {
        points,
        googleSnapStart: googleSummary.snapStart,
        googleSnapEnd: googleSummary.snapEnd,
        pair: stored
      };
    }

    async function restoreCachedEntry(entry) {
      const [startLng, startLat] = entry.googleSnapStart || entry.points[0];
      const [endLng, endLat] = entry.googleSnapEnd || entry.points[1];
      const gRoute = await directionsProvider(
        { lat: startLat, lng: startLng },
        { lat: endLat, lng: endLng }
      );
      const summary = summarizeGoogleRoute(gRoute);
      const pair = JSON.parse(JSON.stringify(entry.pair));
      pair.routes.google.geometry = toLatLngTuples(summary.coordinates);
      pair.routes.google.metadata = {
        distanceMeters: summary.distanceMeters,
        durationSeconds: summary.durationSeconds,
        steps: summary.steps
      };
      return pair;
    }

    async function generatePair() {
      if (!fetchImpl) throw new Error('No fetch implementation available.');
      let routeErrors = 0;
      for (let attempt = 0; attempt < maxTries; attempt++) {
        const candidate = pickRandomOdCandidate(bbox, rng, { polygon });
        if (!candidate) continue;
        let fastRoute;
        let gRoute;
        try {
          [fastRoute, gRoute] = await Promise.all([
            fetchFastRoute(candidate.points),
            directionsProvider(
              { lat: candidate.origin.lat, lng: candidate.origin.lng },
              { lat: candidate.destination.lat, lng: candidate.destination.lng }
            )
          ]);
        } catch (error) {
          if (!error.routeError && !/Directions/.test(error.message)) throw error;
          routeErrors += 1;
          if (routeErrors >= maxRouteErrors) {
            throw new Error(`Route engines rejected ${routeErrors} pairs in a row (${error.message}).`);
          }
          continue;
        }
        const summary = summarizeGoogleRoute(gRoute);
        if (summary.coordinates.length < 2) {
          routeErrors += 1;
          if (routeErrors >= maxRouteErrors) {
            throw new Error('Google Directions responses were missing route geometry.');
          }
          continue;
        }
        // Fairness gate: when the two engines snap the trip endpoints too far
        // apart they are routing different trips — draw another pair.
        if (snapTooFar(fastRoute.geometry.coordinates, summary, snapAgreeMaxMeters)) continue;
        return { points: candidate.points, fastRoute, summary };
      }
      throw new Error(`No comparable pair found in ${maxTries} draws.`);
    }

    async function useFallback({ sessionId, roundIndex }, reason) {
      if (!fallbackProvider) throw reason;
      warn(`Falling back to fixture pairs: ${reason.message}`);
      return fallbackProvider({ sessionId, roundIndex });
    }

    return async function routePairProvider({ sessionId, roundIndex }) {
      const memoryKey = `${sessionId}:${roundIndex}`;
      if (memoryPairs.has(memoryKey)) return memoryPairs.get(memoryKey);

      if (!directionsProvider || !directionsAvailable()) {
        return useFallback({ sessionId, roundIndex }, new Error('Google Directions is not available (no Maps key configured).'));
      }
      if (apiUnavailable) {
        return useFallback({ sessionId, roundIndex }, new Error('Routing API marked unavailable.'));
      }

      const cache = readCache(sessionId);
      const cached = cache.rounds[roundIndex];
      if (cached) {
        const pair = await restoreCachedEntry(cached);
        memoryPairs.set(memoryKey, pair);
        return pair;
      }

      let generated;
      try {
        generated = await generatePair();
      } catch (error) {
        apiUnavailable = true;
        return useFallback({ sessionId, roundIndex }, error);
      }
      const pair = buildGooglePair(generated.points, generated.fastRoute, generated.summary);
      memoryPairs.set(memoryKey, pair);
      cache.rounds[roundIndex] = persistableEntry(generated.points, pair, generated.summary);
      writeCache(cache);
      return pair;
    };
  }

  return {
    ZURICH_POLYGON,
    ZURICH_BBOX,
    MIN_OD_METERS,
    MAX_OD_METERS,
    MAX_OD_TRIES,
    SNAP_AGREE_MAX_M,
    DEFAULT_API_BASE,
    DEFAULT_STORAGE_KEY,
    DEFAULT_GOOGLE_STORAGE_KEY,
    bboxOfPolygon,
    pointInPolygon,
    metersBetween,
    randomPointInBbox,
    pickRandomOdCandidate,
    pairIdFromPoints,
    toLatLngTuples,
    buildRoutePair,
    googleDirectionsRequest,
    summarizeGoogleRoute,
    snapTooFar,
    createLivemapRoutePairProvider,
    createLivemapGoogleRoutePairProvider
  };
});
