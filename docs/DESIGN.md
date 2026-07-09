# ARI Calm Benchmark Design System

This document captures the design rules for the ARI calm-route benchmark UI. Use it before creating, reviewing, or changing interface elements in this repo.

## Product Intent

This is a map-first blinded benchmark for calm walking routes. Testers compare Route A and Route B without knowing which route is fast or calm, then answer which route they would actually choose for a calm walking situation.

The interface should help testers inspect the routes clearly, make a confident choice, and answer with minimal friction.

## Design Principles

- Map first: the map and the two routes are the primary task surface.
- Calm, not cluttered: reduce copy and controls unless they directly help the test.
- Arcade, but subtle: use a compact game/HUD feeling without making the UI noisy or gimmicky.
- Clear affordances: buttons must look clickable; status text must not look clickable.
- Route colors are reserved: orange and green belong to Route A / Route B and route answer buttons only.
- Progressive disclosure: definitions, data-use context, and extra guidance should be available without crowding the main task.
- Mobile and laptop both matter: desktop/laptop is primary, but mobile must be readable and usable without excessive scrolling.

## Visual Direction

The benchmark screen should feel like a focused testing cockpit:

- full-screen map
- compact HUD
- dark arcade-style question panel
- minimal map controls
- strong route visibility
- restrained supporting surfaces

Avoid:

- survey-page layouts where the form dominates the map
- marketing-page sections inside the test flow
- repeated explanatory text
- oversized controls
- decorative color unrelated to the route comparison
- UI elements that look like buttons but are only status

## Color Rules

Core colors in `src/styles/calm-benchmark.css`:

- Ink: `#101511`
- Muted text: `#37483F`
- Route A: `#C84720`
- Route B: `#08784D`
- Sage card: `#BDD7B8`
- Peach card: `#F3D0C1`

Rules:

- Use Route A orange and Route B green only for route lines, route markers, and route answer choices.
- Do not use route colors for generic emphasis, progress, onboarding labels, or primary UI actions.
- Primary action buttons in the dark test UI use a neutral bright arcade treatment, not orange/green.
- Secondary buttons should be subtle but visibly clickable.
- Status chips should use neutral text and transparent or very low-emphasis backgrounds.
- Check contrast whenever text sits on tinted or dark surfaces.

## Typography

Font families:

- UI font: `Outfit`
- Route title accent / intro display accent: `Newsreader`

Rules:

- Product UI labels, buttons, HUD text, and question text use `Outfit`.
- The serif accent is only for selected intro/title moments, not for controls or labels.
- Button text should never be larger than the content title it supports.
- Recommended in-test scale:
  - Question title: around `1rem`, bold.
  - Body/help text: around `0.82rem` to `0.86rem`.
  - Primary buttons: around `0.84rem` to `0.88rem`.
  - Secondary/icon button labels: around `0.72rem` to `0.78rem`.
  - Progress/status labels: around `0.68rem` to `0.76rem`.
- Use tabular numbers for round/progress indicators.

## Layout Rules

Intro page:

- Header, intro text, cards, and start card must share the same content width.
- On mobile, the session card appears before the start card.
- Avoid repeating the same information in the hero, cards, and start section.

Benchmark screen:

- The map owns the full viewport.
- The question panel overlays the map and can collapse for inspection.
- The question panel starts collapsed during onboarding.
- After onboarding ends, the question panel returns to collapsed state so the tester starts with the map.
- The question panel may expand when the user is ready to answer.

## Map Control Rules

Map controls must be comfortable to use and not stick to the browser edge.

Spacing:

- Desktop/laptop map controls: `24px` from the viewport/map edge.
- Mobile map controls: `20px` from the viewport/map edge.
- Never place floating map controls closer than `16px` to an edge.
- Use `10px` gap between stacked map controls.

Size:

- Map buttons should be at least `44px x 44px`.
- This applies to zoom, fit routes, and similar controls.
- Keep the hit area comfortable even if the icon is visually small.

Fit routes behavior:

- `Fit` should return to the closest useful comparison view.
- It should keep both routes visible from start to end.
- It should work after zooming in, zooming out, or panning away.
- Current onboarding copy:
  - `Fit both routes on screen.`
  - `Return to the comparison view.`

Street View:

- Street View should appear from interacting with a route point, not as a permanent extra toggle.
- If the Street View prompt appears during onboarding, it must remain visible above the onboarding layer.

## Onboarding Rules

Purpose:

- Teach only the minimum needed to inspect the map and answer.
- Let users practice on the real controls during onboarding.

Behavior:

- Onboarding uses a spotlight and a nearby coach tooltip.
- The overlay must not block map controls or route interaction.
- The coach tooltip remains clickable.
- Users advance with `Got it →` (or `Start round →` on the final step).
- Users go back by clicking a previously visited dot in the header row.
- Users skip by clicking the `Skip` text link in the header row.
- Skipping closes onboarding and keeps the question panel collapsed.
- The final onboarding step can expand the question panel to show where answers happen.

Spotlight:

