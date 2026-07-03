import type {
  DashboardActivity,
  DashboardActivityResponse,
  DashboardBreakdown,
  DashboardCaseHealth,
  DashboardCasesResponse,
  DashboardCharts,
  DashboardFindingItem,
  DashboardIncidentHealth,
  DashboardRecentActivity,
  DashboardResponse,
  DashboardSla,
  DashboardSlaResponse,
  DashboardSummary,
  DashboardTaskItem,
  DashboardUnread,
  DashboardUnreadUpdate,
  DashboardWorkloadItem,
  DashboardWorkloadResponse
} from "../../shared/graph-types.js";
import type { Database } from "../db/types.js";
import { requirePermission } from "../permissions/permissionService.js";
import type { AuthenticatedUser } from "./authService.js";

const DAY_MILLIS = 24 * 60 * 60 * 1000;
const DUE_SOON_HORIZON_MILLIS = 72 * 60 * 60 * 1000;

type DbTimestamp = Date | string | null | undefined;

type TimestampedRow = {
  created_at?: DbTimestamp;
  updated_at?: DbTimestamp;
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
  case_id: string;
  incident_id: string;
  case_name: string;
  incident_name: string;
  title: string;
  status: string;
  severity: string | null;
};

type TimelineRow = TimestampedRow & {
  id: string;
  case_id: string;
  incident_id: string;
  title: string;
  event_time: DbTimestamp;
  source: string | null;
};

type TaskRow = TimestampedRow & {
  id: string;
  case_id: string;
  case_name: string;
  incident_id: string;
  incident_name: string;
  title: string;
  status: string;
  priority: string;
  due_at: DbTimestamp;
  assignee_user_id: string | null;
  assignee_name: string | null;
  owner_user_id: string | null;
  created_by_user_id: string;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_title: string | null;
};

type NotificationRow = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  unseen: boolean;
  created_at: DbTimestamp;
};

type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  summary: string | null;
  created_at: DbTimestamp;
  actor_id: string | null;
  actor_name: string | null;
  case_id: string | null;
  case_name: string | null;
  incident_id: string | null;
  incident_name: string | null;
};

type DashboardScope = "team" | "self";

interface DashboardDataset {
  scope: DashboardScope;
  cases: CaseRow[];
  incidents: IncidentRow[];
  findings: FindingRow[];
  tasks: DashboardTaskItem[];
  timelineEvents: TimelineRow[];
  notifications: NotificationRow[];
  recentActivity: DashboardRecentActivity[];
}

export async function getDashboard(database: Database, user: AuthenticatedUser): Promise<DashboardResponse> {
  const [summary, charts, sla, activity, workload, cases] = await Promise.all([
    getDashboardSummary(database, user),
    getDashboardCharts(database, user),
    getDashboardSla(database, user),
    getDashboardActivity(database, user),
    getDashboardWorkload(database, user),
    getDashboardCases(database, user)
  ]);

  return { summary, charts, sla, activity, workload, cases };
}

