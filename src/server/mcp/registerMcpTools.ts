import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { AppError, isAppError } from "../errors.js";
import { requireCasePermission, requirePermission } from "../permissions/permissionService.js";
import { executeAgentAction } from "../services/agentActionService.js";
import { listCases } from "../services/caseService.js";
import { listIncidentsForCase } from "../services/incidentService.js";
import { listCaseMembers } from "../services/membershipService.js";
import { caseSearchFields, filterDiscoveryRows, incidentSearchFields } from "../services/discovery.js";
import type { McpPrincipal } from "../services/mcpTokenService.js";
import {
  completeInvestigationRun, createDraftFinding, createHypothesis, createObservation, getEvidence,
  getInvestigationRun, listEvidence, listHypotheses, listInvestigationFindings, listInvestigationRuns,
  listObservations, registerEvidence, requireRunIncident, startInvestigationRun, updateDraftFinding,
  updateEvidence, updateHypothesis, updateObservation
} from "../services/investigationService.js";
import { createTimelineEvent, updateTimelineEvent } from "../services/timelineEventService.js";
import { createSystem, updateSystem } from "../services/systemService.js";
import { createAccount, updateAccount } from "../services/accountService.js";
import { createIndicator, updateIndicator } from "../services/indicatorService.js";
import { createTask, updateTask } from "../services/taskService.js";
import { createEntityLink, listEntityLinks } from "../graph/entityLinksRepository.js";

const uuid = z.string().uuid();
const caseIdSchema = uuid.describe("Case UUID: use items[].id returned by list_cases. Search by name or client first; never guess an ID.");
const incidentIdSchema = uuid.describe("Incident UUID: use items[].id returned by list_incidents for the selected case.");
const runIdSchema = uuid.describe("Run UUID: use id returned by start_investigation_run or items[].id from list_investigation_runs.");
const querySchema = z.string().trim().max(200).optional().describe("Optional literal, case-insensitive text search. Empty text lists all accessible matches.");
const pageSchema = { limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() };
const writeBase = { idempotencyKey: z.string().trim().min(1), runId: runIdSchema };

interface RegistrationContext {
  database: Database;
  principal: McpPrincipal;
  clientName: string;
}

