# Forenotes Phase 1 Tech Stack

## Purpose

This document defines the recommended technical stack for Forenotes Phase 1. The goal is to build a clean, maintainable incident response / forensic notes platform from a fresh start, with strong foundations for permissions, collaboration, evidence linking, and future reporting.

## Product Assumption

Forenotes is a web application for security teams to manage cases, incidents, findings, timeline events, systems, accounts, indicators, tasks, queries, tags, notifications, and audit history.

Phase 1 should prioritize correctness, clear data boundaries, and browser-verifiable workflows over complex automation.

## Frontend

### Core Stack

| Area | Choice | Notes |
|---|---|---|
| Framework | React | Component-based UI for workspace-heavy application |
| Language | TypeScript | Required for shared types and safer refactors |
| Build Tool | Vite | Fast local dev and simple production build |
| Routing | React Router | Case, incident, and workspace routes |
| State | React state + small context stores | Avoid heavy global state early unless needed |
| Forms | React controlled forms | Keep validation explicit and testable |
| API Client | Fetch wrapper | Centralize auth, errors, and JSON handling |
| Testing | Vitest + React Testing Library | Unit and component behavior testing |
| Browser Testing | Playwright | Required for critical workflows |

### Styling

Phase 1 starts with **no existing CSS**. Do not assume a legacy stylesheet exists.

Use plain CSS modules or structured global CSS files. Avoid one large global stylesheet.

Preferred structure:

```txt
src/client/styles/base.css
src/client/styles/layout.css
src/client/styles/components.css
src/client/styles/workspace.css
src/client/styles/modals.css
src/client/styles/tables.css
```

Guidelines:

- `base.css`: reset, typography, CSS variables, app-wide defaults.
- `layout.css`: app shell, sidebars, panels, page layout.
- `components.css`: shared buttons, badges, inputs, empty states.
- `workspace.css`: incident workspace-specific layout.
- `modals.css`: create/edit modal patterns.
- `tables.css`: filterable and inline-editable table behavior.

CSS should be written from scratch with these rules:

- Use a consistent modal pattern for create/edit workflows, similar to Jira-style popups.
- Keep panel collapse controls small and attached to the panel itself.
- Tables should support filtering and inline editing where required.
- Use clear visual distinction for read-only fields, editable fields, selected rows, and linked evidence.
- Avoid broad selectors that unintentionally affect unrelated feature areas.

## Backend

### Core Stack

| Area | Choice | Notes |
|---|---|---|
| Runtime | Node.js | Matches TypeScript full-stack workflow |
| Language | TypeScript | Shared types and strict API contracts |
| Web Server | Express or Fastify | Either is acceptable; keep API thin and explicit |
| Database | PostgreSQL | Relational data, constraints, JSONB audit snapshots |
| Migrations | SQL migrations or typed migration tool | Migrations must be deterministic and reviewed |
| Validation | Zod or equivalent schema validation | Shared request/response validation where practical |
| Auth | Session or JWT-based auth | Must support user identity and permission checks |
| Testing | Vitest/Jest + Supertest-style API tests | API permissions and validation must be tested |

## Database

PostgreSQL is the recommended database for Phase 1 because Forenotes requires:

- Strong relationships between cases, incidents, findings, evidence, and users.
- Foreign keys and uniqueness constraints.
- Permission-safe scoping by case and incident.
- JSONB audit snapshots for before/after records.
- Good indexing for search and filtering.

Use UUID primary keys for business records.

## Authorization Model

Authorization should be enforced server-side. The frontend may hide actions, but the API must be the final authority.

Recommended role layers:

```txt
Global role
  Admin
  Commander
  Analyst
  Viewer

Case role
  Case owner / case member role

Incident role
  Incident lead / incident analyst / viewer-style access if needed

Permission key
  Explicit action such as finding:create, task:assign, case:update
```

Phase 1 should include explicit permission checks for:

- Case creation and editing.
- Case membership management.
- Incident creation and editing.
- Incident membership management.
- Finding create/update/delete.
- Timeline event create/update/delete.
- Indicator create/update/delete.
- Task create/update/assign/link.
- Query create/update/delete.
- Tag create/update usage rules.
- Notification visibility.
- Audit log visibility.

## Realtime / Notification Strategy

Phase 1 can start with polling unless realtime is already simple to add.

Minimum requirement:

- Notifications must be persisted in the database.
- Notifications must have unseen/read state.
- UI must show an unseen notification count.
- Users must only see notifications addressed to them.

Optional later enhancement:

- WebSocket or Server-Sent Events for live notification delivery.

## Search

Phase 1 search should be scoped and explainable.

Minimum:

- Search within current case or incident.
- Global search results must clearly show which case and incident an item belongs to.
- Search results should include entity type, title/name/value, source, and parent scope.

Suggested searchable entities:

- Cases
- Incidents
- Findings
- Timeline events
- Systems
- Accounts
- Indicators
- Queries
- Tags
- Tasks

## Quality Bar

Phase 1 is done only when important workflows are browser-verifiable.

Required test layers:

- Unit tests for pure permission and validation logic.
- API integration tests for server-side permissions and scoping.
- Browser workflow tests for critical user journeys.

Browser tests should verify visible outcomes, not only API success.

Example required browser outputs:

- Case creation appears in the case table.
- Incident creation appears under the selected case.
- Finding can link evidence from the same incident.
- Cross-incident evidence linking is blocked.
- Task assignment creates a notification for the assignee.
- Unseen notification count changes after a notification is created and read.
- MITRE ATT&CK tags are globally available.
- Custom tags are only available inside the case where they were created.
