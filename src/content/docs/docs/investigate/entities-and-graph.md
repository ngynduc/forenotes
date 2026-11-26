---
title: Entities and relationship graph
description: Track affected assets and use relationships to review the investigation as a system.
---

Forenotes treats findings, timeline events, indicators, systems, accounts, tasks, queries, and ATT&CK tags as connected investigation entities.

## Record reusable entities

Create systems and accounts when multiple observations refer to the same asset or identity. Create indicators for observables that need confidence, source, and first/last-seen context.

Open **Entities** and pick a tab:

- **Indicators**: observables such as hashes, IP addresses, domains, URLs, processes, and email addresses, with confidence, source, and first and last seen times.

![Indicators](/user-guide/entities.png)

- **Systems**: affected hosts with hostname, IP address, operating system, and status.

![Systems](/user-guide/entities-systems.png)

- **Accounts**: affected identities with username, domain, status, and owner.

![Accounts](/user-guide/entities-accounts.png)

Each tab has an **Add** button and inline editing in the table.

Prefer one stable entity over repeated free-text variants. Consistent hostnames, domains, usernames, and indicator values make search and graph review more useful.

## Understand relationship types

**Derived links** come from structured evidence relationships, such as a finding linked to a system. **Manual links** describe relationships that are meaningful but not represented by a direct field.

Manual links should explain why two records are connected. Avoid creating links merely because records appear in the same incident.

## Review the graph

![Graph showing findings only](/user-guide/graph-findings.png)

The relationship graph opens with **findings only**, so large incidents stay readable. Click a finding to reveal what is directly connected to it: its timeline events, systems, accounts, indicators, tasks, and tags. Click the same finding again, or the empty canvas, to return to findings only. Clicking another finding switches the focus. Selecting a revealed node opens it in the inspector without changing the focus.

![Graph focused on one finding](/user-guide/graph-focused.png)

The **Inspect** panel on the right shows the selected node's details and its linked entities, with each link's type and whether it is derived or manual.

Findings are arranged in a grid with the focused finding's related records in rows below it, placed by measured size so nodes never overlap. The layout is recalculated whenever the focus changes.

A primary timeline event with supporting events shows a count. Click it to expand or collapse its supporting events.

Use graph modes to focus the workspace:

- `overview` for a broad incident map;
- `investigation` for findings and evidence;
- `timeline` for chronological relationships;
- `assets` for systems, accounts, and indicators;
- `tasks` for response work;
- `mitre` for ATT&CK coverage.

Look for isolated findings, over-connected generic entities, duplicate indicators, and important relationships that exist only in analyst memory.

Drag nodes to organize the current view. Refreshes preserve manually positioned nodes until the focus changes. Use **Auto layout** when you want to arrange the graph again.

## Read the MITRE ATT&CK matrix

Switch to **MITRE Matrix** on the Graph page to see which ATT&CK tactics and techniques the incident covers. Each technique card shows how many records carry that tag. Use it to communicate coverage, then review the tagged records behind each technique.

![MITRE ATT&CK matrix](/user-guide/mitre-matrix.png)

## Save hunt queries

Open **Queries** to keep the detections and hunting queries used in the incident, with their language (for example `sql` or `kusto`), owner, and description. Saved queries can be linked to findings as supporting evidence and carry ATT&CK tags.

![Queries](/user-guide/queries.png)

## Manage tags

Open **Tags** to manage **Case Tags**, the custom labels for the selected case, with a name and colour. The **MITRE ATT&CK Tags** list below is the built-in catalogue of tactics and techniques shared by every case.

![Tags](/user-guide/tags.png)

## Maintain ATT&CK coverage

Attach ATT&CK tags to findings, timeline events, and saved queries. Remove an incorrect tag from the record's tag controls. Findings and timeline events also allow removing custom tags. Removing an attachment leaves the investigation record and tag definition intact.

Tag changes refresh both the relationship graph and MITRE matrix. Review the underlying tagged records when assessing technique coverage.
