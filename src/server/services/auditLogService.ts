import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";

interface AuditEntryInput {
  actorUserId: string;
  caseId?: string | null;
  incidentId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadataJson?: unknown;
}

export async function createAuditLog(database: Database, input: AuditEntryInput) {
  await database.query(
    `
      insert into audit_logs (
        id, actor_user_id, case_id, incident_id, action, entity_type, entity_id, before_json, after_json, metadata_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)
    `,
    [
      randomUUID(),
      input.actorUserId,
      input.caseId ?? null,
      input.incidentId ?? null,
      input.action,
      input.entityType,
      input.entityId,
      input.beforeJson ? JSON.stringify(input.beforeJson) : null,
      input.afterJson ? JSON.stringify(input.afterJson) : null,
      input.metadataJson ? JSON.stringify(input.metadataJson) : null
    ]
  );
}

export async function listAuditLogs(
  database: Database,
  user: AuthenticatedUser,
  filters: { caseId?: string; incidentId?: string } = {}
) {
  const params: unknown[] = [user.id];
  const conditions: string[] = [];
  if (filters.incidentId) {
    params.push(filters.incidentId);
    conditions.push(`al.incident_id = $${params.length}`);
  }
  if (filters.caseId) {
    params.push(filters.caseId);
    conditions.push(`al.case_id = $${params.length}`);
  }
  const visibility = user.globalRole === "admin"
    ? "true"
    : "(cm.user_id is not null or incident_cm.user_id is not null)";
  const result = await database.query(
    `
      select distinct al.*
      from audit_logs al
      left join case_members cm on cm.case_id = al.case_id and cm.user_id = $1
      left join incidents i on i.id = al.incident_id
      left join case_members incident_cm on incident_cm.case_id = i.case_id and incident_cm.user_id = $1
      where ${visibility}
        ${conditions.length > 0 ? `and ${conditions.join(" and ")}` : ""}
      order by al.created_at desc
    `,
    params
  );
  return result.rows;
}
