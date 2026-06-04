import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateIndicatorInput {
  incidentId: string;
  indicatorType: string;
  value: string;
  description?: string;
  confidence?: string;
  source?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export async function listIndicators(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from indicators where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function createIndicator(database: Database, user: AuthenticatedUser, input: CreateIndicatorInput) {
  await requirePermission(database, user, "indicator:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  try {
    const indicatorId = randomUUID();
    await database.query(
      `
        insert into indicators (
          id, incident_id, indicator_type, value, description, confidence, source, first_seen_at, last_seen_at, created_by_user_id
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        indicatorId,
        input.incidentId,
        input.indicatorType,
        input.value,
        input.description ?? null,
        input.confidence ?? null,
        input.source ?? null,
        input.firstSeenAt ?? null,
        input.lastSeenAt ?? null,
        user.id
      ]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "indicator.create",
      entityType: "indicator",
      entityId: indicatorId,
      afterJson: input
    });

    const result = await database.query("select * from indicators where id = $1", [indicatorId]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Duplicate indicator value for this incident");
    }
    throw error;
  }
}

export async function updateIndicator(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  indicatorId: string,
  input: Partial<Omit<CreateIndicatorInput, "incidentId">>
) {
  await requirePermission(database, user, "indicator:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from indicators where id = $1 and incident_id = $2", [indicatorId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Indicator not found");
  }

  const next = {
    ...existing.rows[0],
    indicator_type: input.indicatorType ?? existing.rows[0].indicator_type,
    value: input.value ?? existing.rows[0].value,
    description: input.description ?? existing.rows[0].description,
    confidence: input.confidence ?? existing.rows[0].confidence,
    source: input.source ?? existing.rows[0].source,
    first_seen_at: input.firstSeenAt ?? existing.rows[0].first_seen_at,
    last_seen_at: input.lastSeenAt ?? existing.rows[0].last_seen_at
  };

  try {
    await database.query(
      `
        update indicators
        set indicator_type = $3, value = $4, description = $5, confidence = $6, source = $7,
            first_seen_at = $8, last_seen_at = $9, updated_at = now()
        where id = $1 and incident_id = $2
      `,
      [
        indicatorId,
        incidentId,
        next.indicator_type,
        next.value,
        next.description,
        next.confidence,
        next.source,
        next.first_seen_at,
        next.last_seen_at
      ]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Duplicate indicator value for this incident");
    }
    throw error;
  }

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "indicator.update",
    entityType: "indicator",
    entityId: indicatorId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from indicators where id = $1", [indicatorId]);
  return result.rows[0];
}

export async function deleteIndicator(database: Database, user: AuthenticatedUser, incidentId: string, indicatorId: string) {
  await requirePermission(database, user, "indicator:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from indicators where id = $1 and incident_id = $2", [indicatorId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Indicator not found");
  }

  await database.query("delete from indicators where id = $1 and incident_id = $2", [indicatorId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "indicator.delete",
    entityType: "indicator",
    entityId: indicatorId,
    beforeJson: existing.rows[0]
  });
}
