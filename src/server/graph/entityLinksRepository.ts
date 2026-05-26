import { randomUUID } from "node:crypto";
import type { GraphNodeType, PermissionKey } from "../../shared/domain.js";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "../services/authService.js";
import { createAuditLog } from "../services/auditLogService.js";
import type { CreateEntityLinkInput } from "./graphTypes.js";

type ResolvedEntity = {
  id: string;
  incidentId: string;
};

const INCIDENT_ENTITY_TABLES: Record<Exclude<GraphNodeType, "mitre_technique" | "mitre_tactic" | "user" | "tag">, string> = {
  finding: "findings",
  timeline_event: "timeline_events",
  task: "tasks",
  system: "systems",
  account: "accounts",
  ioc: "indicators",
  query: "queries"
};

async function resolveIncidentScopedEntity(
  database: Database,
  incidentId: string,
  entityType: GraphNodeType,
  entityId: string
): Promise<ResolvedEntity> {
  if (entityType in INCIDENT_ENTITY_TABLES) {
    const tableName = INCIDENT_ENTITY_TABLES[entityType as keyof typeof INCIDENT_ENTITY_TABLES];
    const result = await database.query<{ id: string; incident_id: string }>(
      `select id, incident_id from ${tableName} where id = $1`,
      [entityId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, `${entityType} not found`);
    }

    if (result.rows[0].incident_id !== incidentId) {
      throw new AppError(409, "Cross-incident links are not allowed");
    }

    return {
      id: result.rows[0].id,
      incidentId: result.rows[0].incident_id
    };
  }

  if (entityType === "user") {
    const result = await database.query<{ user_id: string }>(
      "select user_id from incident_members where incident_id = $1 and user_id = $2",
      [incidentId, entityId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, "user not found in incident");
    }

    return { id: result.rows[0].user_id, incidentId };
  }

  if (entityType === "tag") {
    const result = await database.query<{ case_id: string }>(
      `
        select ct.case_id
        from custom_tags ct
        inner join incidents i on i.case_id = ct.case_id
        where ct.id = $1 and i.id = $2
      `,
      [entityId, incidentId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, "tag not found in incident case");
    }

    return { id: entityId, incidentId };
  }

  const mitreType = entityType === "mitre_technique" ? "technique" : "tactic";
  const result = await database.query<{ id: string }>("select id from attack_tags where id = $1 and type = $2", [entityId, mitreType]);
  if (result.rowCount === 0) {
    throw new AppError(404, `${entityType} not found`);
  }

  return { id: entityId, incidentId };
}

function getEntityLinkDeletePermission(user: AuthenticatedUser): PermissionKey | null {
  if (user.globalRole === "admin" || user.globalRole === "commander") {
    return "entity_link:delete";
  }

  return null;
}

export async function listEntityLinks(database: Database, user: AuthenticatedUser, incidentId: string) {
  await requireIncidentMembership(database, user.id, incidentId);
  await requirePermission(database, user, "entity_link:read");

  const result = await database.query(
    `
      select id, incident_id, source_type, source_id, target_type, target_id, link_type, created_by_user_id, created_at
      from incident_entity_links
      where incident_id = $1
      order by created_at asc
    `,
    [incidentId]
  );

  return result.rows;
}

export async function createEntityLink(database: Database, user: AuthenticatedUser, input: CreateEntityLinkInput) {
  await requireIncidentMembership(database, user.id, input.incidentId);
  await requirePermission(database, user, "entity_link:create");

  if (input.sourceType === input.targetType && input.sourceId === input.targetId) {
    throw new AppError(400, "Source and target must be different");
  }

  await Promise.all([
    resolveIncidentScopedEntity(database, input.incidentId, input.sourceType, input.sourceId),
    resolveIncidentScopedEntity(database, input.incidentId, input.targetType, input.targetId)
  ]);

  try {
    const entityLinkId = randomUUID();
    await database.query(
      `
        insert into incident_entity_links (
          id, incident_id, source_type, source_id, target_type, target_id, link_type, created_by_user_id
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        entityLinkId,
        input.incidentId,
        input.sourceType,
        input.sourceId,
        input.targetType,
        input.targetId,
        input.linkType,
        user.id
      ]
    );

    await createAuditLog(database, {
      actorUserId: user.id,
      incidentId: input.incidentId,
      action: "entity_link.create",
      entityType: "entity_link",
      entityId: entityLinkId,
      afterJson: input
    });

    const result = await database.query("select * from incident_entity_links where id = $1", [entityLinkId]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "Entity link already exists");
    }
    throw error;
  }
}

export async function deleteEntityLink(database: Database, user: AuthenticatedUser, incidentId: string, linkId: string) {
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query(
    "select * from incident_entity_links where id = $1 and incident_id = $2",
    [linkId, incidentId]
  );

  if (existing.rowCount === 0) {
    throw new AppError(404, "Entity link not found");
  }

  if (existing.rows[0].created_by_user_id !== user.id) {
    const permission = getEntityLinkDeletePermission(user);
    if (!permission) {
      throw new AppError(403, "Only the link creator, admin, or commander can delete this link");
    }
    await requirePermission(database, user, permission);
  }

  await database.query("delete from incident_entity_links where id = $1 and incident_id = $2", [linkId, incidentId]);

  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "entity_link.delete",
    entityType: "entity_link",
    entityId: linkId,
    beforeJson: existing.rows[0]
  });
}
