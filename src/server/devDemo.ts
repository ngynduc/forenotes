import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { runMigrations } from "./db/setup.js";
import { createUser } from "./services/userService.js";
import type { AuthenticatedUser } from "./services/authService.js";
import type { CaseMemberRole } from "../shared/domain.js";
import { createCase } from "./services/caseService.js";
import { createIncident } from "./services/incidentService.js";
import { addCaseMember, addIncidentMember } from "./services/membershipService.js";
import {
  createCustomTag,
  attachAttackTagToFinding,
  attachAttackTagToQuery,
  attachAttackTagToTimelineEvent,
  attachCustomTagToFinding,
  attachCustomTagToTimelineEvent,
  listAttackTags
} from "./services/tagService.js";
import { createFinding } from "./services/findingService.js";
import { createTimelineEvent } from "./services/timelineEventService.js";
import { createIndicator } from "./services/indicatorService.js";
import { createSystem } from "./services/systemService.js";
import { createAccount } from "./services/accountService.js";
import { createTask, createTaskLink } from "./services/taskService.js";
import { createQuery } from "./services/queryService.js";
import { createEvidenceLink } from "./services/evidenceLinkService.js";
import { createEntityLink } from "./graph/entityLinksRepository.js";
import type { Database } from "./db/types.js";

function toUser(row: Record<string, unknown>): AuthenticatedUser {
  return {
    id: String(row.id),
    username: String(row.username ?? row.email),
    email: String(row.email),
    displayName: String(row.display_name),
    globalRole: String(row.global_role) as AuthenticatedUser["globalRole"],
    status: String(row.status),
    mustChangePassword: Boolean(row.must_change_password),
    isBootstrapAdmin: Boolean(row.is_bootstrap_admin)
  };
}

type SeedUser = {
  auth: AuthenticatedUser;
  caseRole: CaseMemberRole;
  incidentRole: string;
};

type DemoUserKey = "commander" | "lead" | "analyst";

type SeedCasePlan = {
  caseName: string;
  clientName: string;
  status: "open" | "closed";
  summary: string;
  customTags: { name: string; color: string }[];
  incidents: SeedIncidentPlan[];
};

type SeedIncidentPlan = {
  name: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "closed" | "contained";
  systems: Array<{ hostname: string; ipAddress: string; os: string; owner: string; notes: string }>;
  accounts: Array<{ username: string; domain: string; status: string; owner: string; notes: string }>;
  indicators: Array<{
    indicatorType: "domain" | "ip" | "url" | "email" | "file_hash" | "process";
    value: string;
    description: string;
    confidence: "low" | "medium" | "high";
    source: string;
  }>;
  timelineEvents: Array<{
    eventTime: string;
    title: string;
    description: string;
    source: string;
    rawEvidenceRef: string;
    systemIndex?: number;
    accountIndex?: number;
    owner: "commander" | "lead" | "analyst";
    attachAttack?: string;
    attachCustomTagIndex?: number;
  }>;
  findings: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "draft" | "confirmed" | "false_positive" | "resolved";
    confidence: "low" | "medium" | "high";
    impact: string;
    recommendation: string;
    owner: "lead" | "analyst";
    attachAttack?: string;
    attachCustomTagIndex?: number;
    evidenceTimelineIndex?: number;
    evidenceSystemIndex?: number;
    evidenceAccountIndex?: number;
    evidenceIndicatorIndex?: number;
    evidenceQueryIndex?: number;
  }>;
  queries: Array<{
    name: string;
    language: string;
    description: string;
    queryBody: string;
    owner: "lead" | "analyst";
    attachAttack?: string;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    status: "todo" | "in_progress" | "blocked" | "done";
    priority: "low" | "medium" | "high" | "critical";
    assignee: "lead" | "analyst";
    owner: "commander" | "lead";
    dueAt?: string;
    findingIndex?: number;
    queryIndex?: number;
    systemIndex?: number;
    accountIndex?: number;
    indicatorIndex?: number;
    timelineIndex?: number;
  }>;
  entityLinks?: Array<{
    sourceType: "finding" | "timeline_event" | "task" | "system" | "account" | "ioc" | "query" | "mitre_technique" | "mitre_tactic" | "user" | "tag";
    sourceIndex?: number;
    sourceAttack?: string;
    sourceUser?: "commander" | "lead" | "analyst";
    sourceCustomTagIndex?: number;
    targetType: "finding" | "timeline_event" | "task" | "system" | "account" | "ioc" | "query" | "mitre_technique" | "mitre_tactic" | "user" | "tag";
    targetIndex?: number;
    targetAttack?: string;
    targetUser?: "commander" | "lead" | "analyst";
    targetCustomTagIndex?: number;
    linkType:
      | "related_to"
      | "evidence_for"
      | "caused_by"
      | "followed_by"
      | "investigates"
      | "references"
      | "observed_on"
      | "used_account"
      | "contains_ioc"
      | "maps_to"
      | "belongs_to_tactic"
      | "subtechnique_of"
      | "detects"
      | "assigned_to"
      | "has_tag";
  }>;
};

type TaskTemplate = {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee: "lead" | "analyst";
  owner: "commander" | "lead";
  dueOffsetHours?: number;
  linkType: "finding" | "query" | "system" | "timeline";
  linkIndex: number;
};

