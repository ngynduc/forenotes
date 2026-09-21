---
title: API reference
description: Authentication, response conventions, and endpoint groups for the Forenotes REST API.
---

Production base URL: `https://<host>/api`. Local development defaults to `http://localhost:8787/api`.

Browser requests authenticate with the HTTP-only `forenotes_session` cookie created by `POST /api/auth/login`.

## Response conventions

List responses use a named array such as `{ "cases": [...] }`. Mutation responses usually return the changed record under its domain name. Errors use:

```json
{
  "error": "Human readable message",
  "details": null
}
```

Validation failures return HTTP `400` with flattened details.

## Authentication and health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Container health check |
| `POST` | `/api/auth/login` | Create a session |
| `POST` | `/api/auth/logout` | Delete the current session |
| `GET` | `/api/auth/me` | Current user and permissions |
| `POST` | `/api/auth/change-password` | Change the current password |

## Cases and incidents

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/cases` | List visible cases or create one |
| `PATCH` | `/api/cases/:caseId` | Update a case |
| `GET`, `POST` | `/api/cases/:caseId/members` | List or add case members |
| `PATCH`, `DELETE` | `/api/cases/:caseId/members/:memberUserId` | Change or remove membership |
| `GET`, `POST` | `/api/cases/:caseId/incidents` | List or create incidents |
| `PATCH` | `/api/incidents/:incidentId` | Update an incident |
| `GET`, `POST` | `/api/incidents/:incidentId/members` | List or add incident members |

## Investigation records

The following incident collections support `GET` and `POST` on `/api/incidents/:incidentId/<collection>`, plus `PATCH` and `DELETE` on the record path:

| Collection | Record parameter |
| --- | --- |
| `findings` | `findingId` |
| `timeline` | `timelineEventId` |
| `indicators` | `indicatorId` |
| `systems` | `systemId` |
| `accounts` | `accountId` |
| `tasks` | `taskId` |
| `queries` | `queryId` |

Incident membership and the relevant permission are required.

## Graph and reports

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/incidents/:incidentId/graph?mode=overview` | Build an incident graph |
| `GET` | `/api/incidents/:incidentId/mitre-matrix` | Build the MITRE matrix |
| `GET` | `/api/incidents/:incidentId/reports/context` | Build report context |
| `POST` | `/api/incidents/:incidentId/reports/generate` | Generate a report preview |
| `GET`, `POST` | `/api/incidents/:incidentId/reports` | List or create reports |
| `GET`, `PATCH`, `DELETE` | `/api/incidents/:incidentId/reports/:reportId` | Read, update, or delete a report |
| `POST` | `/api/incidents/:incidentId/reports/:reportId/export-pdf` | Export PDF |

Graph modes are `overview`, `investigation`, `timeline`, `assets`, `tasks`, and `mitre`.

## Users, search, and activity

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/users` | List or create users; requires `user:manage` |
| `POST` | `/api/users/:userId/reset-password` | Reset a password |
| `GET` | `/api/search` | Search globally or within a scope |
| `GET` | `/api/audit-logs` | Read visible audit records |
| `GET` | `/api/dashboard/summary` | Dashboard counts |
| `GET` | `/api/notifications` | List notifications |
| `GET` | `/api/notifications/stream` | Notification event stream |

Uploaded task-note and report images require authentication and are served only after permission checks.
