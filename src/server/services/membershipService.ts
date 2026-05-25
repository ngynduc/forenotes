import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import type { CaseMemberRole } from "../../shared/domain.js";
import { AppError } from "../errors.js";
import { requireCaseMembership, requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import {
  createNotification,
  formatNotificationScope,
  getCaseNotificationScope,
  getIncidentNotificationScope
} from "./notificationService.js";

interface AddCaseMemberInput {
  caseId: string;
  userId: string;
  caseRole: CaseMemberRole;
}

interface AddIncidentMemberInput {
  incidentId: string;
  userId: string;
  incidentRole: string;
}

const INCIDENT_ROLE_BY_CASE_ROLE: Record<CaseMemberRole, string> = {
  case_lead: "incident_lead",
  response_lead: "investigation_lead",
  analyst: "analyst",
  viewer: "viewer"
};

export async function listCaseMembers(database: Database, userId: string, caseId: string) {
  await requireCaseMembership(database, userId, caseId);
  const result = await database.query(
    `
      select cm.case_id, cm.user_id, cm.case_role, cm.added_by_user_id, cm.added_at, u.email, u.display_name, u.global_role
      from case_members cm
      inner join users u on u.id = cm.user_id
      where cm.case_id = $1
      order by cm.added_at asc
    `,
    [caseId]
  );
  return result.rows;
}

export async function addCaseMember(database: Database, user: AuthenticatedUser, input: AddCaseMemberInput) {
  await requirePermission(database, user, "case:member_manage");
  await requireCaseMembership(database, user.id, input.caseId);

  const userResult = await database.query("select 1 from users where id = $1 and status = 'active'", [input.userId]);
  if (userResult.rowCount === 0) {
    throw new AppError(404, "User not found");
  }

  try {
    await database.query(
      `
        insert into case_members (case_id, user_id, case_role, added_by_user_id)
        values ($1, $2, $3, $4)
      `,
      [input.caseId, input.userId, input.caseRole, user.id]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "User is already a case member");
    }
    throw error;
  }

  await syncCaseMemberToIncidents(database, input.caseId, input.userId, input.caseRole, user.id);

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: input.caseId,
    action: "case.member_add",
    entityType: "case_member",
    entityId: input.userId,
    afterJson: input
  });

  if (input.userId !== user.id) {
    const scope = await getCaseNotificationScope(database, input.caseId);
    await createNotification(database, {
      recipientUserId: input.userId,
      actorUserId: user.id,
      eventType: "case.member_added",
      title: "Added to case",
      body: `You were added to ${formatNotificationScope(scope)}`,
      entityType: "case",
      entityId: input.caseId
    });
  }
}

export async function updateCaseMemberRole(
  database: Database,
  user: AuthenticatedUser,
  caseId: string,
  memberUserId: string,
  caseRole: CaseMemberRole
) {
  await requirePermission(database, user, "case:member_manage");
  await requireCaseMembership(database, user.id, caseId);

  const existing = await database.query<{ case_role: string }>(
    "select * from case_members where case_id = $1 and user_id = $2",
    [caseId, memberUserId]
  );
  if (existing.rowCount === 0) {
    throw new AppError(404, "Case member not found");
  }
  if (existing.rows[0].case_role === "case_lead" && caseRole !== "case_lead") {
    await ensureNotLastCaseLead(database, caseId);
  }

  await database.query("update case_members set case_role = $3 where case_id = $1 and user_id = $2", [
    caseId,
    memberUserId,
    caseRole
  ]);
  await syncCaseMemberToIncidents(database, caseId, memberUserId, caseRole, user.id);

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "case.member_role_update",
    entityType: "case_member",
    entityId: memberUserId,
    beforeJson: existing.rows[0],
    afterJson: { caseId, userId: memberUserId, caseRole }
  });
}

export async function removeCaseMember(database: Database, user: AuthenticatedUser, caseId: string, memberUserId: string) {
  await requirePermission(database, user, "case:member_manage");
  await requireCaseMembership(database, user.id, caseId);

  const existing = await database.query("select * from case_members where case_id = $1 and user_id = $2", [caseId, memberUserId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Case member not found");
  }
  if (existing.rows[0].case_role === "case_lead") {
    await ensureNotLastCaseLead(database, caseId);
  }

  await database.query("delete from case_members where case_id = $1 and user_id = $2", [caseId, memberUserId]);
  await database.query(
    `
      delete from incident_members im
      using incidents i
      where im.incident_id = i.id
        and i.case_id = $1
        and im.user_id = $2
    `,
    [caseId, memberUserId]
  );
  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "case.member_remove",
    entityType: "case_member",
    entityId: memberUserId,
    beforeJson: existing.rows[0]
  });
}

