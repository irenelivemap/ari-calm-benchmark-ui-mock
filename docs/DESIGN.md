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
- Street Scout, Trail Seeker, World Mapper, and Cosmic Explorer reuse one shared four-tier medal palette across Home, the comparison HUD, and Results.
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
- Home and researcher `Team results` use the `40–42px` page-title role with `1.02` desktop line-height (`1.08` on mobile), `800` weight, and `-0.02em` tracking. Participant Results keeps its semantic `h1`, but presents the visible introduction label with the quieter `22px` section-heading role because the persistent Results tab already supplies page context.
- Participant-facing Results explanation copy uses the same Home reading role: `17px` with `1.55` line-height. Charts, percentages, diagnostic metadata, and evaluation-record details retain the compact analytical scale.
- Shared navigation and primary-action labels use the Home control scale (`0.92em` in a `17px` context). Compact analytical controls may be smaller when they do not carry the primary task.
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
- The root entry opens Calm Route Comparison directly. The dormant challenge chooser remains implementation scaffolding for internal development and is not part of the current participant design contract.
- `fresh.html` is a local-only, non-destructive QA entry point. It previews a new player without deleting locally saved sessions.
- Development previews may enable `Reset test data` through runtime configuration. It clears local answers, progress, participant state, medals, and challenge selection, then returns to the true first screen while preserving map API configuration. Production removes this control from the DOM.
- Header, intro text, cards, and start card must share the same content width.
- On mobile, the session card appears before the start card.
- Avoid repeating the same information in the hero, cards, and start section.
- The `How it works` and `Session` overview cards are always expanded. Their notch labels are headings, not interactive controls, and returning testers see the same complete overview as new testers.
- Side-by-side overview cards use a `360px` desktop height. Their title rows are content-driven so translated or wrapped headings cannot collide with the card body. Below `900px`, both cards return to content-driven height.
- The intro question and route label form one responsive typographic lockup: they fill one line on wide desktop and wrap naturally at narrower widths. The fixed route slot continuously swaps between Route A and Route B; pointer and keyboard interaction must not stop this authored comparison cue, while reduced-motion mode keeps Route A static.
- The expanded Session card sets `10 comparisons` as the clear starting expectation and gives the target duration as `About 10 minutes`. A second, concise point makes continued participation optional and motivating: testers with more time can complete all 23 to earn every medal and climb the leaderboard. Results availability is explained by the locked tab rather than repeated in this card.
- The resume card is an evolving rank world. It begins as the near-black arcade cabinet, then progressively gains street geometry, a traced trail, a horizon, map contours, constellations, and a cosmic field as medals are earned.
- The Start testing card shows the same four-medal shelf before the first comparison, beginning at zero progress with Street Scout as the next goal. Saved progress updates this same component in place; do not introduce a separate pre-start medal treatment. On wide layouts, keep the name form grouped and bottom-align it with the medal shelf so the action row and medal names share one visual foundation. On narrow layouts, retain the even heading-to-medals-to-form rhythm.
- Rank motifs remain low-contrast behind the content and never change the card layout or ivory action. The latest rank controls the surface tint, border light, and title accent.
- Crossing a medal threshold reveals the new world layer outward from that medal's position once. Reloading or revisiting an already earned tier must not replay the animation, and reduced-motion users receive the final state immediately.
- Do not add a separate `How your answers help` disclosure to the Session card. Keep its content in one scan-friendly stack.

Alignment QA:

- Elements that must share a center line can opt into the browser check with the same `data-align-group` value.
- Open `?qa=alignment` after changing headers, HUD pills, or button groups.
- Run `window.ariCheckAlignment()` in the browser console when checking the current visible state manually.
- A group fails if its vertical center drift is more than `1px`.
- If a hidden element is visually collapsed, also collapse its spacing (`gap`, margin, padding, line-height side effects), or remove it from layout.
- Home and Results use the same desktop content frame: `1224px` of usable content within the `1280px` shell, with `28px` desktop gutters and `18px` mobile gutters.

Benchmark screen:

