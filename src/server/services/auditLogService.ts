import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";

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
  filters: { caseId?: string; incidentId?: string } = {}
) {
  if (filters.incidentId) {
    const result = await database.query(
      `
        select *
        from audit_logs
        where incident_id = $1
        order by created_at desc
      `,
      [filters.incidentId]
    );
    return result.rows;
  }

  if (filters.caseId) {
    const result = await database.query(
      `
        select *
        from audit_logs
        where case_id = $1
        order by created_at desc
      `,
      [filters.caseId]
    );
    return result.rows;
  }

  const result = await database.query("select * from audit_logs order by created_at desc");
  return result.rows;
}
