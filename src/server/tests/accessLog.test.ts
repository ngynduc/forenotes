import { EventEmitter } from "node:events";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { pool } from "../db/pool.js";
import { createAccessLogger, type HttpAccessLog } from "../middleware/accessLog.js";

afterEach(() => vi.restoreAllMocks());

describe("HTTP access logs", () => {
  it("writes one JSON line to stdout with the completed status and duration", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const app = express();
    app.use(createAccessLogger());
    app.get("/example", (_request, response) => response.status(201).json({ ok: true }));

    await request(app).get("/example").expect(201);

    expect(stdout).toHaveBeenCalledTimes(1);
    const line = stdout.mock.calls[0][0] as string;
    expect(line).toMatch(/\n$/);
    const entry = JSON.parse(line);
    expect(entry).toMatchObject({ event: "http_request", method: "GET", path: "/example", status: 201, outcome: "completed" });
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("logs the original path without query strings, credentials, or bodies", async () => {
    const entries: HttpAccessLog[] = [];
    const app = express();
    app.use(createAccessLogger((entry) => entries.push(entry)));
    app.use(express.json());
    const router = express.Router();
    router.post("/login", (_request, response) => response.json({ token: "response-secret" }));
    app.use("/api/auth", router);

    await request(app).post("/api/auth/login?token=query-secret")
      .set("Authorization", "Bearer header-secret")
      .set("Cookie", "forenotes_session=cookie-secret")
      .send({ password: "body-secret" }).expect(200);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ method: "POST", path: "/api/auth/login", status: 200 });
    expect(JSON.stringify(entries)).not.toContain("secret");
  });

  it.each([400, 401, 403, 404, 500])("records the final %i status, including handler failures", async (status) => {
    const entries: HttpAccessLog[] = [];
    const app = express();
    app.use(createAccessLogger((entry) => entries.push(entry)));
    app.get("/failure", (_request, response, next) => status === 500 ? next(new Error("private details")) : response.sendStatus(status));
    app.use((_error: unknown, _request: Request, response: Response, _next: NextFunction) => response.sendStatus(500));

    await request(app).get("/failure").expect(status);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ status, outcome: "completed" });
    expect(JSON.stringify(entries)).not.toContain("private details");
  });

  it("logs app health, mounted API errors, MCP errors, and invalid JSON", async () => {
    const entries: HttpAccessLog[] = [];
    const app = createApp(pool, {
      accessLogWriter: (entry) => entries.push(entry),
      mcp: { enabled: true, publicUrl: "http://127.0.0.1/mcp", allowedOrigins: [] }
    });

    await request(app).get("/api/health?key=hidden").expect(200);
    await request(app).get("/api/cases").expect(401);
    await request(app).post("/mcp").set("Host", "127.0.0.1").send({}).expect(401);
    await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{invalid").expect(500);

    expect(entries.map(({ method, path, status }) => ({ method, path, status }))).toEqual([
      { method: "GET", path: "/api/health", status: 200 },
      { method: "GET", path: "/api/cases", status: 401 },
      { method: "POST", path: "/mcp", status: 401 },
      { method: "POST", path: "/api/auth/login", status: 500 }
    ]);
  });

  it("logs static responses", async () => {
    const entries: HttpAccessLog[] = [];
    const app = express();
    app.use(createAccessLogger((entry) => entries.push(entry)));
    app.use(express.static("src/server/tests"));

    await request(app).get("/accessLog.test.ts").expect(200);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ path: "/accessLog.test.ts", status: 200 });
  });

  it("records an aborted response without claiming a completed status", () => {
    const entries: HttpAccessLog[] = [];
    const response = Object.assign(new EventEmitter(), { writableFinished: false, statusCode: 200 });
    createAccessLogger((entry) => entries.push(entry))(
      { method: "GET", path: "/api/notifications/events" } as Request,
      response as unknown as Response,
      vi.fn()
    );

    response.emit("close");
    response.emit("close");
    response.emit("finish");

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ status: null, outcome: "aborted" });
  });
});
