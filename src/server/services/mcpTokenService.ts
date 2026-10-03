import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { GlobalRole } from "../../shared/domain.js";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import type { AuthenticatedUser } from "./authService.js";

const DEFAULT_EXPIRY_DAYS = 90;
const MAX_EXPIRY_DAYS = 365;
const TOKEN_PREFIX = "fnmcp_";

type TokenScope = "read_only" | "read_write";

interface TokenRow {
  id: string;
  user_id: string;
  label: string;
  scope: TokenScope;
  token_prefix: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  last_used_at: Date | string | null;
  created_at: Date | string;
}

interface AuthTokenRow extends TokenRow {
  username: string;
  email: string;
  display_name: string;
  global_role: GlobalRole;
  status: string;
  must_change_password: boolean;
  is_bootstrap_admin: boolean;
}

export interface McpPrincipal {
  accessToken: ReturnType<typeof mapToken>;
  user: AuthenticatedUser;
}

export async function createMcpToken(
  database: Database,
  userId: string,
  input: { label: string; scope: TokenScope; expiresAt?: string | Date | null }
) {
  const label = input.label.trim();
  if (!label) {
    throw new AppError(400, "Token label is required.");
  }

  const now = new Date();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 86_400_000);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
    throw new AppError(400, "Token expiry must be in the future.");
  }
  if (expiresAt.getTime() > now.getTime() + MAX_EXPIRY_DAYS * 86_400_000) {
    throw new AppError(400, "Token expiry cannot exceed one year.");
  }

  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.slice(0, 14);
  const id = randomUUID();
  const result = await database.query<TokenRow>(
    `insert into mcp_access_tokens (id, user_id, label, scope, token_prefix, token_hash, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, user_id, label, scope, token_prefix, expires_at, revoked_at, last_used_at, created_at`,
    [id, userId, label, input.scope, tokenPrefix, tokenHash, expiresAt]
  );

  return { token, accessToken: mapToken(result.rows[0]) };
}

export async function listMcpTokens(database: Database, userId: string) {
  const result = await database.query<TokenRow>(
    `select id, user_id, label, scope, token_prefix, expires_at, revoked_at, last_used_at, created_at
     from mcp_access_tokens where user_id = $1 order by created_at desc`,
    [userId]
  );
  return result.rows.map(mapToken);
}

export async function revokeMcpToken(database: Database, userId: string, tokenId: string) {
  const result = await database.query<TokenRow>(
    `update mcp_access_tokens set revoked_at = coalesce(revoked_at, now())
     where id = $1 and user_id = $2
     returning id, user_id, label, scope, token_prefix, expires_at, revoked_at, last_used_at, created_at`,
    [tokenId, userId]
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "MCP token not found.");
  }
  return mapToken(result.rows[0]);
}

export async function authenticateMcpToken(database: Database, token: string): Promise<McpPrincipal> {
  if (!token.startsWith(TOKEN_PREFIX) || token.length < 40) {
    throw new AppError(401, "Invalid MCP access token.");
  }
  const result = await database.query<AuthTokenRow>(
    `select t.id, t.user_id, t.label, t.scope, t.token_prefix, t.expires_at, t.revoked_at,
            t.last_used_at, t.created_at, u.username, u.email, u.display_name, u.global_role,
            u.status, u.must_change_password, u.is_bootstrap_admin
     from mcp_access_tokens t join users u on u.id = t.user_id
     where t.token_hash = $1`,
    [hashToken(token)]
  );
  if (result.rowCount === 0) {
    throw new AppError(401, "Invalid MCP access token.");
  }
  const row = result.rows[0];
  if (row.revoked_at || new Date(row.expires_at) <= new Date()) {
    throw new AppError(401, "MCP access token is expired or revoked.");
  }
  if (row.status !== "active") {
    throw new AppError(403, "Token owner is disabled.");
  }
  if (row.must_change_password) {
    throw new AppError(403, "Password change required before MCP access.");
  }
  await database.query("update mcp_access_tokens set last_used_at = now() where id = $1", [row.id]);
  return {
    accessToken: mapToken(row),
    user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      globalRole: row.global_role,
      status: row.status,
      mustChangePassword: row.must_change_password,
      isBootstrapAdmin: row.is_bootstrap_admin
    }
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function mapToken(row: TokenRow) {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    scope: row.scope,
    tokenPrefix: row.token_prefix,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at
  };
}
