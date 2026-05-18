import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateQueryInput {
  incidentId: string;
  name: string;
  language: string;
  description?: string;
  queryBody: string;
  ownerUserId?: string;
}

export async function listQueries(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from queries where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function createQuery(database: Database, user: AuthenticatedUser, input: CreateQueryInput) {
  await requirePermission(database, user, "query:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const queryId = randomUUID();
  await database.query(
    `
      insert into queries (
        id, incident_id, name, language, description, query_body, owner_user_id, created_by_user_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      queryId,
      input.incidentId,
      input.name,
      input.language,
      input.description ?? null,
      input.queryBody,
      input.ownerUserId ?? null,
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "query.create",
    entityType: "query",
    entityId: queryId,
    afterJson: input
  });

  const result = await database.query("select * from queries where id = $1", [queryId]);
  return result.rows[0];
}

export async function updateQuery(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  queryId: string,
  input: Partial<Omit<CreateQueryInput, "incidentId">>
) {
  await requirePermission(database, user, "query:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from queries where id = $1 and incident_id = $2", [queryId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Query not found");
  }

  const next = {
    ...existing.rows[0],
    name: input.name ?? existing.rows[0].name,
    language: input.language ?? existing.rows[0].language,
    description: input.description ?? existing.rows[0].description,
    query_body: input.queryBody ?? existing.rows[0].query_body,
    owner_user_id: input.ownerUserId ?? existing.rows[0].owner_user_id
  };

  await database.query(
    `
      update queries
      set name = $3, language = $4, description = $5, query_body = $6, owner_user_id = $7, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [queryId, incidentId, next.name, next.language, next.description, next.query_body, next.owner_user_id]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "query.update",
    entityType: "query",
    entityId: queryId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from queries where id = $1", [queryId]);
  return result.rows[0];
}

export async function deleteQuery(database: Database, user: AuthenticatedUser, incidentId: string, queryId: string) {
  await requirePermission(database, user, "query:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from queries where id = $1 and incident_id = $2", [queryId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Query not found");
  }

  await database.query("delete from queries where id = $1 and incident_id = $2", [queryId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "query.delete",
    entityType: "query",
    entityId: queryId,
    beforeJson: existing.rows[0]
  });
}
