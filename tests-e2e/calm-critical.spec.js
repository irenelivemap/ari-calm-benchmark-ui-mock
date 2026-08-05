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
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reasons for choosing routes' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Reasons for choosing routes' })
      .locator('..')
      .getByText('More trees or green space', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team results' })).toHaveCount(0);

  const firstRecord = page.locator('.calm-pp-card').first();
  await firstRecord.locator('.calm-pp-card__header').click();
  await expect(firstRecord.locator('.calm-pp-card__body')).toBeVisible();
  await expectUsableMap(page, firstRecord);
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
});