export async function syncCaseMembersToIncident(
  database: Database,
  caseId: string,
  incidentId: string,
  addedByUserId: string
) {
  await database.query(
    `
      insert into incident_members (incident_id, user_id, incident_role, added_by_user_id)
      select $2, user_id,
        case
          when case_role = 'case_lead' then 'incident_lead'
          when case_role = 'response_lead' then 'investigation_lead'
          when case_role = 'viewer' then 'viewer'
          else 'analyst'
        end,
        $3
      from case_members
      where case_id = $1
      on conflict (incident_id, user_id) do update set
        incident_role = excluded.incident_role,
        added_by_user_id = excluded.added_by_user_id
    `,
    [caseId, incidentId, addedByUserId]
  );
}

export async function listIncidentMembers(database: Database, userId: string, incidentId: string) {
  await requireIncidentMembership(database, userId, incidentId);
  const result = await database.query(
    `
      select im.incident_id, im.user_id, im.incident_role, im.added_by_user_id, im.added_at, u.email, u.display_name, u.global_role
      from incident_members im
      inner join users u on u.id = im.user_id
      where im.incident_id = $1
      order by im.added_at asc
    `,
    [incidentId]
  );
  return result.rows;
}

export async function addIncidentMember(database: Database, user: AuthenticatedUser, input: AddIncidentMemberInput) {
  await requirePermission(database, user, "incident:member_manage");
  await requireIncidentMembership(database, user.id, input.incidentId);

  const userResult = await database.query("select 1 from users where id = $1 and status = 'active'", [input.userId]);
  if (userResult.rowCount === 0) {
    throw new AppError(404, "User not found");
  }

  const caseScope = await database.query<{ case_id: string }>("select case_id from incidents where id = $1", [input.incidentId]);
  if (caseScope.rowCount === 0) {
    throw new AppError(404, "Incident not found");
  }

  await requireCaseMembership(database, input.userId, caseScope.rows[0].case_id);

  await database.query(
    `
      insert into incident_members (incident_id, user_id, incident_role, added_by_user_id)
      values ($1, $2, $3, $4)
      on conflict (incident_id, user_id) do update set
        incident_role = excluded.incident_role,
        added_by_user_id = excluded.added_by_user_id
    `,
    [input.incidentId, input.userId, input.incidentRole, user.id]
  );

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: caseScope.rows[0].case_id,
    incidentId: input.incidentId,
    action: "incident.member_add",
    entityType: "incident_member",
    entityId: input.userId,
    afterJson: input
  });

  if (input.userId !== user.id) {
    const scope = await getIncidentNotificationScope(database, input.incidentId);
    await createNotification(database, {
      recipientUserId: input.userId,
      actorUserId: user.id,
      incidentId: input.incidentId,
      eventType: "incident.member_added",
      title: "Added to incident",
      body: `You were added to ${formatNotificationScope(scope)}`,
      entityType: "incident",
      entityId: input.incidentId
    });
  }
}

export async function removeIncidentMember(
  database: Database,
  user: AuthenticatedUser,
  incidentId: string,
  memberUserId: string
) {
  await requirePermission(database, user, "incident:member_manage");
  await requireIncidentMembership(database, user.id, incidentId);

  const existing = await database.query("select * from incident_members where incident_id = $1 and user_id = $2", [
    incidentId,
    memberUserId
  ]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Incident member not found");
  }

  await database.query("delete from incident_members where incident_id = $1 and user_id = $2", [incidentId, memberUserId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    incidentId,
    action: "incident.member_remove",
    entityType: "incident_member",
    entityId: memberUserId,
    beforeJson: existing.rows[0]
  });
}

async function syncCaseMemberToIncidents(
  database: Database,
  caseId: string,
  userId: string,
  caseRole: CaseMemberRole,
  addedByUserId: string
) {
  await database.query(
    `
      insert into incident_members (incident_id, user_id, incident_role, added_by_user_id)
      select id, $2, $3, $4
      from incidents
      where case_id = $1
      on conflict (incident_id, user_id) do update set
        incident_role = excluded.incident_role,
        added_by_user_id = excluded.added_by_user_id
    `,
    [caseId, userId, INCIDENT_ROLE_BY_CASE_ROLE[caseRole], addedByUserId]
  );
}

async function ensureNotLastCaseLead(database: Database, caseId: string) {
  const leadCount = await database.query<{ count: string }>(
    "select count(*)::int as count from case_members where case_id = $1 and case_role = 'case_lead'",
    [caseId]
  );
  if (Number(leadCount.rows[0]?.count ?? 0) <= 1) {
    throw new AppError(409, "Cannot remove or demote the last case lead");
  }
}
