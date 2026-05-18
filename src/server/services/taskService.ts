import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification } from "./notificationService.js";

const TASK_LINK_TABLES: Record<string, string> = {
  finding: "findings",
  timeline_event: "timeline_events",
  system: "systems",
  account: "accounts",
  indicator: "indicators",
  query: "queries"
};

interface CreateTaskInput {
  incidentId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  ownerUserId?: string;
  assigneeUserId?: string;
  dueAt?: string;
}

interface CreateTaskLinkInput {
  incidentId: string;
  taskId: string;
  entityType: string;
  entityId: string;
}

type UpdateTaskInput = Partial<Omit<CreateTaskInput, "incidentId">>;

function isTaskAssignee(userId: string, task: { assignee_user_id?: string | null }) {
  return Boolean(task.assignee_user_id && task.assignee_user_id === userId);
}

async function requireTaskUpdateAccess(database: Database, user: AuthenticatedUser, task: { assignee_user_id?: string | null }) {
  if (isTaskAssignee(user.id, task)) {
    return;
  }

  await requirePermission(database, user, "task:update");
}

async function requireTaskAssignmentAccess(
  database: Database,
  user: AuthenticatedUser,
  existingTask: { assignee_user_id?: string | null; owner_user_id?: string | null },
  input: UpdateTaskInput
) {
  const assigneeChanged = input.assigneeUserId !== undefined && input.assigneeUserId !== existingTask.assignee_user_id;
  const ownerChanged = input.ownerUserId !== undefined && input.ownerUserId !== existingTask.owner_user_id;

  if (!assigneeChanged && !ownerChanged) {
    return;
  }

  await requirePermission(database, user, "task:assign");
}

export async function listTasks(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query("select * from tasks where incident_id = $1 order by created_at desc", [incidentId]);
  return result.rows;
}

export async function createTask(database: Database, user: AuthenticatedUser, input: CreateTaskInput) {
  await requirePermission(database, user, "task:create");
  await requireIncidentMembership(database, user.id, input.incidentId);

  if (input.assigneeUserId) {
    await requireIncidentMembership(database, input.assigneeUserId, input.incidentId);
  }

  const taskId = randomUUID();
  await database.query(
    `
      insert into tasks (
        id, incident_id, title, description, status, priority, owner_user_id, assignee_user_id, created_by_user_id, due_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      taskId,
      input.incidentId,
      input.title,
      input.description ?? null,
      input.status,
      input.priority,
      input.ownerUserId ?? null,
      input.assigneeUserId ?? null,
      user.id,
      input.dueAt ?? null
    ]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId: input.incidentId,
    action: "task.create",
    entityType: "task",
    entityId: taskId,
    afterJson: input
  });

  if (input.assigneeUserId && input.assigneeUserId !== user.id) {
    await createNotification(database, {
      recipientUserId: input.assigneeUserId,
      incidentId: input.incidentId,
      actorUserId: user.id,
      eventType: "task.assigned",
      title: `Task assigned: ${input.title}`,
      entityType: "task",
      entityId: taskId
    });
  }

  const result = await database.query("select * from tasks where id = $1", [taskId]);
  return result.rows[0];
}

export async function createTaskLink(database: Database, user: AuthenticatedUser, input: CreateTaskLinkInput) {
  await requirePermission(database, user, "task:link");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const taskResult = await database.query<{ incident_id: string }>(
    "select incident_id from tasks where id = $1 and incident_id = $2",
    [input.taskId, input.incidentId]
  );
  if (taskResult.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  const tableName = TASK_LINK_TABLES[input.entityType];
  const entityResult = await database.query<{ incident_id: string }>(
    `select incident_id from ${tableName} where id = $1`,
    [input.entityId]
  );

  if (entityResult.rowCount === 0) {
    throw new AppError(404, "Linked entity not found");
  }

  if (entityResult.rows[0].incident_id !== input.incidentId) {
    throw new AppError(409, "Cross-incident task links are not allowed");
  }

  try {
    const taskLinkId = randomUUID();
    await database.query(
      `
        insert into task_links (id, task_id, incident_id, entity_type, entity_id)
        values ($1, $2, $3, $4, $5)
      `,
      [taskLinkId, input.taskId, input.incidentId, input.entityType, input.entityId]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "task.link",
      entityType: "task_link",
      entityId: taskLinkId,
      afterJson: input
    });

    const result = await database.query("select * from task_links where id = $1", [taskLinkId]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Task link already exists");
    }
    throw error;
  }
}

export async function updateTask(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from tasks where id = $1 and incident_id = $2", [taskId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  await requireTaskUpdateAccess(database, user, existing.rows[0]);
  await requireTaskAssignmentAccess(database, user, existing.rows[0], input);

  if (input.assigneeUserId) {
    await requireIncidentMembership(database, input.assigneeUserId, incidentId);
  }

  const next = {
    ...existing.rows[0],
    title: input.title ?? existing.rows[0].title,
    description: input.description ?? existing.rows[0].description,
    status: input.status ?? existing.rows[0].status,
    priority: input.priority ?? existing.rows[0].priority,
    owner_user_id: input.ownerUserId ?? existing.rows[0].owner_user_id,
    assignee_user_id: input.assigneeUserId ?? existing.rows[0].assignee_user_id,
    due_at: input.dueAt ?? existing.rows[0].due_at
  };

  await database.query(
    `
      update tasks
      set title = $3, description = $4, status = $5, priority = $6, owner_user_id = $7, assignee_user_id = $8, due_at = $9, updated_at = now()
      where id = $1 and incident_id = $2
    `,
    [taskId, incidentId, next.title, next.description, next.status, next.priority, next.owner_user_id, next.assignee_user_id, next.due_at]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "task.update",
    entityType: "task",
    entityId: taskId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  if (input.assigneeUserId && input.assigneeUserId !== existing.rows[0].assignee_user_id && input.assigneeUserId !== user.id) {
    await createNotification(database, {
      recipientUserId: input.assigneeUserId,
      incidentId,
      actorUserId: user.id,
      eventType: "task.assigned",
      title: `Task assigned: ${next.title}`,
      entityType: "task",
      entityId: taskId
    });
  }

  const result = await database.query("select * from tasks where id = $1", [taskId]);
  return result.rows[0];
}

export async function deleteTask(database: Database, user: AuthenticatedUser, incidentId: string, taskId: string) {
  await requirePermission(database, user, "task:update");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from tasks where id = $1 and incident_id = $2", [taskId, incidentId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  await database.query("delete from tasks where id = $1 and incident_id = $2", [taskId, incidentId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "task.delete",
    entityType: "task",
    entityId: taskId,
    beforeJson: existing.rows[0]
  });
}
