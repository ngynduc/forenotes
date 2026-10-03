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

MCP bearer tokens authenticate only the separate `/mcp` endpoint. They are not accepted by `/api` routes.

## MCP Token And Investigation Review

These routes use the normal session cookie. Newly issued token secrets appear only in the create response.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/mcp-tokens` | List the current user's token metadata |
| `POST` | `/api/mcp-tokens` | Create a read-only or read-write token |
| `DELETE` | `/api/mcp-tokens/:tokenId` | Revoke one current-user token |
| `GET` | `/api/cases/:caseId/investigation/runs` | List case investigation runs |
| `GET` | `/api/cases/:caseId/investigation/evidence` | List evidence metadata |
| `GET` | `/api/cases/:caseId/investigation/observations` | List observations and support links |
| `GET` | `/api/cases/:caseId/investigation/hypotheses` | List hypotheses and support links |
| `GET` | `/api/cases/:caseId/investigation/findings` | List agent-created findings |
| `GET` | `/api/cases/:caseId/investigation/actions` | List agent actions |
| `PATCH` | `/api/investigation/evidence/:evidenceId` | Edit evidence with audit history |
| `PATCH` | `/api/investigation/observations/:observationId` | Edit an observation with audit history |
| `PATCH` | `/api/investigation/hypotheses/:hypothesisId` | Edit a hypothesis with audit history |

List routes accept optional `incidentId`, `runId`, `limit`, and `offset` parameters where applicable. See the [MCP guide](./MCP.md) for the protocol endpoint and tool catalog.

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
| `PATCH` | `/api/users/:userId` | Update profile, role, or status |
| `POST` | `/api/users/:userId/reset-password` | Reset a user's password |

Requires `user:manage`. User updates accept any non-empty subset of `username`,
`email`, `displayName`, `globalRole` (`admin`, `commander`, `analyst`, `viewer`),
and `status` (`active`, `disabled`). Password resets remain a separate operation.
Unknown fields are rejected. Updates return `{ user }` using the same public
fields as user listing; duplicate usernames/emails return `409`.

```bash
curl -b "$COOKIE_FILE" -X PATCH "http://localhost:8787/api/users/$USER_ID" \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Updated Analyst","globalRole":"analyst"}'
```

## Cases

### Discover identifiers

UUIDs come from list/search/create responses. Start with names, then reuse returned IDs:

```bash
# COOKIE_FILE contains the session cookie from /api/auth/login.
curl -b "$COOKIE_FILE" --get http://localhost:8787/api/cases --data-urlencode 'q=Acme'
# Select a case from cases[] and copy its id into CASE_ID.
curl -b "$COOKIE_FILE" --get "http://localhost:8787/api/cases/$CASE_ID/incidents" --data-urlencode 'q=phishing'
# Select an incident from incidents[]; its id is the incidentId for later routes.
```

Both list routes accept optional `q`: literal, case-insensitive text matching case name/client/summary or incident name/summary. Empty or omitted `q` lists all accessible records. Responses retain their existing `{ "cases": [...] }` and `{ "incidents": [...] }` shapes, including UUIDs and readable context. Duplicate names remain separate records; choose using context before updating.

Use `/api/cases/:caseId/members` to obtain member `user_id` values for assignment. Other record list/create responses provide their respective IDs. For agents using bearer tokens, the [MCP discovery workflow](./MCP.md#discover-ids-from-names) exposes equivalent discovery tools with camelCase fields.

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
| `DELETE` | `/api/incidents/:incidentId/members/:memberUserId` | Remove the parent case member and derived incident access |
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
| `GET` | `/api/attack-tags` | List ATT&CK tags |
| `GET` | `/api/cases/:caseId/custom-tags` | List custom tags |
| `POST` | `/api/cases/:caseId/custom-tags` | Create a custom tag |
| `PATCH` | `/api/cases/:caseId/custom-tags/:tagId` | Update a custom tag |
| `DELETE` | `/api/cases/:caseId/custom-tags/:tagId` | Delete a custom tag |
| `GET` | `/api/incidents/:incidentId/findings/:findingId/tags` | List finding tags |
| `POST` | `/api/incidents/:incidentId/findings/:findingId/attack-tags` | Add a finding ATT&CK tag |
| `POST` | `/api/incidents/:incidentId/findings/:findingId/custom-tags` | Add a finding custom tag |
| `GET` | `/api/incidents/:incidentId/timeline-events/:timelineEventId/tags` | List timeline tags |
| `POST` | `/api/incidents/:incidentId/timeline-events/:timelineEventId/attack-tags` | Add a timeline ATT&CK tag |
| `POST` | `/api/incidents/:incidentId/timeline-events/:timelineEventId/custom-tags` | Add a timeline custom tag |
| `GET` | `/api/incidents/:incidentId/queries/:queryId/tags` | List query ATT&CK tags |
| `POST` | `/api/incidents/:incidentId/queries/:queryId/attack-tags` | Add a query ATT&CK tag |

Remove an attached tag with `DELETE` on the attachment URL plus its catalog UUID:

| Method | Path | Permission |
|--------|------|------------|
| `DELETE` | `/api/incidents/:incidentId/findings/:findingId/attack-tags/:tagId` | `finding:update` |
| `DELETE` | `/api/incidents/:incidentId/findings/:findingId/custom-tags/:tagId` | `finding:update` |
| `DELETE` | `/api/incidents/:incidentId/timeline-events/:timelineEventId/attack-tags/:tagId` | `timeline:update` |
| `DELETE` | `/api/incidents/:incidentId/timeline-events/:timelineEventId/custom-tags/:tagId` | `timeline:update` |
| `DELETE` | `/api/incidents/:incidentId/queries/:queryId/attack-tags/:tagId` | `query:update` |

Removal requires incident access, returns `204`, and is idempotent for an
already removed attachment. It deletes only the relationship, preserving the
catalog tag and other entities' attachments. Tag edits in the UI save immediately.

```bash
curl -b "$COOKIE_FILE" -X DELETE \
  "http://localhost:8787/api/incidents/$INCIDENT_ID/findings/$FINDING_ID/attack-tags/$TAG_ID"
```

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

### Session and realtime freshness

- Successful `POST /api/auth/change-password` revokes all of the user's browser sessions and clears the session cookie. Sign in again with the new password.
- `GET /api/notifications/stream` carries `notification.created`, `user.updated`, and `session.ended`. Notification envelopes include an optional `caseId` for scoped cache refresh.
- Membership notification types are `case.member_added`, `case.member_role_updated`, `case.member_removed`, and the compatibility `incident.member_added`. New incidents notify all inherited members with `incident.created`.
- Realtime events publish after transaction commit. The stream checks current session/account authorization before delivery and on its existing heartbeat.
- Incident access is case-wide. `DELETE /api/incidents/:incidentId/members/:memberUserId` is a compatibility entry point to remove the user from the parent case and all its incidents, with the existing membership-management and last-commander checks. Use the case membership UI for normal management.
