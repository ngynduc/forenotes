import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import {
  clearSessionCookie,
  changeOwnPassword,
  getAuthenticatedUser,
  loginWithPassword,
  logout,
  setSessionCookie
} from "../services/authService.js";
import { listUserPermissions } from "../permissions/permissionService.js";
import { changePasswordSchema } from "../schemas/schemas.js";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export function createAuthRoutes(database: Database) {
  const router = Router();

  router.post(
    "/login",
    asyncHandler(async (request, response) => {
      const payload = loginSchema.parse(request.body);
      const session = await loginWithPassword(database, payload);
      setSessionCookie(response, session.sessionId, session.expiresAt);
      response.json({ user: session.user });
    })
  );

  router.post(
    "/logout",
    asyncHandler(async (request, response) => {
      await logout(database, request);
      clearSessionCookie(response);
      response.status(204).send();
    })
  );

  router.get(
    "/me",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const permissions = await listUserPermissions(database, user);
      response.json({ user, permissions });
    })
  );

  router.post(
    "/change-password",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const payload = changePasswordSchema.parse(request.body);
      await changeOwnPassword(database, user, payload);
      response.status(204).send();
    })
  );

  return router;
}
