import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateCaseInput {
  caseName: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  summary?: string;
}

export async function listCases(database: Database, userId: string) {
  const result = await database.query(
    `
      select c.id, c.case_name, c.client_name, c.start_date, c.end_date, c.status, c.summary, c.created_at, c.updated_at
      from cases c
      inner join case_members cm on cm.case_id = c.id
      where cm.user_id = $1
      order by c.created_at desc
    `,
    [userId]
  );

  return result.rows;
}

export async function createCase(database: Database, user: AuthenticatedUser, input: CreateCaseInput) {
  await requirePermission(database, user, "case:create");

  const caseId = randomUUID();
  await database.query(
    `
      insert into cases (id, case_name, client_name, start_date, end_date, status, summary, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [caseId, input.caseName, input.clientName ?? null, input.startDate ?? null, input.endDate ?? null, input.status, input.summary ?? null, user.id]
  );

  await database.query(
    `
      insert into case_members (case_id, user_id, case_role, added_by_user_id)
      values ($1, $2, $3, $4)
      on conflict do nothing
    `,
    [caseId, user.id, "case_lead", user.id]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "case.create",
    entityType: "case",
    entityId: caseId,
    afterJson: input
  });

  const result = await database.query("select * from cases where id = $1", [caseId]);
  return result.rows[0];
}

export async function updateCase(
  database: Database,
  user: AuthenticatedUser,
  caseId: string,
  input: Partial<CreateCaseInput>
) {
  await requirePermission(database, user, "case:update");
  const existing = await database.query("select * from cases where id = $1", [caseId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Case not found");
  }

  const next = {
    ...existing.rows[0],
    case_name: input.caseName ?? existing.rows[0].case_name,
    client_name: input.clientName ?? existing.rows[0].client_name,
    start_date: input.startDate ?? existing.rows[0].start_date,
    end_date: input.endDate ?? existing.rows[0].end_date,
    status: input.status ?? existing.rows[0].status,
    summary: input.summary ?? existing.rows[0].summary
  };

  await database.query(
    `
      update cases
      set case_name = $2, client_name = $3, start_date = $4, end_date = $5, status = $6, summary = $7, updated_at = now()
      where id = $1
    `,
    [caseId, next.case_name, next.client_name, next.start_date, next.end_date, next.status, next.summary]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "case.update",
    entityType: "case",
    entityId: caseId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from cases where id = $1", [caseId]);
  return result.rows[0];
}
