# Thrift Shop — Full-Stack E-commerce Platform

> A multi-vendor marketplace for second-hand clothing, home goods and
> collectibles. Customers browse and buy, sellers run their own storefront, and
> admins moderate the platform.

[![CI/CD Pipeline](https://github.com/yourusername/thrift-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/thrift-shop/actions/workflows/ci.yml)

- [Quick start](#quick-start) — running in about two minutes
- [Test accounts](#test-accounts) — seeded logins for every role
- [What you can actually do](#what-you-can-actually-do) — a tour by role
- [Troubleshooting](#troubleshooting) — the problems people actually hit

---

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| **Backend** | NestJS 11 (TypeScript) | REST API, modular, Swagger-documented |
| **Frontend** | Next.js 16 / React 19 | App Router, server components |
| **Database** | PostgreSQL 16 + Prisma 7 | Migrations checked into the repo |
| **Cache** | Redis 7 | Response cache via `cache-manager`; falls back to in-memory when `REDIS_URL` is unset |
| **Storage** | S3-compatible (MinIO locally) | Product and profile images |
| **Auth** | JWT in HttpOnly cookies | Global guard; routes opt out with `@Public()` |
| **Payments** | Stripe Checkout (optional) | Cash-on-delivery when unconfigured |
| **Email/SMS** | SMTP (Mailpit locally), SendGrid, Twilio | All optional; logged when unconfigured |
| **i18n** | English + Albanian | `next-intl` |
| **Load tests** | k6 | See [`load-tests/`](./load-tests/README.md) |
| **CI** | GitHub Actions | Lint, typecheck, unit, e2e, build, image push |

---

## Quick Start

**Prerequisites:** Docker & Docker Compose, and Node.js 20+ / npm 10+ if you
want to run outside containers.

```bash
git clone https://github.com/yourusername/thrift-shop.git
cd thrift-shop

cp .env.example .env
echo "JWT_SECRET=$(openssl rand -hex 48)" >> .env

docker compose up -d
docker compose run --rm api-migrate npm run db:seed
```

Migrations run automatically (the `api-migrate` service completes before the
API starts), so there is no separate migrate step. Seeding is optional but
strongly recommended — an empty catalogue makes most of the app look broken.

| Service | URL | Notes |
| --- | --- | --- |
| Storefront | http://localhost:3001 | |
| API | http://localhost:3000/api/v1 | |
| Swagger UI | http://localhost:3000/api/v1/docs | Non-production only |
| Mailpit | http://localhost:8025 | Every outbound email lands here |
| MinIO console | http://localhost:9001 | `minioadmin` / `minioadmin` |

> `JWT_SECRET` is **required** — the API refuses to boot with a secret under 64
> characters, rather than starting with a guessable default. Everything else
> (`ENCRYPTION_KEY`, `STRIPE_*`, `SENDGRID_*`, `TWILIO_*`) is optional and
> degrades gracefully.

### Development mode (hot reload)

```bash
npm install
docker compose up -d postgres redis minio minio-init mailhog

cd thrift-shop-api
cp .env.example .env          # DATABASE_URL should point at localhost:5432
npx prisma migrate dev
npm run db:seed

npm run dev:api               # terminal 1
npm run dev:app               # terminal 2
```

If you already have PostgreSQL running locally on 5432 it will shadow the
container — see [Troubleshooting](#troubleshooting).

---

## Test Accounts

Seeded by `npm run db:seed`. **Password for every account: `password123`**
(override with `SEED_PASSWORD` / `SEED_ADMIN_PASSWORD` before seeding — do that
for any shared or staging database).

### Start here

| Role | Email | What it shows off |
| --- | --- | --- |
| **Admin** | `admin@thriftshop.com` | Full admin panel: users, vendors, moderation, analytics, settings |
| **Vendor** | `vintage.vibes@email.com` | Verified store with products, orders and sales history |
| **Customer** | `john.doe@email.com` | Order history, saved items, reviews, addresses |

### All vendors

Ten stores. The first seven are **verified** (verified stores get a badge and
appear under the "verified only" filter); the last three are not, which is what
the admin verification queue is for.

| Store | Email | Verified |
| --- | --- | --- |
| Vintage Vibes | `vintage.vibes@email.com` | Yes |
| Retro Finds | `retro.finds@email.com` | Yes |
| Eco Threads | `eco.threads@email.com` | Yes |
| Urban Renewal | `urban.renewal@email.com` | Yes |
| Timeless Treasures | `timeless.treasures@email.com` | Yes |
| Boho Bazaar | `boho.bazaar@email.com` | Yes |
| Classic Closet | `classic.closet@email.com` | Yes |
| Thrift Luxe | `thrift.luxe@email.com` | No |
| Green Wardrobe | `green.wardrobe@email.com` | No |
| Second Chance Style | `second.chance@email.com` | No |

### All customers

Fifteen accounts, all `@email.com`, all the same password. The **first ten have
verified email addresses**, the last five do not.

`john.doe`, `jane.smith`, `mike.johnson`, `sarah.williams`, `david.brown`,
`emily.davis`, `chris.wilson`, `amanda.moore`, `ryan.taylor`,
`melissa.anderson` — then unverified: `kevin.thomas`, `jessica.jackson`,
`brian.white`, `lauren.harris`, `matthew.martin`.

### Promo codes

Applied at checkout. Four work; two fail on purpose so the failure paths are
reachable without editing the database.

| Code | Effect | Minimum order | Status |
| --- | --- | --- | --- |
| `WELCOME10` | 10% off | 20 | Valid |
| `SAVE20` | 20% off | 100 | Valid |
| `FLAT15` | 15 off | 50 | Valid |
| `FREESHIP` | 10 off | 30 | Valid |
| `SUMMER25` | 25% off | 40 | **Expired** — exercises expiry handling |
| `VIP50` | 50% off | 150 | **Disabled** — exercises the `isActive` check |

### What else the seed creates

Roughly 300 products across the ten stores, ~20 categories in a two-level tree,
plus orders in every status, reviews, saved items and guest cart sessions.
Products, orders and reviews are generated with randomness, so exact counts
shift a little between runs. Items are mostly **unique** (quantity 1), like real
thrift stock — so a product can genuinely sell out mid-test.

Reset to a clean state at any time:

```bash
npm run db:reset && npm run db:seed
```

---

## What You Can Actually Do

### As a customer
Browse and search the catalogue, filter by category (parent categories include
their whole subtree), condition and price; save items; add to cart as a guest
and keep that cart after logging in; check out with cash-on-delivery or Stripe;
apply promo codes; track a guest order with its number and email; **cancel an
order** while it is pending, confirmed or processing; review products you have
bought; manage addresses, notification preferences and profile.

### As a vendor (`/vendor`)
Dashboard with real revenue, order and stock figures; create, edit, duplicate,
archive and delete listings with image upload; a fulfilment queue that only
offers status transitions the API will accept; store analytics over a selectable
window with period-over-period comparison; store profile and contact settings.

### As an admin (`/admin`)
Users (roles, deactivation), vendor verification queue, product moderation with
flagging, order oversight, category management, review moderation, platform
analytics, and settings including a **maintenance mode** that locks out
non-admins.

Staff browsing the storefront get a button in the header back to their portal.

---

## Project Structure

```
thrift-shop/
├── docker-compose.yml         # Every service, incl. the k6 "load" profile
├── .env.example               # Compose-level configuration
├── load-tests/                # k6 suites (see its own README)
│
├── thrift-shop-api/           # NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/        # Checked in; applied by api-migrate
│   │   └── seed.ts            # Everything in "Test Accounts" above
│   └── src/
│       ├── modules/           # auth, users, vendors, products, categories,
│       │                      # cart, orders, payments, promo, media,
│       │                      # reviews, search, admin, notifications, health
│       ├── common/            # Guards, filters, decorators, interceptors
│       └── config/            # Env schema + typed config
│
└── thrift-shop-app/           # Next.js frontend
    └── src/
        ├── app/
        │   ├── (main)/        # Storefront + customer account
        │   ├── (auth)/        # Login, signup, password reset
        │   ├── (vendor)/      # Seller portal
        │   └── (admin)/       # Admin panel
        ├── components/
        ├── hooks/             # React Query hooks + centralised query keys
        └── lib/               # API client, stores, helpers
```

---

## Scripts

```bash
# Development
npm run dev:api          # API in watch mode
npm run dev:app          # Frontend in dev mode

# Quality gates (what CI runs)
npm run lint             # ESLint, both workspaces
npm run type-check       # tsc --noEmit, both workspaces
npm run test:api         # 103 unit tests
npm run test:app         #  55 unit tests
npm run test:e2e:api     # e2e against a real database
npm run build            # Production build of both

# Database
npm run db:migrate       # Apply migrations (deploy)
npm run db:migrate:dev   # Create + apply a migration
npm run db:seed          # Seed sample data
npm run db:reset         # Drop, re-migrate, reseed
npm run db:studio        # Prisma Studio

# Docker
npm run docker:up / docker:down / docker:logs / docker:build

# Load testing (see load-tests/README.md first — the rate limiter matters)
npm run load:smoke       # Wiring check, ~5 seconds
npm run load:browse      # Anonymous catalogue browsing
npm run load:search      # Search + autocomplete at a fixed rate
npm run load:checkout    # Authenticated checkout (writes real orders)
```

---

## Configuration

Copy `.env.example` to `.env`. The values that matter:

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | **Yes** | Session signing. Minimum 64 characters; the API refuses to start otherwise. |
| `POSTGRES_PASSWORD` | Recommended | Defaults to `postgres` — change outside local dev. |
| `NEXT_PUBLIC_API_URL` | Yes for non-local | API origin the browser calls. **Inlined at image build time** — rebuild the `app` image after changing it. |
| `CORS_ORIGINS` | Yes for non-local | Comma-separated allowed origins. |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | No | Rate limit per IP (default 100 per 60s). Raise for load tests. |
| `ENCRYPTION_KEY` | No | Encrypts vendor payout details at rest. Derived from `JWT_SECRET` when unset. |
| `STRIPE_SECRET_KEY` | No | Enables card checkout; cash-on-delivery only when unset. |
| `SEED_PASSWORD` / `SEED_ADMIN_PASSWORD` | No | Override the demo password before seeding a shared database. |

Some routes carry their own stricter rate limits that `THROTTLE_LIMIT` does not
override — `/auth/login` and `/orders/checkout` at 10/min among others. Those
are deliberate abuse controls.

---

## Payments

| Method | Behaviour |
| --- | --- |
| **Cash on delivery** (default) | Order is created immediately with `paymentStatus: PENDING`. |
| **Card (Stripe)** | Order is created, then the buyer is redirected to Stripe's hosted Checkout. The order is confirmed only when Stripe's webhook reports payment. |

Card details are entered on Stripe's page and never reach this application. Only
Stripe identifiers (session and payment-intent ids) are stored.

**Stripe is optional.** With no `STRIPE_SECRET_KEY`, card checkout returns a
clear "card payments are not available" error instead of failing at boot.

### Enabling Stripe locally (test mode)

```bash
# 1. Add a test key from https://dashboard.stripe.com/test/apikeys to .env
STRIPE_SECRET_KEY=sk_test_...

# 2. Forward webhooks and copy the printed whsec_... into .env
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
STRIPE_WEBHOOK_SECRET=whsec_...
```

| Test card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure |

Any future expiry, any CVC, any postal code. The webhook is signature-verified
and repeated deliveries of the same event are idempotent.

---

## API

Everything is served under `/api/v1`. Interactive Swagger UI is at
http://localhost:3000/api/v1/docs outside production.

Authentication uses an **HttpOnly cookie** set by `/auth/login` — there is no
token in the response body. With `curl`, use a cookie jar:

```bash
curl -c jar -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"john.doe@email.com","password":"password123"}'

curl -b jar http://localhost:3000/api/v1/users/me
```

A sample of the surface:

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/signup`, `POST /auth/login` | Registration and sign-in |
| `GET /products`, `GET /products/:slug` | Catalogue |
| `GET /search`, `GET /search/suggestions` | Search and autocomplete |
| `POST /cart/items` | Add to cart (guest or authenticated) |
| `POST /promo/validate` | Check a promo code |
| `POST /orders/checkout` | Create an order |
| `POST /orders/:id/cancel` | Customer cancels their own order |
| `POST /orders/track` | Guest tracking by order number + email |
| `PUT /orders/:id/status` | Vendor fulfilment |
| `GET /vendors/me/analytics` | Store analytics |
| `GET /admin/analytics` | Platform analytics |

Validation failures return 400 with the offending fields named:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": { "validationErrors": ["property email should not exist"] },
  "correlationId": "24903adf-…"
}
```

`correlationId` also appears in the API logs — the fastest way to find the
matching server-side entry.

---

## Testing

```bash
npm run test:api        # 103 unit tests
npm run test:app        #  55 unit tests
npm run test:e2e:api    # needs a database
```

E2E tests apply migrations against a real PostgreSQL. If you have a local
PostgreSQL on 5432 shadowing the container, point them at a throwaway one:

```bash
docker run --rm -d -p 55432:5432 -e POSTGRES_PASSWORD=postgres --name pg-e2e postgres:16-alpine
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/thriftshop npm run test:e2e:api
docker rm -f pg-e2e
```

Load testing lives in [`load-tests/`](./load-tests/README.md) — **read that
README before the first run**, because the default rate limit will otherwise
measure the throttle rather than the API.

---

## Troubleshooting

**The API exits immediately on startup.**
`JWT_SECRET` is missing or under 64 characters. This is deliberate — generate
one with `openssl rand -hex 48`.

**A local PostgreSQL is shadowing the container.**
If you already run PostgreSQL on 5432, `localhost:5432` reaches *your* instance,
not the compose one — migrations appear to succeed against the wrong database.
Either stop the local service, or set `POSTGRES_PORT` to something free and
update `DATABASE_URL` to match.

**Images 404 with a `minio:9000` URL.**
The API talks to MinIO over the internal hostname, but browsers must load images
from the published port. That is what `CDN_URL` (default
`http://localhost:9000`) is for — keep it pointed at the host-visible address.

**Frontend changes to `NEXT_PUBLIC_*` do nothing.**
Next.js inlines those at build time. Restarting the container is not enough:

```bash
docker compose build app && docker compose up -d app
```

**Load-test results look implausibly good.**
You are almost certainly measuring the rate limiter — a 429 is fast. See
`load-tests/README.md`; the suites fail on `throttled_responses > 0` to make
this visible.

**`docker compose run` keeps reverting an environment override.**
It re-creates the services named in `depends_on` from whatever environment is
ambient. Pass `--no-deps` (the `load:*` scripts already do).

**Emails never arrive.**
That is expected locally — they go to Mailpit at http://localhost:8025, not to
real inboxes.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push and PR:

1. **Lint & type check** — ESLint plus `tsc --noEmit`, both workspaces
2. **Test API** — unit and e2e against PostgreSQL and Redis services
3. **Test App** — unit tests plus a production build
4. **Security scan** — `npm audit` and Trivy
5. **Build & push** — Docker images to GHCR
6. **Deploy** — staging from `develop`, production from `main`

Every job depends on lint, so a lint failure stops the pipeline before anything
expensive runs.

---

## Contributing

1. Branch from `main` (`git checkout -b fix/thing`)
2. Keep `npm run lint`, `npm run type-check` and the test suites green
3. Add a test for any bug you fix
4. Open a PR

---

## License

MIT — see LICENSE.
