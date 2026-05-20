# AGENTS.md

Guidelines for AI agents and developers working on Forenotes.

## Project Principles

- Build for clarity, maintainability, and security first.
- Prefer small, focused changes over large rewrites.
- Keep behavior scoped to the current case/incident unless explicitly global.
- Enforce permissions and data boundaries on the server, not only in the UI.
- Do not hide errors. Return clear validation, authorization, and conflict messages.

## Naming Conventions

### Files and Folders

- Use `PascalCase.tsx` for React components.
  - Example: `CaseCreateModal.tsx`, `IncidentWorkspace.tsx`
- Use `camelCase.ts` for utilities, hooks, services, and helpers.
  - Example: `formatDate.ts`, `useIncidentData.ts`, `caseService.ts`
- Use `kebab-case.css` or grouped CSS files for styles.
  - Example: `base.css`, `layout.css`, `workspace.css`
- Use feature-based folders when possible.
  - Example: `src/client/features/findings/`, `src/client/features/timeline/`

### Code Symbols

- Components: `PascalCase`
- Types/interfaces: `PascalCase`
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` only for true constants
- Database tables/columns: `snake_case`
- API routes: lowercase REST-style paths
  - Example: `/api/incidents/:incidentId/findings`

### Type Names

Prefer explicit domain names:

```ts
Finding
TimelineEvent
IncidentMember
CreateFindingInput
UpdateTimelineEventInput
```

Avoid vague names:

```ts
Data
Item
Info
Payload
Thing
```

## Modularization

Do not put everything in one large file.

Split by responsibility:

- UI components
- hooks
- API clients
- validation schemas
- server route handlers
- database queries
- permission checks
- reusable utilities

Recommended frontend shape:

```text
src/client/
  app/
  features/
    cases/
    incidents/
    findings/
    timeline/
    indicators/
    tasks/
    queries/
    notifications/
  components/
  hooks/
  services/
  styles/
```

Recommended server shape:

```text
src/server/
  routes/
  services/
  repositories/
  permissions/
  schemas/
  realtime/
```

Keep files focused:

- Components should render UI, not own all business logic.
- Hooks should manage state/data loading for one clear concern.
- Services should coordinate business logic.
- Repositories should contain database access.
- Permission logic should be reusable and centralized.

If a file becomes hard to scan, split it.

## TypeScript / JavaScript Clean Code

- Use TypeScript types for all API input/output boundaries.
- Prefer `type` or `interface` with domain-specific names.
- Avoid `any`; use `unknown` with validation when input is untrusted.
- Validate request bodies with shared schemas before using them.
- Prefer pure helper functions where practical.
- Keep functions small and single-purpose.
- Use early returns to reduce nesting.
- Avoid duplicated business rules across client and server.
- Do not mix data fetching, permission checks, and UI rendering in one function.
- Prefer readable code over clever code.

Good:

```ts
function canEditFinding(user: User, finding: Finding, incident: Incident): boolean {
  return isIncidentMember(user.id, incident.id) && hasPermission(user, 'finding:update');
}
```

Avoid:

```ts
function check(u: any, x: any): boolean {
  return u && x && u.r !== 'x';
}
```

## React Guidelines

- Keep components small and composable.
- Extract repeated modal/table/form patterns.
- Use controlled forms for create/edit workflows.
- Keep create/edit workflows in consistent modal components.
- Use hooks for data loading and mutations.
- Avoid deeply nested JSX; extract child components.
- Tables should support filtering and inline editing where required.

## CSS Guidelines

Start with fresh CSS. Do not rely on legacy global styles.

Preferred structure:

```text
src/client/styles/base.css
src/client/styles/layout.css
src/client/styles/components.css
src/client/styles/workspace.css
src/client/styles/modals.css
```

Rules:

- Keep global styles minimal.
- Use reusable class names for common layout and components.
- Avoid one-off styling scattered across large files.
- Keep modal, table, workspace, and layout styles separated.

## Database and Domain Rules

- MITRE ATT&CK tags are global built-in tags.
- Custom tags are scoped to a case.
- Incidents belong to cases.
- Findings, timeline events, indicators, systems, accounts, tasks, and queries belong to incidents.
- Finding evidence links must only link evidence from the same incident.
- Task links must only link entities from the same incident.
- Cross-case and cross-incident access must be blocked unless explicitly designed.

## Testing Expectations

For meaningful changes, include or update tests for:

- permissions
- case/incident scoping
- validation errors
- create/edit/delete flows
- evidence links
- tags
- notifications when relevant

Run lint, tests, and build before marking work complete.

## Agent Output Expectations

When completing a task, report:

- what changed
- files touched
- validation run
- known failures or blockers
- any follow-up needed

Do not claim success if lint, tests, or build fail. Explain the failure clearly.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **forenotes** (2978 symbols, 5726 relationships, 218 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/forenotes/context` | Codebase overview, check index freshness |
| `gitnexus://repo/forenotes/clusters` | All functional areas |
| `gitnexus://repo/forenotes/processes` | All execution flows |
| `gitnexus://repo/forenotes/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
