import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { runMigrations } from "../db/setup.js";
import {
  completeInvestigationRun,
  createObservation,
  createHypothesis,
  registerEvidence,
  startInvestigationRun,
  updateEvidence
} from "../services/investigationService.js";
import type { AuthenticatedUser } from "../services/authService.js";
import { updateFinding } from "../services/findingService.js";
import type { Database } from "../db/types.js";

describe("investigation provenance", () => {
  let pool: Database;
  let user: AuthenticatedUser;
  let caseId: string;
  let incidentId: string;

  beforeEach(async () => {
    const memory = newDb();
    const adapter = memory.adapters.createPg();
    pool = new adapter.Pool();
    await runMigrations(pool);
    user = {
      id: randomUUID(), username: "analyst", email: "analyst@local", displayName: "Analyst",
      globalRole: "analyst", status: "active", mustChangePassword: false, isBootstrapAdmin: false
    };
    caseId = randomUUID();
    incidentId = randomUUID();
    await pool.query(
      "insert into users (id, username, email, display_name, global_role, status) values ($1, $2, $3, $4, $5, 'active')",
      [user.id, user.username, user.email, user.displayName, user.globalRole]
    );
    await pool.query(
      "insert into cases (id, case_name, status, created_by_user_id) values ($1, 'Case A', 'open', $2)",
      [caseId, user.id]
    );
    await pool.query(
      "insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'analyst', $2)",
      [caseId, user.id]
    );
    await pool.query(
      "insert into incidents (id, case_id, name, status, created_by_user_id) values ($1, $2, 'Incident A', 'open', $3)",
      [incidentId, caseId, user.id]
    );
  });

  it("builds an observation only from evidence in the active run case", async () => {
    const run = await startInvestigationRun(pool, user, {
      caseId, objective: "Trace initial access", clientName: "test-client"
    });
    const evidence = await registerEvidence(pool, user, {
      runId: run.id, incidentId, evidenceType: "log", title: "Authentication log", sourceLocator: "opaque://log/1"
    });
    const observation = await createObservation(pool, user, {
      runId: run.id, incidentId, title: "Unusual login", description: "Login outside baseline", evidenceIds: [evidence.id]
    });

    expect(observation.evidenceIds).toEqual([evidence.id]);

    await completeInvestigationRun(pool, user, run.id, { status: "completed", summary: "Reviewed" });
    await expect(registerEvidence(pool, user, {
      runId: run.id, evidenceType: "log", title: "Late evidence"
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects observations without evidence support", async () => {
    const run = await startInvestigationRun(pool, user, { caseId, objective: "Validate alert" });
    await expect(createObservation(pool, user, {
      runId: run.id, title: "Unsupported", description: "No source", evidenceIds: []
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("preserves audited evidence edits after a run completes", async () => {
    const run = await startInvestigationRun(pool, user, { caseId, objective: "Preserve source history" });
    const evidence = await registerEvidence(pool, user, { runId: run.id, evidenceType: "disk", title: "Original", hashes: { sha256: "one" } });
    await completeInvestigationRun(pool, user, run.id, { status: "completed" });
    const updated = await updateEvidence(pool, user, evidence.id, { title: "Corrected", hashes: { sha256: "two" } }, { requireActiveRun: false });
    expect(updated.title).toBe("Corrected");
    const audit = await pool.query<{ before_json: { title: string }; after_json: { title: string } }>(
      "select before_json,after_json from audit_logs where entity_id=$1 and action='evidence.update'",
      [evidence.id]
    );
    expect(audit.rows[0].before_json.title).toBe("Original");
    expect(audit.rows[0].after_json.title).toBe("Corrected");
  });

  it("builds hypotheses from same-case observations and rejects cross-case support", async () => {
    const run = await startInvestigationRun(pool, user, { caseId, objective: "Test competing explanations" });
    const evidence = await registerEvidence(pool, user, { runId: run.id, evidenceType: "log", title: "Source" });
    const observation = await createObservation(pool, user, { runId: run.id, title: "Observed", description: "Fact", evidenceIds: [evidence.id] });
    const hypothesis = await createHypothesis(pool, user, { runId: run.id, title: "Likely cause", description: "Explanation", observationIds: [observation.id] });
    expect(hypothesis.observationIds).toEqual([observation.id]);

    const otherCaseId = randomUUID();
    await pool.query("insert into cases (id,case_name,status,created_by_user_id) values ($1,'Other','open',$2)", [otherCaseId, user.id]);
    await pool.query("insert into case_members (case_id,user_id,case_role,added_by_user_id) values ($1,$2,'analyst',$2)", [otherCaseId, user.id]);
    const otherRun = await startInvestigationRun(pool, user, { caseId: otherCaseId, objective: "Other" });
    await expect(createHypothesis(pool, user, { runId: otherRun.id, title: "Cross case", description: "Invalid", observationIds: [observation.id] }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("prevents confirmation when an agent finding has no complete support chain", async () => {
    await pool.query(
      "insert into incident_members (incident_id,user_id,incident_role,added_by_user_id) values ($1,$2,'analyst',$2)",
      [incidentId, user.id]
    );
    const findingId = randomUUID();
    await pool.query(
      `insert into findings (id,incident_id,title,status,owner_user_id,created_by_user_id,created_by_agent)
       values ($1,$2,'Unsupported agent draft','draft',$3,$3,true)`,
      [findingId, incidentId, user.id]
    );

    await expect(updateFinding(pool, user, incidentId, findingId, { status: "confirmed" }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
