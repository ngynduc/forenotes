import type { ReportContext } from "../../shared/reportTypes.js";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import type { AuthenticatedUser } from "./authService.js";
import { requirePermission } from "../permissions/permissionService.js";
import { streamChat } from "./llmClient.js";
import { buildReportContext, resolveLlmConfig } from "./reportService.js";

export interface ChatMessage { role: "user" | "assistant"; content: string }
export type ChatEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; id: string; name: string; args: unknown; status: "done" | "error"; summary: string }
  | { type: "done" }
  | { type: "error"; message: string };

const MAX_STEPS = 8;
const MAX_TOOL_CHARS = 12000;
const ENTITIES = ["findings", "timeline_events", "tasks", "queries", "indicators", "systems", "accounts", "entity_links", "custom_tags", "attack_tags", "members"] as const;
type Entity = (typeof ENTITIES)[number];

export const BUILT_IN_CHAT_PROMPT = [
  "You are a DFIR report-writing assistant inside Forenotes, working on ONE incident.",
  "You cannot see the incident data directly: call get_incident_overview first, then query_incident_data to fetch what you need.",
  "Use only facts returned by tools. Never invent findings, times, hosts, or indicators; write \"Not provided\" when data is missing.",
  "Chat briefly while gathering data. When the user asks for a report or a section, output it as Markdown (no HTML) in your reply.",
  "Cite timestamps in UTC as given by the data."
].join(" ");

const TOOLS = [
  { type: "function", function: { name: "get_incident_overview", description: "Incident details, member list, record counts per entity and the timeline time range.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: {
    name: "query_incident_data",
    description: "Read records of one entity type from this incident, optionally filtered by text and time range. Results are capped; narrow with search/from/to and raise limit only if needed.",
    parameters: { type: "object", properties: {
      entity: { type: "string", enum: ENTITIES },
      search: { type: "string", description: "Case-insensitive text matched against any field." },
      from: { type: "string", description: "ISO time; keep records at or after it (event_time for timeline events, else created_at)." },
      to: { type: "string", description: "ISO time; keep records at or before it." },
      limit: { type: "integer", minimum: 1, maximum: 100, description: "Default 25." }
    }, required: ["entity"] }
  } }
];

type Row = Record<string, unknown>;

function entityRows(context: ReportContext, entity: Entity): Row[] {
  switch (entity) {
    case "findings": return context.findings;
    case "timeline_events": return context.timelineEvents;
    case "tasks": return context.tasks;
    case "queries": return context.queries;
    case "indicators": return context.indicators;
    case "systems": return context.systems;
    case "accounts": return context.accounts;
    case "entity_links": return context.entityLinks;
    case "custom_tags": return context.tags.custom;
    case "attack_tags": return context.tags.attack;
    case "members": return context.members;
  }
}

function rowTime(row: Row) {
  const value = row.event_time ?? row.created_at;
  const time = value ? Date.parse(String(value)) : NaN;
  return Number.isNaN(time) ? null : time;
}

export function executeChatTool(context: ReportContext, name: string, args: Record<string, unknown>) {
  if (name === "get_incident_overview") {
    const counts = Object.fromEntries(ENTITIES.map((entity) => [entity, entityRows(context, entity).length]));
    const times = context.timelineEvents.map(rowTime).filter((time): time is number => time !== null);
    return {
      incident: context.incident, counts,
      timelineRange: times.length ? { from: new Date(Math.min(...times)).toISOString(), to: new Date(Math.max(...times)).toISOString() } : null,
      members: context.members
    };
  }
  if (name !== "query_incident_data") throw new Error(`Unknown tool ${name}.`);
  const entity = args.entity as Entity;
  if (!ENTITIES.includes(entity)) throw new Error(`entity must be one of ${ENTITIES.join(", ")}.`);
  const search = typeof args.search === "string" ? args.search.trim().toLowerCase() : "";
  const from = typeof args.from === "string" ? Date.parse(args.from) : NaN;
  const to = typeof args.to === "string" ? Date.parse(args.to) : NaN;
  const limit = Math.min(100, Math.max(1, Number(args.limit) || 25));
  const matches = entityRows(context, entity).filter((row) => {
    if (search && !JSON.stringify(row).toLowerCase().includes(search)) return false;
    const time = rowTime(row);
    if (!Number.isNaN(from) && (time === null || time < from)) return false;
    if (!Number.isNaN(to) && (time === null || time > to)) return false;
    return true;
  });
  const items: Row[] = [];
  let size = 0;
  for (const row of matches.slice(0, limit)) {
    size += JSON.stringify(row).length;
    if (size > MAX_TOOL_CHARS && items.length) break;
    items.push(row);
  }
  return { entity, total: matches.length, returned: items.length, truncated: items.length < matches.length, items };
}

/** Runs the tool-calling loop. `onStart` fires once config and data access are validated, before any event is emitted. */
export async function runReportChat(
  database: Database, user: AuthenticatedUser, incidentId: string, history: ChatMessage[],
  emit: (event: ChatEvent) => void, signal: AbortSignal, onStart: () => void
) {
  const config = await resolveLlmConfig(database, user.id);
  if (!config) throw new AppError(400, "LLM is not configured. Add provider settings or set LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY.");
  const context = await buildReportContext(database, user, incidentId, "incident");
  const { prompt: customPrompt } = await getReportChatPrompt(database, user);
  const systemPrompt = [BUILT_IN_CHAT_PROMPT, customPrompt && `Additional instructions from the user:\n${customPrompt}`].filter(Boolean).join("\n\n");
  onStart();

  const messages: unknown[] = history.map(({ role, content }) => ({ role, content }));
  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const { text, toolCalls } = await streamChat(config, [{ role: "system", content: systemPrompt }, ...messages], TOOLS, signal, (delta) => emit({ type: "text", delta }));
      if (!toolCalls.length) return emit({ type: "done" });
      const calls = toolCalls.map((call, index) => ({ ...call, id: call.id || `call_${step}_${index}` }));
      messages.push({ role: "assistant", content: text || null, tool_calls: calls.map((call) => ({ id: call.id, type: "function", function: { name: call.name, arguments: call.arguments || "{}" } })) });
      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.arguments || "{}");
          const result = executeChatTool(context, call.name, args);
          const count = "returned" in result ? `${result.returned} of ${result.total} records` : "overview";
          emit({ type: "tool", id: call.id, name: call.name, args, status: "done", summary: count });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Tool failed.";
          emit({ type: "tool", id: call.id, name: call.name, args, status: "error", summary: message });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: message }) });
        }
      }
    }
    emit({ type: "error", message: `Stopped after ${MAX_STEPS} tool rounds. Ask a narrower question.` });
  } catch (error) {
    if (signal.aborted) return;
    emit({ type: "error", message: error instanceof Error ? error.message : "Chat failed." });
  }
}

export async function getReportChatPrompt(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "report:read");
  const result = await database.query<{ prompt: string }>("select prompt from report_chat_prompts where user_id = $1", [user.id]);
  return { prompt: result.rows[0]?.prompt ?? "", builtIn: BUILT_IN_CHAT_PROMPT };
}

export async function saveReportChatPrompt(database: Database, user: AuthenticatedUser, prompt: string) {
  await requirePermission(database, user, "report:read");
  await database.query(
    `insert into report_chat_prompts (user_id, prompt) values ($1, $2)
     on conflict (user_id) do update set prompt = excluded.prompt, updated_at = now()`,
    [user.id, prompt.trim()]
  );
  return getReportChatPrompt(database, user);
}
