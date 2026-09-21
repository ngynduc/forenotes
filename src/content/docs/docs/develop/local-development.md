---
title: Local development
description: Run the Forenotes API and React client against a local PostgreSQL database.
---

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer

## Install

```bash
git clone https://github.com/ngynduc/forenotes.git
cd forenotes
npm install
npm --prefix src/client install
cp .env.example .env
```

Set the local database and application values:

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

## Run

Start the API and client together:

```bash
npm run dev:full
```

The API defaults to `http://localhost:8787`; the Vite client prints its own URL and proxies `/api` requests to the server.

Use `npm run dev` for only the server or `npm run dev:client` for only the client.

## Optional demo data

```bash
npm run seed:demo
```

Demo records include users, cases, incidents, evidence, timelines, tasks, queries, reports, tags, and graph relationships. Never run the seed command against production.
