import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { AppError } from "../errors.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { listNotifications, markNotificationRead, subscribeToNotificationEvents } from "../services/notificationService.js";
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

  router.get(
    "/stream",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      await requirePermission(database, user, "notification:read");

      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      });
      response.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

      const unsubscribe = subscribeToNotificationEvents(user.id, (event) => {
        response.write(`event: notification.created\ndata: ${JSON.stringify(event)}\n\n`);
      });
      const heartbeat = setInterval(() => {
        response.write(": heartbeat\n\n");
      }, 25_000);

      request.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        response.end();
      });
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