export function createForenotesMcpServer(context: RegistrationContext) {
  const server = new McpServer({ name: "forenotes", version: "1.0.0" });
  const register = (
    name: string,
    description: string,
    schema: z.ZodObject<z.ZodRawShape>,
    write: boolean,
    handler: (database: Database, input: Record<string, unknown>) => Promise<unknown>
  ) => {
    server.registerTool(name, { description, inputSchema: schema }, async (rawInput) => {
      const input = rawInput as Record<string, unknown>;
      try {
        const result = await executeAgentAction(context.database, {
          principal: context.principal,
          clientName: context.clientName,
          runId: typeof input.runId === "string" ? input.runId : null,
          toolName: name,
          input,
          idempotencyKey: typeof input.idempotencyKey === "string" ? input.idempotencyKey : undefined,
          write
        }, async (database) => {
          if (write && context.principal.accessToken.scope !== "read_write") {
            throw new AppError(403, "MCP token is read-only.");
          }
          return handler(database, input);
        });
        const structuredContent = asStructuredContent(result);
        return { content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }], structuredContent };
      } catch (error) {
        const normalized = normalizeError(error);
        return {
          isError: true,
          content: [{ type: "text" as const, text: normalized.message }],
          structuredContent: { error: normalized }
        };
      }
    });
  };

  register("list_cases", "Discover accessible cases by case name, client name, or summary. Returns items with id, caseName, clientName, status, and summary. Use a selected item's id as caseId. If names are ambiguous, inspect context or ask the user before writing.", z.object({ query: querySchema, ...pageSchema }), false, async (database, input) => {
    await requirePermission(database, context.principal.user, "investigation:read");
    const limit = Math.min(100, Math.max(1, Number(input.limit ?? 50)));
    const offset = Math.max(0, Number(input.offset ?? 0));
    const matches = filterDiscoveryRows(await listCases(database, context.principal.user.id), input.query as string | undefined, caseSearchFields);
    return { items: matches.slice(offset, offset + limit).map(camelize), limit, offset, total: matches.length, hasMore: offset + limit < matches.length };
  });
  register("list_incidents", "Discover accessible incidents in a case by name or summary. Returns items with id, caseId, name, summary, severity, and status. Use a selected item's id as incidentId for get_tasks, get_entities, get_timeline, or writes. Do not choose arbitrarily between duplicate names.", z.object({ caseId: caseIdSchema, query: querySchema, ...pageSchema }), false, async (database, input) => {
    const caseId = input.caseId as string;
    await requireCasePermission(database, context.principal.user, caseId, "investigation:read");
    const limit = Number(input.limit ?? 50);
    const offset = Number(input.offset ?? 0);
    const matches = filterDiscoveryRows(await listIncidentsForCase(database, context.principal.user.id, caseId), input.query as string | undefined, incidentSearchFields);
    return { items: matches.slice(offset, offset + limit).map(camelize), limit, offset, total: matches.length, hasMore: offset + limit < matches.length };
  });
  register("list_case_members", "Discover members of an accessible case by display name or email. Returns items with userId, displayName, email, and caseRole. Use userId as assigneeUserId; assignment still requires membership in the target incident.", z.object({ caseId: caseIdSchema, query: querySchema, ...pageSchema }), false, async (database, input) => {
    const caseId = input.caseId as string;
    await requireCasePermission(database, context.principal.user, caseId, "investigation:read");
    const limit = Number(input.limit ?? 50);
    const offset = Number(input.offset ?? 0);
    const matches = filterDiscoveryRows(await listCaseMembers(database, context.principal.user.id, caseId), input.query as string | undefined, ["display_name", "email"]);
    return { items: matches.slice(offset, offset + limit).map(camelize), limit, offset, total: matches.length, hasMore: offset + limit < matches.length };
  });
  register("get_case", "Get one accessible case.", z.object({ caseId: caseIdSchema }), false, async (database, input) => {
    const caseId = input.caseId as string;
    await requireCasePermission(database, context.principal.user, caseId, "investigation:read");
    const result = await database.query("select * from cases where id=$1", [caseId]);
    if (!result.rowCount) throw new AppError(404, "Case not found.");
    return camelize(result.rows[0]);
  });
  register("search_case", "Search provenance and investigation records inside one case.", z.object({
    caseId: caseIdSchema, query: z.string().trim().min(1), ...pageSchema
  }), false, async (database, input) => searchCase(database, context.principal, input));
  register("list_investigation_runs", "List case investigation runs.", z.object({
    caseId: caseIdSchema, incidentId: incidentIdSchema.optional(), status: z.enum(["active", "completed", "failed", "cancelled"]).optional(), ...pageSchema
  }), false, async (database, input) => listInvestigationRuns(database, context.principal.user, input as never));
  register("get_investigation_run", "Get an investigation run.", z.object({ runId: runIdSchema }), false,
    async (database, input) => getInvestigationRun(database, context.principal.user, input.runId as string));
  register("get_evidence", "List evidence metadata or get one record.", z.object({
    caseId: caseIdSchema.optional(), evidenceId: uuid.describe("Evidence UUID from get_evidence items[].id or register_evidence id.").optional(), incidentId: incidentIdSchema.optional(), runId: runIdSchema.optional(), ...pageSchema
  }).refine((value) => Boolean(value.evidenceId || value.caseId), "caseId or evidenceId is required"), false,
  async (database, input) => input.evidenceId
    ? getEvidence(database, context.principal.user, input.evidenceId as string)
    : listEvidence(database, context.principal.user, input as never));
  register("get_observations", "List observations and their evidence support.", z.object({
    caseId: caseIdSchema, incidentId: incidentIdSchema.optional(), runId: runIdSchema.optional(), ...pageSchema
  }), false, async (database, input) => listObservations(database, context.principal.user, input as never));
  register("get_hypotheses", "List hypotheses and their observation support.", z.object({
    caseId: caseIdSchema, incidentId: incidentIdSchema.optional(), runId: runIdSchema.optional(), ...pageSchema
  }), false, async (database, input) => listHypotheses(database, context.principal.user, input as never));
  register("get_timeline", "List timeline events for an incident.", z.object({ caseId: caseIdSchema, incidentId: incidentIdSchema, ...pageSchema }), false,
    async (database, input) => listIncidentRows(database, context.principal, "timeline_events", input));
  register("get_entities", "List systems, accounts, and indicators for an incident.", z.object({ caseId: caseIdSchema, incidentId: incidentIdSchema, ...pageSchema }), false,
    async (database, input) => getEntities(database, context.principal, input));
  register("get_relationships", "List manual incident entity relationships.", z.object({ caseId: caseIdSchema, incidentId: incidentIdSchema, ...pageSchema }), false,
    async (database, input) => {
      await ensureIncidentCase(database, input.incidentId as string, input.caseId as string);
      const limit = Math.min(100, Math.max(1, Number(input.limit ?? 50)));
      const offset = Math.max(0, Number(input.offset ?? 0));
      return { items: (await listEntityLinks(database, context.principal.user, input.incidentId as string)).slice(offset, offset + limit).map(camelize), limit, offset };
    });
  register("get_findings", "List findings with provenance support.", z.object({ caseId: caseIdSchema, incidentId: incidentIdSchema.optional(), runId: runIdSchema.optional(), ...pageSchema }), false,
    async (database, input) => listInvestigationFindings(database, context.principal.user, input as never));
  register("get_tasks", "List tasks for an incident.", z.object({ caseId: caseIdSchema, incidentId: incidentIdSchema, ...pageSchema }), false,
    async (database, input) => listIncidentRows(database, context.principal, "tasks", input));

  register("start_investigation_run", "Start a case-level investigation run.", z.object({
    idempotencyKey: z.string().trim().min(1), caseId: caseIdSchema, objective: z.string().trim().min(1)
  }), true, async (database, input) => startInvestigationRun(database, context.principal.user, {
    caseId: input.caseId as string, objective: input.objective as string,
    tokenId: context.principal.accessToken.id, clientName: context.clientName
  }));
  register("complete_investigation_run", "Complete, fail, or cancel an active run.", z.object({
    ...writeBase, status: z.enum(["completed", "failed", "cancelled"]), summary: z.string().optional()
  }), true, async (database, input) => completeInvestigationRun(database, context.principal.user, input.runId as string, input as never));
  register("register_evidence", "Register evidence metadata without fetching its locator.", z.object({
    ...writeBase, incidentId: incidentIdSchema.optional(), evidenceType: z.string().min(1), title: z.string().min(1),
    description: z.string().optional(), sourceLocator: z.string().optional(), hashes: z.record(z.string(), z.string()).optional(),
    sizeBytes: z.number().int().nonnegative().optional(), mimeType: z.string().optional(), collectedAt: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }), true, async (database, input) => registerEvidence(database, context.principal.user, input as never));
  register("update_evidence", "Edit evidence metadata with full audit history.", z.object({
    ...writeBase, evidenceId: uuid.describe("Evidence UUID from get_evidence items[].id or register_evidence id."), evidenceType: z.string().min(1).optional(), title: z.string().min(1).optional(),
    description: z.string().nullable().optional(), sourceLocator: z.string().nullable().optional(), hashes: z.record(z.string(), z.string()).optional(),
    sizeBytes: z.number().int().nonnegative().nullable().optional(), mimeType: z.string().nullable().optional(),
    collectedAt: z.string().datetime().nullable().optional(), metadata: z.record(z.string(), z.unknown()).optional()
  }), true, async (database, input) => updateEvidence(database, context.principal.user, input.evidenceId as string, input as never));
  register("create_observation", "Create an evidence-supported observation.", z.object({
    ...writeBase, incidentId: incidentIdSchema.optional(), title: z.string().min(1), description: z.string().min(1),
    observedAt: z.string().datetime().optional(), evidenceIds: z.array(uuid.describe("Evidence UUID from get_evidence or register_evidence, in the same case.")).min(1)
  }), true, async (database, input) => createObservation(database, context.principal.user, input as never));
  register("update_observation", "Update an observation while retaining support.", z.object({
    ...writeBase, observationId: uuid.describe("Observation UUID from get_observations items[].id or create_observation id."), title: z.string().min(1).optional(), description: z.string().min(1).optional(),
    observedAt: z.string().datetime().nullable().optional(), evidenceIds: z.array(uuid.describe("Evidence UUID from get_evidence or register_evidence, in the same case.")).min(1).optional()
  }), true, async (database, input) => updateObservation(database, context.principal.user, input.observationId as string, input as never));
  register("create_hypothesis", "Create an observation-supported hypothesis.", z.object({
    ...writeBase, incidentId: incidentIdSchema.optional(), title: z.string().min(1), description: z.string().min(1),
    status: z.enum(["open", "supported", "rejected"]).optional(), observationIds: z.array(uuid.describe("Observation UUID from get_observations or create_observation, in the same case.")).min(1)
  }), true, async (database, input) => createHypothesis(database, context.principal.user, input as never));
  register("update_hypothesis", "Update a hypothesis while retaining support.", z.object({
    ...writeBase, hypothesisId: uuid.describe("Hypothesis UUID from get_hypotheses items[].id or create_hypothesis id."), title: z.string().min(1).optional(), description: z.string().min(1).optional(),
    status: z.enum(["open", "supported", "rejected"]).optional(), observationIds: z.array(uuid.describe("Observation UUID from get_observations or create_observation, in the same case.")).min(1).optional()
  }), true, async (database, input) => updateHypothesis(database, context.principal.user, input.hypothesisId as string, input as never));
  register("add_timeline_event", "Add an incident timeline event.", z.object({
    ...writeBase, incidentId: incidentIdSchema, eventTime: z.string().datetime(), title: z.string().min(1), description: z.string().optional(),
    source: z.string().optional(), rawEvidenceRef: z.string().optional(), systemId: uuid.describe("System UUID from get_entities systems[].id or create_entity id for a system.").optional(), accountId: uuid.describe("Account UUID from get_entities accounts[].id or create_entity id for an account.").optional()
  }), true, async (database, input) => { await requireRunIncident(database, context.principal.user, input.runId as string, input.incidentId as string); return camelize(await createTimelineEvent(database, context.principal.user, input as never)); });
  register("update_timeline_event", "Update an incident timeline event.", z.object({
    ...writeBase, incidentId: incidentIdSchema, timelineEventId: uuid.describe("Timeline event UUID from get_timeline items[].id or add_timeline_event id."), eventTime: z.string().datetime().optional(), title: z.string().min(1).optional(),
    description: z.string().optional(), source: z.string().optional(), rawEvidenceRef: z.string().optional(), systemId: uuid.describe("System UUID from get_entities systems[].id or create_entity id for a system.").optional(), accountId: uuid.describe("Account UUID from get_entities accounts[].id or create_entity id for an account.").optional()
  }), true, async (database, input) => { await requireRunIncident(database, context.principal.user, input.runId as string, input.incidentId as string); return camelize(await updateTimelineEvent(database, context.principal.user, input.incidentId as string, input.timelineEventId as string, input as never)); });
  register("create_entity", "Create a system, account, or indicator.", entityCreateSchema(), true,
    async (database, input) => createInvestigationEntity(database, context.principal, input));
  register("update_entity", "Update a system, account, or indicator.", entityUpdateSchema(), true,
    async (database, input) => updateInvestigationEntity(database, context.principal, input));
  register("link_entities", "Create a non-destructive relationship between incident entities.", z.object({
    ...writeBase, incidentId: incidentIdSchema, sourceType: z.string().min(1), sourceId: uuid.describe("Source entity UUID from get_entities, get_timeline, get_findings, or get_tasks; match sourceType."), targetType: z.string().min(1), targetId: uuid.describe("Target entity UUID from get_entities, get_timeline, get_findings, or get_tasks; match targetType."), linkType: z.string().min(1)
  }), true, async (database, input) => { await requireRunIncident(database, context.principal.user, input.runId as string, input.incidentId as string); return camelize(await createEntityLink(database, context.principal.user, input as never)); });
  register("create_task", "Create an investigation task.", z.object({
    ...writeBase, incidentId: incidentIdSchema, title: z.string().min(1), description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"), priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    assigneeUserId: uuid.describe("User UUID from list_case_members items[].userId. Must belong to the target incident.").optional(), dueAt: z.string().datetime().optional()
  }), true, async (database, input) => { await requireRunIncident(database, context.principal.user, input.runId as string, input.incidentId as string); return camelize(await createTask(database, context.principal.user, input as never)); });
  register("update_task", "Update an investigation task.", z.object({
    ...writeBase, incidentId: incidentIdSchema, taskId: uuid.describe("Task UUID from get_tasks items[].id or create_task id."), title: z.string().min(1).optional(), description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(), priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    assigneeUserId: uuid.describe("User UUID from list_case_members items[].userId. Must belong to the target incident.").optional(), dueAt: z.string().datetime().nullable().optional()
  }), true, async (database, input) => { await requireRunIncident(database, context.principal.user, input.runId as string, input.incidentId as string); return camelize(await updateTask(database, context.principal.user, input.incidentId as string, input.taskId as string, input as never)); });
  register("create_draft_finding", "Create a human-reviewable supported draft finding.", z.object({
    ...writeBase, incidentId: incidentIdSchema, title: z.string().min(1), description: z.string().optional(), severity: z.string().optional(),
    confidence: z.string().optional(), impact: z.string().optional(), recommendation: z.string().optional(), observationIds: z.array(uuid.describe("Observation UUID from get_observations or create_observation, in the same case.")).min(1)
  }), true, async (database, input) => createDraftFinding(database, context.principal.user, input as never));
  register("update_draft_finding", "Update a supported draft finding without changing its status.", z.object({
    ...writeBase, incidentId: incidentIdSchema, findingId: uuid.describe("Finding UUID from get_findings items[].id or create_draft_finding id."), title: z.string().min(1).optional(), description: z.string().optional(), severity: z.string().optional(),
    confidence: z.string().optional(), impact: z.string().optional(), recommendation: z.string().optional(), observationIds: z.array(uuid.describe("Observation UUID from get_observations or create_observation, in the same case.")).min(1).optional()
  }), true, async (database, input) => updateDraftFinding(database, context.principal.user, input.findingId as string, input as never));

  return server;
}

