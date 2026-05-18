import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { getDashboardSummary } from "../services/dashboardService.js";

export function createDashboardRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const summary = await getDashboardSummary(database, user);
      response.json({ summary });
    })
  );

  return router;
}
