import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { createMcpToken, listMcpTokens, revokeMcpToken } from "../services/mcpTokenService.js";
import {
  listEvidence, listHypotheses, listInvestigationFindings, listInvestigationRuns, listObservations,
  updateEvidence, updateHypothesis, updateObservation
} from "../services/investigationService.js";
import { listAgentActions } from "../services/agentActionService.js";
import { requireCasePermission } from "../permissions/permissionService.js";
import { getRequiredParam } from "./params.js";

const tokenSchema = z.object({
  label: z.string().trim().min(1).max(120),
  scope: z.enum(["read_only", "read_write"]),
  expiresAt: z.string().datetime().nullable().optional()
});

const listQuerySchema = z.object({
  incidentId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  status: z.enum(["active", "completed", "failed", "cancelled"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const evidenceUpdateSchema = z.object({
  evidenceType: z.string().min(1).optional(), title: z.string().min(1).optional(), description: z.string().nullable().optional(),
  sourceLocator: z.string().nullable().optional(), hashes: z.record(z.string(), z.string()).optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(), mimeType: z.string().nullable().optional(),
  collectedAt: z.string().datetime().nullable().optional(), metadata: z.record(z.string(), z.unknown()).optional()
});
const observationUpdateSchema = z.object({
  title: z.string().min(1).optional(), description: z.string().min(1).optional(), observedAt: z.string().datetime().nullable().optional(), evidenceIds: z.array(z.string().uuid()).min(1).optional()
});
const hypothesisUpdateSchema = z.object({
  title: z.string().min(1).optional(), description: z.string().min(1).optional(), status: z.enum(["open", "supported", "rejected"]).optional(), observationIds: z.array(z.string().uuid()).min(1).optional()
});

export function createInvestigationRoutes(database: Database) {
  const router = Router();

  router.get("/api/mcp-tokens", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json({ tokens: await listMcpTokens(database, user.id) });
  }));
  router.post("/api/mcp-tokens", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    const created = await createMcpToken(database, user.id, tokenSchema.parse(request.body));
    response.status(201).json(created);
  }));
  router.delete("/api/mcp-tokens/:tokenId", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json({ accessToken: await revokeMcpToken(database, user.id, getRequiredParam(request.params.tokenId, "tokenId")) });
  }));

  router.get("/api/cases/:caseId/investigation/:collection", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    const caseId = getRequiredParam(request.params.caseId, "caseId");
    const collection = getRequiredParam(request.params.collection, "collection");
    const query = listQuerySchema.parse(request.query);
    await requireCasePermission(database, user, caseId, "investigation:read");
    const filters = { caseId, ...query };
    switch (collection) {
      case "runs": response.json(await listInvestigationRuns(database, user, filters)); return;
      case "evidence": response.json(await listEvidence(database, user, filters)); return;
      case "observations": response.json(await listObservations(database, user, filters)); return;
      case "hypotheses": response.json(await listHypotheses(database, user, filters)); return;
      case "findings": response.json(await listInvestigationFindings(database, user, filters)); return;
      case "actions": response.json(await listAgentActions(database, user.id, filters)); return;
      default: response.status(404).json({ error: "Investigation collection not found" });
    }
  }));

  router.patch("/api/investigation/evidence/:evidenceId", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json({ evidence: await updateEvidence(database, user, getRequiredParam(request.params.evidenceId, "evidenceId"), evidenceUpdateSchema.parse(request.body), { requireActiveRun: false }) });
  }));
  router.patch("/api/investigation/observations/:observationId", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json({ observation: await updateObservation(database, user, getRequiredParam(request.params.observationId, "observationId"), observationUpdateSchema.parse(request.body), { requireActiveRun: false }) });
  }));
  router.patch("/api/investigation/hypotheses/:hypothesisId", asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json({ hypothesis: await updateHypothesis(database, user, getRequiredParam(request.params.hypothesisId, "hypothesisId"), hypothesisUpdateSchema.parse(request.body), { requireActiveRun: false }) });
  }));

  return router;
}
