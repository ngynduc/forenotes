import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { GLOBAL_ROLES } from "../../shared/domain.js";
import { asyncHandler } from "../http.js";
import { createUser, listUsers } from "../services/userService.js";

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  globalRole: z.enum(GLOBAL_ROLES)
});

export function createUserRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      response.json({ users: await listUsers(database) });
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const payload = createUserSchema.parse(request.body);
      const user = await createUser(database, payload);
      response.status(201).json({ user });
    })
  );

  return router;
}
