import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification, formatNotificationScope, getIncidentNotificationScope } from "./notificationService.js";

interface CreateFindingInput {
  incidentId: string;
  title: string;
  description?: string;
  severity?: string;
  status: string;
  confidence?: string;
  impact?: string;
  recommendation?: string;
  ownerUserId?: string;
}

interface FindingTimeFilter {
  field?: "createdAt" | "updatedAt";
  start?: string;
  end?: string;
  limit?: number;
}

export async function listFindings(
  database: Database,
  userId: string,
  incidentId: string,
  filter?: FindingTimeFilter
) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query(buildFindingListQuery(filter), buildFindingListParams(incidentId, filter));
  if (result.rows.length === 0) {
    return [];
  }
  const findingIds = result.rows.map((row) => row.id);
  const [attackTagsResult, customTagsResult] = await Promise.all([
    database.query<{ finding_id: string }>(
      `
        select fat.finding_id, at.id, at.attack_id, at.name, at.type, at.tactic
        from finding_attack_tags fat
        inner join attack_tags at on at.id = fat.attack_tag_id
        where fat.incident_id = $1 and fat.finding_id = any($2)
        order by at.attack_id asc
      `,
      [incidentId, findingIds]
    ),
    database.query<{ finding_id: string }>(
      `
        select fct.finding_id, ct.id, ct.name, ct.color
        from finding_custom_tags fct
        inner join custom_tags ct on ct.id = fct.custom_tag_id
        where fct.incident_id = $1 and fct.finding_id = any($2)
        order by ct.name asc
      `,
      [incidentId, findingIds]
    )
  ]);
  const attackTagsByFinding = groupRowsById(attackTagsResult.rows);
  const customTagsByFinding = groupRowsById(customTagsResult.rows);
  return result.rows.map((row) => ({
    ...row,
    attack_tags: attackTagsByFinding.get(row.id) ?? [],
    custom_tags: customTagsByFinding.get(row.id) ?? []
  }));
}

function groupRowsById(rows: Array<{ finding_id: string }>) {
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const values = { ...row } as Record<string, unknown>;
    delete values.finding_id;
    const entries = grouped.get(row.finding_id) ?? [];
    entries.push(values);
    grouped.set(row.finding_id, entries);
  }
  return grouped;
}

function buildFindingListQuery(filter?: FindingTimeFilter) {
  const clauses = ["incident_id = $1"];
  const column = mapFindingTimeField(filter?.field);

  if (filter?.start) {
    clauses.push(`${column} >= $${clauses.length + 1}`);
  }

  if (filter?.end) {
    clauses.push(`${column} <= $${clauses.length + 1}`);
  }
  clauses.push(`true`);

  return `select * from findings where ${clauses.slice(0, -1).join(" and ")} order by created_at desc limit $${clauses.length}`;
}

function buildFindingListParams(incidentId: string, filter?: FindingTimeFilter) {
  const params: string[] = [incidentId];
  if (filter?.start) {
    params.push(filter.start);
  }
  if (filter?.end) {
    params.push(filter.end);
  }
  params.push(String(filter?.limit ?? 100));
  return params;
}

function mapFindingTimeField(field: FindingTimeFilter["field"]) {
  return field === "createdAt" ? "created_at" : "updated_at";
}

export async function createFinding(database: Database, user: AuthenticatedUser, input: CreateFindingInput) {
  await requirePermission(database, user, "finding:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const ownerUserId = input.ownerUserId ?? user.id;
  await requireIncidentMembership(database, ownerUserId, input.incidentId);
  const findingId = randomUUID();
  await database.query(
    `
      insert into findings (
        id, incident_id, title, description, severity, status, confidence, impact, recommendation, owner_user_id, created_by_user_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      findingId,
      input.incidentId,
      input.title,
      input.description ?? null,
      input.severity ?? null,
      input.status,
      input.confidence ?? null,
      input.impact ?? null,
      input.recommendation ?? null,
      ownerUserId,
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "finding.create",
    entityType: "finding",
    entityId: findingId,
    afterJson: {
      ...input,
      ownerUserId
    }
  });

  const memberResult = await database.query<{ user_id: string }>(
    "select user_id from incident_members where incident_id = $1 and user_id <> $2",
    [input.incidentId, user.id]
  );
  const scope = await getIncidentNotificationScope(database, input.incidentId);

  for (const row of memberResult.rows) {
    await createNotification(database, {
      recipientUserId: row.user_id,
      incidentId: input.incidentId,
      actorUserId: user.id,
      eventType: "finding.created",
      title: `Finding created: ${input.title}`,
      body: formatNotificationScope(scope),
      entityType: "finding",
      entityId: findingId
    });
  }

  const result = await database.query("select * from findings where id = $1", [findingId]);
  return result.rows[0];
}

export async function updateFinding(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  findingId: string,
  input: Partial<Omit<CreateFindingInput, "incidentId">>
) {
  await requirePermission(database, user, "finding:update");
  await requireIncidentMembership(database, user.id, incidentId);

  if (input.ownerUserId !== undefined) {
    throw new AppError(400, "Finding owner cannot be changed");
  }

  const existing = await database.query("select * from findings where id = $1 and incident_id = $2", [findingId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Finding not found");
  }

  const next = {
    ...existing.rows[0],
    title: input.title ?? existing.rows[0].title,
    description: input.description ?? existing.rows[0].description,
    severity: input.severity ?? existing.rows[0].severity,
    status: input.status ?? existing.rows[0].status,
    confidence: input.confidence ?? existing.rows[0].confidence,
    impact: input.impact ?? existing.rows[0].impact,
    recommendation: input.recommendation ?? existing.rows[0].recommendation,
    owner_user_id: existing.rows[0].owner_user_id
  };

  await database.query(
    `
      update findings
      set title = $3, description = $4, severity = $5, status = $6, confidence = $7, impact = $8,
          recommendation = $9, owner_user_id = $10, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [
      findingId,
      incidentId,
      next.title,
      next.description,
      next.severity,
      next.status,
      next.confidence,
      next.impact,
      next.recommendation,
      next.owner_user_id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "finding.update",
    entityType: "finding",
    entityId: findingId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const memberResult = await database.query<{ user_id: string }>(
    "select user_id from incident_members where incident_id = $1 and user_id <> $2",
    [incidentId, user.id]
  );
  const scope = await getIncidentNotificationScope(database, incidentId);

  for (const row of memberResult.rows) {
    await createNotification(database, {
      recipientUserId: row.user_id,
      incidentId,
      actorUserId: user.id,
      eventType: "finding.updated",
      title: `Finding updated: ${next.title}`,
      body: formatNotificationScope(scope),
      entityType: "finding",
      entityId: findingId
    });
  }

  const result = await database.query("select * from findings where id = $1", [findingId]);
  return result.rows[0];
}

export async function deleteFinding(database: Database, user: AuthenticatedUser, incidentId: string, findingId: string) {
  await requirePermission(database, user, "finding:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from findings where id = $1 and incident_id = $2", [findingId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Finding not found");
  }

  await database.query("delete from findings where id = $1 and incident_id = $2", [findingId, incidentId]);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "finding.delete",
    entityType: "finding",
    entityId: findingId,
    beforeJson: existing.rows[0]
  });
}
