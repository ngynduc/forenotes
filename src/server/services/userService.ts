import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { GlobalRole } from "../../shared/domain.js";

interface CreateUserInput {
  email: string;
  displayName: string;
  globalRole: GlobalRole;
}

export async function listUsers(database: Database) {
  const result = await database.query(
    `
      select id, email, display_name, global_role, status, created_at
      from users
      order by created_at asc
    `
  );
  return result.rows;
}

export async function createUser(database: Database, input: CreateUserInput) {
  const userId = randomUUID();
  await database.query(
    `
      insert into users (id, email, display_name, global_role, status)
      values ($1, $2, $3, $4, 'active')
    `,
    [userId, input.email, input.displayName, input.globalRole]
  );

  const result = await database.query(
    `
      select id, email, display_name, global_role, status, created_at
      from users
      where id = $1
    `,
    [userId]
  );
  return result.rows[0];
}