const taskTemplates: TaskTemplate[] = [
  {
    title: "Validate containment coverage on core assets",
    description: "Confirm every high-value asset has isolation, telemetry, and a named owner.",
    status: "in_progress",
    priority: "critical",
    assignee: "lead",
    owner: "commander",
    dueOffsetHours: -8,
    linkType: "finding" as const,
    linkIndex: 0
  },
  {
    title: "Collect endpoint triage from newest suspicious host",
    description: "Review process tree, persistence, and outbound activity for the latest affected asset.",
    status: "todo",
    priority: "high",
    assignee: "analyst",
    owner: "lead",
    dueOffsetHours: 6,
    linkType: "query" as const,
    linkIndex: 0
  },
  {
    title: "Update incident timeline with validated operator activity",
    description: "Merge confirmed evidence into the master chronology for the next briefing.",
    status: "todo",
    priority: "medium",
    assignee: "analyst",
    owner: "lead",
    dueOffsetHours: 20,
    linkType: "timeline" as const,
    linkIndex: 0
  },
  {
    title: "Coordinate password or token reset approvals",
    description: "Track business sign-off before revoking access tied to suspicious identities.",
    status: "blocked",
    priority: "high",
    assignee: "lead",
    owner: "commander",
    dueOffsetHours: 28,
    linkType: "finding" as const,
    linkIndex: 1
  },
  {
    title: "Verify external blocking controls are active",
    description: "Confirm domain, IP, and URL blocks reached egress devices and upstream providers.",
    status: "done",
    priority: "high",
    assignee: "lead",
    owner: "commander",
    dueOffsetHours: -20,
    linkType: "system" as const,
    linkIndex: 0
  },
  {
    title: "Document follow-up actions for the next shift",
    description: "Prepare the handoff notes with evidence gaps, owners, and pending dependencies.",
    status: "in_progress",
    priority: "medium",
    assignee: "analyst",
    owner: "lead",
    dueOffsetHours: 36,
    linkType: "query" as const,
    linkIndex: 1
  },
  {
    title: "Chase third-party response dependency",
    description: "Escalate the outstanding dependency blocking full remediation or evidence collection.",
    status: "blocked",
    priority: "low",
    assignee: "analyst",
    owner: "lead",
    linkType: "timeline" as const,
    linkIndex: 1
  },
  {
    title: "Close verified remediation items",
    description: "Validate completed remediation and close the work item once evidence is attached.",
    status: "done",
    priority: "low",
    assignee: "analyst",
    owner: "lead",
    dueOffsetHours: -72,
    linkType: "finding" as const,
    linkIndex: 2
  }
];

const demoUsers: Record<
  DemoUserKey,
  {
    email: string;
    displayName: string;
    globalRole: "commander" | "response_lead" | "analyst";
    caseRole: CaseMemberRole;
    incidentRole: string;
  }
> = {
  commander: {
    email: "commander@example.com",
    displayName: "Demo Commander",
    globalRole: "commander",
    caseRole: "case_lead",
    incidentRole: "incident_commander"
  },
  lead: {
    email: "lead@example.com",
    displayName: "Demo Response Lead",
    globalRole: "response_lead",
    caseRole: "response_lead",
    incidentRole: "investigation_lead"
  },
  analyst: {
    email: "analyst@example.com",
    displayName: "Demo Analyst",
    globalRole: "analyst",
    caseRole: "analyst",
    incidentRole: "triage_analyst"
  }
};

function iso(date: Date) {
  return date.toISOString();
}

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function addDays(base: Date, days: number) {
  return addHours(base, days * 24);
}

export function getDemoAnchorTime(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0, 0));
}

function buildTaskPlans(baseTime: Date) {
  return taskTemplates.map((template) => ({
    title: template.title,
    description: template.description,
    status: template.status,
    priority: template.priority,
    assignee: template.assignee,
    owner: template.owner,
    dueAt: template.dueOffsetHours === undefined ? undefined : iso(addHours(baseTime, template.dueOffsetHours)),
    findingIndex: template.linkType === "finding" ? template.linkIndex : undefined,
    queryIndex: template.linkType === "query" ? template.linkIndex : undefined,
    systemIndex: template.linkType === "system" ? template.linkIndex : undefined,
    timelineIndex: template.linkType === "timeline" ? template.linkIndex : undefined
  }));
}

