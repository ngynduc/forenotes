import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import request from "supertest";
import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import { hashPassword } from "../services/authService.js";
import { subscribeToNotificationEvents, subscribeToUserStateEvents } from "../services/notificationService.js";
import { afterTransactionCommit, withTransaction } from "../db/transaction.js";
import type { Database } from "../db/types.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  await runMigrations(pool);
  const ids = { admin: randomUUID(), user: randomUUID() };
  for (const [name, id] of Object.entries(ids)) {
    await pool.query("insert into users (id, username, email, display_name, global_role, password_hash, must_change_password) values ($1, $2, $3, $2, $4, $5, $6)",
      [id, `fresh-${name}`, `fresh-${name}@example.com`, name === "admin" ? "admin" : "analyst", await hashPassword("TemporaryPass123!"), name !== "admin"]);
  }
  const app = createApp(pool);
  const admin = request.agent(app);
  await admin.post("/api/auth/login").send({ username: "fresh-admin", password: "TemporaryPass123!" });
  return { pool, app, ids, admin };
}

describe("Session and realtime freshness", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => { context = await setup(); });

  it("mandatory password change expires the cookie, revokes all sessions, and requires new-password login", async () => {
    const { app, pool, ids } = context;
    const user = request.agent(app);
    const login = await user.post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" });
    expect(login.body.user.mustChangePassword).toBe(true);
    const oldCookie = login.headers["set-cookie"];
    const second = await request(app).post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" });
    expect((await user.get("/api/cases")).status).toBe(403);
    const events: string[] = [];
    const unsubscribe = subscribeToUserStateEvents(ids.user, (event) => events.push(event.type));
    try {
      const changed = await user.post("/api/auth/change-password").send({ currentPassword: "TemporaryPass123!", newPassword: "UpdatedPass456!", confirmPassword: "UpdatedPass456!" });
      expect(changed.status).toBe(204);
      expect(changed.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("forenotes_session=;")]));
      expect(changed.headers["set-cookie"][0]).toContain("Expires=Thu, 01 Jan 1970");
      await expect.poll(() => events).toContain("session.ended");
      expect((await pool.query("select id from sessions where user_id = $1", [ids.user])).rows).toHaveLength(0);
      expect((await request(app).get("/api/auth/me").set("Cookie", oldCookie)).status).toBe(401);
      expect((await request(app).get("/api/auth/me").set("Cookie", second.headers["set-cookie"])).status).toBe(401);
      expect((await user.post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" })).status).toBe(401);
      expect((await user.post("/api/auth/login").send({ username: "fresh-user", password: "UpdatedPass456!" })).status).toBe(200);
      expect((await user.get("/api/auth/me")).body.user.mustChangePassword).toBe(false);
      expect((await user.get("/api/cases")).status).toBe(200);
    } finally { unsubscribe(); }
  });

  it("password validation failures preserve the session and do not emit revocation", async () => {
    const { app, ids } = context;
    const user = request.agent(app);
    await user.post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" });
    const events: string[] = [];
    const unsubscribe = subscribeToUserStateEvents(ids.user, (event) => events.push(event.type));
    try {
      expect((await user.post("/api/auth/change-password").send({ currentPassword: "wrong", newPassword: "UpdatedPass456!", confirmPassword: "UpdatedPass456!" })).status).toBe(401);
      expect((await user.post("/api/auth/change-password").send({ currentPassword: "TemporaryPass123!", newPassword: "short", confirmPassword: "short" })).status).toBe(400);
      expect((await user.get("/api/auth/me")).status).toBe(200);
      expect(events).toEqual([]);
    } finally { unsubscribe(); }
  });

  it("emits scoped case/incident add and removal events, and immediately enforces database access", async () => {
    const { app, pool, ids, admin } = context;
    await pool.query("update users set must_change_password = false where id = $1", [ids.user]);
    const user = request.agent(app);
    await user.post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" });
    const created = await admin.post("/api/cases").send({ caseName: "Fresh access", status: "open" });
    expect(created.status).toBe(201);
    const caseId = created.body.case.id;
    const incident = await admin.post(`/api/cases/${caseId}/incidents`).send({ name: "Live incident", status: "open" });
    expect(incident.status).toBe(201);
    const incidentId = incident.body.incident.id;
    const events: string[] = [];
    const unsubscribe = subscribeToNotificationEvents(ids.user, (event) => {
      events.push(event.notification.event_type);
      expect(event.caseId).toBe(caseId);
    });
    try {
      expect((await user.get(`/api/incidents/${incidentId}/findings`)).status).toBe(404);
      expect((await admin.post(`/api/cases/${caseId}/members`).send({ userId: ids.user, caseRole: "analyst" })).status).toBe(204);
      await expect.poll(() => events).toContain("case.member_added");
      expect((await user.get("/api/cases")).body.cases.map((row: { id: string }) => row.id)).toContain(caseId);
      expect((await user.get(`/api/incidents/${incidentId}/findings`)).status).toBe(200);
      expect((await user.delete(`/api/incidents/${incidentId}/members/${ids.admin}`)).status).toBe(403);
      expect((await admin.delete(`/api/incidents/${incidentId}/members/${ids.user}`)).status).toBe(204);
      await expect.poll(() => events).toContain("case.member_removed");
      expect((await user.get(`/api/incidents/${incidentId}/findings`)).status).toBe(404);
      expect((await user.get("/api/cases")).body.cases).toHaveLength(0);
      expect((await admin.post(`/api/cases/${caseId}/members`).send({ userId: ids.user, caseRole: "analyst" })).status).toBe(204);
      expect((await admin.post(`/api/incidents/${incidentId}/members`).send({ userId: ids.user, incidentRole: "analyst" })).status).toBe(204);
      await expect.poll(() => events).toContain("incident.member_added");
      expect((await user.get(`/api/incidents/${incidentId}/findings`)).status).toBe(200);
      expect((await admin.patch(`/api/cases/${caseId}/members/${ids.user}`).send({ caseRole: "viewer" })).status).toBe(204);
      await expect.poll(() => events).toContain("case.member_role_updated");
      expect((await admin.delete(`/api/cases/${caseId}/members/${ids.user}`)).status).toBe(204);
      await expect.poll(() => events).toContain("case.member_removed");
      expect((await user.get("/api/cases")).body.cases).toHaveLength(0);
      expect((await user.get(`/api/incidents/${incidentId}/findings`)).status).toBe(404);
    } finally { unsubscribe(); }
  });

  it("notifies initial case members and existing members gaining access to a newly created incident", async () => {
    const { ids, admin } = context;
    const events: string[] = [];
    const unsubscribe = subscribeToNotificationEvents(ids.user, (event) => events.push(event.notification.event_type));
    try {
      const created = await admin.post("/api/cases").send({ caseName: "Initial members", status: "open", members: [{ userId: ids.user, caseRole: "analyst" }] });
      expect(created.status).toBe(201);
      await expect.poll(() => events).toContain("case.member_added");
      expect((await admin.post(`/api/cases/${created.body.case.id}/incidents`).send({ name: "New shared incident", status: "open" })).status).toBe(201);
      await expect.poll(() => events).toContain("incident.created");
    } finally { unsubscribe(); }
  });

  it("publishes profile/role updates only to the edited user and authorizes their existing cookie with the new role", async () => {
    const { app, pool, ids, admin } = context;
    await pool.query("update users set must_change_password = false where id = $1", [ids.user]);
    const user = request.agent(app);
    await user.post("/api/auth/login").send({ username: "fresh-user", password: "TemporaryPass123!" });
    const changes: string[] = [];
    const other = vi.fn();
    const unsubscribe = subscribeToUserStateEvents(ids.user, (event) => changes.push(event.type));
    const unsubscribeAdmin = subscribeToUserStateEvents(ids.admin, other);
    try {
      expect((await admin.patch(`/api/users/${ids.user}`).send({ globalRole: "viewer", displayName: "Current profile" })).status).toBe(200);
      await expect.poll(() => changes).toContain("user.updated");
      expect(other).not.toHaveBeenCalled();
      const me = await user.get("/api/auth/me");
      expect(me.body.user).toMatchObject({ globalRole: "viewer", displayName: "Current profile" });
      expect(me.body.permissions).not.toContain("finding:update");
      expect((await user.post("/api/cases").send({ caseName: "Denied", status: "open" })).status).toBe(403);
    } finally { unsubscribe(); unsubscribeAdmin(); }
  });
});

it("defers event publication until commit and discards it on rollback", async () => {
  const trace: string[] = [];
  const client = { query: vi.fn(async (sql: string) => { trace.push(sql); return { rows: [], rowCount: 0 }; }), release: vi.fn() };
  const database = { connect: async () => client as unknown as PoolClient } as Database;
  await withTransaction(database, async () => {
    afterTransactionCommit(() => trace.push("event"));
    expect(trace).toEqual(["begin"]);
  });
  expect(trace).toEqual(["begin", "commit", "event"]);
  trace.length = 0;
  await expect(withTransaction(database, async () => {
    afterTransactionCommit(() => trace.push("event"));
    throw new Error("mutation failed");
  })).rejects.toThrow("mutation failed");
  expect(trace).toEqual(["begin", "rollback"]);
});
