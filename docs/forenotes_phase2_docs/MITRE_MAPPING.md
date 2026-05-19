# Phase 2 Add-on: Incident Graph Workspace

## Goal

Add a Graph workspace to the Incident view that helps analysts understand relationships between findings, timeline events, tasks, assets, IOCs, queries, and MITRE ATT&CK mappings.

The Graph workspace should have two views:

```txt
Graph
├── Relationship Graph
└── MITRE Matrix
````

## Why

The current incident workspace is table/detail oriented. That is good for editing records, but weak for understanding relationships.

The graph should help answer:

* Which findings are supported by which timeline events?
* Which systems, accounts, and IOCs are involved?
* Which tasks are investigating which evidence?
* Which MITRE techniques are mapped in this incident?
* Which ATT&CK tactics are represented?
* Which queries detect which techniques?
* What evidence supports each MITRE mapping?

## View 1: Relationship Graph

The Relationship Graph is an interactive node/edge map.

It should show incident entities as nodes and relationships as edges.

### Node Types

```ts
type GraphNodeType =
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
```

### Edge Types

```ts
type GraphEdgeType =
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
```

### Example Relationship Graph

```txt
Timeline Event: Word spawned PowerShell
  └── evidence_for
      └── Finding: Suspicious PowerShell Execution
            └── maps_to
                └── MITRE Technique: T1059.001 PowerShell
                      └── belongs_to_tactic
                          └── MITRE Tactic: Execution

Finding: Cobalt Strike Beacon
  ├── contains_ioc
  │   └── IOC: 185.199.108.153
  └── maps_to
      └── MITRE Technique: T1071 Application Layer Protocol

Task: Investigate WIN-042
  └── investigates
      └── Finding: Suspicious PowerShell Execution
```

### Required UI

Layout:

```txt
---------------------------------------------------------
Graph Toolbar
[Relationship Graph] [MITRE Matrix]
Search...
Entity Type filter
Relationship filter
MITRE Tactic filter
Depth filter
[Manual Links] [Derived Links]

---------------------------------------------------------
Relationship Graph Canvas

---------------------------------------------------------
Right Inspector
Selected node / selected edge details
```

Node behavior:

* Click node opens right inspector.
* Double-click node opens the entity detail popup.
* Hover node highlights direct neighbors.
* Click `Filter to Neighbors` shows 1-hop or 2-hop neighborhood.
* Context action allows `Link Item`.

Edge behavior:

* Click edge opens edge details.
* Manual edges can be removed if the user has permission.
* Derived edges are read-only.
* Derived edge inspector should explain the source, for example:

  * `Derived from finding.mitreTechniqueIds`
  * `Derived from task.linkedEntityId`
  * `Derived from timeline.systemId`
  * `Derived from query.mitreTechniqueIds`

### Visual Design

Use the Phase 2 visual language:

* Dark canvas
* Thin grid background
* Sparse orange/blue accents
* Small, readable node cards
* Manual edges as orange solid lines
* Derived edges as blue dashed lines
* Right-side inspector panel

Recommended node styling:

```txt
Finding          orange border
Timeline Event   blue border
Task             yellow border
System/Account   green border
IOC              red border
Query            purple border
MITRE Technique  orange filled/dark orange card
MITRE Tactic     dark orange card
```

## View 2: MITRE Matrix

The MITRE Matrix is an ATT&CK-style matrix heatmap.

This is not a node-link graph. It should look like an ATT&CK matrix:

```txt
Initial Access | Execution | Persistence | Privilege Escalation | Defense Evasion | Credential Access | Discovery | Lateral Movement | Command and Control | Collection
```

Each tactic is a column. Each mapped technique/sub-technique is a block inside that tactic column.

### Technique Block

Each block should show:

```txt
T1059.001
PowerShell
3 evidence
```

Hover tooltip should show:

```txt
T1059.001 PowerShell

Tactic: Execution
Findings: 1
Timeline Events: 1
Queries: 1
Tasks: 0
First Seen: 2026-05-18 10:42
Last Seen: 2026-05-18 13:20
```

Clicking a block opens the right inspector.

### MITRE Matrix Inspector

When selecting a technique, show:

```txt
Selected Technique
------------------------------------------------
T1059.001 PowerShell
Execution · Sub-technique of T1059

Evidence
------------------------------------------------
Finding: Suspicious PowerShell Execution
Timeline Event: Word spawned powershell.exe on WIN-042
Query: PowerShell Process Tree

