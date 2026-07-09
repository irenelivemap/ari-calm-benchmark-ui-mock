(function () {
  const DEFAULT_TOTAL_ROUNDS = 10;
  const ROUTE_FIT_MAX_ZOOM = 19;

  const demoPairs = [
    {
      pairId: 'zurich-limmat-evening-01',
      scenario: 'An evening walk home along the Limmat, no particular rush.',
      origin: { lat: 47.37818, lng: 8.54018, label: 'Zuerich HB' },
      destination: { lat: 47.36665, lng: 8.54437, label: 'Bellevue' },
      routes: {
        fast: {
          routeId: 'fast-demo-01',
          geometry: [
            [47.37818, 8.54018], [47.37692, 8.54072], [47.37573, 8.54122],
            [47.37452, 8.54175], [47.37319, 8.54222], [47.37184, 8.54282],
            [47.37038, 8.54334], [47.36884, 8.54386], [47.36665, 8.54437]
          ]
        },
        calm: {
          routeId: 'calm-demo-01',
          geometry: [
            [47.37818, 8.54018], [47.37742, 8.53874], [47.37618, 8.53762],
            [47.37476, 8.53712], [47.37322, 8.53756], [47.37186, 8.53874],
            [47.37054, 8.54022], [47.36921, 8.54146], [47.36786, 8.54274],
            [47.36665, 8.54437]
          ]
        }
      }
    }
  ];

  const routeAColor = '#C84720';
  const routeBColor = '#08784D';

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function randomAssignment() {
    return Math.random() >= 0.5
      ? { routeA: 'fast', routeB: 'calm' }
      : { routeA: 'calm', routeB: 'fast' };
  }

  function normalizeLatLngs(geometry) {
    return geometry.map(point => Array.isArray(point) ? point : [point.lat, point.lng]);
  }

  function mockRoutePairProvider({ roundIndex }) {
    const base = demoPairs[roundIndex % demoPairs.length];
    return Promise.resolve({
      ...base,
      pairId: `${base.pairId}-round-${roundIndex + 1}`
    });
  }

  function consoleAnswerSink(answer) {
    console.info('[ARI calm benchmark answer]', answer);
    return Promise.resolve();
  }

  function consoleProgressSink(progress) {
    console.info('[ARI calm benchmark progress]', progress);
    return Promise.resolve();
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

  function buildShell(root, totalRounds) {
    root.innerHTML = `
      <section class="ari-benchmark" aria-label="ARI calm route benchmark">
        <header class="ari-benchmark__top">
          <div class="ari-benchmark__round">
            <button class="ari-btn ari-btn--secondary" data-action="exit" type="button">Exit test</button>
            <span class="ari-round-chip">Round <b data-round-current>1</b> / <span data-round-total>${totalRounds}</span></span>
          </div>
          <div class="ari-pips" data-pips></div>
        </header>

        <main class="ari-benchmark__grid">
          <section class="ari-map-card" aria-label="Route map">
            <div class="ari-map" data-map>
              <div class="ari-map__canvas" data-map-canvas aria-label="Interactive route comparison map"></div>
              <div class="ari-map__zoom" aria-label="Map zoom controls">
                <button data-action="zoom-in" type="button" aria-label="Zoom in">+</button>
                <button data-action="zoom-out" type="button" aria-label="Zoom out">-</button>
              </div>
              <div class="ari-map__tools" aria-label="Map tools">
                <button class="ari-icon-btn ari-icon-btn--fit" data-action="fit-routes" type="button" aria-label="Fit routes" title="Fit routes"><span aria-hidden="true"></span></button>
              </div>
              <div class="ari-street-card" data-street-card hidden>
                <button data-action="open-street-view" type="button">Open Street View</button>
                <button data-action="close-street-view" type="button" aria-label="Close Street View prompt">x</button>
              </div>
            </div>
          </section>

          <aside class="ari-question-card" aria-label="Benchmark questions" data-question-card>
            <button class="ari-panel-toggle" data-action="toggle-panel" type="button" aria-expanded="true" aria-label="Minimize question panel" title="Minimize question panel"></button>
            <div class="ari-panel-summary" data-panel-summary>
              <span data-panel-step>Q1</span>
              <b data-panel-question>Which route would you choose for this calm walk?</b>
            </div>
            <form class="ari-question-stack" data-form>
              <section class="ari-question-block" data-q1>
                <div class="ari-kicker">Q1</div>
                <fieldset>
                  <legend>Which route would you choose for this calm walk?</legend>
                  <details class="ari-context-details">
                    <summary>Calm walk context</summary>
                    <p>Imagine you are walking somewhere in the city. You are not rushing, and the walking experience matters more than arriving as fast as possible.</p>
                    <p><b>Situation:</b> <span data-round-scenario></span></p>
                  </details>
                  <div class="ari-choice-grid ari-choice-grid--two">
                    <label class="ari-choice--route-a"><input type="radio" name="q1Choice" value="route_a">Route A</label>
                    <label class="ari-choice--route-b"><input type="radio" name="q1Choice" value="route_b">Route B</label>
                    <label><input type="radio" name="q1Choice" value="either">Either one would be fine</label>
                    <label><input type="radio" name="q1Choice" value="neither">I would choose neither</label>
                    <label><input type="radio" name="q1Choice" value="hard_to_judge">Hard to judge from the map</label>
                  </div>
                </fieldset>
              </section>

              <section class="ari-question-block" data-q2 hidden>
                <div class="ari-kicker">Q2</div>
                <fieldset>
                  <legend>Is it worth showing both routes as separate options, one Fast and one Calm?</legend>
                  <div class="ari-choice-grid">
                    <label><input type="radio" name="q2Separate" value="yes">Yes</label>
                    <label><input type="radio" name="q2Separate" value="no">No</label>
                    <label><input type="radio" name="q2Separate" value="not_sure">Not sure</label>
                  </div>
                </fieldset>
              </section>

              <section class="ari-question-block" data-q3 hidden>
                <div class="ari-kicker">Q3</div>
                <fieldset>
                  <legend>What made one or both routes less suitable for this calm situation?</legend>
                  <div class="ari-choice-grid">
                    <label><input type="checkbox" name="q3Issues" value="no_issue">No issue</label>
                    <label><input type="checkbox" name="q3Issues" value="not_calm_enough">Not calm enough</label>
                    <label><input type="checkbox" name="q3Issues" value="too_similar">Too similar</label>
                    <label><input type="checkbox" name="q3Issues" value="extra_time_distance_not_worth_it">Extra time/distance not worth it</label>
                    <label><input type="checkbox" name="q3Issues" value="too_busy">Too busy</label>
                    <label><input type="checkbox" name="q3Issues" value="not_enough_greenery_water">Not enough greenery or water</label>
                    <label><input type="checkbox" name="q3Issues" value="not_pleasant_interesting">Not pleasant or interesting enough</label>
                    <label><input type="checkbox" name="q3Issues" value="too_complex">Too complex to follow</label>
                    <label><input type="checkbox" name="q3Issues" value="not_comfortable">Not comfortable to walk</label>
                    <label><input type="checkbox" name="q3Issues" value="better_route_missing">Better route seems missing</label>
                    <label><input type="checkbox" name="q3Issues" value="need_more_information">Need more information</label>
                    <label><input type="checkbox" name="q3Issues" value="other">Other</label>
                  </div>
                  <textarea name="q3Note" placeholder="Tell us more"></textarea>
                </fieldset>
              </section>

              <div class="ari-actions">
                <button class="ari-btn ari-btn--secondary" data-action="previous" type="button">Back</button>
                <button class="ari-btn ari-btn--primary" data-submit type="submit" disabled>Next question →</button>
              </div>
            </form>
          </aside>
        </main>

        <section class="ari-onboarding" data-onboarding aria-label="Before you start">
          <div class="ari-onboarding__spotlight" data-onboarding-spotlight aria-hidden="true"></div>
          <div class="ari-onboarding__coach" role="dialog" aria-labelledby="ari-onboarding-title" aria-describedby="ari-onboarding-copy">
            <div class="ari-onboarding__top">
              <div class="ari-kicker" data-onboarding-count>1 / 4</div>
              <button class="ari-onboarding__close" data-action="skip-onboarding" type="button" aria-label="Close onboarding" title="Close onboarding">×</button>
            </div>
            <h2 id="ari-onboarding-title" data-onboarding-title>Zoom in or out.</h2>
            <p id="ari-onboarding-copy" data-onboarding-copy>Use + and - when you need to inspect streets more closely.</p>
            <div class="ari-onboarding__actions">
              <button class="ari-onboarding__back" data-action="previous-onboarding" type="button">Back</button>
              <button class="ari-btn ari-btn--primary" data-action="next-onboarding" type="button">OK</button>
            </div>
          </div>
        </section>

        <section class="ari-exit-confirm" data-exit-confirm hidden aria-label="Exit confirmation">
          <div class="ari-exit-confirm__panel">
            <div class="ari-kicker">Exit test</div>
            <h2>Leave this session?</h2>
            <p data-exit-copy>Completed rounds already submitted will stay submitted. This round has not been submitted yet.</p>
            <div class="ari-exit-confirm__actions">
              <button class="ari-btn ari-btn--secondary" data-action="keep-testing" type="button">Keep testing</button>
              <button class="ari-btn ari-btn--secondary" data-action="leave-without-saving" type="button">Leave without saving</button>
              <button class="ari-btn ari-btn--primary" data-action="save-progress" type="button">Save progress</button>
            </div>
          </div>
        </section>
      </section>
    `;
  }

  function mount(root, options = {}) {
    const requestedProvider = options.mapProvider || 'leaflet';
    const useGoogleMaps = requestedProvider === 'google' && hasGoogleMaps();
    if (!useGoogleMaps && !window.L) {
      throw new Error('AriCalmBenchmark requires Leaflet on window.L, or Google Maps on window.google.maps, before mounting.');
    }

    const state = {
      sessionId: options.sessionId || createId('calm-session'),
      participantName: options.participantName || '',
      roundIndex: options.initialRoundIndex || 0,
      totalRounds: options.totalRounds || DEFAULT_TOTAL_ROUNDS,
      pair: null,
      assignment: null,
      questionStep: 'q1',
      onboardingComplete: false,
      onboardingStepIndex: 0,
      completedRounds: 0,
      panelCollapsed: false,
      map: null,
      routeLayers: null,
      routeVisuals: { routeA: [], routeB: [] },
      googleOverlays: [],
      googleRouteVisuals: { routeA: [], routeB: [] },
      standardTiles: null,
      mapProvider: useGoogleMaps ? 'google' : 'leaflet'
    };

    const routePairProvider = options.routePairProvider || mockRoutePairProvider;
    const answerSink = options.answerSink || consoleAnswerSink;
    const progressSink = options.progressSink || consoleProgressSink;
    const onExit = typeof options.onExit === 'function' ? options.onExit : null;

    buildShell(root, state.totalRounds);

    const els = {
      currentRound: root.querySelector('[data-round-current]'),
      pips: root.querySelector('[data-pips]'),
      mapCanvas: root.querySelector('[data-map-canvas]'),
      onboarding: root.querySelector('[data-onboarding]'),
      onboardingSpotlight: root.querySelector('[data-onboarding-spotlight]'),
      onboardingCoach: root.querySelector('.ari-onboarding__coach'),
      onboardingCount: root.querySelector('[data-onboarding-count]'),
      onboardingTitle: root.querySelector('[data-onboarding-title]'),
      onboardingCopy: root.querySelector('[data-onboarding-copy]'),
      skipOnboarding: root.querySelector('[data-action="skip-onboarding"]'),
      previousOnboarding: root.querySelector('[data-action="previous-onboarding"]'),
      nextOnboarding: root.querySelector('[data-action="next-onboarding"]'),
      exitConfirm: root.querySelector('[data-exit-confirm]'),
      exitCopy: root.querySelector('[data-exit-copy]'),
      keepTesting: root.querySelector('[data-action="keep-testing"]'),
      questionCard: root.querySelector('[data-question-card]'),
      panelToggle: root.querySelector('[data-action="toggle-panel"]'),
      panelStep: root.querySelector('[data-panel-step]'),
      panelQuestion: root.querySelector('[data-panel-question]'),
      form: root.querySelector('[data-form]'),
      q1: root.querySelector('[data-q1]'),
      q2: root.querySelector('[data-q2]'),
      q3: root.querySelector('[data-q3]'),
      scenario: root.querySelector('[data-round-scenario]'),
      submit: root.querySelector('[data-submit]'),
      exit: root.querySelector('[data-action="exit"]'),
      previous: root.querySelector('[data-action="previous"]'),
      zoomIn: root.querySelector('[data-action="zoom-in"]'),
      zoomOut: root.querySelector('[data-action="zoom-out"]'),
      fitRoutes: root.querySelector('[data-action="fit-routes"]'),
      streetCard: root.querySelector('[data-street-card]'),
      openStreetView: root.querySelector('[data-action="open-street-view"]'),
      closeStreetView: root.querySelector('[data-action="close-street-view"]'),
      leaveWithoutSaving: root.querySelector('[data-action="leave-without-saving"]'),
      saveProgress: root.querySelector('[data-action="save-progress"]')
    };

    const onboardingSteps = [
      {
        id: 'zoom',
        target: getZoomControlsRect,
        title: 'Zoom in or out.',
        copy: 'Use + / -, scroll, or pinch when you need to inspect streets more closely.'
      },
      {
        id: 'fit',
        target: () => els.fitRoutes,
        title: 'Bring both routes back.',
        copy: 'Tap Fit routes if you lose the comparison while exploring.'
      },
      {
        id: 'street',
        target: getStreetViewTeachingRect,
        title: 'Check the street.',
        copy: 'Click a point on either route to open the Street View prompt.'
      },
      {
        id: 'answer',
        target: () => els.questionCard,
        title: 'Choose when ready.',
        copy: 'Pick the route you would actually walk, then continue.',
        final: true
      }
    ];

    function renderPips() {
      els.pips.innerHTML = '';
      for (let i = 0; i < state.totalRounds; i += 1) {
        const pip = document.createElement('span');
        pip.className = i < state.roundIndex ? 'is-done' : i === state.roundIndex ? 'is-now' : '';
        els.pips.appendChild(pip);
      }
    }

    function ensureMap() {
      if (state.map) return;
      if (state.mapProvider === 'google') {
        state.map = new google.maps.Map(els.mapCanvas, {
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
      state.map = L.map(els.mapCanvas, {
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25
      });
      state.standardTiles.addTo(state.map);
      state.routeLayers = L.featureGroup().addTo(state.map);
    }

    function getRouteFitPadding() {
      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      if (!isMobile) {
        return {
          google: 44,
          leaflet: { padding: [44, 44], maxZoom: ROUTE_FIT_MAX_ZOOM }
        };
      }

      const lowerSheet = state.panelCollapsed ? 82 : Math.min(Math.round(window.innerHeight * 0.5), 430);
      return {
        google: {
          top: 76,
          right: 16,
          bottom: lowerSheet + 10,
          left: 16
        },
        leaflet: {
          paddingTopLeft: [16, 76],
          paddingBottomRight: [16, lowerSheet + 10],
          maxZoom: ROUTE_FIT_MAX_ZOOM
        }
      };
    }

    function fitRoutes() {
      const fitPadding = getRouteFitPadding();
      if (state.mapProvider === 'google') {
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
            if (state.map.getZoom() > ROUTE_FIT_MAX_ZOOM) state.map.setZoom(ROUTE_FIT_MAX_ZOOM);
          });
        }
        return;
      }

      if (!state.routeLayers?.getLayers().length) return;
      state.map.invalidateSize();
      state.map.fitBounds(state.routeLayers.getBounds(), fitPadding.leaflet);
    }

    function getElementRect(target) {
      if (!target) return null;
      if (target instanceof DOMRect || typeof target.left === 'number') return target;
      if (typeof target.getBoundingClientRect === 'function') return target.getBoundingClientRect();
      return null;
    }

    function getCombinedRect(elements) {
      const rects = elements
        .filter(Boolean)
        .map(element => element.getBoundingClientRect())
        .filter(rect => rect.width && rect.height);
      if (!rects.length) return null;

      const left = Math.min(...rects.map(rect => rect.left));
      const top = Math.min(...rects.map(rect => rect.top));
      const right = Math.max(...rects.map(rect => rect.right));
      const bottom = Math.max(...rects.map(rect => rect.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    }

    function getZoomControlsRect() {
      return getCombinedRect([els.zoomIn, els.zoomOut]);
    }

    function getStreetViewTeachingRect() {
      const canvasRect = els.mapCanvas.getBoundingClientRect();
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

      if (state.mapProvider === 'leaflet' && state.map?.latLngToContainerPoint) {
        const containerPoint = state.map.latLngToContainerPoint(point);
        return new DOMRect(canvasRect.left + containerPoint.x - 28, canvasRect.top + containerPoint.y - 28, 56, 56);
      }

      return fallback;
    }

    function placeOnboardingStep(targetRect) {
      const benchmarkRect = root.querySelector('.ari-benchmark').getBoundingClientRect();
      const localLeft = targetRect.left - benchmarkRect.left;
      const localTop = targetRect.top - benchmarkRect.top;
      const padding = 14;
      const margin = 14;
      const gap = 12;
      const spotlightLeft = Math.max(8, localLeft - padding);
      const spotlightTop = Math.max(8, localTop - padding);
      const spotlightWidth = Math.min(benchmarkRect.width - spotlightLeft - 8, targetRect.width + padding * 2);
      const spotlightHeight = Math.min(benchmarkRect.height - spotlightTop - 8, targetRect.height + padding * 2);
      const coachWidth = Math.min(310, benchmarkRect.width - margin * 2);
      const coachHeight = Math.ceil(els.onboardingCoach.getBoundingClientRect().height || 184);
      const clampLeft = value => Math.max(margin, Math.min(benchmarkRect.width - coachWidth - margin, value));
      const clampTop = value => Math.max(margin, Math.min(benchmarkRect.height - coachHeight - margin, value));
      const placeRight = spotlightLeft + spotlightWidth + gap + coachWidth <= benchmarkRect.width - margin;
      const placeLeft = spotlightLeft - gap - coachWidth >= margin;
      const placeBelow = spotlightTop + spotlightHeight + gap + coachHeight <= benchmarkRect.height - margin;
      const placeAbove = spotlightTop - gap - coachHeight >= margin;
      let coachLeft;
      let coachTop;

      if (placeRight) {
        coachLeft = spotlightLeft + spotlightWidth + gap;
        coachTop = clampTop(spotlightTop);
      } else if (placeLeft || spotlightLeft > benchmarkRect.width / 2) {
        coachLeft = clampLeft(spotlightLeft - gap - coachWidth);
        coachTop = clampTop(spotlightTop);
      } else if (placeBelow) {
        coachLeft = clampLeft(spotlightLeft + spotlightWidth / 2 - coachWidth / 2);
        coachTop = spotlightTop + spotlightHeight + gap;
      } else if (placeAbove) {
        coachLeft = clampLeft(spotlightLeft + spotlightWidth / 2 - coachWidth / 2);
        coachTop = spotlightTop - gap - coachHeight;
      } else {
        coachLeft = clampLeft(spotlightLeft + spotlightWidth / 2 - coachWidth / 2);
        coachTop = clampTop(spotlightTop + spotlightHeight + gap);
      }

      els.onboarding.style.setProperty('--spot-left', `${spotlightLeft}px`);
      els.onboarding.style.setProperty('--spot-top', `${spotlightTop}px`);
      els.onboarding.style.setProperty('--spot-width', `${spotlightWidth}px`);
      els.onboarding.style.setProperty('--spot-height', `${spotlightHeight}px`);
      els.onboarding.style.setProperty('--coach-width', `${coachWidth}px`);
      els.onboarding.style.setProperty('--coach-left', `${coachLeft}px`);
      els.onboarding.style.setProperty('--coach-top', `${coachTop}px`);
    }

    function renderOnboardingStep() {
      if (state.onboardingComplete || els.onboarding.hidden) return;
      const step = onboardingSteps[state.onboardingStepIndex] || onboardingSteps[0];
      updatePanelState(step.id !== 'answer');
      const targetRect = getElementRect(step.target());
      if (!targetRect) return;

      els.onboarding.dataset.step = step.id;
      els.onboardingCount.textContent = `${state.onboardingStepIndex + 1} / ${onboardingSteps.length}`;
      els.onboardingTitle.textContent = step.title;
      els.onboardingCopy.textContent = step.copy;
      els.nextOnboarding.textContent = step.final ? 'Start round →' : 'OK';
      els.previousOnboarding.hidden = state.onboardingStepIndex === 0;
      els.previousOnboarding.disabled = state.onboardingStepIndex === 0;
      placeOnboardingStep(targetRect);
    }

    function finishOnboarding() {
      state.onboardingComplete = true;
      els.onboarding.hidden = true;
      updatePanelState(true);
      requestAnimationFrame(fitRoutes);
    }

    function isNearLeafletRoute(latlng, containerPoint) {
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

    function bindStreetViewMapClick() {
      if (state.mapStreetHandlerBound) return;
      state.mapStreetHandlerBound = true;
      if (state.mapProvider === 'google') {
        state.map.addListener('click', event => {
          const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          if (isNearLatLngRoute(point)) setStreetViewPoint(point);
        });
        return;
      }
      state.map.on('click', event => {
        if (isNearLeafletRoute(event.latlng, event.containerPoint)) {
          setStreetViewPoint(event.latlng);
        }
      });
    }

    function setRouteFocus(routeKey) {
      const focusConfig = routeKey
        ? {
            routeA: routeKey === 'routeA' ? { opacity: 1, weightBoost: 2 } : { opacity: 0.38, weightBoost: -2 },
            routeB: routeKey === 'routeB' ? { opacity: 1, weightBoost: 2 } : { opacity: 0.38, weightBoost: -2 }
          }
        : {
            routeA: { opacity: 0.98, weightBoost: 0 },
            routeB: { opacity: 0.98, weightBoost: 0 }
          };

      if (state.mapProvider === 'google') {
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

    function setStreetViewPoint(point) {
      state.streetViewPoint = point;
      els.streetCard.hidden = false;
    }

    function openStreetView() {
      if (!state.streetViewPoint) return;
      const point = state.streetViewPoint;
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    function drawRoutes(pair) {
      ensureMap();
      bindStreetViewMapClick();

      if (state.mapProvider === 'google') {
        state.googleOverlays.forEach(overlay => overlay.setMap(null));
        state.googleOverlays = [];

        const routeA = normalizeLatLngs(pair.routes[state.assignment.routeA].geometry).map(toLatLngObject);
        const routeB = normalizeLatLngs(pair.routes[state.assignment.routeB].geometry).map(toLatLngObject);

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
          strokeColor: routeAColor,
          strokeOpacity: 0.98,
          strokeWeight: 9
        });
        const routeBLine = new google.maps.Polyline({
          path: routeB,
          map: state.map,
          strokeColor: routeBColor,
          strokeOpacity: 0.98,
          strokeWeight: 6
        });
        [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
          layer.__ariBaseWeight = layer.strokeWeight || 7;
          layer.__ariBaseOpacity = layer.strokeOpacity ?? 0.98;
        });
        [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
          layer.addListener('click', event => {
            setStreetViewPoint({ lat: event.latLng.lat(), lng: event.latLng.lng() });
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
        requestAnimationFrame(() => {
          fitRoutes();
          setTimeout(fitRoutes, 180);
        });
        return;
      }

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

      const routeA = normalizeLatLngs(pair.routes[state.assignment.routeA].geometry);
      const routeB = normalizeLatLngs(pair.routes[state.assignment.routeB].geometry);
      const routeACase = L.polyline(routeA, { color: '#ffffff', weight: 15, opacity: 0.82, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 15, __ariBaseOpacity: 0.82 }).addTo(state.routeLayers);
      const routeBCase = L.polyline(routeB, { color: '#ffffff', weight: 15, opacity: 0.82, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 15, __ariBaseOpacity: 0.82 }).addTo(state.routeLayers);
      const routeALine = L.polyline(routeA, { color: routeAColor, weight: 9, opacity: 0.98, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 9, __ariBaseOpacity: 0.98 }).addTo(state.routeLayers);
      const routeBLine = L.polyline(routeB, { color: routeBColor, weight: 6, opacity: 0.98, lineCap: 'round', lineJoin: 'round', __ariBaseWeight: 6, __ariBaseOpacity: 0.98 }).addTo(state.routeLayers);
      [routeACase, routeBCase, routeALine, routeBLine].forEach(layer => {
        layer.on('click', event => {
          setStreetViewPoint(event.latlng);
        });
      });
      state.routeVisuals = {
        routeA: [routeACase, routeALine],
        routeB: [routeBCase, routeBLine]
      };
      L.marker([pair.origin.lat, pair.origin.lng], { icon: startIcon, keyboard: false }).addTo(state.routeLayers);
      L.marker([pair.destination.lat, pair.destination.lng], { icon: endIcon, keyboard: false }).addTo(state.routeLayers);

      requestAnimationFrame(() => {
        fitRoutes();
        setTimeout(fitRoutes, 180);
      });
    }

    function getQ1Choice() {
      return els.form.querySelector('input[name="q1Choice"]:checked')?.value;
    }

    function getQuestionSequence() {
      const selected = getQ1Choice();
      const sequence = ['q1'];
      if (selected === 'route_a' || selected === 'route_b' || selected === 'either') {
        sequence.push('q2');
      }
      if (selected === 'route_a' || selected === 'route_b' || selected === 'neither') {
        sequence.push('q3');
      }
      return sequence;
    }

    function isStepComplete(step) {
      if (step === 'q1') return !!getQ1Choice();
      if (step === 'q2') return !!els.form.querySelector('input[name="q2Separate"]:checked');
      if (step === 'q3') return !!els.form.querySelector('input[name="q3Issues"]:checked');
      return false;
    }

    function updateQuestionFlow() {
      const selected = els.form.querySelector('input[name="q1Choice"]:checked')?.value;
      const sequence = getQuestionSequence();
      if (!sequence.includes(state.questionStep)) state.questionStep = sequence[0];
      const stepIndex = sequence.indexOf(state.questionStep);
      const questionMeta = {
        q1: ['Q1', 'Which route would you choose for this calm walk?'],
        q2: ['Q2', 'Is it worth showing both routes as separate options?'],
        q3: ['Q3', 'What made one or both routes less suitable?']
      }[state.questionStep];

      els.q1.hidden = state.questionStep !== 'q1';
      els.q2.hidden = state.questionStep !== 'q2';
      els.q3.hidden = state.questionStep !== 'q3';
      els.panelStep.textContent = questionMeta[0];
      els.panelQuestion.textContent = questionMeta[1];
      els.previous.hidden = stepIndex === 0;
      els.previous.disabled = stepIndex === 0;
      els.submit.disabled = !isStepComplete(state.questionStep);
      if (state.questionStep === 'q1' && !selected) {
        els.submit.textContent = 'Next question →';
      } else if (stepIndex < sequence.length - 1) {
        els.submit.textContent = 'Next question →';
      } else if (state.roundIndex < state.totalRounds - 1) {
        els.submit.textContent = selected === 'hard_to_judge' ? 'Next round →' : 'Finish round →';
      } else {
        els.submit.textContent = 'Finish test →';
      }
      els.form.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        label.classList.toggle('is-selected', !!input && input.checked);
      });
    }

    function updatePanelState(collapsed) {
      state.panelCollapsed = collapsed;
      els.questionCard.classList.toggle('is-collapsed', collapsed);
      els.panelToggle.setAttribute('aria-expanded', String(!collapsed));
      els.panelToggle.setAttribute('aria-label', collapsed ? 'Expand question panel' : 'Minimize question panel');
      els.panelToggle.setAttribute('title', collapsed ? 'Expand question panel' : 'Minimize question panel');
      if (!collapsed) {
        requestAnimationFrame(() => {
          if (state.map) fitRoutes();
        });
      } else {
        requestAnimationFrame(fitRoutes);
      }
    }

    function hasPartialProgress() {
      return !!getQ1Choice()
        || !!els.form.querySelector('input[name="q2Separate"]:checked')
        || !!els.form.querySelector('input[name="q3Issues"]:checked')
        || !!els.form.querySelector('textarea[name="q3Note"]')?.value.trim();
    }

    function updateExitCopy() {
      const currentAnswered = isStepComplete(state.questionStep);
      els.exitCopy.textContent = state.completedRounds > 0
        ? `You have submitted ${state.completedRounds} round${state.completedRounds === 1 ? '' : 's'}. You can also save your current progress before leaving.`
        : currentAnswered || hasPartialProgress()
          ? 'This round is not submitted yet. Save progress if you want to keep where you are before leaving.'
          : 'No rounds have been submitted yet. You can leave without saving or keep testing.';
    }

    function readProgress() {
      return {
        sessionId: state.sessionId,
        participantName: state.participantName,
        roundIndex: state.roundIndex,
        completedRounds: state.completedRounds,
        pairId: state.pair?.pairId,
        routeAssignment: state.assignment,
        questionStep: state.questionStep,
        partialAnswer: readAnswer(),
        savedAt: new Date().toISOString()
      };
    }

    function readAnswer() {
      const form = new FormData(els.form);
      const q1Choice = form.get('q1Choice');
      const q2Separate = form.get('q2Separate') || undefined;
      const q3Issues = form.getAll('q3Issues');
      return {
        sessionId: state.sessionId,
        roundId: `${state.sessionId}-round-${state.roundIndex + 1}`,
        pairId: state.pair.pairId,
        participantName: state.participantName,
        routeAssignment: state.assignment,
        routeAType: state.assignment.routeA,
        routeBType: state.assignment.routeB,
        q1Choice,
        q2Separate,
        q3Issues,
        q3Note: form.get('q3Note') || '',
        note: '',
        createdAt: new Date().toISOString()
      };
    }

    async function loadRound(index) {
      state.roundIndex = index;
      state.assignment = randomAssignment();
      state.pair = await routePairProvider({
        sessionId: state.sessionId,
        roundIndex: state.roundIndex
      });
      els.currentRound.textContent = String(state.roundIndex + 1);
      els.scenario.textContent = state.pair.scenario || 'No specific situation provided.';
      state.questionStep = 'q1';
      state.streetViewPoint = null;
      els.streetCard.hidden = true;
      els.form.reset();
      updatePanelState(false);
      updateQuestionFlow();
      renderPips();
      drawRoutes(state.pair);
      if (!state.onboardingComplete) {
        state.onboardingStepIndex = 0;
        requestAnimationFrame(() => {
          renderOnboardingStep();
          setTimeout(renderOnboardingStep, 220);
        });
      }
    }

    els.form.addEventListener('change', updateQuestionFlow);
    els.form.addEventListener('submit', async event => {
      event.preventDefault();
      const sequence = getQuestionSequence();
      const stepIndex = sequence.indexOf(state.questionStep);
      if (!isStepComplete(state.questionStep)) return;

      if (stepIndex < sequence.length - 1) {
        state.questionStep = sequence[stepIndex + 1];
        updateQuestionFlow();
        return;
      }

      els.submit.disabled = true;
      await answerSink(readAnswer());
      state.completedRounds += 1;
      if (state.roundIndex < state.totalRounds - 1) {
        await loadRound(state.roundIndex + 1);
      } else {
        els.submit.textContent = 'Complete';
      }
    });

    els.exit.addEventListener('click', () => {
      updateExitCopy();
      els.exitConfirm.hidden = false;
    });

    els.keepTesting.addEventListener('click', () => {
      els.exitConfirm.hidden = true;
    });

    els.leaveWithoutSaving.addEventListener('click', () => {
      els.exitConfirm.hidden = true;
      if (onExit) onExit();
    });

    els.saveProgress.addEventListener('click', async () => {
      els.saveProgress.disabled = true;
      await progressSink(readProgress());
      els.exitConfirm.hidden = true;
      els.saveProgress.disabled = false;
      if (onExit) onExit();
    });

    els.nextOnboarding.addEventListener('click', () => {
      const isLastStep = state.onboardingStepIndex >= onboardingSteps.length - 1;
      if (isLastStep) {
        finishOnboarding();
        return;
      }

      state.onboardingStepIndex += 1;
      renderOnboardingStep();
    });

    els.previousOnboarding.addEventListener('click', () => {
      if (state.onboardingStepIndex <= 0) return;
      state.onboardingStepIndex -= 1;
      renderOnboardingStep();
    });

    els.skipOnboarding.addEventListener('click', () => {
      finishOnboarding();
    });

    els.panelToggle.addEventListener('click', () => {
      updatePanelState(!state.panelCollapsed);
    });

    els.previous.addEventListener('click', () => {
      const sequence = getQuestionSequence();
      const stepIndex = sequence.indexOf(state.questionStep);
      if (stepIndex > 0) {
        state.questionStep = sequence[stepIndex - 1];
        updateQuestionFlow();
      }
    });

    els.zoomIn.addEventListener('click', () => {
      if (!state.map) return;
      if (state.mapProvider === 'google') state.map.setZoom(state.map.getZoom() + 1);
      else state.map.zoomIn();
    });
    els.zoomOut.addEventListener('click', () => {
      if (!state.map) return;
      if (state.mapProvider === 'google') state.map.setZoom(state.map.getZoom() - 1);
      else state.map.zoomOut();
    });

    els.fitRoutes.addEventListener('click', fitRoutes);
    els.openStreetView.addEventListener('click', openStreetView);
    els.closeStreetView.addEventListener('click', () => {
      els.streetCard.hidden = true;
      state.streetViewPoint = null;
    });

    els.form.querySelectorAll('.ari-choice--route-a, .ari-choice--route-b').forEach(label => {
      const key = label.classList.contains('ari-choice--route-a') ? 'routeA' : 'routeB';
      label.addEventListener('mouseenter', () => setRouteFocus(key));
      label.addEventListener('mouseleave', () => setRouteFocus(null));
      label.addEventListener('focusin', () => setRouteFocus(key));
      label.addEventListener('focusout', () => setRouteFocus(null));
    });

    window.addEventListener('resize', () => {
      requestAnimationFrame(renderOnboardingStep);
    });

    loadRound(state.roundIndex);

    return {
      getState: () => ({ ...state }),
      fitRoutes,
      loadRound
    };
  }

    window.AriCalmBenchmark = {
      mount,
      mockRoutePairProvider,
      consoleAnswerSink,
      consoleProgressSink
    };
})();
