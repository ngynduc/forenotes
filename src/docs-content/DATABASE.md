# Database Schema

Forenotes stores application state in PostgreSQL. Uploaded images and generated files live in the app data directory, not directly in the database.

## Main Entity Groups

| Group | Tables |
|-------|--------|
| Identity | `users`, `sessions` |
| Access control | `permissions`, `role_permissions`, `case_members`, `incident_members` |
| Investigation scope | `cases`, `incidents` |
| Investigation records | `findings`, `timeline_events`, `indicators`, `systems`, `accounts`, `tasks`, `queries` |
| Tags | `attack_tags`, `custom_tags`, tag junction tables |
| Relationships | `finding_evidence_links`, `incident_entity_links`, `task_links` |
| Reports | `report_templates`, `reports`, `report_exports`, LLM settings |
| Operations | `audit_logs`, `notifications` |

## Identity

| Table | Purpose |
|-------|---------|
| `users` | Login identity, display metadata, global role, password hash, and password-change state |
| `sessions` | Opaque session ids, user linkage, expiry, and session metadata |

Production authentication resolves the current user through `sessions`, not through a JWT.

## Investigation Hierarchy

```text
case
  incident
    findings
    timeline events
    indicators
    systems
    accounts
    tasks
    queries
    reports
```

Cases and incidents carry membership tables so access can be scoped independently from global role.

## Core Tables

| Table | Notes |
|-------|-------|
| `cases` | Client, date range, summary, status, creator, and timestamps |
| `incidents` | Case parent, title, severity, status, commander, summary, and timestamps |
| `findings` | Severity, confidence, status, impact, recommendation, owner, and creator |
| `timeline_events` | Event time, source, raw evidence reference, system/account links, and summary |
| `indicators` | Type, value, confidence, first/last seen, source, and uniqueness by incident |
| `systems` | Hostname, IP, OS, owner, and status |
| `accounts` | Username, domain, owner, and status |
| `tasks` | Title, status, priority, owner, assignee, due date, and description |
| `queries` | Name, language, query body, description, owner, and creator |

## Relationships

| Table | Purpose |
|-------|---------|
| `finding_evidence_links` | Links findings to timeline events, systems, accounts, indicators, and queries |
| `task_links` | Links tasks to related investigation records |
| `incident_entity_links` | Stores manually created source-target relationships for the incident graph |

Manual links support typed relationships such as `related_to`, `evidence_for`, `caused_by`, `followed_by`, `investigates`, `references`, `observed_on`, `used_account`, `contains_ioc`, `maps_to`, `detects`, `assigned_to`, and `has_tag`.

## Tags

| Table | Purpose |
|-------|---------|
| `attack_tags` | MITRE ATT&CK tactic and technique definitions |
| `custom_tags` | Case-scoped user-defined tags |
| Junction tables | Attach ATT&CK and custom tags to findings, timeline events, and queries |

Custom tag names are unique within a case.

## Reports

| Table | Purpose |
|-------|---------|
| `report_templates` | Incident-scoped Markdown templates |
| `reports` | Generated or manually authored reports |
| `report_exports` | PDF export history |

Per-user LLM provider settings are encrypted with `FORENOTES_LLM_SECRET_KEY`.

## Audit And Notifications

| Table | Purpose |
|-------|---------|
| `audit_logs` | Actor, case, incident, action, entity, before/after JSON, metadata, and timestamp |
| `notifications` | Recipient, actor, event type, title, body, entity reference, unseen state, and read timestamp |

## Migration Policy

Migrations run at startup in production. They should be idempotent or safe to rerun, fail loudly, and preserve existing investigation data. Back up PostgreSQL before upgrading production.