function entityCreateSchema() {
  return z.object({ ...writeBase, incidentId: incidentIdSchema, entityType: z.enum(["system", "account", "indicator"]),
    hostname: z.string().optional(), ipAddress: z.string().optional(), os: z.string().optional(), status: z.string().optional(), owner: z.string().optional(), notes: z.string().optional(),
    username: z.string().optional(), domain: z.string().optional(), indicatorType: z.string().optional(), value: z.string().optional(),
    description: z.string().optional(), confidence: z.string().optional(), source: z.string().optional(), firstSeenAt: z.string().datetime().optional(), lastSeenAt: z.string().datetime().optional() });
}

function entityUpdateSchema() {
  return entityCreateSchema().partial().required({ idempotencyKey: true, runId: true, incidentId: true, entityType: true }).extend({ entityId: uuid.describe("Entity UUID from get_entities systems/accounts/indicators[].id or create_entity id; match entityType.") });
}

async function createInvestigationEntity(database: Database, principal: McpPrincipal, input: Record<string, unknown>) {
  await requireRunIncident(database, principal.user, input.runId as string, input.incidentId as string);
  if (input.entityType === "system" && !isNonEmptyString(input.hostname)) {
    throw new AppError(400, "hostname is required for system entities.");
  }
  if (input.entityType === "account" && !isNonEmptyString(input.username)) {
    throw new AppError(400, "username is required for account entities.");
  }
  if (input.entityType === "indicator" && (!isNonEmptyString(input.indicatorType) || !isNonEmptyString(input.value))) {
    throw new AppError(400, "indicatorType and value are required for indicator entities.");
  }
  if (input.entityType === "system") return camelize(await createSystem(database, principal.user, input as never));
  if (input.entityType === "account") return camelize(await createAccount(database, principal.user, input as never));
  return camelize(await createIndicator(database, principal.user, input as never));
}

