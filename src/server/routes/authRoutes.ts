import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { listUserPermissions } from "../permissions/permissionService.js";

export function createAuthRoutes(database: Database) {
  const router = Router();

  router.get(
    "/me",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const permissions = await listUserPermissions(database, user);
      response.json({ user, permissions });
    })
  );

  return router;
}
