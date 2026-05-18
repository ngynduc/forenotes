import { randomUUID } from "node:crypto";
import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireCaseMembership, requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";

interface CreateCustomTagInput {
  caseId: string;
  name: string;
  color?: string;
}

interface UpdateCustomTagInput {
  name?: string;
  color?: string;
}

interface AttachAttackTagInput {
  incidentId: string;
  findingId: string;
  attackTagId: string;
}

interface AttachCustomTagInput {
  incidentId: string;
  findingId: string;
  customTagId: string;
}

interface AttachTimelineAttackTagInput {
  incidentId: string;
  timelineEventId: string;
  attackTagId: string;
}

interface AttachTimelineCustomTagInput {
  incidentId: string;
  timelineEventId: string;
  customTagId: string;
}

export async function listAttackTags(database: Database) {
  const result = await database.query(
    "select id, attack_id, name, type, tactic, attack_version, external_url from attack_tags order by attack_id asc"
  );
  return result.rows;
}

export async function listCustomTags(database: Database, userId: string, caseId: string) {
  await requireCaseMembership(database, userId, caseId);
  const result = await database.query(
    "select id, case_id, name, color, created_by_user_id, created_at, updated_at from custom_tags where case_id = $1 order by name asc",
    [caseId]
  );
  return result.rows;
}

export async function createCustomTag(database: Database, user: AuthenticatedUser, input: CreateCustomTagInput) {
  await requirePermission(database, user, "tag:custom_create");
  await requireCaseMembership(database, user.id, input.caseId);

  try {
    const customTagId = randomUUID();
    await database.query(
      `
        insert into custom_tags (id, case_id, name, color, created_by_user_id)
        values ($1, $2, $3, $4, $5)
      `,
      [customTagId, input.caseId, input.name, input.color ?? null, user.id]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      caseId: input.caseId,
      action: "custom_tag.create",
      entityType: "custom_tag",
      entityId: customTagId,
      afterJson: input
    });

    const result = await database.query("select * from custom_tags where id = $1", [customTagId]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Custom tag already exists in this case");
    }
    throw error;
  }
}

export async function updateCustomTag(
  database: Database,
  user: AuthenticatedUser,
  caseId: string,
  customTagId: string,
  input: UpdateCustomTagInput
) {
  await requirePermission(database, user, "tag:custom_update");
  await requireCaseMembership(database, user.id, caseId);

  const existing = await database.query("select * from custom_tags where id = $1 and case_id = $2", [customTagId, caseId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Custom tag not found");
  }

  const next = {
    ...existing.rows[0],
    name: input.name ?? existing.rows[0].name,
    color: input.color ?? existing.rows[0].color
  };

  try {
    await database.query(
      `
        update custom_tags
        set name = $3, color = $4, updated_at = now()
        where id = $1 and case_id = $2
      `,
      [customTagId, caseId, next.name, next.color]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Custom tag already exists in this case");
    }
    throw error;
  }

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "custom_tag.update",
    entityType: "custom_tag",
    entityId: customTagId,
    beforeJson: existing.rows[0],
    afterJson: next
  });

  const result = await database.query("select * from custom_tags where id = $1", [customTagId]);
  return result.rows[0];
}

export async function deleteCustomTag(database: Database, user: AuthenticatedUser, caseId: string, customTagId: string) {
  await requirePermission(database, user, "tag:custom_update");
  await requireCaseMembership(database, user.id, caseId);

  const existing = await database.query("select * from custom_tags where id = $1 and case_id = $2", [customTagId, caseId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Custom tag not found");
  }

  await database.query("delete from custom_tags where id = $1 and case_id = $2", [customTagId, caseId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "custom_tag.delete",
    entityType: "custom_tag",
    entityId: customTagId,
    beforeJson: existing.rows[0]
  });
}

export async function attachAttackTagToFinding(database: Database, user: AuthenticatedUser, input: AttachAttackTagInput) {
  await requireIncidentMembership(database, user.id, input.incidentId);
  await requirePermission(database, user, "finding:update");

  const findingResult = await database.query<{ incident_id: string }>(
    "select incident_id from findings where id = $1 and incident_id = $2",
    [input.findingId, input.incidentId]
  );
  if (findingResult.rowCount === 0) {
    throw new AppError(404, "Finding not found");
  }

  const attackTagResult = await database.query("select 1 from attack_tags where id = $1", [input.attackTagId]);
  if (attackTagResult.rowCount === 0) {
    throw new AppError(404, "ATT&CK tag not found");
  }

  try {
    await database.query(
      `
        insert into finding_attack_tags (finding_id, attack_tag_id, incident_id)
        values ($1, $2, $3)
      `,
      [input.findingId, input.attackTagId, input.incidentId]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "finding.attack_tag_attach",
      entityType: "finding_attack_tag",
      entityId: input.findingId,
      afterJson: input
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "ATT&CK tag already attached to finding");
    }
    throw error;
  }
}