function buildIncidentPlan(
  baseTime: Date,
  options: {
    name: string;
    summary: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "closed" | "contained";
    hostPrefix: string;
    ipBase: string;
    domain: string;
    teamOwner: string;
    mailbox: string;
    hashPrefix: string;
  }
): SeedIncidentPlan {
  return {
    name: options.name,
    summary: options.summary,
    severity: options.severity,
    status: options.status,
    systems: [
      {
        hostname: `${options.hostPrefix}-gateway`,
        ipAddress: `${options.ipBase}.10`,
        os: "Windows Server 2022",
        owner: options.teamOwner,
        notes: "Primary infrastructure system with broad internal reach."
      },
      {
        hostname: `${options.hostPrefix}-workstation`,
        ipAddress: `${options.ipBase}.27`,
        os: "Windows 11",
        owner: "End User Computing",
        notes: "Representative impacted endpoint retained for triage."
      }
    ],
    accounts: [
      {
        username: `${options.hostPrefix}_svc`,
        domain: "CORP",
        status: "suspected compromised",
        owner: options.teamOwner,
        notes: "Operational account observed near suspicious activity."
      },
      {
        username: `${options.hostPrefix}.admin`,
        domain: "CORP",
        status: "under review",
        owner: options.teamOwner,
        notes: "Administrative account pending scope confirmation."
      }
    ],
    indicators: [
      {
        indicatorType: "domain",
        value: `${options.domain}.example`,
        description: "Suspected external infrastructure referenced in triage.",
        confidence: "high",
        source: "EDR telemetry"
      },
      {
        indicatorType: "ip",
        value: `203.0.113.${Number(options.ipBase.split(".").at(-1) ?? 40)}`,
        description: "Destination IP linked to outbound connections.",
        confidence: "medium",
        source: "Firewall logs"
      },
      {
        indicatorType: "email",
        value: `${options.mailbox}@malicious-mail.example`,
        description: "Mailbox or sender identity tied to the intrusion path.",
        confidence: "medium",
        source: "Email gateway"
      },
      {
        indicatorType: "file_hash",
        value: `${options.hashPrefix}`.padEnd(64, "a"),
        description: "Sample hash retained for blocking and retrohunt.",
        confidence: "high",
        source: "Sandbox analysis"
      }
    ],
    timelineEvents: [
      {
        eventTime: iso(addHours(baseTime, -48)),
        title: "Initial suspicious activity detected",
        description: "Monitoring surfaced the first signal now linked to this incident.",
        source: "Detection engineering",
        rawEvidenceRef: `${options.hostPrefix}-det-01`,
        owner: "analyst"
      },
      {
        eventTime: iso(addHours(baseTime, -30)),
        title: "Analyst validated malicious sequence",
        description: "Triage confirmed the activity aligned with the incident hypothesis.",
        source: "EDR + SIEM",
        rawEvidenceRef: `${options.hostPrefix}-triage-02`,
        owner: "lead"
      },
      {
        eventTime: iso(addHours(baseTime, -10)),
        title: "Containment or coordination action executed",
        description: "Response team applied the next planned action and documented residual gaps.",
        source: "Incident command",
        rawEvidenceRef: `${options.hostPrefix}-contain-03`,
        owner: "lead"
      }
    ],
    findings: [
      {
        title: `${options.name} established privileged foothold`,
        description: "Evidence indicates the adversary obtained or abused elevated access during the activity window.",
        severity: options.severity === "low" ? "medium" : options.severity,
        status: options.status === "closed" ? "resolved" : "confirmed",
        confidence: "high",
        impact: "Elevated access increased blast radius and complicated containment.",
        recommendation: "Rotate privileged credentials, review lateral pivots, and confirm persistence removal.",
        owner: "lead",
        attachAttack: "T1078",
        attachCustomTagIndex: 0,
        evidenceTimelineIndex: 1,
        evidenceSystemIndex: 0
      },
      {
        title: `${options.name} retained suspicious external communications`,
        description: "Outbound connections continued long enough to suggest staging, control, or exfiltration attempts.",
        severity: options.severity,
        status: options.status === "contained" ? "draft" : "confirmed",
        confidence: "medium",
        impact: "Residual communications indicate unfinished scoping or incomplete blocking.",
        recommendation: "Hunt for remaining beacons, validate edge controls, and expand retroactive search coverage.",
        owner: "analyst",
        attachAttack: "T1071",
        attachCustomTagIndex: 1,
        evidenceTimelineIndex: 0,
        evidenceSystemIndex: 1
      },
      {
        title: `${options.name} generated one noisy lead during triage`,
        description: "One signal mapped to normal administrator behavior after closer review.",
        severity: "low",
        status: "false_positive",
        confidence: "low",
        impact: "Limited direct impact, but it consumed analyst time during the response.",
        recommendation: "Tune the rule or tag the pattern so future hunts deprioritize it.",
        owner: "analyst",
        attachCustomTagIndex: 0
      }
    ],
    queries: [
      {
        name: `${options.name} pivots`,
        language: "spl",
        description: "Primary hunt for hosts, users, and processes tied to the incident storyline.",
        queryBody: [
          "index=edr OR index=auth",
          `("${options.domain}.example" OR "${options.hostPrefix}_svc")`,
          "| stats count by host, user, process_name, dest"
        ].join("\n"),
        owner: "lead"
      },
      {
        name: `${options.name} validation`,
        language: "sql",
        description: "Secondary validation query for downstream tracking and exports.",
        queryBody: [
          "select host, user_name, last_seen_at",
          "from detections",
          `where incident_label = '${options.name.replace(/'/g, "''")}'`
        ].join("\n"),
        owner: "analyst"
      }
    ],
    tasks: buildTaskPlans(baseTime)
  };
}

