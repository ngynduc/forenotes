import type { GraphEdgeType, GraphMode, GraphNodeType } from "../../shared/domain.js";
import type { Database } from "../db/types.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "../services/authService.js";
import type { GraphQueryInput, IncidentGraphEdge, IncidentGraphNode, IncidentGraphResponse } from "./graphTypes.js";

type BaseEntity = {
  id: string;
  incident_id?: string;
  created_at?: string;
  updated_at?: string;
};

type AttackTagRow = BaseEntity & {
  attack_id: string;
  name: string;
  type: string;
  parent_attack_id: string | null;
  tactic: string | null;
  external_url: string | null;
};

const MODE_ENTITY_TYPES: Record<GraphMode, GraphNodeType[] | null> = {
  overview: null,
  investigation: ["finding", "timeline_event", "task", "ioc", "query", "mitre_technique", "mitre_tactic", "user"],
  timeline: ["timeline_event", "finding", "system", "account", "ioc", "mitre_technique", "mitre_tactic", "tag"],
  assets: ["system", "account", "ioc", "finding", "timeline_event", "task", "tag"],
  tasks: ["task", "finding", "timeline_event", "query", "user", "mitre_technique", "mitre_tactic"],
  mitre: ["mitre_technique", "mitre_tactic", "finding", "timeline_event", "query", "task"]
};

function makeNodeId(type: GraphNodeType, entityId: string) {
  return `${type}:${entityId}`;
}

function makeEdgeId(source: string, target: string, type: GraphEdgeType, suffix: string) {
  return `${source}->${target}:${type}:${suffix}`;
}

function pushEdge(
  edges: IncidentGraphEdge[],
  dedupe: Set<string>,
  edge: Omit<IncidentGraphEdge, "id"> & { dedupeKey?: string }
) {
  const dedupeKey = edge.dedupeKey ?? `${edge.source}|${edge.target}|${edge.type}|${edge.derived ? "derived" : "manual"}`;
  if (dedupe.has(dedupeKey)) {
    return;
  }

  dedupe.add(dedupeKey);
  edges.push({
    ...edge,
    id: makeEdgeId(edge.source, edge.target, edge.type, dedupeKey)
  });
}

function inferParentAttackId(attackId: string) {
  const dotIndex = attackId.indexOf(".");
  return dotIndex > 0 ? attackId.slice(0, dotIndex) : null;
}

function textMatches(node: IncidentGraphNode, q: string) {
  const haystacks = [
    node.label,
    node.subtitle,
    node.status,
    node.severity,
    node.owner,
    node.mitreId,
    node.tactic,
    ...(node.metadata ? Object.values(node.metadata).map((value) => String(value)) : [])
  ];

  return haystacks.some((value) => value?.toLowerCase().includes(q));
}

function getUserDisplayName(user: { id?: string; display_name?: string | null; email?: string | null } | undefined) {
  return user?.display_name ?? user?.email ?? user?.id ?? undefined;
}

function applyDepthFilter(nodes: IncidentGraphNode[], edges: IncidentGraphEdge[], q: string | undefined, depth: GraphQueryInput["depth"]) {
  if (!q || !depth || depth === "all") {
    return { nodes, edges };
  }

  const normalizedQuery = q.toLowerCase();
  const anchors = new Set(nodes.filter((node) => textMatches(node, normalizedQuery)).map((node) => node.id));
  if (anchors.size === 0) {
    return { nodes: [], edges: [] };
  }

  const maxDepth = Number(depth);
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    adjacency.set(edge.source, (adjacency.get(edge.source) ?? new Set()).add(edge.target));
    adjacency.set(edge.target, (adjacency.get(edge.target) ?? new Set()).add(edge.source));
  }

  const visited = new Map<string, number>();
  const queue = [...anchors].map((nodeId) => ({ nodeId, distance: 0 }));
  for (const anchor of anchors) {
    visited.set(anchor, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.distance >= maxDepth) {
      continue;
    }

    for (const neighbor of adjacency.get(current.nodeId) ?? []) {
      const nextDistance = current.distance + 1;
      const best = visited.get(neighbor);
      if (best !== undefined && best <= nextDistance) {
        continue;
      }
      visited.set(neighbor, nextDistance);
      queue.push({ nodeId: neighbor, distance: nextDistance });
    }
  }

  const allowedNodes = new Set(visited.keys());
  return {
    nodes: nodes.filter((node) => allowedNodes.has(node.id)),
    edges: edges.filter((edge) => allowedNodes.has(edge.source) && allowedNodes.has(edge.target))
  };
}

