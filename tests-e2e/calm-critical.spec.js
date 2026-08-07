const { test, expect } = require('@playwright/test');

async function beginCalmComparison(page, name = 'QA participant 017') {
  await page.goto('/?game=calm');
  await page.getByLabel('Name or participant code').fill(name);
  await page.getByRole('button', { name: 'Start test' }).click();
  await expect(page.locator('#calm-benchmark-root')).toBeVisible();
  const skip = page.locator('button[aria-label="Skip intro"]:visible');
  if (await skip.count()) await skip.first().click();
  await expect(page.locator('input[name="q1Choice"]').first()).toBeAttached();
  await page.waitForFunction(() => {
    const snapshot = window.ariCalmData?.snapshot?.();
    return Object.keys(snapshot?.progressBySessionId || {}).length === 1;
  });
}

async function choose(page, name, value) {
  await page.locator(`input[name="${name}"][value="${value}"]`).evaluate(input => {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function expectUsableMap(page, container = page.locator('#calm-benchmark-root')) {
  await expect(container.locator('[data-map-status]')).toBeHidden({ timeout: 15_000 });
  await expect.poll(async () => (
    container.locator('.maplibregl-canvas, .leaflet-tile-pane').count()
  ), { timeout: 15_000 }).toBeGreaterThan(0);
}

test('the fresh Calm start card shows the shared medal shelf at zero progress', async ({ page }) => {
  await page.goto('/?game=calm&fresh=1');

  const shelf = page.locator('#medal-shelf');
  const medals = shelf.locator('.calm-medal');
  await expect(shelf).toBeVisible();
  await expect(medals).toHaveCount(4);
  await expect(medals.filter({ has: page.locator('[aria-hidden="true"]') })).toHaveCount(4);
  await expect(medals.first()).toHaveClass(/is-next/);
  await expect(medals.first()).toHaveAttribute('aria-label', 'Street Scout medal, next goal, 0 of 5 routes');
  await expect(page.locator('#start-form')).toBeVisible();
  await expect(page.locator('#resume-right')).toBeHidden();

  const desktopAlignment = await page.evaluate(() => {
    const form = document.querySelector('#start-form').getBoundingClientRect();
    const shelfBox = document.querySelector('#medal-shelf').getBoundingClientRect();
    const input = document.querySelector('#participant-name').getBoundingClientRect();
    const button = document.querySelector('#start-form button[type="submit"]').getBoundingClientRect();
    const firstMedalLabel = document.querySelector('#medal-shelf .calm-medal__label').getBoundingClientRect();
    return {
      groupBaseline: Math.abs(form.bottom - shelfBox.bottom),
      inputToMedalBaseline: Math.abs(input.bottom - firstMedalLabel.bottom),
      buttonToMedalBaseline: Math.abs(button.bottom - firstMedalLabel.bottom)
    };
  });
  expect(desktopAlignment.groupBaseline).toBeLessThanOrEqual(1);
  expect(desktopAlignment.inputToMedalBaseline).toBeLessThanOrEqual(9);
  expect(desktopAlignment.buttonToMedalBaseline).toBeLessThanOrEqual(9);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.evaluate(() => {
    const heading = document.querySelector('#start-h2').getBoundingClientRect();
    const shelfBox = document.querySelector('#medal-shelf').getBoundingClientRect();
    const form = document.querySelector('#start-form').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      gapAboveMedals: shelfBox.top - heading.bottom,
      gapBelowMedals: form.top - shelfBox.bottom
    };
  });
  expect(mobileLayout.overflow).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileLayout.gapAboveMedals - mobileLayout.gapBelowMedals)).toBeLessThanOrEqual(1);
});

