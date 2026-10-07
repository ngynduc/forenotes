import { randomUUID } from "node:crypto";
import request from "supertest";
import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import { hashPassword } from "../services/authService.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  await runMigrations(pool);
  const userId = randomUUID();
  await pool.query(
    "insert into users (id, username, email, display_name, global_role, password_hash) values ($1, $2, $3, $4, 'commander', $5)",
    [userId, "lifetime-user", "lifetime@example.com", "Lifetime User", await hashPassword("LifetimeTest123!")]
  );
  const app = createApp(pool, { accessLogWriter: () => undefined });
  const started = Date.now();
  const login = await request(app).post("/api/auth/login").send({ username: "lifetime-user", password: "LifetimeTest123!" });
  const finished = Date.now();
  expect(login.status).toBe(200);
  const setCookie = login.headers["set-cookie"][0] as string;
  const cookie = setCookie.split(";")[0];
  const session = (await pool.query("select id, expires_at from sessions where user_id = $1", [userId])).rows[0];
  return { app, pool, session, cookie, setCookie, started, finished };
}

describe("Browser session lifetime", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => { context = await setup(); });

  it("uses matching four-hour cookie/database deadlines and does not renew on requests", async () => {
    const { app, pool, session, cookie, setCookie, started, finished } = context;
    const expiresAt = new Date(session.expires_at).getTime();
    const issuedAt = expiresAt - 4 * 60 * 60 * 1000;
    expect(issuedAt).toBeGreaterThanOrEqual(started);
    expect(issuedAt).toBeLessThanOrEqual(finished);
    const cookieExpiry = new Date(/Expires=([^;]+)/.exec(setCookie)![1]).getTime();
    expect(cookieExpiry).toBe(Math.floor(expiresAt / 1000) * 1000);
    expect(setCookie).toContain("HttpOnly");
    for (const route of ["/api/auth/me", "/api/cases", "/api/auth/me"]) {
      const response = await request(app).get(route).set("Cookie", cookie);
      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeUndefined();
    }
    const current = (await pool.query("select expires_at from sessions where id = $1", [session.id])).rows[0];
    expect(new Date(current.expires_at).getTime()).toBe(expiresAt);
  });

  it("rejects an expired cookie on auth and protected routes and removes the session", async () => {
    const { app, pool, session, cookie } = context;
    await pool.query("update sessions set expires_at = $1 where id = $2", [new Date(Date.now() - 60_000), session.id]);
    for (const route of ["/api/auth/me", "/api/cases"]) {
      const response = await request(app).get(route).set("Cookie", cookie);
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Authentication required");
    }
    expect((await pool.query("select id from sessions where id = $1", [session.id])).rows).toEqual([]);
  });
});
