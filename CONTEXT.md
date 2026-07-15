# Domain Context

Use these terms consistently in code, documentation, issues, and agent conversations.

## Benchmark Family

The product is a family of blinded route-comparison challenges presented through one shared UI.

## Challenge

A configured comparison mode with its own providers, questions, results labels, persistence key, and test ID.

Active challenges:

- **Fast vs Calm**: compares `fast` and `calm` routes. Test ID: `calm_vs_fast`.
- **Fast vs Google Fast**: compares `livemap_fast` and `google` routes. Test ID: `ari_fast_vs_google`.

Planned challenge:

- **Fast vs Safe**: visible in the challenge chooser but not yet playable.

## Route Pair

The origin, destination, and two provider-specific route geometries shown in one round. A route pair has a stable `pairId` and two stable route IDs.

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

## Community Results

Participant-facing aggregate results. They are released in completed batches so active testers do not see unstable percentages after every answer.

## Team Results

The internal research view over the same answer records. It is accessed directly and is not shown in participant navigation.

## Medal / Rank

Motivational progress earned every five completed comparisons, through 30. Medals never change answer semantics or data validity.

## Street View Mode

An explicit map mode. Ordinary map gestures remain unchanged until the tester activates Street View and selects a point on either route.
