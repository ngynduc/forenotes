import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import { createApp } from "../app.js";
import type { Database } from "../db/types.js";
import { runMigrations } from "../db/setup.js";
import { parseAndVerifyLicenseKey } from "../services/licenseService.js";
import { TIER_FEATURES, type LicenseTier, type SignedLicensePayload } from "../../shared/license.js";

const TEST_LICENSE_KEYS = generateKeyPairSync("ed25519");
const TEST_PUBLIC_KEY_PEM = TEST_LICENSE_KEYS.publicKey.export({ type: "spki", format: "pem" }).toString();

async function createTestApp() {
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as Database;
  await runMigrations(pool);
  return {
    app: createApp(pool),
    pool
  };
}

function issueLicense(input: Partial<SignedLicensePayload> = {}) {
  const tier: LicenseTier = input.tier ?? "pro";
  const payload: SignedLicensePayload = {
    licenseId: input.licenseId ?? `lic_${randomUUID()}`,
    customerName: input.customerName ?? "Acme Security",
    tier,
    seats: input.seats ?? (tier === "teams" ? 3 : 1),
    issuedAt: input.issuedAt ?? "2026-01-01T00:00:00.000Z",
    expiresAt: input.expiresAt ?? "2027-01-01T00:00:00.000Z",
    features: input.features ?? TIER_FEATURES[tier],
    deploymentId: input.deploymentId
  };
  const payloadJson = JSON.stringify(payload);
  return `FNLIC-v1.${Buffer.from(payloadJson, "utf8").toString("base64url")}.${sign(null, Buffer.from(payloadJson, "utf8"), TEST_LICENSE_KEYS.privateKey).toString("base64url")}`;
}

