# ARI Route Benchmark Design System

This document captures the design rules shared by the ARI route benchmark family. Use it before creating, reviewing, or changing interface elements in this repo. [`QUESTIONNAIRE.md`](QUESTIONNAIRE.md) is the canonical product reference for current participant-facing copy; runtime options and follow-up rules live in `CHALLENGE_CONFIGS` in `index.html`. The visual and interaction system is shared.

## Product Intent

This is a map-first blinded benchmark family. Both active challenges compare Route A and Route B. Testers never see which provider produced a visible route.

Calm Route Comparison asks whether Calm Quiet or Calm Nature best fits a calm walk, with their identity randomized across A/B. Fast vs Google Fast asks which of two routes works better as a fast route. The interface should help testers inspect routes clearly, make a confident choice, and answer with minimal friction in either challenge.

## Design Principles

- Map first: the map and the two routes are the primary task surface.
- Focused, not cluttered: reduce copy and controls unless they directly help the test.
- Arcade, but subtle: use a compact game/HUD feeling without making the UI noisy or gimmicky.
- Clear affordances: buttons must look clickable; status text must not look clickable.
- Route colors are reserved: green and purple belong to Route A / Route B and route answer buttons only.
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

Core colors in `src/styles/calm-benchmark.css` follow the public Ari tokens:

- Plum ink: `#211A2A`
- Off-white canvas: `#F5F5F5`
- Sun: `#F6F261`
- Blurple primary action: `#8A90F3`
- Orange brand fill: `#FF7C60`
- Green brand fill: `#8FD9A8`
- Route A identity: `#08784D` (green)
- Route B identity: `#4A52CC` (purple)
- Fast identity: `#FF7C60` (orange — same as the orange brand fill token)

Rules:

- Use Route A green and Route B purple only for route lines, route markers, and route answer choices. Fast orange is reserved for the Fast route line and the Fast session card.
- Do not use route colors for generic emphasis, progress, onboarding labels, or primary UI actions.
- The single primary action uses blurple with plum ink. Route green, purple, and Fast orange never style generic actions.
- Secondary buttons should be subtle but visibly clickable.
- Status chips should use neutral text and transparent or very low-emphasis backgrounds.
- Check contrast whenever text sits on tinted or dark surfaces.
- On dark glass surfaces, readable text must not go below `rgba(255,255,255,0.84)`. Decorative separators, borders, and disabled states may be lower, but labels, status, goals, and helper copy may not.

## Typography

Font families:

- UI font: `Cera Pro`, with `Poppins` as the embedded stand-in until licensed files land.
- Emotional accent: `New Spirit` italic, with `Fraunces` as the embedded fallback.

Rules:

- Product UI labels, buttons, HUD text, and question text use Cera Pro/Poppins.
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

