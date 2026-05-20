# Features

## Case Management

Cases are top-level containers for investigations. Each case represents an engagement or investigation project.

- **Create cases** with client name, date range, and summary
- **Case membership** controls who can access case data
- **Case roles** (e.g., `case_lead`) define responsibilities
- **Status tracking:** open, closed
- **Multiple incidents** per case

## Incident Management

Incidents are discrete security events being investigated within a case.

- **Severity levels:** low, medium, high, critical
- **Status workflow:** open → contained → closed
- **Incident membership** with roles (e.g., `incident_lead`)
- All investigation artifacts are scoped to an incident

## Findings

Findings are analyst-authored conclusions about incident activity.

- **Severity and confidence** ratings for prioritization
- **Status workflow:** draft → confirmed → false_positive/resolved
- **Impact and recommendation** fields for stakeholder communication
- **Evidence linking** — connect findings to supporting evidence:
  - Timeline events
  - Systems
  - Accounts
  - Indicators
  - Queries
- **Tagging** with MITRE ATT&CK techniques and custom tags
- **Ownership** model with creator and current owner

## Timeline Events

Chronologically-ordered observations extracted from evidence sources.

- **Event time** for accurate timeline reconstruction
- **Source attribution** — where the observation came from
- **Raw evidence reference** — pointer to original evidence
- **System and account linking** — which host/account was involved
- **MITRE ATT&CK and custom tags** for classification

## Indicators of Compromise (IoCs)

Track indicators discovered during investigation.

**Supported types:**

| Type | Example |
|------|---------|
| host | `WORKSTATION-01` |
| ip | `192.168.1.100` |
| domain | `malicious.example.com` |
| url | `https://evil.com/payload` |
| email | `phish@attacker.com` |
| file_hash | `d41d8cd98f00b204e9800998ecf8427e` |
| registry | `HKLM\Software\...` |
| mutex | `Global\MyMutex` |
| process | `svchost.exe` |
| user_agent | `Mozilla/5.0 ...` |
| other | Free-form |

- **Uniqueness enforcement** — same type+value cannot be added twice per incident
- **Confidence** rating (low/medium/high)
- **First seen / last seen** timestamps
- **Source** attribution

## Systems

Track affected infrastructure involved in an incident.

- Hostname, IP address, OS, owner
- Can be linked to timeline events
- Can be linked to findings as evidence

## Accounts

Track affected user accounts involved in an incident.

- Username, domain, status, owner
- Can be linked to timeline events
- Can be linked to findings as evidence

## Tasks

Investigation work items for team coordination.

- **Kanban board** with columns: Todo, In Progress, Blocked, Done
- **Priority levels:** low, medium, high, critical
- **Owner/assignee separation** — task creator vs. person doing the work
- **Due dates** with SLA tracking (overdue/due soon on dashboard)
- **Evidence linking** — connect tasks to related entities (findings, timeline events, systems, accounts, indicators, queries)
- **Assignment rules:** assignees can update their own task's status without needing `task:assign` permission

## Queries

Save and share investigation queries used during analysis.

- **Language field** for query type (SQL, KQL, Splunk SPL, etc.)
- **Query body** for the actual query text
- **MITRE ATT&CK tagging** — map queries to the techniques they detect
- **Ownership** tracking

## Entity Relationships

Two types of relationships exist between investigation artifacts:

### Derived Links
Automatically created from evidence relationships:
- Finding → evidence links (finding_evidence_links)
- Timeline event → system/account (via foreign keys)
- Task → evidence links (task_links)
- Entity → MITRE tag mappings

### Manual Links
Explicitly created by investigators:
- Stored in `incident_entity_links`
- Support arbitrary source/target entity types
- Typed relationships: related_to, evidence_for, caused_by, followed_by, investigates, references, observed_on, used_account, contains_ioc, maps_to, detects, assigned_to, has_tag

## Incident Graph

Visual representation of relationships between all entities in an incident.

### Graph Modes

| Mode | Shows |
|------|-------|
| **overview** | All entities and relationships |
| **investigation** | Findings, evidence, and their connections |
| **timeline** | Timeline events with system/account links |
| **assets** | Systems and accounts with associated events |
| **tasks** | Tasks with linked evidence |
| **mitre** | MITRE techniques/tactics with mapped evidence |

### Node Types
finding, timeline_event, task, system, account, ioc, query, mitre_technique, mitre_tactic, user, tag

### Edge Types
related_to, evidence_for, caused_by, followed_by, investigates, references, observed_on, used_account, contains_ioc, maps_to, belongs_to_tactic, subtechnique_of, detects, assigned_to, has_tag

## MITRE ATT&CK Integration

Map investigation artifacts to the MITRE ATT&CK framework.

- **Technique and tactic** tags with hierarchical structure (parent/subtechnique)
- **Findings, timeline events, and queries** can be tagged with ATT&CK techniques
- **MITRE matrix view** shows which techniques are observed, with evidence counts per entity type
- **Platform and version** tracking for ATT&CK entries

## Tags

### MITRE ATT&CK Tags
Global tags representing ATT&CK techniques and tactics. Can be applied to findings, timeline events, and queries.

### Custom Tags
User-created tags scoped to a case. Support custom colors. Can be applied to findings and timeline events.

## Search

Full-text search across all investigation entities.

- **Scope options:** global, case-scoped, incident-scoped
- **Searchable entities:** findings, timeline events, indicators, queries, tasks, systems, accounts, tags, attack tags, incidents, cases
- **Tag-aware:** finds entities tagged with the search term
- **Results grouped** by case and incident

## Dashboard

Overview of investigation activity and SLA metrics.

### Summary Metrics
- Total cases, incidents, findings, tasks

### SLA Tracking
- **Overdue tasks:** past due date
- **Due soon tasks:** due within 48 hours
- **Stale incidents:** open with no activity for 72+ hours
- **Aging findings:** in draft status for 7+ days

### Breakdowns
- Case status distribution (open/closed)
- Incident severity distribution
- Finding status distribution
- Task status distribution

### Activity
- 7-day activity trend (findings, tasks, timeline events per day)
- Recent activity feed (8 most recent items across entity types)

## Audit Logging

Complete audit trail for all entity mutations.

- **Actions tracked:** entity.create, entity.update, entity.delete
- **Before/after snapshots** as JSON for change review
- **Actor, case, and incident** context
- **Metadata** field for additional context

## Notifications

Event-driven notifications for team awareness.

- **Events:** finding.created, finding.updated, incident.created, task.assigned, etc.
- **Per-user delivery** to relevant team members
- **Unseen/read** state tracking
- **Entity context** linking back to the source item