- The map owns the full viewport.
- The question panel overlays the map and can collapse for inspection.
- The question panel and map controls share the same responsive edge inset: `24px` on desktop and `20px` on mobile, including safe-area insets.
- The question panel starts collapsed while onboarding coachmarks identify the map controls.
- Pressing `Start comparison →` closes onboarding and expands the question panel.
- After onboarding, the tester can collapse or expand the panel without changing the map camera.
- The onboarding exit cross stays on the left, matching the benchmark exit convention. Numbered steps combine a quiet previous-step chevron with the existing step count on the right; the opening briefing has no back control.
- On `Compare the routes`, the scrim recedes enough for both route colors to remain clearly visible. Returning to a previous step restores that step's coachmark and visual emphasis without changing the map camera or answer state.

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
- Activating Street View changes the control outcome to `Exit Street View`, clearly inverts the glyph cell, and exposes an accessible instruction to select any map point. Keyboard users can press A or B for a representative point on that route.
- Fit uses the inward-arrows fit-to-content glyph. Never use outward fullscreen corners for Fit; they promise fullscreen, not framing.
- Street View accepts any map point and searches for the nearest available imagery. A click directly on a visible route snaps to that route only to preserve its blinded A/B identity; clicks elsewhere remain at the chosen map coordinate.
- Selecting a point opens a split inspection layout: on desktop the panorama fills the right 65% (55% below 1100px wide) while the live comparison map keeps a full-height left column; on mobile the panorama takes the top 58% with the map below it. The map column keeps all routes, the moving position marker, and its map controls, and selecting another map point retargets the panorama.
- Opening Street View preserves the question card's current expanded or collapsed state and its normal dimensions. The card narrows only when the remaining desktop map column cannot fit the full rail; on mobile, its height is constrained only when needed to fit below the panorama, with the question remaining visible and internally scrollable. The now-redundant Street View toggle is hidden while the split is open.
- The seam between map and panorama is a draggable divider with a slim grabber and a 44px hit band: `col-resize` on desktop, a horizontal thumb bar on mobile. Dragging clamps (desktop panorama 40–85% with the map column never under 440px; mobile panorama 30–70%), arrow keys nudge it by 2% for keyboard users, double-click resets to the default split, and the chosen ratio persists per device.
- Entering and leaving Street View animates the same seam: it glides open to the saved split (~320ms) and glides shut on `Back to map` (~300ms) while the map resizes continuously. The app never refits routes, restores an older camera, or changes the question-panel state; the participant's latest center, zoom, and panel choice survive both transitions. Reduced motion switches instantly.
- `Back to map` keeps the latest camera, restores the previous question-panel state and answers, then turns the mode off.
- The viewer identifies points selected on Route A or Route B with the visible route color. Off-route points remain neutral `Map point` selections. It never exposes the route source.
- The map marks the current panorama position with a live marker: identity-colored core, soft pulsing halo (static at low opacity under reduced motion), and a translucent view cone that rotates with the panorama heading. It is the only element on the map that pulses or has a beam, so it can never be confused with the static start/destination dots. It moves as the tester walks and the cone follows where they look.
- If imagery or the Google API is unavailable, show that state inside the inspector and keep the tester in the benchmark. Never open an external tab as a fallback.
- If the base map cannot start, try the configured fallback automatically. Only after every map engine fails, show one compact dark in-map status with `Map unavailable`, a short connection explanation, and `Try again`. Never leave the map as an unexplained blank surface or replace the benchmark with a full-page error.

## Onboarding Rules

Purpose:

- Teach only the minimum needed to inspect the map and answer.
- Reassure testers that they can leave and resume without losing progress.

Behavior:

- Onboarding is sequential: one opening briefing followed by three numbered steps.
- Each numbered step presents one instruction and, where relevant, one contextual highlight. Previous-step navigation sits beside the step count; the opening briefing has no Back control.
- Do not include zoom instructions; standard map zoom controls remain available without explanation.
- The final `Start comparison →` action closes onboarding and smoothly expands the question panel so the tester can answer immediately.
- Do not add progress dots or a detached skip link. The consistent top-left × dismisses the introduction at every step.
- Coachmarks avoid their highlighted target and the primary action on desktop and mobile.
- While onboarding is open, the map and question card are inert and Tab remains contained in the active dialog step.
- The dimming layer has real transparent cutouts so highlighted controls remain at full brightness.
- Coachmarks use flat warm-ivory surfaces with dark text and strong connectors so guidance cannot be mistaken for the dark application UI.
- `Start comparison →` remains a brighter, raised pill with a heavy dark frame so it reads as the action rather than another coachmark.
- Initial route fitting is immediate and runs once before onboarding settles; opening or closing onboarding must not pan or refit the map.

Current onboarding overview:

