import { newDb } from "pg-mem";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { runMigrations } from "./db/setup.js";
import { createUser } from "./services/userService.js";
import type { AuthenticatedUser } from "./services/authService.js";
import { createCase } from "./services/caseService.js";
import { createIncident } from "./services/incidentService.js";
import { addCaseMember, addIncidentMember } from "./services/membershipService.js";
import { createCustomTag, attachAttackTagToFinding, attachCustomTagToFinding, attachCustomTagToTimelineEvent, listAttackTags } from "./services/tagService.js";
import { createFinding } from "./services/findingService.js";
import { createTimelineEvent } from "./services/timelineEventService.js";
import { createIndicator } from "./services/indicatorService.js";
import { createSystem } from "./services/systemService.js";
import { createAccount } from "./services/accountService.js";
import { createTask, createTaskLink } from "./services/taskService.js";
import { createQuery } from "./services/queryService.js";
import { createEvidenceLink } from "./services/evidenceLinkService.js";
import type { Database } from "./db/types.js";

function toUser(row: Record<string, unknown>): AuthenticatedUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    globalRole: String(row.global_role),
    status: String(row.status)
  };
}

type SeedUser = {
  auth: AuthenticatedUser;
  caseRole: string;
  incidentRole: string;
};

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
    owner: "commander" | "lead" | "analyst";
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
  }>;
  queries: Array<{
    name: string;
    language: string;
    description: string;
    queryBody: string;
    owner: "lead" | "analyst";
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
    timelineIndex?: number;
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

function iso(date: Date) {
  return date.toISOString();
}

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function addDays(base: Date, days: number) {
  return addHours(base, days * 24);
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
        buildIncidentPlan(addDays(now, -5), {
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
        buildIncidentPlan(addDays(now, -4), {
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
        buildIncidentPlan(addDays(now, -6), {
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
        buildIncidentPlan(addDays(now, -7), {
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
        buildIncidentPlan(addDays(now, -8), {
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
        buildIncidentPlan(addDays(now, -12), {
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
        buildIncidentPlan(addDays(now, -10), {
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
    }
  ];
}

async function seedCase(
  pool: Database,
  users: Record<"commander" | "lead" | "analyst", SeedUser>,
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

    const systems = [];
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

    for (const accountPlan of incidentPlan.accounts) {
      await createAccount(pool, users.commander.auth, {
        incidentId: incident.id,
        username: accountPlan.username,
        domain: accountPlan.domain,
        status: accountPlan.status,
        owner: accountPlan.owner,
        notes: accountPlan.notes
      });
    }

    for (const indicatorPlan of incidentPlan.indicators) {
      await createIndicator(pool, users.commander.auth, {
        incidentId: incident.id,
        indicatorType: indicatorPlan.indicatorType,
        value: indicatorPlan.value,
        description: indicatorPlan.description,
        confidence: indicatorPlan.confidence,
        source: indicatorPlan.source
      });
    }

    const timelineEvents = [];
    for (const timelinePlan of incidentPlan.timelineEvents) {
      timelineEvents.push(
        await createTimelineEvent(pool, users[timelinePlan.owner].auth, {
          incidentId: incident.id,
          eventTime: timelinePlan.eventTime,
          title: timelinePlan.title,
          description: timelinePlan.description,
          source: timelinePlan.source,
          rawEvidenceRef: timelinePlan.rawEvidenceRef,
          ownerUserId: users[timelinePlan.owner].auth.id
        })
      );
    }

    const findings = [];
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
    }

    if (timelineEvents[1]) {
      await attachCustomTagToTimelineEvent(pool, users.lead.auth, {
        incidentId: incident.id,
        timelineEventId: timelineEvents[1].id,
        customTagId: customTags[0].id
      });
    }

    const queries = [];
    for (const queryPlan of incidentPlan.queries) {
      queries.push(
        await createQuery(pool, users[queryPlan.owner].auth, {
          incidentId: incident.id,
          name: queryPlan.name,
          language: queryPlan.language,
          description: queryPlan.description,
          queryBody: queryPlan.queryBody,
          ownerUserId: users[queryPlan.owner].auth.id
        })
      );
    }

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
      } else if (taskPlan.timelineIndex !== undefined) {
        await createTaskLink(pool, users.lead.auth, {
          incidentId: incident.id,
          taskId: task.id,
          entityType: "timeline_event",
          entityId: timelineEvents[taskPlan.timelineIndex].id
        });
      }
    }
  }
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

  const users: Record<"commander" | "lead" | "analyst", SeedUser> = {
    commander: {
      auth: toUser(commanderRow),
      caseRole: "incident_commander",
      incidentRole: "incident_commander"
    },
    lead: {
      auth: toUser(leadRow),
      caseRole: "response_lead",
      incidentRole: "investigation_lead"
    },
    analyst: {
      auth: toUser(analystRow),
      caseRole: "analyst",
      incidentRole: "triage_analyst"
    }
  };

  for (const plan of buildSeedCases(new Date("2026-05-18T09:00:00.000Z"))) {
    await seedCase(pool, users, plan);
  }

  const app = createApp(pool);
  app.listen(env.PORT, () => {
    process.stdout.write(`Forenotes demo listening on http://127.0.0.1:${env.PORT}\n`);
  });
}

startDemoServer().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
