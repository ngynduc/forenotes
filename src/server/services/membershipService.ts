import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";
import { AppError } from "../errors.js";
import { requireCaseMembership, requireIncidentMembership, requirePermission } from "../permissions/permissionService.js";
import { createAuditLog } from "./auditLogService.js";
import { createNotification } from "./notificationService.js";

interface AddCaseMemberInput {
  caseId: string;
  userId: string;
  caseRole: string;
}

interface AddIncidentMemberInput {
  incidentId: string;
  userId: string;
  incidentRole: string;
}

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

  await createAuditLog(database, {
    actorUserId: user.id,
    caseId: input.caseId,
    action: "case.member_add",
    entityType: "case_member",
    entityId: input.userId,
    afterJson: input
  });

  if (input.userId !== user.id) {
    await createNotification(database, {
      recipientUserId: input.userId,
      actorUserId: user.id,
      eventType: "case.member_added",
      title: "Added to case",
      body: `You were added to case ${input.caseId}`,
      entityType: "case",
      entityId: input.caseId
    });
  }
}

export async function removeCaseMember(database: Database, user: AuthenticatedUser, caseId: string, memberUserId: string) {
  await requirePermission(database, user, "case:member_manage");
  await requireCaseMembership(database, user.id, caseId);

  const existing = await database.query("select * from case_members where case_id = $1 and user_id = $2", [caseId, memberUserId]);
  if (existing.rowCount === 0) {
    throw new AppError(404, "Case member not found");
  }

  await database.query("delete from case_members where case_id = $1 and user_id = $2", [caseId, memberUserId]);
  await createAuditLog(database, {
    actorUserId: user.id,
    caseId,
    action: "case.member_remove",
    entityType: "case_member",
    entityId: memberUserId,
    beforeJson: existing.rows[0]
  });
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

  try {
    await database.query(
      `
        insert into incident_members (incident_id, user_id, incident_role, added_by_user_id)
        values ($1, $2, $3, $4)
      `,
      [input.incidentId, input.userId, input.incidentRole, user.id]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new AppError(409, "User is already an incident member");
    }
    throw error;
  }

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
    await createNotification(database, {
      recipientUserId: input.userId,
      actorUserId: user.id,
      incidentId: input.incidentId,
      eventType: "incident.member_added",
      title: "Added to incident",
      body: `You were added to incident ${input.incidentId}`,
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
