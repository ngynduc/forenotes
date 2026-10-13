import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { AppError } from "../errors.js";
import { getDataDir } from "../storage.js";

const reportBodySchema = z.object({
  markdown: z.string(),
  generatedContext: z.record(z.string(), z.unknown())
});
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bodyPath(incidentId: string, filename: string) {
  if (!uuidPattern.test(incidentId) || !filename.endsWith(".json") || !uuidPattern.test(filename.slice(0, -5))) {
    throw new AppError(503, "Report content is unavailable.");
  }
  return path.join(getDataDir(), "reports", incidentId, filename);
}

export async function writeReportBody(incidentId: string, body: { markdown: string; generatedContext: unknown }) {
  const filename = `${randomUUID()}.json`;
  const filePath = bodyPath(incidentId, filename);
  const content = JSON.stringify(reportBodySchema.parse(body));
  try {
    await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return filename;
  } catch {
    await discardReportBody(incidentId, filename);
    throw new AppError(503, "Report storage is unavailable.");
  }
}

export async function readReportBody(incidentId: string, filename: string) {
  const filePath = bodyPath(incidentId, filename);
  try {
    return reportBodySchema.parse(JSON.parse(await readFile(filePath, "utf8")));
  } catch {
    throw new AppError(503, "Report content is unavailable.");
  }
}

export async function discardReportBody(incidentId: string, filename: string) {
  try {
    await rm(bodyPath(incidentId, filename), { force: true });
  } catch {
    console.error(JSON.stringify({ event: "report_body_cleanup_failed", incidentId, filename }));
  }
}
