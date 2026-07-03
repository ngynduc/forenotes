# API Reference

The API belongs to the full Forenotes application. The static landing site does not expose these endpoints.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://<host>/api` |
| Local full app | `http://localhost:8787/api` unless `APP_PORT` or `PORT` is changed |

## Authentication

Production requests authenticate with the `forenotes_session` HTTP-only cookie set by `POST /api/auth/login`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/login` | Create a session cookie from username and password |
| `POST` | `/api/auth/logout` | Delete the current session |
| `GET` | `/api/auth/me` | Return the current user and permissions |
| `POST` | `/api/auth/change-password` | Change the current user's password |

`x-user-id` header auth is available only for tests or explicitly enabled non-production development. It is disabled in production.

## Response Shape

List responses usually return a named array:

```json
{
  "cases": []
}
```

Create and update responses usually return the changed record under its domain name.

Errors return:

```json
{
  "error": "Human readable message",
  "details": null
}
```

Validation errors return `400` with flattened Zod details.

## Core Routes

| Area | Routes |
|------|--------|
| Health | `GET /api/health` |
| Users | `GET /api/users`, `POST /api/users`, `POST /api/users/:userId/reset-password` |
| Cases | `GET /api/cases`, `POST /api/cases`, `PATCH /api/cases/:caseId` |
| Case members | `GET /api/cases/:caseId/members`, `POST /api/cases/:caseId/members`, `PATCH /api/cases/:caseId/members/:memberUserId`, `DELETE /api/cases/:caseId/members/:memberUserId` |
| Incidents | `GET /api/cases/:caseId/incidents`, `POST /api/cases/:caseId/incidents`, `PATCH /api/incidents/:incidentId` |
| Incident members | `GET /api/incidents/:incidentId/members`, `POST /api/incidents/:incidentId/members`, `DELETE /api/incidents/:incidentId/members/:memberUserId` |

## Investigation Records

Incident-scoped investigation records require incident membership and the relevant permission.

| Record | Common routes |
|--------|---------------|
| Findings | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/findings...` |
| Timeline | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/timeline...` |
| Indicators | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/indicators...` |
| Systems | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/systems...` |
| Accounts | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/accounts...` |
| Tasks | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/tasks...` |
| Queries | `GET`, `POST`, `PATCH`, `DELETE /api/incidents/:incidentId/queries...` |

## Evidence, Graph, Tags

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/incidents/:incidentId/evidence-links` | Link a finding to evidence |
| `DELETE` | `/api/incidents/:incidentId/evidence-links/:linkId` | Remove a finding evidence link |
| `POST` | `/api/incidents/:incidentId/tasks/:taskId/links` | Link a task to evidence |
| `GET` | `/api/incidents/:incidentId/entity-links` | List manual entity links |
| `POST` | `/api/incidents/:incidentId/entity-links` | Create a manual entity link |
| `GET` | `/api/incidents/:incidentId/graph?mode=overview` | Build the incident graph |
| `GET` | `/api/incidents/:incidentId/mitre-matrix` | Build the MITRE matrix |
| `GET` | `/api/tags/attack` | List ATT&CK tags |
| `GET` | `/api/cases/:caseId/custom-tags` | List custom tags |

Graph modes include `overview`, `investigation`, `timeline`, `assets`, `tasks`, and `mitre`.

## Reports And LLM Settings

| Area | Routes |
|------|--------|
| LLM settings | `/api/me/llm-settings`, `/api/me/llm-settings/test` |
| PDF templates | `/api/pdf-templates...` |
| Report templates | `/api/incidents/:incidentId/report-templates...` |
| Reports | `/api/incidents/:incidentId/reports...` |
| PDF export | `POST /api/incidents/:incidentId/reports/:reportId/export-pdf` |

User LLM API keys are encrypted with `FORENOTES_LLM_SECRET_KEY`.

## Uploads And Static Content

Authenticated upload routes:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/uploads/task-notes/:taskId/:filename` | Read a task note image |
| `GET` | `/api/uploads/reports/:incidentId/:filename` | Read a report image |
| `GET` | `/uploads/task-notes/:taskId/:filename` | Same asset path for rendered content |
| `GET` | `/uploads/reports/:incidentId/:filename` | Same asset path for rendered content |

Files are served only after permission checks.

## Dashboard, Search, Audit, Notifications

| Area | Routes |
|------|--------|
| Search | `GET /api/search` |
| Audit | `GET /api/audit-logs` |
| Dashboard | `GET /api/dashboard/summary`, `/sla`, `/activity`, `/recent` |
| Notifications | `GET /api/notifications`, `GET /api/notifications/stream`, `POST /api/notifications/:notificationId/read` |
