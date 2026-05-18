import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification } from "./notificationService.js";

interface CreateTimelineEventInput {
  incidentId: string;
  eventTime: string;
  title: string;
  description?: string;
  source?: string;
  rawEvidenceRef?: string;
  ownerUserId?: string;
}

export async function listTimelineEvents(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query(
    "select * from timeline_events where incident_id = $1 order by event_time desc, created_at desc",
    [incidentId]
  );
  return result.rows;
}

export async function createTimelineEvent(database: Database, user: AuthenticatedUser, input: CreateTimelineEventInput) {
  await requirePermission(database, user, "timeline:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const ownerUserId = input.ownerUserId ?? user.id;
  const timelineEventId = randomUUID();
  await database.query(
    `
      insert into timeline_events (
        id, incident_id, event_time, title, description, source, raw_evidence_ref, owner_user_id, created_by_user_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      timelineEventId,
      input.incidentId,
      input.eventTime,
      input.title,
      input.description ?? null,
      input.source ?? null,
      input.rawEvidenceRef ?? null,
      ownerUserId,
      user.id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "timeline.create",
    entityType: "timeline_event",
    entityId: timelineEventId,
    afterJson: {
      ...input,
      ownerUserId
    }
  });

  const result = await database.query("select * from timeline_events where id = $1", [timelineEventId]);
  return result.rows[0];
}

export async function updateTimelineEvent(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  timelineEventId: string,
  input: Partial<Omit<CreateTimelineEventInput, "incidentId">>
) {
  await requirePermission(database, user, "timeline:update");
  await requireIncidentMembership(database, user.id, incidentId);

  if (input.ownerUserId !== undefined) {
    throw new AppError(400, "Timeline event owner cannot be changed");
  }

  const existing = await database.query("select * from timeline_events where id = $1 and incident_id = $2", [
    timelineEventId,
    incidentId
  ]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Timeline event not found");
  }

  const next = {
    ...existing.rows[0],
    event_time: input.eventTime ?? existing.rows[0].event_time,
    title: input.title ?? existing.rows[0].title,
    description: input.description ?? existing.rows[0].description,
    source: input.source ?? existing.rows[0].source,
    raw_evidence_ref: input.rawEvidenceRef ?? existing.rows[0].raw_evidence_ref,
    owner_user_id: existing.rows[0].owner_user_id
  };

  await database.query(
    `
      update timeline_events
      set event_time = $3, title = $4, description = $5, source = $6, raw_evidence_ref = $7, owner_user_id = $8, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [
      timelineEventId,
      incidentId,
      next.event_time,
      next.title,
      next.description,
      next.source,
      next.raw_evidence_ref,
      next.owner_user_id
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "timeline.update",
    entityType: "timeline_event",
    entityId: timelineEventId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const memberResult = await database.query<{ user_id: string }>(
    "select user_id from incident_members where incident_id = $1 and user_id <> $2",
    [incidentId, user.id]
  );
  for (const row of memberResult.rows) {
    await createNotification(database, {
      recipientUserId: row.user_id,
      incidentId,
      actorUserId: user.id,
      eventType: "timeline.updated",
      title: `Timeline event updated: ${next.title}`,
      entityType: "timeline_event",
      entityId: timelineEventId
    });
  }

  const result = await database.query("select * from timeline_events where id = $1", [timelineEventId]);
  return result.rows[0];
}

export async function deleteTimelineEvent(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  timelineEventId: string
) {
  await requirePermission(database, user, "timeline:delete");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from timeline_events where id = $1 and incident_id = $2", [
    timelineEventId,
    incidentId
  ]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Timeline event not found");
  }

  await database.query("delete from timeline_events where id = $1 and incident_id = $2", [timelineEventId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "timeline.delete",
    entityType: "timeline_event",
    entityId: timelineEventId,
    beforeJson: existing.rows[0]
  });
}