test('a newly loaded Calm round can resume before Q1 is answered', async ({ page }) => {
  await beginCalmComparison(page);
  await expectUsableMap(page);
  const firstProgress = await page.evaluate(() => window.ariCalmData.snapshot().progressBySessionId);
  const [sessionId, checkpoint] = Object.entries(firstProgress)[0];
  expect(checkpoint.v).toBe(3);
  expect(checkpoint.corpusVersion).toBe('calm-curated-v2');
  expect(checkpoint.corpusFingerprint).toMatch(/^[a-f0-9]{64}$/);
  expect(checkpoint.partialAnswer.corpusVersion).toBe(checkpoint.corpusVersion);
  expect(checkpoint.partialAnswer.corpusFingerprint).toBe(checkpoint.corpusFingerprint);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.waitForFunction(() => !document.querySelector('#calm-benchmark-root')?.hidden);
  await expectUsableMap(page);

  const resumed = await page.evaluate(() => window.ariCalmData.snapshot().progressBySessionId);
  expect(resumed[sessionId].pairId).toBe(checkpoint.pairId);
  expect(resumed[sessionId].routeAssignment).toEqual(checkpoint.routeAssignment);
});

test('Street View preserves the question panel state and normal desktop size', async ({ page }) => {
  await beginCalmComparison(page, 'QA Street View panel 024');
  await expectUsableMap(page);

  const panel = page.locator('[data-question-card]');
  if (await panel.evaluate(element => element.classList.contains('is-collapsed'))) {
    await page.locator('[data-action="toggle-panel"]').click();
  }
  await expect(panel).not.toHaveClass(/is-collapsed/);
  await page.waitForTimeout(450);
  const expandedBefore = await panel.boundingBox();

  await page.getByRole('button', { name: 'Turn on Street View' }).click();
  await page.keyboard.press('a');
  await expect(page.locator('[data-map]')).toHaveClass(/is-street-split/);
  await expect(panel).not.toHaveClass(/is-collapsed/);
  await page.waitForTimeout(450);
  const expandedDuring = await panel.boundingBox();
  expect(Math.abs(expandedDuring.width - expandedBefore.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(expandedDuring.height - expandedBefore.height)).toBeLessThanOrEqual(1);

  await page.locator('.ari-street-viewer__back').click();
  await expect(page.locator('[data-map]')).not.toHaveClass(/is-street-split/);
  await expect(panel).not.toHaveClass(/is-collapsed/);

  await page.locator('[data-action="toggle-panel"]').click();
  await expect(panel).toHaveClass(/is-collapsed/);
  await page.waitForTimeout(400);
  const collapsedBefore = await panel.boundingBox();
  await page.getByRole('button', { name: 'Turn on Street View' }).click();
  await page.keyboard.press('a');
  await expect(page.locator('[data-map]')).toHaveClass(/is-street-split/);
  await expect(panel).toHaveClass(/is-collapsed/);
  await page.waitForTimeout(450);
  const collapsedDuring = await panel.boundingBox();
  expect(Math.abs(collapsedDuring.width - collapsedBefore.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(collapsedDuring.height - collapsedBefore.height)).toBeLessThanOrEqual(1);
});

test('Street View keeps the mobile question visible within the remaining map area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await beginCalmComparison(page, 'QA Street View mobile 025');
  await expectUsableMap(page);

  const panel = page.locator('[data-question-card]');
  if (await panel.evaluate(element => element.classList.contains('is-collapsed'))) {
    await page.locator('[data-action="toggle-panel"]').click();
  }
  await expect(panel).not.toHaveClass(/is-collapsed/);
  await page.waitForTimeout(450);
  const before = await panel.boundingBox();

  await page.getByRole('button', { name: 'Turn on Street View' }).click();
  await page.keyboard.press('a');
  await expect(page.locator('[data-map]')).toHaveClass(/is-street-split/);
  await expect(panel).not.toHaveClass(/is-collapsed/);
  await page.waitForTimeout(450);

  const during = await panel.boundingBox();
  const divider = await page.locator('[data-street-divider]').boundingBox();
  expect(during.y).toBeGreaterThanOrEqual(divider.y - 1);
  expect(during.height).toBeLessThanOrEqual(before.height + 1);
});

test('an immediate reload after finishing a Calm comparison advances once', async ({ page }) => {
  await beginCalmComparison(page, 'QA participant 018');

  await choose(page, 'q1Choice', 'route_a');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('input[name="q2Reasons"]').first()).toBeVisible();
  await choose(page, 'q2Reasons', 'quieter_or_less_busy_streets');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('input[name="q3WorthShowing"]').first()).toBeVisible();
  await choose(page, 'q3WorthShowing', 'a_lot');

  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await page.reload();

  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(page.locator('#start-h2')).toContainText('1 route compared');
  const snapshot = await page.evaluate(() => window.ariCalmData.snapshot());
  expect(snapshot.answers).toHaveLength(1);
  const savedRouteIdentity = await page.evaluate(() => {
    const answer = window.ariCalmData.snapshot().answers[0];
    const pairNumber = Number(answer.pairId.match(/calm-route-comparison-(\d+)-/)?.[1]);
    const pair = window.AriCalmBenchmarkMockRoutePairs[pairNumber - 1];
    return {
      answer,
      expectedVersion: window.AriCalmBenchmarkMockRoutePairs.corpusVersion,
      expectedFingerprint: window.AriCalmBenchmarkMockRoutePairs.corpusFingerprint,
      expectedRouteA: pair.routes[answer.routeAssignment.routeA],
      expectedRouteB: pair.routes[answer.routeAssignment.routeB],
      expectedFast: pair.routes.fast
    };
  });
  expect(savedRouteIdentity.answer.v).toBe(3);
  expect(savedRouteIdentity.answer.corpusVersion).toBe(savedRouteIdentity.expectedVersion);
  expect(savedRouteIdentity.answer.corpusFingerprint).toBe(savedRouteIdentity.expectedFingerprint);
  expect(savedRouteIdentity.answer.labels.A.routeId).toBe(savedRouteIdentity.expectedRouteA.routeId);
  expect(savedRouteIdentity.answer.labels.A.metadata).toEqual(savedRouteIdentity.expectedRouteA.metadata);
  expect(savedRouteIdentity.answer.labels.B.routeId).toBe(savedRouteIdentity.expectedRouteB.routeId);
  expect(savedRouteIdentity.answer.labels.B.metadata).toEqual(savedRouteIdentity.expectedRouteB.metadata);
  expect(savedRouteIdentity.answer.fastRoute.routeId).toBe(savedRouteIdentity.expectedFast.routeId);
  expect(savedRouteIdentity.answer.fastRoute.metadata).toEqual(savedRouteIdentity.expectedFast.metadata);
  expect(Object.values(snapshot.progressBySessionId)[0].completedRounds).toBe(1);
  expect(Object.values(snapshot.progressBySessionId)[0].roundIndex).toBe(1);
});

