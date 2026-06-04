import { raw, Router } from "express";
import type { ReportContext } from "../../shared/reportTypes.js";
import type { Database } from "../db/types.js";
import { asyncHandler } from "../http.js";
import { getAuthenticatedUser } from "../services/authService.js";
import {
  buildReportContext,
  createReport,
  createPdfTemplate,
  createReportTemplate,
  deleteLlmSettings,
  deletePdfTemplate,
  deleteReport,
  deleteReportTemplate,
  duplicatePdfTemplate,
  duplicateReportTemplate,
  exportReportPdf,
  generateReportPreview,
  getMaskedLlmSettings,
  getReport,
  listPdfTemplates,
  listReports,
  listReportTemplates,
  previewPdfTemplate,
  REPORT_IMAGE_CONTENT_TYPES,
  saveLlmSettings,
  testLlmSettings,
  updateReport,
  updatePdfTemplate,
  updateReportTemplate,
  uploadReportImage
} from "../services/reportService.js";
import {
  createReportSchema,
  createPdfTemplateSchema,
  createReportTemplateSchema,
  duplicatePdfTemplateSchema,
  duplicateReportTemplateSchema,
  exportReportPdfSchema,
  generateReportSchema,
  previewPdfTemplateSchema,
  reportContextQuerySchema,
  updatePdfTemplateSchema,
  updateReportSchema,
  updateReportTemplateSchema,
  upsertLlmSettingsSchema
} from "../schemas/schemas.js";
import { getRequiredParam } from "./params.js";

