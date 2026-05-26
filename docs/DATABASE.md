# Database Schema

## Overview

Forenotes uses PostgreSQL with UUID primary keys and timestamp tracking. The schema enforces referential integrity via foreign keys and uniqueness constraints where appropriate.

## Entity Relationship Diagram

```
                    ┌──────────┐
                    │  users   │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────┴─────┐  ┌────┴────┐  ┌─────┴──────┐
    │case_members│  │  cases  │  │notifications│
    └───────────┘  └────┬────┘  └────────────┘
                        │
              ┌─────────┼─────────┐
              │         │         │
        ┌─────┴──────┐  │  ┌─────┴──────┐
        │custom_tags │  │  │incident_   │
        └────────────┘  │  │members     │
                        │  └────────────┘
                  ┌─────┴─────┐
                  │ incidents │
                  └─────┬─────┘
                        │
    ┌───────┬───────┬───┼───┬────────┬────────┐
    │       │       │       │        │        │
┌───┴──┐┌──┴───┐┌──┴──┐┌───┴──┐┌────┴──┐┌────┴──┐
│find- ││time- ││indi-││sys-  ││accou- ││tasks  │
│ings  ││line  ││cato-││tems  ││nts    ││       │
│      ││events││rs   ││      ││       ││       │
└──┬───┘└──┬───┘└─────┘└──────┘└───────┘└───┬───┘
   │       │                                 │
   │  ┌────┴──────────┐              ┌───────┴──┐
   │  │timeline_event_│              │task_links │
   │  │attack_tags    │              └──────────┘
   │  └───────────────┘
   │
   ├── finding_evidence_links
   ├── finding_attack_tags
   └── finding_custom_tags
```

## Tables

### users

Stores all application users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | User identifier |
| email | text | UNIQUE, NOT NULL | User email |
| display_name | text | NOT NULL | Display name |
| global_role | text | NOT NULL | One of: admin, commander, analyst, viewer |
| status | text | NOT NULL, default 'active' | User status (active/inactive) |
| password_hash | text | | Hashed password |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

### cases

Top-level investigation containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Case identifier |
| case_name | text | NOT NULL | Case name |
| client_name | text | | Client organization |
| start_date | date | | Investigation start |
| end_date | date | | Investigation end |
| status | text | NOT NULL, default 'open' | open, closed |
| summary | text | | Case summary |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### incidents

Security incidents within a case.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Incident identifier |
| case_id | uuid | FK → cases, NOT NULL | Parent case |
| name | text | NOT NULL | Incident name |
| summary | text | | Incident summary |
| severity | text | NOT NULL | low, medium, high, critical |
| status | text | NOT NULL, default 'open' | open, contained, closed |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### findings

Analyst conclusions about incident activity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Finding identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| title | text | NOT NULL | Finding title |
| description | text | | Detailed description |
| severity | text | NOT NULL | low, medium, high, critical |
| status | text | NOT NULL, default 'draft' | draft, confirmed, false_positive, resolved |
| confidence | text | NOT NULL, default 'medium' | low, medium, high |
| impact | text | | Impact assessment |
| recommendation | text | | Recommended actions |
| owner_user_id | uuid | FK → users | Current owner |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### timeline_events

Chronological observations from evidence.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Event identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| event_time | timestamptz | NOT NULL | When the event occurred |
| title | text | NOT NULL | Event title |
| description | text | | Event details |
| source | text | | Evidence source |
| raw_evidence_ref | text | | Reference to raw evidence |
| owner_user_id | uuid | FK → users | Current owner |
| system_id | uuid | FK → systems | Related system |
| account_id | uuid | FK → accounts | Related account |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### indicators

Indicators of Compromise (IoCs).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Indicator identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| indicator_type | text | NOT NULL | host, ip, domain, url, email, file_hash, registry, mutex, process, user_agent, other |
| value | text | NOT NULL | Indicator value |
| description | text | | Description |
| confidence | text | NOT NULL, default 'medium' | low, medium, high |
| source | text | | Source of the indicator |
| first_seen_at | timestamptz | | First observed |
| last_seen_at | timestamptz | | Last observed |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

**Unique constraint:** `(incident_id, indicator_type, value)` - prevents duplicate indicators per incident.

### systems

Affected systems in an incident.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | System identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| hostname | text | NOT NULL | System hostname |
| ip_address | text | | IP address |
| os | text | | Operating system |
| owner | text | | System owner |
| notes | text | | Additional notes |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### accounts

Affected user accounts in an incident.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Account identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| username | text | NOT NULL | Account username |
| domain | text | | Account domain |
| status | text | | Account status |
| owner | text | | Account owner |
| notes | text | | Additional notes |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### tasks

Investigation work items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Task identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| title | text | NOT NULL | Task title |
| description | text | | Task details |
| status | text | NOT NULL, default 'todo' | todo, in_progress, blocked, done |
| priority | text | NOT NULL, default 'medium' | low, medium, high, critical |
| owner_user_id | uuid | FK → users | Task owner |
| assignee_user_id | uuid | FK → users | Assigned investigator |
| due_at | timestamptz | | Due date |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### queries

