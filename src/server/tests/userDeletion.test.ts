import { randomUUID } from "node:crypto";
import { newDb } from "pg-mem";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import { hashPassword } from "../services/authService.js";
import { subscribeToUserStateEvents } from "../services/notificationService.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  const query = pool.query.bind(pool);
  pool.query = async (sql: string, params?: unknown[]) => {
    try {
      return await query(sql, params);
    } catch (error) {
      // pg-mem omits PostgreSQL's SQLSTATE for foreign-key violations.
      if (error instanceof Error && error.message.includes("violates foreign key constraint")) {
        Object.assign(error, { code: "23503" });
      }
      throw error;
    }
  };
  await runMigrations(pool);
  const users = { admin: randomUUID(), commander: randomUUID(), analyst: randomUUID(), viewer: randomUUID() };
  for (const [role, id] of Object.entries(users)) {
    await pool.query(
      "insert into users (id, username, email, display_name, global_role) values ($1, $2, $3, $4, $5)",
      [id, `delete-${role}`, `delete-${role}@example.com`, role, role]
    );
  }
  return { app: createApp(pool, { accessLogWriter: () => undefined }), pool, users };
}

describe("Admin user deletion", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => { context = await setup(); });
  afterEach(async () => { await context.pool.end(); });

  it("deletes the account, revokes browser/MCP access, and audits public fields", async () => {
    const { app, pool, users } = context;
    await pool.query("update users set password_hash = $2 where id = $1", [users.analyst, await hashPassword("DeleteSession123!")]);
    const session = request.agent(app);
    expect((await session.post("/api/auth/login").send({ username: "delete-analyst", password: "DeleteSession123!" })).status).toBe(200);
    const tokenId = randomUUID();
    await pool.query(
      `insert into mcp_access_tokens (id, user_id, label, scope, token_prefix, token_hash, expires_at)
       values ($1, $2, 'fixture', 'read_only', 'fixture', 'fixture-token-hash', $3)`,
      [tokenId, users.analyst, new Date(Date.now() + 60_000)]
    );
    await pool.query(
      `insert into llm_settings (user_id, provider_name, model, encrypted_api_key, api_key_mask)
       values ($1, 'fixture', 'fixture', 'fixture-encrypted-key', 'masked')`, [users.analyst]
    );
    await pool.query(
      `insert into notifications (id, recipient_user_id, event_type, title)
       values ($1, $2, 'fixture', 'Fixture notification')`, [randomUUID(), users.analyst]
    );
    const events: string[] = [];
    const unsubscribe = subscribeToUserStateEvents(users.analyst, (event) => events.push(event.type));
    try {
      expect((await request(app).delete(`/api/users/${users.analyst}`).set("x-user-id", users.admin)).status).toBe(204);
      await expect.poll(() => events).toEqual(["session.ended"]);
    } finally {
      unsubscribe();
    }
    for (const table of ["users", "sessions", "mcp_access_tokens", "llm_settings", "notifications"]) {
      const column = table === "users" ? "id" : table === "notifications" ? "recipient_user_id" : "user_id";
      expect((await pool.query(`select * from ${table} where ${column} = $1`, [users.analyst])).rows).toEqual([]);
    }
    expect((await session.get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("x-user-id", users.analyst)).status).toBe(401);
    const list = await request(app).get("/api/users").set("x-user-id", users.admin);
    expect(list.body.users.some((user: { id: string }) => user.id === users.analyst)).toBe(false);
    const audit = await pool.query("select actor_user_id, entity_id, before_json, after_json from audit_logs where action = 'user.delete'");
    expect(audit.rows).toEqual([expect.objectContaining({ actor_user_id: users.admin, entity_id: users.analyst, after_json: null })]);
    expect(audit.rows[0].before_json).toMatchObject({ username: "delete-analyst", global_role: "analyst" });
    expect(JSON.stringify(audit.rows)).not.toContain("password_hash");
    const recreate = await request(app).post("/api/users").set("x-user-id", users.admin).send({
      username: "delete-analyst", email: "delete-analyst@example.com", displayName: "Replacement", globalRole: "analyst"
    });
    expect(recreate.status).toBe(201);
    expect(recreate.body.user.id).not.toBe(users.analyst);
  });

  it.each(["commander", "analyst", "viewer"] as const)("rejects deletion by a %s", async (role) => {
    const { app, pool, users } = context;
    const response = await request(app).delete(`/api/users/${users.analyst}`).set("x-user-id", users[role]);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Missing permission: user:manage");
    expect((await pool.query("select id from users where id = $1", [users.analyst])).rowCount).toBe(1);
  });

  it("requires authentication and validates IDs and missing users", async () => {
    const { app, users } = context;
    expect((await request(app).delete(`/api/users/${users.analyst}`)).status).toBe(401);
    expect((await request(app).delete("/api/users/not-a-uuid").set("x-user-id", users.admin)).status).toBe(400);
    expect((await request(app).delete(`/api/users/${randomUUID()}`).set("x-user-id", users.admin)).status).toBe(404);
  });

  it("protects the current account and bootstrap admin", async () => {
    const { app, pool, users } = context;
    const own = await request(app).delete(`/api/users/${users.admin}`).set("x-user-id", users.admin);
    expect(own.status).toBe(409);
    expect(own.body.error).toBe("Cannot delete your own account");
    await pool.query("update users set global_role = 'admin', is_bootstrap_admin = true where id = $1", [users.viewer]);
    const bootstrap = await request(app).delete(`/api/users/${users.viewer}`).set("x-user-id", users.admin);
    expect(bootstrap.status).toBe(409);
    expect(bootstrap.body.error).toBe("Cannot delete the bootstrap admin account");
    for (const userId of [users.admin, users.viewer]) {
      expect((await pool.query("select id from users where id = $1", [userId])).rowCount).toBe(1);
    }
  });

  it.each(["active", "disabled"])("deletes an unreferenced %s administrator", async (status) => {
    const { app, pool, users } = context;
    await pool.query("update users set global_role = 'admin', status = $2 where id = $1", [users.viewer, status]);
    expect((await request(app).delete(`/api/users/${users.viewer}`).set("x-user-id", users.admin)).status).toBe(204);
  });

  async function createScope() {
    const { pool, users } = context;
    const caseId = randomUUID();
    const incidentId = randomUUID();
    await pool.query("insert into cases (id, case_name, status, created_by_user_id) values ($1, 'Deletion lab', 'open', $2)", [caseId, users.admin]);
    await pool.query("insert into incidents (id, case_id, name, status, created_by_user_id) values ($1, $2, 'Deletion lab', 'open', $3)", [incidentId, caseId, users.admin]);
    return { caseId, incidentId };
  }

  it("protects the last case commander, then removes memberships when another remains", async () => {
    const { app, pool, users } = context;
    const { caseId, incidentId } = await createScope();
    await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'commander', $3)", [caseId, users.commander, users.admin]);
    await pool.query("insert into incident_members (incident_id, user_id, incident_role, added_by_user_id) values ($1, $2, 'commander', $3)", [incidentId, users.commander, users.admin]);
    const blocked = await request(app).delete(`/api/users/${users.commander}`).set("x-user-id", users.admin);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toBe("Cannot delete the last case commander");
    await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'commander', $2)", [caseId, users.admin]);
    expect((await request(app).delete(`/api/users/${users.commander}`).set("x-user-id", users.admin)).status).toBe(204);
    expect((await pool.query("select * from case_members where user_id = $1", [users.commander])).rows).toEqual([]);
    expect((await pool.query("select * from incident_members where user_id = $1", [users.commander])).rows).toEqual([]);
    expect((await pool.query("select id from cases where id = $1", [caseId])).rowCount).toBe(1);
  });

  it.each(["authorship", "assignment", "audit", "MCP provenance", "graph source", "graph target"])("preserves accounts referenced by %s", async (reference) => {
    const { app, pool, users } = context;
    const { caseId, incidentId } = await createScope();
    if (reference === "authorship") {
      await pool.query("update cases set created_by_user_id = $2 where id = $1", [caseId, users.analyst]);
    } else if (reference === "assignment") {
      await pool.query("insert into tasks (id, incident_id, title, status, priority, assignee_user_id, created_by_user_id) values ($1, $2, 'Fixture', 'todo', 'low', $3, $4)", [randomUUID(), incidentId, users.analyst, users.admin]);
    } else if (reference === "audit") {
      await pool.query("insert into audit_logs (id, actor_user_id, action, entity_type, entity_id) values ($1, $2, 'fixture', 'user', $2)", [randomUUID(), users.analyst]);
    } else if (reference === "MCP provenance") {
      await pool.query("insert into agent_actions (id, user_id, tool_name, outcome, duration_ms) values ($1, $2, 'fixture', 'succeeded', 1)", [randomUUID(), users.analyst]);
    } else {
      const sourceIsUser = reference === "graph source";
      await pool.query("insert into incident_entity_links (id, incident_id, source_type, source_id, target_type, target_id, link_type, created_by_user_id) values ($1, $2, $3, $4, $5, $6, 'related_to', $7)",
        [randomUUID(), incidentId, sourceIsUser ? "user" : "system", sourceIsUser ? users.analyst : randomUUID(), sourceIsUser ? "system" : "user", sourceIsUser ? randomUUID() : users.analyst, users.admin]);
    }
    const events: string[] = [];
    const unsubscribe = subscribeToUserStateEvents(users.analyst, (event) => events.push(event.type));
    try {
      const response = await request(app).delete(`/api/users/${users.analyst}`).set("x-user-id", users.admin);
      expect(response.status).toBe(409);
      expect(response.body.error).toBe("User is referenced by existing records. Disable the account instead.");
      expect(events).toEqual([]);
    } finally {
      unsubscribe();
    }
    expect((await pool.query("select status from users where id = $1", [users.analyst])).rows).toEqual([{ status: "active" }]);
    expect((await pool.query("select id from audit_logs where action = 'user.delete'")).rows).toEqual([]);
    expect((await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({ status: "disabled" })).status).toBe(200);
  });
});
