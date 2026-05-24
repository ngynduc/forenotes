import type { Database } from "../db/types.js";
import type { PermissionKey } from "../../shared/domain.js";
import type { AuthenticatedUser } from "../services/authService.js";
import { AppError } from "../errors.js";

export async function requirePermission(database: Database, user: AuthenticatedUser, key: PermissionKey) {
  const result = await database.query<{ permission_key: string }>(
    "select permission_key from role_permissions where role = $1 and permission_key = $2",
    [user.globalRole, key]
  );

  if (result.rowCount === 0) {
    throw new AppError(403, `Missing permission: ${key}`);
  }
}

export async function listUserPermissions(database: Database, user: AuthenticatedUser): Promise<PermissionKey[]> {
  const result = await database.query<{ permission_key: PermissionKey }>(
    `
      select permission_key
      from role_permissions
      where role = $1
      order by permission_key asc
    `,
    [user.globalRole]
  );

  return result.rows.map((row) => row.permission_key);
}

export async function requireCaseMembership(database: Database, userId: string, caseId: string) {
  const result = await database.query("select 1 from case_members where case_id = $1 and user_id = $2", [
    caseId,
    userId
  ]);

  if (result.rowCount === 0) {
    throw new AppError(404, "Case not found");
  }
}

export async function requireCasePermission(
  database: Database,
  user: AuthenticatedUser,
  caseId: string,
  key: PermissionKey
) {
  await requirePermission(database, user, key);
  await requireCaseMembership(database, user.id, caseId);
}

export async function requireIncidentMembership(database: Database, userId: string, incidentId: string) {
  const result = await database.query(
    `
      select 1
      from incidents i
      inner join case_members cm on cm.case_id = i.case_id and cm.user_id = $2
      where i.id = $1
    `,
    [incidentId, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "Incident not found");
  }
}

export async function requireIncidentPermission(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  key: PermissionKey
) {
  await requirePermission(database, user, key);
  await requireIncidentMembership(database, user.id, incidentId);
}
