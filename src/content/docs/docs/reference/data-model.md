---
title: Data model
description: A practical map of the records and relationships stored by Forenotes.
---

## Investigation hierarchy

```text
Case
└── Incident
    ├── Findings ── evidence links
    ├── Timeline events
    ├── Indicators
    ├── Systems and accounts
    ├── Tasks ── evidence links and notes
    ├── Saved queries
    └── Reports and exports
```

Case membership is authoritative. Incident membership records are derived from it, so access remains case-wide. Incident records stay scoped to their parent investigation.

## Core tables

| Area | Tables | Purpose |
| --- | --- | --- |
| Identity | `users`, `sessions` | Accounts, roles, password state, and opaque sessions |
| Scope | `cases`, `case_members`, `incidents`, `incident_members` | Investigation boundaries and membership |
| Evidence | `findings`, `timeline_events`, `indicators` | Observations and chronology |
| Entities | `systems`, `accounts`, `incident_entity_links` | Affected assets and manual relationships |
| Work | `tasks`, `task_links`, `queries` | Assignments, notes, evidence links, and saved searches |
| Classification | `attack_tags`, `custom_tags`, tag junctions | ATT&CK and case-defined labels |
| Reporting | `report_templates`, `reports`, `report_exports` | Narrative output and PDF history |
| Operations | `notifications`, `audit_logs`, `schema_migrations` | Activity, accountability, and schema state |
| Agent access | `mcp_access_tokens`, `mcp_idempotency_results` | Hashed user-owned tokens and repeatable tool writes |
| Provenance | `investigation_runs`, `evidence_records`, `observations`, `hypotheses` | Case-scoped agent investigation records |
| Support and review | `observation_evidence`, `hypothesis_observations`, `finding_observations`, `agent_actions` | Evidence support chains and tool action history |

Uploaded binary files are not stored in PostgreSQL. They live under `FORENOTES_DATA_DIR`; database rows retain the relationships and metadata needed to authorize access.

Database schema changes are applied in order by the migration runner. Never edit an already-deployed migration; add a new migration instead.

The provenance schema is introduced by migration `010_mcp_provenance.sql` in 0.2.2. Agent-created findings remain drafts until human review validates their evidence support. See [MCP investigation agents](/docs/admin/mcp/).
