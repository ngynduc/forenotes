import { Router } from "express";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { requireAuth } from "../services/authService.js";
import { activateLicense, deactivateLicense, getLicensedFeatures, getLicenseStatus } from "../services/licenseService.js";

const activateLicenseSchema = z.object({
  licenseKey: z.string().trim().min(1)
});

export function createLicenseRoutes(database: Database) {
  const router = Router();

  router.get(
    "/status",
    asyncHandler(async (request, response) => {
      await requireAuth(request, database);
      response.json(await getLicenseStatus(database));
    })
  );

  router.get(
    "/features",
    asyncHandler(async (request, response) => {
      await requireAuth(request, database);
      response.json({ features: await getLicensedFeatures(database) });
    })
  );

  router.post(
    "/activate",
    asyncHandler(async (request, response) => {
      await requireAuth(request, database);
      const payload = activateLicenseSchema.parse(request.body);
      response.json(await activateLicense(database, payload.licenseKey));
    })
  );

  router.post(
    "/deactivate",
    asyncHandler(async (request, response) => {
      await requireAuth(request, database);
      response.json(await deactivateLicense(database));
    })
  );

  return router;
}