test('the optional better-route note is conditionally shown, resumed, saved, and shown in Results', async ({ page }) => {
  const note = 'Take the small riverside path behind the school. 🌳';
  const fastNote = 'When I am late for an appointment.';
  await beginCalmComparison(page, 'QA better route 023');
  await choose(page, 'q1Choice', 'route_a');

  const flag = page.locator('input[name="q1KnowsBetter"]');
  const noteField = page.locator('textarea[name="q1BetterRouteNote"]');
  await expect(noteField).toBeHidden();
  await flag.check();
  await expect(noteField).toBeVisible();
  await expect(noteField).toHaveAttribute('maxlength', '500');
  await noteField.fill(note);
  await page.waitForFunction(expected => {
    const progress = Object.values(window.ariCalmData.snapshot().progressBySessionId)[0];
    return progress?.partialAnswer?.q1KnowsBetter === true
      && progress.partialAnswer.q1BetterRouteNote === expected;
  }, note);

  await flag.uncheck();
  await expect(noteField).toBeHidden();
  await page.waitForFunction(() => {
    const progress = Object.values(window.ariCalmData.snapshot().progressBySessionId)[0];
    return progress?.partialAnswer?.q1KnowsBetter === false
      && progress.partialAnswer.q1BetterRouteNote === '';
  });

  await flag.check();
  await noteField.fill(note);
  await page.reload();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(flag).toBeChecked();
  await expect(noteField).toBeVisible();
  await expect(noteField).toHaveValue(note);

  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await choose(page, 'q2Reasons', 'more_trees_or_green_space');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  const fastNoteField = page.locator('textarea[name="q3Note"]');
  await expect(fastNoteField).toBeHidden();
  await choose(page, 'q3WorthShowing', 'a_lot');
  await expect(fastNoteField).toBeVisible();
  await expect(fastNoteField).toHaveAttribute('placeholder', 'When might you take the Fast route shown instead? (Optional)');
  await expect(fastNoteField).toHaveAttribute('aria-label', 'When might you take the Fast route shown instead? (Optional)');
  await fastNoteField.fill('A response that should be cleared.');
  await choose(page, 'q3WorthShowing', 'not_at_all');
  await expect(fastNoteField).toBeHidden();
  await choose(page, 'q3WorthShowing', 'a_little');
  await expect(fastNoteField).toBeVisible();
  await expect(fastNoteField).toHaveValue('');
  await fastNoteField.fill(fastNote);
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => window.ariCalmData.snapshot().answers.length === 1);

  const saved = await page.evaluate(() => window.ariCalmData.snapshot().answers[0]);
  expect(saved.q1KnowsBetter).toBe(true);
  expect(saved.q1BetterRouteNote).toBe(note);
  expect(saved.q3WorthShowing).toBe('a_little');
  expect(saved.q3Note).toBe(fastNote);
  expect(saved.q3NoteKind).toBe('fast_alternative');

  await page.goto('/?game=calm&view=results');
  const firstRecord = page.locator('.calm-pp-card').first();
  await firstRecord.locator('.calm-pp-card__header').click();
  await expect(firstRecord.getByText('I know a better Calm route', { exact: true })).toBeVisible();
  await expect(firstRecord.getByText(note, { exact: false })).toBeVisible();
  await expect(firstRecord.getByText('When might you take the Fast route shown instead? (Optional)', { exact: true })).toBeVisible();
  await expect(firstRecord.getByText(fastNote, { exact: false })).toBeVisible();
});