function buildFullWorkflowIncident(baseTime: Date): SeedIncidentPlan {
  return {
    name: "Identity-to-Cloud full workflow validation",
    summary:
      "Purpose-built incident for demo validation: identity compromise, endpoint execution, SaaS abuse, tagging, graphing, search pivots, and cross-record linking.",
    severity: "critical",
    status: "open",
    systems: [
      {
        hostname: "workflow-idp-admin",
        ipAddress: "10.77.41.10",
        os: "Windows Server 2022",
        owner: "Identity Engineering",
        notes: "Domain-connected identity host tied to privilege escalation."
      },
      {
        hostname: "workflow-finance-lt",
        ipAddress: "10.77.41.24",
        os: "Windows 11",
        owner: "Finance Operations",
        notes: "Phished endpoint used to launch the first malicious session."
      },
      {
        hostname: "workflow-cloud-jump",
        ipAddress: "10.77.41.55",
        os: "Ubuntu 24.04",
        owner: "Cloud Platform",
        notes: "Jump host where suspicious CLI activity and token replay were observed."
      }
    ],
    accounts: [
      {
        username: "svc.workflow-sync",
        domain: "CORP",
        status: "compromised",
        owner: "Identity Engineering",
        notes: "Service account later reused for cloud API access."
      },
      {
        username: "maria.nguyen",
        domain: "CORP",
        status: "reset pending",
        owner: "Finance Operations",
        notes: "Mailbox owner targeted by the initial lure and MFA fatigue sequence."
      },
      {
        username: "azure.breakglass",
        domain: "AAD",
        status: "under review",
        owner: "Cloud Platform",
        notes: "Emergency admin account touched during the response window."
      }
    ],
    indicators: [
      {
        indicatorType: "email",
        value: "payables-review@secure-docs-mail.example",
        description: "Initial phishing sender used in the lure.",
        confidence: "high",
        source: "Mail gateway"
      },
      {
        indicatorType: "url",
        value: "https://auth-sync-verify.example/session",
        description: "Credential collection page embedded in the lure.",
        confidence: "high",
        source: "Proxy logs"
      },
      {
        indicatorType: "domain",
        value: "api-sync-control.example",
        description: "C2 endpoint later used by scripted access.",
        confidence: "high",
        source: "EDR telemetry"
      },
      {
        indicatorType: "ip",
        value: "198.51.100.44",
        description: "External infrastructure contacted from the cloud jump host.",
        confidence: "medium",
        source: "Firewall logs"
      },
      {
        indicatorType: "process",
        value: "az login --service-principal --tenant workflow-demo",
        description: "Representative process string tied to cloud token misuse.",
        confidence: "medium",
        source: "Shell history"
      },
      {
        indicatorType: "file_hash",
        value: "3d6a4b7f9c1e22fa6f8630be9d11ab44d46359bc63cd7cb5fc143f38bb4b2cb1",
        description: "Downloader staged on the phished finance laptop.",
        confidence: "high",
        source: "Sandbox analysis"
      }
    ],
    timelineEvents: [
      {
        eventTime: iso(addHours(baseTime, -56)),
        title: "Phishing lure reached finance mailbox",
        description: "User received a vendor payment review lure carrying the credential harvest link.",
        source: "Email gateway",
        rawEvidenceRef: "workflow-mail-01",
        accountIndex: 1,
        owner: "analyst",
        attachCustomTagIndex: 1
      },
      {
        eventTime: iso(addHours(baseTime, -49)),
        title: "Finance laptop executed downloader",
        description: "Endpoint telemetry showed the lure opening a staged downloader and browser session.",
        source: "EDR",
        rawEvidenceRef: "workflow-edr-02",
        systemIndex: 1,
        accountIndex: 1,
        owner: "lead",
        attachAttack: "T1204"
      },
      {
        eventTime: iso(addHours(baseTime, -32)),
        title: "Service account reused on identity admin host",
        description: "Credential replay activity led to privileged access on the identity administration server.",
        source: "Authentication logs",
        rawEvidenceRef: "workflow-auth-03",
        systemIndex: 0,
        accountIndex: 0,
        owner: "lead",
        attachAttack: "T1078",
        attachCustomTagIndex: 0
      },
      {
        eventTime: iso(addHours(baseTime, -20)),
        title: "Cloud jump host launched anomalous CLI session",
        description: "Token-backed cloud access originated from the jump host and touched risky app scopes.",
        source: "Cloud audit",
        rawEvidenceRef: "workflow-cloud-04",
        systemIndex: 2,
        accountIndex: 2,
        owner: "commander",
        attachAttack: "T1528",
        attachCustomTagIndex: 2
      },
      {
        eventTime: iso(addHours(baseTime, -6)),
        title: "Containment, reset, and monitoring actions coordinated",
        description: "The team isolated the laptop, reset identities, revoked sessions, and staged further hunting.",
        source: "Incident command",
        rawEvidenceRef: "workflow-ic-05",
        systemIndex: 2,
        accountIndex: 0,
        owner: "commander",
        attachCustomTagIndex: 3
      }
    ],
    findings: [
      {
        title: "Credential phishing enabled identity compromise",
        description: "The lure captured user credentials and enabled the first foothold into the environment.",
        severity: "critical",
        status: "confirmed",
        confidence: "high",
        impact: "Primary identity was compromised, enabling downstream lateral access and token abuse.",
        recommendation: "Reset affected identities, enforce phishing-resistant MFA, and expand hunt coverage to related mailboxes.",
        owner: "lead",
        attachAttack: "T1566",
        attachCustomTagIndex: 1,
        evidenceTimelineIndex: 0,
        evidenceSystemIndex: 1,
        evidenceAccountIndex: 1,
        evidenceIndicatorIndex: 1
      },
      {
        title: "Privileged service account facilitated admin host access",
        description: "The service account was reused outside baseline workflows and reached privileged systems.",
        severity: "critical",
        status: "confirmed",
        confidence: "high",
        impact: "Privilege escalation increased blast radius and complicated scoping.",
        recommendation: "Rotate service account secrets, audit privileged sessions, and tighten conditional access on admin paths.",
        owner: "lead",
        attachAttack: "T1078",
        attachCustomTagIndex: 0,
        evidenceTimelineIndex: 2,
        evidenceSystemIndex: 0,
        evidenceAccountIndex: 0,
        evidenceQueryIndex: 0
      },
      {
        title: "Cloud token abuse reached risky SaaS scopes",
        description: "Suspicious cloud activity used token-backed access from the jump host and touched sensitive app grants.",
        severity: "high",
        status: "confirmed",
        confidence: "medium",
        impact: "Potential tenant-wide data exposure and persistence via delegated access.",
        recommendation: "Revoke active sessions, review service principal grants, and validate token issuance history.",
        owner: "analyst",
        attachAttack: "T1528",
        attachCustomTagIndex: 2,
        evidenceTimelineIndex: 3,
        evidenceSystemIndex: 2,
        evidenceAccountIndex: 2,
        evidenceIndicatorIndex: 4,
        evidenceQueryIndex: 1
      },
      {
        title: "One browser helper execution was benign admin troubleshooting",
        description: "A noisy command matched a known admin troubleshooting pattern and was not part of the intrusion chain.",
        severity: "low",
        status: "false_positive",
        confidence: "low",
        impact: "Consumed analyst review time but did not expand scope.",
        recommendation: "Tag the pattern for faster dismissal in future cases.",
        owner: "analyst",
        attachCustomTagIndex: 3,
        evidenceTimelineIndex: 4
      }
    ],
    queries: [
      {
        name: "Workflow identity pivot",
        language: "spl",
        description: "Maps the finance user, service account, and admin host activity into one timeline.",
        queryBody: [
          "index=auth OR index=edr OR index=o365",
          "(\"maria.nguyen\" OR \"svc.workflow-sync\" OR \"workflow-idp-admin\")",
          "| stats count by _time, host, user, app, src_ip"
        ].join("\n"),
        owner: "lead",
        attachAttack: "T1078"
      },
      {
        name: "Workflow cloud scope validation",
        language: "kusto",
        description: "Validates SaaS and cloud control plane actions tied to the suspicious CLI session.",
        queryBody: [
          "AuditLogs",
          "| where Identity contains \"azure.breakglass\" or InitiatedBy.user.userPrincipalName contains \"svc.workflow-sync\"",
          "| project TimeGenerated, OperationName, Result, AppDisplayName, InitiatedBy"
        ].join("\n"),
        owner: "analyst",
        attachAttack: "T1528"
      },
      {
        name: "Workflow IOC retrohunt",
        language: "sql",
        description: "Cross-checks known indicators across retained telemetry exports.",
        queryBody: [
          "select event_time, host_name, artifact_value, hit_count",
          "from retained_ioc_hits",
          "where artifact_value in ('api-sync-control.example', '198.51.100.44')"
        ].join("\n"),
        owner: "analyst",
        attachAttack: "T1071"
      }
    ],
    tasks: [
      {
        title: "Reset phished user and validate mailbox controls",
        description: "Coordinate credential reset, mailbox review, and post-reset validation for the initial victim.",
        status: "done",
        priority: "critical",
        assignee: "lead",
        owner: "commander",
        dueAt: iso(addHours(baseTime, -4)),
        accountIndex: 1
      },
      {
        title: "Scope service account use across identity infrastructure",
        description: "Trace where the reused service account authenticated and confirm secret rotation coverage.",
        status: "in_progress",
        priority: "critical",
        assignee: "lead",
        owner: "commander",
        dueAt: iso(addHours(baseTime, 4)),
        findingIndex: 1
      },
      {
        title: "Validate C2 and token-abuse retrohunt coverage",
        description: "Use the dedicated hunt queries and confirm all known indicators were searched across hot telemetry.",
        status: "todo",
        priority: "high",
        assignee: "analyst",
        owner: "lead",
        dueAt: iso(addHours(baseTime, 10)),
        queryIndex: 2
      },
      {
        title: "Preserve cloud jump host and capture volatile evidence",
        description: "Snapshot the cloud jump host before additional remediation alters the evidence trail.",
        status: "blocked",
        priority: "high",
        assignee: "analyst",
        owner: "lead",
        dueAt: iso(addHours(baseTime, 2)),
        systemIndex: 2
      },
      {
        title: "Track malicious infrastructure into IOC board",
        description: "Ensure the shared IOC board and customer blocking list include the latest confirmed infrastructure.",
        status: "todo",
        priority: "medium",
        assignee: "analyst",
        owner: "lead",
        dueAt: iso(addHours(baseTime, 14)),
        indicatorIndex: 2
      },
      {
        title: "Document the final containment checkpoint",
        description: "Record the coordinated reset and revoke milestone in the incident chronology.",
        status: "in_progress",
        priority: "medium",
        assignee: "lead",
        owner: "commander",
        dueAt: iso(addHours(baseTime, 8)),
        timelineIndex: 4
      }
    ],
    entityLinks: [
      {
        sourceType: "finding",
        sourceIndex: 1,
        targetType: "query",
        targetIndex: 0,
        linkType: "investigates"
      },
      {
        sourceType: "finding",
        sourceIndex: 2,
        targetType: "system",
        targetIndex: 2,
        linkType: "observed_on"
      },
      {
        sourceType: "timeline_event",
        sourceIndex: 3,
        targetType: "account",
        targetIndex: 2,
        linkType: "used_account"
      },
      {
        sourceType: "timeline_event",
        sourceIndex: 1,
        targetType: "ioc",
        targetIndex: 5,
        linkType: "contains_ioc"
      },
      {
        sourceType: "task",
        sourceIndex: 1,
        targetType: "user",
        targetUser: "lead",
        linkType: "assigned_to"
      },
      {
        sourceType: "finding",
        sourceIndex: 2,
        targetType: "mitre_technique",
        targetAttack: "T1528",
        linkType: "maps_to"
      },
      {
        sourceType: "finding",
        sourceIndex: 0,
        targetType: "tag",
        targetCustomTagIndex: 1,
        linkType: "has_tag"
      }
    ]
  };
}

