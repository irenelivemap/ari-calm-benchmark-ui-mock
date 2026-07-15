# ARI Route Benchmark Design System

This document captures the design rules shared by the ARI route benchmark family. Use it before creating, reviewing, or changing interface elements in this repo. Challenge-specific copy and question logic live in `CHALLENGE_CONFIGS` in `index.html`; the visual and interaction system is shared.

## Product Intent

This is a map-first blinded benchmark family. Testers compare Route A and Route B without knowing which provider produced either route, then answer the question defined by the active challenge.

Fast vs Calm asks which route better fits a calm walk. Fast vs Google Fast asks which route works better as a fast route. The interface should help testers inspect routes clearly, make a confident choice, and answer with minimal friction in either challenge.

## Design Principles

- Map first: the map and the two routes are the primary task surface.
- Focused, not cluttered: reduce copy and controls unless they directly help the test.
- Arcade, but subtle: use a compact game/HUD feeling without making the UI noisy or gimmicky.
- Clear affordances: buttons must look clickable; status text must not look clickable.
- Route colors are reserved: orange and green belong to Route A / Route B and route answer buttons only.
- Progressive disclosure: challenge context and extra guidance should appear only when they help the active task.
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
- On dark glass surfaces, readable text must not go below `rgba(255,255,255,0.84)`. Decorative separators, borders, and disabled states may be lower, but labels, status, goals, and helper copy may not.

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
- Compact HUD/status text must be at least `0.72rem` on mobile and `0.76rem` on desktop. Anything smaller is decorative only and cannot carry task-critical information.

## Layout Rules

Intro page:

- The benchmark family uses one shared header: a `Challenges` context menu on the left and `Compare | Results` views on the right.
- The challenge chooser is a reusable full-screen opening state, not a separate route. It opens automatically only when no challenge has been selected, then remains available through the header menu.
- While the chooser is open, its off-white canvas and dark cabinet surface preserve continuity with the benchmark while fully replacing its content. No benchmark, header, map, or page scrollbar remains visible behind it.
- Direct benchmark links such as `?game=calm` bypass the first-visit chooser. Returning visitors reopen the last selected challenge.
- The chooser is one continuous arcade stage rather than a web-style menu beside a preview card. Challenge selection is the primary task, Play or Resume is the primary command, and player progress is secondary context.
- On desktop, the stage uses a `60 / 40` structure: a vertical challenge list on the left and an unframed player-status pane on the right. The cabinet header and its divider provide the outer structure; the stage does not add another enclosing card or outline. On mobile, the same content stacks in task order: challenges, status, then Play or Resume.
- Challenge keys use full comparison names: `ARI Fast vs Google`, `ARI Fast vs ARI Calm`, and `ARI Fast vs ARI Safe`. The selected available key uses a powered split orange/green surface, a bright frame, an arcade cursor, and `Ready`. Unavailable keys use raised graphite surfaces that are visibly distinct from the cabinet, with readable labels and a quiet `Soon` state.
- The player-status pane never repeats the selected challenge. It shows the current medal, rank, and one concise progress line. Before the final medal the line combines routes with the next medal threshold; after completion it combines routes with the medal count.
- Challenge order never changes. The medal stays aligned to the center of the middle challenge key, even when the top or bottom key is selected. The route animation begins at two output ports on the selected key, travels as a parallel paired cable, then enters the fixed medal dock. Top and bottom selections use mirrored cable geometry; only the upstream transport cable reroutes.
- The medal, route endpoints, and rank copy are measured from the rendered layout. Route geometry stays inside the medal's vertical footprint in the status pane, and the rank copy below it is an explicit no-route zone. This keeps longer future rank names clear without masking collisions behind text.
- On stacked mobile layouts, the circuit uses the stage's outer rail to avoid crossing the remaining challenge keys, then enters a fixed symmetrical top dock above the medal.
- Opening the chooser draws both routes once, then uses a slow moving trace to keep the screen in attract mode. A confirmed selection retracts and redraws only the transport cable, leaves the medal dock stable, then gives the medal one restrained power pulse. Hover never moves the circuit. Reduced-motion mode shows the completed route immediately without looping or pulsing motion.
- All challenges share one vertical selector. Fast vs Calm and Fast vs Google Fast are playable. Fast vs Safe remains visible as a disabled `Soon` option until its flow exists.
- The stage has exactly one ivory Play or Resume command. It is intentionally distinct from the dark challenge keys.
- Selection is communicated by the cursor and active frame only. Do not add `Select a challenge`, `Selected challenge`, or `Selected` labels, and do not repeat the selected challenge inside the CRT.
- `fresh.html` is the non-destructive QA entry point. It previews a new player without deleting locally saved sessions.
- During the current single-tester design phase, `Reset test data` appears only in the intro header, immediately to the right of the challenge menu. It clears local answers, progress, participant state, medals, and challenge selection in one step, then returns to the true first screen. It preserves the map API configuration and must be removed before production testing.
- Switching challenges must preserve existing progress. Results and comparison views always belong to the currently selected challenge.
- Header, intro text, cards, and start card must share the same content width.
- On mobile, the session card appears before the start card.
- Avoid repeating the same information in the hero, cards, and start section.
- The `How it works` and `Session` overview cards are collapsible from the first visit. They start expanded for new testers and collapsed after at least one route has been compared.
- Compact rows must have a single visible alignment contract: icon, label, and action control share one center line. Hidden expanded content must not leave margins, gaps, or padding inside the compact row.
- Side-by-side overview cards use explicit animated desktop heights: `420px` expanded and `90px` compact. Below `900px`, both states return to content-driven height.
- The expanded Session card uses `10+ comparisons.` as a flexible goal, reassures testers with `Every comparison helps. More is even better.`, gives the target duration as `About 6 to 8 min`, confirms `Desktop and mobile` support, and introduces the medal goal with `Become a Cosmic Explorer.` / `Unlock a new medal every 5 comparisons.`
- The resume card is an evolving rank world. It begins as the near-black arcade cabinet, then progressively gains street geometry, a traced trail, a horizon, map contours, constellations, and a cosmic field as medals are earned.
- Rank motifs remain low-contrast behind the content and never change the card layout or ivory action. The latest rank controls the surface tint, border light, progress color, and title accent.
- Crossing a medal threshold reveals the new world layer outward from that medal's position once. Reloading or revisiting an already earned tier must not replay the animation, and reduced-motion users receive the final state immediately.
- Do not add a separate `How your answers help` disclosure to the Session card. Keep its content in one scan-friendly stack.

