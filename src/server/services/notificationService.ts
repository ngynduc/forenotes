import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { Database } from "../db/types.js";

interface NotificationInput {
  recipientUserId: string;
  incidentId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

interface CaseNotificationScope {
  caseId: string;
  caseName: string;
}

interface IncidentNotificationScope extends CaseNotificationScope {
  incidentId: string;
  incidentName: string;
}

interface NotificationRow {
  id: string;
  recipient_user_id: string;
  incident_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  unseen: boolean;
  read_at: Date | string | null;
  created_at: Date | string;
}

export type NotificationStreamItem = Omit<NotificationRow, "recipient_user_id">;

interface NotificationCreatedEvent {
  recipientUserId: string;
  notification: NotificationStreamItem;
}

const notificationEvents = new EventEmitter();

export async function getCaseNotificationScope(database: Database, caseId: string): Promise<CaseNotificationScope | null> {
  const result = await database.query<CaseNotificationScope>(
    "select id as \"caseId\", case_name as \"caseName\" from cases where id = $1",
    [caseId]
  );

  return result.rows[0] ?? null;
}

export async function getIncidentNotificationScope(
  database: Database,
  incidentId: string
): Promise<IncidentNotificationScope | null> {
  const result = await database.query<IncidentNotificationScope>(
    `
      select c.id as "caseId", c.case_name as "caseName", i.id as "incidentId", i.name as "incidentName"
      from incidents i
      inner join cases c on c.id = i.case_id
      where i.id = $1
    `,
    [incidentId]
  );

  return result.rows[0] ?? null;
}

export function formatNotificationScope(scope: CaseNotificationScope | IncidentNotificationScope | null): string {
  if (!scope) {
    return "Case: unknown";
  }

  if ("incidentName" in scope) {
    return `Case: ${scope.caseName}; Incident: ${scope.incidentName}`;
  }

  return `Case: ${scope.caseName}`;
}

export function subscribeToNotificationEvents(
  recipientUserId: string,
  listener: (event: NotificationCreatedEvent) => void
) {
  const wrappedListener = (event: NotificationCreatedEvent) => {
    if (event.recipientUserId === recipientUserId) {
      listener(event);
    }
  };

  notificationEvents.on("created", wrappedListener);
  return () => notificationEvents.off("created", wrappedListener);
}

export async function createNotification(database: Database, input: NotificationInput): Promise<void> {
  const id = randomUUID();
  const result = await database.query<NotificationRow>(
    `
      insert into notifications (
        id, recipient_user_id, incident_id, actor_user_id, event_type, title, body, entity_type, entity_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id, recipient_user_id, incident_id, actor_user_id, event_type, title, body, entity_type, entity_id, unseen, read_at, created_at
    `,
    [
      id,
      input.recipientUserId,
      input.incidentId ?? null,
      input.actorUserId ?? null,
      input.eventType,
      input.title,
      input.body ?? null,
      input.entityType ?? null,
      input.entityId ?? null
    ]
  );

  const notification = result.rows[0];
  if (notification) {
    const { recipient_user_id: recipientUserId, ...streamNotification } = notification;
    notificationEvents.emit("created", {
      recipientUserId,
      notification: streamNotification
    } satisfies NotificationCreatedEvent);
  }
}

export async function listNotifications(database: Database, userId: string) {
  const result = await database.query(
    `
      select
        n.id,
        n.incident_id,
        n.actor_user_id,
        n.event_type,
        n.title,
        case
          when n.event_type = 'case.member_added' and direct_case.case_name is not null
            then 'You were added to Case: ' || direct_case.case_name
          when n.event_type = 'incident.member_added' and c.case_name is not null and i.name is not null
            then 'You were added to Case: ' || c.case_name || '; Incident: ' || i.name
          else n.body
        end as body,
        n.entity_type,
        n.entity_id,
        n.unseen,
        n.read_at,
        n.created_at
      from notifications n
      left join incidents i
        on i.id = n.incident_id
        or (n.incident_id is null and n.entity_type = 'incident' and i.id = n.entity_id)
      left join cases c on c.id = i.case_id
      left join cases direct_case on n.entity_type = 'case' and direct_case.id = n.entity_id
      where n.recipient_user_id = $1
      order by n.created_at desc
    `,
    [userId]
  );

  return result.rows;
}

export async function markNotificationRead(database: Database, userId: string, notificationId: string) {
  const result = await database.query(
    `
      update notifications
      set unseen = false, read_at = coalesce(read_at, now())
      where id = $1 and recipient_user_id = $2
      returning id, unseen, read_at
    `,
    [notificationId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error("Notification not found");
  }

  return result.rows[0];
}
