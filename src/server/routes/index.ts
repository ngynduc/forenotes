import { Router } from "express";
import type { Database } from "../db/types.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createCaseRoutes } from "./caseRoutes.js";
import { createIncidentRoutes } from "./incidentRoutes.js";
import { createNotificationRoutes } from "./notificationRoutes.js";
import { createSearchRoutes } from "./searchRoutes.js";
import { createTagRoutes } from "./tagRoutes.js";
import { createAuditLogRoutes } from "./auditLogRoutes.js";
import { createDashboardRoutes } from "./dashboardRoutes.js";
import { createUserRoutes } from "./userRoutes.js";

export function createRoutes(database: Database) {
  const router = Router();
  router.use("/api/auth", createAuthRoutes(database));
  router.use("/api/users", createUserRoutes(database));
  router.use("/api/cases", createCaseRoutes(database));
  router.use("/api/incidents", createIncidentRoutes(database));
  router.use("/api", createTagRoutes(database));
  router.use("/api", createSearchRoutes(database));
  router.use("/api", createAuditLogRoutes(database));
  router.use("/api/dashboard", createDashboardRoutes(database));
  router.use("/api/notifications", createNotificationRoutes(database));
  return router;
}
