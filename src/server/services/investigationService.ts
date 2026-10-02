import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { requireCaseMembership, requireCasePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "./authService.js";
import { createAuditLog } from "./auditLogService.js";
import { withTransaction } from "../db/transaction.js";
import { createFinding, updateFinding } from "./findingService.js";

const MAX_PAGE_SIZE = 100;

interface RunRow {
  id: string;
  case_id: string;
  objective: string;
  status: "active" | "completed" | "failed" | "cancelled";
  initiated_by_token_id: string | null;
  initiated_by_user_id: string;
  client_name: string | null;
  summary: string | null;
  started_at: Date | string;
  completed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface EvidenceRow {
  id: string;
  case_id: string;
  incident_id: string | null;
  run_id: string;
  evidence_type: string;
  title: string;
  description: string | null;
  source_locator: string | null;
  hashes_json: unknown;
  size_bytes: number | string | null;
  mime_type: string | null;
  collected_at: Date | string | null;
  metadata_json: unknown;
  created_by_user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ObservationRow {
  id: string;
  case_id: string;
  incident_id: string | null;
  run_id: string;
  title: string;
  description: string;
  observed_at: Date | string | null;
  created_by_user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface HypothesisRow {
  id: string;
  case_id: string;
  incident_id: string | null;
  run_id: string;
  title: string;
  description: string;
  status: "open" | "supported" | "rejected";
  created_by_user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export async function startInvestigationRun(
  database: Database,
  user: AuthenticatedUser,
  input: { caseId: string; objective: string; tokenId?: string | null; clientName?: string | null }
) {
  await requireCasePermission(database, user, input.caseId, "investigation:write");
  if (!input.objective.trim()) {
    throw new AppError(400, "Investigation objective is required.");
  }
  const id = randomUUID();
  const result = await database.query<RunRow>(
    `insert into investigation_runs (
       id, case_id, objective, status, initiated_by_token_id, initiated_by_user_id, client_name
     ) values ($1, $2, $3, 'active', $4, $5, $6) returning *`,
    [id, input.caseId, input.objective.trim(), input.tokenId ?? null, user.id, input.clientName ?? null]
  );
  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: input.caseId,
    action: "investigation_run.create",
    entityType: "investigation_run",
    entityId: id,
    afterJson: result.rows[0]
  });
  return mapRun(result.rows[0]);
}

export async function completeInvestigationRun(
  database: Database,
  user: AuthenticatedUser,
  runId: string,
  input: { status: "completed" | "failed" | "cancelled"; summary?: string | null }
) {
  const run = await requireActiveRun(database, user, runId);
  const result = await database.query<RunRow>(
    `update investigation_runs set status = $2, summary = $3, completed_at = now(), updated_at = now()
     where id = $1 returning *`,
    [runId, input.status, input.summary ?? null]
  );
  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: run.case_id,
    action: "investigation_run.complete",
    entityType: "investigation_run",
    entityId: runId,
    beforeJson: run,
    afterJson: result.rows[0]
  });
  return mapRun(result.rows[0]);
}

export async function listInvestigationRuns(
  database: Database,
  user: AuthenticatedUser,
  filters: { caseId: string; incidentId?: string; status?: string; limit?: number; offset?: number }
) {
  await requireCasePermission(database, user, filters.caseId, "investigation:read");
  const { limit, offset } = page(filters);
  const params: unknown[] = [filters.caseId];
  const conditions = ["r.case_id = $1"];
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (filters.incidentId) {
    await requireIncidentInCase(database, filters.incidentId, filters.caseId);
    params.push(filters.incidentId);
    conditions.push(`exists (
      select 1 from evidence_records e where e.run_id = r.id and e.incident_id = $${params.length}
      union select 1 from observations o where o.run_id = r.id and o.incident_id = $${params.length}
      union select 1 from hypotheses h where h.run_id = r.id and h.incident_id = $${params.length}
    )`);
  }
  params.push(limit, offset);
  const result = await database.query<RunRow>(
    `select r.* from investigation_runs r where ${conditions.join(" and ")}
     order by r.created_at desc limit $${params.length - 1} offset $${params.length}`,
    params
  );
  return { items: result.rows.map(mapRun), limit, offset };
}

export async function getInvestigationRun(database: Database, user: AuthenticatedUser, runId: string) {
  const run = await getRunRow(database, runId);
  await requireCasePermission(database, user, run.case_id, "investigation:read");
  return mapRun(run);
}

export async function registerEvidence(
  database: Database,
  user: AuthenticatedUser,
  input: {
    runId: string;
    incidentId?: string | null;
    evidenceType: string;
    title: string;
    description?: string | null;
    sourceLocator?: string | null;
    hashes?: Record<string, string>;
    sizeBytes?: number | null;
    mimeType?: string | null;
    collectedAt?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const run = await requireActiveRun(database, user, input.runId);
  await validateIncident(database, input.incidentId, run.case_id);
  if (!input.evidenceType.trim() || !input.title.trim()) {
    throw new AppError(400, "Evidence type and title are required.");
  }
  const id = randomUUID();
  const result = await database.query<EvidenceRow>(
    `insert into evidence_records (
       id, case_id, incident_id, run_id, evidence_type, title, description, source_locator,
       hashes_json, size_bytes, mime_type, collected_at, metadata_json, created_by_user_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13::jsonb,$14) returning *`,
    [id, run.case_id, input.incidentId ?? null, input.runId, input.evidenceType.trim(), input.title.trim(),
      input.description ?? null, input.sourceLocator ?? null, JSON.stringify(input.hashes ?? {}), input.sizeBytes ?? null,
      input.mimeType ?? null, input.collectedAt ?? null, JSON.stringify(input.metadata ?? {}), user.id]
  );
  await createAuditLog(database, {
    actorUserId: user.id, caseId: run.case_id, incidentId: input.incidentId,
    action: "evidence.create", entityType: "evidence", entityId: id, afterJson: result.rows[0]
  });
  return mapEvidence(result.rows[0]);
}

export async function updateEvidence(
  database: Database,
  user: AuthenticatedUser,
  evidenceId: string,
  input: Partial<Omit<Parameters<typeof registerEvidence>[2], "runId" | "incidentId">>,
  options: { requireActiveRun?: boolean } = {}
) {
  const existing = await getEvidenceRow(database, evidenceId);
  if (options.requireActiveRun === false) await requireCasePermission(database, user, existing.case_id, "investigation:write");
  else await requireActiveRun(database, user, existing.run_id);
  const next = {
    evidence_type: input.evidenceType ?? existing.evidence_type,
    title: input.title ?? existing.title,
    description: input.description === undefined ? existing.description : input.description,
    source_locator: input.sourceLocator === undefined ? existing.source_locator : input.sourceLocator,
    hashes_json: input.hashes === undefined ? existing.hashes_json : input.hashes,
    size_bytes: input.sizeBytes === undefined ? existing.size_bytes : input.sizeBytes,
    mime_type: input.mimeType === undefined ? existing.mime_type : input.mimeType,
    collected_at: input.collectedAt === undefined ? existing.collected_at : input.collectedAt,
    metadata_json: input.metadata === undefined ? existing.metadata_json : input.metadata
  };
  const result = await database.query<EvidenceRow>(
    `update evidence_records set evidence_type=$2,title=$3,description=$4,source_locator=$5,
       hashes_json=$6::jsonb,size_bytes=$7,mime_type=$8,collected_at=$9,metadata_json=$10::jsonb,updated_at=now()
     where id=$1 returning *`,
    [evidenceId, next.evidence_type, next.title, next.description, next.source_locator, JSON.stringify(next.hashes_json),
      next.size_bytes, next.mime_type, next.collected_at, JSON.stringify(next.metadata_json)]
  );
  await createAuditLog(database, {
    actorUserId: user.id, caseId: existing.case_id, incidentId: existing.incident_id,
    action: "evidence.update", entityType: "evidence", entityId: evidenceId,
    beforeJson: existing, afterJson: result.rows[0]
  });
  return mapEvidence(result.rows[0]);
}

export async function listEvidence(
  database: Database,
  user: AuthenticatedUser,
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number }
) {
  return listRecords<EvidenceRow, ReturnType<typeof mapEvidence>>(database, user, "evidence_records", filters, mapEvidence);
}

export async function getEvidence(database: Database, user: AuthenticatedUser, evidenceId: string) {
  const row = await getEvidenceRow(database, evidenceId);
  await requireCasePermission(database, user, row.case_id, "investigation:read");
  return mapEvidence(row);
}

export async function createObservation(
  database: Database,
  user: AuthenticatedUser,
  input: {
    runId: string; incidentId?: string | null; title: string; description: string;
    observedAt?: string | null; evidenceIds: string[];
  }
) {
  const run = await requireActiveRun(database, user, input.runId);
  await validateIncident(database, input.incidentId, run.case_id);
  await validateEvidenceSupport(database, run.case_id, input.evidenceIds);
  return withTransaction(database, async (transaction) => {
    const id = randomUUID();
    const result = await transaction.query<ObservationRow>(
      `insert into observations (id,case_id,incident_id,run_id,title,description,observed_at,created_by_user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [id, run.case_id, input.incidentId ?? null, input.runId, input.title.trim(), input.description.trim(), input.observedAt ?? null, user.id]
    );
    for (const evidenceId of unique(input.evidenceIds)) {
      await transaction.query("insert into observation_evidence (observation_id,evidence_id) values ($1,$2)", [id, evidenceId]);
    }
    await createAuditLog(transaction, {
      actorUserId: user.id, caseId: run.case_id, incidentId: input.incidentId,
      action: "observation.create", entityType: "observation", entityId: id,
      afterJson: { ...result.rows[0], evidenceIds: unique(input.evidenceIds) }
    });
    return { ...mapObservation(result.rows[0]), evidenceIds: unique(input.evidenceIds) };
  });
}

export async function updateObservation(
  database: Database,
  user: AuthenticatedUser,
  observationId: string,
  input: { title?: string; description?: string; observedAt?: string | null; evidenceIds?: string[] },
  options: { requireActiveRun?: boolean } = {}
) {
  const existing = await getObservationRow(database, observationId);
  if (options.requireActiveRun === false) await requireCasePermission(database, user, existing.case_id, "investigation:write");
  else await requireActiveRun(database, user, existing.run_id);
  const priorEvidenceIds = await getLinkIds(database, "observation_evidence", "observation_id", "evidence_id", observationId);
  const evidenceIds = input.evidenceIds ?? priorEvidenceIds;
  await validateEvidenceSupport(database, existing.case_id, evidenceIds);
  return withTransaction(database, async (transaction) => {
    const result = await transaction.query<ObservationRow>(
      `update observations set title=$2,description=$3,observed_at=$4,updated_at=now() where id=$1 returning *`,
      [observationId, input.title ?? existing.title, input.description ?? existing.description,
        input.observedAt === undefined ? existing.observed_at : input.observedAt]
    );
    if (input.evidenceIds) {
      await transaction.query("delete from observation_evidence where observation_id=$1", [observationId]);
      for (const evidenceId of unique(evidenceIds)) {
        await transaction.query("insert into observation_evidence (observation_id,evidence_id) values ($1,$2)", [observationId, evidenceId]);
      }
    }
    await createAuditLog(transaction, {
      actorUserId: user.id, caseId: existing.case_id, incidentId: existing.incident_id,
      action: "observation.update", entityType: "observation", entityId: observationId,
      beforeJson: { ...existing, evidenceIds: priorEvidenceIds }, afterJson: { ...result.rows[0], evidenceIds }
    });
    return { ...mapObservation(result.rows[0]), evidenceIds };
  });
}

export async function listObservations(
  database: Database, user: AuthenticatedUser,
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number }
) {
  const listed = await listRecords<ObservationRow, ReturnType<typeof mapObservation>>(database, user, "observations", filters, mapObservation);
  return { ...listed, items: await Promise.all(listed.items.map(async (item) => ({
    ...item,
    evidenceIds: await getLinkIds(database, "observation_evidence", "observation_id", "evidence_id", item.id)
  }))) };
}

export async function createHypothesis(
  database: Database,
  user: AuthenticatedUser,
  input: { runId: string; incidentId?: string | null; title: string; description: string; status?: HypothesisRow["status"]; observationIds: string[] }
) {
  const run = await requireActiveRun(database, user, input.runId);
  await validateIncident(database, input.incidentId, run.case_id);
  await validateObservationSupport(database, run.case_id, input.observationIds);
  return withTransaction(database, async (transaction) => {
    const id = randomUUID();
    const result = await transaction.query<HypothesisRow>(
      `insert into hypotheses (id,case_id,incident_id,run_id,title,description,status,created_by_user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [id, run.case_id, input.incidentId ?? null, input.runId, input.title.trim(), input.description.trim(), input.status ?? "open", user.id]
    );
    for (const observationId of unique(input.observationIds)) {
      await transaction.query("insert into hypothesis_observations (hypothesis_id,observation_id) values ($1,$2)", [id, observationId]);
    }
    await createAuditLog(transaction, {
      actorUserId: user.id, caseId: run.case_id, incidentId: input.incidentId,
      action: "hypothesis.create", entityType: "hypothesis", entityId: id,
      afterJson: { ...result.rows[0], observationIds: unique(input.observationIds) }
    });
    return { ...mapHypothesis(result.rows[0]), observationIds: unique(input.observationIds) };
  });
}

export async function updateHypothesis(
  database: Database,
  user: AuthenticatedUser,
  hypothesisId: string,
  input: { title?: string; description?: string; status?: HypothesisRow["status"]; observationIds?: string[] },
  options: { requireActiveRun?: boolean } = {}
) {
  const existing = await getHypothesisRow(database, hypothesisId);
  if (options.requireActiveRun === false) await requireCasePermission(database, user, existing.case_id, "investigation:write");
  else await requireActiveRun(database, user, existing.run_id);
  const priorObservationIds = await getLinkIds(database, "hypothesis_observations", "hypothesis_id", "observation_id", hypothesisId);
  const observationIds = input.observationIds ?? priorObservationIds;
  await validateObservationSupport(database, existing.case_id, observationIds);
  return withTransaction(database, async (transaction) => {
    const result = await transaction.query<HypothesisRow>(
      `update hypotheses set title=$2,description=$3,status=$4,updated_at=now() where id=$1 returning *`,
      [hypothesisId, input.title ?? existing.title, input.description ?? existing.description, input.status ?? existing.status]
    );
    if (input.observationIds) {
      await transaction.query("delete from hypothesis_observations where hypothesis_id=$1", [hypothesisId]);
      for (const observationId of unique(observationIds)) {
        await transaction.query("insert into hypothesis_observations (hypothesis_id,observation_id) values ($1,$2)", [hypothesisId, observationId]);
      }
    }
    await createAuditLog(transaction, {
      actorUserId: user.id, caseId: existing.case_id, incidentId: existing.incident_id,
      action: "hypothesis.update", entityType: "hypothesis", entityId: hypothesisId,
      beforeJson: { ...existing, observationIds: priorObservationIds }, afterJson: { ...result.rows[0], observationIds }
    });
    return { ...mapHypothesis(result.rows[0]), observationIds };
  });
}

export async function listHypotheses(
  database: Database, user: AuthenticatedUser,
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number }
) {
  const listed = await listRecords<HypothesisRow, ReturnType<typeof mapHypothesis>>(database, user, "hypotheses", filters, mapHypothesis);
  return { ...listed, items: await Promise.all(listed.items.map(async (item) => ({
    ...item,
    observationIds: await getLinkIds(database, "hypothesis_observations", "hypothesis_id", "observation_id", item.id)
  }))) };
}

export async function createDraftFinding(
  database: Database,
  user: AuthenticatedUser,
  input: {
    runId: string; incidentId: string; title: string; description?: string; severity?: string;
    confidence?: string; impact?: string; recommendation?: string; observationIds: string[];
  }
) {
  const run = await requireActiveRun(database, user, input.runId);
  await requireIncidentInCase(database, input.incidentId, run.case_id);
  await validateObservationSupport(database, run.case_id, input.observationIds);
  const finding = await createFinding(database, user, {
    incidentId: input.incidentId, title: input.title, description: input.description,
    severity: input.severity, status: "draft", confidence: input.confidence,
    impact: input.impact, recommendation: input.recommendation
  });
  await database.query(
    "update findings set created_by_agent=true, investigation_run_id=$2 where id=$1",
    [finding.id, input.runId]
  );
  for (const observationId of unique(input.observationIds)) {
    await database.query("insert into finding_observations (finding_id,observation_id) values ($1,$2)", [finding.id, observationId]);
  }
  return { ...camelizeRow(finding), createdByAgent: true, investigationRunId: input.runId, observationIds: unique(input.observationIds) };
}

export async function updateDraftFinding(
  database: Database,
  user: AuthenticatedUser,
  findingId: string,
  input: {
    runId: string; incidentId: string; title?: string; description?: string; severity?: string;
    confidence?: string; impact?: string; recommendation?: string; observationIds?: string[];
  }
) {
  const run = await requireActiveRun(database, user, input.runId);
  await requireIncidentInCase(database, input.incidentId, run.case_id);
  const existing = await database.query<{ created_by_agent: boolean; status: string; investigation_run_id: string }>(
    "select created_by_agent,status,investigation_run_id from findings where id=$1 and incident_id=$2",
    [findingId, input.incidentId]
  );
  if (!existing.rowCount || !existing.rows[0].created_by_agent || existing.rows[0].status !== "draft") {
    throw new AppError(409, "Only agent-created draft findings can be updated by MCP.");
  }
  if (existing.rows[0].investigation_run_id !== input.runId) {
    throw new AppError(409, "Finding belongs to a different investigation run.");
  }
  const priorIds = await getLinkIds(database, "finding_observations", "finding_id", "observation_id", findingId);
  const observationIds = input.observationIds ?? priorIds;
  await validateObservationSupport(database, run.case_id, observationIds);
  const finding = await updateFinding(database, user, input.incidentId, findingId, {
    title: input.title, description: input.description, severity: input.severity,
    confidence: input.confidence, impact: input.impact, recommendation: input.recommendation
  });
  if (input.observationIds) {
    await database.query("delete from finding_observations where finding_id=$1", [findingId]);
    for (const observationId of unique(observationIds)) {
      await database.query("insert into finding_observations (finding_id,observation_id) values ($1,$2)", [findingId, observationId]);
    }
  }
  return { ...camelizeRow(finding), observationIds };
}

export async function listInvestigationFindings(
  database: Database,
  user: AuthenticatedUser,
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number }
) {
  await requireCasePermission(database, user, filters.caseId, "investigation:read");
  const { limit, offset } = page(filters);
  const params: unknown[] = [filters.caseId];
  const conditions = ["i.case_id=$1", "f.created_by_agent=true"];
  if (filters.incidentId) { params.push(filters.incidentId); conditions.push(`f.incident_id=$${params.length}`); }
  if (filters.runId) { params.push(filters.runId); conditions.push(`f.investigation_run_id=$${params.length}`); }
  params.push(limit, offset);
  const result = await database.query(
    `select f.* from findings f join incidents i on i.id=f.incident_id
     where ${conditions.join(" and ")} order by f.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );
  return { items: await Promise.all(result.rows.map(async (row) => ({
    ...camelizeRow(row),
    observationIds: await getLinkIds(database, "finding_observations", "finding_id", "observation_id", row.id)
  }))), limit, offset };
}

export async function requireRunIncident(database: Database, user: AuthenticatedUser, runId: string, incidentId: string) {
  const run = await requireActiveRun(database, user, runId);
  await requireIncidentInCase(database, incidentId, run.case_id);
  return run;
}

export async function requireActiveRun(database: Database, user: AuthenticatedUser, runId: string) {
  const run = await getRunRow(database, runId);
  await requireCasePermission(database, user, run.case_id, "investigation:write");
  if (run.status !== "active") {
    throw new AppError(409, "Investigation run is not active.");
  }
  return run;
}

async function getRunRow(database: Database, runId: string) {
  const result = await database.query<RunRow>("select * from investigation_runs where id=$1", [runId]);
  if (result.rowCount === 0) throw new AppError(404, "Investigation run not found.");
  return result.rows[0];
}

async function getEvidenceRow(database: Database, id: string) {
  const result = await database.query<EvidenceRow>("select * from evidence_records where id=$1", [id]);
  if (result.rowCount === 0) throw new AppError(404, "Evidence not found.");
  return result.rows[0];
}

async function getObservationRow(database: Database, id: string) {
  const result = await database.query<ObservationRow>("select * from observations where id=$1", [id]);
  if (result.rowCount === 0) throw new AppError(404, "Observation not found.");
  return result.rows[0];
}

async function getHypothesisRow(database: Database, id: string) {
  const result = await database.query<HypothesisRow>("select * from hypotheses where id=$1", [id]);
  if (result.rowCount === 0) throw new AppError(404, "Hypothesis not found.");
  return result.rows[0];
}

async function validateIncident(database: Database, incidentId: string | null | undefined, caseId: string) {
  if (incidentId) await requireIncidentInCase(database, incidentId, caseId);
}

async function requireIncidentInCase(database: Database, incidentId: string, caseId: string) {
  const result = await database.query("select 1 from incidents where id=$1 and case_id=$2", [incidentId, caseId]);
  if (result.rowCount === 0) throw new AppError(404, "Incident not found in investigation case.");
}

async function validateEvidenceSupport(database: Database, caseId: string, ids: string[]) {
  const supportIds = unique(ids);
  if (supportIds.length === 0) throw new AppError(400, "At least one supporting evidence record is required.");
  const placeholders = supportIds.map((_, index) => `$${index + 2}`).join(",");
  const result = await database.query<{ id: string }>(
    `select id from evidence_records where case_id=$1 and id in (${placeholders})`,
    [caseId, ...supportIds]
  );
  if (result.rowCount !== supportIds.length) throw new AppError(409, "Evidence support must belong to the same case.");
}

async function validateObservationSupport(database: Database, caseId: string, ids: string[]) {
  const supportIds = unique(ids);
  if (supportIds.length === 0) throw new AppError(400, "At least one supporting observation is required.");
  const placeholders = supportIds.map((_, index) => `$${index + 2}`).join(",");
  const result = await database.query<{ id: string }>(
    `select id from observations where case_id=$1 and id in (${placeholders})`,
    [caseId, ...supportIds]
  );
  if (result.rowCount !== supportIds.length) throw new AppError(409, "Observation support must belong to the same case.");
}

async function listRecords<Row extends { case_id: string; incident_id: string | null; run_id: string; created_at: Date | string }, Mapped>(
  database: Database,
  user: AuthenticatedUser,
  table: "evidence_records" | "observations" | "hypotheses",
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number },
  mapper: (row: Row) => Mapped
) {
  await requireCasePermission(database, user, filters.caseId, "investigation:read");
  const { limit, offset } = page(filters);
  const params: unknown[] = [filters.caseId];
  const conditions = ["case_id=$1"];
  if (filters.incidentId) {
    await requireIncidentInCase(database, filters.incidentId, filters.caseId);
    params.push(filters.incidentId);
    conditions.push(`incident_id=$${params.length}`);
  }
  if (filters.runId) {
    params.push(filters.runId);
    conditions.push(`run_id=$${params.length}`);
  }
  params.push(limit, offset);
  const result = await database.query<Row>(
    `select * from ${table} where ${conditions.join(" and ")} order by created_at desc limit $${params.length - 1} offset $${params.length}`,
    params
  );
  return { items: result.rows.map(mapper), limit, offset };
}

async function getLinkIds(
  database: Database,
  table: "observation_evidence" | "hypothesis_observations" | "finding_observations",
  ownerColumn: string,
  targetColumn: string,
  ownerId: string
) {
  const result = await database.query<Record<string, string>>(
    `select ${targetColumn} from ${table} where ${ownerColumn}=$1 order by ${targetColumn}`,
    [ownerId]
  );
  return result.rows.map((row) => row[targetColumn]);
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}

function page(input: { limit?: number; offset?: number }) {
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, input.limit ?? 50));
  const offset = Math.max(0, input.offset ?? 0);
  return { limit, offset };
}

function mapRun(row: RunRow) {
  return { id: row.id, caseId: row.case_id, objective: row.objective, status: row.status,
    initiatedByTokenId: row.initiated_by_token_id, initiatedByUserId: row.initiated_by_user_id,
    clientName: row.client_name, summary: row.summary, startedAt: row.started_at,
    completedAt: row.completed_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapEvidence(row: EvidenceRow) {
  return { id: row.id, caseId: row.case_id, incidentId: row.incident_id, runId: row.run_id,
    evidenceType: row.evidence_type, title: row.title, description: row.description,
    sourceLocator: row.source_locator, hashes: row.hashes_json, sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
    mimeType: row.mime_type, collectedAt: row.collected_at, metadata: row.metadata_json,
    createdByUserId: row.created_by_user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapObservation(row: ObservationRow) {
  return { id: row.id, caseId: row.case_id, incidentId: row.incident_id, runId: row.run_id,
    title: row.title, description: row.description, observedAt: row.observed_at,
    createdByUserId: row.created_by_user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapHypothesis(row: HypothesisRow) {
  return { id: row.id, caseId: row.case_id, incidentId: row.incident_id, runId: row.run_id,
    title: row.title, description: row.description, status: row.status,
    createdByUserId: row.created_by_user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

function camelizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value
  ]));
}
