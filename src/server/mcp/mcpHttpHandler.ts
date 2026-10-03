import type { Request, RequestHandler } from "express";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import type { Database } from "../db/types.js";
import { authenticateMcpToken, type McpPrincipal } from "../services/mcpTokenService.js";
import { createForenotesMcpServer } from "./registerMcpTools.js";

export interface McpHttpConfig {
  enabled: boolean;
  publicUrl?: string;
  allowedOrigins: string[];
}

interface AuthenticatedMcpRequest extends Request {
  auth?: AuthInfo;
}

export function createMcpHttpHandler(database: Database, config: McpHttpConfig): RequestHandler {
  if (!config.enabled) {
    return (_request, response) => response.status(404).json({ error: "Not found" });
  }

  const publicUrl = new URL(config.publicUrl ?? "http://127.0.0.1/mcp");
  const allowedOrigins = new Set([publicUrl.origin, ...config.allowedOrigins.map(normalizeOrigin)]);
  const allowedHosts = new Set([...allowedOrigins].map((origin) => new URL(origin).hostname));
  const handler = createMcpHandler(({ authInfo, requestInfo }) => {
    const principal = authInfo?.extra?.principal as McpPrincipal | undefined;
    if (!principal) throw new Error("Authenticated MCP principal missing.");
    return createForenotesMcpServer({
      database,
      principal,
      clientName: requestInfo?.headers.get("user-agent")?.slice(0, 200) || "unknown-client"
    });
  }, { legacy: "stateless", responseMode: "json" });
  const nodeHandler = toNodeHandler(handler);

  return async (request: AuthenticatedMcpRequest, response, next) => {
    try {
      const host = request.get("host");
      const hostname = host ? new URL(`http://${host}`).hostname : "";
      if (!hostname || !allowedHosts.has(hostname)) {
        response.status(403).json(jsonRpcError(null, -32001, "Invalid Host header."));
        return;
      }
      const origin = request.get("origin");
      if (origin && !allowedOrigins.has(normalizeOrigin(origin))) {
        response.status(403).json(jsonRpcError(null, -32001, "Invalid Origin header."));
        return;
      }
      const authorization = request.get("authorization");
      const match = authorization?.match(/^Bearer ([^\s]+)$/);
      if (!match) {
        response.setHeader("WWW-Authenticate", "Bearer");
        response.status(401).json(jsonRpcError(null, -32002, "Bearer authentication required."));
        return;
      }
      const principal = await authenticateMcpToken(database, match[1]);
      request.auth = {
        token: principal.accessToken.id,
        clientId: principal.user.id,
        scopes: principal.accessToken.scope === "read_write" ? ["investigation:read", "investigation:write"] : ["investigation:read"],
        expiresAt: Math.floor(new Date(principal.accessToken.expiresAt).getTime() / 1000),
        extra: { principal }
      };
      await nodeHandler(request, response);
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        const status = Number((error as { statusCode: number }).statusCode);
        const message = "message" in error && typeof error.message === "string" ? error.message : "MCP authentication failed.";
        response.status(status).json(jsonRpcError(null, status === 403 ? -32003 : -32002, message));
        return;
      }
      next(error);
    }
  };
}

function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

function jsonRpcError(id: null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
