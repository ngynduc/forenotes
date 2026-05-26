import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateSystemInput {
  incidentId: string;
  hostname: string;
  ipAddress?: string;
  os?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

interface UpdateSystemInput {
  hostname?: string;
  ipAddress?: string;
  os?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

export async function listSystems(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from systems where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function createSystem(database: Database, user: AuthenticatedUser, input: CreateSystemInput) {
  await requirePermission(database, user, "indicator:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const systemId = randomUUID();
  await database.query(
    `
      insert into systems (id, incident_id, hostname, ip_address, os, status, owner, notes, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      systemId,
      input.incidentId,
      input.hostname,
      input.ipAddress ?? null,
      input.os ?? null,
      input.status ?? null,
      input.owner ?? null,
      input.notes ?? null,
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "system.create",
    entityType: "system",
    entityId: systemId,
    afterJson: input
  });

  const result = await database.query("select * from systems where id = $1", [systemId]);
  return result.rows[0];
}

export async function updateSystem(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  systemId: string,
  input: UpdateSystemInput
) {
  await requirePermission(database, user, "indicator:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from systems where id = $1 and incident_id = $2", [systemId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "System not found");
  }

  const next = {
    ...existing.rows[0],
    hostname: input.hostname ?? existing.rows[0].hostname,
    ip_address: input.ipAddress ?? existing.rows[0].ip_address,
    os: input.os ?? existing.rows[0].os,
    status: input.status ?? existing.rows[0].status,
    owner: input.owner ?? existing.rows[0].owner,
    notes: input.notes ?? existing.rows[0].notes
  };
  await database.query(
    `
      update systems
      set hostname = $3, ip_address = $4, os = $5, status = $6, owner = $7, notes = $8, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [systemId, incidentId, next.hostname, next.ip_address, next.os, next.status, next.owner, next.notes]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "system.update",
    entityType: "system",
    entityId: systemId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from systems where id = $1", [systemId]);
  return result.rows[0];
}

export async function deleteSystem(database: Database, user: AuthenticatedUser, incidentId: string, systemId: string) {
  await requirePermission(database, user, "indicator:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from systems where id = $1 and incident_id = $2", [systemId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "System not found");
  }

  await database.query("delete from systems where id = $1 and incident_id = $2", [systemId, incidentId]);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "system.delete",
    entityType: "system",
    entityId: systemId,
    beforeJson: existing.rows[0]
  });
}
