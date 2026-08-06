# Domain Context

Use these terms consistently in code, documentation, issues, and agent conversations.

## Benchmark Family

The product is a family of blinded route-comparison challenges presented through one shared UI.

## Challenge

A configured comparison mode with its own providers, questions, results labels, persistence key, and test ID.

Active challenges:

- **Calm Route Comparison**: compares `calm_quiet` and `calm_nature` routes. Test ID: `calm_route_comparison`.
- **Fast vs Google Fast**: compares `livemap_fast` and `google` routes. Test ID: `ari_fast_vs_google`.

Planned challenge:

- **Fast vs Safe**: planned but not currently participant-facing.

## Route Pair

The origin, destination, and two provider-specific route geometries shown in one round. A route pair has a stable `pairId` and two stable route IDs.

## Route Corpus

The complete ordered set of curated route pairs used by one study release. The current Calm corpus is `calm-curated-v2`; its SHA-256 fingerprint binds participant sessions, saved answers, diagnostics, and Results maps to the exact same 23 route exports.

## Visible Slot

`Route A` or `Route B`, the only route identity shown to a tester. A visible slot is not a provider.

## Hidden Assignment

The randomized mapping from each visible slot to its real route type. It is stored with answers so analysis can decode choices without exposing providers during testing.

## Round / Comparison

One route pair plus its completed question flow. In UI copy, prefer **comparison**. In code and stored records, **round** identifies its position within a session.

## Session

One participant's resumable sequence of comparisons for one challenge. Challenges use separate persistence datasets.

## Answer Record

The append-only, idempotent record produced by a completed comparison. `captureId` is its idempotency key.

## Progress Record

The upserted record for an unfinished session. It includes the current pair, hidden assignment, question step, and partial answer.

## Production Persistence

The hosted participant deployment uses Supabase project `xyrmytymcipyntdtsksu` through a public anon key, two write-only RPC functions, and one privacy-limited Route Explorers aggregate RPC. Direct anon table access and anonymous raw-answer reads are blocked. The aggregate feed exposes only participant name/code, stable participant ID, and unique current-corpus route count. This is the active production backend, not a preview fixture. The file-backed HTTP data API is an optional alternative for a future self-hosted deployment.

## Participant Results

The participant-facing Results view, enabled after the first saved comparison. Its visible introduction is followed by the `Route Explorers` team leaderboard, personal choice/reason charts, and expandable comparison records. The leaderboard highlights the current participant without a separate `You` badge and shows four earned/locked medal states. Personal answer data remains device-scoped; only privacy-limited team progress is participant-facing. Because there is one participant Results destination, the page does not repeat it in a local switcher.

## Researcher Results

The local-development research view over saved or illustrative answer records. It is enabled only by an explicit `researcher=1` URL and never persists into ordinary participant links. It keeps the existing `Participants` and `Routes` diagnostic destinations and intentionally omits the participant-facing `Route Explorers` leaderboard. The full researcher view is never enabled on the production participant site; authorized production research reads happen in the Supabase dashboard.

## Medal / Rank

Motivational progress earned across the 23-comparison journey, at 5, 10, 15, and 23 completed comparisons. Medals never change answer semantics or data validity.

## Street View Mode

An explicit map mode. Ordinary map gestures remain unchanged until the tester activates Street View and selects a point on either route.
