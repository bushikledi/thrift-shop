# Load tests

[k6](https://k6.io) suites for the API. They run in a container on the compose
network and target `http://api:3000`, so host port-forwarding is not part of
what gets measured.

## Suites

| File | What it covers | Writes? |
| --- | --- | --- |
| `smoke.js` | One pass over the public read endpoints | No |
| `browse.js` | Anonymous catalogue browsing (landing → shop → category → detail) | No |
| `search.js` | Search and autocomplete at a fixed request rate | No |
| `checkout.js` | Authenticated cart → checkout | **Yes** |

## Read this before your first run: the rate limiter

The API throttles to `THROTTLE_LIMIT` requests per `THROTTLE_TTL` seconds per
IP (default 100/60). Every VU in a load test shares one source IP, so with the
default the run stops measuring the API and starts measuring the throttle —
and because a 429 is fast, the result looks *better* the harder you push.

Every suite fails on `throttled_responses > 0` so this cannot pass unnoticed.
Raise the ceiling for the run:

```bash
THROTTLE_LIMIT=1000000 docker compose up -d api
```

Put it back afterwards:

```bash
docker compose up -d api
```

**The npm scripts pass `--no-deps` for a reason.** `docker compose run k6`
would otherwise re-create the `api` service it depends on, using whatever
environment is ambient at that moment — silently reverting the override above
and leaving you measuring a 100/min limit while believing you raised it.

Some routes carry their own `@Throttle` decorator that `THROTTLE_LIMIT` does
not affect: `/auth/login` at 10/min, `/orders/checkout` at 10/min, and others
in `orders`, `users`, `admin` and `promo`. These are deliberate abuse controls.
`checkout.js` stays under its cap by default; raising it means editing
`orders.controller.ts`.

## Running

```bash
npm run load:smoke
```

```bash
npm run load:browse
```

```bash
npm run load:search
```

Tuning knobs are environment variables — VUS, DURATION, RAMP for `browse.js`,
RATE and DURATION for `search.js`:

```bash
docker compose run --rm -e VUS=50 -e DURATION=3m k6 run /scripts/browse.js
```

### The checkout suite writes data

`checkout.js` places real orders and decrements stock. Run it against a
throwaway database only — never one whose data matters. It is excluded from
`npm run load` and has to be asked for by name:

```bash
npm run load:checkout
```

Reset afterwards with `npm run db:reset && npm run db:seed`.

Seeded listings are near-unique thrift items, so stock runs out quickly and
some iterations will legitimately hit "product is not available". That is a
correct answer, not a defect, so the suite counts it in `sold_out` and asserts
on `server_errors` (5xx only) rather than inheriting the shared
`http_req_failed` budget.

## Targeting another environment

```bash
docker compose run --rm -e BASE_URL=https://staging.example.com/api/v1 \
  k6 run /scripts/browse.js
```

## Thresholds

`lib/config.js` holds the shared budgets: p95 < 800ms, p99 < 2s, error rate
< 1%, checks > 99%. Individual suites tighten these per endpoint — the product
listing gets p95 < 500ms, autocomplete p95 < 300ms, checkout p95 < 3s.

k6 exits non-zero when a threshold is breached, so these are pass/fail, not
decoration. The numbers are calibrated for catching regressions on a developer
machine — an N+1 appearing in the catalogue query, a dropped index — not for
certifying production capacity.