export async function attachCustomTagToFinding(database: Database, user: AuthenticatedUser, input: AttachCustomTagInput) {
  await requireIncidentMembership(database, user.id, input.incidentId);
  await requirePermission(database, user, "finding:update");

  const findingScopeResult = await database.query<{ case_id: string }>(
    `
      select i.case_id
      from findings f
      inner join incidents i on i.id = f.incident_id
      where f.id = $1 and f.incident_id = $2
    `,
    [input.findingId, input.incidentId]
  );

  if (findingScopeResult.rowCount === 0) {
    throw new AppError(404, "Finding not found");
  }

  const caseId = findingScopeResult.rows[0].case_id;
  const customTagResult = await database.query<{ case_id: string }>(
    "select case_id from custom_tags where id = $1",
    [input.customTagId]
  );
  if (customTagResult.rowCount === 0) {
    throw new AppError(404, "Custom tag not found");
  }

  if (customTagResult.rows[0].case_id !== caseId) {
    throw new AppError(409, "Custom tag is outside the finding case scope");
  }

  try {
    await database.query(
      `
        insert into finding_custom_tags (finding_id, custom_tag_id, incident_id, case_id)
        values ($1, $2, $3, $4)
      `,
      [input.findingId, input.customTagId, input.incidentId, caseId]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      caseId,
      incidentId: input.incidentId,
      action: "finding.custom_tag_attach",
      entityType: "finding_custom_tag",
      entityId: input.findingId,
      afterJson: input
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Custom tag already attached to finding");
    }
    throw error;
  }
}

export async function attachAttackTagToTimelineEvent(
  database: Database,
  user: AuthenticatedUser,
  input: AttachTimelineAttackTagInput
) {
  await requireIncidentMembership(database, user.id, input.incidentId);
  await requirePermission(database, user, "timeline:update");

  const timelineResult = await database.query<{ incident_id: string }>(
    "select incident_id from timeline_events where id = $1 and incident_id = $2",
    [input.timelineEventId, input.incidentId]
  );
  if (timelineResult.rowCount === 0) {
    throw new AppError(404, "Timeline event not found");
  }

  const attackTagResult = await database.query("select 1 from attack_tags where id = $1", [input.attackTagId]);
  if (attackTagResult.rowCount === 0) {
    throw new AppError(404, "ATT&CK tag not found");
  }

  try {
    await database.query(
      `
        insert into timeline_event_attack_tags (timeline_event_id, attack_tag_id, incident_id)
        values ($1, $2, $3)
      `,
      [input.timelineEventId, input.attackTagId, input.incidentId]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "timeline.attack_tag_attach",
      entityType: "timeline_event_attack_tag",
      entityId: input.timelineEventId,
      afterJson: input
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "ATT&CK tag already attached to timeline event");
    }
    throw error;
  }
}

export async function attachCustomTagToTimelineEvent(
  database: Database,
  user: AuthenticatedUser,
  input: AttachTimelineCustomTagInput
) {
  await requireIncidentMembership(database, user.id, input.incidentId);
  await requirePermission(database, user, "timeline:update");

  const timelineScopeResult = await database.query<{ case_id: string }>(
    `
      select i.case_id
      from timeline_events t
      inner join incidents i on i.id = t.incident_id
      where t.id = $1 and t.incident_id = $2
    `,
    [input.timelineEventId, input.incidentId]
  );

  if (timelineScopeResult.rowCount === 0) {
    throw new AppError(404, "Timeline event not found");
  }

  const caseId = timelineScopeResult.rows[0].case_id;
  const customTagResult = await database.query<{ case_id: string }>("select case_id from custom_tags where id = $1", [
    input.customTagId
  ]);
  if (customTagResult.rowCount === 0) {
    throw new AppError(404, "Custom tag not found");
  }

  if (customTagResult.rows[0].case_id !== caseId) {
    throw new AppError(409, "Custom tag is outside the timeline event case scope");
  }

  try {
    await database.query(
      `
        insert into timeline_event_custom_tags (timeline_event_id, custom_tag_id, incident_id, case_id)
        values ($1, $2, $3, $4)
      `,
      [input.timelineEventId, input.customTagId, input.incidentId, caseId]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      caseId,
      incidentId: input.incidentId,
      action: "timeline.custom_tag_attach",
      entityType: "timeline_event_custom_tag",
      entityId: input.timelineEventId,
      afterJson: input
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Custom tag already attached to timeline event");
    }
    throw error;
  }
}
