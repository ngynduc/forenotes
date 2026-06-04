import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateAccountInput {
  incidentId: string;
  username: string;
  domain?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

interface UpdateAccountInput {
  username?: string;
  domain?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

export async function listAccounts(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from accounts where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function createAccount(database: Database, user: AuthenticatedUser, input: CreateAccountInput) {
  await requirePermission(database, user, "indicator:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const accountId = randomUUID();
  await database.query(
    `
      insert into accounts (id, incident_id, username, domain, status, owner, notes, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      accountId,
      input.incidentId,
      input.username,
      input.domain ?? null,
      input.status ?? null,
      input.owner ?? null,
      input.notes ?? null,
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "account.create",
    entityType: "account",
    entityId: accountId,
    afterJson: input
  });

  const result = await database.query("select * from accounts where id = $1", [accountId]);
  return result.rows[0];
}

export async function updateAccount(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  accountId: string,
  input: UpdateAccountInput
) {
  await requirePermission(database, user, "indicator:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from accounts where id = $1 and incident_id = $2", [accountId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Account not found");
  }

  const next = {
    ...existing.rows[0],
    username: input.username ?? existing.rows[0].username,
    domain: input.domain ?? existing.rows[0].domain,
    status: input.status ?? existing.rows[0].status,
    owner: input.owner ?? existing.rows[0].owner,
    notes: input.notes ?? existing.rows[0].notes
  };
  await database.query(
    `
      update accounts
      set username = $3, domain = $4, status = $5, owner = $6, notes = $7, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [accountId, incidentId, next.username, next.domain, next.status, next.owner, next.notes]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "account.update",
    entityType: "account",
    entityId: accountId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from accounts where id = $1", [accountId]);
  return result.rows[0];
}

export async function deleteAccount(database: Database, user: AuthenticatedUser, incidentId: string, accountId: string) {
  await requirePermission(database, user, "indicator:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from accounts where id = $1 and incident_id = $2", [accountId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Account not found");
  }

  await database.query("delete from accounts where id = $1 and incident_id = $2", [accountId, incidentId]);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "account.delete",
    entityType: "account",
    entityId: accountId,
    beforeJson: existing.rows[0]
  });
}