- Center the spotlight on the actual control, not the container.
- For compact controls, use about `10px` spotlight padding.
- Do not let the spotlight get clipped by the viewport.
- If a control is near an edge, prefer comfortable control margins first, then compact spotlight padding.

Current onboarding steps:

1. `Zoom in or out.`
   `Use + / -, scroll, or pinch when you need to inspect streets more closely.`
2. `Fit both routes on screen.`
   `Return to the comparison view.`
3. `Check the street.`
   `Click a point on either route to open the Street View prompt.`
4. `Choose when ready.`
   `Pick the route you would actually walk, then continue.`

## HUD Rules

The benchmark HUD should be minimal and readable over the map.

Rules:

- Do not make status text look like a button.
- `ROUND 01 / 10` is status, not an action — `pointer-events: none`, no hover, no cursor.
- Exit is an icon-only `×` button with accessible label `Exit test`. It must not compete with the route task.
- The HUD pill and question panel both use dark glass (`rgba(10,12,11,0.88)` + `backdrop-filter: blur`) as a unified overlay system. This is intentional — both are overlay surfaces on the map and should read as the same design language.
- The HUD pill is `inline-flex` with the exit button on the left, a thin separator, and the round indicator on the right.
- Round numbers are zero-padded (`01`, `02` … `10`) for a scoreboard feel.
- `ROUND` label uses `rgba(255,255,255,0.55)` minimum — do not go below this on the dark pill or contrast will fail.

Implemented pattern:

```
[ × │ ROUND 01 / 10 ]
```

## Question Panel Rules

- The map remains the main focus.
- The panel should be collapsible/minimizable without adding extra text labels.
- When collapsed, the panel shows a one-line summary of the current question step label and question text, so the tester knows where they are without expanding.
- Route A and Route B answer buttons use route colors.
- Other answer buttons use neutral button styling.
- `Next question` is clearer than `Submit answer` when the user is moving through follow-up questions.
- `Back` for Q2/Q3 should be near the question flow, not in the global HUD.
- Q1 should not show optional free text.

Primary question:

`Which route would you choose for this calm walk?`

## Intro Start Card States

The dark start card on the intro page has two states that must read as the same surface:

- State 0 (no saved progress): kicker `Start testing`, title `Enter the duel.`, name form on the right.
- Resume (saved progress): kicker `Welcome back`, title uses the intro number pattern (`4 routes compared.` / `12 routes. Wayfinder.`), progress pips + `Resume →` on the right.

Rules:

- Both states use the intro h2 pattern: bold number in `Outfit`, serif italic phrase in `Newsreader`. No scoreboard numerals, no glow, no all-caps data blocks.
- Progress pips are neutral white (`rgba(255,255,255,0.82)` done, `0.12` remaining). Never route green/orange — route colors are reserved.
- The `Resume →` button uses the same neutral bright treatment as `Start test →`.
- The pips goal is the next milestone (10 → 15 → 20), not a fixed 10. Counting past the goal must keep working.
- `New session` is a small underlined text link in the footnote line; it clears saved progress. Minimum `rgba(255,255,255,0.55)` text.

## Gamification Rules

- Milestone ranks: 5 `Scout`, 10 `Pathfinder`, 15 `Wayfinder`, 20 `Cartographer`.
- Medals are letterpress seals: earned = the neutral bright button gradient with ink icon; locked = thin dashed circle with `at N` label. Locked medals stay visible — the next empty slot is the motivator.
- Celebration happens in words (serif italic rank in the title), not in effects. No neon, no pulsing glow.
- Reward count only. Never reward speed — no timers or time-based scores, they bias answers.
- Impact framing in the footnote (`every route sharpens the benchmark`) instead of points language.

## Exit And Progress Rules

- Exiting affects the whole session, not just the current question.
- Exit should trigger a confirmation, especially if progress exists.
- The user should be able to save progress or leave without saving.
- Completed submitted rounds remain submitted.

## Responsive Rules

Desktop/laptop:

- Prioritize a full-screen map with floating HUD and question panel.
- Keep controls at comfortable margins.
- Avoid large blocks that obscure the route comparison.

Mobile:

- Keep the map readable first.
- Question panel can sit at the bottom and collapse by default during inspection.
- Avoid horizontal overflow.
- Keep touch targets at least `44px`.
- Put the session card before the start card on the intro page.

## Copy Rules

- Use direct, task-based wording.
- Avoid internal language such as "route source", "fit bounds", or "backend".
- Avoid repeating the same explanation in multiple places.
- Prefer short labels and progressive detail.
- If a phrase is only true for one edge case, do not use it as general onboarding copy.

## Before Changing UI

Check every UI change against this list:

- Does the map remain the primary surface?
- Does any status element accidentally look clickable?
- Are Route A / Route B colors used only for routes and route choices?
- Are floating controls at least `20px` from mobile edges and `24px` from desktop edges?
- Are touch targets at least `44px x 44px`?
- Does the onboarding teach by letting the user use the real control?
- Does the question panel collapse when map inspection matters?
- Is there any repeated or unnecessary copy?
- Does the change work on both laptop and mobile?
- Does the UI still feel subtly arcade without becoming cluttered?
