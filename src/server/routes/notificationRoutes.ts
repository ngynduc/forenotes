import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { AppError } from "../errors.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { listNotifications, markNotificationRead } from "../services/notificationService.js";
import { requirePermission } from "../permissions/permissionService.js";
import { getRequiredParam } from "./params.js";

export function createNotificationRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      await requirePermission(database, user, "notification:read");
      response.json({ notifications: await listNotifications(database, user.id) });
    })
  );

  router.post(
    "/:notificationId/read",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      await requirePermission(database, user, "notification:read");
      const notificationId = getRequiredParam(request.params.notificationId, "notificationId");

      try {
        const notification = await markNotificationRead(database, user.id, notificationId);
        response.json({ notification });
      } catch {
        throw new AppError(404, "Notification not found");
      }
    })
  );

  return router;
}
