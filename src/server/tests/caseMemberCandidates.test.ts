import { randomUUID } from "node:crypto";
import request from "supertest";
import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  await runMigrations(pool);
  const users = {
    commander: randomUUID(),
    outsider: randomUUID(),
    analyst: randomUUID(),
    viewer: randomUUID(),
    admin: randomUUID(),
    disabled: randomUUID()
  };
  for (const [name, id] of Object.entries(users)) {
    const role = name === "outsider" ? "commander" : name === "disabled" ? "analyst" : name;
    await pool.query(
      "insert into users (id, username, email, display_name, global_role, status) values ($1, $2, $3, $4, $5, $6)",
      [id, `candidate-${name}`, `candidate-${name}@example.com`, `Candidate ${name}`, role, name === "disabled" ? "disabled" : "active"]
    );
  }
  const app = createApp(pool, { accessLogWriter: () => undefined });
  const created = await request(app).post("/api/cases").set("x-user-id", users.commander)
    .send({ caseName: "Candidate case", status: "open" });
  expect(created.status).toBe(201);
  const caseId = created.body.case.id as string;
  for (const userId of [users.analyst, users.viewer]) {
    await pool.query(
      "insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'viewer', $3)",
      [caseId, userId, users.commander]
    );
  }
  return { app, pool, users, caseId, url: `/api/cases/${caseId}/member-candidates` };
}

describe("Case member candidates", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => { context = await setup(); });

  it("lets a case commander discover active identities and add a member without managing accounts", async () => {
    const { app, users, caseId, url } = context;
    const response = await request(app).get(url).set("x-user-id", users.commander);
    expect(response.status).toBe(200);
    const candidate = response.body.users.find((user: { id: string }) => user.id === users.outsider);
    expect(candidate).toEqual({
      id: users.outsider, username: "candidate-outsider", email: "candidate-outsider@example.com", display_name: "Candidate outsider"
    });
    expect(response.body.users.map((user: { id: string }) => user.id)).not.toContain(users.disabled);
    for (const user of response.body.users) {
      expect(Object.keys(user).sort()).toEqual(["display_name", "email", "id", "username"]);
    }
    expect((await request(app).get("/api/users").set("x-user-id", users.commander)).status).toBe(403);
    expect((await request(app).patch(`/api/users/${users.outsider}`).set("x-user-id", users.commander)
      .send({ globalRole: "admin" })).status).toBe(403);
    expect((await request(app).post(`/api/cases/${caseId}/members`).set("x-user-id", users.commander)
      .send({ userId: candidate.id, caseRole: "analyst" })).status).toBe(204);
    const members = await request(app).get(`/api/cases/${caseId}/members`).set("x-user-id", users.commander);
    expect(members.body.members.map((member: { user_id: string }) => member.user_id)).toContain(candidate.id);
  });

  it.each(["analyst", "viewer"] as const)("rejects %s case members without membership-management permission", async (role) => {
    const { app, users, url } = context;
    const response = await request(app).get(url).set("x-user-id", users[role]);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Missing permission: case:member_manage");
  });

  it.each(["outsider", "admin"] as const)("hides candidates from a non-member %s", async (role) => {
    const { app, users, url } = context;
    const response = await request(app).get(url).set("x-user-id", users[role]);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Case not found");
  });

  it("requires authentication and validates case identifiers", async () => {
    const { app, users, url } = context;
    expect((await request(app).get(url)).status).toBe(401);
    expect((await request(app).get("/api/cases/not-a-uuid/member-candidates").set("x-user-id", users.commander)).status).toBe(400);
    expect((await request(app).get(`/api/cases/${randomUUID()}/member-candidates`).set("x-user-id", users.commander)).status).toBe(404);
  });

  it("rechecks case access after membership removal", async () => {
    const { app, pool, users, caseId, url } = context;
    expect((await request(app).get(url).set("x-user-id", users.commander)).status).toBe(200);
    await pool.query("delete from case_members where case_id = $1 and user_id = $2", [caseId, users.commander]);
    expect((await request(app).get(url).set("x-user-id", users.commander)).status).toBe(404);
  });
});
