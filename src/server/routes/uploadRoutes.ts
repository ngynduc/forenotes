import { Router } from "express";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import { readTaskNoteImage } from "../services/noteService.js";
import { readReportImage } from "../services/reportService.js";
import { getRequiredParam } from "./params.js";

export function createUploadRoutes(database: Database) {
  const router = Router();

  router.get(
    "/task-notes/:taskId/:filename",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const taskId = getRequiredParam(request.params.taskId, "taskId");
      const filename = getRequiredParam(request.params.filename, "filename");
      const image = await readTaskNoteImage(database, user, taskId, filename);
      response.setHeader("Content-Type", image.contentType);
      response.setHeader("Cache-Control", "private, max-age=300");
      response.send(image.data);
    })
  );

  router.get(
    "/reports/:incidentId/:filename",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const filename = getRequiredParam(request.params.filename, "filename");
      const image = await readReportImage(database, user, incidentId, filename);
      response.setHeader("Content-Type", image.contentType);
      response.setHeader("Cache-Control", "private, max-age=300");
      response.send(image.data);
    })
  );

  return router;
}