Actions
------------------------------------------------
[Filter Relationship Graph]
[Create Task From Technique]
[Open MITRE Details]
```

### Matrix Filters

Minimum filters:

```txt
Search technique, ID, evidence...
Tactic filter
Evidence type filter
Show sub-techniques
Mapped only
```

Optional later:

```txt
Severity
Owner
Status
First seen / last seen
Minimum evidence count
```
Recommended production approach:

```txt
MITRE Matrix       = CSS Grid
Relationship Graph = React Flow or custom SVG/canvas graph
```

For Phase 2, a custom React/SVG implementation is acceptable if the graph is small and controlled. React Flow is preferred if we expect more advanced graph features later.

## Manual Links

Add manual incident-scoped entity links.

### Data Model

```ts
type EntityLink = {
  id: string;
  incidentId: string;

  sourceType: GraphNodeType;
  sourceId: string;

  targetType: GraphNodeType;
  targetId: string;

  linkType: GraphEdgeType;

  createdBy: string;
  createdAt: string;
};
```

### Rules

* Links are scoped to one incident.
* Source and target must belong to the same incident.
* MITRE techniques/tactics can be global reference entities.
* Non-MITRE source/target entities must be incident-local.
* User must be an incident member.
* User must have permission to create/delete links.
* Prevent duplicate `sourceType + sourceId + targetType + targetId + linkType`.
* Deleting an entity should remove or invalidate related manual links safely.
* Cross-incident links are not allowed.

## Derived Links

Derived links should be generated by the backend graph builder, not stored as manual links.

Examples:

```txt
Finding -> MITRE Technique
Derived from finding.mitreTechniqueIds

Query -> MITRE Technique
Derived from query.mitreTechniqueIds

MITRE Technique -> MITRE Tactic
Derived from MITRE reference data

MITRE Sub-technique -> Parent Technique
Derived from MITRE reference data

Timeline Event -> System
Derived from timeline.systemId

Timeline Event -> Account
Derived from timeline.accountId

Finding -> Tag
Derived from finding.tags

Timeline Event -> Tag
Derived from timeline.tags

Task -> Finding
Derived from task.linkedEntity

