(function () {
  const DEFAULT_TOTAL_ROUNDS = 10;
  const ROUTE_FIT_MAX_ZOOM = 19;
  const QUESTION_COPY = {
    q1: 'Which route would you choose for this calm walk?',
    q2: 'Is it worth showing both routes as separate options, one Fast and one Calm?',
    q3: 'What made the route option(s) less suitable for a calmer walk?'
  };

  const MEDAL_UNLOCK_FALLBACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const demoPairs = window.AriCalmBenchmarkMockRoutePairs || [];

  const routeAColor = '#C84720';
  const routeBColor = '#08784D';

  function createId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
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

  function getHudDialProgress(routeNumber, completedRounds, milestones) {
    const ordered = [...milestones].sort((a, b) => a.at - b.at);
    if (!ordered.length) return null;

    const finalMilestone = ordered[ordered.length - 1];
    const allEarned = completedRounds >= finalMilestone.at || routeNumber > finalMilestone.at;
    let targetIndex = ordered.findIndex(milestone => routeNumber <= milestone.at);
    if (targetIndex < 0) targetIndex = ordered.length - 1;

    const target = ordered[targetIndex];
    const stageStart = targetIndex > 0 ? ordered[targetIndex - 1].at : 0;
    const stageLength = Math.max(1, target.at - stageStart);
    const stagePosition = allEarned ? stageLength : Math.max(0, routeNumber - stageStart);
    const illuminated = allEarned
      ? 5
      : Math.max(0, Math.min(5, Math.ceil((stagePosition / stageLength) * 5)));

    return {
      allEarned,
      illuminated,
      target,
      newlyIlluminated: allEarned ? -1 : illuminated - 1
    };
  }

  function getEarnedMilestone(completedRounds, milestones) {
    return milestones.find(milestone => milestone.at === completedRounds) || null;
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
              <div class="ari-hud-medals" data-hud-medals aria-label="Medal progress"></div>
              <span class="ari-round-complete" data-round-complete aria-live="polite" aria-hidden="true"><span aria-hidden="true">&#10003;</span>Complete</span>
              <span class="ari-save-flash" data-save-flash aria-live="polite">Saved &#10003;</span>
              <button class="ari-panel-handle" data-action="toggle-panel" type="button" aria-expanded="true" aria-label="Minimize question panel" title="Minimize question panel"></button>
            </div>
            <div class="ari-panel-summary" data-panel-summary>
              <b data-panel-question>${QUESTION_COPY.q1}</b>
              <button class="ari-context-toggle ari-context-toggle--summary" data-action="open-context" type="button" aria-expanded="false" aria-controls="ari-calm-context" aria-label="What do we mean by calm?" title="What do we mean by calm?"><span aria-hidden="true">i</span></button>
            </div>
            <form class="ari-question-stack" data-form>
              <div class="ari-question-scroll" data-question-scroll>
                <section class="ari-question-block" data-q1>
                <fieldset>
                  <legend>
                    <span>${QUESTION_COPY.q1}</span>
                    <button class="ari-context-toggle" data-action="toggle-context" type="button" aria-expanded="false" aria-controls="ari-calm-context" aria-label="What do we mean by calm?" title="What do we mean by calm?"><span aria-hidden="true">i</span></button>
                  </legend>
                  <div class="ari-context-copy" id="ari-calm-context" hidden>
                    <p>A quieter route for when you want to slow down. More greenery, paths near water, and quieter streets.</p>
                  </div>
                  <div class="ari-choice-grid ari-choice-grid--two">
                    <label class="ari-choice--route-a"><input type="radio" name="q1Choice" value="route_a">Route A</label>
                    <label class="ari-choice--route-b"><input type="radio" name="q1Choice" value="route_b">Route B</label>
                    <label><input type="radio" name="q1Choice" value="either">Both work well</label>
                    <label><input type="radio" name="q1Choice" value="neither">Neither works</label>
                    <label><input type="radio" name="q1Choice" value="hard_to_judge">Hard to judge</label>
                  </div>
                </fieldset>
                </section>

                <section class="ari-question-block" data-q2 hidden>
                <fieldset>
                  <legend>${QUESTION_COPY.q2}</legend>
                  <div class="ari-choice-grid">
                    <label><input type="radio" name="q2Separate" value="yes">Yes</label>
                    <label><input type="radio" name="q2Separate" value="no">No</label>
                    <label><input type="radio" name="q2Separate" value="not_sure">Not sure</label>
                  </div>
                </fieldset>
                </section>

                <section class="ari-question-block" data-q3 hidden>
                <fieldset>
                  <legend>${QUESTION_COPY.q3}</legend>
                  <p class="ari-question-hint" id="ari-q3-hint">Select all that apply.</p>
                  <div class="ari-choice-grid" aria-describedby="ari-q3-hint">
                    <label><input type="checkbox" name="q3Issues" value="not_enough_greenery_water">Not enough greenery or water</label>
                    <label><input type="checkbox" name="q3Issues" value="too_busy_or_crowded">Too busy or crowded</label>
                    <label><input type="checkbox" name="q3Issues" value="lacks_nice_streets_surroundings">Lacks nice streets or surroundings</label>
                    <label><input type="checkbox" name="q3Issues" value="extra_time_distance_not_worth_it">Extra time/distance not worth it</label>
                    <label><input type="checkbox" name="q3Issues" value="too_similar">Too similar to the other route</label>
                    <label><input type="checkbox" name="q3Issues" value="too_complex">Too complex to follow</label>
                    <label><input type="checkbox" name="q3Issues" value="other">Other</label>
                  </div>
                  <div class="ari-question-note" data-q3-note hidden>
                    <textarea name="q3Note" aria-label="Add optional details about your answer" placeholder="Add details (optional)"></textarea>
                  </div>
                </fieldset>
                </section>
              </div>

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
      sessionStartedAt: options.sessionStartedAt || new Date().toISOString(),
      participantName: options.participantName || '',
      roundIndex: initialRoundIndex,
      totalRounds: initialTotalRounds,
      pair: null,
      assignment: null,
      questionStep: 'q1',
      onboardingComplete: !!options.skipOnboarding || initialRoundIndex > 0,
      onboardingStepIndex: 0,
      completedRounds: options.initialCompletedRounds || 0,
      roundTransitioning: false,
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
      cardHeader: root.querySelector('.ari-card-header'),
      hudMedals: root.querySelector('[data-hud-medals]'),
      roundComplete: root.querySelector('[data-round-complete]'),
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
      panelQuestion: root.querySelector('[data-panel-question]'),
      collapsedContextToggle: root.querySelector('[data-action="open-context"]'),
      form: root.querySelector('[data-form]'),
      questionScroll: root.querySelector('[data-question-scroll]'),
      q1: root.querySelector('[data-q1]'),
      q2: root.querySelector('[data-q2]'),
      q3: root.querySelector('[data-q3]'),
      q3NoteWrap: root.querySelector('[data-q3-note]'),
      q3Note: root.querySelector('textarea[name="q3Note"]'),
      contextToggle: root.querySelector('[data-action="toggle-context"]'),
      contextCopy: root.querySelector('#ari-calm-context'),
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

    let medalUnlockTimer = null;
    let roundTransitionTimer = null;

    function canContinueAfterCurrentRound() {
      return options.allowExtraRounds || state.roundIndex < state.totalRounds - 1;
    }

    function renderHudMedals() {
      if (!els.hudMedals || !milestones.length) return;
      const routeNumber = state.roundIndex + 1;
      const progress = getHudDialProgress(routeNumber, state.completedRounds, milestones);
      const { allEarned, illuminated, newlyIlluminated, target } = progress;
      const progressLabel = allEarned
        ? `Route ${routeNumber}. All medals earned. ${target.name}, 5 of 5 segments illuminated.`
        : `Route ${routeNumber}. Next medal: ${target.name} at ${target.at} routes. ${illuminated} of 5 segments illuminated.`;
      els.hudMedals.dataset.target = String(target.at);
      els.hudMedals.dataset.illuminated = String(illuminated);
      els.hudMedals.dataset.progressLabel = progressLabel;
      els.hudMedals.setAttribute('aria-label', progressLabel);
      els.hudMedals.innerHTML = `
        <span class="ari-hud-dial ${allEarned ? 'is-complete' : ''}" aria-hidden="true">
          <span class="ari-hud-dial__segments">
            ${Array.from({ length: 5 }, (_, index) => {
              const classes = [
                'ari-hud-dial__segment',
                index < illuminated ? 'is-illuminated' : '',
                state.roundTransitioning && index === newlyIlluminated ? 'is-new' : ''
              ].filter(Boolean).join(' ');
              return `<span class="${classes}" style="--segment-index:${index}"></span>`;
            }).join('')}
          </span>
          <span class="ari-hud-dial__flip">
            <span class="ari-hud-dial__face ari-hud-dial__face--front"><span class="ari-hud-dial__core">${String(routeNumber).padStart(3, '0')}</span></span>
            <span class="ari-hud-dial__face ari-hud-dial__face--back"><span class="calm-medal__seal ari-hud-dial__medal" data-hud-unlock-icon></span></span>
          </span>
        </span>
        <span class="ari-hud-unlock-copy" aria-live="polite" aria-hidden="true"><small>Unlocked</small><b data-hud-unlock-name></b></span>
      `;
    }

    function updateProgressHud() {
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
        const mapRect = els.mapCanvas.getBoundingClientRect();
        const panelRect = els.questionCard.getBoundingClientRect();
        const edgePadding = 44;
        const panelGap = 24;
        const overlapsMap = panelRect.right > mapRect.left
          && panelRect.left < mapRect.right
          && panelRect.bottom > mapRect.top
          && panelRect.top < mapRect.bottom;

        if (overlapsMap) {
          const rightRegionLeft = Math.max(mapRect.left + edgePadding, panelRect.right + panelGap);
          const rightRegionWidth = Math.max(0, mapRect.right - edgePadding - rightRegionLeft);
          const rightRegionHeight = Math.max(0, mapRect.height - edgePadding * 2);
          const belowRegionTop = Math.max(mapRect.top + edgePadding, panelRect.bottom + panelGap);
          const belowRegionWidth = Math.max(0, mapRect.width - edgePadding * 2);
          const belowRegionHeight = Math.max(0, mapRect.bottom - edgePadding - belowRegionTop);
          const rightRegionArea = rightRegionWidth * rightRegionHeight;
          const belowRegionArea = belowRegionWidth * belowRegionHeight;
          const useRightRegion = rightRegionWidth >= 280
            && (belowRegionHeight < 280 || rightRegionArea >= belowRegionArea);

          const top = useRightRegion ? edgePadding : belowRegionTop - mapRect.top;
          const right = edgePadding;
          const bottom = edgePadding;
          const left = useRightRegion ? rightRegionLeft - mapRect.left : edgePadding;

          return {
            google: { top, right, bottom, left },
            leaflet: {
              paddingTopLeft: [left, top],
              paddingBottomRight: [right, bottom],
              maxZoom: ROUTE_FIT_MAX_ZOOM
            }
          };
        }

        return {
          google: edgePadding,
          leaflet: { padding: [edgePadding, edgePadding], maxZoom: ROUTE_FIT_MAX_ZOOM }
        };
      }

      const measuredSheet = els.questionCard.getBoundingClientRect().height;
      const lowerSheet = measuredSheet || (state.panelCollapsed ? 110 : Math.min(Math.round(window.innerHeight * 0.62), 520));
      return {
        google: {
          top: 76,
          right: 20,
          bottom: lowerSheet + 20,
          left: 20
        },
        leaflet: {
          paddingTopLeft: [20, 76],
          paddingBottomRight: [20, lowerSheet + 20],
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

    function drawRoutes(pair, { hidden = false } = {}) {
      state.mapAdapter.drawRoutes(pair, state.assignment);
      if (hidden) state.mapAdapter.setRoutesVisible(false, { animate: false });
      requestAnimationFrame(() => {
        fitRoutes();
        setTimeout(fitRoutes, 180);
      });
    }

    function motionDelay(duration) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
      return new Promise(resolve => {
        roundTransitionTimer = window.setTimeout(resolve, duration);
      });
    }

    async function playRoundTransition(nextRoundIndex, earnedMilestone) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const panelWasCollapsed = state.panelCollapsed;
      state.roundTransitioning = true;
      els.questionCard.classList.add('is-round-transitioning');
      els.questionCard.classList.add('is-question-switching');
      els.cardHeader.classList.add('is-round-complete');
      els.questionCard.setAttribute('aria-busy', 'true');
      els.roundComplete.setAttribute('aria-hidden', 'false');
      els.roundComplete.classList.add('is-visible');

      const routeExit = state.mapAdapter.setRoutesVisible(false, {
        animate: !reduceMotion,
        duration: 180
      });
      await Promise.all([routeExit, motionDelay(200)]);

      if (state.roundIndex >= state.totalRounds - 1) state.totalRounds += 5;
      await loadRound(nextRoundIndex, {
        deferRouteReveal: true,
        panelCollapsed: panelWasCollapsed
      });
      els.questionCard.classList.remove('is-question-switching');
      await motionDelay(140);
      await state.mapAdapter.setRoutesVisible(true, {
        animate: !reduceMotion,
        duration: 260
      });
      await motionDelay(320);

      els.roundComplete.classList.remove('is-visible');
      els.roundComplete.setAttribute('aria-hidden', 'true');
      state.roundTransitioning = false;
      els.questionCard.classList.remove('is-question-switching');
      els.questionCard.classList.remove('is-round-transitioning');
      els.cardHeader.classList.remove('is-round-complete');
      els.questionCard.removeAttribute('aria-busy');
      if (earnedMilestone) showMedalUnlock(earnedMilestone);
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
      if (step === 'q3') {
        return !!els.form.querySelector('input[name="q3Issues"]:checked');
      }
      return false;
    }

    function updateQuestionFlow() {
      const selected = els.form.querySelector('input[name="q1Choice"]:checked')?.value;
      const sequence = getQuestionSequence();
      if (!sequence.includes(state.questionStep)) state.questionStep = sequence[0];
      const stepIndex = sequence.indexOf(state.questionStep);
      els.q1.hidden = state.questionStep !== 'q1';
      els.q2.hidden = state.questionStep !== 'q2';
      els.q3.hidden = state.questionStep !== 'q3';
      els.panelQuestion.textContent = QUESTION_COPY[state.questionStep];
      syncCollapsedContextToggle();
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
      const hasQ3Selection = !!els.form.querySelector('input[name="q3Issues"]:checked');
      els.q3NoteWrap.hidden = !hasQ3Selection;
      els.q3Note.disabled = !hasQ3Selection;
      requestAnimationFrame(updateQuestionOverflow);
    }

    function setContextExpanded(expanded) {
      els.contextToggle.setAttribute('aria-expanded', String(expanded));
      els.collapsedContextToggle.setAttribute('aria-expanded', String(expanded));
      els.contextCopy.hidden = !expanded;
      requestAnimationFrame(updateQuestionOverflow);
    }

    function syncCollapsedContextToggle() {
      const isQ1 = state.questionStep === 'q1';
      const isAvailable = isQ1 && state.panelCollapsed;
      els.collapsedContextToggle.hidden = !isQ1;
      els.collapsedContextToggle.tabIndex = isAvailable ? 0 : -1;
      els.collapsedContextToggle.setAttribute('aria-hidden', String(!isAvailable));
      els.collapsedContextToggle.setAttribute('aria-expanded', els.contextToggle.getAttribute('aria-expanded'));
    }

    function resetQuestionScroll() {
      els.form.scrollTop = 0;
      els.questionScroll.scrollTop = 0;
    }

    function updateQuestionOverflow() {
      const scroll = els.questionScroll;
      const overflows = scroll.scrollHeight > scroll.clientHeight + 1;
      const atEnd = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2;
      scroll.classList.toggle('has-scroll-overflow', overflows);
      scroll.classList.toggle('is-at-scroll-end', !overflows || atEnd);
    }

    function getExpandedFormHeight() {
      const cardStyles = getComputedStyle(els.questionCard);
      const formStyles = getComputedStyle(els.form);
      const actions = els.form.querySelector('.ari-actions');
      const actionStyles = actions ? getComputedStyle(actions) : null;
      const actionHeight = actions
        ? actions.offsetHeight
          + Number.parseFloat(actionStyles.marginTop || 0)
          + Number.parseFloat(actionStyles.marginBottom || 0)
        : 0;
      const formGap = Number.parseFloat(formStyles.rowGap || formStyles.gap || 0);
      const contentHeight = els.questionScroll.scrollHeight + actionHeight + formGap;
      const maxHeight = Number.parseFloat(cardStyles.maxHeight);
      if (!Number.isFinite(maxHeight)) return contentHeight;

      const headerStyles = getComputedStyle(els.cardHeader);
      const occupiedHeight = els.cardHeader.offsetHeight
        + Number.parseFloat(headerStyles.marginTop || 0)
        + Number.parseFloat(headerStyles.marginBottom || 0)
        + Number.parseFloat(cardStyles.paddingTop || 0)
        + Number.parseFloat(cardStyles.paddingBottom || 0);

      return Math.min(contentHeight, Math.max(0, maxHeight - occupiedHeight));
    }

    function updatePanelState(collapsed, { animate = false } = {}) {
      const form = els.form;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      state.panelCollapsed = collapsed;
      els.questionCard.classList.toggle('is-collapsed', collapsed);

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
          els.questionScroll.classList.remove('has-scroll-overflow');
          els.questionScroll.classList.add('is-at-scroll-end');
          form.style.transition = 'none';
          form.style.height = 'auto';
          form.style.overflow = 'hidden';
          form.style.opacity = '0';
          const targetH = getExpandedFormHeight();
          form.style.height = '0';
          void form.offsetHeight;
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
            requestAnimationFrame(updateQuestionOverflow);
          }
          form.addEventListener('transitionend', onHeightDone);
        }
      } else {
        form.style.height = collapsed ? '0' : '';
        form.style.overflow = collapsed ? 'hidden' : '';
        form.style.opacity = '';
        form.style.transition = '';
      }

      els.form.toggleAttribute('inert', collapsed);
      els.form.setAttribute('aria-hidden', String(collapsed));
      els.panelToggle.setAttribute('aria-expanded', String(!collapsed));
      els.panelToggle.setAttribute('aria-label', collapsed ? 'Expand question panel' : 'Minimize question panel');
      els.panelToggle.setAttribute('title', collapsed ? 'Expand question panel' : 'Minimize question panel');
      syncCollapsedContextToggle();
      if (!collapsed) {
        requestAnimationFrame(updateQuestionOverflow);
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

    function showMedalUnlock(milestone) {
      if (!milestone || !els.hudMedals) return;
      window.clearTimeout(medalUnlockTimer);
      const tier = milestone.tier || Math.max(1, milestones.indexOf(milestone) + 1);
      const icon = els.hudMedals.querySelector('[data-hud-unlock-icon]');
      const name = els.hudMedals.querySelector('[data-hud-unlock-name]');
      const copy = els.hudMedals.querySelector('.ari-hud-unlock-copy');
      if (!icon || !name || !copy) return;
      els.hudMedals.dataset.medalTier = String(tier);
      icon.innerHTML = milestone.icon || MEDAL_UNLOCK_FALLBACK_ICON;
      name.textContent = milestone.name;
      copy.setAttribute('aria-hidden', 'false');
      els.hudMedals.setAttribute('aria-label', `${milestone.name} medal unlocked. ${els.hudMedals.dataset.progressLabel}`);
      els.hudMedals.classList.remove('is-unlocking');
      els.cardHeader.classList.remove('is-medal-unlocking');
      void els.hudMedals.offsetWidth;
      els.hudMedals.classList.add('is-unlocking');
      els.cardHeader.classList.add('is-medal-unlocking');
      medalUnlockTimer = window.setTimeout(() => {
        els.hudMedals.classList.remove('is-unlocking');
        els.cardHeader.classList.remove('is-medal-unlocking');
        copy.setAttribute('aria-hidden', 'true');
        els.hudMedals.setAttribute('aria-label', els.hudMedals.dataset.progressLabel || 'Medal progress');
      }, 2300);
    }

    function readProgress() {
      const savedAt = new Date().toISOString();
      return {
        v: 1,
        type: 'bench-progress',
        test: 'calm_vs_fast',
        source: 'calm-benchmark',
        benchmarkRunId: state.sessionId,
        sessionId: state.sessionId,
        sessionStartedAt: state.sessionStartedAt,
        participantName: state.participantName,
        roundIndex: state.roundIndex,
        completedRounds: state.completedRounds,
        pairId: state.pair?.pairId,
        routeAssignment: state.assignment,
        questionStep: state.questionStep,
        partialAnswer: readAnswer(savedAt),
        savedAt
      };
    }

    function getRouteLabel(slot) {
      const routeType = slot === 'A' ? state.assignment.routeA : state.assignment.routeB;
      const route = state.pair.routes[routeType];
      return {
        routeId: route.routeId,
        routeType,
        source: route.source || null,
        metadata: route.metadata || null
      };
    }

    function readAnswer(createdAt = new Date().toISOString()) {
      const form = new FormData(els.form);
      const q1Choice = form.get('q1Choice');
      const q2Separate = form.get('q2Separate') || null;
      const q3Issues = form.getAll('q3Issues');
      const roundId = `${state.sessionId}-round-${state.roundIndex + 1}`;
      return {
        v: 1,
        type: 'bench-ux',
        test: 'calm_vs_fast',
        source: 'calm-benchmark',
        captureId: roundId,
        benchmarkRunId: state.sessionId,
        sessionId: state.sessionId,
        sessionStartedAt: state.sessionStartedAt,
        roundId,
        roundNumber: state.roundIndex + 1,
        pairId: state.pair.pairId,
        participantName: state.participantName,
        rater: state.participantName,
        routeAssignment: state.assignment,
        routeAType: state.assignment.routeA,
        routeBType: state.assignment.routeB,
        labelMap: { A: state.assignment.routeA, B: state.assignment.routeB },
        labels: { A: getRouteLabel('A'), B: getRouteLabel('B') },
        origin: state.pair.origin,
        destination: state.pair.destination,
        q1Choice,
        choice: q1Choice,
        q2Separate,
        q3Issues,
        reasons: [...q3Issues],
        q3Note: form.get('q3Note') || '',
        note: '',
        clientTs: createdAt,
        createdAt
      };
    }

    function restorePartialAnswer(answer) {
      if (!answer) return;
      const values = {
        q1Choice: answer.q1Choice || answer.choice || null,
        q2Separate: answer.q2Separate || null
      };
      Object.entries(values).forEach(([name, value]) => {
        els.form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
          input.checked = input.value === value;
        });
      });
      const selectedIssues = new Set(answer.q3Issues || answer.reasons || []);
      els.form.querySelectorAll('input[name="q3Issues"]').forEach(input => {
        input.checked = selectedIssues.has(input.value);
      });
      els.q3Note.value = answer.q3Note || answer.note || '';
    }

    async function loadRound(index, {
      deferRouteReveal = false,
      panelCollapsed = true,
      routeAssignment = null,
      questionStep = 'q1',
      partialAnswer = null,
      expectedPairId = null
    } = {}) {
      state.roundIndex = index;
      if (state.onboardingComplete && els.onboarding) els.onboarding.hidden = true;
      if (state.roundIndex > 0) {
        state.onboardingComplete = true;
        if (els.onboarding) els.onboarding.hidden = true;
      }
      state.assignment = routeAssignment || randomAssignment();
      state.pair = await routePairProvider({
        sessionId: state.sessionId,
        roundIndex: state.roundIndex
      });
      if (expectedPairId && state.pair.pairId !== expectedPairId) {
        throw new Error(`Saved pair ${expectedPairId} does not match loaded pair ${state.pair.pairId}.`);
      }
      updateProgressHud();
      state.questionStep = questionStep;
      state.streetViewPoint = null;
      els.streetCard.hidden = true;
      els.form.reset();
      restorePartialAnswer(partialAnswer);
      resetQuestionScroll();
      els.contextToggle.setAttribute('aria-expanded', 'false');
      els.contextCopy.hidden = true;
      updatePanelState(panelCollapsed);
      updateQuestionFlow();
      drawRoutes(state.pair, { hidden: deferRouteReveal });
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
    els.q3Note.addEventListener('input', () => {
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
        resetQuestionScroll();
        updateQuestionFlow();
        autosave();
        return;
      }

      els.submit.disabled = true;
      try {
        await answerSink(readAnswer());
      } catch (error) {
        console.error('Could not save calm benchmark answer.', error);
        updateQuestionFlow();
        return;
      }
      state.completedRounds += 1;
      const earnedMilestone = getEarnedMilestone(state.completedRounds, milestones);
      if (!canContinueAfterCurrentRound()) {
        els.submit.textContent = 'Complete';
      } else {
        await playRoundTransition(state.roundIndex + 1, earnedMilestone);
      }
      if (earnedMilestone && !canContinueAfterCurrentRound()) showMedalUnlock(earnedMilestone);
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

    els.contextToggle.addEventListener('click', () => {
      const expanded = els.contextToggle.getAttribute('aria-expanded') === 'true';
      setContextExpanded(!expanded);
    });

    els.collapsedContextToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setContextExpanded(true);
      updatePanelState(false, { animate: true });
    });

    els.cardHeader.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="exit"]')) return;
      if (e.target.closest('[data-action="toggle-panel"]')) return;
      if (!state.panelCollapsed) updatePanelState(true, { animate: true });
    });

    els.questionCard.addEventListener('click', (e) => {
      if (!state.panelCollapsed) return;
      if (e.target.closest('[data-action="toggle-panel"]')) return;
      if (e.target.closest('[data-action="open-context"]')) return;
      if (e.target.closest('[data-action="exit"]')) return;
      updatePanelState(false, { animate: true });
    });

    els.questionScroll.addEventListener('scroll', updateQuestionOverflow, { passive: true });
    const questionResizeObserver = new ResizeObserver(updateQuestionOverflow);
    questionResizeObserver.observe(els.questionScroll);
    Array.from(els.questionScroll.children).forEach(child => questionResizeObserver.observe(child));

    els.previous.addEventListener('click', () => {
      const sequence = getQuestionSequence();
      const stepIndex = sequence.indexOf(state.questionStep);
      if (stepIndex > 0) {
        state.questionStep = sequence[stepIndex - 1];
        resetQuestionScroll();
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
      requestAnimationFrame(updateQuestionOverflow);
    }, { signal: resizeController.signal });

    loadRound(state.roundIndex, {
      panelCollapsed: !options.initialPanelExpanded,
      routeAssignment: options.initialRouteAssignment || null,
      questionStep: options.initialQuestionStep || 'q1',
      partialAnswer: options.initialPartialAnswer || null,
      expectedPairId: options.initialPairId || null
    });

    function unmount() {
      window.clearTimeout(medalUnlockTimer);
      window.clearTimeout(roundTransitionTimer);
      resizeController.abort();
      questionResizeObserver.disconnect();
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
      consoleProgressSink,
      getHudDialProgress,
      getEarnedMilestone
    };
})();
