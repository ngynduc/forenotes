# API Reference

Base URL in production: `https://<host>/api`

Base URL in local development: `http://localhost:8787/api` unless `APP_PORT` or `PORT` is changed.

## Authentication

Production API requests use the `forenotes_session` HTTP-only cookie created by `POST /api/auth/login`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login with username/password and set the session cookie |
| `POST` | `/api/auth/logout` | Delete the current session and clear the cookie |
| `GET` | `/api/auth/me` | Return the current user and permission list |
| `POST` | `/api/auth/change-password` | Change the current user's password |

`x-user-id` header auth is available only in tests or explicitly enabled non-production development. It is disabled in production.

## Response Shape

Successful list responses usually return a named array such as `{ "cases": [...] }` or `{ "findings": [...] }`. Create/update responses usually return the mutated record under its domain name.

Errors return:

```json
{
  "error": "Human readable message",
  "details": null
}
```

Zod validation errors return `400` with flattened validation details.

## Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Healthcheck used by Docker |

## Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List users |
| `POST` | `/api/users` | Create a user |
| `POST` | `/api/users/:userId/reset-password` | Reset a user's password |

Requires `user:manage`.

## Cases

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases` | List cases visible to the current user |
| `POST` | `/api/cases` | Create a case |
| `PATCH` | `/api/cases/:caseId` | Update case details |
| `GET` | `/api/cases/:caseId/members` | List case members |
| `POST` | `/api/cases/:caseId/members` | Add a case member |
| `PATCH` | `/api/cases/:caseId/members/:memberUserId` | Update a case member role |
| `DELETE` | `/api/cases/:caseId/members/:memberUserId` | Remove a case member |
| `GET` | `/api/cases/:caseId/incidents` | List incidents in a case |
| `POST` | `/api/cases/:caseId/incidents` | Create an incident in a case |

## Incidents And Investigation Records

Incident-scoped records require incident membership plus the relevant permission.

| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/api/incidents/:incidentId` | Update incident details |
| `GET` | `/api/incidents/:incidentId/members` | List incident members |
| `POST` | `/api/incidents/:incidentId/members` | Add an incident member |
| `DELETE` | `/api/incidents/:incidentId/members/:memberUserId` | Remove an incident member |
| `GET` | `/api/incidents/:incidentId/findings` | List findings |
| `POST` | `/api/incidents/:incidentId/findings` | Create a finding |
| `PATCH` | `/api/incidents/:incidentId/findings/:findingId` | Update a finding |
| `DELETE` | `/api/incidents/:incidentId/findings/:findingId` | Delete a finding |
| `GET` | `/api/incidents/:incidentId/timeline` | List timeline events |
| `POST` | `/api/incidents/:incidentId/timeline` | Create a timeline event |
| `PATCH` | `/api/incidents/:incidentId/timeline/:timelineEventId` | Update a timeline event |
| `DELETE` | `/api/incidents/:incidentId/timeline/:timelineEventId` | Delete a timeline event |
| `GET` | `/api/incidents/:incidentId/indicators` | List indicators |
| `POST` | `/api/incidents/:incidentId/indicators` | Create an indicator |
| `PATCH` | `/api/incidents/:incidentId/indicators/:indicatorId` | Update an indicator |
| `DELETE` | `/api/incidents/:incidentId/indicators/:indicatorId` | Delete an indicator |
| `GET` | `/api/incidents/:incidentId/systems` | List affected systems |
| `POST` | `/api/incidents/:incidentId/systems` | Create an affected system |
| `PATCH` | `/api/incidents/:incidentId/systems/:systemId` | Update an affected system |
| `DELETE` | `/api/incidents/:incidentId/systems/:systemId` | Delete an affected system |
| `GET` | `/api/incidents/:incidentId/accounts` | List affected accounts |
| `POST` | `/api/incidents/:incidentId/accounts` | Create an affected account |
| `PATCH` | `/api/incidents/:incidentId/accounts/:accountId` | Update an affected account |
| `DELETE` | `/api/incidents/:incidentId/accounts/:accountId` | Delete an affected account |
| `GET` | `/api/incidents/:incidentId/tasks` | List tasks |
| `POST` | `/api/incidents/:incidentId/tasks` | Create a task |
| `PATCH` | `/api/incidents/:incidentId/tasks/:taskId` | Update a task |
| `DELETE` | `/api/incidents/:incidentId/tasks/:taskId` | Delete a task |
| `GET` | `/api/incidents/:incidentId/queries` | List saved queries |
| `POST` | `/api/incidents/:incidentId/queries` | Create a saved query |
| `PATCH` | `/api/incidents/:incidentId/queries/:queryId` | Update a saved query |
| `DELETE` | `/api/incidents/:incidentId/queries/:queryId` | Delete a saved query |

