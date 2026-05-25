import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
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

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function createAuthRoutes(database: Database) {
  const router = Router();

  router.post(
    "/login",
    asyncHandler(async (request, response) => {
      const payload = loginSchema.parse(request.body);
      const rateLimitKey = loginRateLimitKey(request.ip, payload.username);
      checkLoginRateLimit(rateLimitKey);
      let session: Awaited<ReturnType<typeof loginWithPassword>>;
      try {
        session = await loginWithPassword(database, payload);
      } catch (error) {
        recordFailedLogin(rateLimitKey);
        throw error;
      }
      clearFailedLogin(rateLimitKey);
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

function loginRateLimitKey(ip: string | undefined, username: string) {
  return `${ip ?? "unknown"}:${username.trim().toLowerCase()}`;
}

function checkLoginRateLimit(key: string) {
  const record = loginAttempts.get(key);
  if (!record) {
    return;
  }
  if (Date.now() >= record.resetAt) {
    loginAttempts.delete(key);
    return;
  }
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    throw new AppError(429, "Too many failed login attempts. Try again later.");
  }
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now >= record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  record.count += 1;
}

function clearFailedLogin(key: string) {
  loginAttempts.delete(key);
}
