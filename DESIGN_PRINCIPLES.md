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

**An active mode that opens a sub-view should survive that sub-view closing.**
Street View mode stays on when the panorama viewer is closed. The user is in a mode; dismissing one output of that mode does not exit the mode. Only explicitly toggling the control (or pressing Esc a second time) deactivates the mode.

**Two-level Esc for modal-within-mode flows.**
First Esc closes the innermost surface (e.g. panorama viewer). Second Esc exits the parent mode (Street View mode off). Never collapse both into one keystroke.

---

## Onboarding

**Skip must be visible and co-located with the primary action.**
A ghost text link outside the active card is invisible. The × dismiss button lives inside the card (top-left), so it is always within the user's focal area without requiring a separate hunt.

**Sequential, one-spotlight-at-a-time flow.**
Each onboarding step highlights exactly one element. Showing all coachmarks simultaneously creates cognitive overload.

---

## Copy & Labels

**Controls state their outcome, not their current state.**
"Exit Street View" (what clicking does) rather than "Street View On" (what is already true).

**Blinded study language.**
Route labels are always A / B (never algorithm names) to preserve the blind comparison. Do not expose `calm_quiet` / `calm_nature` identifiers in UI copy.