## Evidence, Graph, And MITRE

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/incidents/:incidentId/evidence-links` | Link a finding to evidence |
| `DELETE` | `/api/incidents/:incidentId/evidence-links/:linkId` | Remove a finding evidence link |
| `POST` | `/api/incidents/:incidentId/tasks/:taskId/links` | Link a task to evidence |
| `DELETE` | `/api/incidents/:incidentId/tasks/:taskId/links/:linkId` | Remove a task evidence link |
| `GET` | `/api/incidents/:incidentId/entity-links` | List manual entity links |
| `POST` | `/api/incidents/:incidentId/entity-links` | Create a manual entity link |
| `DELETE` | `/api/incidents/:incidentId/entity-links/:linkId` | Delete a manual entity link |
| `GET` | `/api/incidents/:incidentId/graph?mode=overview` | Build the incident graph |
| `GET` | `/api/incidents/:incidentId/mitre-matrix` | Build the MITRE matrix |

Graph modes: `overview`, `investigation`, `timeline`, `assets`, `tasks`, `mitre`.

## Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tags/attack` | List ATT&CK tags |
| `GET` | `/api/cases/:caseId/custom-tags` | List custom tags |
| `POST` | `/api/cases/:caseId/custom-tags` | Create a custom tag |
| `PATCH` | `/api/cases/:caseId/custom-tags/:tagId` | Update a custom tag |
| `DELETE` | `/api/cases/:caseId/custom-tags/:tagId` | Delete a custom tag |
| `GET` | `/api/findings/:findingId/tags` | List finding tags |
| `POST` | `/api/findings/:findingId/attack-tags` | Add a finding ATT&CK tag |
| `POST` | `/api/findings/:findingId/custom-tags` | Add a finding custom tag |
| `GET` | `/api/timeline/:timelineEventId/tags` | List timeline tags |
| `POST` | `/api/timeline/:timelineEventId/attack-tags` | Add a timeline ATT&CK tag |
| `POST` | `/api/timeline/:timelineEventId/custom-tags` | Add a timeline custom tag |
| `GET` | `/api/queries/:queryId/tags` | List query ATT&CK tags |
| `POST` | `/api/queries/:queryId/attack-tags` | Add a query ATT&CK tag |

## Reports And LLM Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me/llm-settings` | Read masked current-user LLM settings |
| `PUT` | `/api/me/llm-settings` | Save current-user LLM settings |
| `DELETE` | `/api/me/llm-settings` | Delete current-user LLM settings |
| `POST` | `/api/me/llm-settings/test` | Test current-user LLM settings |
| `GET` | `/api/pdf-templates` | List PDF templates |
| `POST` | `/api/pdf-templates` | Create a PDF template |
| `PATCH` | `/api/pdf-templates/:pdfTemplateId` | Update a PDF template |
| `DELETE` | `/api/pdf-templates/:pdfTemplateId` | Delete a PDF template |
| `POST` | `/api/pdf-templates/:pdfTemplateId/duplicate` | Duplicate a PDF template |
| `POST` | `/api/pdf-templates/preview` | Preview a PDF template |
| `GET` | `/api/incidents/:incidentId/report-templates` | List report templates |
| `POST` | `/api/incidents/:incidentId/report-templates` | Create a report template |
| `PATCH` | `/api/incidents/:incidentId/report-templates/:templateId` | Update a report template |
| `DELETE` | `/api/incidents/:incidentId/report-templates/:templateId` | Delete a report template |
| `POST` | `/api/incidents/:incidentId/report-templates/:templateId/duplicate` | Duplicate a report template |
| `GET` | `/api/incidents/:incidentId/reports/context` | Build report context |
| `POST` | `/api/incidents/:incidentId/reports/generate` | Generate a report preview |
| `GET` | `/api/incidents/:incidentId/reports` | List reports |
| `POST` | `/api/incidents/:incidentId/reports` | Create a report |
| `GET` | `/api/incidents/:incidentId/reports/:reportId` | Read a report |
| `PATCH` | `/api/incidents/:incidentId/reports/:reportId` | Update a report |
| `DELETE` | `/api/incidents/:incidentId/reports/:reportId` | Delete a report |
| `POST` | `/api/incidents/:incidentId/reports/:reportId/export-pdf` | Export a report to PDF |

User LLM API keys are encrypted with `FORENOTES_LLM_SECRET_KEY`.

## Uploads

Authenticated upload/image routes:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/uploads/task-notes/:taskId/:filename` | Read an authenticated task note image |
| `GET` | `/api/uploads/reports/:incidentId/:filename` | Read an authenticated report image |
| `GET` | `/uploads/task-notes/:taskId/:filename` | Same route without `/api` for rendered content |
| `GET` | `/uploads/reports/:incidentId/:filename` | Same route without `/api` for rendered content |

Uploaded files are stored under `FORENOTES_DATA_DIR` and served only after permission checks.

## Dashboard, Search, Audit, Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/search` | Search globally or within case/incident scope |
| `GET` | `/api/audit-logs` | List audit logs visible to the current user |
| `GET` | `/api/dashboard/summary` | Summary counts |
| `GET` | `/api/dashboard/sla` | SLA and stale-work metrics |
| `GET` | `/api/dashboard/activity` | Activity trend |
| `GET` | `/api/dashboard/recent` | Recent activity |
| `GET` | `/api/notifications` | List notifications |
| `GET` | `/api/notifications/stream` | Server-sent notification stream |
| `POST` | `/api/notifications/:notificationId/read` | Mark a notification read |