test('removed paired reasons stay hidden while a current neither reason is saved', async ({ page }) => {
  await beginCalmComparison(page, 'QA current Q2 reasons 021');
  await choose(page, 'q1Choice', 'route_a');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator(
    'input[name="q2Reasons"][value="more_beautiful_streets_or_surroundings"]'
  )).toHaveCount(0);
  await expect(page.locator(
    'input[name="q2Reasons"][value="familiar_route_or_area"]'
  )).toHaveCount(0);
  await expect(page.locator(
    'input[name="q3Issues"][value="not_enough_beautiful_or_pleasant_surroundings"]'
  )).toHaveCount(0);

  await page.evaluate(() => localStorage.clear());
  await page.goto('/?game=calm&fresh=1&qa=surroundings-neither');
  await page.getByLabel('Name or participant code').fill('QA surroundings neither 022');
  await page.getByRole('button', { name: 'Start test' }).click();
  const skip = page.locator('button[aria-label="Skip intro"]:visible');
  if (await skip.count()) await skip.first().click();
  await expect(page.locator('input[name="q1Choice"]').first()).toBeAttached();
  await choose(page, 'q1Choice', 'none_work_well');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('[data-q2]')).toBeHidden();
  await expect(page.locator(
    'input[name="q3Issues"][value="not_enough_beautiful_or_pleasant_surroundings"]'
  )).toHaveCount(0);
  await expect(page.locator(
    'input[name="q3Issues"][value="prefer_another_known_route"]'
  )).toHaveCount(0);
  const rejectionReason = page.locator(
    'input[name="q3Issues"][value="not_enough_route_near_water"]'
  );
  await expect(rejectionReason).toBeVisible();
  await choose(page, 'q3Issues', 'not_enough_route_near_water');
  await page.locator('textarea[name="q3Note"]').fill('Neither route spent enough time near water.');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => window.ariCalmData.snapshot().answers.length === 1);

  const rejectedAnswer = await page.evaluate(() => window.ariCalmData.snapshot().answers[0]);
  expect(rejectedAnswer.q2Reasons).toEqual([]);
  expect(rejectedAnswer.q2Note).toBe('');
  expect(rejectedAnswer.q3Issues).toEqual(['not_enough_route_near_water']);
  expect(rejectedAnswer.q3Note).toBe('Neither route spent enough time near water.');

  await page.goto('/?game=calm&view=results');
  const shapedChoices = page.getByRole('heading', { name: 'What influenced you' }).locator('..');
  await expect(shapedChoices.getByText('Not enough of the route is near water', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reasons for choosing neither' })).toHaveCount(0);
});

