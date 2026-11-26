import { createApp } from "./app.js";
import { env } from "./env.js";
import { pool } from "./db/pool.js";

const log = (event: string, error?: unknown) =>
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event, message: error instanceof Error ? error.stack : String(error ?? "") })}\n`);

const app = createApp();

const server = app.listen(env.PORT, env.APP_HOST, () => {
  process.stdout.write(`Forenotes API listening on http://${env.APP_HOST}:${env.PORT}\n`);
});

process.on("unhandledRejection", (reason) => log("unhandled_rejection", reason));
process.on("uncaughtException", (error) => {
  log("uncaught_exception", error);
  // State is unknown after an uncaught exception; exit and let the container restart policy recover.
  process.exit(1);
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log("shutdown", signal);
  // Long-lived streams (notifications, report chat) would hold close() open; give in-flight requests 10s.
  setTimeout(() => process.exit(0), 10_000).unref();
  server.close(() => void pool.end().finally(() => process.exit(0)));
  server.closeIdleConnections();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
