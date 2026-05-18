import express from "express";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { Database } from "./db/types.js";
import { pool } from "./db/pool.js";
import { isAppError } from "./errors.js";
import { createRoutes } from "./routes/index.js";

export function createApp(database: Database = pool) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use(createRoutes(database));

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
