import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { Database } from "../db/types.js";
import { createReportSchema, updateReportSchema } from "../schemas/schemas.js";

describe("JSON request body limits", () => {
  function reportMemberDatabase() {
    const userId = randomUUID();
    const query = vi.fn(async (text: string) => {
      if (text.includes("from users where id")) {
        return {
          rows: [{
            id: userId,
            username: "report-user",
            email: "report-user@example.com",
            display_name: "Report User",
            global_role: "admin",
            status: "active",
            must_change_password: false,
            is_bootstrap_admin: false
          }],
          rowCount: 1
        };
      }
      if (text.includes("from incidents i")) return { rows: [{ allowed: 1 }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    return { database: { query: query as unknown as Database["query"] }, query, userId };
  }

  it.each([
    { name: "create", schema: createReportSchema },
    { name: "update", schema: updateReportSchema }
  ])("validates the expanded Markdown boundary for report $name", ({ schema }) => {
    const markdown = "x".repeat(10 * 1024 * 1024);
    const payload = {
      title: "Large AI report",
      reportType: "incident",
      generationMode: "llm",
      generatedContext: {},
      markdown
    };

    const parsed = schema.parse(payload);
    expect(parsed.markdown).toBe(markdown);
    expect(schema.safeParse({ ...payload, markdown: `${markdown}x` }).success).toBe(false);
  });

  it("accepts report JSON bodies at the 50 MiB limit", async () => {
    const { database, userId } = reportMemberDatabase();
    const app = createApp(database, { accessLogWriter: () => {} });
    const overhead = Buffer.byteLength(JSON.stringify({ context: "" }));
    const body = JSON.stringify({ context: "x".repeat(50 * 1024 * 1024 - overhead) });
    expect(Buffer.byteLength(body)).toBe(50 * 1024 * 1024);

    const response = await request(app)
      .post("/api/incidents/incident-id/reports")
      .set("Content-Type", "application/json")
      .set("x-user-id", userId)
      .send(body);

    // Parsing succeeds before the intentionally incomplete payload is validated.
    expect(response.status).toBe(400);
  });

  it.each([
    "/api/auth/login",
    "/api/incidents/incident-id/report-templates"
  ])("returns a safe 413 for an oversized request to %s", async (url) => {
    const database: Database = { query: vi.fn() };
    const app = createApp(database, { accessLogWriter: () => {} });
    const oversizedBody = "private-report-content".repeat(6_000);

    const response = await request(app).post(url).send({ content: oversizedBody });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Request body too large", details: null });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated oversized report before parsing it", async () => {
    const database: Database = { query: vi.fn() };
    const app = createApp(database, { accessLogWriter: () => {} });

    const response = await request(app)
      .post("/api/incidents/incident-id/reports")
      .send({ content: "x".repeat(50 * 1024 * 1024 + 1) });

    expect(response.status).toBe(401);
    expect(database.query).not.toHaveBeenCalled();
  });

  it("returns 413 for an authenticated member above the report limit", async () => {
    const { database, userId } = reportMemberDatabase();
    const app = createApp(database, { accessLogWriter: () => {} });

    const response = await request(app)
      .post("/api/incidents/incident-id/reports")
      .set("x-user-id", userId)
      .send({ content: "x".repeat(50 * 1024 * 1024 + 1) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Request body too large", details: null });
  });
});
