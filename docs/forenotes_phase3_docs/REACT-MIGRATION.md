# React Migration Plan: Vanilla JS → React + Vite + shadcn/ui + React Flow

## Context

Forenotes frontend is ~4,400 LOC vanilla JS with custom SVG graph rendering, served as static files from Express. Goal: full rewrite to React for better UI/UX, maintainability, and graph interaction. User chose full rewrite over incremental migration.

## Tech Stack
- **React 19** + TypeScript
- **Vite** (build + dev server with API proxy)
- **Tailwind CSS v4** + **shadcn/ui** (components)
- **React Flow** (`@xyflow/react` v12) for relationship graph
- **TanStack Query** (server state / data fetching)
- **Zustand** (UI state)
- **React Router v7** (library mode, client-side SPA)

## Phase 0: Project Scaffold (~100 LOC config)

1. Create `src/client/` with Vite + React + TypeScript
2. Add `src/client/vite.config.ts` — proxy `/api` to `localhost:8787`
3. Add `src/client/tsconfig.json` — browser target, JSX, bundler resolution
4. Init Tailwind v4 with design tokens from `styles/tokens.css`
5. Init shadcn/ui (`components.json` + base components)
6. Move graph response types to `src/shared/graph-types.ts`
7. Add npm scripts: `dev:client`, `build:client`
8. Old app stays functional at `localhost:8787` during migration

## Phase 1: Foundation (~800 LOC)

**Files:** `src/client/src/`
- `main.tsx`, `App.tsx` — entry + providers + router
- `lib/api.ts` — type-safe API client using `x-user-id` header auth
- `lib/utils.ts` — `cn()` helper, formatDate, escapeHtml
- `stores/scope-store.ts` — Zustand: selectedCaseId, selectedIncidentId, activeUserId
- `stores/ui-store.ts` — Zustand: sidebar, taskView, entityTab, flash
- `hooks/use-auth.ts` — useCurrentUser, usePermissions
- `hooks/use-cases.ts`, `use-incidents.ts` — TanStack Query hooks
- `components/layout/AppShell.tsx` — sidebar rail + panel + topbar + outlet
- `components/layout/ContextBar.tsx` — case/incident selector
- `config/routes.tsx` — all page routes
- `styles/globals.css` — Tailwind + shadcn theme variables

## Phase 2: Tables + Entity CRUD (~1,200 LOC) — biggest phase

Port the generic table/modal system that powers 10 of 15 views:

- `components/data-table/DataTable.tsx` — sort, search, pagination (replaces `render/table.js`)
- `components/entity-modal/EntityModal.tsx` — dynamic create/edit/delete dialog (replaces `render/modal.js`)
- `components/entity-modal/TagManagement.tsx` — tag attach/display
- `components/data-table/InlineEditor.tsx` — cell-level editing
- `config/entity-definitions.ts` — port `entities.js` + `membershipEntities.js` to TS
- `config/table-definitions.ts` — port `tableDefinitions.js`
- Pages: CasesPage, FindingsPage, TimelinePage, QueriesPage, EntitiesPage, TagsPage, NotificationsPage, AuditPage, SettingsPage

## Phase 3: Dashboard (~300 LOC)

- `pages/DashboardPage.tsx`
- `components/dashboard/MetricCard.tsx`, `ActivityChart.tsx`, `SlaWatch.tsx`, `BreakdownBar.tsx`, `RecentActivity.tsx`
- `hooks/use-dashboard.ts`

## Phase 4: Tasks / Kanban (~300 LOC)

- `pages/TasksPage.tsx` — board/table toggle
- `components/kanban/KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`
- Drag-drop via `@dnd-kit/core` or native HTML drag (matching current behavior)

## Phase 5: Relationship Graph with React Flow (~600 LOC)

Replace custom 807 LOC SVG graph + 200 LOC event handling:

- `components/graph/RelationshipGraph.tsx` — React Flow wrapper
- `components/graph/nodes/EntityNode.tsx` — custom node type per entity
- `components/graph/edges/LabeledEdge.tsx` — bezier edge with label
- `components/graph/layout.ts` — port timeline-aware lane layout algorithm from `graph.js:144-334`
- `components/graph/GraphToolbar.tsx` — mode, filters, search
- `components/graph/NodeInspector.tsx` — selected node details
- `stores/graph-store.ts` — Zustand: filters, selected node, matrix filters
- `hooks/use-graph.ts` — TanStack Query for graph + MITRE data

## Phase 6: MITRE ATT&CK Matrix (~400 LOC)

Custom CSS Grid component (not React Flow):

- `components/mitre/MitreMatrix.tsx` — 12-tactic grid
- `components/mitre/TacticColumn.tsx`, `TechniqueCard.tsx`, `TechniqueInspector.tsx`
- `components/mitre/MatrixToolbar.tsx`

## Phase 7: Code Editor + Polish (~200 LOC)

- CodeMirror 6 integration via `@uiw/react-codemirror` for query editing
- Global search (shadcn Command palette)
- Keyboard shortcuts, responsive adjustments, error boundaries, empty states

## Phase 8: Cutover

- Update `src/server/app.ts` to serve `dist/client` instead of `src/client/static`
- Remove `src/client/static/`
- Update build scripts: `build` includes `build:client`

## State Management Strategy

**Server state -> TanStack Query:**
- Query keys scoped hierarchically: `["incidents", incidentId, "findings"]`
- `enabled: !!incidentId` replaces manual cascade refreshing
- Mutation invalidation replaces `refreshAfterEntityChange()`

**UI state -> Zustand:**
- `scope-store`: selectedCaseId, selectedIncidentId, activeUserId (localStorage)
- `ui-store`: sidebarExpanded, taskView, entityTab, flash
- `graph-store`: graph filters, selected node, matrix filters

**Table state -> local `useState`** (sort, page, search per table instance)

## Key Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| Graph layout parity | Port `layoutNodes` algorithm directly, apply x/y to React Flow nodes |
| Inline editing complexity | React controlled component simpler than current event delegation |
| Shared types import | Move graph types to `src/shared/`, use Vite path aliases |
| Entity modal dynamism | Port entity definitions as TS config, EntityForm iterates fields |

## Verification

1. Run `npm run dev` + `npm run dev:client` — React app loads at `localhost:5173`
2. Each phase: verify views render, CRUD operations work, data refreshes correctly
3. Graph phase: compare node positions and interactions with old SVG version
4. Final: run full E2E walkthrough — create case -> create incident -> add findings -> view graph -> view MITRE matrix
5. Production build: `npm run build:client` produces `dist/client/`, Express serves it

## File Structure

```
src/client/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── components.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/globals.css
│   ├── lib/          (api.ts, utils.ts, constants.ts)
│   ├── stores/       (scope-store.ts, ui-store.ts, graph-store.ts)
│   ├── hooks/        (use-auth, use-cases, use-findings, use-graph, etc.)
│   ├── config/       (entity-definitions.ts, table-definitions.ts, routes.tsx)
│   ├── pages/        (12 page components)
│   ├── components/
│   │   ├── ui/       (shadcn generated)
│   │   ├── layout/   (AppShell, Sidebar, TopBar, ContextBar)
│   │   ├── data-table/
│   │   ├── entity-modal/
│   │   ├── graph/    (React Flow + custom nodes/edges)
│   │   ├── mitre/    (Matrix grid components)
│   │   ├── dashboard/
│   │   ├── kanban/
│   │   └── shared/   (StatusBadge, PermissionGate, ErrorBoundary)
│   └── providers/
```

Estimated total: ~3,800 LOC TSX (down from 4,400 JS due to React declarative model + shadcn).
