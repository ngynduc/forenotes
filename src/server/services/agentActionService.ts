import { createHash, randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import { AppError, isAppError } from "../errors.js";
import { withTransaction } from "../db/transaction.js";
import type { McpPrincipal } from "./mcpTokenService.js";

interface ActionContext {
  principal: McpPrincipal;
  clientName?: string | null;
  runId?: string | null;
  toolName: string;
  input: Record<string, unknown>;
  idempotencyKey?: string;
  write: boolean;
}

export async function executeAgentAction<T>(
  database: Database,
  context: ActionContext,
  work: (transaction: Database) => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  const inputHash = stableHash(context.input);
  try {
    if (context.write) {
      if (!context.idempotencyKey?.trim()) {
        throw new AppError(400, "idempotencyKey is required for write tools.");
      }
      return await withTransaction(database, async (transaction) => {
        const prior = await transaction.query<{ input_hash: string; result_json: T }>(
          "select input_hash, result_json from mcp_idempotency_results where token_id=$1 and idempotency_key=$2",
          [context.principal.accessToken.id, context.idempotencyKey]
        );
        if (prior.rowCount) {
          if (prior.rows[0].input_hash !== inputHash) {
            throw new AppError(409, "Idempotency key was already used with different input.");
          }
          await recordAgentAction(transaction, context, startedAt, "succeeded", prior.rows[0].result_json, true);
          return prior.rows[0].result_json;
        }
        const result = await work(transaction);
        await transaction.query(
          `insert into mcp_idempotency_results (token_id,idempotency_key,input_hash,result_json)
           values ($1,$2,$3,$4::jsonb)`,
          [context.principal.accessToken.id, context.idempotencyKey, inputHash, JSON.stringify(result)]
        );
        await recordAgentAction(transaction, context, startedAt, "succeeded", result);
        return result;
      });
    }

    const result = await work(database);
    await recordAgentAction(database, context, startedAt, "succeeded", summarizeResult(result));
    return result;
  } catch (error) {
    try {
      await recordAgentAction(database, context, startedAt, "failed", undefined, false, safeError(error));
    } catch {
      // Preserve the original tool error if action persistence also fails.
    }
    throw error;
  }
}

export async function listAgentActions(
  database: Database,
  userId: string,
  filters: { caseId: string; incidentId?: string; runId?: string; limit?: number; offset?: number }
) {
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const offset = Math.max(0, filters.offset ?? 0);
  const params: unknown[] = [userId, filters.caseId];
  const conditions = ["cm.user_id=$1", "r.case_id=$2"];
  if (filters.runId) {
    params.push(filters.runId);
    conditions.push(`aa.run_id=$${params.length}`);
  }
  if (filters.incidentId) {
    params.push(filters.incidentId);
    conditions.push(`exists (
      select 1 from evidence_records e where e.run_id=aa.run_id and e.incident_id=$${params.length}
      union select 1 from observations o where o.run_id=aa.run_id and o.incident_id=$${params.length}
      union select 1 from hypotheses h where h.run_id=aa.run_id and h.incident_id=$${params.length}
    )`);
  }
  params.push(limit, offset);
  const result = await database.query(
    `select aa.* from agent_actions aa
     join investigation_runs r on r.id=aa.run_id
     join case_members cm on cm.case_id=r.case_id
     where ${conditions.join(" and ")}
     order by aa.created_at desc limit $${params.length - 1} offset $${params.length}`,
    params
  );
  return { items: result.rows.map(camelizeRecord), limit, offset };
}

async function recordAgentAction(
  database: Database,
  context: ActionContext,
  startedAt: number,
  outcome: "succeeded" | "failed",
  result?: unknown,
  replayed = false,
  errorSummary?: string
) {
  const refs = collectRecordRefs(result);
  const resultRecord = result && typeof result === "object" && !Array.isArray(result) ? result as Record<string, unknown> : null;
  const resolvedRunId = context.runId ?? (resultRecord && "objective" in resultRecord && typeof resultRecord.id === "string" ? resultRecord.id : null);
  await database.query(
    `insert into agent_actions (
       id,token_id,user_id,client_name,run_id,tool_name,idempotency_key,input_hash,input_json,
       outcome,duration_ms,error_summary,result_summary_json,record_refs_json
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13::jsonb,$14::jsonb)`,
    [randomUUID(), context.principal.accessToken.id, context.principal.user.id, context.clientName ?? null,
      resolvedRunId, context.toolName, context.idempotencyKey ?? null, stableHash(context.input),
      JSON.stringify(context.input), outcome, Math.max(0, Date.now() - startedAt), errorSummary ?? null,
      JSON.stringify(replayed ? { replayed: true, result: summarizeResult(result) } : summarizeResult(result)), JSON.stringify(refs)]
  );
}

function stableHash(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function summarizeResult(result: unknown): unknown {
  if (Array.isArray(result)) return { count: result.length };
  if (!result || typeof result !== "object") return result;
  const record = result as Record<string, unknown>;
  if (Array.isArray(record.items)) return { count: record.items.length, limit: record.limit, offset: record.offset };
  return Object.fromEntries(Object.entries(record).filter(([key]) => ["id", "status", "caseId", "incidentId", "runId"].includes(key)));
}

function collectRecordRefs(result: unknown) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return [];
  const record = result as Record<string, unknown>;
  return typeof record.id === "string" ? [{ id: record.id, type: inferRecordType(record) }] : [];
}

function inferRecordType(record: Record<string, unknown>) {
  if ("evidenceType" in record) return "evidence";
  if ("objective" in record) return "investigation_run";
  if ("observationIds" in record) return "hypothesis";
  if ("evidenceIds" in record) return "observation";
  return "record";
}

function safeError(error: unknown) {
  return isAppError(error) ? error.message : "Tool execution failed.";
}

function camelizeRecord(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value
  ]));
}
