import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { GLOBAL_ROLES } from "../../shared/domain.js";
import { asyncHandler } from "../http.js";
import { createUser, listUsers } from "../services/userService.js";
import { hashPassword, requireAuth, resetUserPassword } from "../services/authService.js";
import { requirePermission } from "../permissions/permissionService.js";
import { resetPasswordSchema } from "../schemas/schemas.js";
import { getRequiredParam } from "./params.js";

const createUserSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().email(),
  displayName: z.string().min(1),
  globalRole: z.enum(GLOBAL_ROLES),
  password: z.string().min(8).optional()
});

export function createUserRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      await requireAuth(request, database);
      response.json({ users: await listUsers(database) });
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const actor = await requireAuth(request, database);
      await requirePermission(database, actor, "user:manage");
      const payload = createUserSchema.parse(request.body);
      const user = await createUser(database, {
        username: payload.username,
        email: payload.email,
        displayName: payload.displayName,
        globalRole: payload.globalRole,
        passwordHash: payload.password ? await hashPassword(payload.password) : null
      });
      response.status(201).json({ user });
    })
  );

  router.post(
    "/:userId/reset-password",
    asyncHandler(async (request, response) => {
      const actor = await requireAuth(request, database);
      await requirePermission(database, actor, "user:manage");
      const userId = getRequiredParam(request.params.userId, "userId");
      const payload = resetPasswordSchema.parse(request.body);
      await resetUserPassword(database, userId, payload);
      response.status(204).send();
    })
  );

  return router;
}