Alignment QA:

- Elements that must share a center line can opt into the browser check with the same `data-align-group` value.
- Open `?qa=alignment` after changing compact rows, headers, HUD pills, or button groups. This QA mode forces overview cards into their compact state before measuring.
- Run `window.ariCheckAlignment()` in the browser console when checking the current visible state manually.
- A group fails if its vertical center drift is more than `1px`.
- If a hidden element is visually collapsed, also collapse its spacing (`gap`, margin, padding, line-height side effects), or remove it from layout.

Benchmark screen:

- The map owns the full viewport.
- The question panel overlays the map and can collapse for inspection.
- The question panel and map controls share the same responsive edge inset: `24px` on desktop and `20px` on mobile, including safe-area insets.
- The question panel starts collapsed while onboarding coachmarks identify the map controls.
- Pressing `Start round →` closes onboarding and expands the question panel.
- After onboarding, the tester can collapse or expand the panel without changing the map camera.

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
- When the question panel overlaps the map, Fit measures the available rectangles to its right and below it, chooses the larger useful region, and centers both routes inside that region.
- It should work after zooming in, zooming out, or panning away.
- Current onboarding copy:
  - `Fit both routes.`
  - `Use Fit to return to the full comparison.`

Street View:

- Street View is an explicit map mode so ordinary pan, pinch, double-click, and zoom gestures stay unchanged.
- A 44px Street View icon sits directly beneath Fit. Activating it reveals the concise instruction `Street View on` / `Select any point on the map.`
- Any map tap is actionable while the mode is active. Both routes keep a forgiving invisible hit area, without changing their visible geometry, so near-route taps keep their route identity.
- Selecting a point opens a split inspection layout: on desktop the panorama fills the left 65% (55% below 1100px wide) while the live comparison map keeps a full-height right column; on mobile the panorama takes the top 58% with the map below it. The map column keeps both routes and the moving position marker visible, and tapping another map point retargets the panorama without losing the saved camera.
- On desktop the question card stays above the panorama, collapsed but fully answerable in place. On mobile it stays hidden until `Back to map`.
- `Back to map` restores the exact camera, question state, and answers, then turns the mode off.
- The viewer identifies points on Route A or Route B with the existing route color, and points away from both routes as a neutral `Map point`. It never exposes the route source.
- If imagery or the Google API is unavailable, show that state inside the inspector and keep the tester in the benchmark. Never open an external tab as a fallback.