export async function getDashboardSummary(database: Database, user: AuthenticatedUser): Promise<DashboardSummary> {
  const dataset = await loadDashboardDataset(database, user);
  const now = Date.now();

  const openCases = dataset.cases.filter((entry) => entry.status !== "closed").length;
  const openIncidents = dataset.incidents.filter((entry) => entry.status !== "closed").length;
  const unresolvedFindings = dataset.findings.filter((entry) => isOpenFinding(entry)).length;
  const openTasks = dataset.tasks.filter((entry) => entry.status !== "done").length;
  const sla = buildSlaSummary(dataset, now);
  const unread = buildUnreadSummary(dataset.notifications);

  return {
    scope: dataset.scope,
    metrics: {
      totalCases: dataset.cases.length,
      openCases,
      totalIncidents: dataset.incidents.length,
      openIncidents,
      criticalIncidents: dataset.incidents.filter((entry) => entry.status === "open" && entry.severity === "critical").length,
      unresolvedFindings,
      totalTasks: dataset.tasks.length,
      openTasks,
      overdueTasks: sla.overdueTasks,
      dueSoonTasks: sla.dueSoonTasks,
      unreadNotifications: unread.total
    },
    sla,
    unread,
    activeCases: openCases,
    activeIncidents: openIncidents,
    openTasks,
    openFindings: unresolvedFindings,
    breakdowns: {
      caseStatus: toBreakdown(dataset.cases, "status"),
      incidentSeverity: toBreakdown(dataset.incidents, "severity", ["critical", "high", "medium", "low", "unknown"]),
      findingStatus: toBreakdown(dataset.findings, "status", ["draft", "confirmed", "resolved", "false_positive"]),
      taskStatus: toBreakdown(dataset.tasks, "status", ["todo", "in_progress", "blocked", "done"])
    },
    activity: buildActivitySeries(dataset),
    recentActivity: dataset.recentActivity.slice(0, 8),
    highPriorityTasks: dataset.tasks
      .filter((task) => task.status !== "done" && ["critical", "high"].includes(task.priority))
      .sort(compareTasksByDue)
      .slice(0, 5),
    recentFindings: dataset.findings
      .filter((finding) => isOpenFinding(finding))
      .sort((left, right) => millis(right.updated_at ?? right.created_at) - millis(left.updated_at ?? left.created_at))
      .slice(0, 5)
      .map(mapFindingItem),
    activeIncidentSnapshot: buildIncidentHealth(dataset, now).slice(0, 5),
    unreadUpdates: dataset.notifications.filter((notification) => notification.unseen).slice(0, 5).map(mapUnreadUpdate)
  };
}

export async function getDashboardCharts(database: Database, user: AuthenticatedUser): Promise<DashboardCharts> {
  const dataset = await loadDashboardDataset(database, user);
  const now = Date.now();
  const sla = buildSlaSummary(dataset, now);
  const workload = await getDashboardWorkload(database, user);
  const cases = buildCaseHealth(dataset, now);
  const incidents = buildIncidentHealth(dataset, now);
  const unread = buildUnreadSummary(dataset.notifications);

  return {
    taskStatusDistribution: toBreakdown(dataset.tasks, "status", ["todo", "in_progress", "blocked", "done"]).map(toLabeledValue),
    slaRiskBreakdown: [
      { label: "Overdue", value: sla.overdueTasks },
      { label: "Due Soon", value: sla.dueSoonTasks },
      { label: "Blocked", value: sla.blockedTasks },
      { label: "Healthy", value: Math.max(dataset.tasks.filter((task) => task.status !== "done").length - sla.overdueTasks - sla.dueSoonTasks - sla.blockedTasks, 0) }
    ],
    workloadByAssignee: workload.workload.map((row) => ({
      assignee: row.assignee.name,
      openTasks: row.taskCount,
      overdue: row.overdueCount,
      dueSoon: row.dueSoonCount
    })),
    activityTrend: buildActivitySeries(dataset).map((row) => ({
      label: row.day,
      value: row.findings + row.tasks + row.timeline
    })),
    unreadBreakdown: [
      { label: "Mentions", value: unread.mentions },
      { label: "Case updates", value: unread.caseUpdates },
      { label: "Task updates", value: unread.taskUpdates }
    ],
    caseIncidentHealth: [
      { label: "Active cases", value: cases.filter((entry) => entry.status !== "closed").length },
      { label: "Active incidents", value: incidents.filter((entry) => entry.status !== "closed").length },
      { label: "Open findings", value: dataset.findings.filter((entry) => isOpenFinding(entry)).length },
      { label: "Open tasks", value: dataset.tasks.filter((entry) => entry.status !== "done").length },
      { label: "SLA risk", value: cases.reduce((total, entry) => total + entry.slaRiskCount, 0) }
    ]
  };
}

