---
title: Release notes
description: Review release changes and migration requirements before upgrading Forenotes.
---

Use the [upgrade guide](/docs/operations/upgrade/) to deploy a chosen published version. Git tags use the `v` prefix; Docker image tags use the version without it.

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
