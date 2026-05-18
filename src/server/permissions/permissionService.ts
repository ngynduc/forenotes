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

export async function requireIncidentMembership(database: Database, userId: string, incidentId: string) {
  const result = await database.query(
    `
      select 1
      from incident_members
      where incident_id = $1 and user_id = $2
    `,
    [incidentId, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "Incident not found");
  }
}