async function updateInvestigationEntity(database: Database, principal: McpPrincipal, input: Record<string, unknown>) {
  await requireRunIncident(database, principal.user, input.runId as string, input.incidentId as string);
  if (input.entityType === "system") return camelize(await updateSystem(database, principal.user, input.incidentId as string, input.entityId as string, input as never));
  if (input.entityType === "account") return camelize(await updateAccount(database, principal.user, input.incidentId as string, input.entityId as string, input as never));
  return camelize(await updateIndicator(database, principal.user, input.incidentId as string, input.entityId as string, input as never));
}

async function getEntities(database: Database, principal: McpPrincipal, input: Record<string, unknown>) {
  const caseId = input.caseId as string;
  const incidentId = input.incidentId as string;
  await requireCasePermission(database, principal.user, caseId, "investigation:read");
  await ensureIncidentCase(database, incidentId, caseId);
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 50)));
  const offset = Math.max(0, Number(input.offset ?? 0));
  const fetchLimit = limit + offset;
  const [systems, accounts, indicators] = await Promise.all([
    database.query("select * from systems where incident_id=$1 order by created_at desc limit $2", [incidentId, fetchLimit]),
    database.query("select * from accounts where incident_id=$1 order by created_at desc limit $2", [incidentId, fetchLimit]),
    database.query("select * from indicators where incident_id=$1 order by created_at desc limit $2", [incidentId, fetchLimit])
  ]);
  const page = [
    ...systems.rows.map((row) => ({ type: "system", row })),
    ...accounts.rows.map((row) => ({ type: "account", row })),
    ...indicators.rows.map((row) => ({ type: "indicator", row }))
  ].sort((left, right) => String(right.row.created_at).localeCompare(String(left.row.created_at))).slice(offset, offset + limit);
  return {
    systems: page.filter((item) => item.type === "system").map((item) => camelize(item.row)),
    accounts: page.filter((item) => item.type === "account").map((item) => camelize(item.row)),
    indicators: page.filter((item) => item.type === "indicator").map((item) => camelize(item.row)),
    limit,
    offset
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function listIncidentRows(database: Database, principal: McpPrincipal, table: "timeline_events" | "tasks", input: Record<string, unknown>) {
  const caseId = input.caseId as string;
  const incidentId = input.incidentId as string;
  await requireCasePermission(database, principal.user, caseId, "investigation:read");
  await ensureIncidentCase(database, incidentId, caseId);
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 50)));
  const offset = Math.max(0, Number(input.offset ?? 0));
  const order = table === "timeline_events" ? "event_time desc" : "created_at desc";
  const result = await database.query(`select * from ${table} where incident_id=$1 order by ${order} limit $2 offset $3`, [incidentId, limit, offset]);
  return { items: result.rows.map(camelize), limit, offset };
}