test('Calm participant results use current choice reasons and personal wording', async ({ page }) => {
  await beginCalmComparison(page, 'QA participant 019');
  await choose(page, 'q1Choice', 'route_b');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await choose(page, 'q2Reasons', 'more_trees_or_green_space');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await choose(page, 'q3WorthShowing', 'somewhat');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => window.ariCalmData.snapshot().answers.length === 1);

  await page.goto('/?game=calm&view=results');
  await expect(page.getByRole('heading', { name: 'A quick explanation of what you did', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Route Explorers Leaderboard', level: 2 })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Route Explorers leaderboard' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: /route progress$/ })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Your choices', level: 2, includeHidden: true })).toHaveClass(/ari-visually-hidden/);
  await expect(page.getByRole('heading', { name: 'Route choices', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What influenced you' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'What influenced you' })
      .locator('..')
      .getByText('More trees or green space', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team results' })).toHaveCount(0);

  const firstRecord = page.locator('.calm-pp-card').first();
  await firstRecord.locator('.calm-pp-card__header').click();
  await expect(firstRecord.locator('.calm-pp-card__body')).toBeVisible();
  await expectUsableMap(page, firstRecord);
});

test('the local participant sample URL shows varied Route Explorers mock data', async ({ page }) => {
  await page.goto('/?game=calm&sample=1&view=results');

  await expect(page.getByRole('heading', { name: 'A quick explanation of what you did', level: 1 })).toBeVisible();
  await expect(page.locator('.calm-route-explorers__row')).toHaveCount(15);
  await expect(page.locator('.calm-route-explorers__row:visible')).toHaveCount(5);
  await expect(page.getByRole('progressbar', { name: /route progress$/ })).toHaveCount(5);
  await expect(page.locator('.calm-route-explorers__row.is-current')).toContainText('Irene');
  await expect(page.locator('.calm-route-explorers__row').first().locator('[data-rank-position="1"]')).toBeVisible();
  await expect(page.locator('.calm-route-explorers__rank-trophy')).toHaveCount(3);
  await expect(page.locator('.calm-route-explorers__row.is-complete')).toHaveCount(3);
  await expect(page.locator('.calm-route-explorers__row.is-complete').locator('[data-rank-position="1"]')).toHaveCount(1);
  await expect(page.locator('.calm-route-explorers__row.is-complete').locator('[data-rank-position="2"]')).toHaveCount(1);
  await expect(page.locator('.calm-route-explorers__row.is-complete').locator('[data-rank-position="3"]')).toHaveCount(1);
  await expect(page.locator('.calm-route-explorers__row').first().locator('.calm-route-explorer-medal.is-current-level')).toHaveCount(1);
  await expect(page.locator('.calm-route-explorers__row.is-complete .calm-route-explorers__complete-icon')).toHaveCount(3);

  await page.getByRole('button', { name: 'Show all 15' }).click();
  await expect(page.locator('.calm-route-explorers__row:visible')).toHaveCount(15);
  await expect(page.getByRole('progressbar', { name: /route progress$/ })).toHaveCount(15);
  await expect(page.getByText('Alex (AL-1)', { exact: true })).toBeVisible();
  await expect(page.getByText('Alex (AL-2)', { exact: true })).toBeVisible();

  const progressValues = await page.getByRole('progressbar', { name: /route progress$/ }).evaluateAll(bars => (
    bars.map(bar => Number(bar.getAttribute('aria-valuenow')))
  ));
  expect(Math.max(...progressValues)).toBe(23);
  expect(Math.min(...progressValues)).toBe(1);
  expect(new Set(progressValues).size).toBeGreaterThanOrEqual(10);

  const desktopIntroColumns = await page.locator(
    '.calm-results-dashboard-header--participant .calm-results-dashboard-summary__details'
  ).evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/));
  expect(desktopIntroColumns).toHaveLength(1);
  const unusedIntroWidth = await page.evaluate(() => {
    const wrap = document.querySelector('.calm-results-wrap');
    const details = document.querySelector('.calm-results-dashboard-header--participant .calm-results-dashboard-summary__details');
    return Math.round((wrap?.getBoundingClientRect().width || 0) - (details?.getBoundingClientRect().width || 0));
  });
  expect(unusedIntroWidth).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const participantIntroColumns = await page.locator(
    '.calm-results-dashboard-header--participant .calm-results-dashboard-summary__details'
  ).evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/));
  expect(participantIntroColumns).toHaveLength(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('a researcher preview never makes later participant links open in researcher mode', async ({ page }) => {
  await beginCalmComparison(page, 'QA participant mode 021');
  await choose(page, 'q1Choice', 'route_a');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await choose(page, 'q2Reasons', 'quieter_or_less_busy_streets');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await choose(page, 'q3WorthShowing', 'a_lot');
  await page.locator('[data-form]').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => window.ariCalmData.snapshot().answers.length === 1);

  await page.goto('/?game=calm&researcher=1&view=results');
  await expect(page.getByRole('heading', { name: 'Team results', level: 1 })).toBeVisible();

  await page.goto('/?game=calm&view=results');
  await expect(page.getByRole('heading', { name: 'A quick explanation of what you did', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team results', level: 1 })).toHaveCount(0);
});

test('researcher participant navigation becomes one usable mobile selector', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?game=calm&researcher=1&sample=1&view=results');

  const picker = page.locator('[data-results-participant-select]');
  await expect(picker).toBeVisible();
  await expect(page.locator('.calm-participant-list__items')).toBeHidden();
  await picker.selectOption('sample-maya');
  await expect(page.locator('.calm-participant-detail__header').getByRole('heading', { name: 'Maya Chen' })).toBeVisible();
  await expect(page.getByText('Sessions', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Routes compared', { exact: true })).toBeVisible();
  await expect(page.getByText('Complete', { exact: true })).toBeVisible();
});

test('the Calm flow fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await beginCalmComparison(page, 'QA mobile 020');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('researcher route profiles render every pair from the same diagnostics corpus', async ({ page }) => {
  await page.goto('/?game=calm&researcher=1&view=route-profiles');
  await expect(page.getByRole('heading', { name: 'How the route profiles are configured' })).toBeVisible();
  await expect(page.locator('#rp-pairs-list .calm-rp-pair')).toHaveCount(23);
  await expectUsableMap(page, page.locator('#rp-pairs-list .calm-rp-pair').first());

  const corpusAlignment = await page.evaluate(() => {
    const pairs = window.AriCalmBenchmarkMockRoutePairs;
    const diagnostics = window.AriCalmBenchmarkDiagnostics;
    return {
      sameVersion: pairs.corpusVersion === diagnostics.corpusVersion,
      sameFingerprint: pairs.corpusFingerprint === diagnostics.corpusFingerprint,
      exactPairOrder: diagnostics.pairs.every((diagnostic, index) => (
        diagnostic.pairId === pairs[index].pairId
        && diagnostic.sourceDigest === pairs[index].sourceDigest
      ))
    };
  });
  expect(corpusAlignment).toEqual({
    sameVersion: true,
    sameFingerprint: true,
    exactPairOrder: true
  });

  await page.goto('/?game=calm&researcher=1&view=results');
  await expect(page.getByRole('heading', { name: 'Team results', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Participants' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Route Explorers Leaderboard' })).toHaveCount(0);
});
