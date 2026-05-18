import { randomUUID } from "node:crypto";
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

export async function createNotification(database: Database, input: NotificationInput) {
  await database.query(
    `
      insert into notifications (
        id, recipient_user_id, incident_id, actor_user_id, event_type, title, body, entity_type, entity_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      randomUUID(),
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
}

export async function listNotifications(database: Database, userId: string) {
  const result = await database.query(
    `
      select id, incident_id, actor_user_id, event_type, title, body, entity_type, entity_id, unseen, read_at, created_at
      from notifications
      where recipient_user_id = $1
      order by created_at desc
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
