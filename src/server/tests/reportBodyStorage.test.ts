import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readReportBody, writeReportBody } from "../services/reportBodyStorage.js";

describe("private report body storage", () => {
  let dataDir: string;
  let incidentId: string;
  let originalDataDir: string | undefined;

  beforeEach(async () => {
    originalDataDir = process.env.FORENOTES_DATA_DIR;
    dataDir = await mkdtemp(path.join(tmpdir(), "forenotes-report-body-"));
    process.env.FORENOTES_DATA_DIR = dataDir;
    incidentId = randomUUID();
  });

  afterEach(async () => {
    if (originalDataDir === undefined) delete process.env.FORENOTES_DATA_DIR;
    else process.env.FORENOTES_DATA_DIR = originalDataDir;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("writes private immutable files with the complete Markdown and context", async () => {
    const body = { markdown: "# Analysis\n\n分析", generatedContext: { incident: { name: "Fixture incident" } } };
    const first = await writeReportBody(incidentId, body);
    const second = await writeReportBody(incidentId, { ...body, markdown: "# Edited" });
    expect(second).not.toBe(first);
    expect(await readReportBody(incidentId, first)).toEqual(body);
    const filePath = path.join(dataDir, "reports", incidentId, first);
    expect((await stat(filePath)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(filePath, "utf8"))).toEqual(body);
  });

  it.each(["../outside.json", "/tmp/outside.json", `${randomUUID()}.json/../../outside`])(
    "rejects unsafe file reference %s", async (filename) => {
      await expect(readReportBody(incidentId, filename)).rejects.toMatchObject({ statusCode: 503 });
    }
  );

  it("rejects unsafe incident directories", async () => {
    await expect(writeReportBody("../outside", { markdown: "Body", generatedContext: {} })).rejects.toMatchObject({ statusCode: 503 });
  });

  it("reports missing files without exposing filesystem paths", async () => {
    await expect(readReportBody(incidentId, `${randomUUID()}.json`)).rejects.toMatchObject({
      statusCode: 503, message: "Report content is unavailable."
    });
  });

  it("reports corrupt files instead of returning an empty report", async () => {
    const filename = await writeReportBody(incidentId, { markdown: "Body", generatedContext: {} });
    await writeFile(path.join(dataDir, "reports", incidentId, filename), "{corrupt");
    await expect(readReportBody(incidentId, filename)).rejects.toMatchObject({ statusCode: 503 });
  });

  it("reports an unavailable storage directory without exposing content or paths", async () => {
    const blocked = path.join(dataDir, "not-a-directory");
    await writeFile(blocked, "fixture");
    process.env.FORENOTES_DATA_DIR = blocked;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(writeReportBody(incidentId, { markdown: "Private fixture body", generatedContext: {} }))
        .rejects.toMatchObject({ statusCode: 503, message: "Report storage is unavailable." });
      expect(JSON.stringify(log.mock.calls)).not.toContain("Private fixture body");
      expect(JSON.stringify(log.mock.calls)).not.toContain(blocked);
    } finally {
      log.mockRestore();
    }
  });
});
