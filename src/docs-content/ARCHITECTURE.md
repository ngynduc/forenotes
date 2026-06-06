# Architecture

Forenotes is a React/Vite single-page application served by an Express 5 API. The backend owns authentication, authorization, validation, migrations, audit logging, notifications, graph construction, report generation, and PostgreSQL persistence.

```text
React/Vite client
  pages, hooks, stores, table/graph/report components
        |
        | HTTP JSON + forenotes_session cookie
        v
Express app
  /api/health
  /api/auth
  /api/cases
  /api/incidents
  /api/dashboard
  /api/notifications
  /api/uploads and /uploads
        |
        v
Route modules
  auth, users, cases, incidents, tags, search, reports, audit, uploads
        |
        v
Services
  authService, permissionService, caseService, incidentService,
  findingService, timelineEventService, taskService, reportService,
  graphBuilder, mitreMatrixBuilder, notificationService, auditLogService
        |
        v
PostgreSQL
  migrations, sessions, users, cases, incidents, entities, reports, tags
```

## Runtime Layout

- `src/server/index.ts` starts the server.
- `src/server/app.ts` creates the Express app, security headers, `/api/health`, API routes, static client serving, SPA fallback, and error handling.
- `src/server/routes/index.ts` mounts all route modules.
- `src/server/env.ts` validates environment variables and rejects unsafe production settings.
- `src/client` is the React application built by Vite.
- `dist/server` and `dist/client` are copied into the production Docker image.

## Request Flow

1. The browser logs in through `POST /api/auth/login`.
2. The server verifies the password with Argon2 and creates a database-backed session.
3. The server sets the HTTP-only `forenotes_session` cookie.
4. Subsequent API requests are resolved through the session cookie.
5. Route handlers validate params/body with Zod.
6. Permission checks validate the user's global role and case/incident membership.
7. Services execute database operations.
8. Mutations create audit log and notification records where applicable.
9. JSON responses are returned to the client.

`x-user-id` header auth remains available only for tests or explicitly enabled non-production development. It is ignored in production.

## Frontend Architecture

The client is a React/Vite app organized around pages, reusable UI components, and API-backed hooks.

| Area | Path | Purpose |
|------|------|---------|
| Pages | `src/client/src/pages` | Dashboard, cases, findings, timeline, graph, reports, settings, audit, admin |
| Layout | `src/client/src/components/layout` | App shell and incident/case context bar |
| Tables | `src/client/src/components/data-table` | Inline table display and quick editing |
| Entity modal | `src/client/src/components/entity-modal` | Rich entity edit, links, tags, MITRE mapping |
| Graph | `src/client/src/components/graph` | Relationship graph and node inspection |
| MITRE | `src/client/src/components/mitre` | ATT&CK matrix and technique inspection |
| Reports | `src/client/src/components/reports` | PDF template workspace |
| Hooks | `src/client/src/hooks` | Query and mutation hooks for API domains |
| Stores | `src/client/src/stores` | UI, scope, and graph state |

## Backend Services

Services encapsulate business logic and database access.

| Service | Responsibility |
|---------|----------------|
| `authService` | Login, logout, session cookies, password changes, optional header auth |
| `permissionService` | RBAC permission lookup and enforcement |
| `caseService` | Case CRUD and case membership |
| `incidentService` | Incident CRUD and incident membership |
| `findingService` | Findings, ownership, evidence relationships |
| `timelineEventService` | Timeline events and system/account linking |
| `indicatorService` | Indicator CRUD and duplicate prevention |
| `systemService` / `accountService` | Affected infrastructure and identity records |
| `taskService` | Kanban tasks, assignment, evidence links |
| `queryService` | Saved investigation queries and ATT&CK mappings |
| `tagService` | Custom tags and ATT&CK tag mappings |
| `evidenceLinkService` | Finding and task evidence relationships |
| `dashboardService` | Activity, SLA, and summary metrics |
| `searchService` | Global/case/incident search |
| `reportService` | Markdown reports and PDF export |
| `notificationService` | Notification records and event stream |
| `auditLogService` | Mutation history |

## Deployment Architecture

Production uses `docker-compose.prod.yml`:

- `postgres`: PostgreSQL 16 with a named volume.
- `app`: published Forenotes image, environment-driven config, `/app/data` named volume, `/api/health` healthcheck.

The production image runs migrations before starting the app. It refuses unsafe production settings such as default database credentials, demo mode, header auth, short bootstrap passwords, or a missing `FORENOTES_LLM_SECRET_KEY`.

## Error Handling

The Express error handler returns:

| Status | Meaning |
|--------|---------|
| 400 | Validation failure |
| 401 | Authentication failure |
| 403 | Permission or membership denied |
| 404 | Resource not found |
| 409 | Conflict |
| 429 | Login rate limit |
| 500 | Internal server error |

## Testing

- `npm run lint` runs TypeScript checking.
- `npm run test` runs Vitest and Supertest tests.
- `pg-mem` supports fast database-backed tests.
- `npm run build` compiles the server and builds the React client.
