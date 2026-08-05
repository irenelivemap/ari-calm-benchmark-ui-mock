(function () {
  const ROUTE_KEYS = ['routeA', 'routeB', 'routeC'];
  const routeOverlap = window.AriRouteOverlap;
  const mapLoading = window.AriMapLoading;

  function activeRouteKeys(assignment, pair = null) {
    return ROUTE_KEYS.filter(routeKey => {
      const routeType = assignment?.[routeKey];
      return routeType && (!pair || pair.routes?.[routeType]?.geometry);
    });
  }

  function routeSuffix(routeKey) {
    return routeKey.slice(-1).toLowerCase();
  }

  function normalizeLatLngs(geometry) {
    return geometry.map(point => Array.isArray(point) ? point : [point.lat, point.lng]);
  }

  function toLatLngObject(point) {
    return { lat: point[0], lng: point[1] };
  }

  function hasGoogleMaps() {
    return !!(window.google && window.google.maps);
  }

  function hasMapLibre() {
    return !!window.maplibregl;
  }

  const ENDPOINT_MARKERS = {
    start: {
      width: 28,
      height: 28,
      anchorX: 14,
      anchorY: 14,
      maplibreAnchor: 'center'
    },
    end: {
      width: 32,
      height: 42,
      anchorX: 16,
      anchorY: 40,
      maplibreAnchor: 'bottom'
    }
  };

  /**
   * Google-style neutral endpoint markers. The circular S identifies the
   * origin; the pointed D identifies the destination without borrowing the
   * blinded Route A/B/C identities.
   */
  function endpointMarkerSvg(kind) {
    const marker = ENDPOINT_MARKERS[kind];
    const shape = kind === 'end'
      ? '<path d="M16 40C13.6 35.8 3 24.3 3 16a13 13 0 1 1 26 0c0 8.3-10.6 19.8-13 24Z" fill="#101511" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>'
      : '<circle cx="14" cy="14" r="12.25" fill="#101511" stroke="#fff" stroke-width="2.5"/>';
    const textX = kind === 'end' ? 16 : 14;
    const textY = kind === 'end' ? 17 : 14;
    return [
      `<svg viewBox="0 0 ${marker.width} ${marker.height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
      shape,
      `<text x="${textX}" y="${textY}" dy=".35em" fill="#fff" font-family="Arial, sans-serif" font-size="11" font-weight="800" text-anchor="middle">${kind === 'end' ? 'D' : 'S'}</text>`,
      '</svg>'
    ].join('');
  }

  function createEndpointMarkerElement(kind) {
    const element = document.createElement('span');
    element.className = `ari-route-marker ari-route-marker--${kind}`;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', kind === 'end' ? 'Destination' : 'Start');
    element.innerHTML = endpointMarkerSvg(kind);
    return element;
  }

  function googleEndpointMarkerIcon(kind) {
    const marker = ENDPOINT_MARKERS[kind];
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(endpointMarkerSvg(kind))}`,
      scaledSize: new google.maps.Size(marker.width, marker.height),
      anchor: new google.maps.Point(marker.anchorX, marker.anchorY)
    };
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

  const ZURICH_CENTER = [8.54, 47.377];

  function safeMapErrorMessage(error) {
    return String(error?.message || error || 'Unknown map error')
      .replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]');
  }

  function createMapAdapter(options) {
    const state = {
      canvas: options.canvas,
      provider: options.provider,
      routeAColor: options.routeAColor,
      routeBColor: options.routeBColor,
      routeCColor: options.routeCColor,
      maxFitZoom: options.maxFitZoom,
      toolsElement: options.toolsElement || null,
      onRoutePointClick: options.onRoutePointClick,
      map: null,
      routeLayers: null,
      routeVisuals: {},
      googleOverlays: [],
      googleHitAreas: [],
      googleRouteVisuals: {},
      routeVisibility: 1,
      selectedRouteKeys: [],
      focusedRouteKey: null,
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
      mapTilerKey: options.mapTilerKey || '',
      mapLoadTimeoutMs: options.mapLoadTimeoutMs || mapLoading?.DEFAULT_MAP_LOAD_TIMEOUT_MS || 8000,
      requestedProvider: options.provider,
      onMapStatus: typeof options.onMapStatus === 'function' ? options.onMapStatus : null,
      mapSource: null,
      destroyed: false,
      maplibreInit: null,
      maplibreQueue: null,
      maplibreVisuals: {},
      maplibreMarkers: [],
      leafletTilesReady: null
    };

    function notifyMapStatus(status, details = {}) {
      state.onMapStatus?.({ status, provider: state.provider, ...details });
    }

    async function createMapLibreMap() {
      if (!mapLoading) throw new Error('AriCalmBenchmarkMaps requires src/maps/map-loading.js.');
      notifyMapStatus('loading');
      try {
        const result = await mapLoading.createMapWithStyleFallback({
          MapClass: maplibregl.Map,
          mapOptions: {
            container: state.canvas,
            center: ZURICH_CENTER,
            zoom: 13,
            attributionControl: { compact: true }
          },
          candidates: mapLoading.mapStyleCandidates({
            mapTilerKey: state.mapTilerKey,
            variant: state.mapStyleVariant
          }),
          timeoutMs: state.mapLoadTimeoutMs,
          onAttemptFailure(candidate, error) {
            console.warn(`[ARI map] ${candidate.id} startup failed; trying the next map source. ${safeMapErrorMessage(error)}`);
          }
        });
        if (state.destroyed) {
          result.map.remove();
          return;
        }
        if (state.toolsElement) {
          result.map.addControl({
            onAdd() {
              state.toolsElement.classList.add('maplibregl-ctrl');
              return state.toolsElement;
            },
            onRemove() {}
          }, 'top-right');
        }
        state.map = result.map;
        state.mapSource = result.source;
        notifyMapStatus('ready', { source: result.source });
      } catch (error) {
        if (state.destroyed) return;
        if (window.L) {
          console.warn(`[ARI map] WebGL map unavailable; using the Leaflet fallback. ${safeMapErrorMessage(error?.cause || error)}`);
          state.provider = 'leaflet';
          try {
            ensure();
            await state.leafletTilesReady;
            if (state.destroyed) return;
            bindRoutePointClicks();
            if (state.pair && state.assignment) drawLeafletRoutes(state.pair, state.assignment);
            state.mapSource = 'leaflet';
            notifyMapStatus('ready', { source: 'leaflet', degraded: true });
            return;
          } catch (leafletError) {
            try { state.map?.remove(); } catch (_) {}
            state.map = null;
            state.standardTiles = null;
            state.leafletTilesReady = null;
            notifyMapStatus('error', { error: leafletError });
            throw leafletError;
          }
        }
        notifyMapStatus('error', { error: new Error('The map could not be loaded.') });
        throw error;
      }
    }

    /** Serialize MapLibre work behind the async style/map bootstrap. */
    function whenMapLibreReady(run) {
      if (!state.maplibreInit) {
        state.maplibreInit = createMapLibreMap();
        state.maplibreQueue = state.maplibreInit;
      }
      state.maplibreQueue = state.maplibreQueue
        .then(() => (state.provider === 'maplibre' && state.map && !state.destroyed ? run(state.map) : undefined))
        .catch(error => console.warn(`[ARI map] ${safeMapErrorMessage(error)}`));
      return state.maplibreQueue;
    }

    function retry() {
      if (state.destroyed || state.requestedProvider !== 'maplibre') return Promise.resolve();
      try { state.map?.remove(); } catch (_) {}
      state.toolsElement?.classList.remove('maplibregl-ctrl');
      state.canvas.replaceChildren();
      state.provider = 'maplibre';
      state.map = null;
      state.mapSource = null;
      state.routeLayers = null;
      state.standardTiles = null;
      state.maplibreInit = null;
      state.maplibreQueue = null;
      state.maplibreMarkers = [];
      state.maplibreVisuals = {};
      state.leafletTilesReady = null;
      notifyMapStatus('loading');
      if (!state.pair || !state.assignment) return Promise.resolve();
      return drawRoutes(state.pair, state.assignment);
    }

    function routeColor(routeKey) {
      if (routeKey === 'routeB') return state.routeBColor;
      if (routeKey === 'routeC') return state.routeCColor;
      return state.routeAColor;
    }

    function routeLineWidth() {
      return 4;
    }

    function routeCaseWidth() {
      return 7;
    }

    function routeCaseOpacity() {
      return 0.72;
    }

    function routeGeometries() {
      if (!state.pair || !state.assignment) return {};
      return Object.fromEntries(activeRouteKeys(state.assignment).map(routeKey => [
        routeKey,
        normalizeLatLngs(state.pair.routes[state.assignment[routeKey]].geometry)
      ]));
    }

    function resolveRoutePoint(point, routeKey = null) {
      const selected = routeOverlap?.resolveStreetViewPoint?.(
        routeGeometries(),
        point,
        { routeKey }
      ) || (
        point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))
          ? { lat: Number(point.lat), lng: Number(point.lng), routeKey: null }
          : null
      );
      if (!selected) return null;
      state.onRoutePointClick?.(selected);
      return selected;
    }

    function providerFanoutRuns(routeKeys, geometries) {
      const fanout = routeOverlap?.buildFanoutRuns
        ? routeOverlap.buildFanoutRuns(geometries, {
            routeOrder: routeKeys,
            spacing: 1.25,
            precision: 6
          })
        : {
            routes: Object.fromEntries(routeKeys.map(routeKey => [
              routeKey,
              [{ geometry: geometries[routeKey], offset: 0, sharedCount: 1 }]
            ]))
          };
      return Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        fanout.routes[routeKey].map(run => ({
          ...run,
          geometry: routeOverlap?.offsetGeometry
            ? routeOverlap.offsetGeometry(run.geometry, run.offset)
            : run.geometry
        }))
      ]));
    }

    function maplibreRouteLayers(assignment, pair) {
      const routeKeys = activeRouteKeys(assignment, pair);
      return [
        ...routeKeys.map(route => ({
          id: `ari-route-${routeSuffix(route)}-case`,
          route,
          kind: 'case',
          color: '#ffffff',
          width: routeCaseWidth(routeKeys.length),
          opacity: routeCaseOpacity(routeKeys.length)
        })),
        ...routeKeys.map(route => ({
          id: `ari-route-${routeSuffix(route)}-line`,
          route,
          kind: 'line',
          width: routeLineWidth(route, routeKeys.length),
          opacity: 0.98
        })),
        ...routeKeys.map(route => ({
          id: `ari-route-${routeSuffix(route)}-hit`,
          route,
          kind: 'hit',
          width: 32,
          opacity: 0.01
        }))
      ];
    }

    function maplibreRouteSourceId(routeKey) {
      return `ari-route-${routeSuffix(routeKey)}`;
    }

    function maplibreLineData(runs) {
      return {
        type: 'FeatureCollection',
        features: runs.map(run => ({
          type: 'Feature',
          properties: {
            offset: run.offset,
            sharedCount: run.sharedCount
          },
          geometry: {
            type: 'LineString',
            coordinates: run.geometry.map(point => [point[1], point[0]])
          }
        }))
      };
    }

    function createMaplibreEndpointMarker(map, lngLat, kind) {
      const element = createEndpointMarkerElement(kind);
      const marker = new maplibregl.Marker({
        element,
        anchor: ENDPOINT_MARKERS[kind].maplibreAnchor
      }).setLngLat(lngLat).addTo(map);
      element.setAttribute('aria-label', kind === 'end' ? 'Destination' : 'Start');
      element.setAttribute('title', kind === 'end' ? 'Destination' : 'Start');
      state.maplibreMarkers.push(marker);
      return marker;
    }

    function drawMaplibreRoutes(map, pair, assignment) {
      if (!state.streetHandlerBound) {
        state.streetHandlerBound = true;
        map.on('click', event => {
          if (!state.streetViewEnabled) return;
          const hitLayers = activeRouteKeys(state.assignment)
            .map(routeKey => `ari-route-${routeSuffix(routeKey)}-hit`)
            .filter(id => map.getLayer(id));
          const feature = hitLayers.length
            ? map.queryRenderedFeatures(event.point, { layers: hitLayers })[0]
            : null;
          const routeKey = feature
            ? ROUTE_KEYS.find(key => feature.layer.id === `ari-route-${routeSuffix(key)}-hit`) || null
            : null;
          resolveRoutePoint({
            lat: event.lngLat.lat,
            lng: event.lngLat.lng
          }, routeKey);
        });
      }
      const routeKeys = activeRouteKeys(assignment, pair);
      ROUTE_KEYS.filter(routeKey => !routeKeys.includes(routeKey)).forEach(routeKey => {
        ['case', 'line', 'hit'].forEach(kind => {
          const layerId = `ari-route-${routeSuffix(routeKey)}-${kind}`;
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });
        const sourceId = maplibreRouteSourceId(routeKey);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
      const routeGeometries = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        normalizeLatLngs(pair.routes[assignment[routeKey]].geometry)
      ]));
      const fanout = routeOverlap?.buildFanoutRuns
        ? routeOverlap.buildFanoutRuns(routeGeometries, {
            routeOrder: routeKeys,
            spacing: 5,
            precision: 6
          })
        : {
            routes: Object.fromEntries(routeKeys.map(routeKey => [
              routeKey,
              [{ geometry: routeGeometries[routeKey], offset: 0, sharedCount: 1 }]
            ]))
          };
      const dataByRoute = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        maplibreLineData(fanout.routes[routeKey])
      ]));

      routeKeys.forEach(routeKey => {
        const sourceId = maplibreRouteSourceId(routeKey);
        const source = map.getSource(sourceId);
        if (source) source.setData(dataByRoute[routeKey]);
        else map.addSource(sourceId, { type: 'geojson', data: dataByRoute[routeKey] });
      });

      state.maplibreVisuals = Object.fromEntries(routeKeys.map(routeKey => [routeKey, []]));
      maplibreRouteLayers(assignment, pair).forEach(layer => {
        const color = layer.color || routeColor(layer.route);
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            id: layer.id,
            type: 'line',
            source: maplibreRouteSourceId(layer.route),
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': color,
              'line-width': layer.width,
              'line-offset': layer.kind === 'hit' ? 0 : ['get', 'offset'],
              'line-opacity': layer.opacity * (layer.kind === 'hit' ? 1 : state.routeVisibility)
            }
          });
        } else {
          map.setPaintProperty(layer.id, 'line-color', color);
          map.setPaintProperty(layer.id, 'line-width', layer.width);
          map.setPaintProperty(
            layer.id,
            'line-opacity',
            layer.opacity * (layer.kind === 'hit' ? 1 : state.routeVisibility)
          );
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
      activeRouteKeys(state.assignment, state.pair).map(routeKey => state.assignment[routeKey]).forEach(routeType => {
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
          cameraControl: false,
          scaleControl: true,
          gestureHandling: 'greedy'
        });
        if (state.toolsElement) {
          // The benchmark owns one provider-neutral control stack, including
          // zoom, so every action remains precisely aligned.
          state.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(state.toolsElement);
        }
        return;
      }

      state.standardTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      });
      state.leafletTilesReady = mapLoading?.waitForLeafletTiles
        ? mapLoading.waitForLeafletTiles(state.standardTiles, { timeoutMs: state.mapLoadTimeoutMs })
        : Promise.resolve(state.standardTiles);
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

    function bindRoutePointClicks() {
      if (state.streetHandlerBound) return;
      state.streetHandlerBound = true;
      if (state.provider === 'google') {
        // Route hit-area polylines swallow their own clicks, so this fires
        // only for points away from both routes.
        state.map.addListener('click', event => {
          if (!state.streetViewEnabled || !event.latLng) return;
          resolveRoutePoint({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        });
        return;
      }
      state.map.on('click', event => {
        if (!state.streetViewEnabled) return;
        resolveRoutePoint({
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      });
    }

    function drawGoogleRoutes(pair, assignment) {
      state.googleOverlays.forEach(overlay => overlay.setMap(null));
      state.googleOverlays = [];
      state.googleHitAreas = [];
      const routeKeys = activeRouteKeys(assignment, pair);
      const routeGeometriesByKey = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        normalizeLatLngs(pair.routes[assignment[routeKey]].geometry)
      ]));
      const routePaths = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        routeGeometriesByKey[routeKey].map(toLatLngObject)
      ]));
      const fanoutRuns = providerFanoutRuns(routeKeys, routeGeometriesByKey);
      state.googleRouteVisuals = Object.fromEntries(routeKeys.map(routeKey => [routeKey, []]));

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
          resolveRoutePoint({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          }, routeKey);
        });
        return hitArea;
      }

      routeKeys.forEach(routeKey => {
        const caseWeight = routeCaseWidth(routeKeys.length);
        const caseOpacity = routeCaseOpacity(routeKeys.length);
        const routeVisuals = [];
        fanoutRuns[routeKey].forEach(run => {
          const path = run.geometry.map(toLatLngObject);
          const caseLayer = new google.maps.Polyline({
            path,
            map: state.map,
            strokeColor: '#ffffff',
            strokeOpacity: caseOpacity,
            strokeWeight: caseWeight,
            clickable: false,
            zIndex: 10
          });
          const routeLayer = new google.maps.Polyline({
            path,
            map: state.map,
            strokeColor: routeColor(routeKey),
            strokeOpacity: 0.98,
            strokeWeight: routeLineWidth(routeKey, routeKeys.length),
            clickable: false,
            zIndex: 20
          });
          caseLayer.__ariBaseWeight = caseWeight;
          caseLayer.__ariBaseOpacity = caseOpacity;
          routeLayer.__ariBaseWeight = routeLineWidth(routeKey, routeKeys.length);
          routeLayer.__ariBaseOpacity = 0.98;
          routeVisuals.push(caseLayer, routeLayer);
          state.googleOverlays.push(caseLayer, routeLayer);
        });
        const hitArea = createStreetHitArea(routePaths[routeKey], routeKey, routeColor(routeKey));
        state.googleRouteVisuals[routeKey] = routeVisuals;
        state.googleHitAreas.push(hitArea);
        state.googleOverlays.push(hitArea);
      });

      const startMarker = new google.maps.Marker({
        position: { lat: pair.origin.lat, lng: pair.origin.lng },
        map: state.map,
        title: 'Start',
        clickable: false,
        icon: googleEndpointMarkerIcon('start')
      });
      const endMarker = new google.maps.Marker({
        position: { lat: pair.destination.lat, lng: pair.destination.lng },
        map: state.map,
        title: 'Destination',
        clickable: false,
        icon: googleEndpointMarkerIcon('end')
      });

      state.googleOverlays.push(startMarker, endMarker);
      applyRouteVisibility(state.routeVisibility);
    }

    function drawLeafletRoutes(pair, assignment) {
      state.routeLayers.clearLayers();

      const startMarker = ENDPOINT_MARKERS.start;
      const endMarker = ENDPOINT_MARKERS.end;
      const startIcon = L.divIcon({
        className: '',
        html: createEndpointMarkerElement('start').outerHTML,
        iconSize: [startMarker.width, startMarker.height],
        iconAnchor: [startMarker.anchorX, startMarker.anchorY]
      });
      const endIcon = L.divIcon({
        className: '',
        html: createEndpointMarkerElement('end').outerHTML,
        iconSize: [endMarker.width, endMarker.height],
        iconAnchor: [endMarker.anchorX, endMarker.anchorY]
      });

      const routeKeys = activeRouteKeys(assignment, pair);
      const routeGeometries = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        normalizeLatLngs(pair.routes[assignment[routeKey]].geometry)
      ]));
      const fanoutRuns = providerFanoutRuns(routeKeys, routeGeometries);
      const routeCases = Object.fromEntries(routeKeys.map(routeKey => [
        routeKey,
        fanoutRuns[routeKey].map(run => L.polyline(run.geometry, {
          color: '#ffffff',
          weight: routeCaseWidth(routeKeys.length),
          opacity: routeCaseOpacity(routeKeys.length),
          lineCap: 'round',
          lineJoin: 'round',
          __ariBaseWeight: routeCaseWidth(routeKeys.length),
          __ariBaseOpacity: routeCaseOpacity(routeKeys.length)
        }).addTo(state.routeLayers))
      ]));
      const routeLines = Object.fromEntries(routeKeys.map(routeKey => {
        const weight = routeLineWidth(routeKey, routeKeys.length);
        return [
          routeKey,
          fanoutRuns[routeKey].map(run => L.polyline(run.geometry, {
            color: routeColor(routeKey),
            weight,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
            __ariBaseWeight: weight,
            __ariBaseOpacity: 0.98
          }).addTo(state.routeLayers))
        ];
      }));
      const hitAreas = routeKeys.map(routeKey => ({
        routeKey,
        layer: L.polyline(routeGeometries[routeKey], {
          color: routeColor(routeKey),
          weight: 32,
          opacity: 0.01,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'ari-street-hit-area',
          bubblingMouseEvents: false
        }).addTo(state.routeLayers)
      }));
      hitAreas.forEach(({ layer, routeKey }) => {
        layer.on('click', event => {
          if (!state.streetViewEnabled) return;
          resolveRoutePoint({
            lat: event.latlng.lat,
            lng: event.latlng.lng
          }, routeKey);
        });
      });
      state.routeVisuals = Object.fromEntries(
        routeKeys.map(routeKey => [routeKey, [...routeCases[routeKey], ...routeLines[routeKey]]])
      );
      L.marker([pair.origin.lat, pair.origin.lng], { icon: startIcon, keyboard: false }).addTo(state.routeLayers);
      L.marker([pair.destination.lat, pair.destination.lng], { icon: endIcon, keyboard: false }).addTo(state.routeLayers);
      applyRouteVisibility(state.routeVisibility);
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
      const clampedValue = Math.min(1, Math.max(0, Number(value) || 0));
      state.routeVisibility = clampedValue;
      applyRouteEmphasis();
      if (state.provider === 'maplibre') {
        if (!state.map) return;
        state.maplibreMarkers.forEach(marker => {
          marker.getElement().style.opacity = String(clampedValue);
        });
        return;
      }
      if (state.provider === 'google') {
        state.googleOverlays.forEach(overlay => {
          if (!overlay.getPath && typeof overlay.setOpacity === 'function') overlay.setOpacity(clampedValue);
        });
        return;
      }

      state.routeLayers?.eachLayer(layer => {
        const element = typeof layer.getElement === 'function' ? layer.getElement() : null;
        if (element) element.style.opacity = String(clampedValue);
        else if (typeof layer.setOpacity === 'function') layer.setOpacity(clampedValue);
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

    function getRepresentativeRoutePoint(routeKey) {
      if (!state.pair || !state.assignment?.[routeKey]) return null;
      const route = state.pair.routes?.[state.assignment[routeKey]];
      if (!route?.geometry) return null;
      const geometry = normalizeLatLngs(route.geometry);
      const point = geometry[Math.floor(geometry.length / 2)];
      return point ? { lat: point[0], lng: point[1], routeKey } : null;
    }

    function routeEmphasisConfig() {
      const routeKeys = activeRouteKeys(state.assignment, state.pair);
      const selected = new Set(state.selectedRouteKeys.filter(key => routeKeys.includes(key)));
      const focused = routeKeys.includes(state.focusedRouteKey) ? state.focusedRouteKey : null;
      return Object.fromEntries(routeKeys.map(key => {
        const isSelected = selected.has(key);
        const isFocused = focused === key;
        let opacityFactor = selected.size && !isSelected ? 0.5 : 1;
        let weightBoost = selected.size && !isSelected ? -1 : 0;

        if (isFocused) {
          opacityFactor = 1;
          weightBoost = 2;
        } else if (focused && !selected.size) {
          opacityFactor = 0.62;
          weightBoost = -1;
        }

        return [key, { opacityFactor, weightBoost }];
      }));
    }

    function applyRouteEmphasis() {
      const configByRoute = routeEmphasisConfig();

      if (state.provider === 'maplibre') {
        if (!state.map) return;
        Object.entries(state.maplibreVisuals).forEach(([key, layers]) => {
          const config = configByRoute[key];
          if (!config) return;
          layers.forEach(({ id, baseWidth, baseOpacity }) => {
            if (!state.map.getLayer(id)) return;
            state.map.setPaintProperty(
              id,
              'line-opacity',
              baseOpacity * config.opacityFactor * state.routeVisibility
            );
            state.map.setPaintProperty(id, 'line-width', Math.max(4, baseWidth + config.weightBoost));
          });
        });
        return;
      }

      if (state.provider === 'google') {
        Object.entries(state.googleRouteVisuals).forEach(([key, layers]) => {
          const config = configByRoute[key];
          if (!config) return;
          layers.forEach(layer => {
            const baseWeight = layer.__ariBaseWeight || 7;
            const baseOpacity = layer.__ariBaseOpacity ?? 0.98;
            layer.setOptions({
              strokeOpacity: baseOpacity * config.opacityFactor * state.routeVisibility,
              strokeWeight: Math.max(4, baseWeight + config.weightBoost)
            });
          });
        });
        return;
      }

      Object.entries(state.routeVisuals).forEach(([key, layers]) => {
        const config = configByRoute[key];
        if (!config) return;
        layers.forEach(layer => {
          const baseWeight = layer.options.__ariBaseWeight || layer.options.weight || 7;
          const baseOpacity = layer.options.__ariBaseOpacity ?? layer.options.opacity ?? 0.98;
          layer.setStyle({
            opacity: baseOpacity * config.opacityFactor,
            weight: Math.max(4, baseWeight + config.weightBoost)
          });
        });
      });
    }

    function focusRoute(routeKey) {
      state.focusedRouteKey = routeKey || null;
      applyRouteEmphasis();
    }

    function setSelectedRoutes(routeKeys = []) {
      const activeKeys = activeRouteKeys(state.assignment, state.pair);
      state.selectedRouteKeys = [...new Set(routeKeys)].filter(key => activeKeys.includes(key));
      applyRouteEmphasis();
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
        : routeKey === 'routeC' ? state.routeCColor
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
      state.maplibreVisuals = {};
      state.map = null;
      state.routeLayers = null;
      state.standardTiles = null;
      state.googleOverlays = [];
      state.googleHitAreas = [];
    }

    return {
      get provider() { return state.provider; },
      drawRoutes,
      fitRoutes,
      focusRoute,
      getRoutePointRect,
      getRepresentativeRoutePoint,
      getViewState,
      hasMap: () => !!state.map,
      notifyResize,
      restoreViewState,
      retry,
      setSelectedRoutes,
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
    hasMapLibre
  };
})();
