import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { createFinding, deleteFinding, listFindings, updateFinding } from "../services/findingService.js";
import { createTimelineEvent, deleteTimelineEvent, listTimelineEvents, updateTimelineEvent } from "../services/timelineEventService.js";
import { createIndicator, deleteIndicator, listIndicators, updateIndicator } from "../services/indicatorService.js";
import { createEvidenceLink, deleteEvidenceLink, listEvidenceLinks } from "../services/evidenceLinkService.js";
import { createTask, createTaskLink, deleteTask, listTasks, updateTask } from "../services/taskService.js";
import { createQuery, deleteQuery, listQueries, updateQuery } from "../services/queryService.js";
import { addIncidentMember, listIncidentMembers, removeIncidentMember } from "../services/membershipService.js";
import { createSystem, deleteSystem, listSystems, updateSystem } from "../services/systemService.js";
import { createAccount, deleteAccount, listAccounts, updateAccount } from "../services/accountService.js";
import { updateIncident } from "../services/incidentService.js";
import { buildIncidentGraph } from "../graph/graphBuilder.js";
import { buildMitreMatrix } from "../graph/mitreMatrixBuilder.js";
import { createEntityLink, deleteEntityLink, listEntityLinks } from "../graph/entityLinksRepository.js";
import {
  addIncidentMemberSchema,
  createAccountSchema,
  createEntityLinkSchema,
  createEvidenceLinkSchema,
  createFindingSchema,
  createIndicatorSchema,
  createQuerySchema,
  createSystemSchema,
  graphQuerySchema,
  mitreMatrixQuerySchema,
  createTaskLinkSchema,
  createTaskSchema,
  createTimelineEventSchema,
  timeRangeQuerySchema,
  updateAccountSchema,
  updateFindingSchema,
  updateIncidentSchema,
  updateIndicatorSchema,
  updateQuerySchema,
  updateSystemSchema,
  updateTaskSchema,
  updateTimelineEventSchema
} from "../schemas/schemas.js";
import { getRequiredParam } from "./params.js";

