import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { createApp } from "../app.js";
import { hashPassword } from "../services/authService.js";
import { runMigrations } from "../db/setup.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  await runMigrations(pool);
  const users = { admin: randomUUID(), commander: randomUUID(), analyst: randomUUID(), viewer: randomUUID() };
  for (const [role, id] of Object.entries(users)) {
    await pool.query(
      "insert into users (id, username, email, display_name, global_role) values ($1, $2, $3, $4, $5)",
      [id, `edit-${role}`, `edit-${role}@example.com`, role, role]
    );
  }
  return { app: createApp(pool), pool, users };
}

describe("User updates and tag removal", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => { context = await setup(); });

  it("persists supported user fields and applies role/status changes to authentication", async () => {
    const { app, pool, users } = context;
    await pool.query("update users set password_hash = $2 where id = $1", [users.analyst, await hashPassword("TestSession123!")]);
    const session = request.agent(app);
    expect((await session.post("/api/auth/login").send({ username: "edit-analyst", password: "TestSession123!" })).status).toBe(200);
    const response = await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({
      username: " Edited.User ", email: "edited@example.com", displayName: "Edited User", globalRole: "viewer"
    });
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ username: "edited.user", email: "edited@example.com", display_name: "Edited User", global_role: "viewer" });
    expect(response.body.user).not.toHaveProperty("password_hash");
    const list = await request(app).get("/api/users").set("x-user-id", users.admin);
    expect(list.body.users.find((user: { id: string }) => user.id === users.analyst)).toMatchObject(response.body.user);
    const me = await session.get("/api/auth/me");
    expect(me.body.user.globalRole).toBe("viewer");
    expect(me.body.permissions).not.toContain("finding:update");
    const disable = await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({ status: "disabled" });
    expect(disable.status).toBe(200);
    expect((await session.get("/api/auth/me")).status).toBe(403);
    const audit = await pool.query("select before_json, after_json from audit_logs where action = 'user.update'");
    expect(audit.rows).toHaveLength(2);
    expect(JSON.stringify(audit.rows)).not.toContain("password_hash");
  });

  it.each(["commander", "analyst", "viewer"] as const)("rejects %s user edits", async (role) => {
    const { app, users } = context;
    const response = await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users[role]).send({ globalRole: "admin" });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Missing permission: user:manage");
  });

  it("validates updates, rejects duplicates, and keeps untouched values", async () => {
    const { app, users } = context;
    for (const payload of [{}, { displayName: "  " }, { email: "bad" }, { globalRole: "owner" }, { status: "unknown" }, { password: "secret" }, { isBootstrapAdmin: true }]) {
      expect((await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send(payload)).status).toBe(400);
    }
    expect((await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({ email: "edit-admin@example.com" })).status).toBe(409);
    expect((await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({ username: "EDIT-ADMIN" })).status).toBe(409);
    const update = await request(app).patch(`/api/users/${users.analyst}`).set("x-user-id", users.admin).send({ displayName: "Only name" });
    expect(update.body.user).toMatchObject({ email: "edit-analyst@example.com", global_role: "analyst", display_name: "Only name" });
    expect((await request(app).patch(`/api/users/${randomUUID()}`).set("x-user-id", users.admin).send({ displayName: "Missing" })).status).toBe(404);
    expect((await request(app).patch("/api/users/invalid").set("x-user-id", users.admin).send({ displayName: "Bad ID" })).status).toBe(400);
    expect((await request(app).patch(`/api/users/${users.analyst}`).send({ displayName: "Unauthenticated" })).status).toBe(401);
  });

  it.each(["findings", "timeline-events", "queries"])("removes only the intended ATT&CK relationship from %s", async (collection) => {
    const { app, pool, users } = context;
    const caseResponse = await request(app).post("/api/cases").set("x-user-id", users.commander).send({ caseName: "Removal lab", status: "open" });
    const caseId = caseResponse.body.case.id as string;
    const incidentResponse = await request(app).post(`/api/cases/${caseId}/incidents`).set("x-user-id", users.commander).send({ name: "Tag lab", status: "open", severity: "high" });
    const incidentId = incidentResponse.body.incident.id as string;
    const payload = collection === "queries" ? { name: "Hunt", language: "spl", queryBody: "index=lab" }
      : collection === "timeline-events" ? { title: "Lab event", eventTime: new Date().toISOString(), source: "fixture" }
      : { title: "Lab finding", status: "confirmed", severity: "high" };
    const create = await request(app).post(`/api/incidents/${incidentId}/${collection}`).set("x-user-id", users.commander).send(payload);
    expect(create.status).toBe(201);
    const entityId = (create.body.finding ?? create.body.timelineEvent ?? create.body.query).id as string;
    const base = `/api/incidents/${incidentId}/${collection}/${entityId}`;
    const catalog = await pool.query("select id, attack_id from attack_tags where attack_id in ('T1059', 'T1003', 'T1021') order by attack_id");
    expect(catalog.rows).toHaveLength(3);
    for (const tag of catalog.rows) {
      expect((await request(app).post(`${base}/attack-tags`).set("x-user-id", users.commander).send({ attackTagId: tag.id })).status).toBe(204);
    }
    const removed = catalog.rows.find((tag: { id: string; attack_id: string }) => tag.attack_id === "T1003")!;
    expect((await request(app).post(`${base}/attack-tags`).set("x-user-id", users.commander).send({ attackTagId: removed.id })).status).toBe(409);
    expect((await request(app).delete(`${base}/attack-tags/${removed.id}`).set("x-user-id", users.viewer)).status).toBe(404);
    await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'member', $3)", [caseId, users.viewer, users.commander]);
    expect((await request(app).delete(`${base}/attack-tags/${removed.id}`).set("x-user-id", users.viewer)).status).toBe(403);
    expect((await request(app).delete(`${base}/attack-tags/${removed.id}`).set("x-user-id", users.commander)).status).toBe(204);
    const reload = await request(app).get(`${base}/tags`).set("x-user-id", users.commander);
    expect(reload.body.attackTags.map((tag: { attack_id: string }) => tag.attack_id)).toEqual(["T1021", "T1059"]);
    expect((await request(app).delete(`${base}/attack-tags/${removed.id}`).set("x-user-id", users.commander)).status).toBe(204);
    const badScope = base.replace(incidentId, randomUUID());
    expect((await request(app).delete(`${badScope}/attack-tags/${catalog.rows[0].id}`).set("x-user-id", users.commander)).status).toBe(404);
    expect((await request(app).delete(`${base}/attack-tags/not-a-uuid`).set("x-user-id", users.commander)).status).toBe(400);
    const missingEntity = base.replace(entityId, randomUUID());
    expect((await request(app).delete(`${missingEntity}/attack-tags/${removed.id}`).set("x-user-id", users.commander)).status).toBe(404);
    expect((await request(app).post(`${base}/attack-tags`).set("x-user-id", users.commander).send({ attackTagId: removed.id })).status).toBe(204);
    expect((await request(app).get(`${base}/tags`).set("x-user-id", users.commander)).body.attackTags).toHaveLength(3);
    if (collection !== "queries") {
      const tag = await request(app).post(`/api/cases/${caseId}/custom-tags`).set("x-user-id", users.commander).send({ name: "Local tag" });
      const tagId = tag.body.customTag.id as string;
      expect((await request(app).post(`${base}/custom-tags`).set("x-user-id", users.commander).send({ customTagId: tagId })).status).toBe(204);
      expect((await request(app).delete(`${base}/custom-tags/${tagId}`).set("x-user-id", users.commander)).status).toBe(204);
      expect((await request(app).get(`${base}/tags`).set("x-user-id", users.commander)).body.customTags).toEqual([]);
    }
  });
});