Saved investigation queries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Query identifier |
| incident_id | uuid | FK → incidents, NOT NULL | Parent incident |
| name | text | NOT NULL | Query name |
| language | text | | Query language (SQL, KQL, etc.) |
| description | text | | Query purpose |
| query_body | text | | Query content |
| owner_user_id | uuid | FK → users | Query owner |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### attack_tags

MITRE ATT&CK technique and tactic definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Tag identifier |
| attack_id | text | UNIQUE, NOT NULL | MITRE ID (e.g., T1003) |
| name | text | NOT NULL | Technique/tactic name |
| type | text | NOT NULL | tactic or technique |
| parent_attack_id | text | | Parent technique ID (for subtechniques) |
| tactic | text | | Associated tactic |
| platform | text | | Target platform |
| attack_version | text | | ATT&CK version |
| external_url | text | | MITRE documentation URL |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

### custom_tags

User-defined tags scoped to a case.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Tag identifier |
| case_id | uuid | FK → cases, NOT NULL | Parent case |
| name | text | NOT NULL | Tag name |
| color | text | | Tag display color |
| created_by_user_id | uuid | FK → users | Creator |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

**Unique constraint:** `(case_id, name)` - prevents duplicate tag names per case.

## Junction / Relationship Tables

### case_members

| Column | Type | Description |
|--------|------|-------------|
| case_id | uuid | FK → cases |
| user_id | uuid | FK → users |
| case_role | text | Role in case (commander, analyst, viewer) |
| added_by_user_id | uuid | Who added them |
| added_at | timestamptz | When added |

**Primary key:** `(case_id, user_id)`

### incident_members

| Column | Type | Description |
|--------|------|-------------|
| incident_id | uuid | FK → incidents |
| user_id | uuid | FK → users |
| incident_role | text | Role in incident (commander, analyst, viewer) |
| added_by_user_id | uuid | Who added them |
| added_at | timestamptz | When added |

**Primary key:** `(incident_id, user_id)`

### finding_evidence_links

Links findings to their supporting evidence.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| finding_id | uuid | FK → findings |
| incident_id | uuid | FK → incidents |
| evidence_type | text | timeline_event, system, account, indicator, query |
| evidence_id | uuid | ID of the linked entity |
| linked_by_user_id | uuid | FK → users |
| created_at | timestamptz | |

### incident_entity_links

Manual relationships between any two entities in an incident.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| incident_id | uuid | FK → incidents |
| source_type | text | Entity type of source |
| source_id | uuid | Source entity ID |
| target_type | text | Entity type of target |
| target_id | uuid | Target entity ID |
| link_type | text | Relationship type (see Edge Types) |
| created_by_user_id | uuid | FK → users |
| created_at | timestamptz | |

### task_links

Links tasks to evidence entities.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| task_id | uuid | FK → tasks |
| incident_id | uuid | FK → incidents |
| entity_type | text | finding, timeline_event, system, account, indicator, query |
| entity_id | uuid | Linked entity ID |
| created_at | timestamptz | |

### Tag Junction Tables

**finding_attack_tags** - PK: `(finding_id, attack_tag_id)`
**finding_custom_tags** - PK: `(finding_id, custom_tag_id)`
**timeline_event_attack_tags** - PK: `(timeline_event_id, attack_tag_id)`
**timeline_event_custom_tags** - PK: `(timeline_event_id, custom_tag_id)`
**query_attack_tags** - PK: `(query_id, attack_tag_id)`

### permissions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| key | text | UNIQUE, permission identifier |
| description | text | Human-readable description |

### role_permissions

| Column | Type | Description |
|--------|------|-------------|
| role | text | Global role name |
| permission_key | text | FK → permissions.key |

**Primary key:** `(role, permission_key)`

## Supporting Tables

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| recipient_user_id | uuid | FK → users |
| incident_id | uuid | FK → incidents |
| actor_user_id | uuid | FK → users (who triggered) |
| event_type | text | Event that generated notification |
| title | text | Notification title |
| body | text | Notification body |
| entity_type | text | Related entity type |
| entity_id | uuid | Related entity ID |
| unseen | boolean | default true |
| read_at | timestamptz | When read |
| created_at | timestamptz | |

### audit_logs

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| actor_user_id | uuid | FK → users |
| case_id | uuid | FK → cases |
| incident_id | uuid | FK → incidents |
| action | text | entity.create, entity.update, entity.delete |
| entity_type | text | Type of entity modified |
| entity_id | uuid | Modified entity ID |
| before_json | jsonb | State before change |
| after_json | jsonb | State after change |
| metadata_json | jsonb | Additional context |
| created_at | timestamptz | |

## Migrations

| File | Description |
|------|-------------|
| `001_initial.sql` | Core schema: users, cases, incidents, all entity tables, RBAC, tags, audit, notifications |
| `002_graph_workspace.sql` | Graph workspace support |
| `003_timeline_relationship_fields.sql` | Added `system_id` and `account_id` foreign keys to timeline_events |
