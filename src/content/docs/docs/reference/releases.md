---
title: Release notes
description: Review release changes and migration requirements before upgrading Forenotes.
---

Use the [upgrade guide](/docs/operations/upgrade/) to deploy a chosen published version. Git tags use the `v` prefix; Docker image tags use the version without it.

## 0.2.6

Forenotes 0.2.6 ships a single `ngynduc/forenotes:0.2.6` image.

### AI reports

- **AI Report Chat** drafts reports in a streaming conversation. The AI reads incident data through read-only tools under your permissions, and you save its answer to the new **Report Editor**.
- **Chat Prompt** stores per-user report instructions on top of built-in rules.
- The app calls OpenAI-compatible providers directly. The separate `report-llm-service` container and the `forenotes-report-llm` image are removed; the app image is about 290 MB instead of 1.4 GB.
- PDF export, Markdown report templates, the template guide, and template-based preview generation are removed from the UI. Export reports as themed HTML.
- **Test connection** in LLM settings shows the provider's error message.

### Investigation workspace

- The relationship graph starts with findings only; clicking a finding reveals its related records in a non-overlapping layout.
- Timeline events have a primary or supporting role; supporting events expand from their primary event.
- Findings and timeline events show creator, owner, timestamps, evidence, related entities, and tags.
- Users are deactivated instead of deleted, preserving attribution.

### Stability

- Database connection waits, query, and idle-transaction timeouts (`DB_POOL_MAX`, `DB_STATEMENT_TIMEOUT_MS`); dropped idle connections no longer crash the app.
- Provider requests time out after `LLM_TIMEOUT_MS`.
- `/api/health` checks the database. The app shuts down cleanly on `SIGTERM`, and production Compose waits for PostgreSQL.

### Before upgrading

Migrations `012_timeline_event_roles.sql` and `013_report_chat_prompts.sql` run at startup. Replace the Compose file, run `up -d --remove-orphans` to remove the old report service, and delete `LITELLM_SERVICE_URL` and `FORENOTES_REPORT_LLM_IMAGE` from `.env.production`. Custom provider names now require `LLM_API_ENDPOINT`. Clients that used `POST /api/incidents/{incidentId}/reports/{reportId}/export/pdf` must switch to `/export/html`.

## 0.2.2

### Installation and report drafting

- Production Compose includes the internal Python report LLM service and waits for its healthcheck.
- Matching `ngynduc/forenotes:0.2.2` and `ngynduc/forenotes-report-llm:0.2.2` images are published.
- Installer reruns fill missing or empty report-service URLs while preserving credentials, existing app image pins, and configured external report-service URLs.
- Provider credentials still need configuration in user Settings or deployment-level `LLM_*` variables.

### Investigation agents

- Optional authenticated [MCP tools](/docs/admin/mcp/) support case discovery, investigation runs, evidence, observations, hypotheses, tasks, and draft findings.
- Tokens inherit their owner's current access. MCP is disabled by default.
- Agent work preserves evidence support and an action trail. Findings require human confirmation.
- Name-based REST and MCP discovery lets clients find records without knowing UUIDs.

### Workspace fixes

- Administrators can edit existing users with validation, permission checks, and audit records.
- ATT&CK tags can be attached and removed from findings, timeline events, and queries. Findings and timeline events also support custom-tag removal. Edits refresh the MITRE matrix and graph.
- Graph layout uses measured node sizes, preserves dragged positions during refreshes, and includes **Auto layout**.
- Password changes revoke browser sessions. Profile, role, membership, and access changes refresh open workspaces through the existing realtime stream.

### Before upgrading

Back up PostgreSQL, application data, the production Compose file, and `.env.production`. Preserve `FORENOTES_LLM_SECRET_KEY` so saved provider credentials remain readable.

Replace the installed Compose file with the one from Git tag `v0.2.2` and pin both images to `0.2.2`. Changing only the app image does not add the report-service container. Startup applies migration `010_mcp_provenance.sql`; test the upgrade on a restored backup first. Rollback across this schema change requires the matching pre-upgrade database and data backup.

Case membership is authoritative for all incidents. Removing a member through the compatibility incident-membership endpoint removes parent-case membership and access to all its incidents. Users must sign in again after changing passwords.