1. Briefing: `Before you start` explains the calm-walk scenario.
2. Step 1: `Compare the routes` explains the shared start and destination.
3. Step 2: `Explore the map` introduces pan, zoom, and Street View.
4. Step 3: `Choose when ready` points to the question panel and ends with `Start comparison →`.

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
- Follow-up route names keep their route color but use the same `700` weight as the question. Q3 keyword emphasis also stops at `700`; avoid extra-bold fragments inside its longer prompts and choices because they interrupt scanning.
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
- When a challenge enables route metrics, each Route A/B answer row carries decision-relevant values in the row's route color. Fast vs Google shows rounded distance only because its provider duration models are not comparable. Calm Route Comparison shows both the rounded estimated walking time (`26 min`) and the delta from Fast (`+2 min`) at `0.78rem` (`12.48px`) and weight `600`; spacing and reduced opacity keep the delta visually secondary without making either value bold. Comparison 1 shows the full timing and route-selection guidance as three short paragraphs; later comparisons replace it with an `About these choices` disclosure that reveals the same copy on demand. Neutral answer rows never show metrics.
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

- State 0 (no saved progress): kicker `Start testing`, title `Ready to compare routes?`, name form on the right.
- Resume (saved progress): kicker `Welcome back, [name]`, title is always the count (`4 routes compared.`). The rank is never written in the title — the lit medal in the shelf is the rank statement. The right cluster contains only `Resume →`.

Rules:

- Both states use the intro h2 pattern: bold number in Cera Pro/Poppins, serif italic phrase in New Spirit/Fraunces. No scoreboard numerals, no glow, no all-caps data blocks.
- There is no secondary progress bar or countdown caption on the card: the medal shelf is the only progress visual. Each fact appears exactly once — count in the title, journey and rank in the shelf.
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
- Celebration stays concentrated in the HUD at intermediate milestones. At comparison 10, one restrained map-themed confetti burst acknowledges the Trail Seeker milestone while comparison 11 loads underneath it; there is no blocking celebration panel. Completing comparison 23 is the single exception: one full-viewport confetti shower plays over the final completion state to mark the end of the complete route set.
- Reward count only. Never reward speed — no timers or time-based scores, they bias answers.
- When a medal is earned, the number in the HUD dial turns edge-on and reveals the colored medal icon. `Unlocked` and the medal name remain visible for about 3.6 seconds so participants have time to read them; the message then retracts and the dial turns back to the current route number.
- Medal unlock feedback stays anchored to the existing HUD and never dims the map, moves the camera, blocks interaction, or plays sound. Confetti uses sun yellow, coral, ivory, and silver rather than route colors, plays once only after the answer is saved, and is omitted for reduced-motion users. The comparison-10 burst remains local to the HUD; the final-comparison shower distributes pieces across the viewport, remains pointer-transparent, and clears automatically. A medal is announced only when its exact comparison threshold is completed.

## Exit And Progress Rules

- Saving is a property of the system, not a user action. Progress autosaves on every answer change, step advance, and round submission.
- Exit is one click with no confirmation dialog: it saves current progress and leaves. There is no "leave without saving" path.
- The exit button label is `Exit test — progress is saved` (aria-label and title) so hover/AT users learn the behavior before clicking.
- A submitted round shows one save confirmation only: the checked `Saved` label beside the dial during the existing round transition. Do not add a second flashing save status.
- The resume card on the intro page is the post-exit reassurance: landing on it shows nothing was lost.
- Completed submitted rounds remain submitted.
- Resuming returns the tester to the exact saved position, including a partially answered round (`questionStep` + `partialAnswer` in the progress payload).
- Route loading, answer delivery, and progress sync expose participant-facing loading/error states with Retry. Inputs remain intact, and a failed remote sync explains that the answer is still stored on the device.
- After 10 completed comparisons, comparison 11 loads automatically while the HUD celebrates Trail Seeker. The existing exit control remains available without being promoted during the milestone. Only the final comparison replaces the question flow with `View results →`.

## Round Transition Rules

- Finishing a round must feel different from advancing to another question.
- After `Finish round`, the question panel keeps its expanded footprint while the old question fades out. `Saved` appears beside the dial and the old route pair fades from the map.
- The newly earned dial segment flashes hot coral, briefly enlarges, and settles to completed ivory. Existing illuminated segments dim slightly during the flare so the progress change is unmistakable.
- Hold the coral activation and `Saved` message long enough to register as one beat, approximately `0.9s`, before returning to the normal question state.
- Coral is a temporary activation state only. It must not remain in the dial or replace the Route A green identity.
- The next route pair fades in and the new Q1 fades into the same expanded panel. Finishing a round must never collapse the question panel or change its height.
- At medal thresholds, the standard round transition resolves first and flows directly into the medal unlock reveal.
- Keep the complete beat under one second, do not move the map camera beyond fitting the newly loaded pair, and replace fades with immediate state changes when reduced motion is requested.