export function createReportRoutes(database: Database) {
  const router = Router();

  const readLlmSettingsHandler = asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json(await getMaskedLlmSettings(database, user));
  });

  const saveLlmSettingsHandler = asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    const payload = upsertLlmSettingsSchema.parse(request.body);
    response.json(await saveLlmSettings(database, user, payload));
  });

  const deleteLlmSettingsHandler = asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    await deleteLlmSettings(database, user);
    response.status(204).send();
  });

  const testLlmSettingsHandler = asyncHandler(async (request, response) => {
    const user = await getAuthenticatedUser(request, database);
    response.json(await testLlmSettings(database, user));
  });

  router.get("/me/llm-settings", readLlmSettingsHandler);
  router.put("/me/llm-settings", saveLlmSettingsHandler);
  router.delete("/me/llm-settings", deleteLlmSettingsHandler);
  router.post("/me/llm-settings/test", testLlmSettingsHandler);

  router.get("/llm-settings", readLlmSettingsHandler);
  router.put("/llm-settings", saveLlmSettingsHandler);
  router.delete("/llm-settings", deleteLlmSettingsHandler);
  router.post("/llm-settings/test", testLlmSettingsHandler);

  router.get(
    "/pdf-templates",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = typeof request.query.incidentId === "string" ? request.query.incidentId : undefined;
      response.json({ templates: await listPdfTemplates(database, user, incidentId) });
    })
  );

  router.post(
    "/pdf-templates",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const payload = createPdfTemplateSchema.parse(request.body);
      response.status(201).json({ template: await createPdfTemplate(database, user, payload) });
    })
  );

  router.patch(
    "/pdf-templates/:pdfTemplateId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const pdfTemplateId = getRequiredParam(request.params.pdfTemplateId, "pdfTemplateId");
      const payload = updatePdfTemplateSchema.parse(request.body);
      response.json({ template: await updatePdfTemplate(database, user, pdfTemplateId, payload) });
    })
  );

  router.delete(
    "/pdf-templates/:pdfTemplateId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const pdfTemplateId = getRequiredParam(request.params.pdfTemplateId, "pdfTemplateId");
      await deletePdfTemplate(database, user, pdfTemplateId);
      response.status(204).send();
    })
  );

  router.post(
    "/pdf-templates/:pdfTemplateId/duplicate",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const pdfTemplateId = getRequiredParam(request.params.pdfTemplateId, "pdfTemplateId");
      const payload = duplicatePdfTemplateSchema.parse(request.body);
      response.status(201).json({ template: await duplicatePdfTemplate(database, user, pdfTemplateId, payload.name) });
    })
  );

  router.post(
    "/pdf-templates/preview",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const payload = previewPdfTemplateSchema.parse(request.body);
      response.json(await previewPdfTemplate(database, user, payload));
    })
  );

  router.get(
    "/incidents/:incidentId/report-templates",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ templates: await listReportTemplates(database, user, incidentId) });
    })
  );

  router.post(
    "/incidents/:incidentId/report-templates",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createReportTemplateSchema.parse(request.body);
      const template = await createReportTemplate(database, user, incidentId, payload);
      response.status(201).json({ template });
    })
  );

  router.patch(
    "/incidents/:incidentId/report-templates/:templateId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const templateId = getRequiredParam(request.params.templateId, "templateId");
      const payload = updateReportTemplateSchema.parse(request.body);
      response.json({ template: await updateReportTemplate(database, user, incidentId, templateId, payload) });
    })
  );

  router.delete(
    "/incidents/:incidentId/report-templates/:templateId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const templateId = getRequiredParam(request.params.templateId, "templateId");
      await deleteReportTemplate(database, user, incidentId, templateId);
      response.status(204).send();
    })
  );

  router.post(
    "/incidents/:incidentId/report-templates/:templateId/duplicate",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const templateId = getRequiredParam(request.params.templateId, "templateId");
      const payload = duplicateReportTemplateSchema.parse(request.body);
      const template = await duplicateReportTemplate(database, user, incidentId, templateId, payload.name);
      response.status(201).json({ template });
    })
  );

  router.get(
    "/incidents/:incidentId/reports/context",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const query = reportContextQuerySchema.parse(request.query);
      response.json({ context: await buildReportContext(database, user, incidentId, query.type, query) });
    })
  );

  router.post(
    "/incidents/:incidentId/reports/generate",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = generateReportSchema.parse(request.body);
      response.json(await generateReportPreview(database, user, incidentId, payload));
    })
  );

  router.get(
    "/incidents/:incidentId/reports",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      response.json({ reports: await listReports(database, user, incidentId) });
    })
  );

  router.post(
    "/incidents/:incidentId/reports",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const payload = createReportSchema.parse(request.body);
      response.status(201).json({
        report: await createReport(database, user, incidentId, {
          ...payload,
          generatedContext: payload.generatedContext as unknown as ReportContext
        })
      });
    })
  );

  router.post(
    "/incidents/:incidentId/report-images",
    raw({ type: REPORT_IMAGE_CONTENT_TYPES, limit: "10mb" }),
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const body = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
      const contentType = typeof request.headers["content-type"] === "string"
        ? request.headers["content-type"].split(";")[0]
        : "";
      const uploaded = await uploadReportImage(database, user, incidentId, {
        data: body,
        contentType,
        filename: typeof request.headers["x-filename"] === "string" ? request.headers["x-filename"] : undefined,
      });
      response.status(201).json(uploaded);
    })
  );

  router.get(
    "/incidents/:incidentId/reports/:reportId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const reportId = getRequiredParam(request.params.reportId, "reportId");
      response.json({ report: await getReport(database, user, incidentId, reportId) });
    })
  );

  router.patch(
    "/incidents/:incidentId/reports/:reportId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const reportId = getRequiredParam(request.params.reportId, "reportId");
      const payload = updateReportSchema.parse(request.body);
      response.json({ report: await updateReport(database, user, incidentId, reportId, payload) });
    })
  );

  router.delete(
    "/incidents/:incidentId/reports/:reportId",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const reportId = getRequiredParam(request.params.reportId, "reportId");
      await deleteReport(database, user, incidentId, reportId);
      response.status(204).send();
    })
  );

  router.post(
    "/incidents/:incidentId/reports/:reportId/export/pdf",
    asyncHandler(async (request, response) => {
      const user = await getAuthenticatedUser(request, database);
      const incidentId = getRequiredParam(request.params.incidentId, "incidentId");
      const reportId = getRequiredParam(request.params.reportId, "reportId");
      const payload = exportReportPdfSchema.parse(request.body);
      const exported = await exportReportPdf(database, user, incidentId, reportId, payload);
      response.setHeader("Content-Type", "application/pdf");
      response.setHeader("Content-Disposition", `attachment; filename="${exported.fileName}"`);
      response.setHeader("Content-Length", String(exported.pdf.length));
      response.status(200).send(exported.pdf);
    })
  );

  return router;
}
