# Production Deployment

The container serves the public experience at `https://game.livemap.sh/routing/` and proxies route requests through the same origin.

## Required Infrastructure

The infrastructure team only needs to:

1. Point `game.livemap.sh` to this container.
2. Terminate HTTPS at the platform ingress.
3. Set the environment values below.
4. Connect the benchmark persistence endpoint before public launch.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `ROUTING_UPSTREAM` | Recommended | Server-side routing facade origin. Defaults to the current TBT deployment. Prefer its internal service address in production. |
| `ARI_GOOGLE_MAPS_KEY` | For Street View and Fast vs Google | Browser-restricted Maps JavaScript key. Restrict it to `https://game.livemap.sh/*`. |
| `ARI_DATA_API_BASE` | Before public launch | Same-origin benchmark persistence base, normally `/api/v1/benchmarks`. |
| `DATA_UPSTREAM` | With the data API | Internal origin that implements the benchmark persistence contract. |
| `APP_ROOT` | No | Static file root. The container already sets the expected `/srv/ari-route-arcade` default. |

The Google key is delivered to the browser by design. Its protection is the HTTP-referrer and API restriction in Google Cloud, not secrecy inside the container.

## Public Paths

| URL | Behavior |
| --- | --- |
| `/routing/` | Challenge selector. |
| `/routing/fast-vs-google` | ARI Fast vs Google Fast. |
| `/routing/fast-vs-calm` | ARI Fast vs ARI Calm. |
| `/api/v1/routing/*` | Same-origin proxy to the routing facade. |

Existing `?game=google` and `?game=calm` links remain supported outside the production host.

## Data API Contract

When `ARI_DATA_API_BASE=/api/v1/benchmarks`, the browser sends:

```text
POST /api/v1/benchmarks/{testId}/answers
PUT  /api/v1/benchmarks/{testId}/sessions/{sessionId}/progress
```

Failed writes stay in a local outbox and retry on the next save, page load, or `online` event. The server must enforce answer idempotency using the `Idempotency-Key` header.

Do not launch the public LinkedIn campaign while `ARI_DATA_API_BASE` is empty: comparisons would remain only in each participant's browser.
