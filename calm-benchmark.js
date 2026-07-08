(function () {
  const DEFAULT_TOTAL_ROUNDS = 10;

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

  function buildShell(root, totalRounds) {
    root.innerHTML = `
      <section class="ari-benchmark" aria-label="ARI calm route benchmark">
        <header class="ari-benchmark__top">
          <div class="ari-benchmark__round">
            <button class="ari-btn ari-btn--secondary" data-action="exit" type="button">Exit</button>
            <span class="ari-round-chip">Round <b data-round-current>1</b> / <span data-round-total>${totalRounds}</span></span>
          </div>
          <div class="ari-pips" data-pips></div>
        </header>

        <main class="ari-benchmark__grid">
          <section class="ari-map-card" aria-label="Route map">
            <div class="ari-map" data-map>
              <div class="ari-map__canvas" data-map-canvas aria-label="Interactive route comparison map"></div>
              <div class="ari-map__toolbar" aria-label="Map tools">
                <div class="ari-map__chips">
                  <div class="ari-map-chip" data-participant-chip>Participant</div>
                  <div class="ari-map-chip"><span class="ari-swatch ari-swatch--a"></span>Route A</div>
                  <div class="ari-map-chip"><span class="ari-swatch ari-swatch--b"></span>Route B</div>
                </div>
                <div class="ari-map__chips">
                  <button class="ari-map-tool" data-action="fit-routes" type="button">Fit routes</button>
                  <button class="ari-map-tool" data-action="toggle-map-style" type="button" aria-pressed="false">Google view</button>
                </div>
              </div>
              <div class="ari-map__zoom" aria-label="Map zoom controls">
                <button data-action="zoom-in" type="button" aria-label="Zoom in">+</button>
                <button data-action="zoom-out" type="button" aria-label="Zoom out">-</button>
              </div>
              <div class="ari-map__note"><b>Inspect both routes.</b> Zoom or switch view before choosing. The routes stay unlabeled on purpose.</div>
            </div>
            <div class="ari-scenario">
              <span class="ari-scenario__icon" aria-hidden="true">sun</span>
              <span><b>Scenario:</b> <span data-scenario></span></span>
            </div>
          </section>

          <aside class="ari-question-card" aria-label="Benchmark questions">
            <div class="ari-stepper" aria-hidden="true">
              <span class="is-active">1 · Choose</span>
              <span>2 · Separate</span>
              <span>3 · Why</span>
            </div>

            <h2>Judge the two <span>unlabeled</span> routes.</h2>
            <p class="ari-question-card__sub">Use the map only. Choose what you would actually walk in this calm situation.</p>

            <form class="ari-question-stack" data-form>
              <section class="ari-question-block">
                <div class="ari-kicker">Q1</div>
                <fieldset>
                  <legend>Which route would you choose in this situation?</legend>
                  <div class="ari-choice-grid ari-choice-grid--two">
                    <label><input type="radio" name="q1Choice" value="route_a">Route A</label>
                    <label><input type="radio" name="q1Choice" value="route_b">Route B</label>
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

              <section class="ari-question-block">
                <label class="ari-free-note">Anything to add?<textarea name="note" placeholder="Optional note"></textarea></label>
              </section>

              <div class="ari-actions">
                <button class="ari-btn ari-btn--secondary" data-action="previous" type="button">Back</button>
                <button class="ari-btn ari-btn--primary" data-submit type="submit" disabled>Submit answer</button>
              </div>
            </form>
          </aside>
        </main>
      </section>
    `;
  }

  function mount(root, options = {}) {
    if (!window.L) {
      throw new Error('AriCalmBenchmark requires Leaflet on window.L before mounting.');
    }

    const state = {
      sessionId: options.sessionId || createId('calm-session'),
      participantName: options.participantName || '',
      roundIndex: options.initialRoundIndex || 0,
      totalRounds: options.totalRounds || DEFAULT_TOTAL_ROUNDS,
      pair: null,
      assignment: null,
      map: null,
      routeLayers: null,
      standardTiles: null,
      googleTiles: null
    };

    const routePairProvider = options.routePairProvider || mockRoutePairProvider;
    const answerSink = options.answerSink || consoleAnswerSink;

    buildShell(root, state.totalRounds);

    const els = {
      currentRound: root.querySelector('[data-round-current]'),
      pips: root.querySelector('[data-pips]'),
      mapShell: root.querySelector('[data-map]'),
      mapCanvas: root.querySelector('[data-map-canvas]'),
      participantChip: root.querySelector('[data-participant-chip]'),
      scenario: root.querySelector('[data-scenario]'),
      form: root.querySelector('[data-form]'),
      q2: root.querySelector('[data-q2]'),
      q3: root.querySelector('[data-q3]'),
      submit: root.querySelector('[data-submit]'),
      googleView: root.querySelector('[data-action="toggle-map-style"]'),
      fitRoutes: root.querySelector('[data-action="fit-routes"]'),
      zoomIn: root.querySelector('[data-action="zoom-in"]'),
      zoomOut: root.querySelector('[data-action="zoom-out"]')
    };

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
      state.standardTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      });
      state.googleTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      });
      state.map = L.map(els.mapCanvas, {
        zoomControl: false,
        attributionControl: true
      });
      state.standardTiles.addTo(state.map);
      state.routeLayers = L.featureGroup().addTo(state.map);
    }

    function fitRoutes() {
      if (!state.routeLayers?.getLayers().length) return;
      state.map.invalidateSize();
      state.map.fitBounds(state.routeLayers.getBounds(), { padding: [70, 70], maxZoom: 16 });
    }

    function drawRoutes(pair) {
      ensureMap();
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
      L.polyline(routeA, { color: routeAColor, weight: 7, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(state.routeLayers);
      L.polyline(routeB, { color: routeBColor, weight: 7, opacity: 0.95, dashArray: '2 12', lineCap: 'round', lineJoin: 'round' }).addTo(state.routeLayers);
      L.marker([pair.origin.lat, pair.origin.lng], { icon: startIcon, keyboard: false }).addTo(state.routeLayers);
      L.marker([pair.destination.lat, pair.destination.lng], { icon: endIcon, keyboard: false }).addTo(state.routeLayers);

      requestAnimationFrame(() => {
        fitRoutes();
        setTimeout(fitRoutes, 180);
      });
    }

    function updateConditionalQuestions() {
      const selected = els.form.querySelector('input[name="q1Choice"]:checked')?.value;
      const showQ2 = selected === 'route_a' || selected === 'route_b' || selected === 'either';
      const showQ3 = selected === 'route_a' || selected === 'route_b' || selected === 'neither';
      els.q2.hidden = !showQ2;
      els.q3.hidden = !showQ3;
      els.submit.disabled = !selected;
      els.form.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        label.classList.toggle('is-selected', !!input && input.checked);
      });
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
        note: form.get('note') || '',
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
      els.participantChip.textContent = state.participantName ? `Participant: ${state.participantName}` : 'Participant';
      els.scenario.textContent = state.pair.scenario;
      els.form.reset();
      updateConditionalQuestions();
      renderPips();
      drawRoutes(state.pair);
    }

    els.form.addEventListener('change', updateConditionalQuestions);
    els.form.addEventListener('submit', async event => {
      event.preventDefault();
      els.submit.disabled = true;
      await answerSink(readAnswer());
      if (state.roundIndex < state.totalRounds - 1) {
        await loadRound(state.roundIndex + 1);
      } else {
        els.submit.textContent = 'Complete';
      }
    });

    els.fitRoutes.addEventListener('click', fitRoutes);
    els.zoomIn.addEventListener('click', () => state.map?.zoomIn());
    els.zoomOut.addEventListener('click', () => state.map?.zoomOut());
    els.googleView.addEventListener('click', () => {
      if (!state.map) return;
      const active = !els.mapShell.classList.contains('is-google-view');
      els.mapShell.classList.toggle('is-google-view', active);
      els.googleView.classList.toggle('is-active', active);
      els.googleView.setAttribute('aria-pressed', String(active));
      if (active) {
        state.map.removeLayer(state.standardTiles);
        state.googleTiles.addTo(state.map);
      } else {
        state.map.removeLayer(state.googleTiles);
        state.standardTiles.addTo(state.map);
      }
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
    consoleAnswerSink
  };
})();