function tamperPayload(licenseKey: string) {
  const [prefix, encodedPayload, signature] = licenseKey.split(".");
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SignedLicensePayload;
  payload.tier = "teams";
  const tamperedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${prefix}.${tamperedPayload}.${signature}`;
}

async function getAdminId(database: Database) {
  const result = await database.query<{ id: string }>("select id from users where global_role = 'admin' order by created_at asc limit 1");
  return result.rows[0].id;
}

async function insertUser(database: Database, input: { id?: string; role: string; username: string; email: string; displayName: string }) {
  const id = input.id ?? randomUUID();
  await database.query(
    `
      insert into users (id, username, email, display_name, global_role, status)
      values ($1, $2, $3, $4, $5, 'active')
    `,
    [id, input.username, input.email, input.displayName, input.role]
  );
  return id;
}

async function seedIncident(database: Database, adminId: string) {
  const caseId = randomUUID();
  const incidentId = randomUUID();
  await database.query(
    "insert into cases (id, case_name, status, created_by_user_id) values ($1, 'License Case', 'open', $2)",
    [caseId, adminId]
  );
  await database.query(
    "insert into case_members (case_id, user_id, case_role, added_by_user_id) values ($1, $2, 'commander', $2)",
    [caseId, adminId]
  );
  await database.query(
    "insert into incidents (id, case_id, name, status, created_by_user_id) values ($1, $2, 'License Incident', 'open', $3)",
    [incidentId, caseId, adminId]
  );
  await database.query(
    "insert into incident_members (incident_id, user_id, incident_role, added_by_user_id) values ($1, $2, 'commander', $2)",
    [incidentId, adminId]
  );
  return { caseId, incidentId };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("licensing", () => {
  let app: ReturnType<typeof createApp>;
  let pool: Database;
  let adminId: string;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), "forenotes-license-"));
    process.env.FORENOTES_DATA_DIR = dataDir;
    process.env.FORENOTES_TEST_LICENSE_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM;
    const setup = await createTestApp();
    app = setup.app;
    pool = setup.pool;
    adminId = await getAdminId(pool);
  });

  afterEach(() => {
    delete process.env.FORENOTES_DATA_DIR;
    delete process.env.FORENOTES_LICENSE_FILE;
    delete process.env.FORENOTES_TEST_LICENSE_PUBLIC_KEY;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("defaults to Individual Free when no license exists", async () => {
    const response = await request(app).get("/api/license/status").set("x-user-id", adminId);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tier: "individual",
      status: "active",
      seats: 1,
      features: [],
      source: "free"
    });
    expect(response.body.deploymentId).toEqual(expect.any(String));
  });

  it("rejects invalid and tampered license keys", async () => {
    const invalidResponse = await request(app)
      .post("/api/license/activate")
      .set("x-user-id", adminId)
      .send({ licenseKey: "not-a-license" });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error).toBe("INVALID_LICENSE");

    const tamperedResponse = await request(app)
      .post("/api/license/activate")
      .set("x-user-id", adminId)
      .send({ licenseKey: tamperPayload(issueLicense({ tier: "pro" })) });

    expect(tamperedResponse.status).toBe(400);
    expect(tamperedResponse.body.error).toBe("INVALID_LICENSE");
  });

  it("verifies Pro and Teams feature mappings", () => {
    const pro = parseAndVerifyLicenseKey(issueLicense({ tier: "pro" }), TEST_PUBLIC_KEY_PEM);
    const teams = parseAndVerifyLicenseKey(issueLicense({ tier: "teams" }), TEST_PUBLIC_KEY_PEM);

    expect(pro.features).toEqual(["graph"]);
    expect(teams.features).toEqual(["graph", "multi_user", "tasks", "case_collaboration"]);
  });

  it("activates and persists a Pro license", async () => {
    const licenseKey = issueLicense({ tier: "pro" });

    const activateResponse = await request(app)
      .post("/api/license/activate")
      .set("x-user-id", adminId)
      .send({ licenseKey });

    expect(activateResponse.status).toBe(200);
    expect(activateResponse.body).toMatchObject({
      tier: "pro",
      status: "active",
      source: "database",
      features: ["graph"]
    });
    expect(activateResponse.body.deploymentId).toEqual(expect.any(String));

    const restartedApp = createApp(pool);
    const statusResponse = await request(restartedApp).get("/api/license/status").set("x-user-id", adminId);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.tier).toBe("pro");
    expect(statusResponse.body.features).toEqual(["graph"]);
  });

  it("requires user management permission to activate and deactivate licenses while status remains readable", async () => {
    const commanderId = await insertUser(pool, {
      username: "license-commander",
      email: "license-commander@example.com",
      displayName: "License Commander",
      role: "commander"
    });
    const analystId = await insertUser(pool, {
      username: "license-analyst",
      email: "license-analyst@example.com",
      displayName: "License Analyst",
      role: "analyst"
    });
    const viewerId = await insertUser(pool, {
      username: "license-viewer",
      email: "license-viewer@example.com",
      displayName: "License Viewer",
      role: "viewer"
    });
    const licenseKey = issueLicense({ tier: "pro" });

    for (const userId of [commanderId, analystId, viewerId]) {
      const statusResponse = await request(app).get("/api/license/status").set("x-user-id", userId);
      expect(statusResponse.status).toBe(200);

      const activateResponse = await request(app)
        .post("/api/license/activate")
        .set("x-user-id", userId)
        .send({ licenseKey });
      expect(activateResponse.status).toBe(403);
      expect(activateResponse.body.error).toBe("Missing permission: user:manage");
    }

    const adminActivateResponse = await request(app)
      .post("/api/license/activate")
      .set("x-user-id", adminId)
      .send({ licenseKey });
    expect(adminActivateResponse.status).toBe(200);

    for (const userId of [commanderId, analystId, viewerId]) {
      const deactivateResponse = await request(app)
        .post("/api/license/deactivate")
        .set("x-user-id", userId);
      expect(deactivateResponse.status).toBe(403);
      expect(deactivateResponse.body.error).toBe("Missing permission: user:manage");
    }

    const adminDeactivateResponse = await request(app).post("/api/license/deactivate").set("x-user-id", adminId);
    expect(adminDeactivateResponse.status).toBe(200);
    expect(adminDeactivateResponse.body.source).toBe("free");
  });

  it("blocks direct premium API calls without the required feature", async () => {
    const { incidentId } = await seedIncident(pool, adminId);

    const graphResponse = await request(app).get(`/api/incidents/${incidentId}/graph`).set("x-user-id", adminId);
    const taskResponse = await request(app).get(`/api/incidents/${incidentId}/tasks`).set("x-user-id", adminId);

    expect(graphResponse.status).toBe(403);
    expect(graphResponse.body.error).toBe("FEATURE_NOT_LICENSED");
    expect(taskResponse.status).toBe(403);
    expect(taskResponse.body.error).toBe("FEATURE_NOT_LICENSED");
  });

  it("allows Graph on Pro but blocks Teams-only features", async () => {
    const { incidentId } = await seedIncident(pool, adminId);
    const analystId = await insertUser(pool, {
      username: "pro-collab",
      email: "pro-collab@example.com",
      displayName: "Pro Collaborator",
      role: "analyst"
    });
    await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "pro" })
    });

    const graphResponse = await request(app).get(`/api/incidents/${incidentId}/graph`).set("x-user-id", adminId);
    const taskResponse = await request(app).get(`/api/incidents/${incidentId}/tasks`).set("x-user-id", adminId);
    const userResponse = await request(app).post("/api/users").set("x-user-id", adminId).send({
      email: "new-user@example.com",
      displayName: "New User",
      globalRole: "analyst"
    });
    const caseResponse = await request(app).post("/api/cases").set("x-user-id", adminId).send({
      caseName: "Pro Collaboration Block",
      status: "open",
      members: [{ userId: analystId, caseRole: "analyst" }]
    });

    expect(graphResponse.status).toBe(200);
    expect(taskResponse.status).toBe(403);
    expect(taskResponse.body.error).toBe("FEATURE_NOT_LICENSED");
    expect(userResponse.status).toBe(403);
    expect(userResponse.body.error).toBe("FEATURE_NOT_LICENSED");
    expect(caseResponse.status).toBe(403);
    expect(caseResponse.body.error).toBe("FEATURE_NOT_LICENSED");
    expect(caseResponse.body.details.feature).toBe("case_collaboration");
  });

  it("allows Teams collaboration and task workflows", async () => {
    const analystId = await insertUser(pool, {
      username: "teams-collab",
      email: "teams-collab@example.com",
      displayName: "Teams Collaborator",
      role: "analyst"
    });
    await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "teams", seats: 10 })
    });

    const caseResponse = await request(app).post("/api/cases").set("x-user-id", adminId).send({
      caseName: "Teams Collaboration",
      status: "open",
      members: [{ userId: analystId, caseRole: "analyst" }]
    });
    expect(caseResponse.status).toBe(201);
    const caseId = caseResponse.body.case.id;

    const incidentResponse = await request(app).post(`/api/cases/${caseId}/incidents`).set("x-user-id", adminId).send({
      name: "Teams Incident",
      status: "open"
    });
    expect(incidentResponse.status).toBe(201);
    const incidentId = incidentResponse.body.incident.id;

    const taskResponse = await request(app).post(`/api/incidents/${incidentId}/tasks`).set("x-user-id", adminId).send({
      title: "Teams task",
      status: "todo",
      priority: "medium"
    });
    expect(taskResponse.status).toBe(201);

    const removeResponse = await request(app)
      .delete(`/api/cases/${caseId}/members/${analystId}`)
      .set("x-user-id", adminId);
    expect(removeResponse.status).toBe(204);
  });

  it("enforces Teams seat limits on user creation", async () => {
    await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "teams", seats: 3 })
    });
    await pool.query(
      `
        insert into users (id, username, email, display_name, global_role, status)
        values
          ($1, 'analyst1', 'analyst1@example.com', 'Analyst One', 'analyst', 'active'),
          ($2, 'analyst2', 'analyst2@example.com', 'Analyst Two', 'analyst', 'active')
      `,
      [randomUUID(), randomUUID()]
    );

    const response = await request(app).post("/api/users").set("x-user-id", adminId).send({
      email: "blocked@example.com",
      displayName: "Blocked User",
      globalRole: "analyst"
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("SEAT_LIMIT_REACHED");
  });

  it("keeps features during grace and blocks them after grace expires", async () => {
    const { incidentId } = await seedIncident(pool, adminId);
    const graceResponse = await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({
        tier: "teams",
        issuedAt: daysAgo(40),
        expiresAt: daysAgo(7)
      })
    });

    expect(graceResponse.body.status).toBe("grace");
    expect(graceResponse.body.features).toContain("tasks");

    await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({
        tier: "teams",
        issuedAt: daysAgo(60),
        expiresAt: daysAgo(20)
      })
    });
    const expiredResponse = await request(app).get(`/api/incidents/${incidentId}/graph`).set("x-user-id", adminId);

    expect(expiredResponse.status).toBe(403);
    expect(expiredResponse.body.error).toBe("LICENSE_EXPIRED");
  });

  it("loads a mounted license file from FORENOTES_LICENSE_FILE", async () => {
    const licensePath = path.join(dataDir, "license.key");
    writeFileSync(licensePath, issueLicense({ tier: "pro" }));
    process.env.FORENOTES_LICENSE_FILE = licensePath;

    const response = await request(app).get("/api/license/status").set("x-user-id", adminId);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tier: "pro",
      source: "file",
      features: ["graph"]
    });
    expect(response.body.deploymentId).toEqual(expect.any(String));
  });

  it("allows unbound licenses and enforces exact deployment binding when present", async () => {
    const unboundResponse = await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "pro" })
    });
    expect(unboundResponse.status).toBe(200);

    const deploymentId = unboundResponse.body.deploymentId;
    const boundResponse = await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "teams", deploymentId })
    });
    expect(boundResponse.status).toBe(200);
    expect(boundResponse.body.deploymentId).toBe(deploymentId);

    const mismatchResponse = await request(app).post("/api/license/activate").set("x-user-id", adminId).send({
      licenseKey: issueLicense({ tier: "teams", deploymentId: "different-deployment" })
    });
    expect(mismatchResponse.status).toBe(400);
    expect(mismatchResponse.body.error).toBe("DEPLOYMENT_MISMATCH");
  });
});
