import { randomUUID } from "node:crypto";
import { newDb } from "pg-mem";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import type { Database } from "../db/types.js";

describe("Investigation details and timeline roles", () => {
  let pool: Database & { end(): Promise<void> };
  let app: ReturnType<typeof createApp>;
  let userId: string;
  let observerId: string;
  let incidentId: string;

  beforeEach(async () => {
    const adapter = newDb().adapters.createPg();
    pool = new adapter.Pool() as Database & { end(): Promise<void> };
    await runMigrations(pool);
    userId = randomUUID();
    observerId = randomUUID();
    const caseId = randomUUID();
    incidentId = randomUUID();
    await pool.query("insert into users (id, username, email, display_name, global_role) values ($1, 'investigator', 'investigator@example.com', 'Case Investigator', 'admin')", [userId]);
    await pool.query("insert into users (id, username, email, display_name, global_role) values ($1, 'observer', 'observer@example.com', 'Case Observer', 'admin')", [observerId]);
    await pool.query("insert into cases (id, case_name, status, created_by_user_id) values ($1, 'Role test', 'open', $2)", [caseId, userId]);
    await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'commander', $2)", [caseId, userId]);
    await pool.query("insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'commander', $3)", [caseId, observerId, userId]);
    await pool.query("insert into incidents (id, case_id, name, status, created_by_user_id) values ($1, $2, 'Role test', 'open', $3)", [incidentId, caseId, userId]);
    app = createApp(pool, { accessLogWriter: () => undefined });
  });

  afterEach(async () => pool.end());

  it("creates primary and supporting events and returns historical attribution", async () => {
    const primary = await request(app).post(`/api/incidents/${incidentId}/timeline-events`).set("x-user-id", userId).send({
      title: "Initial access", eventTime: "2026-01-01T00:00:00.000Z", eventRole: "primary", rawEvidenceRef: "EDR-42"
    });
    expect(primary.status).toBe(201);

    const supporting = await request(app).post(`/api/incidents/${incidentId}/timeline-events`).set("x-user-id", userId).send({
      title: "PowerShell child process", eventTime: "2026-01-01T00:01:00.000Z", eventRole: "supporting",
      primaryEventId: primary.body.timelineEvent.id
    });
    expect(supporting.status).toBe(201);

    const list = await request(app).get(`/api/incidents/${incidentId}/timeline-events`).set("x-user-id", userId);
    expect(list.body.timelineEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Initial access", event_role: "primary", creator_display_name: "Case Investigator" }),
      expect.objectContaining({ title: "PowerShell child process", event_role: "supporting", primary_event_id: primary.body.timelineEvent.id, primary_event_title: "Initial access" })
    ]));

    const graph = await request(app).get(`/api/incidents/${incidentId}/graph?mode=timeline`).set("x-user-id", userId);
    expect(graph.body.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: primary.body.timelineEvent.id, metadata: expect.objectContaining({ eventRole: "primary" }) }),
      expect.objectContaining({ entityId: supporting.body.timelineEvent.id, metadata: expect.objectContaining({ eventRole: "supporting", primaryEventId: primary.body.timelineEvent.id }) })
    ]));
    expect(graph.body.edges).toContainEqual(expect.objectContaining({ source: `timeline_event:${primary.body.timelineEvent.id}`, target: `timeline_event:${supporting.body.timelineEvent.id}`, label: "supports" }));
  });

  it("rejects supporting events without a valid primary event", async () => {
    const response = await request(app).post(`/api/incidents/${incidentId}/timeline-events`).set("x-user-id", userId).send({
      title: "Orphan", eventTime: "2026-01-01T00:00:00.000Z", eventRole: "supporting"
    });
    expect(response.status).toBe(400);
    expect(response.body.details.fieldErrors.primaryEventId).toContain("Supporting events require a primary event");
  });

  it("returns finding evidence, tags, timestamps, and creator details", async () => {
    const event = randomUUID();
    const finding = randomUUID();
    await pool.query("insert into timeline_events (id, incident_id, event_time, title, created_by_user_id) values ($1, $2, now(), 'Evidence event', $3)", [event, incidentId, userId]);
    await pool.query("insert into findings (id, incident_id, title, status, created_by_user_id) values ($1, $2, 'Suspicious execution', 'draft', $3)", [finding, incidentId, userId]);
    await pool.query("insert into finding_evidence_links (id, finding_id, incident_id, evidence_type, evidence_id, linked_by_user_id) values ($1, $2, $3, 'timeline_event', $4, $5)", [randomUUID(), finding, incidentId, event, userId]);
    await pool.query("update users set status = 'disabled' where id = $1", [userId]);

    const response = await request(app).get(`/api/incidents/${incidentId}/findings`).set("x-user-id", observerId);
    expect(response.body.findings[0]).toEqual(expect.objectContaining({
      id: finding,
      creator_display_name: "Case Investigator",
      creator_status: "disabled",
      evidence_links: [expect.objectContaining({ evidence_type: "timeline_event", evidence_id: event })]
    }));
  });
});
