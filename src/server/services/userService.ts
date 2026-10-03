import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { requirePermission } from "../permissions/permissionService.js";
import { publishUserStateEvent } from "./notificationService.js";
import { createAuditLog } from "./auditLogService.js";
import type { AuthenticatedUser } from "./authService.js";
import type { GlobalRole } from "../../shared/domain.js";

interface CreateUserInput {
  email: string;
  username?: string;
  displayName: string;
  globalRole: GlobalRole;
  passwordHash?: string | null;
  mustChangePassword?: boolean;
}

export async function listUsers(database: Database) {
  const result = await database.query(
    `
      select id, username, email, display_name, global_role, status, must_change_password, is_bootstrap_admin, created_at, last_login_at
      from users
      order by created_at asc
    `
  );
  return result.rows;
}

export async function createUser(database: Database, input: CreateUserInput) {
  const userId = randomUUID();
  const username = normalizeUsername(input.username ?? input.email.split("@")[0]);
  await database.query(
    `
      insert into users (id, username, email, display_name, global_role, status, password_hash, must_change_password)
      values ($1, $2, $3, $4, $5, 'active', $6, $7)
    `,
    [userId, username, input.email, input.displayName, input.globalRole, input.passwordHash ?? null, input.mustChangePassword ?? false]
  );

  const result = await database.query(
    `
      select id, username, email, display_name, global_role, status, must_change_password, is_bootstrap_admin, created_at, last_login_at
      from users
      where id = $1
    `,
    [userId]
  );
  return result.rows[0];
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  displayName?: string;
  globalRole?: GlobalRole;
  status?: "active" | "disabled";
}

export async function updateUser(database: Database, actor: AuthenticatedUser, userId: string, input: UpdateUserInput) {
  await requirePermission(database, actor, "user:manage");
  // Select only public fields: password hashes must never enter responses or audit logs.
  const columns = "id, username, email, display_name, global_role, status, must_change_password, is_bootstrap_admin, created_at, last_login_at";
  const existing = await database.query(`select ${columns} from users where id = $1`, [userId]);
  if (existing.rowCount === 0) throw new AppError(404, "User not found");

  let updated;
  try {
    updated = await database.query(
      `update users set username = coalesce($2, username), email = coalesce($3, email),
       display_name = coalesce($4, display_name), global_role = coalesce($5, global_role),
       status = coalesce($6, status), updated_at = now()
       where id = $1 returning ${columns}`,
      [userId, input.username === undefined ? null : normalizeUsername(input.username), input.email ?? null,
       input.displayName ?? null, input.globalRole ?? null, input.status ?? null]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Username or email already exists");
    }
    throw error;
  }
  await createAuditLog(database, {
    actorUserId: actor.id, action: "user.update", entityType: "user", entityId: userId,
    beforeJson: existing.rows[0], afterJson: updated.rows[0]
  });
  publishUserStateEvent({ userId, type: "user.updated" });
  return updated.rows[0];
}
