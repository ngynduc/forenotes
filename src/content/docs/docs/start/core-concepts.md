---
title: Core concepts
description: Understand the records and access boundaries used throughout Forenotes.
sidebar:
  order: 2
---

Forenotes organizes work around two access boundaries: a **case** and the **incidents** inside it. Investigation records belong to an incident, while membership determines who can see or change them.

| Concept | What it represents |
| --- | --- |
| Case | A top-level investigation, engagement, or customer matter. |
| Incident | A security event investigated inside a case. |
| Finding | An analyst conclusion with severity, confidence, impact, and recommendations. |
| Timeline event | A time-bound observation from evidence or analysis. |
| Indicator | An observable such as an IP, domain, URL, hash, process, or registry key. |
| System and account | Affected infrastructure and identities. |
| Task | Assigned response work with priority, due date, and status. |
| Query | A saved KQL, SQL, SPL, or other investigation query. |
| Entity link | A manual or derived relationship between records. |
| Report | A Markdown investigation narrative that can be exported to PDF. |

## Scope before detail

The active case and incident define the workspace. When a record seems missing, first confirm the selected scope and your membership. Global administrators can manage users, but investigation access is still represented through case and incident membership.

## Evidence before conclusions

Findings should point back to supporting records. Link findings to timeline events, indicators, systems, accounts, queries, or tasks so reviewers can follow the reasoning rather than receiving an isolated conclusion.

## Roles

Forenotes uses four global roles: `admin`, `commander`, `analyst`, and `viewer`. Case membership uses `commander`, `analyst`, and `viewer`. Incident membership provides the incident-level scope used by investigation routes.

The [permission matrix](/docs/reference/permission-matrix/) describes the practical boundaries.
