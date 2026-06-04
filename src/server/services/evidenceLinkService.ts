import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { EVIDENCE_TYPES } from "../../shared/domain.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

const EVIDENCE_TABLES: Record<(typeof EVIDENCE_TYPES)[number], string> = {
  timeline_event: "timeline_events",
  system: "systems",
  account: "accounts",
  indicator: "indicators",
  query: "queries"
};

interface CreateEvidenceLinkInput {
  incidentId: string;
  findingId: string;
  evidenceType: (typeof EVIDENCE_TYPES)[number];
  evidenceId: string;
}

export async function listEvidenceLinks(database: Database, userId: string, incidentId: string, findingId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query(
    `
      select id, finding_id, incident_id, evidence_type, evidence_id, linked_by_user_id, created_at
      from finding_evidence_links
      where incident_id = $1 and finding_id = $2
      order by created_at desc
    `,
    [incidentId, findingId]
  );
  return result.rows;
}

export async function createEvidenceLink(database: Database, user: AuthenticatedUser, input: CreateEvidenceLinkInput) {
  await requirePermission(database, user, "finding:evidence_link");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const findingResult = await database.query<{ incident_id: string }>(
    "select incident_id from findings where id = $1 and incident_id = $2",
    [input.findingId, input.incidentId]
  );
  if (findingResult.rowCount === 0) {
    throw new AppError(404, "Finding not found");
  }

  const tableName = EVIDENCE_TABLES[input.evidenceType];
  const evidenceResult = await database.query<{ incident_id: string }>(
    `select incident_id from ${tableName} where id = $1`,
    [input.evidenceId]
  );

  if (evidenceResult.rowCount === 0) {
    throw new AppError(404, "Evidence not found");
  }

  if (evidenceResult.rows[0].incident_id !== input.incidentId) {
    throw new AppError(409, "Cross-incident evidence links are not allowed");
  }

  try {
    const linkId = randomUUID();
    await database.query(
      `
        insert into finding_evidence_links (
          id, finding_id, incident_id, evidence_type, evidence_id, linked_by_user_id
        ) values ($1, $2, $3, $4, $5, $6)
      `,
      [linkId, input.findingId, input.incidentId, input.evidenceType, input.evidenceId, user.id]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "finding.evidence_link",
      entityType: "finding_evidence_link",
      entityId: linkId,
      afterJson: input
    });

    const result = await database.query("select * from finding_evidence_links where id = $1", [linkId]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Evidence link already exists");
    }
    throw error;
  }
}

export async function deleteEvidenceLink(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  findingId: string,
  linkId: string
) {
  await requirePermission(database, user, "finding:evidence_unlink");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query(
    "select * from finding_evidence_links where id = $1 and incident_id = $2 and finding_id = $3",
    [linkId, incidentId, findingId]
  );
  if (existing.rowCount === 0) {
    throw new AppError(404, "Evidence link not found");
  }

  await database.query("delete from finding_evidence_links where id = $1", [linkId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "finding.evidence_unlink",
    entityType: "finding_evidence_link",
    entityId: linkId,
    beforeJson: existing.rows[0]
  });
}