- The current Calm-only phase uses a shared header with static `Calm Route Comparison` context on the left and `Home | Results` views on the right. The header shares the exact content width of the intro below it — its wrap participates in the same border-box sizing as the content.
- The multi-challenge selector is dormant during this phase. The root and fresh-preview entry points open Calm Route Comparison directly, with no intermediary screen.
- The selector rules below are retained only as a future reactivation specification; they do not describe the current participant flow.
- While the chooser is open, its off-white canvas and dark cabinet surface preserve continuity with the benchmark while fully replacing its content. No benchmark, header, map, or page scrollbar remains visible behind it.
- Direct benchmark links such as `?game=calm` bypass the first-visit chooser. Returning visitors reopen the last selected challenge.
- The chooser is one continuous arcade stage rather than a web-style menu beside a preview card. Challenge selection is the primary task, Play or Resume is the primary command, and player progress is secondary context.
- On desktop, the stage uses a `60 / 40` structure: a vertical challenge list on the left and an unframed player-status pane on the right. The cabinet header and its divider provide the outer structure; the stage does not add another enclosing card or outline. On mobile, the same content stacks in task order: challenges, status, then Play or Resume.
- Challenge keys use full comparison names: `ARI Fast vs Google`, `ARI Fast vs ARI Calm`, and `ARI Fast vs ARI Safe`. The selected available key uses a powered split green/purple surface, a bright frame, an arcade cursor, and `Ready`. Unavailable keys use raised graphite surfaces that are visibly distinct from the cabinet, with readable labels and a quiet `Soon` state.
- The player-status pane never repeats the selected challenge. It shows the current medal, rank, and one concise progress line. Before the final medal the line combines routes with the next medal threshold; after completion it combines routes with the medal count.
- Challenge order never changes. The medal stays aligned to the center of the middle challenge key, even when the top or bottom key is selected. The route animation begins at two output ports on the selected key, travels as a parallel paired cable, then enters the fixed medal dock. Top and bottom selections use mirrored cable geometry; only the upstream transport cable reroutes.
- The medal, route endpoints, and rank copy are measured from the rendered layout. Route geometry stays inside the medal's vertical footprint in the status pane, and the rank copy below it is an explicit no-route zone. This keeps longer future rank names clear without masking collisions behind text.
- On stacked mobile layouts, the circuit uses the stage's outer rail to avoid crossing the remaining challenge keys, then enters a fixed symmetrical top dock above the medal.
- Opening the chooser draws both routes once, then uses a slow moving trace to keep the screen in attract mode. A confirmed selection retracts and redraws only the transport cable, leaves the medal dock stable, then gives the medal one restrained power pulse. Hover never moves the circuit. Reduced-motion mode shows the completed route immediately without looping or pulsing motion.
- All challenges share one vertical selector. Calm Route Comparison and Fast vs Google Fast are playable. Fast vs Safe remains visible as a disabled `Soon` option until its flow exists.
- The stage has exactly one ivory Play or Resume command. It is intentionally distinct from the dark challenge keys.
- Selection is communicated by the cursor and active frame only. Do not add `Select a challenge`, `Selected challenge`, or `Selected` labels, and do not repeat the selected challenge inside the CRT.
- `fresh.html` is the non-destructive QA entry point. It previews a new player without deleting locally saved sessions.
- Development previews may enable `Reset test data` through runtime configuration. It clears local answers, progress, participant state, medals, and challenge selection, then returns to the true first screen while preserving map API configuration. Production removes this control from the DOM.
- Switching challenges must preserve existing progress. Results and comparison views always belong to the currently selected challenge.
- Header, intro text, cards, and start card must share the same content width.
- On mobile, the session card appears before the start card.
- Avoid repeating the same information in the hero, cards, and start section.
- The `How it works` and `Session` overview cards are always expanded. Their notch labels are headings, not interactive controls, and returning testers see the same complete overview as new testers.
- Side-by-side overview cards use a `360px` desktop height. Their title rows are content-driven so translated or wrapped headings cannot collide with the card body. Below `900px`, both cards return to content-driven height.
- The intro question and route label form one responsive typographic lockup: they fill one line on wide desktop and wrap naturally at narrower widths. The fixed route slot continuously swaps between Route A and Route B; pointer and keyboard interaction must not stop this authored comparison cue, while reduced-motion mode keeps Route A static.
- The expanded Session card uses `23 comparisons.` as the full route-pair journey, reassures testers with `Every careful comparison helps.`, gives the target duration as `About 6 to 8 min`, confirms `Desktop and mobile` support, and introduces the four-medal progression culminating in `Cosmic Explorer` at 23 comparisons.
- The resume card is an evolving rank world. It begins as the near-black arcade cabinet, then progressively gains street geometry, a traced trail, a horizon, map contours, constellations, and a cosmic field as medals are earned.
- Rank motifs remain low-contrast behind the content and never change the card layout or ivory action. The latest rank controls the surface tint, border light, and title accent. The countdown caption stays neutral white regardless of rank — tinted text there reads as a route color.
- Crossing a medal threshold reveals the new world layer outward from that medal's position once. Reloading or revisiting an already earned tier must not replay the animation, and reduced-motion users receive the final state immediately.
- Do not add a separate `How your answers help` disclosure to the Session card. Keep its content in one scan-friendly stack.

Alignment QA:

- Elements that must share a center line can opt into the browser check with the same `data-align-group` value.
- Open `?qa=alignment` after changing headers, HUD pills, or button groups.
- Run `window.ariCheckAlignment()` in the browser console when checking the current visible state manually.
- A group fails if its vertical center drift is more than `1px`.
- If a hidden element is visually collapsed, also collapse its spacing (`gap`, margin, padding, line-height side effects), or remove it from layout.

