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

  function createMapAdapter(options) {
    const state = {
      canvas: options.canvas,
      provider: options.provider,
      routeAColor: options.routeAColor,
      routeBColor: options.routeBColor,
      maxFitZoom: options.maxFitZoom,
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
      streetViewMarker: null
    };

    function ensure() {
      if (state.map) return;
      if (state.provider === 'google') {
        state.map = new google.maps.Map(state.canvas, {
          center: { lat: 47.377, lng: 8.54 },
          zoom: 13,
          clickableIcons: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false,
          scaleControl: true,
          gestureHandling: 'greedy'
        });
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
      state.routeLayers = L.featureGroup().addTo(state.map);
    }

    function fitRoutes(fitPadding, { animate = true } = {}) {
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
      if (state.provider === 'google') return;
      state.map.on('click', event => {
        if (!state.streetViewEnabled) return;
        const nearest = getNearestLeafletRoute(event.containerPoint);
        if (!nearest) return;
        state.onRoutePointClick({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
          routeKey: nearest.routeKey
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
      ensure();
      bindRoutePointClicks();
      state.pair = pair;
      state.assignment = assignment;
      if (state.provider === 'google') drawGoogleRoutes(pair, assignment);
      else drawLeafletRoutes(pair, assignment);
    }

    function applyRouteVisibility(value) {
      state.routeVisibility = value;
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
      if (!state.streetViewMarker) return;
      if (state.provider === 'google') state.streetViewMarker.setMap(null);
      else state.streetViewMarker.remove();
      state.streetViewMarker = null;
    }

    function setStreetViewPosition(point, routeKey = 'routeA') {
      ensure();
      const color = routeKey === 'routeB' ? state.routeBColor : state.routeAColor;
      if (state.provider === 'google') {
        if (!state.streetViewMarker) {
          state.streetViewMarker = new google.maps.Marker({
            map: state.map,
            clickable: false,
            zIndex: 80,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }
          });
        }
        state.streetViewMarker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        });
        state.streetViewMarker.setPosition(point);
        state.streetViewMarker.setMap(state.map);
        return;
      }

      if (!state.streetViewMarker) {
        state.streetViewMarker = L.circleMarker([point.lat, point.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
          interactive: false
        }).addTo(state.map);
      } else {
        state.streetViewMarker.setLatLng([point.lat, point.lng]);
        state.streetViewMarker.setStyle({ fillColor: color });
      }
    }

    function getViewState() {
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

    function restoreViewState(viewState) {
      if (!viewState) return;
      ensure();
      if (state.provider === 'google') {
        state.map.setCenter(viewState.center);
        state.map.setZoom(viewState.zoom);
        return;
      }
      state.map.setView(viewState.center, viewState.zoom, { animate: false });
      state.map.invalidateSize({ pan: false });
    }

    function zoomIn() {
      ensure();
      if (state.provider === 'google') state.map.setZoom(state.map.getZoom() + 1);
      else state.map.zoomIn();
    }

    function zoomOut() {
      ensure();
      if (state.provider === 'google') state.map.setZoom(state.map.getZoom() - 1);
      else state.map.zoomOut();
    }

    function destroy() {
      if (state.routeAnimationFrame) cancelAnimationFrame(state.routeAnimationFrame);
      clearStreetViewPosition();
      if (state.provider === 'leaflet' && state.map) {
        state.map.remove();
      }
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
      restoreViewState,
      setStreetViewEnabled,
      setStreetViewPosition,
      clearStreetViewPosition,
      setRoutesVisible,
      zoomIn,
      zoomOut,
      destroy
    };
  }

  window.AriCalmBenchmarkMaps = {
    createMapAdapter,
    hasGoogleMaps
  };
})();
