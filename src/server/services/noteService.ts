import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { getDataDir, getUploadsDir } from "../storage.js";
import type { AuthenticatedUser } from "./authService.js";
import { createAuditLog } from "./auditLogService.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const NOTE_IMAGE_CONTENT_TYPES = Object.keys(IMAGE_EXTENSIONS);

export interface UploadedNoteImage {
  id: string;
  url: string;
  filename: string;
}

interface UploadTaskNoteImageInput {
  data: Buffer;
  contentType: string;
  filename?: string;
}

function notesDir() {
  return path.join(getDataDir(), "notes");
}

function notePath(taskId: string) {
  return path.join(notesDir(), `${safePathSegment(taskId)}.md`);
}

function taskUploadDir(taskId: string) {
  return path.join(getUploadsDir(), "task-notes", safePathSegment(taskId));
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function safeDisplayFilename(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return path.basename(trimmed).replace(/[^\w.-]/g, "_") || fallback;
}

async function requireTaskAccess(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  taskId: string
) {
  await requireIncidentMembership(database, user.id, incidentId);

  const task = await database.query<{ id: string; title: string }>(
    "select id, title from tasks where id = $1 and incident_id = $2",
    [taskId, incidentId]
  );

  if (task.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  return task.rows[0];
}

export async function readTaskNote(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  taskId: string
) {
  await requireTaskAccess(database, user, incidentId, taskId);

  try {
    const content = await readFile(notePath(taskId), "utf8");
    return { content };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { content: "" };
    }
    throw error;
  }
}

export async function writeTaskNote(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  taskId: string,
  content: string
) {
  await requirePermission(database, user, "task:update");
  await requireTaskAccess(database, user, incidentId, taskId);

  await mkdir(notesDir(), { recursive: true });
  await writeFile(notePath(taskId), content, "utf8");

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "task.note.update",
    entityType: "task",
    entityId: taskId,
    afterJson: { contentLength: content.length },
  });

  return { content, updatedAt: new Date().toISOString() };
}

export async function uploadTaskNoteImage(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  taskId: string,
  input: UploadTaskNoteImageInput
): Promise<UploadedNoteImage> {
  await requirePermission(database, user, "task:update");
  await requireTaskAccess(database, user, incidentId, taskId);

  const extension = IMAGE_EXTENSIONS[input.contentType];
  if (!extension) {
    throw new AppError(400, "Only PNG, JPEG, GIF, and WebP images can be uploaded.");
  }

  if (input.data.length === 0) {
    throw new AppError(400, "Image upload cannot be empty.");
  }

  if (input.data.length > MAX_IMAGE_BYTES) {
    throw new AppError(413, "Image upload must be 10MB or smaller.");
  }

  const id = randomUUID();
  const filename = safeDisplayFilename(input.filename, "image");
  const storedFilename = `${id}.${extension}`;
  const directory = taskUploadDir(taskId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedFilename), input.data);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "task.note.image.upload",
    entityType: "task",
    entityId: taskId,
    afterJson: { filename, contentType: input.contentType, size: input.data.length },
  });

  return {
    id,
    url: `/api/uploads/task-notes/${safePathSegment(taskId)}/${storedFilename}`,
    filename,
  };
}
