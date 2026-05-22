import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { GlobalRole } from "../../shared/domain.js";

interface CreateUserInput {
  email: string;
  username?: string;
  displayName: string;
  globalRole: GlobalRole;
  passwordHash?: string | null;
}

export async function listUsers(database: Database) {
  const result = await database.query(
    `
      select id, username, email, display_name, global_role, status, created_at, last_login_at
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
      insert into users (id, username, email, display_name, global_role, status, password_hash)
      values ($1, $2, $3, $4, $5, 'active', $6)
    `,
    [userId, username, input.email, input.displayName, input.globalRole, input.passwordHash ?? null]
  );

  const result = await database.query(
    `
      select id, username, email, display_name, global_role, status, created_at, last_login_at
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
