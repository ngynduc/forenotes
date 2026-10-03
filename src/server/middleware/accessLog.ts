import type { RequestHandler } from "express";

export interface HttpAccessLog {
  timestamp: string;
  event: "http_request";
  method: string;
  path: string;
  status: number | null;
  durationMs: number;
  outcome: "completed" | "aborted";
}

export type AccessLogWriter = (entry: HttpAccessLog) => void;

export function createAccessLogger(writeLog: AccessLogWriter = writeAccessLog): RequestHandler {
  return (request, response, next) => {
    const started = performance.now();
    // Capture before mounted routers rewrite the URL; omit query strings and credentials.
    const method = request.method;
    const requestPath = request.path;
    let logged = false;

    const log = () => {
      if (logged) return;
      logged = true;
      const completed = response.writableFinished;
      writeLog({
        timestamp: new Date().toISOString(),
        event: "http_request",
        method,
        path: requestPath,
        status: completed ? response.statusCode : null,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        outcome: completed ? "completed" : "aborted"
      });
    };

    response.once("finish", log);
    response.once("close", log);
    next();
  };
}

function writeAccessLog(entry: HttpAccessLog) {
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}
