(function () {
  function normalizeLatLngs(geometry) {
    return geometry.map(point => Array.isArray(point) ? point : [point.lat, point.lng]);
  }

  function toLatLngObject(point) {
    return { lat: point[0], lng: point[1] };
  }

  function pointToSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 && dy === 0) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
  }

  function hasGoogleMaps() {
    return !!(window.google && window.google.maps);
  }

  function hasMapLibre() {
    return !!window.maplibregl;
  }

  /** DOM for the live Street View position marker: identity-colored core,
   *  pulsing halo, and a view cone rotating with the panorama heading. */
  function createStreetViewMarkerElement(color) {
    const element = document.createElement('span');
    element.className = 'ari-sv-marker';
    element.style.setProperty('--sv-color', color);
    element.innerHTML =
      '<span class="ari-sv-marker__halo"></span>' +
      '<span class="ari-sv-marker__cone" hidden></span>' +
      '<span class="ari-sv-marker__dot"></span>';
    return element;
  }

  function updateStreetViewMarkerElement(element, { color, heading } = {}) {
    if (!element) return;
    if (color) element.style.setProperty('--sv-color', color);
    if (heading !== undefined) {
      const cone = element.querySelector('.ari-sv-marker__cone');
      if (!cone) return;
      if (heading === null || !Number.isFinite(heading)) {
        cone.hidden = true;
      } else {
        cone.hidden = false;
        cone.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
      }
    }
  }

  /** Wedge for the Google symbol marker; the tip sits on the position. */
  const GOOGLE_CONE_PATH = 'M 0 0 L -7.2 -16.5 A 18 18 0 0 1 7.2 -16.5 Z';

  /** LiveMap style pipeline imported from livemap-routing/runtime demo. */
  const LIVEMAP_STYLE_BASE = 'https://map.paas.livemap.sh/styles';
  const LIVEMAP_BASEMAP_TILEJSON_URL = 'https://tiles.livemap-dev.com/basemap';
  const FALLBACK_MAPLIBRE_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';
  const ZURICH_CENTER = [8.54, 47.377];

  function absolutizeStyleAssetUrl(url, styleUrl) {
    if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    if (url.startsWith('/')) return `${new URL(styleUrl).origin}${url}`;
    return new URL(url, styleUrl).toString();
  }

  /**
   * Load the LiveMap MapLibre style and wire its basemap source, exactly like
   * the livemap-routing runtime does. Falls back to a public style when the
   * LiveMap endpoints are unreachable so the benchmark stays usable.
   */
  async function loadLivemapMapStyle(variant = 'bright') {
    const styleUrl = `${LIVEMAP_STYLE_BASE}/${variant === 'dark' ? 'dark' : 'bright'}/style.json`;
    const response = await fetch(styleUrl);
    if (!response.ok) {
      throw new Error(`Could not load map style: ${response.status} ${response.statusText}`);
    }
    const style = await response.json();
    style.sources = {
      ...style.sources,
      openmaptiles: {
        type: 'vector',
        url: LIVEMAP_BASEMAP_TILEJSON_URL
      }
    };
    style.sprite = absolutizeStyleAssetUrl(style.sprite, styleUrl);
    style.glyphs = absolutizeStyleAssetUrl(style.glyphs, styleUrl);
    return style;
  }

  function createMapAdapter(options) {
    const state = {
      canvas: options.canvas,
      provider: options.provider,
      routeAColor: options.routeAColor,
      routeBColor: options.routeBColor,
      maxFitZoom: options.maxFitZoom,
      toolsElement: options.toolsElement || null,
      onRoutePointClick: options.onRoutePointClick,
      map: null,
      routeLayers: null,
      routeVisuals: { routeA: [], routeB: [] },
      googleOverlays: [],
      googleHitAreas: [],
      googleRouteVisuals: { routeA: [], routeB: [] },
      routeVisibility: 1,
      routeAnimationFrame: null,
      standardTiles: null,
      pair: null,
      assignment: null,
      streetHandlerBound: false,
      streetViewEnabled: false,
      streetViewMarker: null,
      streetViewMarkerEl: null,
      streetViewGoogleParts: null,
      streetViewHeading: null,
      mapStyleVariant: options.mapStyleVariant || 'bright',
      destroyed: false,
      maplibreInit: null,
      maplibreQueue: null,
      maplibreVisuals: { routeA: [], routeB: [] },
      maplibreMarkers: []
    };

    async function createMapLibreMap() {
      const style = await loadLivemapMapStyle(state.mapStyleVariant).catch(error => {
        console.warn('[ARI map] LiveMap style unavailable, using fallback style.', error);
        return FALLBACK_MAPLIBRE_STYLE_URL;
      });
      if (state.destroyed) return;
      const map = new maplibregl.Map({
        container: state.canvas,
        style,
        center: ZURICH_CENTER,
        zoom: 13,
        attributionControl: { compact: true }
      });
      await new Promise(resolve => (map.loaded() ? resolve() : map.once('load', resolve)));
      if (state.destroyed) {
        map.remove();
        return;
      }
      if (state.toolsElement) {
        map.addControl({
          onAdd() {
            state.toolsElement.classList.add('maplibregl-ctrl');
            return state.toolsElement;
          },
          onRemove() {}
        }, 'top-right');
      }
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      state.map = map;
    }

    /** Serialize MapLibre work behind the async style/map bootstrap. */
    function whenMapLibreReady(run) {
      if (!state.maplibreInit) {
        state.maplibreInit = createMapLibreMap();
        state.maplibreQueue = state.maplibreInit;
      }
      state.maplibreQueue = state.maplibreQueue
        .then(() => (state.map && !state.destroyed ? run(state.map) : undefined))
        .catch(error => console.warn('[ARI map]', error));
      return state.maplibreQueue;
    }

    const MAPLIBRE_ROUTE_LAYERS = [
      { id: 'ari-route-a-case', route: 'routeA', kind: 'case', color: '#ffffff', width: 15, opacity: 0.82 },
      { id: 'ari-route-b-case', route: 'routeB', kind: 'case', color: '#ffffff', width: 15, opacity: 0.82 },
      { id: 'ari-route-a-line', route: 'routeA', kind: 'line', width: 9, opacity: 0.98 },
      { id: 'ari-route-b-line', route: 'routeB', kind: 'line', width: 6, opacity: 0.98 },
      { id: 'ari-route-a-hit', route: 'routeA', kind: 'hit', width: 32, opacity: 0.01 },
      { id: 'ari-route-b-hit', route: 'routeB', kind: 'hit', width: 32, opacity: 0.01 }
    ];

    function maplibreRouteSourceId(routeKey) {
      return routeKey === 'routeB' ? 'ari-route-b' : 'ari-route-a';
    }

    function maplibreLineData(geometry) {
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: geometry.map(point => [point[1], point[0]])
        }
      };
    }

    function createMaplibreEndpointMarker(map, lngLat, kind) {
      const element = document.createElement('span');
      element.className = `ari-route-marker ari-route-marker--${kind}`;
      const marker = new maplibregl.Marker({ element }).setLngLat(lngLat).addTo(map);
      state.maplibreMarkers.push(marker);
      return marker;
    }

    function drawMaplibreRoutes(map, pair, assignment) {
      if (!state.streetHandlerBound) {
        state.streetHandlerBound = true;
        map.on('click', event => {
          if (!state.streetViewEnabled) return;
          const hitLayers = ['ari-route-a-hit', 'ari-route-b-hit'].filter(id => map.getLayer(id));
          const feature = hitLayers.length
            ? map.queryRenderedFeatures(event.point, { layers: hitLayers })[0]
            : null;
          state.onRoutePointClick({
            lat: event.lngLat.lat,
            lng: event.lngLat.lng,
            routeKey: feature
              ? feature.layer.id === 'ari-route-b-hit' ? 'routeB' : 'routeA'
              : null
          });
        });
      }
      const routeA = normalizeLatLngs(pair.routes[assignment.routeA].geometry);
      const routeB = normalizeLatLngs(pair.routes[assignment.routeB].geometry);
      const dataByRoute = { routeA: maplibreLineData(routeA), routeB: maplibreLineData(routeB) };

      ['routeA', 'routeB'].forEach(routeKey => {
        const sourceId = maplibreRouteSourceId(routeKey);
        const source = map.getSource(sourceId);
        if (source) source.setData(dataByRoute[routeKey]);
        else map.addSource(sourceId, { type: 'geojson', data: dataByRoute[routeKey] });
      });

      state.maplibreVisuals = { routeA: [], routeB: [] };
      MAPLIBRE_ROUTE_LAYERS.forEach(layer => {
        const color = layer.color
          || (layer.route === 'routeB' ? state.routeBColor : state.routeAColor);
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            id: layer.id,
            type: 'line',
            source: maplibreRouteSourceId(layer.route),
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': color,
              'line-width': layer.width,
              'line-opacity': layer.opacity * (layer.kind === 'hit' ? 1 : state.routeVisibility)
            }
          });
        }
        if (layer.kind !== 'hit') {
          state.maplibreVisuals[layer.route].push({
            id: layer.id,
            baseWidth: layer.width,
            baseOpacity: layer.opacity
          });
        }
      });

      state.maplibreMarkers.forEach(marker => marker.remove());
      state.maplibreMarkers = [];
      createMaplibreEndpointMarker(map, [pair.origin.lng, pair.origin.lat], 'start');
      createMaplibreEndpointMarker(map, [pair.destination.lng, pair.destination.lat], 'end');
      applyRouteVisibility(state.routeVisibility);
    }

    function maplibreRouteBounds() {
      if (!state.pair || !state.assignment) return null;
      const bounds = new maplibregl.LngLatBounds();
      [state.assignment.routeA, state.assignment.routeB].forEach(routeType => {
        normalizeLatLngs(state.pair.routes[routeType].geometry).forEach(point => {
          bounds.extend([point[1], point[0]]);
        });
      });
      return bounds.isEmpty() ? null : bounds;
    }

    function ensure() {
      if (state.map) return;
      if (state.provider === 'google') {
        state.map = new google.maps.Map(state.canvas, {
          center: { lat: 47.377, lng: 8.54 },
          zoom: 13,
          clickableIcons: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false,
          cameraControl: true,
          cameraControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
          scaleControl: true,
          gestureHandling: 'greedy'
        });
        if (state.toolsElement) {
          // Benchmark actions join Google's own control layout: the tools box
          // occupies the top-right slot and the native camera control stacks
          // beneath it along the right edge.
          state.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(state.toolsElement);
        }
        return;
      }

      state.standardTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      });
      state.map = L.map(state.canvas, {
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25
      });
      state.standardTiles.addTo(state.map);
      if (state.toolsElement) {
        const ToolsControl = L.Control.extend({
          onAdd() {
            L.DomEvent.disableClickPropagation(state.toolsElement);
            return state.toolsElement;
          }
        });
        new ToolsControl({ position: 'topright' }).addTo(state.map);
      }
      L.control.zoom({ position: 'topright' }).addTo(state.map);
      state.routeLayers = L.featureGroup().addTo(state.map);
    }

    function fitRoutes(fitPadding, { animate = true } = {}) {
      if (state.provider === 'maplibre') {
        return whenMapLibreReady(map => {
          const bounds = maplibreRouteBounds();
          if (!bounds) return;
          map.fitBounds(bounds, {
            padding: fitPadding.maplibre ?? fitPadding.google,
            maxZoom: state.maxFitZoom,
            animate
          });
        });
      }
      ensure();
      if (state.provider === 'google') {
        if (!state.googleOverlays.length) return;
        const bounds = new google.maps.LatLngBounds();
        state.googleOverlays.forEach(overlay => {
          if (overlay.getPath) {
            overlay.getPath().forEach(point => bounds.extend(point));
          } else if (overlay.getPosition) {
            bounds.extend(overlay.getPosition());
          }
        });
        if (!bounds.isEmpty()) {
          state.map.fitBounds(bounds, fitPadding.google);
          google.maps.event.addListenerOnce(state.map, 'idle', () => {
            if (state.map.getZoom() > state.maxFitZoom) state.map.setZoom(state.maxFitZoom);
          });
        }
        return;
      }

      if (!state.routeLayers?.getLayers().length) return;
      state.map.invalidateSize();
      state.map.fitBounds(state.routeLayers.getBounds(), {
        ...fitPadding.leaflet,
        animate
      });
    }

    function getNearestLeafletRoute(containerPoint) {
      if (!state.pair || !state.assignment) return null;
      const routes = [
        {
          routeKey: 'routeA',
          geometry: normalizeLatLngs(state.pair.routes[state.assignment.routeA].geometry)
        },
        {
          routeKey: 'routeB',
          geometry: normalizeLatLngs(state.pair.routes[state.assignment.routeB].geometry)
        }
      ];
      let nearest = null;

      routes.forEach(({ routeKey, geometry }) => {
        geometry.slice(1).forEach((point, index) => {
          const start = state.map.latLngToContainerPoint(geometry[index]);
          const end = state.map.latLngToContainerPoint(point);
          const distance = pointToSegmentDistance(containerPoint, start, end);
          if (!nearest || distance < nearest.distance) nearest = { routeKey, distance };
        });
      });

      return nearest && nearest.distance <= 32 ? nearest : null;
    }

    function bindRoutePointClicks() {
      if (state.streetHandlerBound) return;
      state.streetHandlerBound = true;
      if (state.provider === 'google') {
        // Route hit-area polylines swallow their own clicks, so this fires
        // only for points away from both routes.
        state.map.addListener('click', event => {
          if (!state.streetViewEnabled || !event.latLng) return;
          state.onRoutePointClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            routeKey: null
          });
        });
        return;
      }
      state.map.on('click', event => {
        if (!state.streetViewEnabled) return;
        const nearest = getNearestLeafletRoute(event.containerPoint);
        state.onRoutePointClick({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
          routeKey: nearest ? nearest.routeKey : null
        });
      });
    }

    function drawGoogleRoutes(pair, assignment) {
      state.googleOverlays.forEach(overlay => overlay.setMap(null));
      state.googleOverlays = [];
      state.googleHitAreas = [];

      const routeA = normalizeLatLngs(pair.routes[assignment.routeA].geometry).map(toLatLngObject);
      const routeB = normalizeLatLngs(pair.routes[assignment.routeB].geometry).map(toLatLngObject);

      const routeACase = new google.maps.Polyline({
        path: routeA,
        map: state.map,
        strokeColor: '#ffffff',
        strokeOpacity: 0.82,
        strokeWeight: 15,
        clickable: false
      });
      const routeBCase = new google.maps.Polyline({
        path: routeB,
        map: state.map,
        strokeColor: '#ffffff',
        strokeOpacity: 0.82,
        strokeWeight: 15,
        clickable: false
      });
      const routeALine = new google.maps.Polyline({
        path: routeA,
        map: state.map,
        strokeColor: state.routeAColor,
        strokeOpacity: 0.98,
        strokeWeight: 9,
        clickable: false
      });
      const routeBLine = new google.maps.Polyline({
        path: routeB,
        map: state.map,
        strokeColor: state.routeBColor,
        strokeOpacity: 0.98,
        strokeWeight: 6,
        clickable: false
      });
      [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
        layer.__ariBaseWeight = layer.strokeWeight || 7;
        layer.__ariBaseOpacity = layer.strokeOpacity ?? 0.98;
      });

      function createStreetHitArea(path, routeKey, color) {
        const hitArea = new google.maps.Polyline({
          path,
          map: state.map,
          strokeColor: color,
          strokeOpacity: 0.01,
          strokeWeight: 32,
          clickable: state.streetViewEnabled,
          zIndex: 40
        });
        hitArea.addListener('click', event => {
          if (!state.streetViewEnabled) return;
          state.onRoutePointClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            routeKey
          });
        });
        return hitArea;
      }

      const routeAHitArea = createStreetHitArea(routeA, 'routeA', state.routeAColor);
      const routeBHitArea = createStreetHitArea(routeB, 'routeB', state.routeBColor);

      const startMarker = new google.maps.Marker({
        position: { lat: pair.origin.lat, lng: pair.origin.lng },
        map: state.map,
        title: 'Start',
        clickable: false,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#101511',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });
      const endMarker = new google.maps.Marker({
        position: { lat: pair.destination.lat, lng: pair.destination.lng },
        map: state.map,
        title: 'Destination',
        clickable: false,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#075F3D',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      state.googleRouteVisuals = {
        routeA: [routeACase, routeALine],
        routeB: [routeBCase, routeBLine]
      };
      state.googleHitAreas = [routeAHitArea, routeBHitArea];
      state.googleOverlays.push(
        routeACase,
        routeBCase,
        routeALine,
        routeBLine,
        routeAHitArea,
        routeBHitArea,
        startMarker,
        endMarker
      );
    }

    function drawLeafletRoutes(pair, assignment) {
      state.routeLayers.clearLayers();

      const startIcon = L.divIcon({
        className: '',
        html: '<span class="ari-route-marker ari-route-marker--start"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const endIcon = L.divIcon({
        className: '',
        html: '<span class="ari-route-marker ari-route-marker--end"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const routeA = normalizeLatLngs(pair.routes[assignment.routeA].geometry);
      const routeB = normalizeLatLngs(pair.routes[assignment.routeB].geometry);
      const routeACase = L.polyline(routeA, { color: '#ffffff', weight: 15, opacity: 0.82, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 15, __ariBaseOpacity: 0.82 }).addTo(state.routeLayers);
      const routeBCase = L.polyline(routeB, { color: '#ffffff', weight: 15, opacity: 0.82, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 15, __ariBaseOpacity: 0.82 }).addTo(state.routeLayers);
      const routeALine = L.polyline(routeA, { color: state.routeAColor, weight: 9, opacity: 0.98, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 9, __ariBaseOpacity: 0.98 }).addTo(state.routeLayers);
      const routeBLine = L.polyline(routeB, { color: state.routeBColor, weight: 6, opacity: 0.98, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 6, __ariBaseOpacity: 0.98 }).addTo(state.routeLayers);
      const routeAHitArea = L.polyline(routeA, {
        color: state.routeAColor,
        weight: 32,
        opacity: 0.01,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'ari-street-hit-area',
        bubblingMouseEvents: false
      }).addTo(state.routeLayers);
      const routeBHitArea = L.polyline(routeB, {
        color: state.routeBColor,
        weight: 32,
        opacity: 0.01,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'ari-street-hit-area',
        bubblingMouseEvents: false
      }).addTo(state.routeLayers);
      [
        { layer: routeAHitArea, routeKey: 'routeA' },
        { layer: routeBHitArea, routeKey: 'routeB' }
      ].forEach(({ layer, routeKey }) => {
        layer.on('click', event => {
          if (!state.streetViewEnabled) return;
          state.onRoutePointClick({
            lat: event.latlng.lat,
            lng: event.latlng.lng,
            routeKey
          });
        });
      });
      state.routeVisuals = {
        routeA: [routeACase, routeALine],
        routeB: [routeBCase, routeBLine]
      };
      L.marker([pair.origin.lat, pair.origin.lng], { icon: startIcon, keyboard: false }).addTo(state.routeLayers);
      L.marker([pair.destination.lat, pair.destination.lng], { icon: endIcon, keyboard: false }).addTo(state.routeLayers);
    }

    function drawRoutes(pair, assignment) {
      state.pair = pair;
      state.assignment = assignment;
      if (state.provider === 'maplibre') {
        return whenMapLibreReady(map => drawMaplibreRoutes(map, pair, assignment));
      }
      ensure();
      bindRoutePointClicks();
      if (state.provider === 'google') drawGoogleRoutes(pair, assignment);
      else drawLeafletRoutes(pair, assignment);
    }

    function applyRouteVisibility(value) {
      state.routeVisibility = value;
      if (state.provider === 'maplibre') {
        if (!state.map) return;
        Object.values(state.maplibreVisuals).flat().forEach(({ id, baseOpacity }) => {
          if (state.map.getLayer(id)) {
            state.map.setPaintProperty(id, 'line-opacity', baseOpacity * value);
          }
        });
        state.maplibreMarkers.forEach(marker => {
          marker.getElement().style.opacity = String(value);
        });
        return;
      }
      if (state.provider === 'google') {
        Object.values(state.googleRouteVisuals).flat().forEach(layer => {
          const baseOpacity = layer.__ariBaseOpacity ?? 0.98;
          layer.setOptions({ strokeOpacity: baseOpacity * value });
        });
        state.googleOverlays.forEach(overlay => {
          if (!overlay.getPath && typeof overlay.setOpacity === 'function') overlay.setOpacity(value);
        });
        return;
      }

      state.routeLayers?.eachLayer(layer => {
        const element = typeof layer.getElement === 'function' ? layer.getElement() : null;
        if (element) element.style.opacity = String(value);
        else if (typeof layer.setOpacity === 'function') layer.setOpacity(value);
      });
    }

    function setRoutesVisible(visible, { animate = true, duration = 220 } = {}) {
      const target = visible ? 1 : 0;
      if (state.routeAnimationFrame) cancelAnimationFrame(state.routeAnimationFrame);
      if (!animate || duration <= 0 || state.routeVisibility === target) {
        applyRouteVisibility(target);
        return Promise.resolve();
      }

      const startValue = state.routeVisibility;
      const startedAt = performance.now();
      return new Promise(resolve => {
        function step(now) {
          const progress = Math.min(1, (now - startedAt) / duration);
          const eased = 1 - Math.pow(1 - progress, 4);
          applyRouteVisibility(startValue + (target - startValue) * eased);
          if (progress < 1) {
            state.routeAnimationFrame = requestAnimationFrame(step);
          } else {
            state.routeAnimationFrame = null;
            resolve();
          }
        }
        state.routeAnimationFrame = requestAnimationFrame(step);
      });
    }

    function getRoutePointRect() {
      const canvasRect = state.canvas.getBoundingClientRect();
      const fallback = new DOMRect(
        canvasRect.left + canvasRect.width / 2 - 28,
        canvasRect.top + canvasRect.height / 2 - 28,
        56,
        56
      );
      if (!state.pair || !state.assignment || !canvasRect.width || !canvasRect.height) return fallback;

      const route = normalizeLatLngs(state.pair.routes[state.assignment.routeA].geometry);
      const point = route[Math.floor(route.length / 2)];
      if (!point) return fallback;

      if (state.provider === 'leaflet' && state.map?.latLngToContainerPoint) {
        const containerPoint = state.map.latLngToContainerPoint(point);
        return new DOMRect(canvasRect.left + containerPoint.x - 28, canvasRect.top + containerPoint.y - 28, 56, 56);
      }

      if (state.provider === 'maplibre' && state.map?.project) {
        const projected = state.map.project([point[1], point[0]]);
        return new DOMRect(canvasRect.left + projected.x - 28, canvasRect.top + projected.y - 28, 56, 56);
      }

      return fallback;
    }

    function focusRoute(routeKey) {
      const focusConfig = routeKey
        ? {
            routeA: routeKey === 'routeA' ? { opacity: 1, weightBoost: 2 } : { opacity: 0.38, weightBoost: -2 },
            routeB: routeKey === 'routeB' ? { opacity: 1, weightBoost: 2 } : { opacity: 0.38, weightBoost: -2 }
          }
        : {
            routeA: { opacity: 0.98, weightBoost: 0 },
            routeB: { opacity: 0.98, weightBoost: 0 }
          };

      if (state.provider === 'maplibre') {
        if (!state.map) return;
        Object.entries(state.maplibreVisuals).forEach(([key, layers]) => {
          const config = focusConfig[key];
          layers.forEach(({ id, baseWidth, baseOpacity }) => {
            if (!state.map.getLayer(id)) return;
            state.map.setPaintProperty(id, 'line-opacity', Math.min(baseOpacity, config.opacity));
            state.map.setPaintProperty(id, 'line-width', Math.max(4, baseWidth + config.weightBoost));
          });
        });
        return;
      }

      if (state.provider === 'google') {
        Object.entries(state.googleRouteVisuals).forEach(([key, layers]) => {
          const config = focusConfig[key];
          layers.forEach(layer => {
            const baseWeight = layer.__ariBaseWeight || 7;
            const baseOpacity = layer.__ariBaseOpacity ?? 0.98;
            layer.setOptions({
              strokeOpacity: Math.min(baseOpacity, config.opacity),
              strokeWeight: Math.max(4, baseWeight + config.weightBoost)
            });
          });
        });
        return;
      }

      Object.entries(state.routeVisuals).forEach(([key, layers]) => {
        const config = focusConfig[key];
        layers.forEach(layer => {
          const baseWeight = layer.options.__ariBaseWeight || layer.options.weight || 7;
          const baseOpacity = layer.options.__ariBaseOpacity ?? layer.options.opacity ?? 0.98;
          layer.setStyle({
            opacity: Math.min(baseOpacity, config.opacity),
            weight: Math.max(4, baseWeight + config.weightBoost)
          });
        });
      });
    }

    function setStreetViewEnabled(enabled) {
      state.streetViewEnabled = !!enabled;
      state.canvas.classList.toggle('is-street-view-mode', state.streetViewEnabled);
      state.googleHitAreas.forEach(layer => {
        layer.setOptions({ clickable: state.streetViewEnabled });
      });
    }

    function clearStreetViewPosition() {
      if (state.streetViewGoogleParts) {
        Object.values(state.streetViewGoogleParts).forEach(part => part.setMap(null));
        state.streetViewGoogleParts = null;
      }
      if (state.streetViewMarker) {
        if (state.provider !== 'google') state.streetViewMarker.remove();
        state.streetViewMarker = null;
      }
      state.streetViewMarkerEl = null;
      state.streetViewHeading = null;
    }

    function googleDotIcon(color) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      };
    }

    function googleHaloIcon(color) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 17,
        fillColor: color,
        fillOpacity: 0.12,
        strokeOpacity: 0
      };
    }

    function googleConeIcon(color, heading) {
      return {
        path: GOOGLE_CONE_PATH,
        scale: 1.6,
        fillColor: color,
        fillOpacity: 0.22,
        strokeOpacity: 0,
        rotation: heading || 0,
        anchor: new google.maps.Point(0, 0)
      };
    }

    function streetViewColor(routeKey) {
      return routeKey === 'routeB'
        ? state.routeBColor
        : routeKey === 'routeA' ? state.routeAColor : '#101511';
    }

    function setStreetViewPosition(point, routeKey = 'routeA') {
      const color = streetViewColor(routeKey);
      if (state.provider === 'maplibre') {
        return whenMapLibreReady(map => {
          if (!state.streetViewEnabled) return;
          if (!state.streetViewMarker) {
            state.streetViewMarkerEl = createStreetViewMarkerElement(color);
            state.streetViewMarker = new maplibregl.Marker({ element: state.streetViewMarkerEl })
              .setLngLat([point.lng, point.lat])
              .addTo(map);
          } else {
            state.streetViewMarker.setLngLat([point.lng, point.lat]);
          }
          updateStreetViewMarkerElement(state.streetViewMarkerEl, {
            color,
            heading: state.streetViewHeading
          });
        });
      }
      ensure();
      if (state.provider === 'google') {
        if (!state.streetViewGoogleParts) {
          const shared = { map: state.map, clickable: false };
          state.streetViewGoogleParts = {
            halo: new google.maps.Marker({ ...shared, zIndex: 78, icon: googleHaloIcon(color) }),
            cone: new google.maps.Marker({ ...shared, zIndex: 79, icon: googleConeIcon(color, state.streetViewHeading) }),
            dot: new google.maps.Marker({ ...shared, zIndex: 80, icon: googleDotIcon(color) })
          };
        }
        const parts = state.streetViewGoogleParts;
        parts.halo.setIcon(googleHaloIcon(color));
        parts.cone.setIcon(googleConeIcon(color, state.streetViewHeading));
        parts.dot.setIcon(googleDotIcon(color));
        Object.values(parts).forEach(part => {
          part.setPosition(point);
          part.setMap(state.map);
        });
        parts.cone.setVisible(state.streetViewHeading != null);
        return;
      }

      if (!state.streetViewMarker) {
        const element = createStreetViewMarkerElement(color);
        state.streetViewMarker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({ className: '', html: element.outerHTML, iconSize: [18, 18], iconAnchor: [9, 9] }),
          interactive: false,
          keyboard: false
        }).addTo(state.map);
        state.streetViewMarkerEl = state.streetViewMarker.getElement()?.querySelector('.ari-sv-marker') || null;
      } else {
        state.streetViewMarker.setLatLng([point.lat, point.lng]);
      }
      updateStreetViewMarkerElement(state.streetViewMarkerEl, {
        color,
        heading: state.streetViewHeading
      });
    }

    /** Rotate the marker's view cone with the panorama heading; null hides it. */
    function setStreetViewHeading(heading) {
      state.streetViewHeading = Number.isFinite(heading) ? heading : null;
      if (state.provider === 'google') {
        const parts = state.streetViewGoogleParts;
        if (!parts) return;
        if (state.streetViewHeading == null) {
          parts.cone.setVisible(false);
          return;
        }
        const icon = parts.cone.getIcon();
        parts.cone.setIcon({ ...icon, rotation: state.streetViewHeading });
        parts.cone.setVisible(true);
        return;
      }
      updateStreetViewMarkerElement(state.streetViewMarkerEl, { heading: state.streetViewHeading });
    }

    function getViewState() {
      if (state.provider === 'maplibre') {
        if (!state.map) return null;
        const mapCenter = state.map.getCenter();
        return {
          center: { lat: mapCenter.lat, lng: mapCenter.lng },
          zoom: state.map.getZoom()
        };
      }
      ensure();
      const center = state.map.getCenter();
      if (state.provider === 'google') {
        return {
          center: { lat: center.lat(), lng: center.lng() },
          zoom: state.map.getZoom()
        };
      }
      return {
        center: [center.lat, center.lng],
        zoom: state.map.getZoom()
      };
    }

    function restoreViewState(viewState, { animate = false } = {}) {
      if (!viewState) return;
      if (state.provider === 'maplibre') {
        return whenMapLibreReady(map => {
          const target = {
            center: [viewState.center.lng, viewState.center.lat],
            zoom: viewState.zoom
          };
          if (animate) map.easeTo({ ...target, duration: 320 });
          else map.jumpTo(target);
        });
      }
      ensure();
      if (state.provider === 'google') {
        if (animate) {
          state.map.panTo(viewState.center);
          state.map.setZoom(viewState.zoom);
        } else {
          state.map.setCenter(viewState.center);
          state.map.setZoom(viewState.zoom);
        }
        return;
      }
      if (animate) {
        state.map.setView(viewState.center, viewState.zoom, { animate: true, duration: 0.32 });
        return;
      }
      state.map.setView(viewState.center, viewState.zoom, { animate: false });
      state.map.invalidateSize({ pan: false });
    }

    /** Tell the map its container was resized (e.g. the Street View split). */
    function notifyResize() {
      if (state.provider === 'maplibre') return whenMapLibreReady(map => map.resize());
      if (!state.map) return;
      if (state.provider === 'google') {
        google.maps.event.trigger(state.map, 'resize');
        return;
      }
      state.map.invalidateSize({ pan: false });
    }

    function zoomIn() {
      if (state.provider === 'maplibre') return whenMapLibreReady(map => map.zoomIn());
      ensure();
      if (state.provider === 'google') state.map.setZoom(state.map.getZoom() + 1);
      else state.map.zoomIn();
    }

    function zoomOut() {
      if (state.provider === 'maplibre') return whenMapLibreReady(map => map.zoomOut());
      ensure();
      if (state.provider === 'google') state.map.setZoom(state.map.getZoom() - 1);
      else state.map.zoomOut();
    }

    function destroy() {
      state.destroyed = true;
      if (state.routeAnimationFrame) cancelAnimationFrame(state.routeAnimationFrame);
      clearStreetViewPosition();
      if ((state.provider === 'leaflet' || state.provider === 'maplibre') && state.map) {
        state.map.remove();
      }
      state.maplibreMarkers = [];
      state.maplibreVisuals = { routeA: [], routeB: [] };
      state.map = null;
      state.routeLayers = null;
      state.standardTiles = null;
      state.googleOverlays = [];
      state.googleHitAreas = [];
    }

    return {
      provider: state.provider,
      drawRoutes,
      fitRoutes,
      focusRoute,
      getRoutePointRect,
      getViewState,
      hasMap: () => !!state.map,
      notifyResize,
      restoreViewState,
      setStreetViewEnabled,
      setStreetViewPosition,
      setStreetViewHeading,
      clearStreetViewPosition,
      setRoutesVisible,
      zoomIn,
      zoomOut,
      destroy
    };
  }

  window.AriCalmBenchmarkMaps = {
    createMapAdapter,
    hasGoogleMaps,
    hasMapLibre,
    loadLivemapMapStyle
  };
})();
