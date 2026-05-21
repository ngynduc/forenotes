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
  systemId?: string;
  accountId?: string;
  ownerUserId?: string;
}

interface TimelineTimeFilter {
  field?: "eventTime" | "createdAt" | "updatedAt";
  start?: string;
  end?: string;
}

async function ensureTimelineRelationshipEntity(
  database: Database,
  incidentId: string,
  entityType: "system" | "account",
  entityId: string
) {
  const tableName = entityType === "system" ? "systems" : "accounts";
  const result = await database.query<{ incident_id: string }>(`select incident_id from ${tableName} where id = $1`, [entityId]);

  if (result.rowCount === 0) {
    throw new AppError(404, `${entityType === "system" ? "System" : "Account"} not found`);
  }

  if (result.rows[0].incident_id !== incidentId) {
    throw new AppError(409, `Timeline event ${entityType} must belong to the same incident`);
  }
}

export async function listTimelineEvents(
  database: Database,
  userId: string,
  incidentId: string,
  filter?: TimelineTimeFilter
) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query(buildTimelineListQuery(filter), buildTimelineListParams(incidentId, filter));
  return Promise.all(
    result.rows.map(async (row) => {
      const [attackTagsResult, customTagsResult] = await Promise.all([
        database.query(
          `
            select at.id, at.attack_id, at.name, at.type, at.tactic
            from timeline_event_attack_tags teat
            inner join attack_tags at on at.id = teat.attack_tag_id
            where teat.incident_id = $1 and teat.timeline_event_id = $2
            order by at.attack_id asc
          `,
          [incidentId, row.id]
        ),
        database.query(
          `
            select ct.id, ct.name, ct.color
            from timeline_event_custom_tags tect
            inner join custom_tags ct on ct.id = tect.custom_tag_id
            where tect.incident_id = $1 and tect.timeline_event_id = $2
            order by ct.name asc
          `,
          [incidentId, row.id]
        )
      ]);

      return {
        ...row,
        attack_tags: attackTagsResult.rows,
        custom_tags: customTagsResult.rows
      };
    })
  );
}

function buildTimelineListQuery(filter?: TimelineTimeFilter) {
  const clauses = ["incident_id = $1"];
  const column = mapTimelineTimeField(filter?.field);

  if (filter?.start) {
    clauses.push(`${column} >= $${clauses.length + 1}`);
  }

  if (filter?.end) {
    clauses.push(`${column} <= $${clauses.length + 1}`);
  }

  return `select * from timeline_events where ${clauses.join(" and ")} order by event_time desc, created_at desc`;
}

function buildTimelineListParams(incidentId: string, filter?: TimelineTimeFilter) {
  const params: string[] = [incidentId];
  if (filter?.start) {
    params.push(filter.start);
  }
  if (filter?.end) {
    params.push(filter.end);
  }
  return params;
}

function mapTimelineTimeField(field: TimelineTimeFilter["field"]) {
  switch (field) {
    case "createdAt":
      return "created_at";
    case "updatedAt":
      return "updated_at";
    default:
      return "event_time";
  }
}

export async function createTimelineEvent(database: Database, user: AuthenticatedUser, input: CreateTimelineEventInput) {
  await requirePermission(database, user, "timeline:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  if (input.systemId) {
    await ensureTimelineRelationshipEntity(database, input.incidentId, "system", input.systemId);
  }

  if (input.accountId) {
    await ensureTimelineRelationshipEntity(database, input.incidentId, "account", input.accountId);
  }

  const ownerUserId = input.ownerUserId ?? user.id;
  const timelineEventId = randomUUID();
  await database.query(
    `
      insert into timeline_events (
        id, incident_id, event_time, title, description, source, raw_evidence_ref, system_id, account_id, owner_user_id, created_by_user_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      timelineEventId,
      input.incidentId,
      input.eventTime,
      input.title,
      input.description ?? null,
      input.source ?? null,
      input.rawEvidenceRef ?? null,
      input.systemId ?? null,
      input.accountId ?? null,
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

  if (input.systemId) {
    await ensureTimelineRelationshipEntity(database, incidentId, "system", input.systemId);
  }

  if (input.accountId) {
    await ensureTimelineRelationshipEntity(database, incidentId, "account", input.accountId);
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
    system_id: input.systemId ?? existing.rows[0].system_id,
    account_id: input.accountId ?? existing.rows[0].account_id,
    owner_user_id: existing.rows[0].owner_user_id
  };

  await database.query(
    `
      update timeline_events
      set event_time = $3, title = $4, description = $5, source = $6, raw_evidence_ref = $7, system_id = $8, account_id = $9, owner_user_id = $10, updated_at = now()
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
      next.system_id,
      next.account_id,
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