## Results Rules

- Calm Route Comparison keeps the persistent `Results` navigation item visible from the beginning, but disables it until the participant's first completed comparison is successfully saved. The disabled control retains its footprint, shows a quiet lock, and explains the prerequisite in a compact tooltip on hover or keyboard focus. The tooltip is also connected as the control's accessible description. When a participant exits an active test to Home after saving at least one comparison, the full segmented-control background receives a soft sun-yellow highlight while the active Home pill remains off-white, alongside a one-time anchored `Your results are ready.` cue. The frame highlight fades in while the cue rises `8px` and fades in over `180ms`; both remain for five seconds, then return the navigation to its ordinary appearance. Opening Results clears both states immediately. Do not leave a persistent badge, redirect automatically, or add a duplicate Results action to the Home cards.
- `Team results` keeps the same page-title treatment as Home. The participant introduction keeps the document's semantic `h1` but uses the section-sized visual treatment `A quick explanation of what you did`, matching `Route Explorers Leaderboard`. The participant explanation uses one full-width text flow at every viewport; the researcher explanation retains its analytical desktop columns and returns to one column below `900px`. Paragraphs keep a `12px` internal rhythm.
- The current Calm participant surface has one active Results view, so it does not repeat that state in a second local switcher. Researcher mode exposes only the real `Participants` and `Routes` destinations. Do not show a disabled `Overview` or `Soon` placeholder until that destination exists.
- Keep the full Calm evaluation explanation visible in the Results introduction, filling the shared frame through balanced desktop columns. Immediately after it, show `Route Explorers Leaderboard`, followed by the personal analytics and `Your comparisons` records. Do not move the explanation into a disclosure and do not add a leaderboard tab.
- The participant leaderboard initially shows the top five people plus the current participant when they are outside the top five. `Show all` reveals the full team on every viewport. Top-three trophies carry rank visually, while every rank has one accessible name. Duplicate display names receive a short, stable participant code rather than a session-like ordinal.
- Use dividers only for the two participant Results transitions: team progress to personal analytics, and personal summaries to detailed comparisons. Do not bracket `Route Explorers`, underline the analytics headings, or draw an outer line around the leaderboard. Inside the leaderboard, use one structural divider after the podium rather than separating every row.
- `Route Explorers Leaderboard` is participant-facing only; do not show it in researcher mode. It ranks unique valid current-corpus route comparisons and caps progress at 23. Participants below 23 with equal progress share a rank. Participants who reach 23 are ordered and ranked by the time they first completed all 23 distinct routes, so the earliest finisher stays ahead; the public feed exposes only that completion order, never the underlying timestamp. Each row shows rank, participant, the four earned/locked medal seals, and a neutral progress bar with `N / 23`; do not repeat the medal level in a separate column. The current participant uses the lime marker treatment regardless of rank, without a redundant identity badge.
- In each Route Explorers row, the newest earned medal is slightly larger, fully saturated, and marked by one small sun-yellow sparkle; it never uses an outer selection ring. Earlier earned medals recede slightly and locked medals remain dashed. Ranks 1–3 replace their numbers with one authored trophy-cup glyph in gold, silver, or bronze; all lower ranks remain plain numbers without badges. A completed `23 / 23` count uses the lime marker and a check icon, without changing the participant's rank logic.
- The local-only `sample=1` participant preview uses 15 deterministic mock participants with varied progress from 1 to 23 routes, so every rank, medal tier, and progress-bar state can be evaluated without altering saved participant data.
- Every viewport initially shows the top five participants plus the current participant when they fall outside that group. One `Show all` control expands the complete list inline. Participant names are not interactive.
- The separate participant-name heading and oversized route-count block are omitted from participant Results because the highlighted leaderboard row already carries identity and progress. The personal analytics use the parallel headings `Route choices` and `What influenced you`; their parent `Your choices` label remains visually hidden for document structure. Participant evaluation records are titled `Your comparisons`.
- On wide participant Results, route choices use roughly one third of the analytics width and reasons use two thirds. Show the five most frequent reasons first and let participants reveal the rest. This keeps the records close without hiding the full data.
- Researcher participant navigation uses the left master list on wide screens and one full-width native participant select below `900px`; never turn the participant list into a clipped horizontal rail. The researcher summary shows only routes completed and completion percentage, with the update time in the record header. Sessions are storage detail, not a Results metric.
- Participant `What influenced you` combines reasons supplied after choosing a route with reasons supplied after choosing neither. The participant sees one coherent explanation of all factors; researcher mode keeps the two branches separate for analysis.
- Global and local tab controls share the same selected-state grammar: a quiet grey group surface with an off-white selected item and plum text. Do not invert one tab system while keeping the other light.
- Use two radius tiers: `40px` for expressive Home feature cards and `16–24px` for quieter Results and data surfaces. Evaluation-record groups use the `16px` data radius.
- Results eyebrow and metadata text must use a secondary color that maintains at least `4.5:1` contrast against the off-white canvas.
- Calm Quiet and Calm Nature use decoded route identities in Results. Because A/B presentation is randomized, the participant-facing A/B route colors must not be reused as if they permanently represented Quiet or Nature. Results use Ari blurple for Calm Quiet and Ari green for Calm Nature; shared, rejected, and uncertain outcomes recede into the neutral Ari greys.
- Local researcher preview data includes 15 deterministic illustrative testers across all 23 embedded route pairs so varied outcomes remain inspectable without entering production data.
- Researcher `Participants` lists every contributor by name. The participant attached to the current local session appears first, without an additional identity badge. Selecting a name shows only that person's counts, decoded choices, reasons, optional written details, and round-by-round records.
- Participant-facing Results shows one consolidated history for the current person and never introduces a session selector. Session IDs remain storage provenance and do not appear as Results navigation or participant metrics in either mode.
- Participant identity is derived consistently from the normalized name or team-issued code, so the same person is consolidated across sessions and devices. Session IDs remain separate and never count as team-member identities. Use unique team-issued participant codes when two people could share the same name; names alone cannot distinguish them reliably.
- Individual records are descriptive, not evaluative: never rank people or label a choice as correct, aligned, or misaligned with the team.
- Individual records repeat each relevant follow-up question directly above its recorded answer with an `8px` internal gap and `30px` between question groups. The optional better-route checkbox remains part of the Q1 answer and appears only when selected as `✓ I know a better Calm route`; it is never rewritten as a separate yes/no question. Its treatment is a quiet acknowledgement, not a dominant yellow banner. When the participant supplied the conditional route description, Results show it directly below the selected flag in normal, high-contrast body type.
- The Q3 Fast-alternative text field appears only after `A lot`, `Somewhat`, or `A little`. Its placeholder and accessible name use `When might you take the Fast route shown instead? (Optional)`; changing to `Not at all` or `I'm not sure` hides the field and clears its value. Results show this prompt beside its response instead of presenting the text as an unlabeled comment.

