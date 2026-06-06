# Getting Started

This guide is for local development and demo runs. For production installs, use [INSTALL_PRODUCTION.md](./INSTALL_PRODUCTION.md).

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- Docker and Docker Compose for container runs

## Local Install

```bash
git clone <repository-url>
cd forenotes
npm install
npm --prefix src/client install
cp .env.example .env
```

Set at least:

```dotenv
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/forenotes
APP_HOST=127.0.0.1
APP_PORT=8787
FORENOTES_LLM_SECRET_KEY=change_me_to_at_least_32_random_characters
```

Create the database and run migrations:

```bash
createdb forenotes
npm run db:migrate
```

## Development Server

Run the API and React client together:

```bash
npm run dev:full
```

The API uses `APP_PORT` or `PORT` and defaults to `8787`. The Vite client runs from `src/client` and proxies API calls to the server during development.

Server only:

```bash
npm run dev
```

Client only:

```bash
npm run dev:client
```

## Demo Data

Seed demo records into the configured database:

```bash
npm run seed:demo
```

`seed:demo` creates demo users, cases, incidents, findings, timeline events, tasks, queries, notes, reports, tags, and graph relationships. Do not run it against production.

## Demo Docker

The demo Docker stack is intentionally unsafe for production because it seeds predictable demo credentials.

```bash
cp .env.demo.example .env.demo
docker compose -f docker-compose.demo.yml --env-file .env.demo up -d --build
```

Demo credentials:

```text
admin / admin123
commander / commander123
lead / lead123
analyst / analyst123
viewer / viewer123
```

Stop the demo stack:

```bash
docker compose -f docker-compose.demo.yml --env-file .env.demo down
```

## Production Docker

Production uses the published image and explicit secrets:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Edit `.env.production` before starting. See [INSTALL_PRODUCTION.md](./INSTALL_PRODUCTION.md) for the full install flow.

## Build And Verify

```bash
npm run lint
npm run test
npm run build
```

`npm run build` compiles the server TypeScript project and builds the React client into `dist/client`.

## Project Structure

```text
forenotes/
├── src/
│   ├── client/                 # React/Vite client app
│   │   ├── src/pages/          # App pages
│   │   ├── src/components/     # UI, tables, graph, reports, layout
│   │   ├── src/hooks/          # API-backed hooks
│   │   ├── src/stores/         # Client state stores
│   │   └── vite.config.ts
│   ├── server/                 # Express API and services
│   │   ├── routes/             # REST route modules
│   │   ├── services/           # Business logic
│   │   ├── db/                 # Pool, migrations, bootstrap
│   │   ├── graph/              # Incident graph and MITRE builders
│   │   └── permissions/        # RBAC catalog and enforcement
│   ├── demo/                   # Demo seed data
│   └── shared/                 # Shared domain types/constants
├── docs/
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.prod.yml
└── docker-compose.demo.yml
```
