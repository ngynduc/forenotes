---
title: Entities and relationship graph
description: Track affected assets and use relationships to review the investigation as a system.
---

Forenotes treats findings, timeline events, indicators, systems, accounts, tasks, queries, and ATT&CK tags as connected investigation entities.

## Record reusable entities

Create systems and accounts when multiple observations refer to the same asset or identity. Create indicators for observables that need confidence, source, and first/last-seen context.

![Entity list](/user-guide/entities.png)

Prefer one stable entity over repeated free-text variants. Consistent hostnames, domains, usernames, and indicator values make search and graph review more useful.

## Understand relationship types

**Derived links** come from structured evidence relationships, such as a finding linked to a system. **Manual links** describe relationships that are meaningful but not represented by a direct field.

Manual links should explain why two records are connected. Avoid creating links merely because records appear in the same incident.

## Review the graph

![Entity relationship graph](/user-guide/entity-links-graph.png)

Use graph modes to focus the workspace:

- `overview` for a broad incident map;
- `investigation` for findings and evidence;
- `timeline` for chronological relationships;
- `assets` for systems, accounts, and indicators;
- `tasks` for response work;
- `mitre` for ATT&CK coverage.

Look for isolated findings, over-connected generic entities, duplicate indicators, and important relationships that exist only in analyst memory.
