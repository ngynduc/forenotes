import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { createCase, listCases, updateCase } from "../services/caseService.js";
import { createIncident, listIncidentsForCase } from "../services/incidentService.js";
import { addCaseMember, listCaseMembers, removeCaseMember } from "../services/membershipService.js";
import { addCaseMemberSchema, createCaseSchema, createIncidentSchema, updateCaseSchema } from "../schemas/schemas.js";
import { getRequiredParam } from "./params.js";

export function createCaseRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      response.json({ cases: await listCases(database, user.id) });
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const payload = createCaseSchema.parse(request.body);
      const createdCase = await createCase(database, user, payload);
      response.status(201).json({ case: createdCase });
    })
  );

  router.patch(
    "/:caseId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const payload = updateCaseSchema.parse(request.body);
      const updatedCase = await updateCase(database, user, caseId, payload);
      response.json({ case: updatedCase });
    })
  );

  router.get(
    "/:caseId/members",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      response.json({ members: await listCaseMembers(database, user.id, caseId) });
    })
  );

  router.post(
    "/:caseId/members",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const payload = addCaseMemberSchema.parse(request.body);
      await addCaseMember(database, user, { caseId, ...payload });
      response.status(204).send();
    })
  );

  router.delete(
    "/:caseId/members/:memberUserId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const memberUserId = getRequiredParam(request.params.memberUserId, "memberUserId");
      await removeCaseMember(database, user, caseId, memberUserId);
      response.status(204).send();
    })
  );

  router.get(
    "/:caseId/incidents",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      response.json({
        incidents: await listIncidentsForCase(database, user.id, caseId)
      });
    })
  );

  router.post(
    "/:caseId/incidents",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const caseId = getRequiredParam(request.params.caseId, "caseId");
      const payload = createIncidentSchema.parse({
        ...request.body,
        caseId
      });
      const incident = await createIncident(database, user, payload);
      response.status(201).json({ incident });
    })
  );

  return router;
}