Benchmark screen:

- The map owns the full viewport.
- The question panel overlays the map and can collapse for inspection.
- The question panel and map controls share the same responsive edge inset: `24px` on desktop and `20px` on mobile, including safe-area insets.
- The question panel starts collapsed while onboarding coachmarks identify the map controls.
- Pressing `Start comparison →` closes onboarding and expands the question panel.
- After onboarding, the tester can collapse or expand the panel without changing the map camera.

## Map Control Rules

Map controls must be comfortable to use and not stick to the browser edge.

Placement:

- Fit and the Street View pill embed in the map provider's native top-right control stack, above the provider's own camera/zoom controls, so all map controls read as one column. The provider's standard corner margins govern them there.
- Fit, Zoom in, and Zoom out use one provider-neutral navigation rail so their order, sizing, and focus treatment stay consistent across map engines.

Spacing:

- Floating overlay surfaces (question panel, hints, dividers): `24px` from the viewport/map edge on desktop, `20px` on mobile, never closer than `16px`.
- Use `10px` gap between stacked benchmark controls.

Size:

- Benchmark-owned map buttons should be at least `44px x 44px`; native provider controls keep their native sizing.
- Keep the hit area comfortable even if the icon is visually small.

Fit routes behavior:

- `Fit` should return to the closest useful comparison view.
- It should keep both routes visible from start to end.
- Every visible route uses the same `4px` color core with a `7px`, low-opacity white casing so no slot receives extra visual weight and the street beneath remains legible. Exact shared street segments fan into consistently ordered A/B tracks; unique segments remain on their true centerline. Rounded run endings keep the join clean when tracks separate. The invisible `32px` interaction area stays on the real geometry.
- Start and destination use neutral Google-style markers rather than route colors: a circular `S` marks the shared origin and a pointed `D` pin marks the shared destination. Their labels stay distinct from the blinded Route A/B identities, and both markers anchor to the exact shared route coordinate so every route visibly converges on the same endpoints.
- When the question panel overlaps the map, Fit measures the available rectangles to its right and below it, chooses the larger useful region, and centers both routes inside that region.
- It should work after zooming in, zooming out, or panning away.
- Current onboarding copy:
  - `Fit both routes.`
  - `Use Fit to return to the full comparison.`

Street View:

- Street View is an explicit map mode so ordinary pan, pinch, double-click, and zoom gestures stay unchanged.
- Street View sits first as one connected 148×44 control: a near-black text cell joined directly to a white `360°` cell. The full shape is clickable, and the restrained 14px radius keeps it distinct from a generic capsule. The glyph communicates panorama without using a human figure that could be mistaken for accessibility.
- An 8px gap separates the exploration mode from one provider-neutral 44px-wide navigation rail. The rail groups `Fit`, `Zoom in`, and `Zoom out` in that order with fine dividers, keeping their centers and hit targets identical across map engines.
- Activating Street View keeps the control named `Street View`, clearly inverts the glyph cell, and shows a persistent compact status: `Street View mode on` / `Select any point on the map to explore it in Street View.` Keyboard users can press A, B, or C for a representative point on that route.
- Fit uses the inward-arrows fit-to-content glyph. Never use outward fullscreen corners for Fit; they promise fullscreen, not framing.
- Street View accepts any map point and searches for the nearest available imagery. A click directly on a visible route snaps to that route only to preserve its blinded A/B identity; clicks elsewhere remain at the chosen map coordinate.
- Selecting a point opens a split inspection layout: on desktop the panorama fills the right 65% (55% below 1100px wide) while the live comparison map keeps a full-height left column; on mobile the panorama takes the top 58% with the map below it. The map column keeps all routes, the moving position marker, and its map controls, and selecting another map point retargets the panorama.
- On desktop, opening Street View automatically collapses the question card and hides the now-redundant Street View toggle while keeping the navigation rail visible. `Back to map` restores the participant's previous panel state. On mobile the question card stays hidden until `Back to map`.
- The seam between map and panorama is a draggable divider with a slim grabber and a 44px hit band: `col-resize` on desktop, a horizontal thumb bar on mobile. Dragging clamps (desktop panorama 40–85% with the map column never under 440px; mobile panorama 30–70%), arrow keys nudge it by 2% for keyboard users, double-click resets to the default split, and the chosen ratio persists per device.
- Entering and leaving Street View animates the same seam: it glides open to the saved split (~320ms) and glides shut on `Back to map` (~300ms) while the map resizes continuously. The app never refits routes or restores an older camera; the participant's latest center and zoom survive both transitions. Reduced motion switches instantly.
- `Back to map` keeps the latest camera, restores the previous question-panel state and answers, then turns the mode off.
- The viewer identifies points on Route A or Route B with the visible route color. Off-route points are rejected before the viewer opens. It never exposes the route source.
- The map marks the current panorama position with a live marker: identity-colored core, soft pulsing halo (static at low opacity under reduced motion), and a translucent view cone that rotates with the panorama heading. It is the only element on the map that pulses or has a beam, so it can never be confused with the static start/destination dots. It moves as the tester walks and the cone follows where they look.
- If imagery or the Google API is unavailable, show that state inside the inspector and keep the tester in the benchmark. Never open an external tab as a fallback.