export function createIncidentRoutes(database: Database) {
  const router = Router();

  router.get(
    "/:incidentId/findings",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({
        findings: await listFindings(database, user.id, incidentId, {
          field: readFindingTimeField(request.query.field),
          ...parseTimeRangeQuery(request.query),
        })
      });
    })
  );

  router.post(
    "/:incidentId/findings",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createFindingSchema.parse(request.body);
      const finding = await createFinding(database, user, {
        ...payload,
        incidentId
      });
      response.status(201).json({ finding });
    })
  );

  router.patch(
    "/:incidentId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = updateIncidentSchema.parse(request.body);
      const incident = await updateIncident(database, user, incidentId, payload);
      response.json({ incident });
    })
  );

  router.get(
    "/:incidentId/members",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ members: await listIncidentMembers(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/members",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = addIncidentMemberSchema.parse(request.body);
      await addIncidentMember(database, user, { incidentId, ...payload });
      response.status(204).send();
    })
  );

  router.delete(
    "/:incidentId/members/:memberUserId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const memberUserId = getRequiredParam(request.params.memberUserId, "memberUserId");
      await removeIncidentMember(database, user, incidentId, memberUserId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/timeline-events",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({
        timelineEvents: await listTimelineEvents(database, user.id, incidentId, {
          field: readTimelineTimeField(request.query.field),
          ...parseTimeRangeQuery(request.query),
        })
      });
    })
  );

  router.post(
    "/:incidentId/timeline-events",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createTimelineEventSchema.parse(request.body);
      const timelineEvent = await createTimelineEvent(database, user, {
        ...payload,
        incidentId
      });
      response.status(201).json({ timelineEvent });
    })
  );

  router.patch(
    "/:incidentId/findings/:findingId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      const payload = updateFindingSchema.parse(request.body);
      const finding = await updateFinding(database, user, incidentId, findingId, payload);
      response.json({ finding });
    })
  );

  router.delete(
    "/:incidentId/findings/:findingId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      await deleteFinding(database, user, incidentId, findingId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/indicators",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ indicators: await listIndicators(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/indicators",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createIndicatorSchema.parse(request.body);
      const indicator = await createIndicator(database, user, {
        ...payload,
        incidentId
      });
      response.status(201).json({ indicator });
    })
  );

  router.patch(
    "/:incidentId/timeline-events/:timelineEventId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const timelineEventId = getRequiredParam(request.params.timelineEventId, "timelineEventId");
      const payload = updateTimelineEventSchema.parse(request.body);
      const timelineEvent = await updateTimelineEvent(database, user, incidentId, timelineEventId, payload);
      response.json({ timelineEvent });
    })
  );

  router.delete(
    "/:incidentId/timeline-events/:timelineEventId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const timelineEventId = getRequiredParam(request.params.timelineEventId, "timelineEventId");
      await deleteTimelineEvent(database, user, incidentId, timelineEventId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/systems",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ systems: await listSystems(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/systems",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createSystemSchema.parse(request.body);
      const system = await createSystem(database, user, { incidentId, ...payload });
      response.status(201).json({ system });
    })
  );

  router.patch(
    "/:incidentId/systems/:systemId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const systemId = getRequiredParam(request.params.systemId, "systemId");
      const payload = updateSystemSchema.parse(request.body);
      const system = await updateSystem(database, user, incidentId, systemId, payload);
      response.json({ system });
    })
  );

  router.delete(
    "/:incidentId/systems/:systemId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const systemId = getRequiredParam(request.params.systemId, "systemId");
      await deleteSystem(database, user, incidentId, systemId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/accounts",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ accounts: await listAccounts(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/accounts",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createAccountSchema.parse(request.body);
      const account = await createAccount(database, user, { incidentId, ...payload });
      response.status(201).json({ account });
    })
  );

  router.patch(
    "/:incidentId/accounts/:accountId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const accountId = getRequiredParam(request.params.accountId, "accountId");
      const payload = updateAccountSchema.parse(request.body);
      const account = await updateAccount(database, user, incidentId, accountId, payload);
      response.json({ account });
    })
  );

  router.delete(
    "/:incidentId/accounts/:accountId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const accountId = getRequiredParam(request.params.accountId, "accountId");
      await deleteAccount(database, user, incidentId, accountId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/findings/:findingId/evidence-links",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      response.json({
        evidenceLinks: await listEvidenceLinks(database, user.id, incidentId, findingId)
      });
    })
  );

  router.post(
    "/:incidentId/findings/:findingId/evidence-links",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      const payload = createEvidenceLinkSchema.parse(request.body);
      const evidenceLink = await createEvidenceLink(database, user, {
        incidentId,
        findingId,
        ...payload
      });
      response.status(201).json({ evidenceLink });
    })
  );

  router.patch(
    "/:incidentId/indicators/:indicatorId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const indicatorId = getRequiredParam(request.params.indicatorId, "indicatorId");
      const payload = updateIndicatorSchema.parse(request.body);
      const indicator = await updateIndicator(database, user, incidentId, indicatorId, payload);
      response.json({ indicator });
    })
  );

  router.delete(
    "/:incidentId/indicators/:indicatorId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const indicatorId = getRequiredParam(request.params.indicatorId, "indicatorId");
      await deleteIndicator(database, user, incidentId, indicatorId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/tasks",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ tasks: await listTasks(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/tasks",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createTaskSchema.parse(request.body);
      const task = await createTask(database, user, { incidentId, ...payload });
      response.status(201).json({ task });
    })
  );

  router.delete(
    "/:incidentId/findings/:findingId/evidence-links/:linkId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      const linkId = getRequiredParam(request.params.linkId, "linkId");
      await deleteEvidenceLink(database, user, incidentId, findingId, linkId);
      response.status(204).send();
    })
  );

  router.post(
    "/:incidentId/tasks/:taskId/links",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const taskId = getRequiredParam(request.params.taskId, "taskId");
      const payload = createTaskLinkSchema.parse(request.body);
      const taskLink = await createTaskLink(database, user, { incidentId, taskId, ...payload });
      response.status(201).json({ taskLink });
    })
  );

  router.patch(
    "/:incidentId/tasks/:taskId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const taskId = getRequiredParam(request.params.taskId, "taskId");
      const payload = updateTaskSchema.parse(request.body);
      const task = await updateTask(database, user, incidentId, taskId, payload);
      response.json({ task });
    })
  );

  router.delete(
    "/:incidentId/tasks/:taskId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const taskId = getRequiredParam(request.params.taskId, "taskId");
      await deleteTask(database, user, incidentId, taskId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/queries",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ queries: await listQueries(database, user.id, incidentId) });
    })
  );

  router.post(
    "/:incidentId/queries",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createQuerySchema.parse(request.body);
      const query = await createQuery(database, user, { incidentId, ...payload });
      response.status(201).json({ query });
    })
  );

  router.patch(
    "/:incidentId/queries/:queryId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const queryId = getRequiredParam(request.params.queryId, "queryId");
      const payload = updateQuerySchema.parse(request.body);
      const query = await updateQuery(database, user, incidentId, queryId, payload);
      response.json({ query });
    })
  );

  router.delete(
    "/:incidentId/queries/:queryId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const queryId = getRequiredParam(request.params.queryId, "queryId");
      await deleteQuery(database, user, incidentId, queryId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/entity-links",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const entityLinks = await listEntityLinks(database, user, incidentId);
      response.json({ entityLinks });
    })
  );

  router.post(
    "/:incidentId/entity-links",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createEntityLinkSchema.parse(request.body);
      const entityLink = await createEntityLink(database, user, { incidentId, ...payload });
      response.status(201).json({ entityLink });
    })
  );

  router.delete(
    "/:incidentId/entity-links/:linkId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const linkId = getRequiredParam(request.params.linkId, "linkId");
      await deleteEntityLink(database, user, incidentId, linkId);
      response.status(204).send();
    })
  );

  router.get(
    "/:incidentId/graph",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const query = graphQuerySchema.parse(request.query);
      const graph = await buildIncidentGraph(database, user, incidentId, {
        mode: query.mode,
        entityTypes: query.entityTypes,
        linkTypes: query.linkTypes,
        includeDerived: query.includeDerived,
        includeManual: query.includeManual,
        depth: query.depth,
        q: query.q
      });
      response.json(graph);
    })
  );

  router.get(
    "/:incidentId/mitre-matrix",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const query = mitreMatrixQuerySchema.parse(request.query);
      const matrix = await buildMitreMatrix(database, user, incidentId, query);
      response.json(matrix);
    })
  );

  return router;
}

function parseTimeRangeQuery(query: Record<string, unknown>) {
  return timeRangeQuerySchema.parse({
    start: typeof query.start === "string" ? query.start : undefined,
    end: typeof query.end === "string" ? query.end : undefined,
  });
}

function readFindingTimeField(raw: unknown) {
  return raw === "createdAt" || raw === "updatedAt" ? raw : undefined;
}

function readTimelineTimeField(raw: unknown) {
  return raw === "eventTime" || raw === "createdAt" || raw === "updatedAt" ? raw : undefined;
}
