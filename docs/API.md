# API Reference

Base URL: `http://localhost:8787/api`

All requests require the `x-user-id` header with a valid user UUID.

## Authentication

### Headers

```
x-user-id: <user-uuid>
```

---

## Cases

### List Cases

```
GET /cases
```

Returns cases the authenticated user is a member of.

### Create Case

```
POST /cases
```

**Body:**

```json
{
  "case_name": "string (required)",
  "client_name": "string",
  "start_date": "date",
  "end_date": "date",
  "summary": "string"
}
```

**Permission:** `case:create`

### Update Case

```
PATCH /cases/:caseId
```

**Body:** Any subset of case fields.

**Permission:** `case:update` + case membership

### List Case Members

```
GET /cases/:caseId/members
```

**Permission:** Case membership

### Add Case Member

```
POST /cases/:caseId/members
```

**Body:**

```json
{
  "userId": "uuid (required)",
  "caseRole": "string (required)"
}
```

**Permission:** `case:member_manage`

### Remove Case Member

```
DELETE /cases/:caseId/members/:memberUserId
```

**Permission:** `case:member_manage`

### List Case Incidents

```
GET /cases/:caseId/incidents
```

**Permission:** Case membership

---

## Incidents

### Update Incident

```
PATCH /incidents/:incidentId
```

**Permission:** `incident:update` + incident membership

### List Incident Members

```
GET /incidents/:incidentId/members
```

### Add Incident Member

```
POST /incidents/:incidentId/members
```

**Body:**

```json
{
  "userId": "uuid (required)",
  "incidentRole": "string (required)"
}
```

**Permission:** `incident:member_manage`

### Remove Incident Member

```
DELETE /incidents/:incidentId/members/:memberUserId
```

**Permission:** `incident:member_manage`

---

## Findings

### List Findings

```
GET /incidents/:incidentId/findings
```

### Create Finding

```
POST /incidents/:incidentId/findings
```

**Body:**

```json
{
  "title": "string (required)",
  "description": "string",
  "severity": "low | medium | high | critical (required)",
  "status": "draft | confirmed | false_positive | resolved",
  "confidence": "low | medium | high",
  "impact": "string",
  "recommendation": "string",
  "ownerUserId": "uuid"
}
```

**Permission:** `finding:create` + incident membership

### Update Finding

```
PATCH /incidents/:incidentId/findings/:findingId
```

**Permission:** `finding:update` + incident membership

### Delete Finding

```
DELETE /incidents/:incidentId/findings/:findingId
```

**Permission:** `finding:delete` + incident membership

---

## Timeline Events

### List Timeline Events

```
GET /incidents/:incidentId/timeline
```

### Create Timeline Event

```
POST /incidents/:incidentId/timeline
```

**Body:**

```json
{
  "event_time": "ISO 8601 timestamp (required)",
  "title": "string (required)",
  "description": "string",
  "source": "string",
  "raw_evidence_ref": "string",
  "ownerUserId": "uuid",
  "systemId": "uuid",
  "accountId": "uuid"
}
```

**Permission:** `timeline:create` + incident membership

### Update Timeline Event

```
PATCH /incidents/:incidentId/timeline/:timelineEventId
```

**Permission:** `timeline:update` + incident membership

### Delete Timeline Event

```
DELETE /incidents/:incidentId/timeline/:timelineEventId
```

**Permission:** `timeline:delete` + incident membership

---

## Indicators

### List Indicators

```
GET /incidents/:incidentId/indicators
```

### Create Indicator

```
POST /incidents/:incidentId/indicators
```

**Body:**

```json
{
  "indicator_type": "host | ip | domain | url | email | file_hash | registry | mutex | process | user_agent | other (required)",
  "value": "string (required)",
  "description": "string",
  "confidence": "low | medium | high",
  "source": "string",
  "first_seen_at": "ISO 8601 timestamp",
  "last_seen_at": "ISO 8601 timestamp"
}
```

**Permission:** `indicator:create` + incident membership

Returns `409 Conflict` if the indicator type+value already exists for the incident.

### Update Indicator

```
PATCH /incidents/:incidentId/indicators/:indicatorId
```

