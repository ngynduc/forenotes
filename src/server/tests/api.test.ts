import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";

async function createTestApp() {
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  await runMigrations(pool);

  return {
    app: createApp(pool),
    pool
  };
}

async function insertUser(
  pool: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  input: { id: string; email: string; displayName: string; globalRole: string }
) {
  await pool.query(
    `
      insert into users (id, email, display_name, global_role, status)
      values ($1, $2, $3, $4, 'active')
    `,
    [input.id, input.email, input.displayName, input.globalRole]
  );
}

async function addCaseMember(pool: { query: (text: string, params?: unknown[]) => Promise<unknown> }, caseId: string, userId: string, addedByUserId: string) {
  await pool.query(
    `
      insert into case_members (case_id, user_id, case_role, added_by_user_id)
      values ($1, $2, 'member', $3)
    `,
    [caseId, userId, addedByUserId]
  );
}

async function addIncidentMember(
  pool: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  incidentId: string,
  userId: string,
  addedByUserId: string
) {
  await pool.query(
    `
      insert into incident_members (incident_id, user_id, incident_role, added_by_user_id)
      values ($1, $2, 'analyst', $3)
    `,
    [incidentId, userId, addedByUserId]
  );
}

describe("Forenotes API", () => {
  let app: ReturnType<typeof createApp>;
  let pool: Awaited<ReturnType<typeof createTestApp>>["pool"];
  let commanderId: string;
  let analystId: string;
  let analystTwoId: string;

  beforeEach(async () => {
    const setup = await createTestApp();
    app = setup.app;
    pool = setup.pool;
    commanderId = randomUUID();
    analystId = randomUUID();
    analystTwoId = randomUUID();

    await insertUser(pool, {
      id: commanderId,
      email: "commander@example.com",
      displayName: "Commander",
      globalRole: "commander"
    });

    await insertUser(pool, {
      id: analystId,
      email: "analyst@example.com",
      displayName: "Analyst",
      globalRole: "analyst"
    });

    await insertUser(pool, {
      id: analystTwoId,
      email: "analyst2@example.com",
      displayName: "Analyst Two",
      globalRole: "analyst"
    });
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required");
  });

  it("hydrates authenticated user permissions", async () => {
    const response = await request(app).get("/api/auth/me").set("x-user-id", commanderId);

    expect(response.status).toBe(200);
    expect(response.body.user.globalRole).toBe("commander");
    expect(response.body.permissions).toContain("case:create");
    expect(response.body.permissions).toContain("audit:read");
  });

  it("creates a case and incident for a permitted user", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Case One",
        clientName: "Acme",
        status: "open"
      });

    expect(caseResponse.status).toBe(201);
    const caseId = caseResponse.body.case.id as string;

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Incident One",
        status: "open",
        severity: "high"
      });

    expect(incidentResponse.status).toBe(201);
    expect(incidentResponse.body.incident.case_id).toBe(caseId);
  });

  it("rejects unauthorized case creation with an explicit permission error", async () => {
    const response = await request(app)
      .post("/api/cases")
      .set("x-user-id", analystId)
      .send({
        caseName: "Analyst Case",
        clientName: "Acme",
        status: "open"
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Missing permission: case:create");
  });

  it("blocks non-member access to incident data", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Private Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Private Incident",
        status: "open",
        severity: "high"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    const response = await request(app)
      .get(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", analystTwoId);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Incident not found");
  });

  it("blocks cross-incident evidence linking", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Scope Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentAResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Incident A",
        status: "open",
        severity: "medium"
      });
    const incidentAId = incidentAResponse.body.incident.id as string;

    const incidentBResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Incident B",
        status: "open",
        severity: "high"
      });
    const incidentBId = incidentBResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentAId, analystId, commanderId);
    await addIncidentMember(pool, incidentBId, analystId, commanderId);

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentAId}/findings`)
      .set("x-user-id", analystId)
      .send({
        title: "Credential theft",
        status: "draft"
      });
    const findingId = findingResponse.body.finding.id as string;

    const indicatorResponse = await request(app)
      .post(`/api/incidents/${incidentBId}/indicators`)
      .set("x-user-id", analystId)
      .send({
        indicatorType: "domain",
        value: "evil.example"
      });
    const indicatorId = indicatorResponse.body.indicator.id as string;

    const linkResponse = await request(app)
      .post(`/api/incidents/${incidentAId}/findings/${findingId}/evidence-links`)
      .set("x-user-id", analystId)
      .send({
        evidenceType: "indicator",
        evidenceId: indicatorId
      });

    expect(linkResponse.status).toBe(409);
    expect(linkResponse.body.error).toBe("Cross-incident evidence links are not allowed");
  });

  it("creates notifications for other incident members when a finding is created", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Notify Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Notify Incident",
        status: "open",
        severity: "low"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentId, analystId, commanderId);

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", commanderId)
      .send({
        title: "Suspicious logon",
        status: "draft"
      });

    expect(findingResponse.status).toBe(201);
    expect(findingResponse.body.finding.owner_user_id).toBe(commanderId);

    const notificationsResponse = await request(app)
      .get("/api/notifications")
      .set("x-user-id", analystId);

    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.notifications).toHaveLength(1);
    expect(notificationsResponse.body.notifications[0].event_type).toBe("finding.created");
    expect(notificationsResponse.body.notifications[0].unseen).toBe(true);
  });

  it("returns permission-scoped dashboard metrics and recent activity", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Dashboard Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Dashboard Incident",
        status: "open",
        severity: "critical"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentId, analystId, commanderId);

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", commanderId)
      .send({
        title: "Privilege escalation",
        status: "confirmed",
        severity: "high"
      });
    const findingId = findingResponse.body.finding.id as string;

    const taskResponse = await request(app)
      .post(`/api/incidents/${incidentId}/tasks`)
      .set("x-user-id", commanderId)
      .send({
        title: "Contain affected host",
        status: "todo",
        priority: "critical",
        dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      });
    const taskId = taskResponse.body.task.id as string;

    await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", commanderId)
      .send({
        title: "Initial access confirmed",
        eventTime: new Date().toISOString(),
        source: "EDR"
      });

    await pool.query("update incidents set updated_at = now() - interval '4 days' where id = $1", [incidentId]);
    await pool.query("update findings set created_at = now() - interval '9 days' where id = $1", [findingId]);
    await pool.query("update tasks set due_at = now() - interval '2 hours' where id = $1", [taskId]);

    const hiddenCaseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Commander Only",
        clientName: "Private",
        status: "open"
      });
    const hiddenCaseId = hiddenCaseResponse.body.case.id as string;

    const hiddenIncidentResponse = await request(app)
      .post(`/api/cases/${hiddenCaseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Hidden Incident",
        status: "open",
        severity: "high"
      });
    const hiddenIncidentId = hiddenIncidentResponse.body.incident.id as string;

    await request(app)
      .post(`/api/incidents/${hiddenIncidentId}/findings`)
      .set("x-user-id", commanderId)
      .send({
        title: "Hidden finding",
        status: "confirmed"
      });

    const response = await request(app)
      .get("/api/dashboard")
      .set("x-user-id", analystId);

    expect(response.status).toBe(200);
    expect(response.body.summary.metrics.totalCases).toBe(1);
    expect(response.body.summary.metrics.openIncidents).toBe(1);
    expect(response.body.summary.metrics.unresolvedFindings).toBe(1);
    expect(response.body.summary.metrics.overdueTasks).toBe(1);
    expect(response.body.summary.metrics.unreadNotifications).toBe(1);
    expect(response.body.summary.sla.staleIncidents).toBe(1);
    expect(response.body.summary.sla.agingFindings).toBe(1);
    expect(response.body.summary.breakdowns.incidentSeverity).toEqual([
      { value: "critical", count: 1 }
    ]);
    expect(response.body.summary.breakdowns.taskStatus).toEqual([
      { value: "todo", count: 1 }
    ]);
    expect(response.body.summary.recentActivity.some((entry: { title: string }) => entry.title === "Hidden finding")).toBe(false);
    expect(response.body.summary.recentActivity.some((entry: { title: string }) => entry.title === "Contain affected host")).toBe(true);
    expect(response.body.summary.activity).toHaveLength(7);
  });

  it("defaults finding and timeline owner to actor on create", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Owner Default Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Owner Default Incident",
        status: "open",
        severity: "medium"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentId, analystId, commanderId);

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", analystId)
      .send({
        title: "Default finding owner",
        status: "draft"
      });

    expect(findingResponse.status).toBe(201);
    expect(findingResponse.body.finding.owner_user_id).toBe(analystId);

    const timelineResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", analystId)
      .send({
        title: "Default timeline owner",
        eventTime: new Date().toISOString()
      });

    expect(timelineResponse.status).toBe(201);
    expect(timelineResponse.body.timelineEvent.owner_user_id).toBe(analystId);
  });

  it("blocks owner changes for findings and timeline events", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Owner Immutable Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);
    await addCaseMember(pool, caseId, analystTwoId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Owner Immutable Incident",
        status: "open",
        severity: "medium"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentId, analystId, commanderId);
    await addIncidentMember(pool, incidentId, analystTwoId, commanderId);

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", analystId)
      .send({
        title: "Immutable finding owner",
        status: "draft"
      });
    const findingId = findingResponse.body.finding.id as string;

    const findingPatchResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/findings/${findingId}`)
      .set("x-user-id", analystId)
      .send({
        ownerUserId: analystTwoId
      });

    expect(findingPatchResponse.status).toBe(400);
    expect(findingPatchResponse.body.error).toBe("Finding owner cannot be changed");

    const timelineResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", analystId)
      .send({
        title: "Immutable timeline owner",
        eventTime: new Date().toISOString()
      });
    const timelineEventId = timelineResponse.body.timelineEvent.id as string;

    const timelinePatchResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/timeline-events/${timelineEventId}`)
      .set("x-user-id", analystId)
      .send({
        ownerUserId: analystTwoId
      });

    expect(timelinePatchResponse.status).toBe(400);
    expect(timelinePatchResponse.body.error).toBe("Timeline event owner cannot be changed");
  });

  it("creates task assignment notifications and blocks cross-incident task links", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Task Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentAResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Task Incident A",
        status: "open",
        severity: "medium"
      });
    const incidentAId = incidentAResponse.body.incident.id as string;

    const incidentBResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Task Incident B",
        status: "open",
        severity: "high"
      });
    const incidentBId = incidentBResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentAId, analystId, commanderId);
    await addIncidentMember(pool, incidentBId, analystId, commanderId);

    const taskResponse = await request(app)
      .post(`/api/incidents/${incidentAId}/tasks`)
      .set("x-user-id", commanderId)
      .send({
        title: "Collect triage evidence",
        status: "todo",
        priority: "high",
        assigneeUserId: analystId
      });

    expect(taskResponse.status).toBe(201);
    const taskId = taskResponse.body.task.id as string;

    const indicatorResponse = await request(app)
      .post(`/api/incidents/${incidentBId}/indicators`)
      .set("x-user-id", analystId)
      .send({
        indicatorType: "url",
        value: "https://bad.example/path"
      });
    const indicatorId = indicatorResponse.body.indicator.id as string;

    const linkResponse = await request(app)
      .post(`/api/incidents/${incidentAId}/tasks/${taskId}/links`)
      .set("x-user-id", commanderId)
      .send({
        entityType: "indicator",
        entityId: indicatorId
      });

    expect(linkResponse.status).toBe(409);
    expect(linkResponse.body.error).toBe("Cross-incident task links are not allowed");

    const notificationsResponse = await request(app)
      .get("/api/notifications")
      .set("x-user-id", analystId);

    expect(notificationsResponse.status).toBe(200);
    expect(
      notificationsResponse.body.notifications.some(
        (notification: { event_type: string }) => notification.event_type === "task.assigned"
      )
    ).toBe(true);
  });

  it("allows an assigned analyst to update their task but not reassign it", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Assigned Task Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);
    await addCaseMember(pool, caseId, analystTwoId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Assigned Task Incident",
        status: "open",
        severity: "medium"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    await addIncidentMember(pool, incidentId, analystId, commanderId);
    await addIncidentMember(pool, incidentId, analystTwoId, commanderId);

    const taskResponse = await request(app)
      .post(`/api/incidents/${incidentId}/tasks`)
      .set("x-user-id", commanderId)
      .send({
        title: "Contain host",
        status: "todo",
        priority: "high",
        assigneeUserId: analystId
      });

    expect(taskResponse.status).toBe(201);
    const taskId = taskResponse.body.task.id as string;

    const assigneeUpdateResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/tasks/${taskId}`)
      .set("x-user-id", analystId)
      .send({
        status: "in_progress",
        description: "Host isolation started."
      });

    expect(assigneeUpdateResponse.status).toBe(200);
    expect(assigneeUpdateResponse.body.task.status).toBe("in_progress");
    expect(assigneeUpdateResponse.body.task.description).toBe("Host isolation started.");

    const assigneeReassignResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/tasks/${taskId}`)
      .set("x-user-id", analystId)
      .send({
        assigneeUserId: analystTwoId
      });

    expect(assigneeReassignResponse.status).toBe(403);
    expect(assigneeReassignResponse.body.error).toBe("Missing permission: task:assign");

    const otherAnalystUpdateResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/tasks/${taskId}`)
      .set("x-user-id", analystTwoId)
      .send({
        status: "done"
      });

    expect(otherAnalystUpdateResponse.status).toBe(403);
    expect(otherAnalystUpdateResponse.body.error).toBe("Missing permission: task:update");
  });

  it("keeps custom tags scoped to their case and exposes seeded ATT&CK tags globally", async () => {
    const caseAResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Case A",
        clientName: "Acme",
        status: "open"
      });
    const caseAId = caseAResponse.body.case.id as string;

    const caseBResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Case B",
        clientName: "Contoso",
        status: "open"
      });
    const caseBId = caseBResponse.body.case.id as string;

    const customTagResponse = await request(app)
      .post(`/api/cases/${caseAId}/custom-tags`)
      .set("x-user-id", commanderId)
      .send({
        name: "Ransomware",
        color: "#ff0000"
      });

    expect(customTagResponse.status).toBe(201);
    const customTagId = customTagResponse.body.customTag.id as string;

    const updateCustomTagResponse = await request(app)
      .patch(`/api/cases/${caseAId}/custom-tags/${customTagId}`)
      .set("x-user-id", commanderId)
      .send({
        color: "#cc0000"
      });

    expect(updateCustomTagResponse.status).toBe(200);
    expect(updateCustomTagResponse.body.customTag.color).toBe("#cc0000");

    const caseATagsResponse = await request(app)
      .get(`/api/cases/${caseAId}/custom-tags`)
      .set("x-user-id", commanderId);

    expect(caseATagsResponse.status).toBe(200);
    expect(caseATagsResponse.body.customTags).toHaveLength(1);
    expect(caseATagsResponse.body.customTags[0].name).toBe("Ransomware");

    const caseBTagsResponse = await request(app)
      .get(`/api/cases/${caseBId}/custom-tags`)
      .set("x-user-id", commanderId);

    expect(caseBTagsResponse.status).toBe(200);
    expect(caseBTagsResponse.body.customTags).toHaveLength(0);

    const attackTagsResponse = await request(app).get("/api/attack-tags");

    expect(attackTagsResponse.status).toBe(200);
    expect(attackTagsResponse.body.attackTags.length).toBeGreaterThan(0);
    expect(
      attackTagsResponse.body.attackTags.some((tag: { attack_id: string }) => tag.attack_id === "T1003")
    ).toBe(true);

    const deleteCustomTagResponse = await request(app)
      .delete(`/api/cases/${caseAId}/custom-tags/${customTagId}`)
      .set("x-user-id", commanderId);

    expect(deleteCustomTagResponse.status).toBe(204);
  });

  it("returns attached tags on finding and timeline lists so the UI can render them", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Tag Visibility Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Tag Visibility Incident",
        status: "open",
        severity: "high"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    const customTagResponse = await request(app)
      .post(`/api/cases/${caseId}/custom-tags`)
      .set("x-user-id", commanderId)
      .send({
        name: "Lateral Movement",
        color: "#2255aa"
      });
    const customTagId = customTagResponse.body.customTag.id as string;

    const attackTagsResponse = await request(app).get("/api/attack-tags");
    const attackTagId = attackTagsResponse.body.attackTags.find((tag: { attack_id: string }) => tag.attack_id === "T1003")?.id as
      | string
      | undefined;
    expect(attackTagId).toBeTruthy();

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", commanderId)
      .send({
        title: "Credential dumping detected",
        status: "confirmed",
        severity: "high"
      });
    const findingId = findingResponse.body.finding.id as string;

    const timelineResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", commanderId)
      .send({
        title: "LSASS access observed",
        eventTime: new Date().toISOString(),
        source: "EDR"
      });
    const timelineEventId = timelineResponse.body.timelineEvent.id as string;

    const attachFindingCustomTagResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings/${findingId}/custom-tags`)
      .set("x-user-id", commanderId)
      .send({ customTagId });
    expect(attachFindingCustomTagResponse.status).toBe(204);

    const attachFindingAttackTagResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings/${findingId}/attack-tags`)
      .set("x-user-id", commanderId)
      .send({ attackTagId });
    expect(attachFindingAttackTagResponse.status).toBe(204);

    const attachTimelineCustomTagResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events/${timelineEventId}/custom-tags`)
      .set("x-user-id", commanderId)
      .send({ customTagId });
    expect(attachTimelineCustomTagResponse.status).toBe(204);

    const attachTimelineAttackTagResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events/${timelineEventId}/attack-tags`)
      .set("x-user-id", commanderId)
      .send({ attackTagId });
    expect(attachTimelineAttackTagResponse.status).toBe(204);

    const findingsListResponse = await request(app)
      .get(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", commanderId);
    expect(findingsListResponse.status).toBe(200);
    expect(findingsListResponse.body.findings[0].custom_tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: customTagId, name: "Lateral Movement" })])
    );
    expect(findingsListResponse.body.findings[0].attack_tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: attackTagId, attack_id: "T1003" })])
    );

    const timelineListResponse = await request(app)
      .get(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", commanderId);
    expect(timelineListResponse.status).toBe(200);
    expect(timelineListResponse.body.timelineEvents[0].custom_tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: customTagId, name: "Lateral Movement" })])
    );
    expect(timelineListResponse.body.timelineEvents[0].attack_tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: attackTagId, attack_id: "T1003" })])
    );
  });

  it("searches incident records by attached tags and returns tag entities in scoped results", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Search Tags Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Search Tags Incident",
        status: "open",
        severity: "high"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    const customTagResponse = await request(app)
      .post(`/api/cases/${caseId}/custom-tags`)
      .set("x-user-id", commanderId)
      .send({
        name: "Beaconing",
        color: "#2244aa"
      });
    const customTagId = customTagResponse.body.customTag.id as string;

    const attackTagsResponse = await request(app).get("/api/attack-tags");
    const attackTagId = attackTagsResponse.body.attackTags.find((tag: { attack_id: string }) => tag.attack_id === "T1003")?.id as
      | string
      | undefined;
    expect(attackTagId).toBeTruthy();

    const findingResponse = await request(app)
      .post(`/api/incidents/${incidentId}/findings`)
      .set("x-user-id", commanderId)
      .send({
        title: "Host artifact review",
        status: "confirmed",
        severity: "medium"
      });
    const findingId = findingResponse.body.finding.id as string;

    const timelineResponse = await request(app)
      .post(`/api/incidents/${incidentId}/timeline-events`)
      .set("x-user-id", commanderId)
      .send({
        title: "Analyst triage step",
        eventTime: new Date().toISOString(),
        source: "Console"
      });
    const timelineEventId = timelineResponse.body.timelineEvent.id as string;

    expect(
      await request(app)
        .post(`/api/incidents/${incidentId}/findings/${findingId}/custom-tags`)
        .set("x-user-id", commanderId)
        .send({ customTagId })
    ).toHaveProperty("status", 204);
    expect(
      await request(app)
        .post(`/api/incidents/${incidentId}/timeline-events/${timelineEventId}/custom-tags`)
        .set("x-user-id", commanderId)
        .send({ customTagId })
    ).toHaveProperty("status", 204);
    expect(
      await request(app)
        .post(`/api/incidents/${incidentId}/findings/${findingId}/attack-tags`)
        .set("x-user-id", commanderId)
        .send({ attackTagId })
    ).toHaveProperty("status", 204);
    expect(
      await request(app)
        .post(`/api/incidents/${incidentId}/timeline-events/${timelineEventId}/attack-tags`)
        .set("x-user-id", commanderId)
        .send({ attackTagId })
    ).toHaveProperty("status", 204);

    const customTagSearchResponse = await request(app)
      .get(`/api/search?q=beacon&incidentId=${incidentId}`)
      .set("x-user-id", commanderId);

    expect(customTagSearchResponse.status).toBe(200);
    expect(customTagSearchResponse.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: "custom_tag", entity_id: customTagId }),
        expect.objectContaining({ entity_type: "finding", entity_id: findingId }),
        expect.objectContaining({ entity_type: "timeline_event", entity_id: timelineEventId })
      ])
    );

    const attackTagSearchResponse = await request(app)
      .get(`/api/search?q=T1003&incidentId=${incidentId}`)
      .set("x-user-id", commanderId);

    expect(attackTagSearchResponse.status).toBe(200);
    expect(attackTagSearchResponse.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: "attack_tag", entity_id: attackTagId }),
        expect.objectContaining({ entity_type: "finding", entity_id: findingId }),
        expect.objectContaining({ entity_type: "timeline_event", entity_id: timelineEventId })
      ])
    );
  });

  it("manages case and incident membership with notifications", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Membership Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    const addCaseMemberResponse = await request(app)
      .post(`/api/cases/${caseId}/members`)
      .set("x-user-id", commanderId)
      .send({
        userId: analystTwoId,
        caseRole: "member"
      });

    expect(addCaseMemberResponse.status).toBe(204);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Membership Incident",
        status: "open",
        severity: "medium"
      });
    const incidentId = incidentResponse.body.incident.id as string;

    const addIncidentMemberResponse = await request(app)
      .post(`/api/incidents/${incidentId}/members`)
      .set("x-user-id", commanderId)
      .send({
        userId: analystTwoId,
        incidentRole: "analyst"
      });

    expect(addIncidentMemberResponse.status).toBe(204);

    const notificationsResponse = await request(app)
      .get("/api/notifications")
      .set("x-user-id", analystTwoId);

    expect(notificationsResponse.status).toBe(200);
    expect(
      notificationsResponse.body.notifications.some(
        (notification: { event_type: string }) => notification.event_type === "case.member_added"
      )
    ).toBe(true);
    expect(
      notificationsResponse.body.notifications.some(
        (notification: { event_type: string }) => notification.event_type === "incident.member_added"
      )
    ).toBe(true);
  });

  it("supports scoped search and audit log reads", async () => {
    const responseLeadId = randomUUID();
    await insertUser(pool, {
      id: responseLeadId,
      email: "lead@example.com",
      displayName: "Response Lead",
      globalRole: "response_lead"
    });

    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "Search Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "Search Incident",
        status: "open",
        severity: "high"
      });
    const incidentId = incidentResponse.body.incident.id as string;
    await addIncidentMember(pool, incidentId, analystId, commanderId);
    await addCaseMember(pool, caseId, responseLeadId, commanderId);
    await addIncidentMember(pool, incidentId, responseLeadId, commanderId);

    await request(app)
      .post(`/api/incidents/${incidentId}/queries`)
      .set("x-user-id", analystId)
      .send({
        name: "CrowdStrike Hunt",
        language: "spl",
        queryBody: "index=main credential_access"
      });

    const searchResponse = await request(app)
      .get(`/api/search?q=credential&incidentId=${incidentId}`)
      .set("x-user-id", analystId);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ entity_type: "query" })])
    );

    const forbiddenAuditResponse = await request(app)
      .get(`/api/audit-logs?incidentId=${incidentId}`)
      .set("x-user-id", analystId);

    expect(forbiddenAuditResponse.status).toBe(403);

    const auditResponse = await request(app)
      .get(`/api/audit-logs?incidentId=${incidentId}`)
      .set("x-user-id", commanderId);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.auditLogs.length).toBeGreaterThan(0);

    const leadAuditResponse = await request(app)
      .get(`/api/audit-logs?incidentId=${incidentId}`)
      .set("x-user-id", responseLeadId);

    expect(leadAuditResponse.status).toBe(200);
    expect(leadAuditResponse.body.auditLogs.length).toBeGreaterThan(0);
  });

  it("supports update and delete flows for incident records", async () => {
    const caseResponse = await request(app)
      .post("/api/cases")
      .set("x-user-id", commanderId)
      .send({
        caseName: "CRUD Case",
        clientName: "Acme",
        status: "open"
      });
    const caseId = caseResponse.body.case.id as string;

    await addCaseMember(pool, caseId, analystId, commanderId);

    const incidentResponse = await request(app)
      .post(`/api/cases/${caseId}/incidents`)
      .set("x-user-id", commanderId)
      .send({
        name: "CRUD Incident",
        status: "open",
        severity: "low"
      });
    const incidentId = incidentResponse.body.incident.id as string;
    await addIncidentMember(pool, incidentId, analystId, commanderId);

    const systemResponse = await request(app)
      .post(`/api/incidents/${incidentId}/systems`)
      .set("x-user-id", analystId)
      .send({
        hostname: "host-01",
        os: "Windows"
      });
    expect(systemResponse.status).toBe(201);
    const systemId = systemResponse.body.system.id as string;

    const patchSystemResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/systems/${systemId}`)
      .set("x-user-id", analystId)
      .send({
        owner: "SOC",
        notes: "critical asset"
      });
    expect(patchSystemResponse.status).toBe(200);
    expect(patchSystemResponse.body.system.owner).toBe("SOC");

    const deleteSystemResponse = await request(app)
      .delete(`/api/incidents/${incidentId}/systems/${systemId}`)
      .set("x-user-id", commanderId);
    expect(deleteSystemResponse.status).toBe(204);

    const accountResponse = await request(app)
      .post(`/api/incidents/${incidentId}/accounts`)
      .set("x-user-id", analystId)
      .send({
        username: "alice",
        domain: "corp"
      });
    expect(accountResponse.status).toBe(201);
    const accountId = accountResponse.body.account.id as string;

    const patchAccountResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/accounts/${accountId}`)
      .set("x-user-id", analystId)
      .send({
        status: "disabled"
      });
    expect(patchAccountResponse.status).toBe(200);
    expect(patchAccountResponse.body.account.status).toBe("disabled");
  });
});
