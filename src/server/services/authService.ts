import type { Request } from "express";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  globalRole: string;
  status: string;
}

export async function getAuthenticatedUser(request: Request, database: Database): Promise<AuthenticatedUser> {
  const userId = request.header("x-user-id");

  if (!userId) {
    throw new AppError(401, "Authentication required");
  }

  const result = await database.query<{
    id: string;
    email: string;
    display_name: string;
    global_role: string;
    status: string;
  }>("select id, email, display_name, global_role, status from users where id = $1", [userId]);

  if (result.rowCount === 0) {
    throw new AppError(401, "User not found");
  }

  const user = result.rows[0];
  if (user.status !== "active") {
    throw new AppError(403, "User is disabled");
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    globalRole: user.global_role,
    status: user.status
  };
}
