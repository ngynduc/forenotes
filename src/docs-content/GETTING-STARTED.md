# Getting Started

This page separates the static documentation site from the full Forenotes application. Run the site commands on this landing-page branch. Run full-app commands only after checking out the main application branch or unpacking a release bundle.

## Static Site Development

Use this path when editing the landing page or embedded docs.

```bash
npm install
npm run dev
```

The site is a Vite app. It serves the marketing page, `/docs`, `/donate`, and static assets under `public/`.

Build and verify the static site:

```bash
npm run lint
npm run build
```

## Full Application Development

Use this path when working on the API, database, production image, or the authenticated Forenotes app.

```bash
git clone https://github.com/ngynduc/forenotes.git
cd forenotes
git checkout main
npm install
npm --prefix src/client install
cp .env.example .env
```

Set the required development values in `.env`:

```dotenv
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/forenotes
APP_HOST=127.0.0.1
APP_PORT=8787
FORENOTES_LLM_SECRET_KEY=change_me_to_at_least_32_random_characters
```

Create the database and migrate it:

```bash
createdb forenotes
npm run db:migrate
```

Run the API and React client together:

```bash
npm run dev:full
```

Server-only and client-only scripts are available on the full application branch:

```bash
npm run dev
npm run dev:client
```

## Demo Data

Seed demo records only in a disposable development database:

```bash
npm run seed:demo
```

The seed script creates demo users, cases, incidents, findings, timeline events, tasks, queries, notes, reports, tags, and graph relationships. Do not run it against production.

## Demo Docker

The demo stack is intentionally unsafe for production because it uses predictable demo credentials.

```bash
cp .env.demo.example .env.demo
docker compose -f docker-compose.demo.yml --env-file .env.demo up -d --build
```

Stop the demo stack:

```bash
docker compose -f docker-compose.demo.yml --env-file .env.demo down
```

## Production Setup

For a real deployment, use [Production Install](./INSTALL_PRODUCTION.md). Do not use the demo stack as a shortcut for production.

## Verification Checklist

Before merging application changes:

- Run lint for the changed package.
- Run the focused test suite for the changed area.
- Run the production or site build that matches the branch.
- Confirm generated files, extracted packages, and local environment files are not tracked.