async function searchCase(database: Database, principal: McpPrincipal, input: Record<string, unknown>) {
  const caseId = input.caseId as string;
  await requireCasePermission(database, principal.user, caseId, "investigation:read");
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 50)));
  const offset = Math.max(0, Number(input.offset ?? 0));
  const pattern = `%${String(input.query).trim()}%`;
  const result = await database.query(
    `select 'evidence' as record_type,id,title,description,run_id,incident_id,created_at from evidence_records where case_id=$1 and (title ilike $2 or description ilike $2)
     union all select 'observation',id,title,description,run_id,incident_id,created_at from observations where case_id=$1 and (title ilike $2 or description ilike $2)
     union all select 'hypothesis',id,title,description,run_id,incident_id,created_at from hypotheses where case_id=$1 and (title ilike $2 or description ilike $2)
     order by created_at desc limit $3 offset $4`,
    [caseId, pattern, limit, offset]
  );
  return { items: result.rows.map(camelize), limit, offset };
}

async function ensureIncidentCase(database: Database, incidentId: string, caseId: string) {
  const result = await database.query("select 1 from incidents where id=$1 and case_id=$2", [incidentId, caseId]);
  if (!result.rowCount) throw new AppError(404, "Incident not found in case.");
}

function camelize(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value]));
}

function asStructuredContent(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return { value };
}

function normalizeError(error: unknown) {
  if (isAppError(error)) {
    const code = error.statusCode === 401 ? "authentication" : error.statusCode === 403 ? "permission" :
      error.statusCode === 404 ? "not_found" : error.statusCode === 409 ? "conflict" : "validation";
    return { code, message: error.message, details: error.details ?? null };
  }
  return { code: "internal", message: "Tool execution failed.", details: null };
}