export async function getDashboardSla(database: Database, user: AuthenticatedUser): Promise<DashboardSlaResponse> {
  const dataset = await loadDashboardDataset(database, user);
  const now = Date.now();
  const overdueTasks = dataset.tasks.filter((task) => isOverdueTask(task, now)).sort(compareTasksByDue);
  const dueSoonTasks = dataset.tasks.filter((task) => isDueSoonTask(task, now)).sort(compareTasksByDue);
  const drilldownIds = new Set([...overdueTasks, ...dueSoonTasks].map((task) => task.id));
  const attentionItems = dataset.tasks
    .filter((task) => task.status !== "done" && !drilldownIds.has(task.id) && (task.status === "blocked" || ["critical", "high"].includes(task.priority)))
    .sort(compareTasksByDue);

  return {
    summary: buildSlaSummary(dataset, now),
    overdueTasks,
    dueSoonTasks,
    attentionItems
  };
}

export async function getDashboardActivity(database: Database, user: AuthenticatedUser): Promise<DashboardActivityResponse> {
  await requireDashboardRead(database, user);
  return {
    activity: await listRecentActivity(database, user, 80)
  };
}

export async function getDashboardWorkload(database: Database, user: AuthenticatedUser): Promise<DashboardWorkloadResponse> {
  const dataset = await loadDashboardDataset(database, user);
  const now = Date.now();

  if (dataset.scope === "self") {
    return {
      scope: dataset.scope,
      workload: [
        {
          assignee: { id: user.id, name: user.displayName },
          ...countWorkload(dataset.tasks, now)
        }
      ]
    };
  }

  const rows = new Map<string, { assignee: DashboardWorkloadItem["assignee"]; tasks: DashboardTaskItem[] }>();
  for (const task of dataset.tasks) {
    const assignee = task.assignee ?? { id: "unassigned", name: "Unassigned" };
    const entry = rows.get(assignee.id) ?? { assignee, tasks: [] };
    entry.tasks.push(task);
    rows.set(assignee.id, entry);
  }

  return {
    scope: dataset.scope,
    workload: [...rows.values()]
      .map((entry) => ({
        assignee: entry.assignee,
        ...countWorkload(entry.tasks, now)
      }))
      .sort((left, right) => right.taskCount - left.taskCount || left.assignee.name.localeCompare(right.assignee.name))
  };
}

export async function getDashboardCases(database: Database, user: AuthenticatedUser): Promise<DashboardCasesResponse> {
  const dataset = await loadDashboardDataset(database, user);
  const now = Date.now();
  return {
    cases: buildCaseHealth(dataset, now),
    incidents: buildIncidentHealth(dataset, now)
  };
}

async function loadDashboardDataset(database: Database, user: AuthenticatedUser): Promise<DashboardDataset> {
  await requireDashboardRead(database, user);

  const [cases, incidents, findings, tasks, timelineEvents, notifications, recentActivity] = await Promise.all([
    listVisibleCases(database, user.id),
    listVisibleIncidents(database, user.id),
    listVisibleFindings(database, user.id),
    listVisibleTasks(database, user),
    listVisibleTimelineEvents(database, user.id),
    listVisibleNotifications(database, user.id),
    listRecentActivity(database, user, 20)
  ]);

  return {
    scope: getDashboardScope(user),
    cases,
    incidents,
    findings,
    tasks,
    timelineEvents,
    notifications,
    recentActivity
  };
}

async function requireDashboardRead(database: Database, user: AuthenticatedUser) {
  await requirePermission(database, user, "notification:read");
}

function getDashboardScope(user: AuthenticatedUser): DashboardScope {
  return user.globalRole === "admin" || user.globalRole === "commander" ? "team" : "self";
}

