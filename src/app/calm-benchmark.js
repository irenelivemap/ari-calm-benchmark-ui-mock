(function () {
  const DEFAULT_TOTAL_ROUNDS = 10;
  const ROUTE_FIT_MAX_ZOOM = 19;
  const demoPairs = window.AriCalmBenchmarkMockRoutePairs || [];

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

  function mockRoutePairProvider({ roundIndex }) {
    if (!demoPairs.length) {
      return Promise.reject(new Error('No mock route pairs loaded. Include src/data/mock-route-pairs.js or provide routePairProvider.'));
    }
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

  function buildShell(root, totalRounds) {
    root.innerHTML = `
      <section class="ari-benchmark" aria-label="ARI calm route benchmark">
        <main class="ari-benchmark__grid">
          <section class="ari-map-card" aria-label="Route map">
            <div class="ari-map" data-map>
              <div class="ari-map__canvas" data-map-canvas aria-label="Interactive route comparison map"></div>
              <div class="ari-map__zoom" aria-label="Map zoom controls">
                <button data-action="zoom-in" type="button" aria-label="Zoom in">+</button>
                <button data-action="zoom-out" type="button" aria-label="Zoom out">-</button>
              </div>
              <div class="ari-map__tools" aria-label="Map tools">
                <button class="ari-icon-btn ari-icon-btn--fit" data-action="fit-routes" type="button" aria-label="See full routes" title="See full routes"><span aria-hidden="true"></span></button>
              </div>
              <div class="ari-street-card" data-street-card hidden>
                <button data-action="open-street-view" type="button">Open Street View</button>
                <button data-action="close-street-view" type="button" aria-label="Close Street View prompt">x</button>
              </div>
            </div>
          </section>

          <aside class="ari-question-card" aria-label="Benchmark questions" data-question-card>
            <div class="ari-card-header">
              <button class="ari-hud-exit" data-action="exit" type="button" aria-label="Exit test — progress is saved" title="Exit — progress is saved">&times;</button>
              <span class="ari-hud-sep" aria-hidden="true"></span>
              <div class="ari-round-chip"><span class="ari-round-kicker">Route</span> <b data-round-current>001</b></div>
              <div class="ari-hud-medals" data-hud-medals aria-label="Medal progress"></div>
              <span class="ari-save-flash" data-save-flash aria-live="polite">Saved &#10003;</span>
              <button class="ari-panel-handle" data-action="toggle-panel" type="button" aria-expanded="true" aria-label="Minimize question panel" title="Minimize question panel"></button>
            </div>
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
              <div class="ari-onboarding__dots" data-onboarding-dots></div>
              <button class="ari-onboarding__skip" data-action="skip-onboarding" type="button" aria-label="Skip tutorial">Skip</button>
            </div>
            <h2 id="ari-onboarding-title" data-onboarding-title>Zoom in or out.</h2>
            <p id="ari-onboarding-copy" data-onboarding-copy>Use + and - when you need to inspect streets more closely.</p>
            <div class="ari-onboarding__actions">
              <button class="ari-btn ari-btn--primary" data-action="next-onboarding" type="button">Got it →</button>
            </div>
          </div>
        </section>

      </section>
    `;
  }

  function mount(root, options = {}) {
    const mapTools = window.AriCalmBenchmarkMaps;
    if (!mapTools) {
      throw new Error('AriCalmBenchmark requires src/maps/map-adapter.js before mounting.');
    }
    const requestedProvider = options.mapProvider || 'leaflet';
    const useGoogleMaps = requestedProvider === 'google' && mapTools.hasGoogleMaps();
    if (!useGoogleMaps && !window.L) {
      throw new Error('AriCalmBenchmark requires Leaflet on window.L, or Google Maps on window.google.maps, before mounting.');
    }

    const initialRoundIndex = options.initialRoundIndex || 0;
    const initialTotalRounds = Math.max(options.totalRounds || DEFAULT_TOTAL_ROUNDS, initialRoundIndex + 1);
    const state = {
      sessionId: options.sessionId || createId('calm-session'),
      participantName: options.participantName || '',
      roundIndex: initialRoundIndex,
      totalRounds: initialTotalRounds,
      pair: null,
      assignment: null,
      questionStep: 'q1',
      onboardingComplete: !!options.skipOnboarding || initialRoundIndex > 0,
      onboardingStepIndex: 0,
      completedRounds: options.initialCompletedRounds || 0,
      panelCollapsed: false,
      mapAdapter: null,
      mapProvider: useGoogleMaps ? 'google' : 'leaflet'
    };

    const routePairProvider = options.routePairProvider || mockRoutePairProvider;
    const answerSink = options.answerSink || consoleAnswerSink;
    const progressSink = options.progressSink || consoleProgressSink;
    const onExit = typeof options.onExit === 'function' ? options.onExit : null;
    const milestones = Array.isArray(options.milestones) ? options.milestones : [];

    buildShell(root, state.totalRounds);

    const els = {
      currentRound: root.querySelector('[data-round-current]'),
      cardHeader: root.querySelector('.ari-card-header'),
      hudMedals: root.querySelector('[data-hud-medals]'),
      mapCanvas: root.querySelector('[data-map-canvas]'),
      onboarding: root.querySelector('[data-onboarding]'),
      onboardingSpotlight: root.querySelector('[data-onboarding-spotlight]'),
      onboardingCoach: root.querySelector('.ari-onboarding__coach'),
      onboardingDots: root.querySelector('[data-onboarding-dots]'),
      onboardingTitle: root.querySelector('[data-onboarding-title]'),
      onboardingCopy: root.querySelector('[data-onboarding-copy]'),
      skipOnboarding: root.querySelector('[data-action="skip-onboarding"]'),
      nextOnboarding: root.querySelector('[data-action="next-onboarding"]'),
      saveFlash: root.querySelector('[data-save-flash]'),
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
      closeStreetView: root.querySelector('[data-action="close-street-view"]')
    };

    function canContinueAfterCurrentRound() {
      return options.allowExtraRounds || state.roundIndex < state.totalRounds - 1;
    }

    function renderHudMedals() {
      if (!els.hudMedals || !milestones.length) return;
      const next = milestones.find(milestone => state.completedRounds < milestone.at);
      els.hudMedals.innerHTML = milestones.map(milestone => {
        const earned = state.completedRounds >= milestone.at;
        const isNext = next?.at === milestone.at;
        const classes = [
          'ari-hud-medal',
          earned ? 'is-earned' : '',
          isNext ? 'is-next' : ''
        ].filter(Boolean).join(' ');
        return `<span class="${classes}" title="${milestone.name} at ${milestone.at} routes" aria-label="${milestone.name} medal at ${milestone.at} routes${earned ? ', earned' : ''}">${milestone.at}</span>`;
      }).join('');
    }

    function updateProgressHud() {
      els.currentRound.textContent = String(state.roundIndex + 1).padStart(3, '0');
      renderHudMedals();
    }

    state.mapAdapter = mapTools.createMapAdapter({
      canvas: els.mapCanvas,
      provider: state.mapProvider,
      routeAColor,
      routeBColor,
      maxFitZoom: ROUTE_FIT_MAX_ZOOM,
      onRoutePointClick: setStreetViewPoint
    });

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
        title: 'Fit both routes on screen.',
        copy: 'Return to the comparison view.'
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
      state.mapAdapter.fitRoutes(getRouteFitPadding());
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
      return state.mapAdapter.getRoutePointRect();
    }

    function placeOnboardingStep(targetRect) {
      const benchmarkRect = root.querySelector('.ari-benchmark').getBoundingClientRect();
      const localLeft = targetRect.left - benchmarkRect.left;
      const localTop = targetRect.top - benchmarkRect.top;
      const isCompactTarget = targetRect.width <= 72 && targetRect.height <= 96;
      const padding = isCompactTarget ? 10 : 14;
      const edgeInset = 8;
      const margin = 14;
      const gap = 12;
      const targetCenterX = localLeft + targetRect.width / 2;
      const targetCenterY = localTop + targetRect.height / 2;
      const spotlightWidth = Math.min(benchmarkRect.width - edgeInset * 2, targetRect.width + padding * 2);
      const spotlightHeight = Math.min(benchmarkRect.height - edgeInset * 2, targetRect.height + padding * 2);
      const spotlightLeft = Math.max(edgeInset, Math.min(benchmarkRect.width - spotlightWidth - edgeInset, targetCenterX - spotlightWidth / 2));
      const spotlightTop = Math.max(edgeInset, Math.min(benchmarkRect.height - spotlightHeight - edgeInset, targetCenterY - spotlightHeight / 2));
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
      els.onboardingTitle.textContent = step.title;
      els.onboardingCopy.textContent = step.copy;
      els.nextOnboarding.textContent = step.final ? 'Start round →' : 'Got it →';

      els.onboardingDots.innerHTML = '';
      onboardingSteps.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ari-onboarding__dot';
        if (i < state.onboardingStepIndex) {
          dot.classList.add('is-done');
          dot.setAttribute('aria-label', `Go to step ${i + 1}`);
          dot.addEventListener('click', () => {
            state.onboardingStepIndex = i;
            renderOnboardingStep();
          });
        } else if (i === state.onboardingStepIndex) {
          dot.classList.add('is-current');
          dot.setAttribute('aria-label', `Step ${i + 1} of ${onboardingSteps.length}`);
          dot.setAttribute('aria-current', 'step');
          dot.disabled = true;
        } else {
          dot.setAttribute('aria-label', `Step ${i + 1}`);
          dot.disabled = true;
        }
        els.onboardingDots.appendChild(dot);
      });

      placeOnboardingStep(targetRect);
    }

    function finishOnboarding() {
      state.onboardingComplete = true;
      els.onboarding.hidden = true;
      updatePanelState(true);
      requestAnimationFrame(fitRoutes);
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
      state.mapAdapter.drawRoutes(pair, state.assignment);
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
      } else if (canContinueAfterCurrentRound()) {
        els.submit.textContent = selected === 'hard_to_judge' ? 'Next round →' : 'Finish round →';
      } else {
        els.submit.textContent = 'Finish test →';
      }
      els.form.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        label.classList.toggle('is-selected', !!input && input.checked);
      });
    }

    function updatePanelState(collapsed, { animate = false } = {}) {
      const form = els.form;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (animate && !reduceMotion) {
        if (collapsed) {
          const h = form.offsetHeight;
          form.style.overflow = 'hidden';
          form.style.height = h + 'px';
          form.style.transition = 'height 300ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease';
          requestAnimationFrame(() => {
            form.style.height = '0';
            form.style.opacity = '0';
          });
        } else {
          const targetH = form.scrollHeight;
          form.style.overflow = 'hidden';
          form.style.height = '0';
          form.style.opacity = '0';
          form.style.transition = 'height 340ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease 50ms';
          requestAnimationFrame(() => {
            form.style.height = targetH + 'px';
            form.style.opacity = '1';
          });
          function onHeightDone(e) {
            if (e.propertyName !== 'height') return;
            form.style.height = '';
            form.style.overflow = '';
            form.style.transition = '';
            form.style.opacity = '';
            form.removeEventListener('transitionend', onHeightDone);
          }
          form.addEventListener('transitionend', onHeightDone);
        }
      } else {
        form.style.height = collapsed ? '0' : '';
        form.style.overflow = collapsed ? 'hidden' : '';
        form.style.opacity = '';
        form.style.transition = '';
      }

      state.panelCollapsed = collapsed;
      els.questionCard.classList.toggle('is-collapsed', collapsed);
      els.panelToggle.setAttribute('aria-expanded', String(!collapsed));
      els.panelToggle.setAttribute('aria-label', collapsed ? 'Expand question panel' : 'Minimize question panel');
      els.panelToggle.setAttribute('title', collapsed ? 'Expand question panel' : 'Minimize question panel');
      if (!collapsed) {
        requestAnimationFrame(() => {
          if (state.mapAdapter.hasMap()) fitRoutes();
        });
      } else {
        requestAnimationFrame(fitRoutes);
      }
    }

    function autosave() {
      Promise.resolve(progressSink(readProgress())).catch(() => {});
    }

    function flashSaved() {
      els.saveFlash.classList.remove('is-flashing');
      void els.saveFlash.offsetWidth;
      els.saveFlash.classList.add('is-flashing');
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
      if (state.roundIndex > 0) {
        state.onboardingComplete = true;
        if (els.onboarding) els.onboarding.hidden = true;
      }
      state.assignment = randomAssignment();
      state.pair = await routePairProvider({
        sessionId: state.sessionId,
        roundIndex: state.roundIndex
      });
      updateProgressHud();
      els.scenario.textContent = state.pair.scenario || 'No specific situation provided.';
      state.questionStep = 'q1';
      state.streetViewPoint = null;
      els.streetCard.hidden = true;
      els.form.reset();
      updatePanelState(!state.onboardingComplete);
      updateQuestionFlow();
      drawRoutes(state.pair);
      if (!state.onboardingComplete) {
        state.onboardingStepIndex = 0;
        requestAnimationFrame(() => {
          renderOnboardingStep();
          setTimeout(renderOnboardingStep, 220);
        });
      }
    }

    els.form.addEventListener('change', () => {
      updateQuestionFlow();
      autosave();
    });
    els.form.addEventListener('submit', async event => {
      event.preventDefault();
      const sequence = getQuestionSequence();
      const stepIndex = sequence.indexOf(state.questionStep);
      if (!isStepComplete(state.questionStep)) return;

      if (stepIndex < sequence.length - 1) {
        state.questionStep = sequence[stepIndex + 1];
        updateQuestionFlow();
        autosave();
        return;
      }

      els.submit.disabled = true;
      await answerSink(readAnswer());
      state.completedRounds += 1;
      if (!canContinueAfterCurrentRound()) {
        els.submit.textContent = 'Complete';
      } else {
        if (state.roundIndex >= state.totalRounds - 1) {
          state.totalRounds += 5;
        }
        await loadRound(state.roundIndex + 1);
      }
      autosave();
      flashSaved();
    });

    els.exit.addEventListener('click', async () => {
      await Promise.resolve(progressSink(readProgress())).catch(() => {});
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

    els.skipOnboarding.addEventListener('click', () => {
      finishOnboarding();
    });

    els.panelToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      updatePanelState(!state.panelCollapsed, { animate: true });
    });

    els.cardHeader.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="exit"]')) return;
      if (e.target.closest('[data-action="toggle-panel"]')) return;
      if (!state.panelCollapsed) updatePanelState(true, { animate: true });
    });

    els.questionCard.addEventListener('click', (e) => {
      if (!state.panelCollapsed) return;
      if (e.target.closest('[data-action="toggle-panel"]')) return;
      if (e.target.closest('[data-action="exit"]')) return;
      updatePanelState(false, { animate: true });
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
      state.mapAdapter.zoomIn();
    });
    els.zoomOut.addEventListener('click', () => {
      state.mapAdapter.zoomOut();
    });

    els.fitRoutes.addEventListener('click', fitRoutes);
    els.openStreetView.addEventListener('click', openStreetView);
    els.closeStreetView.addEventListener('click', () => {
      els.streetCard.hidden = true;
      state.streetViewPoint = null;
    });

    els.form.querySelectorAll('.ari-choice--route-a, .ari-choice--route-b').forEach(label => {
      const key = label.classList.contains('ari-choice--route-a') ? 'routeA' : 'routeB';
      label.addEventListener('mouseenter', () => state.mapAdapter.focusRoute(key));
      label.addEventListener('mouseleave', () => state.mapAdapter.focusRoute(null));
      label.addEventListener('focusin', () => state.mapAdapter.focusRoute(key));
      label.addEventListener('focusout', () => state.mapAdapter.focusRoute(null));
    });

    const resizeController = new AbortController();
    window.addEventListener('resize', () => {
      requestAnimationFrame(renderOnboardingStep);
    }, { signal: resizeController.signal });

    loadRound(state.roundIndex);

    function unmount() {
      resizeController.abort();
      state.mapAdapter?.destroy();
    }

    return {
      getState: () => ({ ...state }),
      fitRoutes,
      loadRound,
      unmount
    };
  }

    window.AriCalmBenchmark = {
      mount,
      mockRoutePairProvider,
      consoleAnswerSink,
      consoleProgressSink
    };
})();