Task -> Assignee
Derived from task.ownerId
```

## API Requirements

### Entity Links

```txt
GET    /api/incidents/:incidentId/entity-links
POST   /api/incidents/:incidentId/entity-links
DELETE /api/incidents/:incidentId/entity-links/:linkId
```

### Relationship Graph

```txt
GET /api/incidents/:incidentId/graph
```

Supported query params:

```txt
mode=overview|investigation|timeline|assets|tasks|mitre
entityTypes=finding,timeline_event,mitre_technique
linkTypes=maps_to,evidence_for,contains_ioc
includeDerived=true|false
includeManual=true|false
depth=1|2|3|all
q=searchText
```

Response shape:

```ts
type IncidentGraphResponse = {
  incidentId: string;
  mode: "overview" | "investigation" | "timeline" | "assets" | "tasks" | "mitre";

  nodes: Array<{
    id: string;
    type: GraphNodeType;
    entityId: string;
    label: string;

    subtitle?: string;
    status?: string;
    severity?: string;
    owner?: string;
    mitreId?: string;
    tactic?: string;

    counts?: {
      findings?: number;
      timelineEvents?: number;
      tasks?: number;
      linkedItems?: number;
    };

    metadata?: Record<string, unknown>;
  }>;

  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: GraphEdgeType;
    label: string;

    derived: boolean;
    confidence?: "low" | "medium" | "high";
    sourceDescription?: string;
    metadata?: Record<string, unknown>;
  }>;

  stats: {
    totalNodes: number;
    totalEdges: number;
    findings: number;
    timelineEvents: number;
    tasks: number;
    mitreTechniques: number;
    mitreTactics: number;
    systems: number;
    accounts: number;
    iocs: number;
    manualLinks: number;
    derivedLinks: number;
  };
};
```

### MITRE Matrix

```txt
GET /api/incidents/:incidentId/mitre-matrix
```

Supported query params:

```txt
includeSubtechniques=true|false
minEvidence=1
q=powershell
tactic=execution
entityType=finding|timeline_event|query|task
```

Response shape:

```ts
type MitreMatrixResponse = {
  incidentId: string;

  tactics: Array<{
    id: string;
    mitreId: string;
    name: string;
    order: number;
  }>;

  techniques: Array<{
    id: string;
    mitreId: string;
    name: string;
    tacticId: string;
    parentTechniqueId?: string;

    counts: {
      findings: number;
      timelineEvents: number;
      queries: number;
      tasks: number;
      total: number;
    };

    evidence: Array<{
      entityType: "finding" | "timeline_event" | "query" | "task";
      entityId: string;
      title: string;
    }>;

    firstSeen?: string;
    lastSeen?: string;
  }>;
};
```

## Frontend Requirements

Add a `Graph` tab inside Incident Workspace.

```txt
Incident Workspace
├── Overview
├── Findings
├── Timeline
├── Tasks
├── Queries
├── Systems
├── Accounts
└── Graph
```

Inside `Graph`, add view switch:

```txt
[Relationship Graph] [MITRE Matrix]
```

### Relationship Graph Frontend

Required:

* Render nodes and edges.
* Support search.
* Support entity type filter.
* Support relationship type filter.
* Support manual/derived toggle.
* Support click node -> inspector.
* Support click edge -> inspector.
* Support double-click node -> open entity popup.
* Support remove manual link.
* Support empty state.

Empty state:

```txt
No graph relationships yet.
Add findings, timeline events, MITRE mappings, or manual links to build the incident graph.
```

### MITRE Matrix Frontend

Required:

* Render tactics as CSS grid columns.
* Render mapped techniques as orange blocks.
* Render sub-techniques indented under parent techniques.
* Support search.
* Support tactic filter.
* Support evidence type filter.
* Support show/hide sub-techniques.
* Support mapped-only view.
* Support click technique -> inspector.
* Support `Filter Relationship Graph` action.

Empty state:

```txt
No MITRE mappings yet.
Map findings or queries to ATT&CK techniques to see the MITRE matrix.
```

## Entity Detail Popup Integration

Finding detail popup should show:

```txt
Linked Items
MITRE Mapping
Related Timeline Events
Related Tasks
Related IOCs
Related Systems/Accounts
```

Timeline Event popup should show:

```txt
Linked Items
Related Findings
System
Account
IOCs
MITRE Mapping, if supported
```

Task popup should show:

```txt
Linked Items
Investigates
References
Assignee
```

Query detail popup should show:

```txt
MITRE Mapping
Detected Techniques
Related Findings, if manually linked
```

## Permissions

Add or verify permissions:

```txt
entity_link:read
entity_link:create
entity_link:delete
graph:read
mitre_matrix:read
```

Suggested behavior:

* All incident members can read graph/matrix.
* Analysts and response leads can create manual links.
* Link creator, response lead, or commander can delete links.
* Derived links cannot be deleted directly.

## Agent-Browser Testing Criteria

Agent-browser must verify the graph by clicking through the UI. API tests alone are not enough.

### Workflow A: Manual Link + Relationship Graph

1. Open an incident.
2. Create or select one Finding.
3. Create or select one Timeline Event.
4. Open the Finding detail popup.
5. Click `+ Link Item`.
6. Select target type `Timeline Event`.
7. Search and select the Timeline Event.
8. Choose link type `evidence_for`.
9. Save.
10. Confirm the linked Timeline Event appears in the Finding popup.
11. Open the Timeline Event popup.
12. Confirm the Finding appears as a linked item.
13. Open the Graph tab.
14. Click `Relationship Graph`.
15. Confirm both nodes appear.
16. Confirm an edge appears between them with label `evidence_for`.
17. Click the Finding node.
18. Confirm the right inspector shows Finding details.
19. Double-click the Finding node.
20. Confirm the Finding detail popup opens.
21. Remove the manual link.
22. Confirm the edge disappears from the graph.
23. Confirm the linked item disappears from both entity popups.

### Workflow B: MITRE Matrix

1. Open an incident.
2. Create or select a Finding.
3. Map the Finding to `T1059.001 PowerShell`.
4. Create or select a Query.
5. Map the Query to `T1059.001 PowerShell`.
6. Open the Graph tab.
7. Click `MITRE Matrix`.
8. Confirm tactic column `Execution` appears.
9. Confirm technique block `T1059.001 PowerShell` appears under `Execution`.
10. Confirm the block shows evidence count `2`.
11. Click the technique block.
12. Confirm right inspector shows:

    * `T1059.001`
    * `PowerShell`
    * `Execution`
    * linked Finding
    * linked Query
13. Use search for `PowerShell`.
14. Confirm only matching technique blocks remain visible.
15. Toggle `Show sub-techniques` off.
16. Confirm `T1059.001` is hidden or rolled into parent `T1059`.
17. Toggle back on.
18. Confirm `T1059.001` appears again.
19. Click `Filter Relationship Graph`.
20. Confirm Relationship Graph opens focused on the technique and its linked evidence.

### Workflow C: Derived Link Toggle

1. Open the Graph tab.
2. Click `Relationship Graph`.
3. Confirm MITRE-derived edges are visible.
4. Toggle `Show derived links` off.
5. Confirm MITRE-derived edges disappear.
6. Confirm manual edges remain visible.
7. Toggle `Show derived links` on.
8. Confirm MITRE-derived edges return.

Failure condition:

```txt
If any expected output does not match, continue fixing until agent-browser can complete the workflow successfully.
```

## Implementation Notes

Recommended file split:

```txt
src/client/features/graph/
├── GraphWorkspace.tsx
├── RelationshipGraphView.tsx
├── MitreMatrixView.tsx
├── GraphToolbar.tsx
├── GraphInspector.tsx
├── graphTypes.ts
├── graphApi.ts
└── graphLayout.ts
```

Recommended server split:

```txt
src/server/graph/
├── graphRoutes.ts
├── graphBuilder.ts
├── mitreMatrixBuilder.ts
├── entityLinksRepository.ts
└── graphTypes.ts
```

Keep graph-specific styles separate from the main stylesheet.

Suggested CSS split:

```txt
src/client/styles/graph.css
```

## Suggested Commit Message

```txt
feat: add incident graph and MITRE matrix plan
```

```

