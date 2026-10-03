import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { AppError } from "../errors.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { listNotifications, markNotificationRead, subscribeToNotificationEvents, subscribeToUserStateEvents } from "../services/notificationService.js";
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

      let closed = false;
      const endSession = () => {
        if (!closed) {
          response.write(`event: session.ended\ndata: {}\n\n`);
          cleanup();
        }
      };
      const isSessionCurrent = async () => {
        try {
          const currentUser = await getAuthenticatedUser(request, database);
          await requirePermission(database, currentUser, "notification:read");
          return !closed;
        } catch {
          endSession();
          return false;
        }
      };
      const unsubscribe = subscribeToNotificationEvents(user.id, (event) => {
        void isSessionCurrent().then((current) => {
          if (current) response.write(`event: notification.created\ndata: ${JSON.stringify(event)}\n\n`);
        });
      });
      const unsubscribeUserState = subscribeToUserStateEvents(user.id, (event) => {
        if (event.type === "session.ended") endSession();
        else void isSessionCurrent().then((current) => {
          if (current) response.write(`event: user.updated\ndata: ${JSON.stringify(event)}\n\n`);
        });
      });
      const heartbeat = setInterval(() => {
        void isSessionCurrent().then((current) => {
          if (current) response.write(": heartbeat\n\n");
        });
      }, 25_000);

      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        unsubscribeUserState();
        response.end();
      }
      request.on("close", cleanup);

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