function removeIsolatedNodes(nodes: IncidentGraphNode[], edges: IncidentGraphEdge[]) {
  if (edges.length === 0) {
    return { nodes: [], edges: [] };
  }

  const linkedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  return {
    nodes: nodes.filter((node) => linkedNodeIds.has(node.id)),
    edges
  };
}

export async function buildIncidentGraph(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: GraphQueryInput
): Promise<IncidentGraphResponse> {
  await requireIncidentMembership(database, user.id, incidentId);
  await requirePermission(database, user, "graph:read");

  const mode = input.mode ?? "overview";

  const [
    incidentResult,
    findingsResult,
    timelineResult,
    systemsResult,
    accountsResult,
    indicatorsResult,
    tasksResult,
    taskLinksResult,
    queriesResult,
    usersResult,
    evidenceLinksResult,
    findingAttackTagsResult,
    timelineAttackTagsResult,
    queryAttackTagsResult,
    findingCustomTagsResult,
    timelineCustomTagsResult,
    attackTagsResult,
    customTagsResult,
    entityLinksResult
  ] = await Promise.all([
    database.query<{ case_id: string }>("select case_id from incidents where id = $1", [incidentId]),
    database.query("select * from findings where incident_id = $1", [incidentId]),
    database.query("select * from timeline_events where incident_id = $1", [incidentId]),
    database.query("select * from systems where incident_id = $1", [incidentId]),
    database.query("select * from accounts where incident_id = $1", [incidentId]),
    database.query("select * from indicators where incident_id = $1", [incidentId]),
    database.query("select * from tasks where incident_id = $1", [incidentId]),
    database.query("select * from task_links where incident_id = $1", [incidentId]),
    database.query("select * from queries where incident_id = $1", [incidentId]),
    database.query(
      `
        select u.id, u.display_name, u.global_role
        from incident_members im
        inner join users u on u.id = im.user_id
        where im.incident_id = $1
      `,
      [incidentId]
    ),
    database.query("select * from finding_evidence_links where incident_id = $1", [incidentId]),
    database.query(
      `
        select fat.finding_id, at.*
        from finding_attack_tags fat
        inner join attack_tags at on at.id = fat.attack_tag_id
        where fat.incident_id = $1
      `,
      [incidentId]
    ),
    database.query(
      `
        select teat.timeline_event_id, at.*
        from timeline_event_attack_tags teat
        inner join attack_tags at on at.id = teat.attack_tag_id
        where teat.incident_id = $1
      `,
      [incidentId]
    ),
    database.query(
      `
        select qat.query_id, at.*
        from query_attack_tags qat
        inner join attack_tags at on at.id = qat.attack_tag_id
        where qat.incident_id = $1
      `,
      [incidentId]
    ),
    database.query(
      `
        select fct.finding_id, ct.id, ct.name, ct.color
        from finding_custom_tags fct
        inner join custom_tags ct on ct.id = fct.custom_tag_id
        where fct.incident_id = $1
      `,
      [incidentId]
    ),
    database.query(
      `
        select tect.timeline_event_id, ct.id, ct.name, ct.color
        from timeline_event_custom_tags tect
        inner join custom_tags ct on ct.id = tect.custom_tag_id
        where tect.incident_id = $1
      `,
      [incidentId]
    ),
    database.query("select * from attack_tags"),
    database.query(
      `
        select ct.*
        from custom_tags ct
        inner join incidents i on i.case_id = ct.case_id
        where i.id = $1
      `,
      [incidentId]
    ),
    database.query("select * from incident_entity_links where incident_id = $1", [incidentId])
  ]);

  if (incidentResult.rowCount === 0) {
    return {
      incidentId,
      mode,
      nodes: [],
      edges: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        findings: 0,
        timelineEvents: 0,
        tasks: 0,
        mitreTechniques: 0,
        mitreTactics: 0,
        systems: 0,
        accounts: 0,
        iocs: 0,
        manualLinks: 0,
        derivedLinks: 0
      }
    };
  }

  const attackTags = new Map<string, AttackTagRow>(attackTagsResult.rows.map((row) => [row.id, row as AttackTagRow]));
  const attackTagsByAttackId = new Map<string, AttackTagRow>([...attackTags.values()].map((row) => [row.attack_id, row]));
  const customTags = new Map(customTagsResult.rows.map((row) => [row.id, row]));
  const findingById = new Map(findingsResult.rows.map((row) => [row.id, row]));
  const timelineById = new Map(timelineResult.rows.map((row) => [row.id, row]));
  const systemById = new Map(systemsResult.rows.map((row) => [row.id, row]));
  const accountById = new Map(accountsResult.rows.map((row) => [row.id, row]));
  const indicatorById = new Map(indicatorsResult.rows.map((row) => [row.id, row]));
  const taskById = new Map(tasksResult.rows.map((row) => [row.id, row]));
  const queryById = new Map(queriesResult.rows.map((row) => [row.id, row]));
  const userById = new Map(usersResult.rows.map((row) => [row.id, row]));

  const nodes = new Map<string, IncidentGraphNode>();
  const edges: IncidentGraphEdge[] = [];
  const edgeDedupe = new Set<string>();

  const addNode = (node: IncidentGraphNode) => {
    nodes.set(node.id, node);
  };

  for (const row of findingsResult.rows) {
    addNode({
      id: makeNodeId("finding", row.id),
      type: "finding",
      entityId: row.id,
      label: row.title,
      subtitle: row.description ?? undefined,
      status: row.status,
      severity: row.severity ?? undefined,
      owner: getUserDisplayName(userById.get(row.owner_user_id)),
      metadata: {
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined
      }
    });

    if (row.owner_user_id && userById.has(row.owner_user_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("finding", row.id),
        target: makeNodeId("user", row.owner_user_id),
        type: "assigned_to",
        label: "assigned_to",
        derived: true,
        sourceDescription: "Derived from finding.ownerUserId"
      });
    }
  }

  for (const row of timelineResult.rows) {
    addNode({
      id: makeNodeId("timeline_event", row.id),
      type: "timeline_event",
      entityId: row.id,
      label: row.title,
      subtitle: row.source ?? undefined,
      owner: getUserDisplayName(userById.get(row.owner_user_id)),
      metadata: {
        eventTime: row.event_time,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined
      }
    });

    if (row.owner_user_id && userById.has(row.owner_user_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("timeline_event", row.id),
        target: makeNodeId("user", row.owner_user_id),
        type: "assigned_to",
        label: "assigned_to",
        derived: true,
        sourceDescription: "Derived from timeline.ownerUserId"
      });
    }

    if (row.system_id && systemById.has(row.system_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("timeline_event", row.id),
        target: makeNodeId("system", row.system_id),
        type: "observed_on",
        label: "observed_on",
        derived: true,
        sourceDescription: "Derived from timeline.systemId"
      });
    }

    if (row.account_id && accountById.has(row.account_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("timeline_event", row.id),
        target: makeNodeId("account", row.account_id),
        type: "used_account",
        label: "used_account",
        derived: true,
        sourceDescription: "Derived from timeline.accountId"
      });
    }
  }

  for (const row of systemsResult.rows) {
    addNode({
      id: makeNodeId("system", row.id),
      type: "system",
      entityId: row.id,
      label: row.hostname,
      subtitle: row.ip_address ?? undefined,
      metadata: {
        os: row.os ?? undefined
      }
    });
  }

  for (const row of accountsResult.rows) {
    addNode({
      id: makeNodeId("account", row.id),
      type: "account",
      entityId: row.id,
      label: row.username,
      subtitle: row.domain ?? undefined,
      metadata: {
        status: row.status ?? undefined
      }
    });
  }

  for (const row of indicatorsResult.rows) {
    addNode({
      id: makeNodeId("ioc", row.id),
      type: "ioc",
      entityId: row.id,
      label: row.value,
      subtitle: row.indicator_type,
      metadata: {
        confidence: row.confidence ?? undefined
      }
    });
  }

  for (const row of tasksResult.rows) {
    addNode({
      id: makeNodeId("task", row.id),
      type: "task",
      entityId: row.id,
      label: row.title,
      subtitle: row.description ?? undefined,
      status: row.status,
      severity: row.priority ?? undefined,
      owner: getUserDisplayName(userById.get(row.assignee_user_id ?? row.owner_user_id)),
    });

    if (row.assignee_user_id && userById.has(row.assignee_user_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("task", row.id),
        target: makeNodeId("user", row.assignee_user_id),
        type: "assigned_to",
        label: "assigned_to",
        derived: true,
        sourceDescription: "Derived from task.assigneeUserId"
      });
    }
  }

  for (const row of queriesResult.rows) {
    addNode({
      id: makeNodeId("query", row.id),
      type: "query",
      entityId: row.id,
      label: row.name,
      subtitle: row.language,
      owner: getUserDisplayName(userById.get(row.owner_user_id))
    });
  }

  for (const row of usersResult.rows) {
    addNode({
      id: makeNodeId("user", row.id),
      type: "user",
      entityId: row.id,
      label: row.display_name,
      subtitle: row.global_role
    });
  }

  for (const row of customTags.values()) {
    addNode({
      id: makeNodeId("tag", row.id),
      type: "tag",
      entityId: row.id,
      label: row.name,
      subtitle: row.color ?? undefined
    });
  }

  const addAttackNode = (row: AttackTagRow) => {
    const type = row.type === "tactic" ? "mitre_tactic" : "mitre_technique";
    addNode({
      id: makeNodeId(type, row.id),
      type,
      entityId: row.id,
      label: row.name,
      subtitle: row.attack_id,
      mitreId: row.attack_id,
      tactic: row.tactic ?? undefined,
      metadata: {
        type: row.type,
        externalUrl: row.external_url ?? undefined
      }
    });
  };

  for (const row of findingAttackTagsResult.rows) {
    addAttackNode(row as AttackTagRow);
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("finding", row.finding_id),
      target: makeNodeId("mitre_technique", row.id),
      type: "maps_to",
      label: "maps_to",
      derived: true,
      sourceDescription: "Derived from finding attack tags"
    });
  }

  for (const row of timelineAttackTagsResult.rows) {
    addAttackNode(row as AttackTagRow);
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("timeline_event", row.timeline_event_id),
      target: makeNodeId("mitre_technique", row.id),
      type: "maps_to",
      label: "maps_to",
      derived: true,
      sourceDescription: "Derived from timeline event attack tags"
    });
  }

  for (const row of queryAttackTagsResult.rows) {
    addAttackNode(row as AttackTagRow);
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("query", row.query_id),
      target: makeNodeId("mitre_technique", row.id),
      type: "detects",
      label: "detects",
      derived: true,
      sourceDescription: "Derived from query attack tags"
    });
  }

  for (const row of attackTags.values()) {
    if (row.type !== "technique") {
      continue;
    }

    const tacticRow = row.tactic ? attackTagsByAttackId.get(row.tactic.startsWith("TA") ? row.tactic : "") : undefined;
    const tacticByName = row.tactic
      ? [...attackTags.values()].find((candidate) => candidate.type === "tactic" && candidate.name.toLowerCase() === row.tactic?.toLowerCase())
      : undefined;
    const tactic = tacticRow ?? tacticByName;
    if (tactic) {
      addAttackNode(tactic);
      if (nodes.has(makeNodeId("mitre_technique", row.id))) {
        pushEdge(edges, edgeDedupe, {
          source: makeNodeId("mitre_technique", row.id),
          target: makeNodeId("mitre_tactic", tactic.id),
          type: "belongs_to_tactic",
          label: "belongs_to_tactic",
          derived: true,
          sourceDescription: "Derived from MITRE reference data"
        });
      }
    }

    const parentAttackId = row.parent_attack_id ?? inferParentAttackId(row.attack_id);
    if (!parentAttackId) {
      continue;
    }

    const parent = attackTagsByAttackId.get(parentAttackId);
    if (!parent) {
      continue;
    }

    addAttackNode(parent);
    if (nodes.has(makeNodeId("mitre_technique", row.id))) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("mitre_technique", row.id),
        target: makeNodeId("mitre_technique", parent.id),
        type: "subtechnique_of",
        label: "subtechnique_of",
        derived: true,
        sourceDescription: "Derived from MITRE reference data"
      });
    }
  }

  for (const row of findingCustomTagsResult.rows) {
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("finding", row.finding_id),
      target: makeNodeId("tag", row.id),
      type: "has_tag",
      label: "has_tag",
      derived: true,
      sourceDescription: "Derived from finding custom tags"
    });
  }

  for (const row of timelineCustomTagsResult.rows) {
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("timeline_event", row.timeline_event_id),
      target: makeNodeId("tag", row.id),
      type: "has_tag",
      label: "has_tag",
      derived: true,
      sourceDescription: "Derived from timeline event custom tags"
    });
  }

  const findingTechniqueIds = new Map<string, string[]>();
  for (const row of findingAttackTagsResult.rows) {
    const ids = findingTechniqueIds.get(row.finding_id) ?? [];
    ids.push(row.id);
    findingTechniqueIds.set(row.finding_id, ids);
  }
  const timelineTechniqueIds = new Map<string, string[]>();
  for (const row of timelineAttackTagsResult.rows) {
    const ids = timelineTechniqueIds.get(row.timeline_event_id) ?? [];
    ids.push(row.id);
    timelineTechniqueIds.set(row.timeline_event_id, ids);
  }
  const queryTechniqueIds = new Map<string, string[]>();
  for (const row of queryAttackTagsResult.rows) {
    const ids = queryTechniqueIds.get(row.query_id) ?? [];
    ids.push(row.id);
    queryTechniqueIds.set(row.query_id, ids);
  }

  for (const row of evidenceLinksResult.rows) {
    if (row.evidence_type === "indicator" && indicatorById.has(row.evidence_id)) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("finding", row.finding_id),
        target: makeNodeId("ioc", row.evidence_id),
        type: "contains_ioc",
        label: "contains_ioc",
        derived: true,
        sourceDescription: "Derived from finding evidence links"
      });
      continue;
    }

    const evidenceTypeMap: Record<string, GraphNodeType | undefined> = {
      timeline_event: "timeline_event",
      system: "system",
      account: "account",
      query: "query"
    };
    const sourceType = evidenceTypeMap[row.evidence_type];
    if (!sourceType) {
      continue;
    }
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId(sourceType, row.evidence_id),
      target: makeNodeId("finding", row.finding_id),
      type: "evidence_for",
      label: "evidence_for",
      derived: true,
      sourceDescription: "Derived from finding evidence links"
    });
  }

  for (const row of taskLinksResult.rows) {
    const entityTypeMap: Record<string, GraphNodeType | undefined> = {
      finding: "finding",
      timeline_event: "timeline_event",
      system: "system",
      account: "account",
      indicator: "ioc",
      query: "query"
    };
    const targetType = entityTypeMap[row.entity_type];
    if (!targetType) {
      continue;
    }

    const edgeType: GraphEdgeType = row.entity_type === "query" ? "references" : "investigates";
    pushEdge(edges, edgeDedupe, {
      source: makeNodeId("task", row.task_id),
      target: makeNodeId(targetType, row.entity_id),
      type: edgeType,
      label: edgeType,
      derived: true,
      sourceDescription: "Derived from task links"
    });

    const mappedTechniqueIds =
      (row.entity_type === "finding" ? findingTechniqueIds.get(row.entity_id) : undefined) ??
      (row.entity_type === "timeline_event" ? timelineTechniqueIds.get(row.entity_id) : undefined) ??
      (row.entity_type === "query" ? queryTechniqueIds.get(row.entity_id) : undefined) ??
      [];

    for (const techniqueId of mappedTechniqueIds) {
      pushEdge(edges, edgeDedupe, {
        source: makeNodeId("task", row.task_id),
        target: makeNodeId("mitre_technique", techniqueId),
        type: "investigates",
        label: "investigates",
        derived: true,
        sourceDescription: "Derived from task links and attached MITRE mappings"
      });
    }
  }

  if (input.includeManual) {
    for (const row of entityLinksResult.rows) {
      const source = makeNodeId(row.source_type, row.source_id);
      const target = makeNodeId(row.target_type, row.target_id);
      if (!nodes.has(source) || !nodes.has(target)) {
        continue;
      }

      pushEdge(edges, edgeDedupe, {
        source,
        target,
        type: row.link_type,
        label: row.link_type,
        derived: false,
        sourceDescription: "Manual entity link",
        metadata: {
          linkId: row.id,
          createdByUserId: row.created_by_user_id,
          createdAt: row.created_at
        }
      });
    }
  }

  // ATT&CK techniques are shown in the dedicated MITRE Matrix, not as nodes in
  // the relationship graph where they add noise without useful relationships.
  let filteredNodes = [...nodes.values()].filter((node) => node.type !== "mitre_technique");
  let filteredEdges = edges.filter((edge) => (input.includeDerived || !edge.derived) && (input.includeManual || edge.derived));

  const graphNodeIds = new Set(filteredNodes.map((node) => node.id));
  filteredEdges = filteredEdges.filter((edge) => graphNodeIds.has(edge.source) && graphNodeIds.has(edge.target));

  const allowedEntityTypes = new Set([
    ...(MODE_ENTITY_TYPES[mode] ?? filteredNodes.map((node) => node.type)),
    ...(input.entityTypes ?? [])
  ]);

  if (MODE_ENTITY_TYPES[mode] || input.entityTypes?.length) {
    const entityTypesToUse = input.entityTypes?.length ? new Set(input.entityTypes) : allowedEntityTypes;
    filteredNodes = filteredNodes.filter((node) => entityTypesToUse.has(node.type));
    const allowedNodeIds = new Set(filteredNodes.map((node) => node.id));
    filteredEdges = filteredEdges.filter((edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target));
  }

  if (input.linkTypes?.length) {
    const linkTypes = new Set(input.linkTypes);
    filteredEdges = filteredEdges.filter((edge) => linkTypes.has(edge.type));
  }

  if (input.q) {
    const normalizedQuery = input.q.toLowerCase();
    const matchingNodeIds = new Set(filteredNodes.filter((node) => textMatches(node, normalizedQuery)).map((node) => node.id));
    filteredEdges = filteredEdges.filter(
      (edge) =>
        matchingNodeIds.has(edge.source) ||
        matchingNodeIds.has(edge.target) ||
        edge.label.toLowerCase().includes(normalizedQuery) ||
        edge.sourceDescription?.toLowerCase().includes(normalizedQuery)
    );
    const linkedNodeIds = new Set(filteredEdges.flatMap((edge) => [edge.source, edge.target]));
    for (const nodeId of matchingNodeIds) {
      linkedNodeIds.add(nodeId);
    }
    filteredNodes = filteredNodes.filter((node) => linkedNodeIds.has(node.id));
  }

  const depthFiltered = applyDepthFilter(filteredNodes, filteredEdges, input.q, input.depth);
  filteredNodes = depthFiltered.nodes;
  filteredEdges = depthFiltered.edges;

  const survivingIds = new Set(filteredNodes.map((node) => node.id));
  filteredEdges = filteredEdges.filter((edge) => survivingIds.has(edge.source) && survivingIds.has(edge.target));

  const linkedGraph = removeIsolatedNodes(filteredNodes, filteredEdges);
  filteredNodes = linkedGraph.nodes;
  filteredEdges = linkedGraph.edges;

  const countByType = (type: GraphNodeType) => filteredNodes.filter((node) => node.type === type).length;

  return {
    incidentId,
    mode,
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalNodes: filteredNodes.length,
      totalEdges: filteredEdges.length,
      findings: countByType("finding"),
      timelineEvents: countByType("timeline_event"),
      tasks: countByType("task"),
      mitreTechniques: countByType("mitre_technique"),
      mitreTactics: countByType("mitre_tactic"),
      systems: countByType("system"),
      accounts: countByType("account"),
      iocs: countByType("ioc"),
      manualLinks: filteredEdges.filter((edge) => !edge.derived).length,
      derivedLinks: filteredEdges.filter((edge) => edge.derived).length
    }
  };
}
