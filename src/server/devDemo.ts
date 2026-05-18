import { newDb } from "pg-mem";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { runMigrations } from "./db/setup.js";
import { createUser } from "./services/userService.js";
import type { AuthenticatedUser } from "./services/authService.js";
import { createCase } from "./services/caseService.js";
import { createIncident } from "./services/incidentService.js";
import { addCaseMember, addIncidentMember } from "./services/membershipService.js";
import { createCustomTag, attachAttackTagToFinding, attachCustomTagToFinding, attachCustomTagToTimelineEvent } from "./services/tagService.js";
import { listAttackTags } from "./services/tagService.js";
import { createFinding } from "./services/findingService.js";
import { createTimelineEvent } from "./services/timelineEventService.js";
import { createIndicator } from "./services/indicatorService.js";
import { createSystem } from "./services/systemService.js";
import { createAccount } from "./services/accountService.js";
import { createTask, createTaskLink } from "./services/taskService.js";
import { createQuery } from "./services/queryService.js";
import { createEvidenceLink } from "./services/evidenceLinkService.js";

function toUser(row: Record<string, unknown>): AuthenticatedUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    globalRole: String(row.global_role),
    status: String(row.status)
  };
}

async function startDemoServer() {
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  await runMigrations(pool);

  const commanderRow = await createUser(pool, {
    email: "commander@example.com",
    displayName: "Demo Commander",
    globalRole: "commander"
  });

  const leadRow = await createUser(pool, {
    email: "lead@example.com",
    displayName: "Demo Response Lead",
    globalRole: "response_lead"
  });

  const analystRow = await createUser(pool, {
    email: "analyst@example.com",
    displayName: "Demo Analyst",
    globalRole: "analyst"
  });

  const commander = toUser(commanderRow);
  const lead = toUser(leadRow);
  const analyst = toUser(analystRow);

  const demoCase = await createCase(pool, commander, {
    caseName: "Contoso Ransomware Investigation",
    clientName: "Contoso Manufacturing",
    status: "open",
    summary: "Primary response workspace for the Contoso ransomware triage and containment effort."
  });

  await addCaseMember(pool, commander, {
    caseId: demoCase.id,
    userId: lead.id,
    caseRole: "response_lead"
  });

  await addCaseMember(pool, commander, {
    caseId: demoCase.id,
    userId: analyst.id,
    caseRole: "analyst"
  });

  const demoIncident = await createIncident(pool, commander, {
    caseId: demoCase.id,
    name: "Domain-wide encryption outbreak",
    summary: "Initial access via phishing led to lateral movement, C2, and widespread encryption on shared infrastructure.",
    severity: "critical",
    status: "open"
  });

  await addIncidentMember(pool, commander, {
    incidentId: demoIncident.id,
    userId: lead.id,
    incidentRole: "investigation_lead"
  });

  await addIncidentMember(pool, commander, {
    incidentId: demoIncident.id,
    userId: analyst.id,
    incidentRole: "triage_analyst"
  });

  const customTagTriage = await createCustomTag(pool, commander, {
    caseId: demoCase.id,
    name: "triage",
    color: "#0f766e"
  });

  const customTagExec = await createCustomTag(pool, commander, {
    caseId: demoCase.id,
    name: "exec-brief",
    color: "#b45309"
  });

  const suspiciousHost = await createSystem(pool, commander, {
    incidentId: demoIncident.id,
    hostname: "fileserver-01",
    ipAddress: "10.20.14.22",
    os: "Windows Server 2019",
    owner: "Infrastructure",
    notes: "Critical SMB host with active encryption telemetry."
  });

  const privilegedAccount = await createAccount(pool, commander, {
    incidentId: demoIncident.id,
    username: "svc-backup",
    domain: "CONTOSO",
    status: "suspected compromised",
    owner: "Backup Team",
    notes: "Service account used in lateral movement chain."
  });

  const c2Indicator = await createIndicator(pool, commander, {
    incidentId: demoIncident.id,
    indicatorType: "domain",
    value: "msupdate-checkin.net",
    description: "Observed domain contacted by multiple affected hosts.",
    confidence: "high",
    source: "EDR telemetry"
  });

  const timelineInitialAccess = await createTimelineEvent(pool, lead, {
    incidentId: demoIncident.id,
    eventTime: "2026-05-17T01:20:00.000Z",
    title: "Phishing execution on finance workstation",
    description: "User launched invoice lure attachment, spawning PowerShell and outbound C2 traffic.",
    source: "Email + EDR",
    rawEvidenceRef: "mailbox-4472 / host finance-ws17",
    ownerUserId: analyst.id
  });

  const timelineContainment = await createTimelineEvent(pool, lead, {
    incidentId: demoIncident.id,
    eventTime: "2026-05-17T03:45:00.000Z",
    title: "SMB shares isolated from core network",
    description: "Network team segmented the primary file cluster after encryption spread was confirmed.",
    source: "Network operations",
    rawEvidenceRef: "change CHG-2891",
    ownerUserId: lead.id
  });

  const findingCredentialAccess = await createFinding(pool, lead, {
    incidentId: demoIncident.id,
    title: "Compromised backup service account used for lateral movement",
    description: "Service account authentication appeared on multiple servers immediately before encryption activity.",
    severity: "critical",
    status: "confirmed",
    confidence: "high",
    impact: "Privileges allowed access to backup shares and multiple production servers.",
    recommendation: "Disable the account, rotate secrets, and review all recent Kerberos and SMB activity.",
    ownerUserId: lead.id
  });

  const findingCommandControl = await createFinding(pool, analyst, {
    incidentId: demoIncident.id,
    title: "Suspected command-and-control domain persists after containment",
    description: "Residual outbound DNS queries to attacker infrastructure continue from two hosts.",
    severity: "high",
    status: "draft",
    confidence: "medium",
    impact: "Potential remaining foothold on isolated endpoints.",
    recommendation: "Hunt remaining hosts, block domain at egress, and collect memory from affected systems.",
    ownerUserId: analyst.id
  });

  const huntQuery = await createQuery(pool, lead, {
    incidentId: demoIncident.id,
    name: "Lateral movement service account pivots",
    language: "spl",
    description: "Track authentications, remote execution, and encryption precursors tied to svc-backup.",
    queryBody: [
      "index=edr OR index=auth",
      '("svc-backup" OR "msupdate-checkin.net")',
      "| stats count by host, user, process_name, dest"
    ].join("\n"),
    ownerUserId: lead.id
  });

  const containmentTask = await createTask(pool, commander, {
    incidentId: demoIncident.id,
    title: "Validate all domain controllers for residual persistence",
    description: "Check scheduled tasks, new services, and suspicious admin logons on every domain controller.",
    status: "in_progress",
    priority: "critical",
    assigneeUserId: lead.id,
    ownerUserId: commander.id,
    dueAt: "2026-05-18T12:00:00.000Z"
  });

  const triageTask = await createTask(pool, lead, {
    incidentId: demoIncident.id,
    title: "Review two endpoints still beaconing to attacker domain",
    description: "Confirm whether outbound DNS is stale telemetry or active post-containment communication.",
    status: "todo",
    priority: "high",
    assigneeUserId: analyst.id,
    ownerUserId: lead.id,
    dueAt: "2026-05-18T10:00:00.000Z"
  });

  await createTaskLink(pool, lead, {
    incidentId: demoIncident.id,
    taskId: containmentTask.id,
    entityType: "finding",
    entityId: findingCredentialAccess.id
  });

  await createTaskLink(pool, lead, {
    incidentId: demoIncident.id,
    taskId: triageTask.id,
    entityType: "query",
    entityId: huntQuery.id
  });

  await createEvidenceLink(pool, lead, {
    incidentId: demoIncident.id,
    findingId: findingCredentialAccess.id,
    evidenceType: "timeline_event",
    evidenceId: timelineInitialAccess.id
  });

  await createEvidenceLink(pool, lead, {
    incidentId: demoIncident.id,
    findingId: findingCredentialAccess.id,
    evidenceType: "system",
    evidenceId: suspiciousHost.id
  });

  const attackTags = await listAttackTags(pool);
  const discoveryTag = attackTags.find((tag) => tag.attack_id === "T1083") ?? attackTags[0];
  if (discoveryTag) {
    await attachAttackTagToFinding(pool, lead, {
      incidentId: demoIncident.id,
      findingId: findingCommandControl.id,
      attackTagId: discoveryTag.id
    });
  }

  await attachCustomTagToFinding(pool, lead, {
    incidentId: demoIncident.id,
    findingId: findingCredentialAccess.id,
    customTagId: customTagExec.id
  });

  await attachCustomTagToFinding(pool, analyst, {
    incidentId: demoIncident.id,
    findingId: findingCommandControl.id,
    customTagId: customTagTriage.id
  });

  await attachCustomTagToTimelineEvent(pool, lead, {
    incidentId: demoIncident.id,
    timelineEventId: timelineContainment.id,
    customTagId: customTagTriage.id
  });

  const app = createApp(pool);
  app.listen(env.PORT, () => {
    process.stdout.write(`Forenotes demo listening on http://127.0.0.1:${env.PORT}\n`);
  });
}

startDemoServer().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
