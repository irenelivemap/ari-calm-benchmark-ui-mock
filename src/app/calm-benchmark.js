(function () {
  const DEFAULT_TOTAL_ROUNDS = 10;
  const ROUTE_SLOTS = [
    { slot: 'A', key: 'routeA', value: 'route_a', className: 'ari-choice--route-a' },
    { slot: 'B', key: 'routeB', value: 'route_b', className: 'ari-choice--route-b' },
    { slot: 'C', key: 'routeC', value: 'route_c', className: 'ari-choice--route-c' }
  ];

  const CHOICE_ICONS = {
    longer_time: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 2.5"/></svg>`,
    unnecessary_detour: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15V9a4 4 0 0 1 8 0"/><polyline points="10,5 13,9 10,13"/></svg>`,
    misses_shortcut: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="11,2 6,10 11,10 6,16"/></svg>`,
    too_complex: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v5"/><path d="M9 7l-5 7"/><path d="M9 7l5 7"/></svg>`,
    crossing_friction: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="1.5" width="7" height="15" rx="2"/><circle cx="9" cy="5.5" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="9" cy="12.5" r="1.5"/></svg>`,
    too_busy_or_crowded: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><path d="M2 15c0-2.5 1.8-4 4-4s4 1.5 4 4"/><path d="M8 15c0-2.5 1.8-4 4-4s4 1.5 4 4"/></svg>`,
    misses_nicer_route: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 15C9 15 3 11 3 6a6 6 0 0 1 12 0c0 5-6 9-6 9z"/><path d="M9 8v7"/></svg>`,
    may_not_be_walkable: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="7"/><line x1="4.5" y1="13.5" x2="13.5" y2="4.5"/></svg>`,
    other: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="none" aria-hidden="true"><circle cx="5" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="13" cy="9" r="1.2" fill="currentColor"/></svg>`,
    not_sure: `<svg class="ari-choice-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5A2.5 2.5 0 0 1 12 7c0 2-3 2.5-3 5"/><circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none"/></svg>`,
  };

  // Keywords to bold within option.label — array so variants with different
  // wording (e.g. "Takes longer" vs "Take too long") are both covered.
  const CHOICE_BOLD_KEYWORDS = {
    longer_time:         ['too long', 'longer'],
    unnecessary_detour:  ['unnecessary detour'],
    misses_shortcut:     ['useful shortcut'],
    too_complex:         ['hard to follow'],
    crossing_friction:   ['difficult street crossings'],
    too_busy_or_crowded: ['crowded areas'],
    misses_nicer_route:  ['pleasant route'],
    may_not_be_walkable: ['not be walkable'],
  };

  function boldKeyword(label, keywords) {
    const list = Array.isArray(keywords) ? keywords : keywords ? [keywords] : [];
    for (const kw of list) {
      const i = label.toLowerCase().indexOf(kw.toLowerCase());
      if (i !== -1) {
        return escapeHtml(label.slice(0, i))
          + '<strong class="ari-choice-anchor">' + escapeHtml(label.slice(i, i + kw.length)) + '</strong>'
          + escapeHtml(label.slice(i + kw.length));
      }
    }
    return escapeHtml(label);
  }
  const ROUTE_FIT_MAX_ZOOM = 19;
  const DEFAULT_QUESTION_COPY = {
    q1: 'Which route would you choose for this calm walk?',
    q2: 'Is it worth showing both routes as separate options, one Fast and one Calm?',
    q3: 'What made the route option(s) less suitable for a calmer walk?'
  };

  const DEFAULT_BENCHMARK_CONFIG = {
    testId: 'calm_vs_fast',
    source: 'calm-benchmark',
    sessionPrefix: 'calm-session',
    ariaLabel: 'ARI calm route benchmark',
    routeTypes: ['fast', 'calm'],
    questions: DEFAULT_QUESTION_COPY,
    context: {
      label: 'What do we mean by calm?',
      copy: 'A quieter route for when you want to slow down. More greenery, paths near water, and quieter streets.'
    },
    q1Options: [
      { value: 'route_a', label: 'Route A', className: 'ari-choice--route-a' },
      { value: 'route_b', label: 'Route B', className: 'ari-choice--route-b' },
      { value: 'either', label: 'Both work well' },
      { value: 'neither', label: 'Neither works' },
      { value: 'hard_to_judge', label: 'Hard to judge' }
    ],
    q1Multiple: false,
    q2Options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: 'Not sure' }
    ],
    q3Options: [
      { value: 'not_enough_greenery_water', label: 'Not enough greenery or water' },
      { value: 'too_busy_or_crowded', label: 'Too busy or crowded' },
      { value: 'lacks_nice_streets_surroundings', label: 'Lacks nice streets or surroundings' },
      { value: 'extra_time_distance_not_worth_it', label: 'Extra time/distance not worth it' },
      { value: 'too_similar', label: 'Too similar to the other route' },
      { value: 'too_complex', label: 'Too complex to follow' },
      { value: 'other', label: 'Other' }
    ],
    followUps: {
      route_a: ['q2', 'q3'],
      route_b: ['q2', 'q3'],
      either: ['q2'],
      neither: ['q3'],
      hard_to_judge: []
    },
    uncertainChoices: ['hard_to_judge'],
    showRouteMetrics: false
  };

  const MEDAL_UNLOCK_FALLBACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const demoPairs = window.AriCalmBenchmarkMockRoutePairs || [];

  const routeAColor = '#C84720';
  const routeBColor = '#08784D';
  const routeCColor = '#2864C7';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeBenchmarkConfig(config = {}) {
    config = config || {};
    return {
      ...DEFAULT_BENCHMARK_CONFIG,
      ...config,
      questions: { ...DEFAULT_QUESTION_COPY, ...(config.questions || {}) },
      context: config.context === null
        ? null
        : { ...DEFAULT_BENCHMARK_CONFIG.context, ...(config.context || {}) },
      routeTypes: Array.isArray(config.routeTypes) && [2, 3].includes(config.routeTypes.length)
        ? [...config.routeTypes]
        : [...DEFAULT_BENCHMARK_CONFIG.routeTypes],
      q1Options: Array.isArray(config.q1Options) ? config.q1Options : DEFAULT_BENCHMARK_CONFIG.q1Options,
      q1Multiple: config.q1Multiple === true,
      q2Options: Array.isArray(config.q2Options) ? config.q2Options : DEFAULT_BENCHMARK_CONFIG.q2Options,
      q3Options: Array.isArray(config.q3Options) ? config.q3Options : DEFAULT_BENCHMARK_CONFIG.q3Options,
      q3Variants: config.q3Variants && typeof config.q3Variants === 'object' ? config.q3Variants : {},
      followUps: { ...DEFAULT_BENCHMARK_CONFIG.followUps, ...(config.followUps || {}) },
      uncertainChoices: Array.isArray(config.uncertainChoices)
        ? config.uncertainChoices
        : DEFAULT_BENCHMARK_CONFIG.uncertainChoices
    };
  }

  function renderChoiceOptions(options, { name, type = 'radio', withRouteMetrics = false }) {
    return options.map(option => {
      const className = option.className ? ` class="${escapeHtml(option.className)}"` : '';
      const exclusive = type === 'checkbox' && option.exclusive ? ' data-exclusive-choice' : '';
      const routeOption = ROUTE_SLOTS.find(slot => slot.value === option.value);
      const metricsSlot = withRouteMetrics && routeOption
        ? `<span class="ari-choice-metrics" data-route-metrics="${routeOption.slot.toLowerCase()}" hidden></span>`
        : '';
      const icon = type === 'checkbox' ? CHOICE_ICONS[option.value] : null;
      const keyword = type === 'checkbox' ? CHOICE_BOLD_KEYWORDS[option.value] : null;
      const labelContent = icon
        ? `${icon}<span class="ari-choice-body">${boldKeyword(option.label, keyword)}</span>`
        : `${escapeHtml(option.label)}${metricsSlot}`;
      return `<label${className}><input type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}"${exclusive}>${labelContent}</label>`;
    }).join('');
  }

  /** Distance only — durations come from each provider's own speed model and
   *  are not comparable claims. Identical rounding for both routes so the
   *  number cannot fingerprint the source: 0.1 km, 10 m steps below ~1 km. */
  function formatRouteMetrics(metadata) {
    if (!metadata || !Number.isFinite(metadata.distanceMeters)) return '';
    return metadata.distanceMeters >= 950
      ? `${(metadata.distanceMeters / 1000).toFixed(1)} km`
      : `${Math.round(metadata.distanceMeters / 10) * 10} m`;
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function randomAssignment(routeTypes = DEFAULT_BENCHMARK_CONFIG.routeTypes) {
    const shuffled = [...routeTypes];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return Object.fromEntries(
      ROUTE_SLOTS.slice(0, shuffled.length).map(({ key }, index) => [key, shuffled[index]])
    );
  }

  function createMockRoutePairProvider(pairs, label = 'mock route pairs') {
    return function mockProvider({ roundIndex }) {
      if (!pairs.length) {
        return Promise.reject(new Error(`No ${label} loaded. Include route-pair data or provide routePairProvider.`));
      }
      const base = pairs[roundIndex % pairs.length];
      return Promise.resolve({
        ...base,
        pairId: `${base.pairId}-round-${roundIndex + 1}`
      });
    };
  }

  const mockRoutePairProvider = createMockRoutePairProvider(demoPairs, 'calm mock route pairs');

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

  function buildShell(root, totalRounds, benchmark) {
    const onboardingMaskId = createId('ari-onboarding-mask');
    const contextId = createId('ari-route-context');
    const streetViewerId = createId('ari-street-viewer');
    const routeCountLabel = benchmark.routeTypes.length === 3 ? 'all three routes' : 'both routes';
    const contextSummaryMarkup = benchmark.context ? `
      <button class="ari-context-toggle ari-context-toggle--summary" data-action="open-context" type="button" aria-expanded="false" aria-controls="${contextId}" aria-label="${escapeHtml(benchmark.context.label)}" title="${escapeHtml(benchmark.context.label)}"><span aria-hidden="true">i</span></button>` : '';
    const contextToggleMarkup = benchmark.context ? `
      <button class="ari-context-toggle" data-action="toggle-context" type="button" aria-expanded="false" aria-controls="${contextId}" aria-label="${escapeHtml(benchmark.context.label)}" title="${escapeHtml(benchmark.context.label)}"><span aria-hidden="true">i</span></button>` : '';
    const contextCopyMarkup = benchmark.context ? `
      <div class="ari-context-copy" id="${contextId}" data-context-copy hidden>
        <p>${escapeHtml(benchmark.context.copy)}</p>
      </div>` : '';
    root.innerHTML = `
      <section class="ari-benchmark" aria-label="${escapeHtml(benchmark.ariaLabel)}">
        <main class="ari-benchmark__grid">
          <section class="ari-map-card" aria-label="Route map">
            <div class="ari-map" data-map>
              <div class="ari-map__canvas" data-map-canvas aria-label="Interactive route comparison map"></div>
              <div class="ari-map__tools" aria-label="Map tools">
                <button class="ari-icon-btn ari-icon-btn--street ari-street-toggle" data-action="toggle-street-view" type="button" aria-label="Turn on Street View" title="Street View — inspect any map point at street level" aria-controls="${streetViewerId}" aria-pressed="false">
                  <span class="ari-street-toggle__label" data-street-toggle-label aria-hidden="true">Street View</span>
                  <span class="ari-street-toggle__glyph" aria-hidden="true">360°</span>
                </button>
                <div class="ari-map__navigation" role="group" aria-label="Map navigation">
                  <button class="ari-icon-btn ari-icon-btn--fit" data-action="fit-routes" type="button" aria-label="Fit ${routeCountLabel}" title="Fit ${routeCountLabel}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <polyline points="9 3 9 9 3 9"></polyline>
                      <polyline points="15 3 15 9 21 9"></polyline>
                      <polyline points="9 21 9 15 3 15"></polyline>
                      <polyline points="15 21 15 15 21 15"></polyline>
                    </svg>
                  </button>
                  <button class="ari-icon-btn ari-icon-btn--zoom" data-action="zoom-in" type="button" aria-label="Zoom in" title="Zoom in"><span aria-hidden="true">+</span></button>
                  <button class="ari-icon-btn ari-icon-btn--zoom" data-action="zoom-out" type="button" aria-label="Zoom out" title="Zoom out"><span aria-hidden="true">−</span></button>
                </div>
              </div>
              <div class="ari-street-mode-hint" data-street-mode-hint role="status" hidden>
                <strong>Street View mode on</strong>
                <span>Select any point on the map to explore it in Street View.</span>
              </div>
              <div class="ari-street-divider" data-street-divider role="separator" tabindex="0" aria-label="Resize the Street View split" title="Double-click to reset split" hidden><span aria-hidden="true"></span></div>
              <section class="ari-street-viewer" id="${streetViewerId}" data-street-viewer aria-label="Street View" aria-hidden="true" hidden>
                <header class="ari-street-viewer__header">
                  <button class="ari-street-viewer__back" data-action="close-street-view" type="button" aria-label="Close Street View">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                    <span>Close</span>
                  </button>
                  <div class="ari-street-viewer__identity">
                    <small>Street View</small>
                    <strong data-street-route>Route A</strong>
                  </div>
                </header>
                <div class="ari-street-viewer__body">
                  <div class="ari-street-panorama" data-street-panorama></div>
                  <div class="ari-street-status" data-street-status role="status">
                    <span class="ari-street-status__loader" aria-hidden="true"></span>
                    <b data-street-status-title>Loading Street View</b>
                    <span data-street-status-copy>Looking for imagery near this point.</span>
                    <button class="ari-street-status__dismiss" data-action="close-street-view" type="button">Close Street View</button>
                  </div>
                </div>
              </section>
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
              <b data-panel-question>${escapeHtml(benchmark.questions.q1)}</b>
              ${contextSummaryMarkup}
            </div>
            <div class="ari-system-status" data-system-status role="status" hidden>
              <span data-system-status-copy></span>
              <button type="button" data-action="retry-system" hidden>Retry</button>
              <button type="button" data-action="exit-system" hidden>Exit</button>
            </div>
            <form class="ari-question-stack" data-form>
              <div class="ari-question-scroll" data-question-scroll>
                <section class="ari-question-block" data-q1>
                <fieldset>
                  <legend>
                    <span>${escapeHtml(benchmark.questions.q1)}</span>
                    ${contextToggleMarkup}
                  </legend>
                  ${contextCopyMarkup}
                  ${benchmark.q1Multiple ? '<p class="ari-question-hint" id="ari-q1-hint">Select all that apply.</p>' : ''}
                  <div class="ari-choice-grid ari-choice-grid--two${benchmark.q1Multiple ? ' ari-choice-grid--multiple' : ''}"${benchmark.q1Multiple ? ' aria-describedby="ari-q1-hint"' : ''}>
                    ${renderChoiceOptions(benchmark.q1Options, {
                      name: 'q1Choice',
                      type: benchmark.q1Multiple ? 'checkbox' : 'radio',
                      withRouteMetrics: benchmark.showRouteMetrics
                    })}
                  </div>
                </fieldset>
                </section>

                <section class="ari-question-block" data-q2 hidden>
                <fieldset>
                  <legend>${escapeHtml(benchmark.questions.q2)}</legend>
                  <div class="ari-choice-grid">
                    ${renderChoiceOptions(benchmark.q2Options, { name: 'q2Separate' })}
                  </div>
                </fieldset>
                </section>

                <section class="ari-question-block" data-q3 hidden>
                <fieldset>
                  <legend data-q3-question>${escapeHtml(benchmark.questions.q3)}</legend>
                  <p class="ari-question-hint" id="ari-q3-hint">Select all that apply.</p>
                  <div class="ari-choice-grid" data-q3-grid data-variant-key="default" aria-describedby="ari-q3-hint">
                    ${renderChoiceOptions(benchmark.q3Options, { name: 'q3Issues', type: 'checkbox' })}
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
            <section class="ari-goal-checkpoint" data-goal-checkpoint role="dialog" aria-labelledby="ari-goal-checkpoint-title" hidden>
              <p>Goal complete</p>
              <h2 id="ari-goal-checkpoint-title">10 comparisons saved.</h2>
              <span>Your answers are saved. You can finish now or keep comparing.</span>
              <div class="ari-goal-checkpoint__actions">
                <button class="ari-btn ari-btn--primary" data-action="end-session" type="button">End session</button>
                <button class="ari-btn ari-btn--secondary" data-action="continue-session" type="button">Keep comparing</button>
              </div>
            </section>
          </aside>
        </main>

        <section class="ari-onboarding" data-onboarding role="dialog" aria-modal="true" aria-labelledby="ari-onboarding-title" data-step="0">
          <h2 class="ari-visually-hidden" id="ari-onboarding-title">Before you start</h2>
          <svg class="ari-onboarding__scrim" data-onboarding-scrim aria-hidden="true">
            <defs>
              <mask id="${onboardingMaskId}" maskUnits="userSpaceOnUse">
                <rect data-onboarding-mask-base x="0" y="0" fill="white"></rect>
                <rect data-onboarding-cutout="street" fill="black"></rect>
                <rect data-onboarding-cutout="answer" fill="black"></rect>
              </mask>
            </defs>
            <rect data-onboarding-scrim-fill x="0" y="0" mask="url(#${onboardingMaskId})"></rect>
          </svg>

          <div class="ari-onboarding__target" data-onboarding-target="street" aria-hidden="true"></div>
          <div class="ari-onboarding__target" data-onboarding-target="answer" aria-hidden="true"></div>

          <div class="ari-onboarding__intro ari-onboarding__intro--briefing" data-onboarding-panel="-1">
            <div class="ari-onboarding__panel-header">
              <button class="ari-onboarding__close" data-action="skip-onboarding" type="button" aria-label="Skip intro">&times;</button>
            </div>
            <b>Before you start</b>
            <span>Imagine you are on your way somewhere in Zürich. You are not in a rush, but you still want to arrive in a reasonable amount of time. You would prefer a calmer way to get there.</span>
            <span>A Calm route may take you along quieter streets, through greener areas, or near water. For each trip, you'll see two routes with the same start and destination. Compare them and choose the answer that best matches what you would do.</span>
            <button class="ari-onboarding__next" data-action="next-onboarding" type="button">Got it →</button>
          </div>

          <div class="ari-onboarding__intro" data-onboarding-panel="0">
            <div class="ari-onboarding__panel-header">
              <button class="ari-onboarding__close" data-action="skip-onboarding" type="button" aria-label="Skip intro">&times;</button>
              <p class="ari-onboarding__step-count" aria-label="Step 1 of 3">1 / 3</p>
            </div>
            <b>Compare the routes</b>
            <span>These are your ${routeCountLabel}. Explore the map before you decide — pan, zoom, or use Street View.</span>
            <button class="ari-onboarding__next" data-action="next-onboarding" type="button">Next →</button>
          </div>

          <div class="ari-onboarding__coachmark" data-onboarding-coachmark="answer" data-onboarding-panel="1" hidden aria-hidden="true">
            <div class="ari-onboarding__panel-header">
              <button class="ari-onboarding__close" data-action="skip-onboarding" type="button" aria-label="Skip intro">&times;</button>
              <p class="ari-onboarding__step-count" aria-label="Step 2 of 3">2 / 3</p>
            </div>
            <b>Choose when ready</b>
            <span>Open this panel and pick the route or routes you prefer.</span>
            <button class="ari-onboarding__next" data-action="next-onboarding" type="button">Next →</button>
          </div>

          <div class="ari-onboarding__coachmark" data-onboarding-coachmark="street" data-onboarding-panel="2" hidden aria-hidden="true">
            <div class="ari-onboarding__panel-header">
              <button class="ari-onboarding__close" data-action="skip-onboarding" type="button" aria-label="Skip intro">&times;</button>
              <p class="ari-onboarding__step-count" aria-label="Step 3 of 3">3 / 3</p>
            </div>
            <b>Explore the street</b>
            <span>Turn on Street View and tap any point on the map to look around before choosing.</span>
            <button class="ari-onboarding__next" data-action="next-onboarding" type="button">Start comparison →</button>
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
    const useMapLibre = !useGoogleMaps && requestedProvider === 'maplibre' && mapTools.hasMapLibre();
    if (!useGoogleMaps && !useMapLibre && !window.L) {
      throw new Error('AriCalmBenchmark requires Leaflet on window.L, MapLibre on window.maplibregl, or Google Maps on window.google.maps, before mounting.');
    }

    const benchmark = normalizeBenchmarkConfig(options.benchmark);

    const initialRoundIndex = options.initialRoundIndex || 0;
    const initialTotalRounds = Math.max(options.totalRounds || DEFAULT_TOTAL_ROUNDS, initialRoundIndex + 1);
    const state = {
      sessionId: options.sessionId || createId(benchmark.sessionPrefix),
      sessionStartedAt: options.sessionStartedAt || new Date().toISOString(),
      participantName: options.participantName || '',
      roundIndex: initialRoundIndex,
      totalRounds: initialTotalRounds,
      pair: null,
      assignment: null,
      questionStep: 'q1',
      onboardingComplete: !!options.skipOnboarding || initialRoundIndex > 0,
      onboardingStep: -1,
      completedRounds: options.initialCompletedRounds || 0,
      goalCheckpointPending: !!options.initialGoalCheckpointPending,
      roundTransitioning: false,
      loadingRound: false,
      loadError: null,
      panelCollapsed: false,
      panelCollapsedBeforeStreetView: null,
      mapAdapter: null,
      mapProvider: useGoogleMaps ? 'google' : useMapLibre ? 'maplibre' : 'leaflet',
      streetViewMode: false,
      streetViewOpen: false,
      streetViewPoint: null,
      streetViewRoute: null,
      streetViewService: null,
      streetViewPanorama: null
    };

    const routePairProvider = options.routePairProvider || mockRoutePairProvider;
    const answerSink = options.answerSink || consoleAnswerSink;
    const progressSink = options.progressSink || consoleProgressSink;
    const onExit = typeof options.onExit === 'function' ? options.onExit : null;
    const milestones = Array.isArray(options.milestones) ? options.milestones : [];
    buildShell(root, state.totalRounds, benchmark);

    const els = {
      benchmark: root.querySelector('.ari-benchmark'),
      mapShell: root.querySelector('[data-map]'),
      cardHeader: root.querySelector('.ari-card-header'),
      hudMedals: root.querySelector('[data-hud-medals]'),
      roundComplete: root.querySelector('[data-round-complete]'),
      mapCanvas: root.querySelector('[data-map-canvas]'),
      onboarding: root.querySelector('[data-onboarding]'),
      onboardingMaskBase: root.querySelector('[data-onboarding-mask-base]'),
      onboardingScrimFill: root.querySelector('[data-onboarding-scrim-fill]'),
      onboardingCutouts: Array.from(root.querySelectorAll('[data-onboarding-cutout]')),
      onboardingTargets: Array.from(root.querySelectorAll('[data-onboarding-target]')),
      onboardingCoachmarks: Array.from(root.querySelectorAll('[data-onboarding-coachmark]')),
      onboardingPanels: Array.from(root.querySelectorAll('[data-onboarding-panel]')),
      onboardingSkip: root.querySelector('.ari-onboarding__close'),
      saveFlash: root.querySelector('[data-save-flash]'),
      systemStatus: root.querySelector('[data-system-status]'),
      systemStatusCopy: root.querySelector('[data-system-status-copy]'),
      retrySystem: root.querySelector('[data-action="retry-system"]'),
      exitSystem: root.querySelector('[data-action="exit-system"]'),
      questionCard: root.querySelector('[data-question-card]'),
      panelToggle: root.querySelector('[data-action="toggle-panel"]'),
      panelQuestion: root.querySelector('[data-panel-question]'),
      collapsedContextToggle: root.querySelector('[data-action="open-context"]'),
      form: root.querySelector('[data-form]'),
      questionScroll: root.querySelector('[data-question-scroll]'),
      q1: root.querySelector('[data-q1]'),
      q2: root.querySelector('[data-q2]'),
      q3: root.querySelector('[data-q3]'),
      q3Question: root.querySelector('[data-q3-question]'),
      q3Grid: root.querySelector('[data-q3-grid]'),
      q3NoteWrap: root.querySelector('[data-q3-note]'),
      q3Note: root.querySelector('textarea[name="q3Note"]'),
      contextToggle: root.querySelector('[data-action="toggle-context"]'),
      contextCopy: root.querySelector('[data-context-copy]'),
      submit: root.querySelector('[data-submit]'),
      exit: root.querySelector('[data-action="exit"]'),
      previous: root.querySelector('[data-action="previous"]'),
      mapTools: root.querySelector('.ari-map__tools'),
      fitRoutes: root.querySelector('[data-action="fit-routes"]'),
      streetViewToggle: root.querySelector('[data-action="toggle-street-view"]'),
      streetViewToggleLabel: root.querySelector('[data-street-toggle-label]'),
      zoomIn: root.querySelector('[data-action="zoom-in"]'),
      zoomOut: root.querySelector('[data-action="zoom-out"]'),
      streetViewHint: root.querySelector('[data-street-mode-hint]'),
      streetDivider: root.querySelector('[data-street-divider]'),
      streetViewer: root.querySelector('[data-street-viewer]'),
      streetPanorama: root.querySelector('[data-street-panorama]'),
      streetStatus: root.querySelector('[data-street-status]'),
      streetStatusTitle: root.querySelector('[data-street-status-title]'),
      streetStatusCopy: root.querySelector('[data-street-status-copy]'),
      streetRoute: root.querySelector('[data-street-route]'),
      closeStreetView: root.querySelector('[data-action="close-street-view"]'),
      goalCheckpoint: root.querySelector('[data-goal-checkpoint]'),
      endSession: root.querySelector('[data-action="end-session"]'),
      continueSession: root.querySelector('[data-action="continue-session"]')
    };

    let medalUnlockTimer = null;
    let roundTransitionTimer = null;
    let streetViewCloseTimer = null;
    let streetViewPositionListener = null;
    let streetViewPovListener = null;
    let streetViewRequestId = 0;
    let systemRetry = null;

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

    function clearSystemStatus() {
      const restoreFocus = els.systemStatus.contains(document.activeElement);
      systemRetry = null;
      els.systemStatus.hidden = true;
      els.retrySystem.hidden = true;
      els.exitSystem.hidden = true;
      els.systemStatus.classList.remove('is-error', 'is-loading');
      els.systemStatus.setAttribute('role', 'status');
      if (restoreFocus) requestAnimationFrame(() => els.panelToggle.focus({ preventScroll: true }));
    }

    function showSystemStatus(copy, {
      kind = 'error',
      retry = null,
      allowExit = false
    } = {}) {
      systemRetry = retry;
      els.systemStatusCopy.textContent = copy;
      els.systemStatus.classList.toggle('is-error', kind === 'error');
      els.systemStatus.classList.toggle('is-loading', kind === 'loading');
      els.systemStatus.setAttribute('role', kind === 'error' ? 'alert' : 'status');
      els.retrySystem.hidden = typeof retry !== 'function';
      els.exitSystem.hidden = !allowExit;
      els.systemStatus.hidden = false;
    }

    function setRoundBusy(busy) {
      state.loadingRound = busy;
      els.questionCard.toggleAttribute('aria-busy', busy);
      els.form.toggleAttribute('inert', busy || state.panelCollapsed || state.goalCheckpointPending);
      if (busy) {
        showSystemStatus('Loading this comparison…', { kind: 'loading' });
      }
    }

    state.mapAdapter = mapTools.createMapAdapter({
      canvas: els.mapCanvas,
      provider: state.mapProvider,
      routeAColor,
      routeBColor,
      routeCColor,
      maxFitZoom: ROUTE_FIT_MAX_ZOOM,
      toolsElement: els.mapTools,
      onRoutePointClick: setStreetViewPoint
    });

    function getRouteFitPadding() {
      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      if (state.streetViewOpen) {
        // Split layout: the canvas is already resized to the map column. On
        // desktop the question card overlays the top of that column, so keep
        // the routes clear of it (capped so an expanded card cannot squeeze
        // the fit into nothing).
        if (isMobile) {
          return {
            google: 16,
            maplibre: 16,
            leaflet: { padding: [16, 16], maxZoom: ROUTE_FIT_MAX_ZOOM }
          };
        }
        const cardHeight = els.questionCard.getBoundingClientRect().height || 0;
        const mapHeight = els.mapCanvas.getBoundingClientRect().height || 0;
        const top = Math.round(Math.min(cardHeight + 40, Math.max(120, mapHeight * 0.4)));
        return {
          google: { top, right: 32, bottom: 32, left: 32 },
          maplibre: { top, right: 32, bottom: 32, left: 32 },
          leaflet: {
            paddingTopLeft: [32, top],
            paddingBottomRight: [32, 32],
            maxZoom: ROUTE_FIT_MAX_ZOOM
          }
        };
      }
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
            maplibre: { top, right, bottom, left },
            leaflet: {
              paddingTopLeft: [left, top],
              paddingBottomRight: [right, bottom],
              maxZoom: ROUTE_FIT_MAX_ZOOM
            }
          };
        }

        return {
          google: edgePadding,
          maplibre: edgePadding,
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
        maplibre: {
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

    function fitRoutes({ animate = true } = {}) {
      state.mapAdapter.fitRoutes(getRouteFitPadding(), { animate });
    }

    function getOnboardingRect(target) {
      if (!target) return null;
      if (typeof target.left === 'number') return target;
      if (typeof target.getBoundingClientRect === 'function') return target.getBoundingClientRect();
      return null;
    }

    function expandRect(rect, padding) {
      return new DOMRect(
        rect.left - padding,
        rect.top - padding,
        rect.width + padding * 2,
        rect.height + padding * 2
      );
    }

    function rectanglesOverlap(a, b, gap = 10) {
      return !(
        a.right + gap <= b.left ||
        a.left >= b.right + gap ||
        a.bottom + gap <= b.top ||
        a.top >= b.bottom + gap
      );
    }

    function placeOnboardingCoachmark(coachmark, targetRect, preferredPlacements, occupied, bounds) {
      const gap = 18;
      const margin = 14;
      const coachRect = coachmark.getBoundingClientRect();
      const width = coachRect.width;
      const height = coachRect.height;
      const centerX = targetRect.left + targetRect.width / 2;
      const centerY = targetRect.top + targetRect.height / 2;
      const positions = {
        right: { left: targetRect.right + gap, top: centerY - height / 2 },
        left: { left: targetRect.left - width - gap, top: centerY - height / 2 },
        bottom: { left: centerX - width / 2, top: targetRect.bottom + gap },
        top: { left: centerX - width / 2, top: targetRect.top - height - gap }
      };

      const candidates = preferredPlacements.map(placement => {
        const position = positions[placement];
        const left = Math.max(margin, Math.min(bounds.width - width - margin, position.left));
        const top = Math.max(margin, Math.min(bounds.height - height - margin, position.top));
        const rect = { left, top, right: left + width, bottom: top + height };
        const collisions = occupied.filter(item => rectanglesOverlap(rect, item)).length;
        const displacement = Math.abs(left - position.left) + Math.abs(top - position.top);
        return { placement, left, top, rect, score: collisions * 10000 + displacement };
      });
      const chosen = candidates.sort((a, b) => a.score - b.score)[0];

      coachmark.dataset.placement = chosen.placement;
      coachmark.style.setProperty('--coach-left', `${chosen.left}px`);
      coachmark.style.setProperty('--coach-top', `${chosen.top}px`);
      occupied.push(chosen.rect);
    }

    function positionOnboarding() {
      if (state.onboardingComplete || els.onboarding.hidden) return;
      const step = state.onboardingStep;
      const overlayRect = els.onboarding.getBoundingClientRect();
      if (!overlayRect.width || !overlayRect.height) return;
      els.onboardingMaskBase.setAttribute('width', String(overlayRect.width));
      els.onboardingMaskBase.setAttribute('height', String(overlayRect.height));
      els.onboardingScrimFill.setAttribute('width', String(overlayRect.width));
      els.onboardingScrimFill.setAttribute('height', String(overlayRect.height));

      // Hide all targets and clear all cutouts
      els.onboardingTargets.forEach(t => { t.hidden = true; });
      els.onboardingCutouts.forEach(cutout => {
        cutout.setAttribute('width', '0');
        cutout.setAttribute('height', '0');
      });

      // Steps -1 and 0 are full-screen cards — no spotlight needed
      if (step <= 0) return;

      const stepTargetName = step === 1 ? 'answer' : 'street';
      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      const preferences = isMobile
        ? { answer: ['top', 'right', 'left'], street: ['right', 'left', 'bottom', 'top'] }
        : { answer: ['right', 'top', 'bottom'], street: ['right', 'left', 'bottom', 'top'] };
      const sourceEl = step === 1 ? els.questionCard : els.streetViewToggle;
      const sourceRect = getOnboardingRect(sourceEl);
      const target = els.onboardingTargets.find(item => item.dataset.onboardingTarget === stepTargetName);
      const cutout = els.onboardingCutouts.find(item => item.dataset.onboardingCutout === stepTargetName);
      if (!sourceRect || !target || !cutout) return;
      target.hidden = false;

      const padding = stepTargetName === 'answer' ? 6 : 8;
      const expanded = expandRect(new DOMRect(
        sourceRect.left - overlayRect.left,
        sourceRect.top - overlayRect.top,
        sourceRect.width,
        sourceRect.height
      ), padding);

      target.style.setProperty('--target-left', `${expanded.left}px`);
      target.style.setProperty('--target-top', `${expanded.top}px`);
      target.style.setProperty('--target-width', `${expanded.width}px`);
      target.style.setProperty('--target-height', `${expanded.height}px`);
      target.dataset.kind = stepTargetName;
      cutout.setAttribute('x', String(expanded.left));
      cutout.setAttribute('y', String(expanded.top));
      cutout.setAttribute('width', String(expanded.width));
      cutout.setAttribute('height', String(expanded.height));
      cutout.setAttribute('rx', String(stepTargetName === 'street' ? expanded.width / 2 : 12));
      cutout.setAttribute('ry', String(stepTargetName === 'street' ? expanded.height / 2 : 12));

      const coachmark = els.onboardingCoachmarks.find(item => item.dataset.onboardingCoachmark === stepTargetName);
      if (!coachmark) return;
      placeOnboardingCoachmark(coachmark, expanded, preferences[stepTargetName], [expanded], overlayRect);
    }

    function getActiveOnboardingPanel() {
      return els.onboardingPanels.find(p => Number(p.dataset.onboardingPanel) === state.onboardingStep) || null;
    }

    function renderOnboarding() {
      if (state.onboardingComplete || els.onboarding.hidden) return;
      els.mapShell.inert = true;
      els.questionCard.inert = true;
      updatePanelState(true);
      state.onboardingStep = -1;
      els.onboarding.dataset.step = '-1';
      els.onboardingPanels.forEach(panel => {
        const active = Number(panel.dataset.onboardingPanel) === -1;
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', String(!active));
      });
      requestAnimationFrame(() => {
        positionOnboarding();
        getActiveOnboardingPanel()?.querySelector('[data-action="next-onboarding"]')?.focus({ preventScroll: true });
      });
      setTimeout(positionOnboarding, 240);
      // The map tools are adopted into the provider's control container once
      // the map is ready (async for MapLibre); reposition after that settles.
      setTimeout(positionOnboarding, 1200);
      setTimeout(positionOnboarding, 2600);
    }

    function advanceOnboarding() {
      const TOTAL_STEPS = 3;
      state.onboardingStep += 1;
      if (state.onboardingStep >= TOTAL_STEPS) {
        finishOnboarding();
        return;
      }
      els.onboarding.dataset.step = String(state.onboardingStep);
      els.onboardingPanels.forEach(panel => {
        const active = Number(panel.dataset.onboardingPanel) === state.onboardingStep;
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', String(!active));
      });
      requestAnimationFrame(() => {
        positionOnboarding();
        getActiveOnboardingPanel()?.querySelector('[data-action="next-onboarding"]')?.focus({ preventScroll: true });
      });
      setTimeout(positionOnboarding, 240);
    }

    function finishOnboarding() {
      state.onboardingComplete = true;
      els.onboarding.hidden = true;
      els.mapShell.inert = false;
      els.questionCard.inert = false;
      updatePanelState(false, { animate: true });
      requestAnimationFrame(() => els.panelToggle.focus({ preventScroll: true }));
    }

    const SPLIT_STORAGE_KEY = 'ari-benchmark-street-split-v1';
    let splitResizeFrame = null;
    let splitTween = null;

    function isMobileViewport() {
      return window.matchMedia('(max-width: 700px)').matches;
    }

    function readStoredSplit() {
      try {
        return JSON.parse(localStorage.getItem(SPLIT_STORAGE_KEY) || '{}') || {};
      } catch (_) {
        return {};
      }
    }

    function writeStoredSplit(stored) {
      try {
        localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(stored));
      } catch (_) { /* private mode: the split simply resets next visit */ }
    }

    function applyStoredSplit() {
      els.mapShell.style.removeProperty('--ari-sv-split');
      els.mapShell.style.removeProperty('--ari-sv-split-m');
      const stored = readStoredSplit();
      if (Number.isFinite(stored.desktop)) {
        els.mapShell.style.setProperty('--ari-sv-split', `${stored.desktop}%`);
      }
      if (Number.isFinite(stored.mobile)) {
        els.mapShell.style.setProperty('--ari-sv-split-m', `${stored.mobile}%`);
      }
    }

    /** Tween the split seam like an automated drag: the same live provider
     *  resizes per frame that manual dragging uses. */
    function animateSplitShare(from, to, duration, onDone) {
      cancelSplitTween();
      const prop = isMobileViewport() ? '--ari-sv-split-m' : '--ari-sv-split';
      const startedAt = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 4);
      const step = now => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const value = from + (to - from) * ease(progress);
        els.mapShell.style.setProperty(prop, `${value}%`);
        state.mapAdapter?.notifyResize();
        if (progress < 1) {
          splitTween = requestAnimationFrame(step);
        } else {
          splitTween = null;
          if (onDone) onDone();
        }
      };
      splitTween = requestAnimationFrame(step);
    }

    function cancelSplitTween() {
      if (!splitTween) return;
      cancelAnimationFrame(splitTween);
      splitTween = null;
    }

    function clampPanoShare(share, mobile) {
      if (mobile) return Math.min(70, Math.max(30, share));
      const width = els.mapShell.getBoundingClientRect().width || 1200;
      const maxShare = Math.min(85, 100 - (440 / width) * 100);
      return Math.min(maxShare, Math.max(40, share));
    }

    function currentPanoShare(mobile) {
      const inline = parseFloat(els.mapShell.style.getPropertyValue(mobile ? '--ari-sv-split-m' : '--ari-sv-split'));
      if (Number.isFinite(inline)) return inline;
      if (mobile) return 58;
      return window.matchMedia('(max-width: 1100px)').matches ? 55 : 65;
    }

    function scheduleSplitResize() {
      if (splitResizeFrame) return;
      splitResizeFrame = requestAnimationFrame(() => {
        splitResizeFrame = null;
        state.mapAdapter?.notifyResize();
      });
    }

    function settleSplitPanorama() {
      if (state.streetViewPanorama && window.google?.maps?.event) {
        google.maps.event.trigger(state.streetViewPanorama, 'resize');
      }
    }

    function setPanoShare(share, { persist = false } = {}) {
      const mobile = isMobileViewport();
      const clamped = clampPanoShare(share, mobile);
      els.mapShell.style.setProperty(mobile ? '--ari-sv-split-m' : '--ari-sv-split', `${clamped}%`);
      els.streetDivider.setAttribute('aria-valuenow', String(Math.round(clamped)));
      scheduleSplitResize();
      if (persist) {
        const stored = readStoredSplit();
        stored[mobile ? 'mobile' : 'desktop'] = Math.round(clamped * 10) / 10;
        writeStoredSplit(stored);
      }
      return clamped;
    }

    function resetSplit() {
      const mobile = isMobileViewport();
      els.mapShell.style.removeProperty(mobile ? '--ari-sv-split-m' : '--ari-sv-split');
      const stored = readStoredSplit();
      delete stored[mobile ? 'mobile' : 'desktop'];
      writeStoredSplit(stored);
      els.streetDivider.setAttribute('aria-valuenow', String(Math.round(currentPanoShare(mobile))));
      scheduleSplitResize();
      settleSplitPanorama();
    }

    function syncSplitDivider() {
      const mobile = isMobileViewport();
      els.streetDivider.setAttribute('aria-orientation', mobile ? 'horizontal' : 'vertical');
      els.streetDivider.setAttribute('aria-valuemin', mobile ? '30' : '40');
      const desktopWidth = els.mapShell.getBoundingClientRect().width || 1200;
      const desktopMax = Math.floor(Math.min(85, 100 - (440 / desktopWidth) * 100));
      els.streetDivider.setAttribute('aria-valuemax', String(mobile ? 70 : desktopMax));
      els.streetDivider.setAttribute('aria-valuenow', String(Math.round(currentPanoShare(mobile))));
    }

    function hideStreetHint() {
      els.streetViewHint.hidden = true;
    }

    function showStreetHint() {
      els.streetViewHint.hidden = false;
    }

    function updateStreetViewModeUi() {
      const enabled = state.streetViewMode;
      els.streetViewToggle.classList.toggle('is-active', enabled);
      els.streetViewToggle.setAttribute('aria-pressed', String(enabled));
      els.streetViewToggle.setAttribute(
        'aria-label',
        enabled
          ? 'Street View mode on. Select any point on the map to explore it in Street View. Keyboard users can press A, B, or C to inspect a representative route point. Press again to turn off.'
          : 'Turn on Street View'
      );
      els.streetViewToggle.title = enabled ? 'Turn off Street View (or press Esc)' : 'Street View — inspect any map point at street level';
      els.streetViewToggleLabel.textContent = enabled ? 'Exit Street View' : 'Street View';
      if (enabled && !state.streetViewOpen) {
        if (els.streetViewHint.hidden) showStreetHint();
      } else {
        hideStreetHint();
      }
      state.mapAdapter.setStreetViewEnabled(enabled);
    }

    function setStreetViewMode(enabled) {
      state.streetViewMode = !!enabled;
      if (!state.streetViewMode) {
        state.streetViewPoint = null;
        state.streetViewRoute = null;
        state.mapAdapter.clearStreetViewPosition();
      }
      updateStreetViewModeUi();
    }

    function setStreetViewStatus(title, copy, { loading = false, visible = true } = {}) {
      els.streetStatusTitle.textContent = title;
      els.streetStatusCopy.textContent = copy;
      els.streetStatus.classList.toggle('is-loading', loading);
      els.streetStatus.hidden = !visible;
      if (!loading && visible && title) {
        requestAnimationFrame(() => els.closeStreetView.focus({ preventScroll: true }));
      }
    }

    function showStreetViewer() {
      window.clearTimeout(streetViewCloseTimer);
      const alreadySplit = els.mapShell.classList.contains('is-street-split');
      const viewStateBeforeSplit = alreadySplit ? null : state.mapAdapter.getViewState();
      if (!alreadySplit) {
        state.panelCollapsedBeforeStreetView = state.panelCollapsed;
        updatePanelState(true, { animate: true });
      }
      els.mapShell.classList.add('is-street-split');
      els.benchmark.classList.add('is-street-view-open');
      els.streetDivider.hidden = false;
      syncSplitDivider();
      els.streetViewer.hidden = false;
      els.streetViewer.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => els.streetViewer.classList.add('is-visible'));
      requestAnimationFrame(() => els.closeStreetView.focus({ preventScroll: true }));
      if (!alreadySplit) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobile = isMobileViewport();
        const targetShare = currentPanoShare(mobile);
        if (reduceMotion) {
          requestAnimationFrame(() => {
            state.mapAdapter.notifyResize();
            if (viewStateBeforeSplit) state.mapAdapter.restoreViewState(viewStateBeforeSplit);
          });
        } else {
          // The seam glides open: the panorama takes its room in one motion.
          els.mapShell.style.setProperty(mobile ? '--ari-sv-split-m' : '--ari-sv-split', '0%');
          animateSplitShare(0, targetShare, 320, () => {
            state.mapAdapter.notifyResize();
            if (viewStateBeforeSplit) state.mapAdapter.restoreViewState(viewStateBeforeSplit);
            settleSplitPanorama();
          });
        }
      }
    }

    function removeStreetViewPositionListener() {
      if (!streetViewPositionListener && !streetViewPovListener) return;
      if (window.google?.maps?.event) {
        if (streetViewPositionListener) window.google.maps.event.removeListener(streetViewPositionListener);
        if (streetViewPovListener) window.google.maps.event.removeListener(streetViewPovListener);
      }
      streetViewPositionListener = null;
      streetViewPovListener = null;
    }

    function finalizeSplitTeardown() {
      els.mapShell.classList.remove('is-street-split');
      els.benchmark.classList.remove('is-street-view-open');
      els.streetDivider.hidden = true;
      els.streetViewer.classList.remove('is-visible');
      els.streetViewer.hidden = true;
      applyStoredSplit();
      if (state.panelCollapsedBeforeStreetView === false) {
        updatePanelState(false, { animate: true });
      }
      state.panelCollapsedBeforeStreetView = null;
    }

    function closeStreetView({ immediate = false, restoreMap = true, restoreFocus = true, deactivate = false } = {}) {
      streetViewRequestId += 1;
      removeStreetViewPositionListener();
      cancelSplitTween();
      if (state.streetViewPanorama) state.streetViewPanorama.setVisible(false);
      state.streetViewOpen = false;
      state.streetViewPoint = null;
      state.streetViewRoute = null;
      state.mapAdapter.clearStreetViewPosition();
      const wasSplit = els.mapShell.classList.contains('is-street-split');
      els.streetViewer.setAttribute('aria-hidden', 'true');
      window.clearTimeout(streetViewCloseTimer);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const savedMapState = restoreMap ? state.mapAdapter.getViewState() : null;
      if (deactivate) setStreetViewMode(false);
      else updateStreetViewModeUi();
      if (restoreFocus) requestAnimationFrame(() => els.streetViewToggle.focus({ preventScroll: true }));

      if (!wasSplit || immediate || reduceMotion) {
        finalizeSplitTeardown();
        if (wasSplit || savedMapState) {
          requestAnimationFrame(() => {
            if (!state.mapAdapter) return;
            if (wasSplit) state.mapAdapter.notifyResize();
            if (savedMapState) state.mapAdapter.restoreViewState(savedMapState);
          });
        }
        return;
      }

      // The seam glides shut: the map takes the room back in one continuous
      // motion, then the camera eases home instead of teleporting.
      animateSplitShare(currentPanoShare(isMobileViewport()), 0, 300, () => {
        finalizeSplitTeardown();
        if (!state.mapAdapter) return;
        state.mapAdapter.notifyResize();
        if (savedMapState) state.mapAdapter.restoreViewState(savedMapState, { animate: true });
      });
    }

    function openStreetView(point) {
      if (!point || !state.streetViewMode) return;
      const requestId = ++streetViewRequestId;
      state.streetViewPoint = { lat: Number(point.lat), lng: Number(point.lng) };
      state.streetViewRoute = ['routeA', 'routeB', 'routeC'].includes(point.routeKey)
        ? point.routeKey
        : null;
      state.streetViewOpen = true;
      els.streetViewer.dataset.route = state.streetViewRoute === 'routeB'
        ? 'b'
        : state.streetViewRoute === 'routeC' ? 'c'
          : state.streetViewRoute === 'routeA' ? 'a' : 'map';
      els.streetRoute.textContent = state.streetViewRoute === 'routeB'
        ? 'Route B'
        : state.streetViewRoute === 'routeC' ? 'Route C'
          : state.streetViewRoute === 'routeA' ? 'Route A' : 'Map point';
      state.mapAdapter.setStreetViewPosition(state.streetViewPoint, state.streetViewRoute);
      setStreetViewStatus('Loading Street View', 'Looking for imagery near this point.', { loading: true });
      showStreetViewer();
      updateStreetViewModeUi();

      const maps = window.google?.maps;
      if (!maps?.StreetViewService || !maps?.StreetViewPanorama) {
        setStreetViewStatus(
          'Street View unavailable',
          'Google imagery is not configured in this preview. Your map position is preserved.',
          { loading: false }
        );
        return;
      }

      state.streetViewService ||= new maps.StreetViewService();
      const okStatus = maps.StreetViewStatus?.OK || 'OK';
      const zeroStatus = maps.StreetViewStatus?.ZERO_RESULTS || 'ZERO_RESULTS';
      // Search close-by outdoor imagery first, then widen once before giving
      // up so clicks on quiet segments still land on the nearest covered street.
      const searchAttempts = [
        { radius: 80, outdoorOnly: true },
        { radius: 250, outdoorOnly: false }
      ];

      const requestPanorama = attemptIndex => {
        const attempt = searchAttempts[attemptIndex];
        const request = { location: state.streetViewPoint, radius: attempt.radius };
        if (maps.StreetViewPreference?.NEAREST) request.preference = maps.StreetViewPreference.NEAREST;
        if (attempt.outdoorOnly && maps.StreetViewSource?.OUTDOOR) request.source = maps.StreetViewSource.OUTDOOR;

        state.streetViewService.getPanorama(request, (data, status) => {
        if (requestId !== streetViewRequestId || !state.streetViewOpen) return;
        if (status !== okStatus || !data?.location?.latLng) {
          if (attemptIndex < searchAttempts.length - 1) {
            requestPanorama(attemptIndex + 1);
            return;
          }
          console.warn(`[ARI street view] getPanorama returned "${status}" near`, state.streetViewPoint);
          if (status === zeroStatus) {
            setStreetViewStatus(
              'No imagery near this point',
              'Select another point on the map, or go back to continue exploring.',
              { loading: false }
            );
          } else {
            setStreetViewStatus(
              'Street View could not load here',
              'Select another point on the map, or go back to continue exploring.',
              { loading: false }
            );
          }
          return;
        }

        if (!state.streetViewPanorama) {
          state.streetViewPanorama = new maps.StreetViewPanorama(els.streetPanorama, {
            addressControl: false,
            clickToGo: true,
            enableCloseButton: false,
            fullscreenControl: false,
            linksControl: true,
            motionTracking: false,
            motionTrackingControl: false,
            panControl: true,
            scrollwheel: true,
            visible: true,
            zoomControl: true
          });
        }

        if (data.location.pano) state.streetViewPanorama.setPano(data.location.pano);
        state.streetViewPanorama.setPosition(data.location.latLng);
        state.streetViewPanorama.setPov({ heading: 0, pitch: 0 });
        state.streetViewPanorama.setVisible(true);
        maps.event.trigger(state.streetViewPanorama, 'resize');
        setStreetViewStatus('', '', { visible: false });
        removeStreetViewPositionListener();
        streetViewPositionListener = state.streetViewPanorama.addListener('position_changed', () => {
          const position = state.streetViewPanorama.getPosition();
          if (!position) return;
          state.mapAdapter.setStreetViewPosition(
            { lat: position.lat(), lng: position.lng() },
            state.streetViewRoute
          );
        });
        streetViewPovListener = state.streetViewPanorama.addListener('pov_changed', () => {
          const pov = state.streetViewPanorama.getPov();
          if (pov) state.mapAdapter.setStreetViewHeading(pov.heading ?? 0);
        });
        state.mapAdapter.setStreetViewHeading(state.streetViewPanorama.getPov()?.heading ?? 0);
        });
      };

      requestPanorama(0);
    }

    function setStreetViewPoint(point) {
      if (!state.streetViewMode) return;
      openStreetView(point);
    }

    function drawRoutes(pair, { hidden = false } = {}) {
      state.mapAdapter.drawRoutes(pair, state.assignment);
      if (hidden) state.mapAdapter.setRoutesVisible(false, { animate: false });
      requestAnimationFrame(() => {
        fitRoutes({ animate: state.onboardingComplete });
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
      const loaded = await loadRound(nextRoundIndex, {
        deferRouteReveal: true,
        panelCollapsed: panelWasCollapsed
      });
      if (!loaded) {
        state.roundTransitioning = false;
        els.questionCard.classList.remove('is-question-switching', 'is-round-transitioning');
        els.cardHeader.classList.remove('is-round-complete');
        els.roundComplete.classList.remove('is-visible');
        els.roundComplete.setAttribute('aria-hidden', 'true');
        return false;
      }
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
      return true;
    }

    function getQ1Choices() {
      return Array.from(
        els.form.querySelectorAll('input[name="q1Choice"]:checked'),
        input => input.value
      );
    }

    function getSelectedRouteKeys() {
      const selectedChoices = new Set(getQ1Choices());
      return ROUTE_SLOTS
        .slice(0, benchmark.routeTypes.length)
        .filter(slot => selectedChoices.has(slot.value))
        .map(slot => slot.key);
    }

    function getQ1Choice() {
      const choices = getQ1Choices();
      if (choices.length > 1) return 'multiple_routes';
      return choices[0] || null;
    }

    function getQuestionSequence() {
      const choices = getQ1Choices();
      if (benchmark.q1Multiple) {
        const selectedRoutes = choices.filter(choice => choice.startsWith('route_'));
        const needsQ3 = choices.includes('none_work_well')
          || (selectedRoutes.length > 0 && selectedRoutes.length < benchmark.routeTypes.length);
        return ['q1', ...(needsQ3 ? ['q3'] : [])];
      }
      return ['q1', ...(benchmark.followUps[choices[0]] || [])];
    }

    function getQ3Variant() {
      let variantKey;
      if (benchmark.q1Multiple) {
        const choices = getQ1Choices();
        variantKey = choices.includes('none_work_well') ? 'none_work_well' : null;
      } else {
        variantKey = getQ1Choice();
      }
      const variant = variantKey ? benchmark.q3Variants[variantKey] : null;
      return variant
        ? {
            key: variantKey,
            question: variant.question || benchmark.questions.q3,
            options: Array.isArray(variant.options) ? variant.options : benchmark.q3Options
          }
        : {
            key: 'default',
            question: benchmark.questions.q3,
            options: benchmark.q3Options
          };
    }

    function q3QuestionHtml(q1Choice, fallback) {
      if (benchmark.routeTypes.length === 2 && q1Choice === 'route_a') {
        return 'What made <span class="ari-q3-route-tag ari-q3-route-tag--b">Route B</span> worse?';
      }
      if (benchmark.routeTypes.length === 2 && q1Choice === 'route_b') {
        return 'What made <span class="ari-q3-route-tag ari-q3-route-tag--a">Route A</span> worse?';
      }
      if (benchmark.routeTypes.length === 3) {
        const selectedRoutes = new Set(getQ1Choices().filter(choice => choice.startsWith('route_')));
        const unselected = ROUTE_SLOTS
          .slice(0, benchmark.routeTypes.length)
          .filter(slot => !selectedRoutes.has(slot.value));
        if (selectedRoutes.size === 2 && unselected.length === 1) {
          const route = unselected[0];
          return `What made <span class="ari-q3-route-tag ari-q3-route-tag--${route.slot.toLowerCase()}">Route ${route.slot}</span> less suitable?`;
        }
      }
      return escapeHtml(fallback);
    }

    function syncQ3Variant() {
      const variant = getQ3Variant();
      const q1 = getQ1Choice();
      if (benchmark.routeTypes.length === 3) {
        const selectedRoutes = new Set(getQ1Choices().filter(choice => choice.startsWith('route_')));
        const unselected = ROUTE_SLOTS
          .slice(0, benchmark.routeTypes.length)
          .filter(slot => !selectedRoutes.has(slot.value));
        els.q3Grid.dataset.worseRoute = q1 === 'none_work_well'
          ? 'all'
          : unselected.length === 1 ? unselected[0].slot.toLowerCase() : 'others';
      } else {
        els.q3Grid.dataset.worseRoute = q1 === 'route_a'
          ? 'b'
          : q1 === 'route_b' ? 'a' : q1 === 'both_work_poorly' ? 'both' : '';
      }
      if (els.q3Grid.dataset.variantKey !== variant.key) {
        const selectedIssues = new Set(
          Array.from(els.q3Grid.querySelectorAll('input[name="q3Issues"]:checked'), input => input.value)
        );
        els.q3Grid.innerHTML = renderChoiceOptions(variant.options, { name: 'q3Issues', type: 'checkbox' });
        els.q3Grid.querySelectorAll('input[name="q3Issues"]').forEach(input => {
          input.checked = selectedIssues.has(input.value);
        });
        els.q3Grid.dataset.variantKey = variant.key;
      }
      els.q3Question.innerHTML = q3QuestionHtml(q1, variant.question);
      return variant;
    }

    function isStepComplete(step) {
      if (step === 'q1') return getQ1Choices().length > 0;
      if (step === 'q2') return !!els.form.querySelector('input[name="q2Separate"]:checked');
      if (step === 'q3') {
        return !!els.form.querySelector('input[name="q3Issues"]:checked');
      }
      return false;
    }

    function updateQuestionFlow() {
      const selected = getQ1Choice();
      const selectedChoices = getQ1Choices();
      const sequence = getQuestionSequence();
      const q3Variant = syncQ3Variant();
      if (!sequence.includes(state.questionStep)) state.questionStep = sequence[0];
      const stepIndex = sequence.indexOf(state.questionStep);
      els.q1.hidden = state.questionStep !== 'q1';
      els.q2.hidden = state.questionStep !== 'q2';
      els.q3.hidden = state.questionStep !== 'q3';
      els.panelQuestion.innerHTML = state.questionStep === 'q3'
        ? q3QuestionHtml(getQ1Choice(), q3Variant.question)
        : escapeHtml(benchmark.questions[state.questionStep]);
      syncCollapsedContextToggle();
      els.previous.hidden = stepIndex === 0;
      els.previous.disabled = stepIndex === 0;
      els.submit.disabled = !isStepComplete(state.questionStep);
      if (state.questionStep === 'q1' && !selectedChoices.length) {
        els.submit.textContent = 'Next question →';
      } else if (stepIndex < sequence.length - 1) {
        els.submit.textContent = 'Next question →';
      } else if (canContinueAfterCurrentRound()) {
        els.submit.textContent = selectedChoices.some(choice => benchmark.uncertainChoices.includes(choice))
          ? 'Next round →'
          : 'Finish round →';
      } else {
        els.submit.textContent = 'Finish test →';
      }
      els.form.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input');
        label.classList.toggle('is-selected', !!input && input.checked);
      });
      state.mapAdapter.setSelectedRoutes(
        state.questionStep === 'q1' ? getSelectedRouteKeys() : []
      );
      const hasQ3Selection = !!els.form.querySelector('input[name="q3Issues"]:checked');
      els.q3NoteWrap.hidden = !hasQ3Selection;
      els.q3Note.disabled = !hasQ3Selection;
      requestAnimationFrame(updateQuestionOverflow);
    }

    function setContextExpanded(expanded) {
      if (!els.contextToggle || !els.contextCopy) return;
      els.contextToggle.setAttribute('aria-expanded', String(expanded));
      els.collapsedContextToggle?.setAttribute('aria-expanded', String(expanded));
      els.contextCopy.hidden = !expanded;
      requestAnimationFrame(updateQuestionOverflow);
    }

    function syncCollapsedContextToggle() {
      if (!els.collapsedContextToggle || !els.contextToggle) return;
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

      els.form.toggleAttribute('inert', collapsed || state.loadingRound || state.goalCheckpointPending);
      els.form.setAttribute('aria-hidden', String(collapsed));
      els.panelToggle.setAttribute('aria-expanded', String(!collapsed));
      els.panelToggle.setAttribute('aria-label', collapsed ? 'Expand question panel' : 'Minimize question panel');
      els.panelToggle.setAttribute('title', collapsed ? 'Expand question panel' : 'Minimize question panel');
      syncCollapsedContextToggle();
      if (!collapsed) {
        requestAnimationFrame(updateQuestionOverflow);
      }
    }

    async function autosave({ announce = false } = {}) {
      try {
        await Promise.resolve(progressSink(readProgress()));
        if (els.systemStatus.classList.contains('is-error')) clearSystemStatus();
        if (announce) flashSaved();
        return true;
      } catch (error) {
        console.error('Could not sync benchmark progress.', error);
        showSystemStatus('Couldn’t sync. Your answers are still on this device.', {
          retry: () => autosave({ announce: true })
        });
        return false;
      }
    }

    function setGoalCheckpointVisible(visible, { focus = true } = {}) {
      state.goalCheckpointPending = !!visible;
      els.goalCheckpoint.hidden = !visible;
      els.panelQuestion.parentElement.hidden = visible;
      els.form.hidden = visible;
      els.panelToggle.disabled = visible;
      els.questionCard.classList.toggle('is-goal-checkpoint', visible);
      if (visible) {
        updatePanelState(false);
        els.form.inert = true;
        if (focus) requestAnimationFrame(() => els.endSession.focus({ preventScroll: true }));
      } else {
        els.form.hidden = false;
        els.panelQuestion.parentElement.hidden = false;
        els.form.inert = state.panelCollapsed || state.loadingRound;
        updateQuestionFlow();
      }
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
        test: benchmark.testId,
        source: benchmark.source,
        benchmarkRunId: state.sessionId,
        sessionId: state.sessionId,
        sessionStartedAt: state.sessionStartedAt,
        participantName: state.participantName,
        roundIndex: state.roundIndex,
        completedRounds: state.completedRounds,
        goalCheckpointPending: state.goalCheckpointPending,
        pairId: state.pair?.pairId,
        routeAssignment: state.assignment,
        questionStep: state.questionStep,
        partialAnswer: state.pair && state.assignment ? readAnswer(savedAt) : null,
        savedAt
      };
    }

    function getRouteLabel(slot) {
      const descriptor = ROUTE_SLOTS.find(routeSlot => routeSlot.slot === slot);
      const routeType = descriptor ? state.assignment[descriptor.key] : null;
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
      const q1Choices = form.getAll('q1Choice');
      const q1Choice = q1Choices.length > 1 ? 'multiple_routes' : q1Choices[0] || null;
      const q2Separate = form.get('q2Separate') || null;
      const q3Issues = form.getAll('q3Issues');
      const roundId = `${state.sessionId}-round-${state.roundIndex + 1}`;
      const activeSlots = ROUTE_SLOTS.filter(({ key }) => state.assignment[key]);
      const labelMap = Object.fromEntries(activeSlots.map(({ slot, key }) => [slot, state.assignment[key]]));
      const labels = Object.fromEntries(activeSlots.map(({ slot }) => [slot, getRouteLabel(slot)]));
      return {
        v: 1,
        type: 'bench-ux',
        test: benchmark.testId,
        source: benchmark.source,
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
        routeCType: state.assignment.routeC || null,
        labelMap,
        labels,
        origin: state.pair.origin,
        destination: state.pair.destination,
        q1Choice,
        choice: q1Choice,
        q1Choices,
        q2Separate,
        q3Issues,
        reasons: [...q3Issues],
        q3Note: form.get('q3Note') || '',
        note: '',
        metricsShown: !!benchmark.showRouteMetrics,
        clientTs: createdAt,
        createdAt
      };
    }

    function updateRouteMetrics() {
      if (!benchmark.showRouteMetrics || !state.pair || !state.assignment) return;
      ROUTE_SLOTS.forEach(({ slot, key }) => {
        const routeType = state.assignment[key];
        if (!routeType) return;
        const element = els.form.querySelector(`[data-route-metrics="${slot.toLowerCase()}"]`);
        if (!element) return;
        const text = formatRouteMetrics(state.pair.routes[routeType]?.metadata);
        element.textContent = text;
        element.hidden = !text;
      });
    }

    function restorePartialAnswer(answer) {
      if (!answer) return;
      const savedQ1Choices = Array.isArray(answer.q1Choices)
        ? answer.q1Choices
        : (answer.q1Choice || answer.choice) === 'all_three_work_well' && benchmark.q1Multiple
          ? ROUTE_SLOTS.slice(0, benchmark.routeTypes.length).map(slot => slot.value)
          : [answer.q1Choice || answer.choice].filter(Boolean);
      const selectedQ1Choices = new Set(savedQ1Choices);
      els.form.querySelectorAll('input[name="q1Choice"]').forEach(input => {
        input.checked = selectedQ1Choices.has(input.value);
      });
      els.form.querySelectorAll('input[name="q2Separate"]').forEach(input => {
        input.checked = input.value === (answer.q2Separate || null);
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
      const requestedAssignment = routeAssignment || randomAssignment(benchmark.routeTypes);
      const retry = () => loadRound(index, {
        deferRouteReveal,
        panelCollapsed,
        routeAssignment: requestedAssignment,
        questionStep,
        partialAnswer,
        expectedPairId
      });
      setRoundBusy(true);
      state.roundIndex = index;
      if (state.onboardingComplete && els.onboarding) els.onboarding.hidden = true;
      if (state.roundIndex > 0) {
        state.onboardingComplete = true;
        if (els.onboarding) els.onboarding.hidden = true;
      }
      state.assignment = requestedAssignment;
      state.pair = null;
      try {
        state.pair = await routePairProvider({
          sessionId: state.sessionId,
          roundIndex: state.roundIndex
        });
      } catch (error) {
        state.loadError = error;
        setRoundBusy(false);
        showSystemStatus('Couldn’t load this comparison. Check your connection and try again.', {
          retry,
          allowExit: true
        });
        console.error('Could not load benchmark comparison.', error);
        return false;
      }
      const recoveredFromError = !!state.loadError;
      state.loadError = null;
      setRoundBusy(false);
      clearSystemStatus();
      if (expectedPairId && state.pair.pairId !== expectedPairId) {
        // The route source changed under a saved session (e.g. fixtures were
        // replaced by live generation). The saved partial answer refers to a
        // pair the tester can no longer see, so restart this round on the new
        // pair instead of failing the whole benchmark.
        console.warn(`Saved pair ${expectedPairId} does not match loaded pair ${state.pair.pairId}; starting this round fresh.`);
        questionStep = 'q1';
        partialAnswer = null;
      }
      updateProgressHud();
      state.questionStep = questionStep;
      closeStreetView({ immediate: true, restoreMap: false, restoreFocus: false, deactivate: true });
      els.form.reset();
      updateRouteMetrics();
      restorePartialAnswer(partialAnswer);
      resetQuestionScroll();
      setContextExpanded(false);
      updatePanelState(panelCollapsed);
      updateQuestionFlow();
      drawRoutes(state.pair, { hidden: deferRouteReveal });
      setGoalCheckpointVisible(state.goalCheckpointPending);
      if (!state.onboardingComplete) {
        requestAnimationFrame(renderOnboarding);
      } else if (recoveredFromError && !state.goalCheckpointPending) {
        requestAnimationFrame(() => {
          const firstChoice = els.form.querySelector('input[name="q1Choice"]');
          firstChoice?.focus({ preventScroll: true });
        });
      }
      return true;
    }

    els.form.addEventListener('change', event => {
      const changedQ1 = event.target.closest?.('input[name="q1Choice"]');
      if (benchmark.q1Multiple && changedQ1?.checked) {
        const q1Inputs = els.form.querySelectorAll('input[name="q1Choice"]');
        if (changedQ1.hasAttribute('data-exclusive-choice')) {
          q1Inputs.forEach(input => {
            if (input !== changedQ1) input.checked = false;
          });
        } else {
          q1Inputs.forEach(input => {
            if (input.hasAttribute('data-exclusive-choice')) input.checked = false;
          });
        }
      }
      if (event.target.matches?.('input[name="q1Choice"]') && !getQuestionSequence().includes('q3')) {
        els.form.querySelectorAll('input[name="q3Issues"]').forEach(input => {
          input.checked = false;
        });
        els.q3Note.value = '';
      }
      const changedIssue = event.target.closest?.('input[name="q3Issues"]');
      if (changedIssue?.checked) {
        const issueInputs = els.form.querySelectorAll('input[name="q3Issues"]');
        if (changedIssue.hasAttribute('data-exclusive-choice')) {
          issueInputs.forEach(input => {
            if (input !== changedIssue) input.checked = false;
          });
        } else {
          issueInputs.forEach(input => {
            if (input.hasAttribute('data-exclusive-choice')) input.checked = false;
          });
        }
      }
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
        clearSystemStatus();
      } catch (error) {
        console.error('Could not save calm benchmark answer.', error);
        updateQuestionFlow();
        showSystemStatus('Couldn’t send this answer. It is still on this device.', {
          retry: () => els.form.requestSubmit()
        });
        return;
      }
      state.completedRounds += 1;
      if (state.completedRounds > 0 && state.completedRounds % 10 === 0) state.goalCheckpointPending = true;
      const earnedMilestone = getEarnedMilestone(state.completedRounds, milestones);
      if (!canContinueAfterCurrentRound()) {
        els.submit.textContent = 'Complete';
      } else {
        await playRoundTransition(state.roundIndex + 1, earnedMilestone);
      }
      if (earnedMilestone && !canContinueAfterCurrentRound()) showMedalUnlock(earnedMilestone);
      if (state.goalCheckpointPending && state.pair) {
        setGoalCheckpointVisible(true);
      }
      autosave({ announce: true });
    });

    els.exit.addEventListener('click', async () => {
      await Promise.resolve(progressSink(readProgress())).catch(() => {});
      if (onExit) onExit();
    });

    els.onboarding.addEventListener('click', event => {
      if (event.target.closest('[data-action="next-onboarding"]')) advanceOnboarding();
      else if (event.target.closest('[data-action="skip-onboarding"]')) finishOnboarding();
    });
    els.onboarding.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      (getActiveOnboardingPanel()?.querySelector('[data-action="next-onboarding"]') || els.onboardingSkip)?.focus({ preventScroll: true });
    });

    els.retrySystem.addEventListener('click', () => {
      const retry = systemRetry;
      if (retry) Promise.resolve(retry()).catch(() => {});
    });
    els.exitSystem.addEventListener('click', () => {
      if (onExit) onExit();
    });
    els.endSession.addEventListener('click', async () => {
      setGoalCheckpointVisible(false, { focus: false });
      await autosave({ announce: true });
      if (onExit) onExit({ view: 'results' });
    });
    els.continueSession.addEventListener('click', async () => {
      setGoalCheckpointVisible(false, { focus: false });
      await autosave({ announce: true });
      const firstChoice = els.form.querySelector('input[name="q1Choice"]');
      firstChoice?.focus({ preventScroll: true });
    });

    els.panelToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.goalCheckpointPending) return;
      updatePanelState(!state.panelCollapsed, { animate: true });
    });

    els.contextToggle?.addEventListener('click', () => {
      const expanded = els.contextToggle.getAttribute('aria-expanded') === 'true';
      setContextExpanded(!expanded);
    });

    els.collapsedContextToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      setContextExpanded(true);
      updatePanelState(false, { animate: true });
    });

    els.cardHeader.addEventListener('click', (e) => {
      if (state.goalCheckpointPending) return;
      if (e.target.closest('[data-action="exit"]')) return;
      if (e.target.closest('[data-action="toggle-panel"]')) return;
      if (!state.panelCollapsed) updatePanelState(true, { animate: true });
    });

    els.questionCard.addEventListener('click', (e) => {
      if (state.goalCheckpointPending) return;
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

    els.fitRoutes.addEventListener('click', () => fitRoutes());
    els.zoomIn.addEventListener('click', () => state.mapAdapter.zoomIn());
    els.zoomOut.addEventListener('click', () => state.mapAdapter.zoomOut());
    els.streetViewToggle.addEventListener('click', () => {
      if (state.streetViewOpen) {
        closeStreetView({ deactivate: true });
        return;
      }
      setStreetViewMode(!state.streetViewMode);
    });
    els.closeStreetView.addEventListener('click', () => closeStreetView());

    els.streetDivider.addEventListener('pointerdown', event => {
      if (!state.streetViewOpen) return;
      event.preventDefault();
      els.streetDivider.setPointerCapture(event.pointerId);
      els.streetDivider.classList.add('is-dragging');
    });
    els.streetDivider.addEventListener('pointermove', event => {
      if (!els.streetDivider.hasPointerCapture?.(event.pointerId)) return;
      const rect = els.mapShell.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const share = isMobileViewport()
        ? ((event.clientY - rect.top) / rect.height) * 100
        : ((rect.right - event.clientX) / rect.width) * 100;
      setPanoShare(share);
    });
    const endSplitDrag = event => {
      if (!els.streetDivider.hasPointerCapture?.(event.pointerId)) return;
      els.streetDivider.releasePointerCapture(event.pointerId);
      els.streetDivider.classList.remove('is-dragging');
      setPanoShare(currentPanoShare(isMobileViewport()), { persist: true });
      settleSplitPanorama();
    };
    els.streetDivider.addEventListener('pointerup', endSplitDrag);
    els.streetDivider.addEventListener('pointercancel', endSplitDrag);
    els.streetDivider.addEventListener('dblclick', resetSplit);
    els.streetDivider.addEventListener('keydown', event => {
      const mobile = isMobileViewport();
      let delta = 0;
      if (event.key === (mobile ? 'ArrowUp' : 'ArrowRight')) delta = -2;
      if (event.key === (mobile ? 'ArrowDown' : 'ArrowLeft')) delta = 2;
      if (!delta) return;
      event.preventDefault();
      setPanoShare(currentPanoShare(mobile) + delta, { persist: true });
      settleSplitPanorama();
    });

    applyStoredSplit();

    els.form.querySelectorAll('.ari-choice--route-a, .ari-choice--route-b, .ari-choice--route-c').forEach(label => {
      const key = ROUTE_SLOTS.find(({ className }) => label.classList.contains(className))?.key;
      if (!key) return;
      label.addEventListener('mouseenter', () => state.mapAdapter.focusRoute(key));
      label.addEventListener('mouseleave', () => state.mapAdapter.focusRoute(null));
      label.addEventListener('focusin', event => {
        if (event.target.matches?.(':focus-visible')) state.mapAdapter.focusRoute(key);
      });
      label.addEventListener('focusout', () => state.mapAdapter.focusRoute(null));
    });

    const resizeController = new AbortController();
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (state.streetViewOpen) closeStreetView();
        else if (state.streetViewMode) setStreetViewMode(false);
        return;
      }
      if (!state.streetViewMode || state.streetViewOpen) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const slotIndex = ['a', 'b', 'c'].indexOf(event.key.toLowerCase());
      if (slotIndex < 0 || slotIndex >= benchmark.routeTypes.length) return;
      const routeKey = ROUTE_SLOTS[slotIndex].key;
      const point = state.mapAdapter.getRepresentativeRoutePoint(routeKey);
      if (point) {
        event.preventDefault();
        setStreetViewPoint(point);
      }
    }, { signal: resizeController.signal });
    window.addEventListener('resize', () => {
      requestAnimationFrame(positionOnboarding);
      requestAnimationFrame(updateQuestionOverflow);
    }, { signal: resizeController.signal });

    loadRound(state.roundIndex, {
      panelCollapsed: !options.initialPanelExpanded,
      routeAssignment: options.initialRouteAssignment || null,
      questionStep: options.initialQuestionStep || 'q1',
      partialAnswer: options.initialPartialAnswer || null,
      expectedPairId: options.initialPairId || null
    }).then(loaded => {
      if (loaded && state.goalCheckpointPending) setGoalCheckpointVisible(true);
    });

    function unmount() {
      window.clearTimeout(medalUnlockTimer);
      window.clearTimeout(roundTransitionTimer);
      window.clearTimeout(streetViewCloseTimer);
      cancelSplitTween();
      if (splitResizeFrame) cancelAnimationFrame(splitResizeFrame);
      removeStreetViewPositionListener();
      if (state.streetViewPanorama) state.streetViewPanorama.setVisible(false);
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
      createMockRoutePairProvider,
      consoleAnswerSink,
      consoleProgressSink,
      getHudDialProgress,
      getEarnedMilestone
    };
})();