**Permission:** `indicator:update` + incident membership

### Delete Indicator

```
DELETE /incidents/:incidentId/indicators/:indicatorId
```

**Permission:** `indicator:delete` + incident membership

---

## Systems

### List Systems

```
GET /incidents/:incidentId/systems
```

### Create System

```
POST /incidents/:incidentId/systems
```

**Body:**

```json
{
  "hostname": "string (required)",
  "ip_address": "string",
  "os": "string",
  "owner": "string",
  "notes": "string"
}
```

### Update System

```
PATCH /incidents/:incidentId/systems/:systemId
```

### Delete System

```
DELETE /incidents/:incidentId/systems/:systemId
```

---

## Accounts

### List Accounts

```
GET /incidents/:incidentId/accounts
```

### Create Account

```
POST /incidents/:incidentId/accounts
```

**Body:**

```json
{
  "username": "string (required)",
  "domain": "string",
  "status": "string",
  "owner": "string",
  "notes": "string"
}
```

### Update Account

```
PATCH /incidents/:incidentId/accounts/:accountId
```

### Delete Account

```
DELETE /incidents/:incidentId/accounts/:accountId
```

---

## Tasks

### List Tasks

```
GET /incidents/:incidentId/tasks
```

### Create Task

```
POST /incidents/:incidentId/tasks
```

**Body:**

```json
{
  "title": "string (required)",
  "description": "string",
  "status": "todo | in_progress | blocked | done",
  "priority": "low | medium | high | critical",
  "ownerUserId": "uuid",
  "assigneeUserId": "uuid",
  "dueAt": "ISO 8601 timestamp"
}
```

**Permission:** `task:create` + incident membership

### Update Task

```
PATCH /incidents/:incidentId/tasks/:taskId
```

**Permission:** `task:update` + incident membership. Changing owner/assignee requires `task:assign`. Task assignees can update their own task without `task:assign`.

### Delete Task

```
DELETE /incidents/:incidentId/tasks/:taskId
```

### Link Task to Evidence

```
POST /incidents/:incidentId/tasks/:taskId/links
```

**Body:**

```json
{
  "entityType": "finding | timeline_event | system | account | indicator | query (required)",
  "entityId": "uuid (required)"
}
```

**Permission:** `task:link`

### Unlink Task from Evidence

```
DELETE /incidents/:incidentId/tasks/:taskId/links/:linkId
```

**Permission:** `task:link`

---

## Queries

### List Queries

```
GET /incidents/:incidentId/queries
```

### Create Query

```
POST /incidents/:incidentId/queries
```

**Body:**

```json
{
  "name": "string (required)",
  "language": "string",
  "description": "string",
  "query_body": "string",
  "ownerUserId": "uuid"
}
```

**Permission:** `query:create` + incident membership

### Update Query

```
PATCH /incidents/:incidentId/queries/:queryId
```

**Permission:** `query:update` + incident membership

### Delete Query

```
DELETE /incidents/:incidentId/queries/:queryId
```

**Permission:** `query:delete` + incident membership

---

## Evidence Links

### Create Evidence Link (Finding → Evidence)

```
POST /incidents/:incidentId/evidence-links
```

**Body:**

```json
{
  "findingId": "uuid (required)",
  "evidenceType": "timeline_event | system | account | indicator | query (required)",
  "evidenceId": "uuid (required)"
}
```

**Permission:** `finding:evidence_link`

### Delete Evidence Link

```
DELETE /incidents/:incidentId/evidence-links/:linkId
```

**Permission:** `finding:evidence_unlink`

---

## Entity Links

### List Entity Links

```
GET /incidents/:incidentId/entity-links
```

**Permission:** `entity_link:read`

### Create Entity Link

```
POST /incidents/:incidentId/entity-links
```

**Body:**

```json
{
  "sourceType": "string (required)",
  "sourceId": "uuid (required)",
  "targetType": "string (required)",
  "targetId": "uuid (required)",
  "linkType": "string (required)"
}
```

**Permission:** `entity_link:create`