## Onboarding Rules

Purpose:

- Teach only the minimum needed to inspect the map and answer.
- Reassure testers that they can leave and resume without losing progress.

Behavior:

- Onboarding uses simultaneous contextual coachmarks, not a step-by-step tour.
- All essential instructions appear at the same time beside the UI they explain.
- Do not include zoom instructions; standard map zoom controls remain available without explanation.
- One `Start comparison →` action closes onboarding and smoothly expands the question panel so the tester can answer immediately.
- Do not add progress dots, a skip link, or controls that imply multiple steps.
- Coachmarks avoid every highlighted target, the primary action, and one another on desktop and mobile.
- While onboarding is open, the map and question card are inert, focus moves to `Start comparison →`, and Tab remains contained in the dialog.
- The dimming layer has real transparent cutouts so highlighted controls remain at full brightness.
- Coachmarks use flat warm-ivory surfaces with dark text, strong connectors, and a single synchronized entrance pulse so guidance cannot be mistaken for the dark application UI.
- `Start comparison →` remains a brighter, raised pill with a heavy dark frame so it reads as the action rather than another coachmark.
- `Start comparison →` is a prominent bottom-center dock on desktop and remains top-center on mobile to avoid the question card.
- Initial route fitting is immediate and runs once before onboarding settles; opening or closing onboarding must not pan or refit the map.

Current onboarding overview:

1. Beside Fit: `Fit both routes` / `Return to the full comparison.`
2. Beside Street View: `Explore the street` / `Turn on Street View, then select any point on the map.`
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
- The medal progress dial shows the current route number in its center and five evenly spaced metallic segments show proportional progress within the active medal stage.
- Incomplete segments stay dark but visible. Completed segments illuminate in neutral ivory, and only the newest segment briefly brightens. Route green, purple, and Fast orange are never used.
- Routes 5, 10, 15, and 23 complete each medal stage before the next appears. After route 23, the dial remains at `23` with the full shelf earned.

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
- Route A and Route B use accessible green and purple label colors on transparent rows. Their hover states retain the label color and add a subtle matching tint; never replace route identity with the generic gray/white hover treatment. When selected, they use their respective green or purple surface with white text and a checkmark to preserve route identity without implying correctness. Neutral answers retain the light selected surface.
- `Next question` is clearer than `Submit answer` when the user is moving through follow-up questions.
- `Back` for Q2/Q3 should be near the question flow, not in the global HUD.
- Q1 should not show optional free text.
- When a challenge enables route metrics, each Route A/B answer row carries decision-relevant values in the row's route color. Fast vs Google shows rounded distance only because its provider duration models are not comparable. Calm Route Comparison shows rounded estimated walking time (`26 min`) and a compact delta from Fast mode for the same round (`+2 min`). Comparison 1 shows the full timing and route-selection guidance as two short paragraphs; later comparisons replace it with an `About these choices` disclosure that reveals the same copy on demand. Neutral answer rows never show metrics.
- After Route A, Route B, or Both work well is chosen and explained, Calm Q3 asks how much the selected Calm route option(s) improve things compared with only seeing Fast. The map draws Fast in orange alongside only the selected Calm route(s), and a compact flat strip lists each visible route's rounded time before the `A lot`, `Somewhat`, `A little`, `Not at all`, and `I'm not sure` choices.
- Both work poorly never receives the value-vs-Fast Q3. Its only follow-up is the dedicated rejection-reasons checklist, after which the round ends.
- Calm Route Comparison uses a single-choice Q1: Route A, Route B, `Both work well`, `Both work poorly`, or `I'm not sure`. Route A, Route B, and `Both work well` receive both the preference-reasons Q2 and the value-vs-Fast Q3. Q2 accepts multiple reasons, treats `I'm not sure` as exclusive, and reveals an optional detail field after any reason is selected. Choosing `Both work poorly` asks `What made you choose neither route?`, clarifies that reasons may apply to one or both routes, and offers its own multi-select rejection reasons with the same optional-detail behavior.
- While Q1 is active, every selected route remains at full opacity and its normal width; only unselected routes recede to half opacity. Hover or keyboard focus may temporarily thicken one route, but must never dim another selected route. Neutral choices restore equal route visibility, and advancing to a follow-up resets all routes to equal visibility for inspection.
- Q1 does not display a route situation. A small information control beside the question reveals the calm definition only when requested; do not add a separate context row or text label.
- Q1 keeps that information control beside the question in both panel states. From the collapsed state, selecting it expands the panel and opens the calm definition; selecting the rest of the collapsed card expands with the definition closed.
- The expanded question panel keeps its HUD header and action row fixed. Only the question content may scroll, and the native scrollbar stays visually hidden; use a subtle content fade to signal additional answers below.
- Expanding or collapsing the question panel and opening optional question details must preserve the current map center and zoom. Only direct map controls, explicit route fitting, onboarding, or loading a new route pair may change the map camera.
- Animated expansion must measure the form in its true expanded layout before starting. Animate directly from `0` to that measured height, then release the inline height without changing the rendered size; never measure while the collapsed layout is still active.
- Single-choice answers remain on the current question after selection. Selecting an answer shows its selected state and enables `Next question`; only pressing that button advances the flow.
- The Fast vs Google follow-up uses a ten-option checklist beneath `Select all that apply.` Route A/B choices ask what made the other route worse; `Both work poorly` asks what made both routes poor options and uses plural option labels. Both variants store the same reason codes. `Other` remains available for uncategorized feedback, while `I'm not sure` is exclusive with the concrete reasons. After any option is selected, an optional `Add details (optional)` text box appears for supporting context; it is never required to continue.
- All answer rows and command buttons are at least `44px` high. Answer and button labels use approximately `0.875rem` on mobile and desktop.

Primary question:

`Which route would you choose for a calmer walk?`

The complete current question and option catalogue lives in [`QUESTIONNAIRE.md`](QUESTIONNAIRE.md). Do not preserve superseded participant-facing wording in design examples; historical compatibility belongs only to the answer schema and migration logic.

## Intro Start Card States

The dark start card on the intro page has two states that must read as the same surface:

- State 0 (no saved progress): kicker `Start testing`, title `Enter the route lab.`, name form on the right.
- Resume (saved progress): kicker `Welcome back, [name]`, title is always the count (`4 routes compared.`). The rank is never written in the title — the lit medal in the shelf is the rank statement, because the shelf is the journey display. The right cluster is `Resume →` with a one-line countdown caption beneath it.

Rules:

- Both states use the intro h2 pattern: bold number in Cera Pro/Poppins, serif italic phrase in New Spirit/Fraunces. No scoreboard numerals, no glow, no all-caps data blocks.
- There is no secondary progress bar on the card: the medal shelf is the only progress visual. Each fact appears exactly once — count in the title, journey and rank in the shelf, distance-to-next in the countdown caption.
- The `Resume →` button uses the same blurple primary treatment as `Start test →`.
- The resume action cluster contains exactly one element: `Resume →`. The distance to the next medal is carried by the next medal's light fill, never by a caption. Recency is not displayed anywhere on the card. The participant name appears once in the greeting and is not repeated in the action cluster.
- At standard widths, the action cluster uses no more than about 40% of the card, aligns to the card's right padding, and bottom-aligns with the two-row medal shelf rather than centering against the whole card.
- At narrow widths, the action cluster stacks below the medal shelf, remains left-aligned, and the Resume button spans the available width.
- Selecting `Resume →` opens the active question panel immediately. Fresh sessions keep the existing onboarding-led collapsed state.
- The fill goal is the next milestone (5 → 10 → 15 → 23) and rolls forward as medals are earned. Past the final goal there is no next medal and no fill; the fully lit shelf tells the story on its own.
- There is no `New session` / reset control on the card. Clearing progress is a dev action (localStorage), not a tester affordance.
- Contrast floor on the dark card: body text at `rgba(255,255,255,0.84)` minimum, small-caps labels at `0.72` minimum. The old `0.55` floor was too low for small text — reserve values below `0.72` for decorative elements only, never for text that must be read.