function buildSeedCases(now: Date): SeedCasePlan[] {
  return [
    {
      caseName: "Contoso Ransomware Response",
      clientName: "Contoso Manufacturing",
      status: "open",
      summary: "Large active ransomware engagement spanning shared infrastructure, identity systems, and recovery coordination.",
      customTags: [
        { name: "exec-brief", color: "#b45309" },
        { name: "containment", color: "#0f766e" }
      ],
      incidents: [
        buildIncidentPlan(addDays(now, -2), {
          name: "Domain-wide encryption outbreak",
          summary: "Phishing-led compromise expanded into file encryption on shared servers.",
          severity: "critical",
          status: "open",
          hostPrefix: "contoso-ransom",
          ipBase: "10.20.14",
          domain: "msupdate-checkin",
          teamOwner: "Infrastructure",
          mailbox: "invoice-review",
          hashPrefix: "9f5c0d34"
        }),
        buildIncidentPlan(addDays(now, -1), {
          name: "Recovery network hardening follow-up",
          summary: "Post-containment review tracking residual access and recovery blockers.",
          severity: "high",
          status: "contained",
          hostPrefix: "contoso-recovery",
          ipBase: "10.20.18",
          domain: "backup-status",
          teamOwner: "Recovery Engineering",
          mailbox: "restore-ticket",
          hashPrefix: "4e1ac98b"
        })
      ]
    },
    {
      caseName: "Northwind Business Email Compromise",
      clientName: "Northwind Traders",
      status: "open",
      summary: "Finance-focused BEC investigation with inbox takeovers, payment diversion, and supplier notification work.",
      customTags: [
        { name: "wire-risk", color: "#b91c1c" },
        { name: "mailbox-triage", color: "#1d4ed8" }
      ],
      incidents: [
        buildIncidentPlan(addDays(now, -4), {
          name: "Finance inbox takeover and wire redirection",
          summary: "Compromised finance accounts were used to redirect vendor payment instructions.",
          severity: "high",
          status: "open",
          hostPrefix: "northwind-bec",
          ipBase: "10.45.7",
          domain: "vendor-msg",
          teamOwner: "Finance IT",
          mailbox: "payment-ops",
          hashPrefix: "ab830d71"
        }),
        buildIncidentPlan(addDays(now, -3), {
          name: "Executive impersonation wave",
          summary: "Follow-on spoofing campaign targeted payroll and procurement teams.",
          severity: "medium",
          status: "contained",
          hostPrefix: "northwind-exec",
          ipBase: "10.45.11",
          domain: "ceo-note",
          teamOwner: "Messaging",
          mailbox: "executive-office",
          hashPrefix: "812c10ef"
        })
      ]
    },
    {
      caseName: "Fabrikam Cloud Credential Misuse",
      clientName: "Fabrikam Retail",
      status: "open",
      summary: "Cloud control plane and SaaS abuse assessment focused on tokens, app registrations, and admin actions.",
      customTags: [
        { name: "cloud", color: "#0369a1" },
        { name: "identity", color: "#7c3aed" }
      ],
      incidents: [
        buildIncidentPlan(addDays(now, -3), {
          name: "Suspicious admin app registration activity",
          summary: "Unapproved application registrations and token misuse appeared in tenant logs.",
          severity: "critical",
          status: "open",
          hostPrefix: "fabrikam-cloud",
          ipBase: "10.60.3",
          domain: "token-sync",
          teamOwner: "Cloud Platform",
          mailbox: "tenant-admin",
          hashPrefix: "55de901c"
        }),
        buildIncidentPlan(addDays(now, -4), {
          name: "Developer SaaS OAuth scope drift",
          summary: "Excessive delegated permissions were granted during a shadow IT integration.",
          severity: "medium",
          status: "closed",
          hostPrefix: "fabrikam-oauth",
          ipBase: "10.60.9",
          domain: "oauth-helper",
          teamOwner: "Identity Engineering",
          mailbox: "saas-owner",
          hashPrefix: "f92ee761"
        })
      ]
    },
    {
      caseName: "Adventure Works Insider Data Access Review",
      clientName: "Adventure Works",
      status: "open",
      summary: "Insider-risk review centered on unusual repository access, exports, and policy exceptions.",
      customTags: [
        { name: "insider-risk", color: "#c2410c" },
        { name: "legal-hold", color: "#475569" }
      ],
      incidents: [
        buildIncidentPlan(addDays(now, -4), {
          name: "Unexpected engineering data export",
          summary: "Large exports from engineering systems occurred ahead of employee departure.",
          severity: "high",
          status: "open",
          hostPrefix: "adventure-export",
          ipBase: "10.88.4",
          domain: "sync-drive",
          teamOwner: "Engineering Security",
          mailbox: "repo-alerts",
          hashPrefix: "b712ef4c"
        }),
        buildIncidentPlan(addDays(now, -3), {
          name: "Privileged repository cloning spike",
          summary: "Repository cloning rates exceeded baseline for a small admin cohort.",
          severity: "medium",
          status: "contained",
          hostPrefix: "adventure-repo",
          ipBase: "10.88.7",
          domain: "repo-mirror",
          teamOwner: "Developer Experience",
          mailbox: "git-audit",
          hashPrefix: "c48a51bd"
        })
      ]
    },
    {
      caseName: "Tailspin Supply Chain Validation",
      clientName: "Tailspin Toys",
      status: "closed",
      summary: "Completed review of third-party software update concerns with residual monitoring artifacts retained for reference.",
      customTags: [
        { name: "supplier", color: "#15803d" },
        { name: "postmortem", color: "#92400e" }
      ],
      incidents: [
        buildIncidentPlan(addDays(now, -4), {
          name: "Software update trust review",
          summary: "Assessment of vendor update process after suspicious package telemetry.",
          severity: "medium",
          status: "closed",
          hostPrefix: "tailspin-update",
          ipBase: "10.12.5",
          domain: "package-ping",
          teamOwner: "Enterprise Apps",
          mailbox: "vendor-updates",
          hashPrefix: "e11db3a0"
        }),
        buildIncidentPlan(addDays(now, -2), {
          name: "Residual monitoring exception cleanup",
          summary: "Close-out work for exceptions created during the validation effort.",
          severity: "low",
          status: "closed",
          hostPrefix: "tailspin-cleanup",
          ipBase: "10.12.8",
          domain: "cleanup-note",
          teamOwner: "Security Operations",
          mailbox: "monitoring-change",
          hashPrefix: "a0fb33dc"
        })
      ]
    },
    {
      caseName: "Apex Banking Full Workflow Demo",
      clientName: "Apex Banking Group",
      status: "open",
      summary:
        "Purpose-built demo case for end-to-end product testing across scoping, relationships, search, graphs, tags, tasks, and notifications.",
      customTags: [
        { name: "identity-pivot", color: "#be123c" },
        { name: "initial-access", color: "#1d4ed8" },
        { name: "cloud-abuse", color: "#0f766e" },
        { name: "validation-ready", color: "#7c3aed" }
      ],
      incidents: [buildFullWorkflowIncident(addDays(now, -1))]
    }
  ];
}

