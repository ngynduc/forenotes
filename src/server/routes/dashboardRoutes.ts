import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import type { DashboardCaseHealth, DashboardIncidentHealth, DashboardRecentActivity, DashboardTaskItem } from "../../shared/graph-types.js";
import {
  getDashboard,
  getDashboardActivity,
  getDashboardCases,
  getDashboardCharts,
  getDashboardSla,
  getDashboardSummary,
  getDashboardWorkload
} from "../services/dashboardService.js";

export function createDashboardRoutes(database: Database) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      response.json(await getDashboard(database, user));
    })
  );

  router.get(
    "/summary",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const summary = await getDashboardSummary(database, user);
      response.json({ summary });
    })
  );

  router.get(
    "/charts",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      response.json(await getDashboardCharts(database, user));
    })
  );

  router.get(
    "/sla",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const sla = await getDashboardSla(database, user);
      const section = String(request.query.section ?? "");
      if (section) {
        response.json(paginateRows(getSlaSectionRows(sla, section), paginationFromQuery(request.query)));
        return;
      }
      response.json(sla);
    })
  );

  router.get(
    "/activity",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const activity = await getDashboardActivity(database, user);
      if (hasPaginationQuery(request.query)) {
        response.json(paginateRows(activity.activity, paginationFromQuery(request.query)));
        return;
      }
      response.json(activity);
    })
  );

  router.get(
    "/workload",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      response.json(await getDashboardWorkload(database, user));
    })
  );

  router.get(
    "/cases",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const cases = await getDashboardCases(database, user);
      if (hasPaginationQuery(request.query)) {
        response.json(paginateRows(cases.cases, paginationFromQuery(request.query)));
        return;
      }
      response.json(cases);
    })
  );

  router.get(
    "/incidents",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const cases = await getDashboardCases(database, user);
      response.json(paginateRows(cases.incidents, paginationFromQuery(request.query)));
    })
  );

  return router;
}

type DashboardTableRow = DashboardTaskItem | DashboardRecentActivity | DashboardCaseHealth | DashboardIncidentHealth;

function getSlaSectionRows(
  sla: Awaited<ReturnType<typeof getDashboardSla>>,
  section: string
): DashboardTaskItem[] {
  if (section === "overdue") return sla.overdueTasks;
  if (section === "dueSoon" || section === "due_soon") return sla.dueSoonTasks;
  if (section === "attention") return sla.attentionItems;
  return [];
}

function hasPaginationQuery(query: Record<string, unknown>) {
  return query.page !== undefined || query.pageSize !== undefined;
}

function paginationFromQuery(query: Record<string, unknown>) {
  return {
    page: parsePositiveInt(query.page, 1),
    pageSize: Math.min(parsePositiveInt(query.pageSize, 10), 50)
  };
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function paginateRows<T extends DashboardTableRow>(rows: T[], pagination: { page: number; pageSize: number }) {
  const start = (pagination.page - 1) * pagination.pageSize;
  return {
    items: rows.slice(start, start + pagination.pageSize),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: rows.length
  };
}
