import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification } from "./notificationService.js";

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

export async function listFindings(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from findings where incident_id = $1 order by created_at desc", [incidentId]);
  return Promise.all(
    result.rows.map(async (row) => {
      const [attackTagsResult, customTagsResult] = await Promise.all([
        database.query(
          `
            select at.id, at.attack_id, at.name, at.type, at.tactic
            from finding_attack_tags fat
            inner join attack_tags at on at.id = fat.attack_tag_id
            where fat.incident_id = $1 and fat.finding_id = $2
            order by at.attack_id asc
          `,
          [incidentId, row.id]
        ),
        database.query(
          `
            select ct.id, ct.name, ct.color
            from finding_custom_tags fct
            inner join custom_tags ct on ct.id = fct.custom_tag_id
            where fct.incident_id = $1 and fct.finding_id = $2
            order by ct.name asc
          `,
          [incidentId, row.id]
        )
      ]);

      return {
        ...row,
        attack_tags: attackTagsResult.rows,
        custom_tags: customTagsResult.rows
      };
    })
  );
}

export async function createFinding(database: Database, user: AuthenticatedUser, input: CreateFindingInput) {
  await requirePermission(database, user, "finding:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const ownerUserId = input.ownerUserId ?? user.id;
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

  for (const row of memberResult.rows) {
    await createNotification(database, {
      recipientUserId: row.user_id,
      incidentId: input.incidentId,
      actorUserId: user.id,
      eventType: "finding.created",
      title: `Finding created: ${input.title}`,
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

  for (const row of memberResult.rows) {
    await createNotification(database, {
      recipientUserId: row.user_id,
      incidentId,
      actorUserId: user.id,
      eventType: "finding.updated",
      title: `Finding updated: ${next.title}`,
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