## Gamification Rules

- Milestone ranks: 5 `Street Scout`, 10 `Trail Seeker`, 15 `World Mapper`, 23 `Cosmic Explorer`.
- Every medal reserves the same centered two-line label area. The four resume-card medals use a four-column shelf at standard widths and switch to two columns at `340px` and below, including equivalent high-zoom layouts. Never shrink, truncate, or horizontally scroll medal names.
- Medals are letterpress seals. Locked medals stay dark and desaturated; earned medals keep the same seal and icon geometry but gain a tier-specific metallic material: bronze, silver, gold, then master-violet. The next empty slot remains visible as the motivator.
- Locked medals recede with distance: the next milestone renders at full presence with a near-white rim and icon, and each later seal steps down toward ~38%, so the shelf itself points at the active goal without arcs, rims, or added elements — including on a fresh card where nothing is earned yet. Only the seals carry the gradient — medal names keep a readability floor (≥82% presence) so every goal stays legible, including the final aspirational one. Hover, focus, or flip restores full presence. Do not add ornament to mark the next medal; light does the pointing.
- The next medal's seal fills from the bottom with its own tier metal in proportion to stage progress — the reward materializing is the countdown, and it is never written as text. The fill uses the tier's metallic ramp (never a flat color; the medal-palette rule against route-color values applies to the fill too) at slightly translucent strength, while the icon and rim stay near-white for legibility. The full earned treatment — full-strength metal, tier icon color, glow — snaps in only at completion, so earning reads as the coin setting. Exact numbers live on the medal's flip face and in its screen-reader label (`next goal, 5 of 10 routes`).
- Earned medal color is an achievement state, not a route identity. Do not reuse the exact Route A green or Route B purple values in the medal palette.
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
- Route loading, answer delivery, and progress sync expose participant-facing loading/error states with Retry. Inputs remain intact, and a failed remote sync explains that the answer is still stored on the device.
- After 10 completed comparisons, a persisted checkpoint offers `End session` or `Keep comparing`. Ending opens Results; continuing starts comparison 11 without adding quantity pressure to the questions.

## Round Transition Rules

- Finishing a round must feel different from advancing to another question.
- After `Finish round`, the question panel keeps its expanded footprint while the old question fades out. `Complete` appears beside the dial and the old route pair fades from the map.
- The newly earned dial segment flashes hot coral, briefly enlarges, and settles to completed ivory. Existing illuminated segments dim slightly during the flare so the progress change is unmistakable.
- Hold the coral activation and `Complete` message long enough to register as one beat, approximately `0.9s`, before returning to the normal question state.
- Coral is a temporary activation state only. It must not remain in the dial or replace the Route A green identity.
- The next route pair fades in and the new Q1 fades into the same expanded panel. Finishing a round must never collapse the question panel or change its height.
- At medal thresholds, the standard round transition resolves first and flows directly into the medal unlock reveal.
- Keep the complete beat under one second, do not move the map camera beyond fitting the newly loaded pair, and replace fades with immediate state changes when reduced motion is requested.

## Results Rules

