# Architecture

This page describes the full Forenotes application on the main application branch. The static landing site is a separate Vite package that publishes marketing pages and these docs.

## System Shape

```text
Browser
  React client
  HTTP JSON with forenotes_session cookie

Express API
  auth, cases, incidents, dashboard, reports, uploads, search

Service layer
  validation, RBAC, audit, notifications, graph, report generation

PostgreSQL
  users, sessions, cases, incidents, entities, tags, reports, audit logs

App data volume
  uploaded task-note images, report images, and generated artifacts
```

## Runtime Responsibilities

| Layer | Responsibility |
|-------|----------------|
| React client | Authenticated workspace UI, tables, graph, reports, settings, and admin screens |
| Express routes | Request parsing, auth boundary, route-level validation, and response shaping |
| Services | Business rules, membership checks, audit records, notifications, report workflows, and graph construction |
| PostgreSQL | Durable relational state, sessions, RBAC, investigation records, report state, and audit history |
| Data directory | Files that must survive container recreation |

## Request Flow

1. The user signs in through `POST /api/auth/login`.
2. The server verifies the password and creates a database-backed session.
3. The browser receives the `forenotes_session` HTTP-only cookie.
4. Later API calls resolve the current user from the session table.
5. Routes validate params and bodies with Zod.
6. Permission checks combine global role, case membership, and incident membership.
7. Services perform the read or mutation.
8. Mutations write audit logs and notifications where applicable.
9. The API returns JSON to the client.

## Source Layout On Main

| Path | Purpose |
|------|---------|
| `src/client` | Authenticated React/Vite app |
| `src/server` | Express API, services, routes, DB setup, and migrations |
| `src/shared` | Shared domain types and constants |
| `src/demo` | Demo seed data |
| `docs` | Source documentation for the full app |
| `Dockerfile` | Production image build |
| `docker-compose.prod.yml` | Production runtime stack |
| `docker-compose.demo.yml` | Unsafe local demo stack |

## Landing Site Layout

| Path | Purpose |
|------|---------|
| `src/pages/LandingPage.tsx` | Product landing page |
| `src/pages/DocsPage.tsx` | Embedded docs renderer |
| `src/docs-content` | Markdown loaded into the docs tabs |
| `public/user-guide` | Screenshots used by the feature guide |
| `vercel.json` | Static site deployment routing |

## Deployment Model

The full application is deployed as a Docker image plus Compose file. Production startup validates unsafe settings, runs migrations, and bootstraps the first admin when needed.

The landing site is deployed as a static Vite build. It does not include the API server, migrations, Dockerfiles, or production environment templates.

## Operational Boundaries

- Header auth is test/dev-only and disabled in production.
- Sessions are database-backed and represented by an HTTP-only cookie.
- Uploaded files live outside the database and require persistent storage.
- Report LLM settings are optional and depend on external provider/service configuration.
- Audit logs are written for entity mutations and should be retained with the database.
