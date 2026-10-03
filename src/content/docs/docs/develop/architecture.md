---
title: Architecture
description: Understand the React client, Express API, service layer, PostgreSQL storage, and production containers.
---

Forenotes is a React/Vite single-page client served by an Express 5 API. PostgreSQL stores investigation records, users, sessions, permissions, reports, notifications, and audit history.

```text
React client
  pages, components, hooks, stores
          │ HTTP JSON + session cookie
          ▼
Express API
  authentication, validation, routes
          ▼
Domain services
  permissions, cases, evidence, graph, reports
          ▼
PostgreSQL + /app/data
```

Investigation agents use a separate stateless `/mcp` Streamable HTTP endpoint. It validates Host, Origin, and a user-owned bearer token, then dispatches tools through the same domain services and case permissions. Agent writes preserve provenance and action history.

## Runtime layout

| Path | Responsibility |
| --- | --- |
| `src/client` | React application, Vite build, pages, UI state, and API hooks |
| `src/server/app.ts` | Express security, routes, static client, and error handling |
| `src/server/routes` | HTTP route modules and request validation |
| `src/server/services` | Business rules and database operations |
| `src/server/db` | Connection pool, migrations, and bootstrap administrator |
| `src/server/graph` | Incident graph and MITRE matrix builders |
| `src/shared` | Domain types and constants shared across runtimes |

## Request flow

1. Login creates a database-backed session and HTTP-only cookie.
2. A route validates parameters and request bodies with Zod.
3. Permission checks combine the global role with case or incident membership.
4. A domain service reads or mutates PostgreSQL.
5. Relevant mutations write audit and notification records.
6. The API returns JSON to the React client.

Role, profile, membership, and workspace changes propagate to open clients through the existing single-process realtime stream after transactions commit. Clients reconcile access after reconnecting. Case membership is authoritative; incident membership is a derived view.

## Production runtime

Production Compose runs PostgreSQL 16, the Forenotes application, and a separate Python report LLM service. The app container runs migrations before startup, serves API and client assets, and stores uploaded files under `/app/data`. It waits for the report-service healthcheck and reaches the service through the internal network at `http://report-llm-service:8001`; the service has no published host port.

MCP runs inside the application and does not require the report LLM service. See [MCP investigation agents](/docs/admin/mcp/) for its setup and review workflow.