## Onboarding Rules

Purpose:

- Teach only the minimum needed to inspect the map and answer.
- Reassure testers that they can leave and resume without losing progress.

Behavior:

- Onboarding uses simultaneous contextual coachmarks, not a step-by-step tour.
- All essential instructions appear at the same time beside the UI they explain.
- Do not include zoom instructions; standard map zoom controls remain available without explanation.
- One `Start round →` action closes onboarding and smoothly expands the question panel so the tester can answer immediately.
- Do not add progress dots, a skip link, or controls that imply multiple steps.
- Coachmarks and their target outlines reposition to avoid collisions on desktop and mobile.
- The dimming layer has real transparent cutouts so highlighted controls remain at full brightness.
- Coachmarks use flat warm-ivory surfaces with dark text, strong connectors, and a single synchronized entrance pulse so guidance cannot be mistaken for the dark application UI.
- `Start round →` remains a brighter, raised pill with a heavy dark frame so it reads as the action rather than another coachmark.
- `Start round →` is a prominent bottom-center dock on desktop and remains top-center on mobile to avoid the question card.
- Initial route fitting is immediate and runs once before onboarding settles; opening or closing onboarding must not pan or refit the map.

Current onboarding overview:

1. Beside Fit: `Fit both routes` / `Return to the full comparison.`
2. Beside Street View: `Explore the street` / `Turn on Street View, then select any point.`
3. Beside the question card: `Answer when ready` / `Open the question card.`
4. Beside Exit: `Leave anytime` / `Your place is saved.`

Resume reassurance is attached directly to the `×` exit control instead of appearing as detached explanatory copy.

## HUD Rules

The benchmark HUD should be minimal and readable over the map.

Rules:

- Do not make status text look like a button.
- Route progress is status, not an action — `pointer-events: none`, no hover, no cursor.
- Exit is an icon-only `×` button with accessible label `Exit test`. It must not compete with the route task.
- The HUD pill and question panel both use dark glass (`rgba(10,12,11,0.88)` + `backdrop-filter: blur`) as a unified overlay system. This is intentional — both are overlay surfaces on the map and should read as the same design language.
- The HUD header keeps the exit button on the left, followed by a five-segment dial whose center shows the current route number, and the panel control. Do not add a separate `Route` label or repeat the route number outside the dial.
- Route numbers are zero-padded to three digits (`001`, `002` … `010`) for a scoreboard feel.
- Do not use `Route X / Y` or display the next milestone number beside the current route. Put the current route number inside the five-segment dial and let the segments communicate progress toward the next medal.
- Do not explain upcoming medal names in the active HUD. The dial's five segments communicate progress, while names remain on the resume card until a medal is actually earned.
- The medal progress dial shows the current route number in its center and exactly five evenly spaced metallic segments show the active route's position within that five-route stage.
- Incomplete segments stay dark but visible. Completed segments illuminate in neutral ivory, and only the newest segment briefly brightens. Route orange and green are never used.
- Route 5, 10, 15, 20, 25, and 30 illuminate all five segments before the next stage appears. After route 30, the dial remains at `30` with all five segments illuminated.

Implemented pattern:

```
[ × │ (004: ●●●●○)  ^ ]
```

## Question Panel Rules

