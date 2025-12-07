# Thrift Shop — Full-Stack E-commerce Platform

> A modern thrift marketplace for buying and selling second-hand clothing, home goods, and collectibles.

[![CI/CD Pipeline](https://github.com/yourusername/thrift-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/thrift-shop/actions/workflows/ci.yml)

## Tech Stack

| Layer           | Technology                        | Description                        |
| --------------- | --------------------------------- | ---------------------------------- |
| **Backend**     | NestJS (TypeScript)               | REST API with modular architecture |
| **Frontend**    | Next.js 16 (React 19, TypeScript) | App Router, Server Components      |
| **Database**    | PostgreSQL 16                     | Primary data store                 |
| **Cache/Queue** | Redis 7 + BullMQ                  | Session cache, background jobs     |
| **Storage**     | S3-compatible (MinIO local)       | Product images, media files        |
| **Auth**        | JWT + HttpOnly Cookies            | Secure session management          |
| **i18n**        | English + Albanian                | Full internationalization          |
| **CI/CD**       | GitHub Actions                    | Automated testing & deployment     |
| **Container**   | Docker + Docker Compose           | Development & production           |

---

## Project Structure (Monorepo)

```
thrift-shop/
├── package.json              # Root package.json (npm workspaces)
├── docker-compose.yml        # All services configuration
├── .env.example              # Environment variables template
│
├── thrift-shop-api/          # NestJS Backend
│   ├── Dockerfile            # Multi-stage Docker build
│   ├── .dockerignore
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Authentication & authorization
│   │   │   ├── users/        # User management
│   │   │   ├── vendors/      # Vendor profiles & onboarding
│   │   │   ├── products/     # Product CRUD & search
│   │   │   ├── categories/   # Hierarchical categories
│   │   │   ├── orders/       # Order management
│   │   │   ├── cart/         # Cart sessions (guest + auth)
│   │   │   ├── media/        # File uploads, S3 integration
│   │   │   └── notifications/# Email, SMS, push
│   │   ├── common/           # Shared guards, pipes, filters
│   │   ├── config/           # Environment configuration
│   │   └── prisma/           # Database client module
│   └── prisma/
│       └── schema.prisma     # Database schema
│
├── thrift-shop-app/          # Next.js Frontend
│   ├── Dockerfile            # Multi-stage Docker build
│   ├── .dockerignore
│   ├── src/
│   │   ├── app/
│   │   │   ├── (main)/       # Public shopping pages
│   │   │   ├── (auth)/       # Login, signup, password reset
│   │   │   ├── (vendor)/     # Vendor dashboard
│   │   │   └── (admin)/      # Admin panel
│   │   ├── components/       # UI components (atomic design)
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # API client, auth helpers
│   └── i18n/locales/         # i18n translation files
│
└── .github/workflows/        # CI/CD pipelines
    └── ci.yml                # Main CI/CD workflow
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Option 1: Full Stack with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/thrift-shop.git
cd thrift-shop

# Copy environment variables
cp .env.example .env

# Start all services (infrastructure + apps)
docker compose up -d

# Run database migrations
docker compose exec api npx prisma migrate deploy

# Seed the database (optional)
docker compose exec api npm run db:seed
```

**Services:**
- Frontend: http://localhost:3001
- API: http://localhost:3000
- API Docs (Swagger): http://localhost:3000/api/docs
- MinIO Console: http://localhost:9001
- MailHog (Email UI): http://localhost:8025

### Option 2: Development Mode (Hot Reload)

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/thrift-shop.git
cd thrift-shop
npm install

# Start infrastructure only
docker compose up -d postgres redis minio minio-init mailhog

# Setup API
cd thrift-shop-api
cp .env.example .env
npx prisma migrate dev
npm run db:seed

# In one terminal - Start API
npm run dev:api

# In another terminal - Start App
npm run dev:app
```

---

## Available Scripts

### Root Level (Monorepo)

```bash
# Install all dependencies
npm install

# Development
npm run dev:api        # Start API in watch mode
npm run dev:app        # Start App in development mode

# Build
npm run build          # Build all packages
npm run build:api      # Build API only
npm run build:app      # Build App only

# Testing
npm run test           # Run all tests
npm run test:api       # Run API unit tests
npm run test:app       # Run App tests
npm run test:e2e:api   # Run API e2e tests
npm run test:e2e:app   # Run App e2e tests

# Linting
npm run lint           # Lint all packages

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:migrate:dev # Run migrations (dev)
npm run db:seed        # Seed database
npm run db:reset       # Reset and reseed database
npm run db:studio      # Open Prisma Studio

# Docker
npm run docker:up      # Start all containers
npm run docker:down    # Stop all containers
npm run docker:logs    # View logs
npm run docker:build   # Build images

# Cleanup
npm run clean          # Remove all node_modules
```

---

## Docker Services

| Service       | Port(s)     | Description                    |
| ------------- | ----------- | ------------------------------ |
| `api`         | 3000        | NestJS API                     |
| `app`         | 3001        | Next.js Frontend               |
| `postgres`    | 5432        | PostgreSQL Database            |
| `redis`       | 6379        | Redis Cache                    |
| `minio`       | 9000, 9001  | S3-compatible Storage          |
| `mailhog`     | 1025, 8025  | Email Testing (SMTP + Web UI)  |

### Docker Commands

```bash
# Start all services
docker compose up -d

# Start only infrastructure (for local development)
docker compose up -d postgres redis minio minio-init mailhog

# View logs
docker compose logs -f api app

# Rebuild images
docker compose build --no-cache

# Stop and remove containers
docker compose down

# Remove volumes (⚠️ deletes data)
docker compose down -v
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for production
JWT_SECRET=your-64-character-minimum-secret-key
POSTGRES_PASSWORD=strong-password
MINIO_ROOT_PASSWORD=strong-password

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000  # For frontend
CORS_ORIGINS=http://localhost:3001         # For backend
```

See `.env.example` for all available options.

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Test API** - Unit and E2E tests with PostgreSQL & Redis
3. **Test App** - Jest tests and production build
4. **Security Scan** - npm audit and Trivy vulnerability scanning
5. **Build & Push** - Docker images to GitHub Container Registry
6. **Deploy** - To staging (develop branch) or production (main branch)

### Branch Strategy

- `main` - Production deployments
- `develop` - Staging deployments
- Feature branches - PR checks only

---

## API Documentation

Swagger UI is available at: `http://localhost:3000/api/docs`

Key endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - List products
- `GET /api/categories` - List categories
- `POST /api/cart/items` - Add to cart
- `POST /api/orders` - Create order

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details.
