import type { Database } from "../db/types.js";
import { requirePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "./authService.js";

type CountRow = {
  value: string | null;
  count: string | number;
};

type TimestampedRow = {
  created_at?: string | null;
  updated_at?: string | null;
};

type CaseRow = TimestampedRow & {
  id: string;
  case_name: string;
  client_name: string | null;
  status: string;
};

type IncidentRow = TimestampedRow & {
  id: string;
  case_id: string;
  name: string;
  status: string;
  severity: string | null;
};

type FindingRow = TimestampedRow & {
  id: string;
  incident_id: string;
  title: string;
  status: string;
  severity: string | null;
};

type TaskRow = TimestampedRow & {
  id: string;
  incident_id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
};

type TimelineRow = TimestampedRow & {
  id: string;
  incident_id: string;
  title: string;
  event_time: string;
  source: string | null;
};

type NotificationRow = {
  id: string;
  event_type: string;
  title: string;
  unseen: boolean;
  created_at: string;
};

export async function getDashboardSummary(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "notification:read");

  const [cases, incidents, findings, tasks, timelineEvents, notifications] = await Promise.all([
    listVisibleCases(database, user.id),
    listVisibleIncidents(database, user.id),
    listVisibleFindings(database, user.id),
    listVisibleTasks(database, user.id),
    listVisibleTimelineEvents(database, user.id),
    listVisibleNotifications(database, user.id)
  ]);

  const now = Date.now();
  const dayMillis = 24 * 60 * 60 * 1000;

  const openCases = cases.filter((entry) => entry.status !== "closed").length;
  const openIncidents = incidents.filter((entry) => entry.status !== "closed").length;
  const criticalIncidents = incidents.filter((entry) => entry.status === "open" && entry.severity === "critical").length;
  const unresolvedFindings = findings.filter((entry) => !["resolved", "false_positive"].includes(entry.status)).length;
  const overdueTasks = tasks.filter((entry) => isOverdue(entry, now)).length;
  const dueSoonTasks = tasks.filter((entry) => isDueSoon(entry, now)).length;
  const staleIncidents = incidents.filter((entry) => isStale(entry.updated_at, now, 72)).length;
  const agingFindings = findings.filter((entry) => !["resolved", "false_positive"].includes(entry.status) && isStale(entry.created_at, now, 7 * 24)).length;
  const unreadNotifications = notifications.filter((entry) => entry.unseen).length;

  return {
    metrics: {
      totalCases: cases.length,
      openCases,
      totalIncidents: incidents.length,
      openIncidents,
      criticalIncidents,
      unresolvedFindings,
      totalTasks: tasks.length,
      overdueTasks,
      dueSoonTasks,
      unreadNotifications
    },
    sla: {
      overdueTasks,
      dueSoonTasks,
      staleIncidents,
      agingFindings,
      unreadNotifications
    },
    breakdowns: {
      caseStatus: toBreakdown(cases, "status"),
      incidentSeverity: toBreakdown(incidents, "severity", ["critical", "high", "medium", "low", "unknown"]),
      findingStatus: toBreakdown(findings, "status", ["draft", "confirmed", "resolved", "false_positive"]),
      taskStatus: toBreakdown(tasks, "status", ["todo", "in_progress", "blocked", "done"])
    },
    activity: buildActivitySeries({ findings, tasks, timelineEvents }),
    recentActivity: buildRecentActivity({ cases, incidents, findings, tasks, timelineEvents })
  };
}

