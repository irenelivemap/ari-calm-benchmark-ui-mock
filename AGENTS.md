# Agent Guide

This repository is a static, framework-free prototype for blinded ARI route benchmarks. Read these files before editing:

1. `README.md` for setup and entry points.
2. `CONTEXT.md` for domain vocabulary.
3. `docs/ARCHITECTURE.md` for module ownership and runtime flow.
4. `docs/PRODUCT.md` and `docs/DESIGN.md` before changing behavior or UI.
5. The relevant data contract in `docs/` before changing stored records.

## Working Rules

- Preserve blinding. Testers see `Route A` and `Route B`; provider identities stay in the hidden assignment.
- Keep challenge-specific copy and question logic in `CHALLENGE_CONFIGS` in `index.html`.
- Keep shared active-benchmark behavior in `src/app/calm-benchmark.js`. The historical filename is retained for compatibility and powers every challenge.
- Treat `src/data/mock-*.js` as fixtures only. Production data must enter through `routePairProvider`.
- Never commit a Google Maps API key. Local Google Maps setup is described in `README.md`.
- Do not reset or rewrite a tester's browser data during visual QA. Use `fresh.html` for a non-destructive new-player preview.
- Keep the current static/no-build architecture unless the project owner explicitly approves a migration.
- After editing `index.html`, CSS, or browser JavaScript, update the corresponding asset query string in `index.html` when browser caching could hide the change.
- Do not modify the external `livemap-routing/runtime/demo.html` from this repository.

## Required Checks

```bash
npm test
```

For UI changes, verify both active challenge URLs:

- `http://127.0.0.1:8765/?game=calm`
- `http://127.0.0.1:8765/?game=google`

Also check a narrow viewport and reduced-motion behavior when the change affects layout or animation.

## Repository Hygiene

- Work on `main` unless the user explicitly requests a branch.
- Do not commit local tooling, browser data, API keys, screenshots, or generated reports.
- Keep documentation links relative so they work on GitHub and in local clones.
- Update `README.md`, `CONTEXT.md`, or `docs/ARCHITECTURE.md` when a change alters entry points, terminology, or module ownership.
