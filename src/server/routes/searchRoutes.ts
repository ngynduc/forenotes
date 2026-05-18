import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { searchAccessibleRecords } from "../services/searchService.js";

export function createSearchRoutes(database: Database) {
  const router = Router();

  router.get(
    "/search",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
      const caseId = typeof request.query.caseId === "string" ? request.query.caseId : undefined;
      const incidentId = typeof request.query.incidentId === "string" ? request.query.incidentId : undefined;
      response.json({
        results: q ? await searchAccessibleRecords(database, user, { query: q, caseId, incidentId }) : []
      });
    })
  );

  return router;
}
