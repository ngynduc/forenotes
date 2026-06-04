import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { getRequiredParam } from "./params.js";
import {
  attachAttackTagSchema,
  attachCustomTagSchema,
  createCustomTagSchema,
  updateCustomTagSchema
} from "../schemas/schemas.js";
import {
  attachAttackTagToQuery,
  attachAttackTagToTimelineEvent,
  attachAttackTagToFinding,
  attachCustomTagToTimelineEvent,
  attachCustomTagToFinding,
  createCustomTag,
  deleteCustomTag,
  listAttackTags,
  listCustomTags,
  listFindingTags,
  listQueryTags,
  listTimelineEventTags,
  updateCustomTag
} from "../services/tagService.js";

export function createTagRoutes(database: Database) {
  const router = Router();

  router.get(
    "/attack-tags",
    asyncHandler(async (_request, response) => {
      response.json({ attackTags: await listAttackTags(database) });
    })
  );

  router.get(
    "/cases/:caseId/custom-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      response.json({ customTags: await listCustomTags(database, user.id, caseId) });
    })
  );

  router.post(
    "/cases/:caseId/custom-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const payload = createCustomTagSchema.parse(request.body);
      const customTag = await createCustomTag(database, user, { caseId, ...payload });
      response.status(201).json({ customTag });
    })
  );

  router.patch(
    "/cases/:caseId/custom-tags/:customTagId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const customTagId = getRequiredParam(request.params.customTagId, "customTagId");
      const payload = updateCustomTagSchema.parse(request.body);
      const customTag = await updateCustomTag(database, user, caseId, customTagId, payload);
      response.json({ customTag });
    })
  );

  router.delete(
    "/cases/:caseId/custom-tags/:customTagId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const customTagId = getRequiredParam(request.params.customTagId, "customTagId");
      await deleteCustomTag(database, user, caseId, customTagId);
      response.status(204).send();
    })
  );

  router.post(
    "/incidents/:incidentId/timeline-events/:timelineEventId/attack-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const timelineEventId = getRequiredParam(request.params.timelineEventId, "timelineEventId");
      const payload = attachAttackTagSchema.parse(request.body);
      await attachAttackTagToTimelineEvent(database, user, { incidentId, timelineEventId, ...payload });
      response.status(204).send();
    })
  );

  router.post(
    "/incidents/:incidentId/timeline-events/:timelineEventId/custom-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const timelineEventId = getRequiredParam(request.params.timelineEventId, "timelineEventId");
      const payload = attachCustomTagSchema.parse(request.body);
      await attachCustomTagToTimelineEvent(database, user, { incidentId, timelineEventId, ...payload });
      response.status(204).send();
    })
  );

  router.get(
    "/incidents/:incidentId/timeline-events/:timelineEventId/tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const timelineEventId = getRequiredParam(request.params.timelineEventId, "timelineEventId");
      response.json(await listTimelineEventTags(database, user.id, incidentId, timelineEventId));
    })
  );

  router.post(
    "/incidents/:incidentId/findings/:findingId/attack-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      const payload = attachAttackTagSchema.parse(request.body);
      await attachAttackTagToFinding(database, user, { incidentId, findingId, ...payload });
      response.status(204).send();
    })
  );

  router.get(
    "/incidents/:incidentId/findings/:findingId/tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      response.json(await listFindingTags(database, user.id, incidentId, findingId));
    })
  );

  router.post(
    "/incidents/:incidentId/findings/:findingId/custom-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const findingId = getRequiredParam(request.params.findingId, "findingId");
      const payload = attachCustomTagSchema.parse(request.body);
      await attachCustomTagToFinding(database, user, { incidentId, findingId, ...payload });
      response.status(204).send();
    })
  );

  router.post(
    "/incidents/:incidentId/queries/:queryId/attack-tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const queryId = getRequiredParam(request.params.queryId, "queryId");
      const payload = attachAttackTagSchema.parse(request.body);
      await attachAttackTagToQuery(database, user, { incidentId, queryId, ...payload });
      response.status(204).send();
    })
  );

  router.get(
    "/incidents/:incidentId/queries/:queryId/tags",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const queryId = getRequiredParam(request.params.queryId, "queryId");
      response.json(await listQueryTags(database, user.id, incidentId, queryId));
    })
  );

  return router;
}