export async function seedCase(
  pool: Database,
  users: Record<DemoUserKey, SeedUser>,
  plan: SeedCasePlan
) {
  const caseRecord = await createCase(pool, users.commander.auth, {
    caseName: plan.caseName,
    clientName: plan.clientName,
    status: plan.status,
    summary: plan.summary
  });

  await addCaseMember(pool, users.commander.auth, {
    caseId: caseRecord.id,
    userId: users.lead.auth.id,
    caseRole: users.lead.caseRole
  });

  await addCaseMember(pool, users.commander.auth, {
    caseId: caseRecord.id,
    userId: users.analyst.auth.id,
    caseRole: users.analyst.caseRole
  });

  const customTags = await Promise.all(
    plan.customTags.map((tag) =>
      createCustomTag(pool, users.commander.auth, {
        caseId: caseRecord.id,
        name: tag.name,
        color: tag.color
      })
    )
  );

  const attackTags = await listAttackTags(pool);
  const attackTagById = new Map(attackTags.map((tag) => [tag.attack_id, tag]));

  for (const incidentPlan of plan.incidents) {
    const incident = await createIncident(pool, users.commander.auth, {
      caseId: caseRecord.id,
      name: incidentPlan.name,
      summary: incidentPlan.summary,
      severity: incidentPlan.severity,
      status: incidentPlan.status
    });

    await addIncidentMember(pool, users.commander.auth, {
      incidentId: incident.id,
      userId: users.lead.auth.id,
      incidentRole: users.lead.incidentRole
    });

    await addIncidentMember(pool, users.commander.auth, {
      incidentId: incident.id,
      userId: users.analyst.auth.id,
      incidentRole: users.analyst.incidentRole
    });

    const systems: Awaited<ReturnType<typeof createSystem>>[] = [];
    for (const systemPlan of incidentPlan.systems) {
      systems.push(
        await createSystem(pool, users.commander.auth, {
          incidentId: incident.id,
          hostname: systemPlan.hostname,
          ipAddress: systemPlan.ipAddress,
          os: systemPlan.os,
          owner: systemPlan.owner,
          notes: systemPlan.notes
        })
      );
    }

    const accounts: Awaited<ReturnType<typeof createAccount>>[] = [];
    for (const accountPlan of incidentPlan.accounts) {
      accounts.push(
        await createAccount(pool, users.commander.auth, {
          incidentId: incident.id,
          username: accountPlan.username,
          domain: accountPlan.domain,
          status: accountPlan.status,
          owner: accountPlan.owner,
          notes: accountPlan.notes
        })
      );
    }

    const indicators: Awaited<ReturnType<typeof createIndicator>>[] = [];
    for (const indicatorPlan of incidentPlan.indicators) {
      indicators.push(
        await createIndicator(pool, users.commander.auth, {
          incidentId: incident.id,
          indicatorType: indicatorPlan.indicatorType,
          value: indicatorPlan.value,
          description: indicatorPlan.description,
          confidence: indicatorPlan.confidence,
          source: indicatorPlan.source
        })
      );
    }

    const timelineEvents: Awaited<ReturnType<typeof createTimelineEvent>>[] = [];
    for (const timelinePlan of incidentPlan.timelineEvents) {
      timelineEvents.push(
        await createTimelineEvent(pool, users[timelinePlan.owner].auth, {
          incidentId: incident.id,
          eventTime: timelinePlan.eventTime,
          title: timelinePlan.title,
          description: timelinePlan.description,
          source: timelinePlan.source,
          rawEvidenceRef: timelinePlan.rawEvidenceRef,
          systemId: timelinePlan.systemIndex === undefined ? undefined : systems[timelinePlan.systemIndex]?.id,
          accountId: timelinePlan.accountIndex === undefined ? undefined : accounts[timelinePlan.accountIndex]?.id,
          ownerUserId: users[timelinePlan.owner].auth.id
        })
      );

      const currentTimelineEvent = timelineEvents.at(-1);
      if (!currentTimelineEvent) {
        continue;
      }

      if (timelinePlan.attachAttack) {
        const attackTag = attackTagById.get(timelinePlan.attachAttack);
        if (attackTag) {
          await attachAttackTagToTimelineEvent(pool, users[timelinePlan.owner].auth, {
            incidentId: incident.id,
            timelineEventId: currentTimelineEvent.id,
            attackTagId: attackTag.id
          });
        }
      }

      if (timelinePlan.attachCustomTagIndex !== undefined) {
        await attachCustomTagToTimelineEvent(pool, users[timelinePlan.owner].auth, {
          incidentId: incident.id,
          timelineEventId: currentTimelineEvent.id,
          customTagId: customTags[timelinePlan.attachCustomTagIndex].id
        });
      }
    }

    const queries: Awaited<ReturnType<typeof createQuery>>[] = [];
    for (const queryPlan of incidentPlan.queries) {
      const query = await createQuery(pool, users[queryPlan.owner].auth, {
        incidentId: incident.id,
        name: queryPlan.name,
        language: queryPlan.language,
        description: queryPlan.description,
        queryBody: queryPlan.queryBody,
        ownerUserId: users[queryPlan.owner].auth.id
      });
      queries.push(query);

      if (queryPlan.attachAttack) {
        const attackTag = attackTagById.get(queryPlan.attachAttack);
        if (attackTag) {
          await attachAttackTagToQuery(pool, users[queryPlan.owner].auth, {
            incidentId: incident.id,
            queryId: query.id,
            attackTagId: attackTag.id
          });
        }
      }
    }

    const findings: Awaited<ReturnType<typeof createFinding>>[] = [];
    for (const findingPlan of incidentPlan.findings) {
      const finding = await createFinding(pool, users[findingPlan.owner].auth, {
        incidentId: incident.id,
        title: findingPlan.title,
        description: findingPlan.description,
        severity: findingPlan.severity,
        status: findingPlan.status,
        confidence: findingPlan.confidence,
        impact: findingPlan.impact,
        recommendation: findingPlan.recommendation,
        ownerUserId: users[findingPlan.owner].auth.id
      });
      findings.push(finding);

      if (findingPlan.attachAttack) {
        const attackTag = attackTagById.get(findingPlan.attachAttack);
        if (attackTag) {
          await attachAttackTagToFinding(pool, users[findingPlan.owner].auth, {
            incidentId: incident.id,
            findingId: finding.id,
            attackTagId: attackTag.id
          });
        }
      }

      if (findingPlan.attachCustomTagIndex !== undefined) {
        await attachCustomTagToFinding(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          customTagId: customTags[findingPlan.attachCustomTagIndex].id
        });
      }

      if (findingPlan.evidenceTimelineIndex !== undefined) {
        await createEvidenceLink(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          evidenceType: "timeline_event",
          evidenceId: timelineEvents[findingPlan.evidenceTimelineIndex].id
        });
      }

      if (findingPlan.evidenceSystemIndex !== undefined) {
        await createEvidenceLink(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          evidenceType: "system",
          evidenceId: systems[findingPlan.evidenceSystemIndex].id
        });
      }

      if (findingPlan.evidenceAccountIndex !== undefined) {
        await createEvidenceLink(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          evidenceType: "account",
          evidenceId: accounts[findingPlan.evidenceAccountIndex].id
        });
      }

      if (findingPlan.evidenceIndicatorIndex !== undefined) {
        await createEvidenceLink(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          evidenceType: "indicator",
          evidenceId: indicators[findingPlan.evidenceIndicatorIndex].id
        });
      }

      if (findingPlan.evidenceQueryIndex !== undefined) {
        await createEvidenceLink(pool, users[findingPlan.owner].auth, {
          incidentId: incident.id,
          findingId: finding.id,
          evidenceType: "query",
          evidenceId: queries[findingPlan.evidenceQueryIndex].id
        });
      }
    }

    if (timelineEvents[1] && !incidentPlan.timelineEvents[1]?.attachCustomTagIndex) {
      await attachCustomTagToTimelineEvent(pool, users.lead.auth, {
        incidentId: incident.id,
        timelineEventId: timelineEvents[1].id,
        customTagId: customTags[0].id
      });
    }

    const tasks: Awaited<ReturnType<typeof createTask>>[] = [];
    for (const taskPlan of incidentPlan.tasks) {
      const task = await createTask(pool, users[taskPlan.owner].auth, {
        incidentId: incident.id,
        title: taskPlan.title,
        description: taskPlan.description,
        status: taskPlan.status,
        priority: taskPlan.priority,
        assigneeUserId: users[taskPlan.assignee].auth.id,
        ownerUserId: users[taskPlan.owner].auth.id,
        dueAt: taskPlan.dueAt
      });
      tasks.push(task);

      if (taskPlan.findingIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "finding",
          entityId: findings[taskPlan.findingIndex].id
        });
      } else if (taskPlan.queryIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "query",
          entityId: queries[taskPlan.queryIndex].id
        });
      } else if (taskPlan.systemIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "system",
          entityId: systems[taskPlan.systemIndex].id
        });
      } else if (taskPlan.accountIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "account",
          entityId: accounts[taskPlan.accountIndex].id
        });
      } else if (taskPlan.indicatorIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "indicator",
          entityId: indicators[taskPlan.indicatorIndex].id
        });
      } else if (taskPlan.timelineIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "timeline_event",
          entityId: timelineEvents[taskPlan.timelineIndex].id
        });
      }
    }

    const resolveEntityReference = (entityType: NonNullable<SeedIncidentPlan["entityLinks"]>[number]["sourceType"], options: {
      index?: number;
      attack?: string;
      user?: "commander" | "lead" | "analyst";
      customTagIndex?: number;
    }) => {
      switch (entityType) {
        case "finding":
          return findings[options.index ?? -1]?.id;
        case "timeline_event":
          return timelineEvents[options.index ?? -1]?.id;
        case "task":
          return tasks[options.index ?? -1]?.id;
        case "system":
          return systems[options.index ?? -1]?.id;
        case "account":
          return accounts[options.index ?? -1]?.id;
        case "ioc":
          return indicators[options.index ?? -1]?.id;
        case "query":
          return queries[options.index ?? -1]?.id;
        case "user":
          return options.user ? users[options.user].auth.id : undefined;
        case "tag":
          return options.customTagIndex === undefined ? undefined : customTags[options.customTagIndex]?.id;
        case "mitre_technique":
        case "mitre_tactic":
          return options.attack ? attackTagById.get(options.attack)?.id : undefined;
        default:
          return undefined;
      }
    };

    for (const linkPlan of incidentPlan.entityLinks ?? []) {
      const sourceId = resolveEntityReference(linkPlan.sourceType, {
        index: linkPlan.sourceIndex,
        attack: linkPlan.sourceAttack,
        user: linkPlan.sourceUser,
        customTagIndex: linkPlan.sourceCustomTagIndex
      });
      const targetId = resolveEntityReference(linkPlan.targetType, {
        index: linkPlan.targetIndex,
        attack: linkPlan.targetAttack,
        user: linkPlan.targetUser,
        customTagIndex: linkPlan.targetCustomTagIndex
      });

      if (!sourceId || !targetId) {
        continue;
      }

      await createEntityLink(pool, users.lead.auth, {
        incidentId: incident.id,
        sourceType: linkPlan.sourceType,
        sourceId,
        targetType: linkPlan.targetType,
        targetId,
        linkType: linkPlan.linkType
      });
    }
  }

  return { incidentCount: plan.incidents.length };
}