- The map remains the main focus.
- The panel should be collapsible/minimizable without adding extra text labels.
- When collapsed, the panel keeps the same full question wording and typographic treatment so the tester knows where they are without expanding.
- Q1, Q2, and Q3 share one flat choice-row system: `44px` minimum height, thin separators, no persistent radio/checkbox circles, no gradients or shadows, and a checkmark that appears only after selection.
- Choice grids use one separator contract: the grid supplies the first line and every row supplies only its bottom line. Individual rows never add a second top border or separator gap.
- The expanded question panel is one continuous near-black material. Do not create differently colored question or footer rectangles inside it; use spacing, separators, and a restrained scanline texture for hierarchy.
- Collapsed and expanded states use the same full question copy and typography. Do not add a `Q1`/`Q2`/`Q3` prefix or shorten the collapsed wording.
- Every active question starts from the same vertical origin below the HUD header. Question blocks do not add their own top divider or top padding; the HUD header owns the single separator.
- The Q1 title and information control occupy the same coordinates when the panel collapses or expands. Collapsed and expanded states share card padding, header spacing, a `12px` title/action gap, and reset browser-default `legend` padding.
- Collapsed summaries and expanded question legends use the same normal wrapping rule. Question copy fills the available line width before breaking, and identical copy breaks on the same words in both panel states.
- Route A and Route B use accessible orange and green label colors on transparent rows. Their hover states retain the label color and add a subtle matching tint; never replace route identity with the generic gray/white hover treatment. When selected, they use muted terracotta or forest-green surfaces with white text and a checkmark to preserve route identity without implying correctness. Neutral answers retain the light selected surface.
- `Next question` is clearer than `Submit answer` when the user is moving through follow-up questions.
- `Back` for Q2/Q3 should be near the question flow, not in the global HUD.
- Q1 should not show optional free text.
- Q1 does not display a route situation. A small information control beside the question reveals the calm definition only when requested; do not add a separate context row or text label.
- Q1 keeps that information control beside the question in both panel states. From the collapsed state, selecting it expands the panel and opens the calm definition; selecting the rest of the collapsed card expands with the definition closed.
- The expanded question panel keeps its HUD header and action row fixed. Only the question content may scroll, and the native scrollbar stays visually hidden; use a subtle content fade to signal additional answers below.
- Expanding or collapsing the question panel and opening optional question details must preserve the current map center and zoom. Only direct map controls, explicit route fitting, onboarding, or loading a new route pair may change the map camera.
- Animated expansion must measure the form in its true expanded layout before starting. Animate directly from `0` to that measured height, then release the inline height without changing the rendered size; never measure while the collapsed layout is still active.
- Single-choice answers remain on the current question after selection. Selecting an answer shows its selected state and enables `Next question`; only pressing that button advances the flow.
- Q3 uses one concise seven-option checklist beneath `Select all that apply.` The final option is `Other`. After any Q3 option is selected, an optional `Add details (optional)` text box appears for supporting context; it is never required to continue.
- All answer rows and command buttons are at least `44px` high. Answer and button labels use approximately `0.875rem` on mobile and desktop.

Primary question:

`Which route would you choose for this calm walk?`

## Intro Start Card States

The dark start card on the intro page has two states that must read as the same surface:

- State 0 (no saved progress): kicker `Start testing`, title `Enter the duel.`, name form on the right.
- Resume (saved progress): kicker `Welcome back, [name]`, title uses the intro number pattern (`4 routes compared.` / `12 routes. Wayfinder.`), progress pips + `Resume →` on the right.

Rules:

- Both states use the intro h2 pattern: bold number in `Outfit`, serif italic phrase in `Newsreader`. No scoreboard numerals, no glow, no all-caps data blocks.
- Progress pips are neutral white (`rgba(255,255,255,0.82)` done, `0.12` remaining). Never route green/orange — route colors are reserved.
- The `Resume →` button uses the same neutral bright treatment as `Start test →`.
- The resume action cluster contains only `Last played [date]`, the progress pips, and `Resume →`. The participant name appears once in the greeting and is not repeated in the action cluster.
- At standard widths, the action cluster uses no more than about 40% of the card, aligns to the card's right padding, and bottom-aligns with the two-row medal shelf rather than centering against the whole card.
- At narrow widths, the action cluster stacks below the medal shelf, remains left-aligned, and the Resume button spans the available width.
- Selecting `Resume →` opens the active question panel immediately. Fresh sessions keep the existing onboarding-led collapsed state.
- The pips goal is the next milestone (10 → 15 → 20 → 25 → 30), not a fixed 10. Counting past the goal must keep working.
- There is no `New session` / reset control on the card. Clearing progress is a dev action (localStorage), not a tester affordance.
- Contrast floor on the dark card: body text at `rgba(255,255,255,0.84)` minimum, small-caps labels at `0.72` minimum. The old `0.55` floor was too low for small text — reserve values below `0.72` for decorative elements only, never for text that must be read.