- Calm Route Comparison results are available from the beginning through the persistent `Results` navigation item. At zero responses, show the dashboard's empty state rather than a comparison-count lock.
- The team-results introduction uses the display role for `Team results`, the body role for its lead sentence, and the detail role for explanatory paragraphs. Prose is constrained to `72ch`; paragraphs use a `12px` rhythm with `20px` between the lead and the first explanation.
- Calm results use two primary views: `Overview` for team-wide evidence and `Participants` for named individual records.
- `Overview` answers the first research question in a strict reading order: team tester and comparison totals first; then the percentage where Calm Nature worked as an option (`Calm Nature + Both work well`); then the complete Q1 outcome distribution for Calm Quiet, Calm Nature, both, neither, and uncertainty; then the overall Quiet-versus-Nature preference and its uncertainty. Pair-level agreement and the participant heatmap remain supporting evidence below this summary. Overall repeated judgments use participant-clustered 95% intervals, while individual route pairs use Wilson 95% intervals.
- The Quiet-versus-Nature overview includes only comparisons where one route was selected. It shows the aggregate preference split, whether its participant-clustered interval rules out an even split, how many route pairs each approach led, ties, and the median within-pair majority. A small numerical lead must not be described as a clear winner when its interval includes 50%.
- The Overview participant-by-pair heatmap keeps route pairs as columns and participants as rows. Its row summaries describe viability, single-route preference, and decisiveness without ranking participants or treating variation across different routes as error.
- Calm Quiet and Calm Nature use decoded route identities in Results. Because A/B presentation is randomized, the participant-facing A/B route colors must not be reused as if they permanently represented Quiet or Nature. Results use Ari blurple for Calm Quiet and Ari green for Calm Nature; shared, rejected, and uncertain outcomes recede into the neutral Ari greys.
- Preview data includes 15 deterministic illustrative testers across all 23 embedded route pairs so clear agreement, mixed judgment, rejection, and uncertainty states remain inspectable without entering production data.
- `Participants` lists every contributor by name. The participant attached to the current local session appears first, without an additional identity badge. Selecting a name shows only that person's counts, decoded choices, reasons, optional written details, and round-by-round records.
- Participant-facing `My results` shows one consolidated history for the current person and never introduces a session selector. Researcher mode may still expose session counts as provenance inside a participant record.
- Names and optional written details are explicitly described as visible to the evaluation team at the point of entry.
- Participant identity uses a generated participant ID that remains stable for the same normalized name on the same device. Session IDs remain separate and never count as team-member identities. Legacy records without an explicit participant ID are consolidated by normalized participant name across sessions; current records with explicit IDs remain distinct even when names match. Cross-device identity still requires an identity supplied by the production host.
- Individual records are descriptive, not evaluative: never rank people or label a choice as correct, aligned, or misaligned with the team.
- Individual records repeat each relevant follow-up question beside its recorded answer. The optional better-route checkbox remains part of the Q1 answer and appears only when selected as `✓ I know a better Calm route`; it is never rewritten as a separate yes/no question.
- Evaluation-record headers keep the decoded Q1 outcome chip visible in both collapsed and expanded states so the summary and controls do not jump. The expanded detail does not repeat the Q1 question and outcome; it begins with any selected better-route flag, then shows only follow-up answers, the map, and route details.
- Expanded record answers use a stable question-and-answer grid on wider screens: muted `font-fine` questions in the left column and the related chips, answer, and note grouped in the right column. The grid stacks question above answer below `700px`. The optional better-route flag sits above the grid as quiet context rather than competing with the answer hierarchy. Reason chips stay low-emphasis on `grey-02`; route colors are reserved for decoded route outcomes.
- In an individual record's route table, selected Calm routes replace the route dot with a same-color checkmark. Unselected rows keep their route-identity dots, and `aria-current` remains the non-visual selection signal.
- Each expanded individual record shows the evaluated route-pair map and comparison table. Records expand independently so participants can keep several routes open while reviewing their choices.
- Production answers are written to Supabase. Authorized researchers inspect or export the shared dataset through the Supabase dashboard; participant browsers cannot read it.
- Preview builds with no saved answers open on deterministic illustrative results and offer a `Use saved data` switch; populated previews offer `View sample data`. Sample records never enter the saved answer repository, exports, or production UI.
- Tied or neutral-only route selections use neutral copy and never manufacture a leading route.
- On narrow screens, the participant list becomes a horizontally scrollable selector and evaluation records reflow into labeled rows rather than forcing a wide table.
- Fast vs Google Fast results remain hidden until 10 completed comparisons so aggregate choices cannot influence an active participant before the checkpoint.

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
