# ARI Benchmark UI — Design Principles

Decisions made during design and development. Reference these before introducing new UI patterns.

---

## Layout & Spatial Conventions

**× (close / dismiss) goes top-left.**
Every panel, modal, and overlay that can be dismissed carries its × button in the top-left corner of that surface. This includes the onboarding panels, the Street View viewer header, and any future dialogs.

**Progress indicators and step counters go top-right.**
Metadata that describes where the user is (e.g. "1 / 3", round counter) sits in the top-right of the panel it belongs to. It is secondary to the action, so it should never compete with the primary close affordance.

**Primary action (Next / Submit) is always the last element in a panel.**
Users read top-to-bottom; the call to action comes after they have absorbed the content.

---

## Controls & Affordances

**Toggle state must be immediately legible from colour alone.**
Active toggles use the brand green (`--ari-green` / `--ari-green-deep`), not a shade of dark ink. Dark-on-dark active states are indistinguishable from inactive states at a glance.

**Closing a sub-view returns to the parent task.**
Closing the Street View inspector returns to the ordinary comparison map and turns Street View mode off. This prevents the next map gesture from unexpectedly reopening the inspector.

**Esc exits the active Street View state.**
When the panorama is open, Esc closes it and turns Street View mode off. When only targeting mode is active, Esc turns that mode off.

---

## Onboarding

**Skip must be visible and co-located with the primary action.**
A ghost text link outside the active card is invisible. The × dismiss button lives inside the card (top-left), so it is always within the user's focal area without requiring a separate hunt.

**Sequential, one-spotlight-at-a-time flow.**
The opening briefing is followed by three numbered steps. Each step highlights one element, keeps a quiet Back control beside the step count, and preserves the map camera and answer state when revisited.

---

## Typography & Legibility

**Interactive text (inputs, buttons, body copy) must be at minimum 1rem (16px).**
Never rely on browser-default input font sizes — browsers often render `<input>` at ~13px unless explicitly overridden. Always set `font: <weight> 1rem/1 <font-stack>` on inputs so size, weight, and family are all intentional.

**Typed/entered text must be at least font-weight 500 on dark backgrounds.**
Regular weight (400) thins out on dark surfaces even at full white (`#fff`). Use 500 for user-entered text in dark-background inputs to ensure comfortable legibility.

**Placeholder text must be visually distinct from typed text but still readable.**
Placeholder opacity ~0.62 (on dark) distinguishes guidance from real content while staying legible. Never go below 0.5 — invisible placeholders prevent users from understanding what a field expects.

**All body and interactive text must meet WCAG AA contrast (4.5:1 for normal, 3:1 for large ≥24px/18px bold).**
Check contrast when combining semi-transparent colours — the effective contrast is the blended result against the actual background, not just the foreground value.

---

## Copy & Labels

**Controls state their outcome, not their current state.**
"Exit Street View" (what clicking does) rather than "Street View On" (what is already true).

**Blinded study language.**
Route labels are always A / B (never algorithm names) to preserve the blind comparison. Do not expose `calm_quiet` / `calm_nature` identifiers in UI copy.
