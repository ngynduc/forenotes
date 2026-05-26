import { randomUUID } from "node:crypto";
import { mkdtempSync, promises as fsPromises, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newDb } from "pg-mem";
import { createApp } from "../app.js";
import type { Database } from "../db/types.js";
import { runMigrations } from "../db/setup.js";
import type { AuthenticatedUser } from "../services/authService.js";
import {
  buildReportContext,
  createReport,
  createReportTemplate,
  exportReportPdf,
  buildLiteLlmGenerateReportPayload,
  inlineReportUploadImagesForPdf,
  renderPdfHtml,
  renderMarkdownToSanitizedHtml,
  renderReportTemplate,
  saveLlmSettings,
  getMaskedLlmSettings,
  testLlmSettings
} from "../services/reportService.js";

const originalLlmEnv = {
  apiKey: process.env.LLM_API_KEY,
  endpoint: process.env.LLM_API_ENDPOINT,
  model: process.env.LLM_MODEL,
  provider: process.env.LLM_PROVIDER,
  systemPrompt: process.env.LLM_SYSTEM_PROMPT,
  customHeaders: process.env.LLM_CUSTOM_HEADERS_JSON,
  serviceUrl: process.env.LITELLM_SERVICE_URL
};

function clearLlmEnv() {
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_API_ENDPOINT;
  delete process.env.LLM_MODEL;
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_SYSTEM_PROMPT;
  delete process.env.LLM_CUSTOM_HEADERS_JSON;
  delete process.env.LITELLM_SERVICE_URL;
}

function restoreLlmEnv() {
  if (originalLlmEnv.apiKey === undefined) delete process.env.LLM_API_KEY;
  else process.env.LLM_API_KEY = originalLlmEnv.apiKey;
  if (originalLlmEnv.endpoint === undefined) delete process.env.LLM_API_ENDPOINT;
  else process.env.LLM_API_ENDPOINT = originalLlmEnv.endpoint;
  if (originalLlmEnv.model === undefined) delete process.env.LLM_MODEL;
  else process.env.LLM_MODEL = originalLlmEnv.model;
  if (originalLlmEnv.provider === undefined) delete process.env.LLM_PROVIDER;
  else process.env.LLM_PROVIDER = originalLlmEnv.provider;
  if (originalLlmEnv.systemPrompt === undefined) delete process.env.LLM_SYSTEM_PROMPT;
  else process.env.LLM_SYSTEM_PROMPT = originalLlmEnv.systemPrompt;
  if (originalLlmEnv.customHeaders === undefined) delete process.env.LLM_CUSTOM_HEADERS_JSON;
  else process.env.LLM_CUSTOM_HEADERS_JSON = originalLlmEnv.customHeaders;
  if (originalLlmEnv.serviceUrl === undefined) delete process.env.LITELLM_SERVICE_URL;
  else process.env.LITELLM_SERVICE_URL = originalLlmEnv.serviceUrl;
}

async function createTestDatabase() {
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Database;
  await runMigrations(pool);
  return pool;
}

async function seedIncident(database: Database, userId: string) {
  const caseId = randomUUID();
  const incidentId = randomUUID();
  await database.query(
    "insert into users (id, username, email, display_name, global_role, status) values ($1, 'analyst', 'analyst@example.com', 'Analyst', 'analyst', 'active')",
    [userId]
  );
  await database.query(
    "insert into cases (id, case_name, status, created_by_user_id) values ($1, 'Case One', 'open', $2)",
    [caseId, userId]
  );
  await database.query(
    "insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'member', $2)",
    [caseId, userId]
  );
  await database.query(
    "insert into incidents (id, case_id, name, summary, status, created_by_user_id) values ($1, $2, 'Incident One', 'Containment in progress', 'open', $3)",
    [incidentId, caseId, userId]
  );
  await database.query(
    "insert into incident_members (incident_id, user_id, incident_role, added_by_user_id) values ($1, $2, 'analyst', $2)",
    [incidentId, userId]
  );
  return { caseId, incidentId };
}

function user(id: string, globalRole: AuthenticatedUser["globalRole"] = "analyst"): AuthenticatedUser {
  return {
    id,
    username: "analyst",
    email: "analyst@example.com",
    displayName: "Analyst",
    globalRole,
    status: "active",
    mustChangePassword: false,
    isBootstrapAdmin: false
  };
}

