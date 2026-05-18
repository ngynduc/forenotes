import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { requirePermission } from "../permissions/permissionService.js";
import { listAuditLogs } from "../services/auditLogService.js";

export function createAuditLogRoutes(database: Database) {
  const router = Router();

  router.get(
    "/audit-logs",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      await requirePermission(database, user, "audit:read");
      const caseId = typeof request.query.caseId === "string" ? request.query.caseId : undefined;
      const incidentId = typeof request.query.incidentId === "string" ? request.query.incidentId : undefined;
      response.json({ auditLogs: await listAuditLogs(database, { caseId, incidentId }) });
    })
  );

  return router;
}
