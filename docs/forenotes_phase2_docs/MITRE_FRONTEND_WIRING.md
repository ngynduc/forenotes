# MITRE Frontend Wiring Guide

This document explains how the frontend should wire to the backend MITRE graph and matrix support now implemented in Phase 2.

The backend currently provides:

- incident graph APIs
- manual incident entity links
- MITRE matrix aggregation
- ATT&CK mappings for findings, timeline events, and queries
- derived timeline relationships to systems and accounts through `timelineEvent.systemId` and `timelineEvent.accountId`

This guide is written against the current backend contract in `src/server`.

## Backend Surfaces

### Graph APIs

Use these incident-scoped endpoints:

```txt
GET    /api/incidents/:incidentId/entity-links
POST   /api/incidents/:incidentId/entity-links
DELETE /api/incidents/:incidentId/entity-links/:linkId

GET    /api/incidents/:incidentId/graph
GET    /api/incidents/:incidentId/mitre-matrix
```

### Existing Mapping APIs Reused by Graph

```txt
POST /api/incidents/:incidentId/findings/:findingId/attack-tags
GET  /api/incidents/:incidentId/findings/:findingId/tags

POST /api/incidents/:incidentId/timeline-events/:timelineEventId/attack-tags
GET  /api/incidents/:incidentId/timeline-events/:timelineEventId/tags

POST /api/incidents/:incidentId/queries/:queryId/attack-tags
GET  /api/incidents/:incidentId/queries/:queryId/tags
```

### Timeline Event Relationship Fields

Timeline events now support:

```ts
type CreateTimelineEventInput = {
  eventTime: string;
  title: string;
  description?: string;
  source?: string;
  rawEvidenceRef?: string;
  systemId?: string;
  accountId?: string;
};
```

The backend enforces:

- `systemId` must point to a system in the same incident
- `accountId` must point to an account in the same incident

Those fields are used to derive graph edges:

- `timeline_event -> system` as `observed_on`
- `timeline_event -> account` as `used_account`

## Recommended Client File Split

Create a dedicated graph feature module:

```txt
src/client/features/graph/
  graphApi.ts
  graphTypes.ts
  GraphWorkspace.tsx
  GraphToolbar.tsx
  RelationshipGraphView.tsx
  MitreMatrixView.tsx
  GraphInspector.tsx
  graphSelectors.ts
```

Keep MITRE-specific logic out of generic modal or table helpers.

## Frontend Types

Mirror the backend response shapes directly.

```ts
export type GraphNodeType =
  | "finding"
  | "timeline_event"
  | "task"
  | "system"
  | "account"
  | "ioc"
  | "query"
  | "mitre_technique"
  | "mitre_tactic"
  | "user"
  | "tag";

export type GraphEdgeType =
  | "related_to"
  | "evidence_for"
  | "caused_by"
  | "followed_by"
  | "investigates"
  | "references"
  | "observed_on"
  | "used_account"
  | "contains_ioc"
  | "maps_to"
  | "belongs_to_tactic"
  | "subtechnique_of"
  | "detects"
  | "assigned_to"
  | "has_tag";

export type GraphMode =
  | "overview"
  | "investigation"
  | "timeline"
  | "assets"
  | "tasks"
  | "mitre";
```

Use the backend response shapes as-is for first pass. Do not invent a second frontend schema unless rendering forces it.

## graphApi.ts

The frontend should centralize all graph fetches here.

```ts
export async function fetchIncidentGraph(
  incidentId: string,
  params: {
    mode?: GraphMode;
    entityTypes?: GraphNodeType[];
    linkTypes?: GraphEdgeType[];
    includeDerived?: boolean;
    includeManual?: boolean;
    depth?: "1" | "2" | "3" | "all";
    q?: string;
  }
) {}

export async function fetchMitreMatrix(
  incidentId: string,
  params: {
    includeSubtechniques?: boolean;
    minEvidence?: number;
    q?: string;
    tactic?: string;
    entityType?: "finding" | "timeline_event" | "query" | "task";
  }
) {}

export async function fetchEntityLinks(incidentId: string) {}

export async function createEntityLink(
  incidentId: string,
  payload: {
    sourceType: GraphNodeType;
    sourceId: string;
    targetType: GraphNodeType;
    targetId: string;
    linkType: GraphEdgeType;
  }
) {}

export async function deleteEntityLink(incidentId: string, linkId: string) {}
```