async function listVisibleCases(database: Database, userId: string) {
  const result = await database.query<CaseRow>(
    `
      select c.id, c.case_name, c.client_name, c.status, c.created_at, c.updated_at
      from cases c
      inner join case_members cm on cm.case_id = c.id
      where cm.user_id = $1
      order by c.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleIncidents(database: Database, userId: string) {
  const result = await database.query<IncidentRow>(
    `
      select i.id, i.case_id, i.name, i.status, i.severity, i.created_at, i.updated_at
      from incidents i
      inner join incident_members im on im.incident_id = i.id
      where im.user_id = $1
      order by i.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleFindings(database: Database, userId: string) {
  const result = await database.query<FindingRow>(
    `
      select f.id, f.incident_id, f.title, f.status, f.severity, f.created_at, f.updated_at
      from findings f
      inner join incident_members im on im.incident_id = f.incident_id
      where im.user_id = $1
      order by f.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleTasks(database: Database, userId: string) {
  const result = await database.query<TaskRow>(
    `
      select t.id, t.incident_id, t.title, t.status, t.priority, t.due_at, t.created_at, t.updated_at
      from tasks t
      inner join incident_members im on im.incident_id = t.incident_id
      where im.user_id = $1
      order by t.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleTimelineEvents(database: Database, userId: string) {
  const result = await database.query<TimelineRow>(
    `
      select te.id, te.incident_id, te.title, te.event_time, te.source, te.created_at, te.updated_at
      from timeline_events te
      inner join incident_members im on im.incident_id = te.incident_id
      where im.user_id = $1
      order by te.event_time desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleNotifications(database: Database, userId: string) {
  const result = await database.query<NotificationRow>(
    `
      select id, event_type, title, unseen, created_at
      from notifications
      where recipient_user_id = $1
      order by created_at desc
    `,
    [userId]
  );
  return result.rows;
}

function toBreakdown<T extends Record<string, unknown>>(rows: T[], key: keyof T, preferredOrder: string[] = []) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? "unknown");
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  const preferred = preferredOrder
    .filter((value) => counts.has(value))
    .map((value) => ({ value, count: counts.get(value) || 0 }));
  const remainder = [...counts.entries()]
    .filter(([value]) => !preferredOrder.includes(value))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => ({ value, count }));

  return [...preferred, ...remainder];
}

function isOverdue(task: TaskRow, now: number) {
  if (!task.due_at || task.status === "done") {
    return false;
  }
  const dueTime = Date.parse(task.due_at);
  return !Number.isNaN(dueTime) && dueTime < now;
}

function isDueSoon(task: TaskRow, now: number) {
  if (!task.due_at || task.status === "done") {
    return false;
  }
  const dueTime = Date.parse(task.due_at);
  const horizon = now + (24 * 60 * 60 * 1000);
  return !Number.isNaN(dueTime) && dueTime >= now && dueTime <= horizon;
}

function isStale(value: string | null | undefined, now: number, hours: number) {
  if (!value) {
    return false;
  }
  const time = Date.parse(value);
  return !Number.isNaN(time) && (now - time) >= hours * 60 * 60 * 1000;
}

function buildActivitySeries(input: {
  findings: FindingRow[];
  tasks: TaskRow[];
  timelineEvents: TimelineRow[];
}) {
  const dayKeys = buildDayKeys(7);
  const buckets = new Map(dayKeys.map((day) => [day, { day, findings: 0, tasks: 0, timeline: 0 }]));

  for (const finding of input.findings) {
    incrementBucket(buckets, finding.created_at, "findings");
  }
  for (const task of input.tasks) {
    incrementBucket(buckets, task.created_at, "tasks");
  }
  for (const timelineEvent of input.timelineEvents) {
    incrementBucket(buckets, timelineEvent.created_at ?? timelineEvent.event_time, "timeline");
  }

  return dayKeys.map((day) => buckets.get(day));
}

function buildRecentActivity(input: {
  cases: CaseRow[];
  incidents: IncidentRow[];
  findings: FindingRow[];
  tasks: TaskRow[];
  timelineEvents: TimelineRow[];
}) {
  return [
    ...input.cases.map((entry) => ({
      id: entry.id,
      kind: "case",
      title: entry.case_name,
      detail: entry.client_name || entry.status,
      timestamp: entry.updated_at || entry.created_at || null
    })),
    ...input.incidents.map((entry) => ({
      id: entry.id,
      kind: "incident",
      title: entry.name,
      detail: [entry.severity, entry.status].filter(Boolean).join(" / "),
      timestamp: entry.updated_at || entry.created_at || null
    })),
    ...input.findings.map((entry) => ({
      id: entry.id,
      kind: "finding",
      title: entry.title,
      detail: [entry.severity, entry.status].filter(Boolean).join(" / "),
      timestamp: entry.updated_at || entry.created_at || null
    })),
    ...input.tasks.map((entry) => ({
      id: entry.id,
      kind: "task",
      title: entry.title,
      detail: [entry.priority, entry.status].filter(Boolean).join(" / "),
      timestamp: entry.updated_at || entry.created_at || null
    })),
    ...input.timelineEvents.map((entry) => ({
      id: entry.id,
      kind: "timeline",
      title: entry.title,
      detail: entry.source || "timeline event",
      timestamp: entry.event_time || entry.created_at || null
    }))
  ]
    .filter((entry) => entry.timestamp)
    .sort((left, right) => Date.parse(right.timestamp || "") - Date.parse(left.timestamp || ""))
    .slice(0, 8);
}

function buildDayKeys(days: number) {
  const result: string[] = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(current);
    day.setDate(current.getDate() - index);
    result.push(toDateKey(day));
  }
  return result;
}

function incrementBucket(
  buckets: Map<string, { day: string; findings: number; tasks: number; timeline: number }>,
  value: string | null | undefined,
  key: "findings" | "tasks" | "timeline"
) {
  if (!value) {
    return;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return;
  }
  const dayKey = toDateKey(parsed);
  const bucket = buckets.get(dayKey);
  if (bucket) {
    bucket[key] += 1;
  }
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