describe("report service", () => {
  let database: Database;
  let dataDir: string;
  let userId: string;
  let incidentId: string;

  beforeEach(async () => {
    clearLlmEnv();
    dataDir = mkdtempSync(path.join(tmpdir(), "forenotes-reports-"));
    process.env.FORENOTES_DATA_DIR = dataDir;
    database = await createTestDatabase();
    userId = randomUUID();
    const seeded = await seedIncident(database, userId);
    incidentId = seeded.incidentId;
  });

  afterEach(() => {
    delete process.env.FORENOTES_DATA_DIR;
    restoreLlmEnv();
    vi.unstubAllGlobals();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("filters daily report context by the selected local day timezone window", async () => {
    await database.query(
      `
        insert into findings (id, incident_id, title, status, created_by_user_id, created_at, updated_at)
        values
          ($1, $3, 'Outside local day', 'confirmed', $4, '2026-05-21T16:30:00Z', '2026-05-21T16:30:00Z'),
          ($2, $3, 'Inside local day', 'confirmed', $4, '2026-05-21T18:00:00Z', '2026-05-21T18:00:00Z')
      `,
      [randomUUID(), randomUUID(), incidentId, userId]
    );

    const context = await buildReportContext(database, user(userId), incidentId, "daily", {
      date: "2026-05-22",
      timezone: "Asia/Ho_Chi_Minh"
    });

    expect(context.window).toEqual({
      start: "2026-05-21T17:00:00.000Z",
      end: "2026-05-22T17:00:00.000Z"
    });
    expect(context.findings.map((finding) => finding.title)).toEqual(["Inside local day"]);
    expect((context.activity?.created as { findings: unknown[] }).findings).toHaveLength(1);
  });

  it("renders known placeholders and reports unresolved placeholders", async () => {
    const rendered = renderReportTemplate("{{incident.name}}\n{{missing.value}}", {
      generatedAt: "2026-05-22T00:00:00.000Z",
      reportType: "incident",
      incident: { name: "Incident One" },
      findings: [],
      timelineEvents: [],
      tasks: [],
      queries: [],
      indicators: [],
      systems: [],
      accounts: [],
      members: [],
      entityLinks: [],
      tags: { custom: [], attack: [] }
    });

    expect(rendered.markdown).toContain("Incident One");
    expect(rendered.markdown).toContain("{{missing.value}}");
    expect(rendered.unresolvedPlaceholders).toEqual(["missing.value"]);
  });

  it("treats missing incident start and end dates as resolved empty placeholders", async () => {
    const rendered = renderReportTemplate("{{incident.startDate}}|{{incident.endDate}}", {
      generatedAt: "2026-05-22T00:00:00.000Z",
      reportType: "incident",
      incident: { name: "Incident One", start_date: null, end_date: null },
      findings: [],
      timelineEvents: [],
      tasks: [],
      queries: [],
      indicators: [],
      systems: [],
      accounts: [],
      members: [],
      entityLinks: [],
      tags: { custom: [], attack: [] }
    });

    expect(rendered.markdown).toBe("|");
    expect(rendered.unresolvedPlaceholders).toEqual([]);
  });

  it("converts Markdown tables to sanitized HTML tables", () => {
    const html = renderMarkdownToSanitizedHtml([
      "| title | severity | status |",
      "| --- | --- | --- |",
      "| Suspicious login | high | confirmed |",
      "",
      "<script>alert(1)</script>"
    ].join("\n"));

    expect(html).toContain("<table>");
    expect(html).toContain("<th>title</th>");
    expect(html).toContain("<td>Suspicious login</td>");
    expect(html).not.toContain("| --- |");
    expect(html).not.toContain("<script");
  });

  it("preserves markdown images during sanitized report rendering", () => {
    const html = renderMarkdownToSanitizedHtml("![Evidence image](/api/uploads/reports/incident-1/example.png)");

    expect(html).toContain('<img src="/api/uploads/reports/incident-1/example.png"');
    expect(html).toContain('alt="Evidence image"');
  });

  it("inlines uploaded report images for PDF export", async () => {
    const imageIncidentId = "incident-1";
    const storedFilename = "11111111-1111-1111-1111-111111111111.png";
    const uploadDir = path.join(dataDir, "uploads", "reports", imageIncidentId);
    await fsPromises.mkdir(uploadDir, { recursive: true });
    await fsPromises.writeFile(path.join(uploadDir, storedFilename), Buffer.from("png-bytes"));

    const html = await inlineReportUploadImagesForPdf(
      `<div class="forenotes-markdown"><img src="/api/uploads/reports/${imageIncidentId}/${storedFilename}" alt="Evidence image"></div>`,
      imageIncidentId
    );

    expect(html).toContain('src="data:image/png;base64,');
    expect(html).toContain('alt="Evidence image"');
    expect(html).not.toContain(`/api/uploads/reports/${imageIncidentId}/${storedFilename}`);
  });

  it("wraps rendered markdown in a stable shell for branded PDF templates", () => {
    const html = renderPdfHtml({
      report: {
        title: "Incident One Report",
        type: "incident",
        generatedAt: "2026-05-22T00:00:00.000Z",
        markdown: [
          "# Executive Summary",
          "",
          "| title | severity | status |",
          "| --- | --- | --- |",
          "| Suspicious login | high | confirmed |"
        ].join("\n")
      },
      incident: {
        name: "Incident One",
        clientName: "Example Client",
        status: "open"
      },
      htmlTemplate: "<main>{{content}}</main>",
      css: ".forenotes-markdown table { border: 1px solid #000; }"
    });

    expect(html).toContain('class="forenotes-markdown"');
    expect(html).toContain("<table>");
    expect(html).toContain("<h1>Executive Summary</h1>");
  });

  it("builds the LiteLLM service request without leaking secrets into headers", () => {
    const context = {
      generatedAt: "2026-05-22T00:00:00.000Z",
      reportType: "incident" as const,
      incident: { name: "Incident One" },
      findings: [],
      timelineEvents: [],
      tasks: [],
      queries: [],
      indicators: [],
      systems: [],
      accounts: [],
      members: [],
      entityLinks: [],
      tags: { custom: [], attack: [] }
    };

    const payload = buildLiteLlmGenerateReportPayload(
      {
        serviceUrl: "http://localhost:8001",
        provider: "openai",
        model: "openai/gpt-4o-mini",
        systemPrompt: "Follow the incident timeline closely.",
        apiKey: "sk-test-secret",
        apiBase: "https://api.example.test",
        customHeaders: { "HTTP-Referer": "https://forenotes.local" }
      },
      "incident",
      "# {{incident.name}}",
      context
    );

    expect(payload).toMatchObject({
      provider: "openai",
      model: "openai/gpt-4o-mini",
      systemPrompt: "Follow the incident timeline closely.",
      apiKey: "sk-test-secret",
      apiBase: "https://api.example.test",
      customHeaders: { "HTTP-Referer": "https://forenotes.local" },
      reportType: "incident",
      templateMarkdown: "# {{incident.name}}"
    });
  });

  it("masks stored LLM settings without returning plaintext API keys", async () => {
    await saveLlmSettings(database, user(userId), {
      provider: "openai",
      baseUrl: "https://api.example.test",
      model: "gpt-test",
      systemPrompt: "Use terse executive language.",
      apiKey: "sk-test-secret",
      customHeaders: [
        { name: "HTTP-Referer", value: "https://forenotes.local" },
        { name: "X-Title", value: "Forenotes" }
      ]
    });

    const response = await getMaskedLlmSettings(database, user(userId));

    expect(response).toMatchObject({
      configured: true,
      source: "user",
      provider: "openai",
      model: "gpt-test",
      systemPrompt: "Use terse executive language.",
      systemPromptConfigured: true,
      endpointConfigured: true,
      apiKeyConfigured: true,
      customHeadersConfigured: true,
      customHeaders: [
        { name: "HTTP-Referer", configured: true },
        { name: "X-Title", configured: true }
      ]
    });
    expect(JSON.stringify(response)).not.toContain("sk-test-secret");
    expect(JSON.stringify(response)).not.toContain("Forenotes");
  });

  it("rejects unsafe LLM endpoints and credential custom headers", async () => {
    await expect(
      saveLlmSettings(database, user(userId), {
        provider: "openai",
        baseUrl: "http://169.254.169.254/latest/meta-data",
        model: "gpt-test",
        apiKey: "sk-test-secret"
      })
    ).rejects.toThrow("LLM API base URL must use HTTPS");

    await expect(
      saveLlmSettings(database, user(userId), {
        provider: "openai",
        baseUrl: "https://api.example.test",
        model: "gpt-test",
        apiKey: "sk-test-secret",
        customHeaders: [{ name: "Authorization", value: "Bearer leaked" }]
      })
    ).rejects.toThrow("Custom header names cannot override");
  });

  it("allows custom LiteLLM providers without forcing a base URL", async () => {
    const response = await saveLlmSettings(database, user(userId), {
      provider: "nano-gpt",
      model: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test-secret"
    });

    expect(response.provider).toBe("nano-gpt");
    expect(response.endpointConfigured).toBe(false);
  });

  it("preserves hidden LLM key, endpoint, and headers when the user saves only visible fields", async () => {
    await saveLlmSettings(database, user(userId), {
      provider: "nano-gpt",
      baseUrl: "https://nano-gpt.example.test/v1",
      model: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test-secret",
      customHeaders: [
        { name: "HTTP-Referer", value: "https://forenotes.local" },
        { name: "X-Title", value: "Forenotes" }
      ]
    });

    await saveLlmSettings(database, user(userId), {
      provider: "nano-gpt",
      model: "deepseek/deepseek-v4-flash",
      systemPrompt: "Use an executive summary style.",
      apiKey: "",
      customHeaders: []
    });

    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ ok: true, markdown: "OK" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await testLlmSettings(database, user(userId));

    expect(response).toEqual({ ok: true, model: "deepseek/deepseek-v4-flash", source: "user" });
    const fetchBody = JSON.parse(String((fetchMock as unknown as { mock: { calls: Array<[unknown, RequestInit]> } }).mock.calls[0][1].body));
    expect(fetchBody).toMatchObject({
      provider: "nano-gpt",
      model: "deepseek/deepseek-v4-flash",
      systemPrompt: "Use an executive summary style.",
      apiKey: "sk-test-secret",
      apiBase: "https://nano-gpt.example.test/v1",
      customHeaders: {
        "HTTP-Referer": "https://forenotes.local",
        "X-Title": "Forenotes"
      }
    });
  });

  it("lets users recover LLM settings when the stored API key cannot be decrypted", async () => {
    await database.query(
      `
        insert into llm_settings (user_id, provider_name, base_url, model, system_prompt, encrypted_api_key, api_key_mask, custom_headers_json)
        values ($1, 'openai', 'https://api.example.test', 'gpt-test', 'Keep it short.', 'not.decryptable', 'sk-b...oken', '{}'::jsonb)
      `,
      [userId]
    );

    const masked = await getMaskedLlmSettings(database, user(userId));
    expect(masked).toMatchObject({
      configured: true,
      provider: "openai",
      model: "gpt-test",
      systemPrompt: "Keep it short.",
      apiKeyConfigured: true
    });

    await expect(
      testLlmSettings(database, user(userId))
    ).rejects.toThrow("Stored LLM API key could not be decrypted");

    await expect(
      saveLlmSettings(database, user(userId), {
        provider: "openai",
        model: "gpt-test",
        apiKey: "",
        customHeaders: []
      })
    ).rejects.toThrow("Stored LLM API key could not be decrypted");

    const saved = await saveLlmSettings(database, user(userId), {
      provider: "openai",
      model: "gpt-test",
      apiKey: "sk-new-test-secret",
      customHeaders: []
    });
    expect(saved.apiKeyConfigured).toBe(true);
  });

  it("requires an explicit LLM secret key for production API key encryption", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      await expect(
        saveLlmSettings(database, user(userId), {
          provider: "openai",
          baseUrl: "https://api.example.test",
          model: "gpt-test",
          apiKey: "sk-test-secret"
        })
      ).rejects.toThrow("FORENOTES_LLM_SECRET_KEY is required in production.");
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it("falls back to env LLM config without returning provider secrets", async () => {
    process.env.LLM_API_KEY = "";
    process.env.LLM_API_ENDPOINT = "https://api.example.test";
    process.env.LLM_MODEL = "gpt-env";
    process.env.LLM_PROVIDER = "openai";
    process.env.LLM_SYSTEM_PROMPT = "Use the env fallback system prompt.";
    process.env.LLM_CUSTOM_HEADERS_JSON = "{\"HTTP-Referer\":\"https://forenotes.local\",\"X-Title\":\"Forenotes\"}";

    const response = await getMaskedLlmSettings(database, user(userId));

    expect(response).toMatchObject({
      configured: true,
      source: "env",
      provider: "openai",
      model: "gpt-env",
      systemPrompt: "Use the env fallback system prompt.",
      systemPromptConfigured: true,
      endpointConfigured: true,
      apiKeyConfigured: false,
      customHeadersConfigured: true
    });
    expect(JSON.stringify(response)).not.toContain("sk-env-secret");
    expect(JSON.stringify(response)).not.toContain("api.example.test");
    expect(JSON.stringify(response)).not.toContain("forenotes.local");
  });

  it("derives the canonical provider from a prefixed env model when LLM_PROVIDER is omitted", async () => {
    process.env.LLM_API_KEY = "sk-env-secret";
    process.env.LLM_MODEL = "openrouter/openai/gpt-4.1-nano";

    const response = await getMaskedLlmSettings(database, user(userId));

    expect(response).toMatchObject({
      configured: true,
      source: "env",
      provider: "openrouter",
      model: "openrouter/openai/gpt-4.1-nano",
      systemPrompt: "",
      systemPromptConfigured: false,
      endpointConfigured: false,
      apiKeyConfigured: true
    });
  });

  it("tests the configured LiteLLM service using env fallback", async () => {
    process.env.LLM_API_KEY = "sk-env-secret";
    process.env.LLM_API_ENDPOINT = "https://api.example.test/v1";
    process.env.LLM_MODEL = "gpt-env";
    process.env.LLM_SYSTEM_PROMPT = "Return a concise validation response.";
    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ ok: true, markdown: "OK" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await testLlmSettings(database, user(userId));

    expect(response).toEqual({ ok: true, model: "gpt-env", source: "env" });
    expect(JSON.stringify(response)).not.toContain("sk-env-secret");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://litellm.test/generate-report",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
    const fetchBody = JSON.parse(String((fetchMock as unknown as { mock: { calls: Array<[unknown, RequestInit]> } }).mock.calls[0][1].body));
    expect(fetchBody).toMatchObject({
      provider: "openai",
      model: "gpt-env",
      systemPrompt: "Return a concise validation response.",
      apiKey: "sk-env-secret",
      apiBase: "https://api.example.test/v1",
      reportType: "incident"
    });
  });

  it("passes custom provider env configs through to the LiteLLM service unchanged", async () => {
    process.env.LLM_API_KEY = "sk-env-secret";
    process.env.LLM_API_ENDPOINT = "https://nano-gpt.example.test/v1";
    process.env.LLM_PROVIDER = "nano-gpt";
    process.env.LLM_MODEL = "deepseek/deepseek-v4-flash";
    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ ok: true, markdown: "OK" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await testLlmSettings(database, user(userId));

    expect(response).toEqual({ ok: true, model: "deepseek/deepseek-v4-flash", source: "env" });
    const fetchBody = JSON.parse(String((fetchMock as unknown as { mock: { calls: Array<[unknown, RequestInit]> } }).mock.calls[0][1].body));
    expect(fetchBody).toMatchObject({
      provider: "nano-gpt",
      model: "deepseek/deepseek-v4-flash",
      apiKey: "sk-env-secret",
      apiBase: "https://nano-gpt.example.test/v1",
      reportType: "incident"
    });
  });

  it("sends LiteLLM service custom headers and structured report payloads", async () => {
    process.env.LLM_API_KEY = "sk-env-secret";
    process.env.LLM_API_ENDPOINT = "https://api.example.test";
    process.env.LLM_MODEL = "gpt-env";
    process.env.LLM_SYSTEM_PROMPT = "Focus on client-ready wording.";
    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    process.env.LLM_CUSTOM_HEADERS_JSON = "{\"HTTP-Referer\":\"https://forenotes.local\",\"X-Title\":\"Forenotes\"}";
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ ok: true, markdown: "# Generated Report" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const template = await createReportTemplate(database, user(userId), incidentId, {
      name: "LLM",
      reportType: "incident",
      content: "# {{incident.name}}"
    });

    const app = createApp(database);
    const response = await request(app)
      .post(`/api/incidents/${incidentId}/reports/generate`)
      .set("x-user-id", userId)
      .send({ templateId: template.id, reportType: "incident", useLlm: true });

    expect(response.status).toBe(200);
    expect(response.body.preview.markdown).toBe("# Generated Report");
    const fetchCalls = (fetchMock as unknown as { mock: { calls: Array<[unknown, RequestInit]> } }).mock.calls;
    expect(fetchCalls[0][0]).toBe("http://litellm.test/generate-report");
    const fetchOptions = fetchCalls[0][1];
    const fetchBody = JSON.parse(String(fetchOptions.body));
    expect(fetchBody).toMatchObject({
      provider: "openai",
      model: "gpt-env",
      systemPrompt: "Focus on client-ready wording.",
      apiKey: "sk-env-secret",
      apiBase: "https://api.example.test",
      customHeaders: {
        "HTTP-Referer": "https://forenotes.local",
        "X-Title": "Forenotes"
      },
      reportType: "incident",
      templateMarkdown: "# {{incident.name}}"
    });
    expect(JSON.stringify(fetchOptions.headers)).not.toContain("sk-env-secret");
    expect(JSON.stringify(response.body)).not.toContain("sk-env-secret");
  });

  it("returns a safe LLM error when the LiteLLM service fails", async () => {
    process.env.LLM_API_KEY = "sk-env-secret";
    process.env.LLM_MODEL = "gpt-env";
    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ ok: false, error: "LLM generation failed: sk-env-secret" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )));
    const template = await createReportTemplate(database, user(userId), incidentId, {
      name: "LLM",
      reportType: "incident",
      content: "# {{incident.name}}"
    });

    const app = createApp(database);
    const response = await request(app)
      .post(`/api/incidents/${incidentId}/reports/generate`)
      .set("x-user-id", userId)
      .send({ templateId: template.id, reportType: "incident", useLlm: true });

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("LLM generation service failed.");
    expect(JSON.stringify(response.body)).not.toContain("sk-env-secret");
  });

  it("requires report permissions and incident membership", async () => {
    const viewerId = randomUUID();
    await database.query(
      "insert into users (id, username, email, display_name, global_role, status) values ($1, 'viewer', 'viewer@example.com', 'Viewer', 'viewer', 'active')",
      [viewerId]
    );

    await expect(
      createReportTemplate(database, user(viewerId, "viewer"), incidentId, {
        name: "Blocked",
        reportType: "incident",
        content: "# Blocked"
      })
    ).rejects.toThrow("Missing permission: report_template:create");
  });

  it("renders PDF template HTML with sanitized content and escaped variables", () => {
    const html = renderPdfHtml({
      report: {
        title: "<Quarterly>",
        type: "incident",
        generatedAt: "2026-05-22T00:00:00.000Z",
        markdown: "# Body\n\n| title | status |\n| --- | --- |\n| Finding | confirmed |\n\n<script>alert(1)</script>\n\n**Done**"
      },
      incident: {
        name: "Incident <One>",
        clientName: "Client",
        status: "open"
      },
      htmlTemplate: "<html><body onclick=\"alert(1)\"><h1>{{report.title}}</h1>{{content}}<script>bad()</script></body></html>",
      css: "body { color: red; }"
    });

    expect(html).toContain("&lt;Quarterly&gt;");
    expect(html).toContain("<h1>Body</h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>title</th>");
    expect(html).not.toContain("| --- |");
    expect(html).toContain("<strong>Done</strong>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
  });

  it("returns PDF template HTML in API responses for create and list", async () => {
    const app = createApp(database);
    const originalHtml = "<!doctype html><html><body><main>{{content}}</main></body></html>";

    const createResponse = await request(app)
      .post("/api/pdf-templates")
      .set("x-user-id", userId)
      .send({
        name: "Teal",
        scope: "global",
        htmlTemplate: originalHtml,
        css: "body { color: teal; }",
        isDefault: true
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.template.htmlTemplate).toBe(originalHtml);
    const templateId = createResponse.body.template.id as string;

    const listResponse = await request(app)
      .get(`/api/pdf-templates?incidentId=${incidentId}`)
      .set("x-user-id", userId);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.templates).toHaveLength(1);
    expect(listResponse.body.templates[0].htmlTemplate).toBe(originalHtml);
  });

  it("persists preview-approved reports and exports a non-empty PDF buffer", async () => {
    const template = await createReportTemplate(database, user(userId), incidentId, {
      name: "Incident report",
      reportType: "incident",
      content: "# {{incident.name}}"
    });
    const context = await buildReportContext(database, user(userId), incidentId, "incident");
    const report = await createReport(database, user(userId), incidentId, {
      templateId: String(template.id),
      title: "Incident One Report",
      reportType: "incident",
      markdown: "# Incident One\n\nFinal report",
      generationMode: "deterministic",
      generatedContext: context,
      unresolvedPlaceholders: []
    });

    const exported = await exportReportPdf(database, user(userId), incidentId, String(report.id));

    expect(exported.fileName).toBe("Incident_One_Report.pdf");
    expect(exported.pdf.byteLength).toBeGreaterThan(0);
    expect(exported.pdf.toString("utf8", 0, 5)).toBe("%PDF-");
  }, 30000);

  it("supports report routes for template CRUD, generation, save, export, and unauthenticated denial", async () => {
    const app = createApp(database);
    await database.query(
      `
        insert into findings (id, incident_id, title, severity, status, created_by_user_id)
        values ($1, $2, 'Route finding', 'high', 'confirmed', $3)
      `,
      [randomUUID(), incidentId, userId]
    );
    const createTemplateResponse = await request(app)
      .post(`/api/incidents/${incidentId}/report-templates`)
      .set("x-user-id", userId)
      .send({
        name: "Route incident report",
        reportType: "incident",
        content: "# {{incident.name}}\n\n{{findings.table}}"
      });

    expect(createTemplateResponse.status).toBe(201);
    const templateId = createTemplateResponse.body.template.id as string;

    const listTemplateResponse = await request(app)
      .get(`/api/incidents/${incidentId}/report-templates`)
      .set("x-user-id", userId);
    expect(listTemplateResponse.status).toBe(200);
    expect(listTemplateResponse.body.templates).toHaveLength(1);

    const generateResponse = await request(app)
      .post(`/api/incidents/${incidentId}/reports/generate`)
      .set("x-user-id", userId)
      .send({ templateId, reportType: "incident", useLlm: false });
    expect(generateResponse.status).toBe(200);
    expect(generateResponse.body.preview.markdown).toContain("Incident One");
    expect(generateResponse.body.preview.markdown).toContain("| title | severity | status |");

    const saveResponse = await request(app)
      .post(`/api/incidents/${incidentId}/reports`)
      .set("x-user-id", userId)
      .send(generateResponse.body.preview);
    expect(saveResponse.status).toBe(201);
    const reportId = saveResponse.body.report.id as string;

    const exportResponse = await request(app)
      .post(`/api/incidents/${incidentId}/reports/${reportId}/export/pdf`)
      .set("x-user-id", userId);
    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers["content-type"]).toContain("application/pdf");
    expect(exportResponse.headers["content-disposition"]).toContain("attachment");
    expect(exportResponse.body.length).toBeGreaterThan(0);

    process.env.LLM_API_KEY = "sk-route-secret";
    process.env.LLM_API_ENDPOINT = "https://api.example.test/v1/chat/completions";
    process.env.LLM_MODEL = "gpt-route";
    process.env.LITELLM_SERVICE_URL = "http://litellm.test";
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ ok: true, markdown: "OK" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    const llmStatusResponse = await request(app)
      .get("/api/me/llm-settings")
      .set("x-user-id", userId);
    expect(llmStatusResponse.status).toBe(200);
    expect(llmStatusResponse.body).toMatchObject({
      configured: true,
      source: "env",
      provider: "openai",
      model: "gpt-route",
      endpointConfigured: true,
      apiKeyConfigured: true,
      customHeadersConfigured: false
    });
    expect(JSON.stringify(llmStatusResponse.body)).not.toContain("sk-route-secret");

    const llmTestResponse = await request(app)
      .post("/api/me/llm-settings/test")
      .set("x-user-id", userId);
    expect(llmTestResponse.status).toBe(200);
    expect(llmTestResponse.body).toEqual({ ok: true, model: "gpt-route", source: "env" });
    expect(JSON.stringify(llmTestResponse.body)).not.toContain("sk-route-secret");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://litellm.test/generate-report",
      expect.objectContaining({ method: "POST" })
    );

    const unauthenticatedResponse = await request(app).get(`/api/incidents/${incidentId}/reports`);
    expect(unauthenticatedResponse.status).toBe(401);
  }, 30000);
});