## Gamification Rules

- Milestone ranks: 5 `Street Scout`, 10 `Trail Seeker`, 15 `Horizon Chaser`, 20 `World Mapper`, 25 `Star Navigator`, 30 `Cosmic Explorer`.
- Every medal reserves the same centered two-line label area. The six resume-card medals use a three-by-two shelf at standard widths and switch to two columns at `340px` and below, including equivalent high-zoom layouts. Never shrink, truncate, or horizontally scroll medal names.
- Medals are letterpress seals. Locked medals stay dark and desaturated; earned medals keep the same seal and icon geometry but gain a tier-specific metallic material: bronze, silver, gold, emerald, diamond-blue, then master-violet. The next empty slot remains visible as the motivator.
- Earned medal color is an achievement state, not a route identity. Do not reuse the exact Route A orange or Route B green values in the medal palette.
- Resume-card medals are buttons. The front shows the icon and medal name; tapping/clicking flips the medal to show the route count needed to earn it.
- Celebration happens in words (serif italic rank in the title), not in effects. No neon, no pulsing glow.
- Reward count only. Never reward speed — no timers or time-based scores, they bias answers.
- When a medal is earned, the number in the HUD dial turns edge-on and reveals the colored medal icon. `Unlocked` and the medal name reveal beside the dial; after about 2.3 seconds, the message retracts and the dial turns back to the new current route number.
- Medal unlock feedback stays inside the existing HUD, never dims the map, moves the camera, blocks interaction, plays sound, or uses confetti. Reduced-motion mode changes state without rotation, and a medal is announced only when its exact comparison threshold is completed.

## Exit And Progress Rules

- Saving is a property of the system, not a user action. Progress autosaves on every answer change, step advance, and round submission.
- Exit is one click with no confirmation dialog: it saves current progress and leaves. There is no "leave without saving" path.
- The exit button label is `Exit test — progress is saved` (aria-label and title) so hover/AT users learn the behavior before clicking.
- A `Saved ✓` status flickers next to the round chip after each submitted round. It is status, not a control — `pointer-events: none`, never styled like a button.
- The resume card on the intro page is the post-exit reassurance: landing on it shows nothing was lost.
- Completed submitted rounds remain submitted.
- Resuming returns the tester to the exact saved position, including a partially answered round (`questionStep` + `partialAnswer` in the progress payload).

## Round Transition Rules

- Finishing a round must feel different from advancing to another question.
- After `Finish round`, the question panel keeps its expanded footprint while the old question fades out. `Complete` appears beside the dial and the old route pair fades from the map.
- The newly earned dial segment flashes hot coral, briefly enlarges, and settles to completed ivory. Existing illuminated segments dim slightly during the flare so the progress change is unmistakable.
- Hold the coral activation and `Complete` message long enough to register as one beat, approximately `0.9s`, before returning to the normal question state.
- Coral is a temporary activation state only. It must not remain in the dial or replace the Route A orange identity.
- The next route pair fades in and the new Q1 fades into the same expanded panel. Finishing a round must never collapse the question panel or change its height.
- At medal thresholds, the standard round transition resolves first and flows directly into the medal unlock reveal.
- Keep the complete beat under one second, do not move the map camera beyond fitting the newly loaded pair, and replace fades with immediate state changes when reduced motion is requested.

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
- Does onboarding show the complete minimum workflow together without adding unnecessary instructions?
- Does the question panel collapse when map inspection matters?
- Is there any repeated or unnecessary copy?
- Does the change work on both laptop and mobile?
- Does the UI still feel subtly arcade without becoming cluttered?
- Are all task-critical labels readable in a screenshot at 100% zoom without enlarging the image?
- Does any compact HUD/status text wrap, truncate, or drop below the minimum opacity/size rules above?
