import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import { createMcpToken } from "../services/mcpTokenService.js";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { Database } from "../db/types.js";

describe("MCP Streamable HTTP endpoint", () => {
  let app: ReturnType<typeof createApp>;
  let token: string;
  let pool: Database;
  let userId: string;
  let caseId: string;
  let incidentId: string;

  beforeEach(async () => {
    const memory = newDb();
    const adapter = memory.adapters.createPg();
    pool = new adapter.Pool();
    await runMigrations(pool);
    userId = randomUUID();
    await pool.query(
      "insert into users (id,username,email,display_name,global_role,status,must_change_password) values ($1,'mcp-user','mcp@example.com','MCP User','analyst','active',false)",
      [userId]
    );
    const created = await createMcpToken(pool, userId, { label: "Integration client", scope: "read_write" });
    token = created.token;
    caseId = randomUUID();
    await pool.query("insert into cases (id,case_name,status,created_by_user_id) values ($1,'MCP Case','open',$2)", [caseId, userId]);
    await pool.query("insert into case_members (case_id,user_id,case_role,added_by_user_id) values ($1,$2,'analyst',$2)", [caseId, userId]);
    incidentId = randomUUID();
    await pool.query("insert into incidents (id,case_id,name,status,created_by_user_id) values ($1,$2,'MCP Incident','open',$3)", [incidentId, caseId, userId]);
    await pool.query("insert into incident_members (incident_id,user_id,incident_role,added_by_user_id) values ($1,$2,'analyst',$2)", [incidentId, userId]);
    app = createApp(pool, {
      mcp: { enabled: true, publicUrl: "http://127.0.0.1/mcp", allowedOrigins: ["http://agent.local"] }
    });
  });

  it("discovers tools through legacy negotiation with bearer authentication", async () => {
    const response = await request(app)
      .post("/mcp")
      .set("Host", "127.0.0.1")
      .set("Authorization", `Bearer ${token}`)
      .set("Accept", "application/json, text/event-stream")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "vitest", version: "1" } }
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain("forenotes");
  });

  it("rejects browser sessions and invalid origins", async () => {
    const body = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } } };
    expect((await request(app).post("/mcp").set("Host", "127.0.0.1").set("Cookie", "forenotes_session=fake").send(body)).status).toBe(401);
    expect((await request(app).post("/mcp").set("Host", "127.0.0.1").set("Origin", "https://evil.example").set("Authorization", `Bearer ${token}`).send(body)).status).toBe(403);
    expect((await request(app).post("/mcp").set("Host", "evil.example").set("Authorization", `Bearer ${token}`).send(body)).status).toBe(403);
  });

  it("does not accept MCP bearer tokens on browser APIs", async () => {
    const response = await request(app).get("/api/cases").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it("enforces read-only scope and live case membership on every call", async () => {
    const readOnly = await createMcpToken(pool, userId, { label: "Reader", scope: "read_only" });
    const httpServer = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => httpServer.once("listening", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
    const url = new URL(`http://127.0.0.1:${address.port}/mcp`);
    const reader = new Client({ name: "reader", version: "1" });
    const writer = new Client({ name: "writer", version: "1" });
    try {
      await reader.connect(new StreamableHTTPClientTransport(url, {
        authProvider: { token: async () => readOnly.token },
        requestInit: { headers: { Origin: "http://agent.local" } }
      }));
      const deniedWrite = await reader.callTool({ name: "start_investigation_run", arguments: {
        idempotencyKey: "reader-write", caseId, objective: "Must be denied"
      } });
      expect(deniedWrite.isError).toBe(true);
      expect(deniedWrite.structuredContent).toMatchObject({ error: { code: "permission" } });

      await writer.connect(new StreamableHTTPClientTransport(url, {
        authProvider: { token: async () => token },
        requestInit: { headers: { Origin: "http://agent.local" } }
      }));
      expect((await writer.callTool({ name: "get_case", arguments: { caseId } })).isError).not.toBe(true);
      await pool.query("delete from incident_members where incident_id=$1 and user_id=$2", [incidentId, userId]);
      await pool.query("delete from case_members where case_id=$1 and user_id=$2", [caseId, userId]);
      const deniedRead = await writer.callTool({ name: "get_case", arguments: { caseId } });
      expect(deniedRead.isError).toBe(true);
      expect(deniedRead.structuredContent).toMatchObject({ error: { code: "not_found" } });

      const failures = await pool.query<{ outcome: string; error_summary: string }>(
        "select outcome,error_summary from agent_actions where outcome='failed' order by created_at"
      );
      expect(failures.rows).toHaveLength(2);
      expect(failures.rows.every((row) => row.error_summary && !row.error_summary.includes(readOnly.token))).toBe(true);
    } finally {
      await reader.close().catch(() => undefined);
      await writer.close().catch(() => undefined);
      await new Promise<void>((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("manages the current user's tokens through session-authenticated REST", async () => {
    const created = await request(app).post("/api/mcp-tokens").set("x-user-id", userId).send({ label: "UI token", scope: "read_only" });
    expect(created.status).toBe(201);
    expect(created.body.token).toMatch(/^fnmcp_/);
    const listed = await request(app).get("/api/mcp-tokens").set("x-user-id", userId);
    expect(listed.body.tokens.some((item: { label: string }) => item.label === "UI token")).toBe(true);
    const revoked = await request(app).delete(`/api/mcp-tokens/${created.body.accessToken.id}`).set("x-user-id", userId);
    expect(revoked.body.accessToken.revokedAt).toBeTruthy();
  });

  it("supports modern and legacy official clients with discovery, logging, and idempotency", async () => {
    const httpServer = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => httpServer.once("listening", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
    const url = new URL(`http://127.0.0.1:${address.port}/mcp`);
    const expectedTools = [
      "list_cases", "get_case", "search_case", "list_investigation_runs", "get_investigation_run", "get_evidence",
      "get_observations", "get_hypotheses", "get_timeline", "get_entities", "get_relationships", "get_findings", "get_tasks",
      "start_investigation_run", "complete_investigation_run", "register_evidence", "update_evidence", "create_observation",
      "update_observation", "create_hypothesis", "update_hypothesis", "add_timeline_event", "update_timeline_event", "create_entity",
      "update_entity", "link_entities", "create_task", "update_task", "create_draft_finding", "update_draft_finding"
    ];
    let draftFindingId = "";
    try {
      for (const mode of ["auto", "legacy"] as const) {
        const client = new Client({ name: `${mode}-client`, version: "1" }, { versionNegotiation: { mode } });
        const transport = new StreamableHTTPClientTransport(url, {
          authProvider: { token: async () => token },
          requestInit: { headers: { Origin: "http://agent.local" } }
        });
        await client.connect(transport);
        const listed = await client.listTools();
        expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...expectedTools].sort());
        if (mode === "auto") {
          const input = { idempotencyKey: "start-run-1", caseId, objective: "Validate endpoint provenance" };
          const first = await client.callTool({ name: "start_investigation_run", arguments: input });
          const second = await client.callTool({ name: "start_investigation_run", arguments: input });
          expect(first.structuredContent).toMatchObject({ id: expect.any(String), caseId });
          expect(second.structuredContent).toMatchObject({ id: (first.structuredContent as { id: string }).id });
          const conflict = await client.callTool({ name: "start_investigation_run", arguments: { ...input, objective: "Different payload" } });
          expect(conflict.isError).toBe(true);
          const runId = (first.structuredContent as { id: string }).id;
          const evidence = await client.callTool({ name: "register_evidence", arguments: {
            idempotencyKey: "evidence-1", runId, incidentId, evidenceType: "log", title: "Authentication events", sourceLocator: "opaque://events/1"
          } });
          const evidenceId = (evidence.structuredContent as { id: string }).id;
          const observation = await client.callTool({ name: "create_observation", arguments: {
            idempotencyKey: "observation-1", runId, incidentId, title: "Impossible travel", description: "Two distant logins", evidenceIds: [evidenceId]
          } });
          const observationId = (observation.structuredContent as { id: string }).id;
          const hypothesis = await client.callTool({ name: "create_hypothesis", arguments: {
            idempotencyKey: "hypothesis-1", runId, incidentId, title: "Credential compromise", description: "Account was reused", observationIds: [observationId]
          } });
          expect(hypothesis.isError).not.toBe(true);
          expect((await client.callTool({ name: "add_timeline_event", arguments: {
            idempotencyKey: "timeline-1", runId, incidentId, eventTime: new Date().toISOString(), title: "Suspicious login"
          } })).isError).not.toBe(true);
          expect((await client.callTool({ name: "create_entity", arguments: {
            idempotencyKey: "entity-1", runId, incidentId, entityType: "system", hostname: "host-01"
          } })).isError).not.toBe(true);
          expect((await client.callTool({ name: "create_task", arguments: {
            idempotencyKey: "task-1", runId, incidentId, title: "Reset credentials", status: "todo", priority: "high"
          } })).isError).not.toBe(true);
          const finding = await client.callTool({ name: "create_draft_finding", arguments: {
            idempotencyKey: "finding-1", runId, incidentId, title: "Compromised account", severity: "high", observationIds: [observationId]
          } });
          expect(finding.isError).not.toBe(true);
          draftFindingId = (finding.structuredContent as { id: string }).id;
          expect((await client.callTool({ name: "complete_investigation_run", arguments: {
            idempotencyKey: "complete-1", runId, status: "completed", summary: "Ready for review"
          } })).isError).not.toBe(true);
        }
        await client.close();
      }
      const actions = await pool.query<{ tool_name: string }>("select tool_name from agent_actions order by created_at");
      expect(actions.rows.filter((row) => row.tool_name === "start_investigation_run")).toHaveLength(3);
      const serializedActions = JSON.stringify((await pool.query("select input_json,error_summary from agent_actions")).rows);
      expect(serializedActions).not.toContain(token);
      const review = await request(app).get(`/api/cases/${caseId}/investigation/actions`).set("x-user-id", userId);
      expect(review.status).toBe(200);
      expect(review.body.items.some((item: { toolName: string }) => item.toolName === "create_draft_finding")).toBe(true);
      const confirmed = await request(app).patch(`/api/incidents/${incidentId}/findings/${draftFindingId}`).set("x-user-id", userId).send({ status: "confirmed" });
      expect(confirmed.status).toBe(200);
      expect(confirmed.body.finding.status).toBe("confirmed");
    } finally {
      await new Promise<void>((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
    }
  }, 20_000);
});
