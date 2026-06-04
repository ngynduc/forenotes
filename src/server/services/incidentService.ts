import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireCaseMembership, requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification, formatNotificationScope, getCaseNotificationScope } from "./notificationService.js";
import { syncCaseMembersToIncident } from "./membershipService.js";

interface CreateIncidentInput {
  caseId: string;
  name: string;
  summary?: string;
  severity?: string;
  status: string;
}

type UpdateIncidentInput = Partial<Omit<CreateIncidentInput, "caseId">>;

export async function listIncidentsForCase(database: Database, userId: string, caseId: string) {
  await requireCaseMembership(database, userId, caseId);

  const result = await database.query(
    `
      select i.id, i.case_id, i.name, i.summary, i.severity, i.status, i.created_at, i.updated_at
      from incidents i
      inner join incident_members im on im.incident_id = i.id
      where i.case_id = $1 and im.user_id = $2
      order by i.created_at desc
    `,
    [caseId, userId]
  );

  return result.rows;
}

export async function createIncident(database: Database, user: AuthenticatedUser, input: CreateIncidentInput) {
  await requirePermission(database, user, "incident:create");
  await requireCaseMembership(database, user.id, input.caseId);

  const incidentId = randomUUID();
  await database.query(
    `
      insert into incidents (id, case_id, name, summary, severity, status, created_by_user_id)
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [incidentId, input.caseId, input.name, input.summary ?? null, input.severity ?? null, input.status, user.id]
  );

  await syncCaseMembersToIncident(database, input.caseId, incidentId, user.id);

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: input.caseId,
    incidentId,
    action: "incident.create",
    entityType: "incident",
    entityId: incidentId,
    afterJson: input
  });

  const scope = await getCaseNotificationScope(database, input.caseId);
  await createNotification(database, {
    recipientUserId: user.id,
    incidentId,
    actorUserId: user.id,
    eventType: "incident.created",
    title: `Incident created: ${input.name}`,
    body: formatNotificationScope(scope),
    entityType: "incident",
    entityId: incidentId
  });

  const result = await database.query("select * from incidents where id = $1", [incidentId]);
  if (result.rowCount === 0) {
    throw new AppError(500, "Incident creation failed");
  }

  return result.rows[0];
}

export async function updateIncident(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  input: UpdateIncidentInput
) {
  await requirePermission(database, user, "incident:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from incidents where id = $1", [incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Incident not found");
  }

  const next = {
    ...existing.rows[0],
    name: input.name ?? existing.rows[0].name,
    summary: input.summary ?? existing.rows[0].summary,
    severity: input.severity ?? existing.rows[0].severity,
    status: input.status ?? existing.rows[0].status
  };

  await database.query(
    `
      update incidents
      set name = $2, summary = $3, severity = $4, status = $5, updated_at = now()
      where id = $1
    `,
    [incidentId, next.name, next.summary, next.severity, next.status]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: existing.rows[0].case_id,
    incidentId,
    action: "incident.update",
    entityType: "incident",
    entityId: incidentId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from incidents where id = $1", [incidentId]);
  return result.rows[0];
}
