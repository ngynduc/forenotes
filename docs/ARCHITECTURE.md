# Architecture

## Overview

Forenotes follows a layered architecture with clear separation between the frontend SPA, REST API routes, business logic services, and the PostgreSQL database.

```
┌─────────────────────────────────────────┐
│          Frontend (Vanilla JS SPA)       │
│  state.js ← api.js ← render modules    │
└──────────────────┬──────────────────────┘
                   │ HTTP (JSON)
┌──────────────────┴──────────────────────┐
│           Express 5 Routes              │
│  caseRoutes, incidentRoutes, tagRoutes  │
│  searchRoutes, dashboardRoutes, etc.    │
├─────────────────────────────────────────┤
│          Zod Schema Validation          │
├─────────────────────────────────────────┤
│         Middleware (Auth + RBAC)         │
│  authService → permissionService        │
├─────────────────────────────────────────┤
│          Business Logic Services        │
│  caseService, findingService,           │
│  timelineEventService, taskService,     │
│  graphBuilder, mitreMatrixBuilder, etc. │
├─────────────────────────────────────────┤
│          PostgreSQL (pg driver)         │
│  pool.ts → migrations/                  │
└─────────────────────────────────────────┘
```

## Request Flow

1. Client sends HTTP request with `x-user-id` header
2. Route handler receives request
3. **Auth middleware** resolves user from `x-user-id` header
4. **Permission check** validates user's role has required permission
5. **Membership check** verifies user belongs to case/incident
6. **Zod validation** validates request body/params
7. **Service layer** executes business logic
8. **Audit log** records mutation (create/update/delete)
9. **Notification** created for relevant team members
10. JSON response returned to client

## Frontend Architecture

The frontend is a module-based SPA without a framework. Key patterns:

### State Management (`state.js`)

Single global state object with getter/setter pattern. All data flows through state:

```
state = {
  users, activeUserId, currentUser, permissions,
  cases, selectedCaseId, incidents, selectedIncidentId,
  caseMembers, incidentMembers,
  findings, timelineEvents, indicators, systems, accounts,
  tasks, queries, entityLinks, customTags, attackTags,
  notifications, auditLogs, searchResults, dashboardSummary,
  ui: { activeSection, sidebarExpanded, ... }
}
```

### Rendering Pipeline

```
User Action → entities.js (CRUD) → api.js (HTTP) → data.js (refresh state)
                                                          ↓
                                              render module re-renders
```

### UI Sections

| Section | Render Module | Description |
|---------|---------------|-------------|
| Dashboard | `render/dashboard.js` | Metrics, SLA, activity feed |
| Cases | `render/table.js` | Case listing with CRUD |
| Findings | `render/table.js` | Findings table with evidence links |
| Timeline | `render/table.js` | Chronological event listing |
| Tasks | `render/tasks.js` | Kanban board (todo/in-progress/blocked/done) |
| Entities | `render/table.js` | Systems, accounts, indicators |
| Queries | `render/table.js` | Saved investigation queries |
| Graph | `render/graph.js` | Incident relationship visualization |
| Tags | `render/admin.js` | Tag management |
| Settings | `render/admin.js` | User/role management |

## Backend Services

Services encapsulate all business logic. Each service owns its database queries and validation logic.

| Service | Responsibility |
|---------|---------------|
| `authService` | User resolution from request headers |
| `permissionService` | RBAC enforcement, permission queries |
| `caseService` | Case CRUD, case membership |
| `incidentService` | Incident CRUD, incident membership |
| `findingService` | Finding CRUD, evidence linking |
| `timelineEventService` | Timeline event CRUD, system/account linking |
| `indicatorService` | Indicator CRUD, duplicate prevention |
| `systemService` | Affected system CRUD |
| `accountService` | Affected account CRUD |
| `taskService` | Task CRUD, assignment, task-evidence linking |
| `queryService` | Query CRUD, attack tag support |
| `tagService` | Custom tag management |
| `evidenceLinkService` | Finding-to-evidence relationships |
| `membershipService` | Case/incident member management |
| `notificationService` | Notification creation and delivery |
| `auditLogService` | Mutation audit trail |
| `searchService` | Full-text search across all entities |
| `dashboardService` | Metrics, SLA tracking, analytics |
| `graphBuilder` | Incident graph construction |
| `mitreMatrixBuilder` | MITRE ATT&CK matrix generation |

## Error Handling

Centralized error handling via `AppError` class:

| Status | Meaning |
|--------|---------|
| 400 | Validation failure |
| 401 | Authentication failure (missing/invalid user) |
| 403 | Permission denied (insufficient role/membership) |
| 404 | Resource not found |
| 409 | Conflict (duplicate indicator, etc.) |
| 500 | Internal server error |

## Testing Strategy

- **Unit/Integration tests** with Vitest
- **In-memory PostgreSQL** via `pg-mem` for fast DB tests
- **HTTP assertions** via Supertest
- Tests located alongside source files or in `__tests__` directories
