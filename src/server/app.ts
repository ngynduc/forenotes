import express from "express";
import type { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ZodError } from "zod";
import type { Database } from "./db/types.js";
import { pool } from "./db/pool.js";
import { isAppError } from "./errors.js";
import { createRoutes } from "./routes/index.js";
import { createRequestScopedDatabase, runRequestTransaction } from "./db/transaction.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDistDir = path.resolve(currentDir, "../client");

export function createApp(database: Database = pool) {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(express.json());
  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  const requestDatabase = createRequestScopedDatabase(database);
  app.use(async (request, response, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      next();
      return;
    }
    try {
      await runRequestTransaction(database, next, (commit, rollback) => {
        let settled = false;
        const complete = (shouldCommit: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          void (shouldCommit ? commit() : rollback());
        };
        response.once("finish", () => complete(response.statusCode < 400));
        response.once("close", () => complete(false));
      });
    } catch (error) {
      next(error);
    }
  });
  app.use(createRoutes(requestDatabase));
  app.use(express.static(clientDistDir));
  app.get("/{*path}", (_request, response) => {
    response.sendFile(path.join(clientDistDir, "index.html"));
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Validation failed",
        details: error.flatten()
      });
      return;
    }

    if (isAppError(error)) {
      response.status(error.statusCode).json({
        error: error.message,
        details: error.details ?? null
      });
      return;
    }

    response.status(500).json({
      error: "Internal server error"
    });
  });

  return app;
}

function securityHeaders(_request: Request, response: Response, next: NextFunction) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
}
