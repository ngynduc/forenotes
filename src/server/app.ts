import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { ZodError } from "zod";
import type { Database } from "./db/types.js";
import { pool } from "./db/pool.js";
import { isAppError } from "./errors.js";
import { createRoutes } from "./routes/index.js";

export function createApp(database: Database = pool) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.resolve("dist/client")));
  app.use(express.static(path.resolve("src/client/static")));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use(createRoutes(database));

  app.get("/", (_request, response) => {
    response.sendFile(path.resolve("dist/client/index.html"));
  });

  // SPA fallback: serve index.html for all non-API routes
  app.get("*spa", (request, response, next) => {
    if (request.path.startsWith("/api")) return next();
    response.sendFile(path.resolve("dist/client/index.html"));
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
