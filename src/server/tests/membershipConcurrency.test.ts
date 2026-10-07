import { randomUUID } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import type { Database } from "../db/types.js";
import { runMigrations } from "../db/setup.js";

const databaseUrl = process.env.FORENOTES_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("Commander concurrency on PostgreSQL", () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  const userIds: string[] = [];
  const caseIds: string[] = [];

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.endsWith("_regression_lab")) {
      throw new Error("FORENOTES_TEST_DATABASE_URL must point to a disposable local *_regression_lab database.");
    }
    pool = new Pool({ connectionString: databaseUrl });
    await runMigrations(pool);
    const database: Database = {
      query: pool.query.bind(pool),
      connect: async () => {
        const client = await pool.connect();
        const delayedQuery = async <T extends QueryResultRow>(text: string, params?: unknown[]) => {
          const result = await client.query<T>(text, params);
          // Keep competing requests in the vulnerable check-to-write window.
          if (text.includes("count(*)::int as count from case_members")) {
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
          return result;
        };
        return new Proxy(client, {
          get: (target, property) => property === "query" ? delayedQuery
            : property === "release" ? client.release.bind(client) : Reflect.get(target, property)
        });
      }
    };
    app = createApp(database, { accessLogWriter: () => undefined });
  });

  afterAll(async () => {
    if (!pool) return;
    try {
      await pool.query("delete from notifications where actor_user_id = any($1::uuid[])", [userIds]);
      await pool.query("delete from audit_logs where actor_user_id = any($1::uuid[])", [userIds]);
      await pool.query("delete from cases where id = any($1::uuid[])", [caseIds]);
      await pool.query("delete from users where id = any($1::uuid[])", [userIds]);
    } finally {
      await pool.end();
    }
  });

  it.each(["demotion", "removal"])("preserves a commander when user deletion races with member %s", async (operation) => {
    const [adminId, deletedId, changedId] = [randomUUID(), randomUUID(), randomUUID()];
    userIds.push(adminId, deletedId, changedId);
    for (const id of [adminId, deletedId, changedId]) {
      await pool.query(
        "insert into users (id, username, email, display_name, global_role) values ($1, $2, $3, 'Concurrency fixture', $4)",
        [id, `concurrency-${id}`, `${id}@example.com`, id === adminId ? "admin" : "commander"]
      );
    }
    const caseId = randomUUID();
    caseIds.push(caseId);
    await pool.query("insert into cases (id, case_name, status, created_by_user_id) values ($1, 'Concurrency fixture', 'open', $2)", [caseId, adminId]);
    for (const id of [adminId, deletedId, changedId]) {
      await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, $3, $4)",
        [caseId, id, id === adminId ? "analyst" : "commander", adminId]);
    }
    const route = `/api/cases/${caseId}/members/${changedId}`;
    const memberChange = operation === "demotion"
      ? request(app).patch(route).set("x-user-id", adminId).send({ caseRole: "analyst" })
      : request(app).delete(route).set("x-user-id", adminId);
    const responses = await Promise.all([
      request(app).delete(`/api/users/${deletedId}`).set("x-user-id", adminId), memberChange
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([204, 409]);
    await expect.poll(async () => (await pool.query(
      "select count(*)::int as count from case_members where case_id = $1 and case_role = 'commander'", [caseId]
    )).rows[0].count).toBe(1);
  });
});
