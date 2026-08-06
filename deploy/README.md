# Optional Container Deployment

The active participant deployment is GitHub Pages. This container is prepared for a future `https://game.livemap.sh/routing/` deployment and can proxy live route requests through the same origin; it is not required for the current Calm team study.

## Required Infrastructure

If the team chooses this host, the infrastructure team needs to:

1. Point `game.livemap.sh` to this container.
2. Terminate HTTPS at the platform ingress.
3. Set the environment values below.
4. Verify persistence: retain the configured Supabase transport or connect the optional HTTP data API.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `ROUTING_UPSTREAM` | Recommended | Server-side routing facade origin. Defaults to the current TBT deployment. Prefer its internal service address in production. |
| `ARI_GOOGLE_MAPS_KEY` | For Street View and Fast vs Google | Browser-restricted Maps JavaScript key. Restrict it to `https://game.livemap.sh/*`. |
| `ARI_MAPTILER_KEY` | Yes | Browser-restricted MapTiler key for the production basemap. Restrict it to the participant origins. |
| `ARI_DATA_API_BASE` | Optional | Same-origin alternative to the existing Supabase persistence, normally `/api/v1/benchmarks`. |
| `DATA_UPSTREAM` | With the data API | Internal origin that implements the benchmark persistence contract. |
| `ARI_DATA_ADMIN_TOKEN` | Yes, on the data API | Long random bearer token used only by authorized research exports. Never expose it to participant browsers. |
| `ARI_ALLOWED_ORIGINS` | Yes, on the data API | Comma-separated participant origins, for example `https://game.livemap.sh`. |
| `APP_ROOT` | No | Static file root. The container already sets the expected `/srv/ari-route-arcade` default. |

The Google and MapTiler browser keys are delivered to the browser by design. Their protection is the provider-side origin/API restriction, not secrecy inside the container.

## Public Paths

| URL | Behavior |
| --- | --- |
| `/routing/` | Calm Route Comparison. |
| `/routing/fast-vs-google` | ARI Fast vs Google Fast. |
| `/routing/calm-route-comparison` | Explicit Calm Route Comparison entry. |
| `/routing/fast-vs-calm` | Legacy Calm Route Comparison alias. |
| `/api/v1/routing/*` | Same-origin proxy to the routing facade. |

Legacy `?game=google` and `?game=calm` links remain supported by the shared runtime.

## Data API Contract

When `ARI_DATA_API_BASE=/api/v1/benchmarks`, the browser sends:

```text
POST /api/v1/benchmarks/{testId}/answers
PUT  /api/v1/benchmarks/{testId}/sessions/{sessionId}/progress
```

Failed writes stay in a local outbox and retry on the next save, page load, or `online` event. The server must enforce answer idempotency using the `Idempotency-Key` header.

GitHub Pages uses the existing Supabase configuration. For deployments that remove it, do not launch while `ARI_DATA_API_BASE` is empty: production fails closed when neither persistence transport is available.

## Data API Service

`server/data-api.js` in this repository implements the contract above:
idempotent answers, progress upserts, and the NDJSON answer feed, validated
with the same rules the browser uses. It is file-backed and zero-dependency.

Build it from [`data-api.Dockerfile`](data-api.Dockerfile) and run it with a
persistent volume mounted at `/data`. Then set on the main container:

- `DATA_UPSTREAM` = the data API's internal origin (it listens on `8090`)
- `ARI_DATA_API_BASE` = `/api/v1/benchmarks`

The proxy route in the main Caddyfile is already in place and stays dormant
until `ARI_DATA_API_BASE` is set. Records land in `/data` as
`{testId}-answers.ndjson` (append-only) and `{testId}-progress.json` — back up
that volume. Writes are origin-restricted and rate-limited; answer and progress reads require the admin bearer token. It accepts only records that pass full challenge validation. The routing team
can later port the contract into the Java service without any frontend change.