**Link types:** related_to, evidence_for, caused_by, followed_by, investigates, references, observed_on, used_account, contains_ioc, maps_to, belongs_to_tactic, subtechnique_of, detects, assigned_to, has_tag

### Delete Entity Link

```
DELETE /incidents/:incidentId/entity-links/:linkId
```

**Permission:** `entity_link:delete`

---

## Graph

### Get Incident Graph

```
GET /incidents/:incidentId/graph?mode=overview
```

**Query params:**

| Param | Values | Default |
|-------|--------|---------|
| mode | overview, investigation, timeline, assets, tasks, mitre | overview |

**Permission:** `graph:read`

**Response:**

```json
{
  "nodes": [
    {
      "id": "string",
      "type": "finding | timeline_event | task | system | account | ioc | query | mitre_technique | mitre_tactic | user | tag",
      "label": "string",
      "data": {}
    }
  ],
  "edges": [
    {
      "source": "node-id",
      "target": "node-id",
      "type": "edge-type",
      "derived": true
    }
  ]
}
```

---

## MITRE ATT&CK

### Get MITRE Matrix

```
GET /incidents/:incidentId/mitre-matrix
```

**Permission:** `mitre_matrix:read`

### List Attack Tags

```
GET /tags/attack
```

### Link Finding to Attack Tag

```
POST /findings/:findingId/attack-tags
```

**Body:**

```json
{
  "attackTagId": "uuid (required)"
}
```

### Unlink Finding from Attack Tag

```
DELETE /findings/:findingId/attack-tags/:attackTagId
```

### Link Timeline Event to Attack Tag

```
POST /timeline/:timelineEventId/attack-tags
```

### Unlink Timeline Event from Attack Tag

```
DELETE /timeline/:timelineEventId/attack-tags/:attackTagId
```

---

## Tags

### List Custom Tags

```
GET /tags/custom?caseId=<uuid>
```

### Create Custom Tag

```
POST /tags/custom
```

**Body:**

```json
{
  "caseId": "uuid (required)",
  "name": "string (required)",
  "color": "string"
}
```

**Permission:** `tag:custom_create`

### Update Custom Tag

```
PATCH /tags/custom/:tagId
```

**Permission:** `tag:custom_update`

---

## Search

```
POST /search
```

**Body:**

```json
{
  "query": "string (required)",
  "caseId": "uuid (optional, scope to case)",
  "incidentId": "uuid (optional, scope to incident)"
}
```

Searches across: findings, timeline events, indicators, queries, tasks, systems, accounts, tags, attack tags, incidents, cases. Tag-aware: also finds entities tagged with the search term.

---

## Dashboard

```
GET /dashboard
```

Returns:

```json
{
  "summary": {
    "totalCases": 0,
    "totalIncidents": 0,
    "totalFindings": 0,
    "totalTasks": 0
  },
  "sla": {
    "overdueTasks": 0,
    "dueSoonTasks": 0,
    "staleIncidents": 0,
    "agingFindings": 0
  },
  "breakdowns": {
    "caseStatus": {},
    "incidentSeverity": {},
    "findingStatus": {},
    "taskStatus": {}
  },
  "activitySeries": [],
  "recentActivity": []
}
```

SLA thresholds:
- **Overdue tasks:** Past due date
- **Due soon tasks:** Due within 48 hours
- **Stale incidents:** Open, no activity for 72+ hours
- **Aging findings:** Draft status for 7+ days

---

## Notifications

### List Notifications

```
GET /notifications
```

**Permission:** `notification:read`

### Mark Notification Read

```
PATCH /notifications/:notificationId
```

---

## Audit Logs

```
GET /audit-logs
```

**Permission:** `audit:read`

---

## Users (Admin)

### List Users

```
GET /users
```

### Create User

```
POST /users
```

**Body:**

```json
{
  "email": "string (required)",
  "displayName": "string (required)",
  "globalRole": "admin | commander | analyst | viewer (required)",
  "password": "string"
}
```

### Update User

```
PATCH /users/:userId
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {}
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid request body or parameters |
| 401 | Missing or invalid `x-user-id` header |
| 403 | Insufficient permissions or not a member |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate indicator) |
| 500 | Internal server error |