Build query strings with `URLSearchParams`.

Rules:

- `entityTypes` must be sent as comma-separated values
- `linkTypes` must be sent as comma-separated values
- booleans must be sent as `"true"` or `"false"`
- omit empty params instead of sending blank strings

## Graph Workspace State

`GraphWorkspace` should own state for:

- active subview: `relationship_graph` or `mitre_matrix`
- search text
- selected node id
- selected edge id
- selected technique id
- graph filters
- matrix filters
- focused entity for popup handoff

Recommended state shape:

```ts
type GraphUiState = {
  activeView: "relationship_graph" | "mitre_matrix";
  graph: {
    mode: GraphMode;
    entityTypes: GraphNodeType[];
    linkTypes: GraphEdgeType[];
    includeDerived: boolean;
    includeManual: boolean;
    depth: "1" | "2" | "3" | "all";
    q: string;
  };
  matrix: {
    q: string;
    tactic: string;
    entityType: "" | "finding" | "timeline_event" | "query" | "task";
    includeSubtechniques: boolean;
    minEvidence: number;
  };
  selection: {
    nodeId?: string;
    edgeId?: string;
    techniqueId?: string;
  };
};
```

## Initial Data Load

When the user opens the `Graph` tab:

1. fetch graph data with default filters
2. fetch MITRE matrix data lazily when the user switches to matrix view
3. fetch entity links only if you need raw manual link details separate from `graph.edges`

Recommended defaults:

```ts
graph.mode = "overview";
graph.includeDerived = true;
graph.includeManual = true;
graph.depth = "all";
graph.entityTypes = [];
graph.linkTypes = [];
graph.q = "";

matrix.includeSubtechniques = true;
matrix.minEvidence = 1;
matrix.q = "";
matrix.tactic = "";
matrix.entityType = "";
```

## Relationship Graph Rendering

### Data Mapping

Use the graph response directly:

- `nodes` becomes your render node list
- `edges` becomes your render edge list
- `stats` feeds badges, empty states, and summary chips

Recommended view-model expansion:

```ts
type RenderNode = IncidentGraphNode & {
  colorToken: string;
  icon: string;
};

type RenderEdge = IncidentGraphEdge & {
  strokeStyle: "solid" | "dashed";
  colorToken: string;
};
```

Map styling from `type` and `derived`:

- manual edges: orange solid
- derived edges: blue dashed
- MITRE technique/tactic nodes: dark orange emphasis

### Interaction Wiring

Single click on node:

- store selected node id
- open right inspector with the backend node payload

Double click on node:

- route to the existing entity detail modal flow by `node.type`

Single click on edge:

- store selected edge id
- open edge inspector

### Inspector Data

The inspector should trust backend fields:

- node `label`
- node `subtitle`
- node `status`
- node `severity`
- node `owner`
- node `mitreId`
- node `tactic`
- edge `type`
- edge `derived`
- edge `label`
- edge `sourceDescription`
- edge `metadata.linkId` for manual edge delete

Do not recalculate whether an edge is manual or derived in the client. Use `edge.derived`.

## Manual Link UI

### Create Link Flow

The most stable first implementation is modal-driven:

1. open source entity modal
2. click `+ Link Item`
3. choose target type
4. search target entity inside the current incident
5. choose link type
6. `POST /entity-links`
7. refetch graph
8. update modal linked items section

Payload:

```json
{
  "sourceType": "timeline_event",
  "sourceId": "uuid",
  "targetType": "finding",
  "targetId": "uuid",
  "linkType": "evidence_for"
}
```

### Delete Link Flow

Only show delete action when:

- `edge.derived === false`
- `edge.metadata.linkId` exists

Then:

1. call `DELETE /api/incidents/:incidentId/entity-links/:linkId`
2. refetch graph
3. refetch the affected detail view if it shows linked items

If the backend returns `403`, surface the message directly.

## MITRE Matrix Rendering

### Fetch

Call:

```txt
GET /api/incidents/:incidentId/mitre-matrix
```

Supported params:

- `includeSubtechniques`
- `minEvidence`
- `q`
- `tactic`
- `entityType`

### Render Model

Render tactics as columns and techniques as cards inside those columns.

For each tactic:

1. build a column from `response.tactics`
2. filter `response.techniques` by `technique.tacticId === tactic.id`
3. sort by `mitreId`

Technique card fields:

- `mitreId`
- `name`
- `counts.total`
- optional counts by type

