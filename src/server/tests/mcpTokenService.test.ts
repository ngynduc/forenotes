import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { runMigrations } from "../db/setup.js";
import { authenticateMcpToken, createMcpToken, revokeMcpToken } from "../services/mcpTokenService.js";
import type { Database } from "../db/types.js";

describe("MCP access tokens", () => {
  let pool: Database;
  let userId: string;

  beforeEach(async () => {
    const memory = newDb();
    const adapter = memory.adapters.createPg();
    pool = new adapter.Pool();
    await runMigrations(pool);
    userId = randomUUID();
    await pool.query(
      `insert into users (id, username, email, display_name, global_role, status, password_hash)
       values ($1, 'agent-owner', 'agent-owner@example.com', 'Agent Owner', 'analyst', 'active', 'hash')`,
      [userId]
    );
  });

  it("discloses a token once and stores only a hash", async () => {
    const created = await createMcpToken(pool, userId, { label: "Triage agent", scope: "read_write" });

    expect(created.token).toMatch(/^fnmcp_[A-Za-z0-9_-]{40,}$/);
    const stored = await pool.query<{ token_hash: string; token_prefix: string }>(
      "select token_hash, token_prefix from mcp_access_tokens where id = $1",
      [created.accessToken.id]
    );
    expect(stored.rows[0].token_hash).not.toContain(created.token);
    expect(created.token.startsWith(stored.rows[0].token_prefix)).toBe(true);
    expect((await authenticateMcpToken(pool, created.token)).user.id).toBe(userId);
  });

  it("rejects revoked tokens immediately", async () => {
    const created = await createMcpToken(pool, userId, { label: "Triage agent", scope: "read_only" });
    await revokeMcpToken(pool, userId, created.accessToken.id);

    await expect(authenticateMcpToken(pool, created.token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects expired tokens immediately", async () => {
    const created = await createMcpToken(pool, userId, {
      label: "Short lived",
      scope: "read_only",
      expiresAt: new Date(Date.now() + 60_000)
    });
    await pool.query("update mcp_access_tokens set expires_at = now() - interval '1 minute' where id=$1", [created.accessToken.id]);

    await expect(authenticateMcpToken(pool, created.token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("defaults to 90 days, caps expiry at one year, and exposes scope", async () => {
    const before = Date.now();
    const created = await createMcpToken(pool, userId, { label: "Reader", scope: "read_only" });
    const days = (new Date(created.accessToken.expiresAt).getTime() - before) / 86_400_000;
    expect(days).toBeGreaterThan(89.9);
    expect(days).toBeLessThanOrEqual(90.1);
    expect((await authenticateMcpToken(pool, created.token)).accessToken.scope).toBe("read_only");
    await expect(createMcpToken(pool, userId, {
      label: "Too long", scope: "read_only", expiresAt: new Date(Date.now() + 366 * 86_400_000)
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("applies live account disablement and password rotation", async () => {
    const created = await createMcpToken(pool, userId, { label: "Live policy", scope: "read_write" });
    await pool.query("update users set status='disabled' where id=$1", [userId]);
    await expect(authenticateMcpToken(pool, created.token)).rejects.toMatchObject({ statusCode: 403 });
    await pool.query("update users set status='active', must_change_password=true where id=$1", [userId]);
    await expect(authenticateMcpToken(pool, created.token)).rejects.toMatchObject({ statusCode: 403 });
  });
});