function taskVisibilityClause(user: AuthenticatedUser, alias = "t") {
  if (getDashboardScope(user) === "team") {
    return "";
  }

  return `and (${alias}.assignee_user_id = $1 or ${alias}.owner_user_id = $1 or ${alias}.created_by_user_id = $1)`;
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
      inner join case_members cm on cm.case_id = i.case_id
      where cm.user_id = $1
      order by i.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleFindings(database: Database, userId: string) {
  const result = await database.query<FindingRow>(
    `
      select
        f.id,
        i.case_id,
        f.incident_id,
        c.case_name,
        i.name as incident_name,
        f.title,
        f.status,
        f.severity,
        f.created_at,
        f.updated_at
      from findings f
      inner join incidents i on i.id = f.incident_id
      inner join cases c on c.id = i.case_id
      inner join case_members cm on cm.case_id = i.case_id
      where cm.user_id = $1
      order by f.updated_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleTasks(database: Database, user: AuthenticatedUser) {
  const result = await database.query<TaskRow>(
    `
      select
        t.id,
        i.case_id,
        c.case_name,
        t.incident_id,
        i.name as incident_name,
        t.title,
        t.status,
        t.priority,
        t.due_at,
        t.assignee_user_id,
        assignee.display_name as assignee_name,
        t.owner_user_id,
        t.created_by_user_id,
        t.created_at,
        t.updated_at,
        tl.entity_type as linked_entity_type,
        tl.entity_id::text as linked_entity_id,
        coalesce(
          linked_finding.title,
          linked_timeline.title,
          linked_system.hostname,
          linked_account.username,
          linked_indicator.value,
          linked_query.name
        ) as linked_entity_title
      from tasks t
      inner join incidents i on i.id = t.incident_id
      inner join cases c on c.id = i.case_id
      inner join case_members cm on cm.case_id = i.case_id
      left join users assignee on assignee.id = t.assignee_user_id
      left join task_links tl on tl.task_id = t.id
      left join findings linked_finding on tl.entity_type = 'finding' and linked_finding.id = tl.entity_id
      left join timeline_events linked_timeline on tl.entity_type = 'timeline_event' and linked_timeline.id = tl.entity_id
      left join systems linked_system on tl.entity_type = 'system' and linked_system.id = tl.entity_id
      left join accounts linked_account on tl.entity_type = 'account' and linked_account.id = tl.entity_id
      left join indicators linked_indicator on tl.entity_type = 'indicator' and linked_indicator.id = tl.entity_id
      left join queries linked_query on tl.entity_type = 'query' and linked_query.id = tl.entity_id
      where cm.user_id = $1
        ${taskVisibilityClause(user)}
      order by t.updated_at desc
    `,
    [user.id]
  );
  return mapTaskRows(result.rows);
}

async function listVisibleTimelineEvents(database: Database, userId: string) {
  const result = await database.query<TimelineRow>(
    `
      select te.id, i.case_id, te.incident_id, te.title, te.event_time, te.source, te.created_at, te.updated_at
      from timeline_events te
      inner join incidents i on i.id = te.incident_id
      inner join case_members cm on cm.case_id = i.case_id
      where cm.user_id = $1
      order by te.event_time desc
    `,
    [userId]
  );
  return result.rows;
}

async function listVisibleNotifications(database: Database, userId: string) {
  const result = await database.query<NotificationRow>(
    `
      select
        n.id,
        n.event_type,
        n.title,
        case
          when n.event_type = 'case.member_added' and direct_case.case_name is not null
            then 'You were added to Case: ' || direct_case.case_name
          when n.event_type = 'incident.member_added' and c.case_name is not null and i.name is not null
            then 'You were added to Case: ' || c.case_name || '; Incident: ' || i.name
          else n.body
        end as body,
        n.entity_type,
        n.entity_id::text,
        n.unseen,
        n.created_at
      from notifications n
      left join incidents i
        on i.id = n.incident_id
        or (n.incident_id is null and n.entity_type = 'incident' and i.id = n.entity_id)
      left join cases c on c.id = i.case_id
      left join cases direct_case on n.entity_type = 'case' and direct_case.id = n.entity_id
      where n.recipient_user_id = $1
      order by n.created_at desc
    `,
    [userId]
  );
  return result.rows;
}

async function listRecentActivity(database: Database, user: AuthenticatedUser, limit: number) {
  const result = await database.query<ActivityRow>(
    `
      with decorated as (
        select
          al.id,
          al.action,
          al.entity_type,
          al.entity_id::text as entity_id,
          al.created_at,
          actor.id::text as actor_id,
          actor.display_name as actor_name,
          coalesce(task_entity.title, finding_entity.title, timeline_entity.title, incident_entity.name, case_entity.case_name, query_entity.name, system_entity.hostname, account_entity.username, indicator_entity.value, al.entity_type) as entity_title,
          null as summary,
          coalesce(al.case_id, al_incident.case_id, task_incident.case_id, finding_incident.case_id, timeline_incident.case_id, incident_entity.case_id, case_entity.id, query_incident.case_id, system_incident.case_id, account_incident.case_id, indicator_incident.case_id) as scope_case_id,
          coalesce(al.incident_id, task_entity.incident_id, finding_entity.incident_id, timeline_entity.incident_id, incident_entity.id, query_entity.incident_id, system_entity.incident_id, account_entity.incident_id, indicator_entity.incident_id) as scope_incident_id,
          task_entity.assignee_user_id as task_assignee_user_id,
          task_entity.owner_user_id as task_owner_user_id,
          task_entity.created_by_user_id as task_created_by_user_id
        from audit_logs al
        left join users actor on actor.id = al.actor_user_id
        left join incidents al_incident on al_incident.id = al.incident_id
        left join tasks task_entity on al.entity_type = 'task' and task_entity.id = al.entity_id
        left join incidents task_incident on task_incident.id = task_entity.incident_id
        left join findings finding_entity on al.entity_type = 'finding' and finding_entity.id = al.entity_id
        left join incidents finding_incident on finding_incident.id = finding_entity.incident_id
        left join timeline_events timeline_entity on al.entity_type = 'timeline_event' and timeline_entity.id = al.entity_id
        left join incidents timeline_incident on timeline_incident.id = timeline_entity.incident_id
        left join incidents incident_entity on al.entity_type = 'incident' and incident_entity.id = al.entity_id
        left join cases case_entity on al.entity_type = 'case' and case_entity.id = al.entity_id
        left join queries query_entity on al.entity_type = 'query' and query_entity.id = al.entity_id
        left join incidents query_incident on query_incident.id = query_entity.incident_id
        left join systems system_entity on al.entity_type = 'system' and system_entity.id = al.entity_id
        left join incidents system_incident on system_incident.id = system_entity.incident_id
        left join accounts account_entity on al.entity_type = 'account' and account_entity.id = al.entity_id
        left join incidents account_incident on account_incident.id = account_entity.incident_id
        left join indicators indicator_entity on al.entity_type = 'indicator' and indicator_entity.id = al.entity_id
        left join incidents indicator_incident on indicator_incident.id = indicator_entity.incident_id
      )
      select
        d.id,
        d.action,
        d.entity_type,
        d.entity_id,
        d.entity_title,
        d.summary,
        d.created_at,
        d.actor_id,
        d.actor_name,
        c.id::text as case_id,
        c.case_name,
        i.id::text as incident_id,
        i.name as incident_name
      from decorated d
      inner join case_members cm on cm.case_id = d.scope_case_id
      inner join cases c on c.id = d.scope_case_id
      left join incidents i on i.id = d.scope_incident_id
      where cm.user_id = $1
        and d.scope_case_id is not null
        ${getDashboardScope(user) === "team" ? "" : "and (d.entity_type <> 'task' or d.task_assignee_user_id = $1 or d.task_owner_user_id = $1 or d.task_created_by_user_id = $1)"}
      order by d.created_at desc
      limit $2
    `,
    [user.id, limit]
  );

  return result.rows.map(mapActivity);
}

function mapTaskRows(rows: TaskRow[]): DashboardTaskItem[] {
  const tasks = new Map<string, DashboardTaskItem>();

  for (const row of rows) {
    const existing = tasks.get(row.id);
    if (existing) {
      if (!existing.linkedEntity && row.linked_entity_type && row.linked_entity_id) {
        existing.linkedEntity = mapLinkedEntity(row);
      }
      continue;
    }

    tasks.set(row.id, {
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      dueAt: toIso(row.due_at),
      updatedAt: toIso(row.updated_at),
      assignee: row.assignee_user_id ? { id: row.assignee_user_id, name: row.assignee_name ?? "Unassigned" } : null,
      case: { id: row.case_id, name: row.case_name },
      incident: { id: row.incident_id, name: row.incident_name },
      linkedEntity: mapLinkedEntity(row)
    });
  }

  return [...tasks.values()];
}

function mapLinkedEntity(row: TaskRow) {
  if (!row.linked_entity_type || !row.linked_entity_id) {
    return undefined;
  }

  return {
    type: row.linked_entity_type,
    id: row.linked_entity_id,
    name: row.linked_entity_title ?? row.linked_entity_type
  };
}

function mapFindingItem(row: FindingRow): DashboardFindingItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    severity: row.severity,
    updatedAt: toIso(row.updated_at ?? row.created_at),
    case: { id: row.case_id, name: row.case_name },
    incident: { id: row.incident_id, name: row.incident_name }
  };
}

function mapActivity(row: ActivityRow): DashboardRecentActivity {
  return {
    id: row.id,
    actor: row.actor_id ? { id: row.actor_id, name: row.actor_name ?? "Unknown user" } : null,
    action: toActionVerb(row.action),
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityTitle: row.entity_title ?? row.entity_type,
    case: row.case_id && row.case_name ? { id: row.case_id, name: row.case_name } : null,
    incident: row.incident_id && row.incident_name ? { id: row.incident_id, name: row.incident_name } : null,
    summary: row.summary,
    timestamp: toIso(row.created_at)
  };
}

function mapUnreadUpdate(row: NotificationRow): DashboardUnreadUpdate {
  return {
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    body: row.body,
    timestamp: toIso(row.created_at)
  };
}

function buildSlaSummary(dataset: DashboardDataset, now: number): DashboardSla {
  const overdueTasks = dataset.tasks.filter((task) => isOverdueTask(task, now)).length;
  const dueSoonTasks = dataset.tasks.filter((task) => isDueSoonTask(task, now)).length;
  const next24h = dataset.tasks.filter((task) => isDueSoonTask(task, now, 24 * 60 * 60 * 1000)).length;
  const next72h = Math.max(dueSoonTasks - next24h, 0);
  const blockedTasks = dataset.tasks.filter((task) => task.status === "blocked").length;
  const staleIncidents = dataset.incidents.filter((entry) => isStale(entry.updated_at, now, 72)).length;
  const agingFindings = dataset.findings.filter((entry) => isOpenFinding(entry) && isStale(entry.created_at, now, 7 * 24)).length;
  const unreadNotifications = dataset.notifications.filter((entry) => entry.unseen).length;

  return {
    attention: overdueTasks + dueSoonTasks + blockedTasks + staleIncidents + agingFindings,
    overdueTasks,
    dueSoonTasks,
    next24h,
    next72h,
    blockedTasks,
    staleIncidents,
    agingFindings,
    unreadNotifications
  };
}

function buildUnreadSummary(rows: NotificationRow[]): DashboardUnread {
  const unread = rows.filter((row) => row.unseen);
  const mentions = unread.filter((row) => row.event_type.includes("mention")).length;
  const taskUpdates = unread.filter((row) => row.entity_type === "task" || row.event_type.startsWith("task.")).length;
  return {
    total: unread.length,
    mentions,
    taskUpdates,
    caseUpdates: Math.max(unread.length - mentions - taskUpdates, 0)
  };
}

function buildActivitySeries(dataset: DashboardDataset): DashboardActivity[] {
  const dayKeys = buildDayKeys(7);
  const buckets = new Map(dayKeys.map((day) => [day, { day, findings: 0, tasks: 0, timeline: 0 }]));

  for (const finding of dataset.findings) {
    incrementBucket(buckets, finding.created_at, "findings");
  }
  for (const task of dataset.tasks) {
    incrementBucket(buckets, task.updatedAt, "tasks");
  }
  for (const timelineEvent of dataset.timelineEvents) {
    incrementBucket(buckets, timelineEvent.created_at ?? timelineEvent.event_time, "timeline");
  }

  return dayKeys.map((day) => buckets.get(day) ?? { day, findings: 0, tasks: 0, timeline: 0 });
}

function buildCaseHealth(dataset: DashboardDataset, now: number): DashboardCaseHealth[] {
  const byCase = new Map<string, DashboardCaseHealth>();
  for (const row of dataset.cases) {
    byCase.set(row.id, {
      id: row.id,
      name: row.case_name,
      status: row.status,
      activeIncidents: 0,
      openFindings: 0,
      openTasks: 0,
      lastActivityAt: latestIso(row.updated_at, row.created_at),
      slaRiskCount: 0
    });
  }

  for (const incident of dataset.incidents) {
    const entry = byCase.get(incident.case_id);
    if (!entry) continue;
    if (incident.status !== "closed") entry.activeIncidents += 1;
    entry.lastActivityAt = latestIso(entry.lastActivityAt, incident.updated_at, incident.created_at);
    if (isStale(incident.updated_at, now, 72)) entry.slaRiskCount += 1;
  }

  for (const finding of dataset.findings) {
    const entry = byCase.get(finding.case_id);
    if (!entry) continue;
    if (isOpenFinding(finding)) entry.openFindings += 1;
    entry.lastActivityAt = latestIso(entry.lastActivityAt, finding.updated_at, finding.created_at);
    if (isOpenFinding(finding) && isStale(finding.created_at, now, 7 * 24)) entry.slaRiskCount += 1;
  }

  for (const task of dataset.tasks) {
    const entry = byCase.get(task.case.id);
    if (!entry) continue;
    if (task.status !== "done") entry.openTasks += 1;
    entry.lastActivityAt = latestIso(entry.lastActivityAt, task.updatedAt);
    if (task.status !== "done" && (isOverdueTask(task, now) || isDueSoonTask(task, now) || task.status === "blocked")) {
      entry.slaRiskCount += 1;
    }
  }

  return [...byCase.values()].sort((left, right) => right.slaRiskCount - left.slaRiskCount || millis(right.lastActivityAt) - millis(left.lastActivityAt));
}

function buildIncidentHealth(dataset: DashboardDataset, now: number): DashboardIncidentHealth[] {
  const caseNames = new Map(dataset.cases.map((entry) => [entry.id, entry.case_name]));
  const byIncident = new Map<string, DashboardIncidentHealth>();

  for (const row of dataset.incidents) {
    byIncident.set(row.id, {
      id: row.id,
      name: row.name,
      status: row.status,
      severity: row.severity,
      case: { id: row.case_id, name: caseNames.get(row.case_id) ?? "Unknown case" },
      openFindings: 0,
      openTasks: 0,
      lastActivityAt: latestIso(row.updated_at, row.created_at),
      slaRiskCount: isStale(row.updated_at, now, 72) ? 1 : 0
    });
  }

  for (const finding of dataset.findings) {
    const entry = byIncident.get(finding.incident_id);
    if (!entry) continue;
    if (isOpenFinding(finding)) entry.openFindings += 1;
    entry.lastActivityAt = latestIso(entry.lastActivityAt, finding.updated_at, finding.created_at);
    if (isOpenFinding(finding) && isStale(finding.created_at, now, 7 * 24)) entry.slaRiskCount += 1;
  }

  for (const task of dataset.tasks) {
    const entry = byIncident.get(task.incident.id);
    if (!entry) continue;
    if (task.status !== "done") entry.openTasks += 1;
    entry.lastActivityAt = latestIso(entry.lastActivityAt, task.updatedAt);
    if (task.status !== "done" && (isOverdueTask(task, now) || isDueSoonTask(task, now) || task.status === "blocked")) {
      entry.slaRiskCount += 1;
    }
  }

  return [...byIncident.values()].sort((left, right) => right.slaRiskCount - left.slaRiskCount || millis(right.lastActivityAt) - millis(left.lastActivityAt));
}

function countWorkload(tasks: DashboardTaskItem[], now: number) {
  return {
    taskCount: tasks.filter((task) => task.status !== "done").length,
    overdueCount: tasks.filter((task) => isOverdueTask(task, now)).length,
    dueSoonCount: tasks.filter((task) => isDueSoonTask(task, now)).length,
    completedCount: tasks.filter((task) => task.status === "done").length
  };
}

function toBreakdown<T extends object>(rows: T[], key: keyof T, preferredOrder: string[] = []): DashboardBreakdown[] {
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

function toLabeledValue(item: DashboardBreakdown) {
  return {
    label: item.value.replace(/_/g, " "),
    value: item.count
  };
}

function isOpenFinding(finding: Pick<FindingRow, "status">) {
  return !["resolved", "false_positive"].includes(finding.status);
}

function isOverdueTask(task: Pick<DashboardTaskItem, "dueAt" | "status">, now: number) {
  if (!task.dueAt || task.status === "done") {
    return false;
  }
  const dueTime = millis(task.dueAt);
  return dueTime > 0 && dueTime < now;
}

function isDueSoonTask(task: Pick<DashboardTaskItem, "dueAt" | "status">, now: number, horizon = DUE_SOON_HORIZON_MILLIS) {
  if (!task.dueAt || task.status === "done") {
    return false;
  }
  const dueTime = millis(task.dueAt);
  return dueTime >= now && dueTime <= now + horizon;
}

function isStale(value: DbTimestamp, now: number, hours: number) {
  const time = millis(value);
  return time > 0 && now - time >= hours * 60 * 60 * 1000;
}

function compareTasksByDue(left: DashboardTaskItem, right: DashboardTaskItem) {
  const leftDue = millis(left.dueAt) || Number.MAX_SAFE_INTEGER;
  const rightDue = millis(right.dueAt) || Number.MAX_SAFE_INTEGER;
  return leftDue - rightDue || priorityRank(right.priority) - priorityRank(left.priority) || left.title.localeCompare(right.title);
}

function priorityRank(priority: string) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[priority] ?? 0;
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
  value: DbTimestamp,
  key: "findings" | "tasks" | "timeline"
) {
  const time = millis(value);
  if (!time) {
    return;
  }
  const dayKey = toDateKey(new Date(time));
  const bucket = buckets.get(dayKey);
  if (bucket) {
    bucket[key] += 1;
  }
}

function latestIso(...values: DbTimestamp[]) {
  const latest = values.reduce((current, value) => Math.max(current, millis(value)), 0);
  return latest > 0 ? new Date(latest).toISOString() : null;
}

function toIso(value: DbTimestamp) {
  const time = millis(value);
  return time > 0 ? new Date(time).toISOString() : null;
}

function millis(value: DbTimestamp) {
  if (!value) {
    return 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toActionVerb(action: string) {
  const verb = action.split(".").pop() ?? action;
  const labels: Record<string, string> = {
    create: "created",
    created: "created",
    update: "updated",
    updated: "updated",
    delete: "deleted",
    deleted: "deleted",
    link: "linked",
    unlink: "unlinked"
  };
  return labels[verb] ?? verb.replace(/_/g, " ");
}