Tooltip fields:

- `mitreId`
- `name`
- tactic name from the tactic lookup
- `counts.findings`
- `counts.timelineEvents`
- `counts.queries`
- `counts.tasks`
- `firstSeen`
- `lastSeen`

### Technique Selection

On click:

1. store `technique.id`
2. open inspector with full technique payload

Inspector should show:

- ID and name
- tactic name
- parent technique, if present
- evidence list
- action buttons

## “Filter Relationship Graph” Action

When the user clicks `Filter Relationship Graph` from the matrix inspector:

1. switch active view to `relationship_graph`
2. set graph mode to `"mitre"`
3. set graph search `q` to the selected technique `mitreId` or `name`
4. fetch graph with:

```txt
mode=mitre
includeDerived=true
includeManual=true
q=T1059.001
```

Optional refinement:

- also pin `entityTypes` to `mitre_technique,finding,timeline_event,query,task`

## Timeline Form Wiring

Update the timeline create/edit forms to support the new relationship fields.

Add these controls:

- `systemId`
- `accountId`

Use incident-scoped selectors populated from:

- `GET /api/incidents/:incidentId/systems`
- `GET /api/incidents/:incidentId/accounts`

Recommended UX:

- searchable select for system
- searchable select for account
- allow empty values

POST/PATCH payload example:

```json
{
  "title": "Word spawned powershell.exe",
  "eventTime": "2026-05-18T10:42:00.000Z",
  "source": "EDR",
  "systemId": "system-uuid",
  "accountId": "account-uuid"
}
```

If the backend returns:

```txt
Timeline event system must belong to the same incident
Timeline event account must belong to the same incident
```

show the message inline near the field and keep the form open.

## Query Detail Wiring

Query detail should gain a MITRE mapping section.

Required behavior:

1. load current query tag mappings from `GET /queries/:queryId/tags`
2. let the user search ATT&CK tags from the global ATT&CK list
3. attach selected technique with `POST /queries/:queryId/attack-tags`
4. refresh the query detail and matrix view

Suggested layout:

```txt
MITRE Mapping
[search technique]
[selected techniques chips]

Detected Techniques
- T1059.001 PowerShell
- T1071 Application Layer Protocol
```

## Cache and Refetch Strategy

Graph data is derived from many incident entities, so optimistic local patching will become fragile quickly.

Use refetch after mutations for the first pass:

- after attach ATT&CK tag to finding
- after attach ATT&CK tag to timeline event
- after attach ATT&CK tag to query
- after create/delete manual entity link
- after create/update timeline event with `systemId` or `accountId`
- after create/delete task link

Recommended minimal refresh:

- refetch active graph view if graph tab is open
- refetch matrix if matrix view is open and the mutation can affect MITRE
- refetch source detail modal if open

## Error Handling

The frontend should surface backend messages directly for:

- duplicate entity links
- missing permissions
- cross-incident relationship violations
- missing referenced entities
- validation failures

Validation errors still come back as:

```json
{
  "error": "Validation failed",
  "details": { "...": "..." }
}
```

Permission examples:

- `Missing permission: entity_link:create`
- `Missing permission: graph:read`
- `Missing permission: mitre_matrix:read`

## Suggested Delivery Order

Implement in this order:

1. timeline form support for `systemId` and `accountId`
2. graph API client and types
3. Relationship Graph view with read-only rendering
4. MITRE Matrix view with read-only rendering
5. node/edge inspector
6. manual entity link creation and deletion
7. matrix-to-graph filter handoff
8. query MITRE mapping UI

This keeps each step testable and avoids coupling all graph behavior into one large merge.

## Verification Checklist

The frontend should verify at least:

### Timeline Relationship

1. create a system
2. create an account
3. create a timeline event with both selected
4. open graph
5. confirm `observed_on` edge appears to the system
6. confirm `used_account` edge appears to the account

### Manual Link

1. create finding
2. create timeline event
3. add manual `evidence_for` link
4. confirm edge exists
5. delete edge
6. confirm edge disappears

### Query MITRE Mapping

1. create query
2. attach `T1059.001`
3. open matrix
4. confirm `Execution` column contains `T1059.001`
5. confirm query evidence count increases

### Matrix Drilldown

1. click technique block
2. confirm evidence list shows linked entities
3. click `Filter Relationship Graph`
4. confirm relationship graph opens filtered MITRE neighborhood