### Results CSS ownership

- Keep canonical Results component rules in the `Results surfaces` and `Participant pair cards` sections of `src/styles/calm-benchmark.css`. Responsive changes belong in the existing shared breakpoints instead of appended override layers.
- When touching an existing Results selector, update its canonical rule and retire superseded declarations in the same change. A full stylesheet split is a separate architectural task and must not be mixed into launch-critical UI work.
- Evaluation-record headers keep the decoded Q1 outcome chip visible in both collapsed and expanded states so the summary and controls do not jump. The expanded detail does not repeat the Q1 question and outcome; it begins with any selected better-route flag, then shows only follow-up answers, the map, and route details.
- Expanded record answers use one consistent stacked rhythm at every viewport: muted `font-fine` question, `8px` internal gap, then the related chips, answer, or note. Leave `30px` between question groups. The optional better-route flag sits above the answers as quiet context rather than competing with the hierarchy. Reason chips stay low-emphasis on `grey-02`; route colors are reserved for decoded route outcomes.
- In an individual record's route table, selected Calm routes replace the route dot with a same-color checkmark. Unselected rows keep their route-identity dots, and `aria-current` remains the non-visual selection signal.
- Each expanded individual record shows the evaluated route-pair map and comparison table. Records expand independently so participants can keep several routes open while reviewing their choices.
- Production answers are written to Supabase. Authorized researchers inspect or export the shared dataset through the Supabase dashboard; participant browsers cannot read it.
- Local researcher mode can switch between deterministic sample data and saved device data. Sample records never enter the saved answer repository, exports, or production UI.
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
- Does onboarding teach one clear concept per step without adding unnecessary instructions?
- Does the question panel collapse when map inspection matters?
- Is there any repeated or unnecessary copy?
- Does the change work on both laptop and mobile?
- Does the UI still feel subtly arcade without becoming cluttered?
- Are all task-critical labels readable in a screenshot at 100% zoom without enlarging the image?
- Does any compact HUD/status text wrap, truncate, or drop below the minimum opacity/size rules above?