async function findUserByEmail(pool: Database, email: string) {
  const result = await pool.query<{ id: string; username: string; email: string; display_name: string; global_role: string; status: string }>(
    `
      select id, username, email, display_name, global_role, status
      from users
      where email = $1
    `,
    [email]
  );

  return result.rows[0];
}

async function ensureDemoUsers(pool: Database) {
  const users = {} as Record<DemoUserKey, SeedUser>;
  let createdUsers = 0;
  let reusedUsers = 0;

  for (const key of Object.keys(demoUsers) as DemoUserKey[]) {
    const config = demoUsers[key];
    const existing = await findUserByEmail(pool, config.email);
    const row =
      existing ??
      (await createUser(pool, {
        email: config.email,
        displayName: config.displayName,
        globalRole: config.globalRole
      }));

    if (existing) {
      reusedUsers += 1;
    } else {
      createdUsers += 1;
    }

    users[key] = {
      auth: toUser(row),
      caseRole: config.caseRole,
      incidentRole: config.incidentRole
    };
  }

  return { users, createdUsers, reusedUsers };
}

async function listExistingCaseNames(pool: Database) {
  const result = await pool.query<{ case_name: string }>("select case_name from cases");
  return new Set(result.rows.map((row) => row.case_name));
}

export async function seedDemoDataset(
  pool: Database,
  options?: {
    anchorTime?: Date;
    skipExistingCases?: boolean;
  }
) {
  const anchorTime = options?.anchorTime ?? getDemoAnchorTime();
  const { users, createdUsers, reusedUsers } = await ensureDemoUsers(pool);
  const plans = buildSeedCases(anchorTime);
  const existingCaseNames = options?.skipExistingCases === false ? new Set<string>() : await listExistingCaseNames(pool);

  let createdCases = 0;
  let skippedCases = 0;
  let createdIncidents = 0;

  for (const plan of plans) {
    if (existingCaseNames.has(plan.caseName)) {
      skippedCases += 1;
      continue;
    }

    const result = await seedCase(pool, users, plan);
    createdCases += 1;
    createdIncidents += result.incidentCount;
  }

  return {
    anchorTime: anchorTime.toISOString(),
    createdUsers,
    reusedUsers,
    createdCases,
    skippedCases,
    createdIncidents,
    caseNames: plans.map((plan) => plan.caseName)
  };
}

async function startDemoServer() {
  const { newDb } = await import("pg-mem");
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  await runMigrations(pool);
  await seedDemoDataset(pool, {
    anchorTime: getDemoAnchorTime()
  });

  const app = createApp(pool);
  app.listen(env.PORT, () => {
    process.stdout.write(`Forenotes demo listening on http://127.0.0.1:${env.PORT}\n`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startDemoServer().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
}
