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
      googleRouteVisuals: { routeA: [], routeB: [] },
      standardTiles: null,
      pair: null,
      assignment: null,
      streetHandlerBound: false
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

    function fitRoutes(fitPadding) {
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
      state.map.fitBounds(state.routeLayers.getBounds(), fitPadding.leaflet);
    }

    function isNearLeafletRoute(containerPoint) {
      if (!state.pair || !state.assignment) return false;
      const routes = [
        normalizeLatLngs(state.pair.routes[state.assignment.routeA].geometry),
        normalizeLatLngs(state.pair.routes[state.assignment.routeB].geometry)
      ];
      return routes.some(route => route.slice(1).some((point, index) => {
        const start = state.map.latLngToContainerPoint(route[index]);
        const end = state.map.latLngToContainerPoint(point);
        return pointToSegmentDistance(containerPoint, start, end) <= 32;
      }));
    }

    function isNearLatLngRoute(latLng) {
      if (!state.pair || !state.assignment) return false;
      const clickPoint = { x: latLng.lng, y: latLng.lat };
      const routes = [
        normalizeLatLngs(state.pair.routes[state.assignment.routeA].geometry).map(point => ({ x: point[1], y: point[0] })),
        normalizeLatLngs(state.pair.routes[state.assignment.routeB].geometry).map(point => ({ x: point[1], y: point[0] }))
      ];
      return routes.some(route => route.slice(1).some((point, index) => {
        return pointToSegmentDistance(clickPoint, route[index], point) <= 0.00055;
      }));
    }

    function bindRoutePointClicks() {
      if (state.streetHandlerBound) return;
      state.streetHandlerBound = true;
      if (state.provider === 'google') {
        state.map.addListener('click', event => {
          const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          if (isNearLatLngRoute(point)) state.onRoutePointClick(point);
        });
        return;
      }
      state.map.on('click', event => {
        if (isNearLeafletRoute(event.containerPoint)) {
          state.onRoutePointClick(event.latlng);
        }
      });
    }

    function drawGoogleRoutes(pair, assignment) {
      state.googleOverlays.forEach(overlay => overlay.setMap(null));
      state.googleOverlays = [];

      const routeA = normalizeLatLngs(pair.routes[assignment.routeA].geometry).map(toLatLngObject);
      const routeB = normalizeLatLngs(pair.routes[assignment.routeB].geometry).map(toLatLngObject);

      const routeACase = new google.maps.Polyline({
        path: routeA,
        map: state.map,
        strokeColor: '#ffffff',
        strokeOpacity: 0.82,
        strokeWeight: 15
      });
      const routeBCase = new google.maps.Polyline({
        path: routeB,
        map: state.map,
        strokeColor: '#ffffff',
        strokeOpacity: 0.82,
        strokeWeight: 15
      });
      const routeALine = new google.maps.Polyline({
        path: routeA,
        map: state.map,
        strokeColor: state.routeAColor,
        strokeOpacity: 0.98,
        strokeWeight: 9
      });
      const routeBLine = new google.maps.Polyline({
        path: routeB,
        map: state.map,
        strokeColor: state.routeBColor,
        strokeOpacity: 0.98,
        strokeWeight: 6
      });
      [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
        layer.__ariBaseWeight = layer.strokeWeight || 7;
        layer.__ariBaseOpacity = layer.strokeOpacity ?? 0.98;
        layer.addListener('click', event => {
          state.onRoutePointClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });
      });

      const startMarker = new google.maps.Marker({
        position: { lat: pair.origin.lat, lng: pair.origin.lng },
        map: state.map,
        title: 'Start',
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
      state.googleOverlays.push(routeACase, routeBCase, routeALine, routeBLine, startMarker, endMarker);
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
      [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
        layer.on('click', event => {
          state.onRoutePointClick(event.latlng);
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

    return {
      provider: state.provider,
      drawRoutes,
      fitRoutes,
      focusRoute,
      getRoutePointRect,
      hasMap: () => !!state.map,
      zoomIn,
      zoomOut
    };
  }

  window.AriCalmBenchmarkMaps = {
    createMapAdapter,
    hasGoogleMaps
  };
})();
