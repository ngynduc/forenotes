import type { Request } from "express";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import type { GlobalRole } from "../../shared/domain.js";
import { env } from "../env.js";

const SESSION_COOKIE_NAME = "forenotes_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  globalRole: GlobalRole;
  status: string;
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  display_name: string;
  global_role: GlobalRole;
  status: string;
}

interface PasswordUserRecord extends UserRecord {
  password_hash: string | null;
}

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function loginWithPassword(database: Database, input: { username: string; password: string }) {
  const username = normalizeUsername(input.username);
  const result = await database.query<PasswordUserRecord>(
    `
      select id, username, email, display_name, global_role, status, password_hash
      from users
      where username = $1
    `,
    [username]
  );

  if (result.rowCount === 0) {
    throw new AppError(401, "Invalid username or password.");
  }

  const record = result.rows[0];
  if (record.status !== "active") {
    throw new AppError(403, "Your account is disabled.");
  }

  if (!record.password_hash || !(await verifyPassword(record.password_hash, input.password))) {
    throw new AppError(401, "Invalid username or password.");
  }

  await database.query("delete from sessions where expires_at <= now()");

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await database.query(
    `
      insert into sessions (id, user_id, expires_at)
      values ($1, $2, $3)
    `,
    [sessionId, record.id, expiresAt]
  );
  await database.query("update users set last_login_at = now(), updated_at = now() where id = $1", [record.id]);

  return {
    user: mapUser(record),
    sessionId,
    expiresAt
  };
}

export async function logout(database: Database, request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return;
  }

  await database.query("delete from sessions where id = $1", [sessionId]);
}

export async function getAuthenticatedUser(request: Request, database: Database): Promise<AuthenticatedUser> {
  const sessionId = getSessionId(request);
  if (sessionId) {
    const sessionUser = await getUserFromSession(database, sessionId);
    if (sessionUser) {
      return sessionUser;
    }
  }

  const userId = request.header("x-user-id");
  if (!userId) {
    throw new AppError(401, "Authentication required");
  }

  const result = await database.query<UserRecord>(
    "select id, username, email, display_name, global_role, status from users where id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(401, "User not found");
  }

  const user = result.rows[0];
  if (user.status !== "active") {
    throw new AppError(403, "User is disabled");
  }

  return mapUser(user);
}

export async function requireAuth(request: Request, database: Database) {
  return getAuthenticatedUser(request, database);
}

export function requireRole(user: AuthenticatedUser, allowedRoles: GlobalRole[]) {
  if (!allowedRoles.includes(user.globalRole)) {
    throw new AppError(403, "Missing required role");
  }
}

export function setSessionCookie(response: Response, sessionId: string, expiresAt: Date) {
  response.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.SECURE_SESSION_COOKIES,
    expires: expiresAt,
    path: "/"
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.SECURE_SESSION_COOKIES,
    path: "/"
  });
}

async function getUserFromSession(database: Database, sessionId: string): Promise<AuthenticatedUser | null> {
  const result = await database.query<UserRecord>(
    `
      select u.id, u.username, u.email, u.display_name, u.global_role, u.status
      from sessions s
      join users u on u.id = s.user_id
      where s.id = $1 and s.expires_at > now()
    `,
    [sessionId]
  );

  if (result.rowCount === 0) {
    await database.query("delete from sessions where id = $1", [sessionId]);
    return null;
  }

  const user = result.rows[0];
  if (user.status !== "active") {
    throw new AppError(403, "User is disabled");
  }

  return mapUser(user);
}

function mapUser(user: UserRecord): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    globalRole: user.global_role,
    status: user.status
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function getSessionId(request: Request) {
  const sessionId = parseCookies(request.header("cookie"))[SESSION_COOKIE_NAME];
  return sessionId && isUuid(sessionId) ? sessionId : undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseCookies(header?: string) {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) {
      continue;
    }
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
  }
  return cookies;
}
