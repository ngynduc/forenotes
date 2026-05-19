import type { Database } from "../db/types.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "../services/authService.js";
import type { MitreMatrixQueryInput, MitreMatrixResponse } from "./graphTypes.js";

type EvidenceRow = {
  attack_tag_id: string;
  attack_id: string;
  attack_name: string;
  parent_attack_id: string | null;
  tactic: string | null;
  entity_type: "finding" | "timeline_event" | "query" | "task";
  entity_id: string;
  title: string;
  observed_at: string | null;
};

type AttackTagReference = {
  id: string;
  attack_id: string;
  name: string;
  type: string;
  parent_attack_id: string | null;
  tactic: string | null;
};

type TechniqueGroup = {
  technique: AttackTagReference;
  evidence: Map<string, MitreMatrixResponse["techniques"][number]["evidence"][number]>;
  findings: Set<string>;
  timelineEvents: Set<string>;
  queries: Set<string>;
  tasks: Set<string>;
  firstSeen?: string;
  lastSeen?: string;
};

function inferParentAttackId(attackId: string) {
  const dotIndex = attackId.indexOf(".");
  return dotIndex > 0 ? attackId.slice(0, dotIndex) : null;
}

export async function buildMitreMatrix(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: MitreMatrixQueryInput
): Promise<MitreMatrixResponse> {
  await requireIncidentMembership(database, user.id, incidentId);
  await requirePermission(database, user, "mitre_matrix:read");

  const [attackTagsResult, directEvidenceResult, taskEvidenceResult] = await Promise.all([
    database.query<AttackTagReference>("select id, attack_id, name, type, parent_attack_id, tactic from attack_tags"),
    database.query<EvidenceRow>(
      `
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'finding' as entity_type, f.id as entity_id, f.title, f.created_at as observed_at
        from finding_attack_tags fat
        inner join attack_tags at on at.id = fat.attack_tag_id
        inner join findings f on f.id = fat.finding_id
        where fat.incident_id = $1
        union all
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'timeline_event' as entity_type, te.id as entity_id, te.title, te.event_time as observed_at
        from timeline_event_attack_tags teat
        inner join attack_tags at on at.id = teat.attack_tag_id
        inner join timeline_events te on te.id = teat.timeline_event_id
        where teat.incident_id = $1
        union all
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'query' as entity_type, q.id as entity_id, q.name as title, q.created_at as observed_at
        from query_attack_tags qat
        inner join attack_tags at on at.id = qat.attack_tag_id
        inner join queries q on q.id = qat.query_id
        where qat.incident_id = $1
      `,
      [incidentId]
    ),
    database.query<EvidenceRow>(
      `
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'task' as entity_type, t.id as entity_id, t.title, t.created_at as observed_at
        from task_links tl
        inner join tasks t on t.id = tl.task_id
        inner join finding_attack_tags fat on tl.entity_type = 'finding' and fat.finding_id = tl.entity_id and fat.incident_id = tl.incident_id
        inner join attack_tags at on at.id = fat.attack_tag_id
        where tl.incident_id = $1
        union all
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'task' as entity_type, t.id as entity_id, t.title, t.created_at as observed_at
        from task_links tl
        inner join tasks t on t.id = tl.task_id
        inner join timeline_event_attack_tags teat on tl.entity_type = 'timeline_event' and teat.timeline_event_id = tl.entity_id and teat.incident_id = tl.incident_id
        inner join attack_tags at on at.id = teat.attack_tag_id
        where tl.incident_id = $1
        union all
        select at.id as attack_tag_id, at.attack_id, at.name as attack_name, at.parent_attack_id, at.tactic,
               'task' as entity_type, t.id as entity_id, t.title, t.created_at as observed_at
        from task_links tl
        inner join tasks t on t.id = tl.task_id
        inner join query_attack_tags qat on tl.entity_type = 'query' and qat.query_id = tl.entity_id and qat.incident_id = tl.incident_id
        inner join attack_tags at on at.id = qat.attack_tag_id
        where tl.incident_id = $1
      `,
      [incidentId]
    )
  ]);

  const attackTagsById = new Map(attackTagsResult.rows.map((row) => [row.id, row]));
  const attackTagsByAttackId = new Map(attackTagsResult.rows.map((row) => [row.attack_id, row]));
  const tacticsByName = new Map(
    attackTagsResult.rows.filter((row) => row.type === "tactic").map((row) => [row.name.toLowerCase(), row])
  );

  const tacticOrder = [
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Collection",
    "Command and Control",
    "Exfiltration",
    "Impact"
  ];

  const filteredEvidence = [...directEvidenceResult.rows, ...taskEvidenceResult.rows]
    .filter((row) => (input.entityType ? row.entity_type === input.entityType : true))
    .filter((row) => {
      if (!input.tactic) {
        return true;
      }

      const normalized = input.tactic.toLowerCase();
      return row.tactic?.toLowerCase() === normalized || row.attack_id.toLowerCase() === normalized;
    })
    .filter((row) => {
      if (!input.q) {
        return true;
      }

      const normalized = input.q.toLowerCase();
      return (
        row.attack_id.toLowerCase().includes(normalized) ||
        row.attack_name.toLowerCase().includes(normalized) ||
        row.title.toLowerCase().includes(normalized) ||
        row.tactic?.toLowerCase().includes(normalized)
      );
    });

  const grouped = new Map<string, TechniqueGroup>();

  for (const row of filteredEvidence) {
    const sourceTechnique = attackTagsById.get(row.attack_tag_id);
    if (!sourceTechnique) {
      continue;
    }

    let technique = sourceTechnique;
    if (!input.includeSubtechniques) {
      const parentAttackId = sourceTechnique.parent_attack_id ?? inferParentAttackId(sourceTechnique.attack_id);
      const parent = parentAttackId ? attackTagsByAttackId.get(parentAttackId) : undefined;
      if (parent) {
        technique = parent;
      }
    }

    const group: TechniqueGroup = grouped.get(technique.id) ?? {
      technique,
      evidence: new Map(),
      findings: new Set<string>(),
      timelineEvents: new Set<string>(),
      queries: new Set<string>(),
      tasks: new Set<string>()
    };

    group.evidence.set(`${row.entity_type}:${row.entity_id}`, {
      entityType: row.entity_type,
      entityId: row.entity_id,
      title: row.title
    });

    if (row.entity_type === "finding") {
      group.findings.add(row.entity_id);
    } else if (row.entity_type === "timeline_event") {
      group.timelineEvents.add(row.entity_id);
    } else if (row.entity_type === "query") {
      group.queries.add(row.entity_id);
    } else if (row.entity_type === "task") {
      group.tasks.add(row.entity_id);
    }

    if (row.observed_at && (!group.firstSeen || row.observed_at < group.firstSeen)) {
      group.firstSeen = row.observed_at;
    }
    if (row.observed_at && (!group.lastSeen || row.observed_at > group.lastSeen)) {
      group.lastSeen = row.observed_at;
    }

    grouped.set(technique.id, group);
  }

  const techniques = [...grouped.values()]
    .map((group) => {
      const tactic =
        (group.technique.tactic ? tacticsByName.get(group.technique.tactic.toLowerCase()) : undefined) ??
        (group.technique.tactic ? attackTagsByAttackId.get(group.technique.tactic) : undefined);

      return {
        id: group.technique.id,
        mitreId: group.technique.attack_id,
        name: group.technique.name,
        tacticId: tactic?.id ?? group.technique.id,
        parentTechniqueId: group.technique.parent_attack_id
          ? attackTagsByAttackId.get(group.technique.parent_attack_id)?.id
          : undefined,
        counts: {
          findings: group.findings.size,
          timelineEvents: group.timelineEvents.size,
          queries: group.queries.size,
          tasks: group.tasks.size,
          total: group.evidence.size
        },
        evidence: [...group.evidence.values()],
        firstSeen: group.firstSeen,
        lastSeen: group.lastSeen
      };
    })
    .filter((technique) => technique.counts.total >= (input.minEvidence ?? 1))
    .sort((left, right) => left.mitreId.localeCompare(right.mitreId));

  const tacticIds = new Set(techniques.map((technique) => technique.tacticId));
  const tactics = attackTagsResult.rows
    .filter((row) => row.type === "tactic" && tacticIds.has(row.id))
    .map((row) => ({
      id: row.id,
      mitreId: row.attack_id,
      name: row.name,
      order: Math.max(tacticOrder.indexOf(row.name), 0)
    }))
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));

  return {
    incidentId,
    tactics,
    techniques
  };
}
