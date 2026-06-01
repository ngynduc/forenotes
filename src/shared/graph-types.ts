export type GraphMode = "overview" | "investigation" | "timeline" | "assets" | "tasks" | "mitre";

export type GraphNodeType =
  | "case"
  | "incident"
  | "finding"
  | "timeline_event"
  | "task"
  | "query"
  | "ioc"
  | "indicator"
  | "system"
  | "account"
  | "mitre_technique"
  | "mitre_tactic"
  | "user"
  | "tag";

export type GraphEdgeType =
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

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  entityId: string;
  label: string;
  subtitle?: string;
  status?: string;
  severity?: string;
  owner?: string;
  mitreId?: string;
  tactic?: string;
  counts?: {
    findings?: number;
    timelineEvents?: number;
    tasks?: number;
    linkedItems?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  derived: boolean;
  confidence?: "low" | "medium" | "high";
  sourceDescription?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphResponse {
  incidentId: string;
  mode: GraphMode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    findings: number;
    timelineEvents: number;
    tasks: number;
    mitreTechniques: number;
    mitreTactics: number;
    systems: number;
    accounts: number;
    iocs: number;
    manualLinks: number;
    derivedLinks: number;
  };
}

export interface MitreTactic {
  id: string;
  mitreId: string;
  name: string;
  order: number;
}

export interface MitreTechnique {
  id: string;
  mitreId: string;
  name: string;
  tacticId: string;
  parentTechniqueId?: string;
  counts: {
    findings: number;
    timelineEvents: number;
    queries: number;
    tasks: number;
    total: number;
  };
  evidence: Array<{
    entityType: "finding" | "timeline_event" | "query" | "task";
    entityId: string;
    title: string;
  }>;
  firstSeen?: string;
  lastSeen?: string;
}

export interface MitreMatrixResponse {
  incidentId: string;
  tactics: MitreTactic[];
  techniques: MitreTechnique[];
}

export interface DashboardMetrics {
  totalCases: number;
  openCases: number;
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  unresolvedFindings: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  unreadNotifications: number;
}

export interface DashboardSla {
  attention: number;
  overdueTasks: number;
  dueSoonTasks: number;
  next24h: number;
  next72h: number;
  blockedTasks: number;
  staleIncidents: number;
  agingFindings: number;
  unreadNotifications: number;
}

export interface DashboardUnread {
  total: number;
  mentions: number;
  caseUpdates: number;
  taskUpdates: number;
}

export interface DashboardBreakdown {
  value: string;
  count: number;
}

export interface DashboardActivity {
  day: string;
  findings: number;
  tasks: number;
  timeline: number;
}

export interface DashboardEntityRef {
  id: string;
  name: string;
}

export interface DashboardLinkedEntity extends DashboardEntityRef {
  type: string;
}

export interface DashboardTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  updatedAt: string | null;
  assignee: DashboardEntityRef | null;
  case: DashboardEntityRef;
  incident: DashboardEntityRef;
  linkedEntity?: DashboardLinkedEntity;
}

export interface DashboardFindingItem {
  id: string;
  title: string;
  status: string;
  severity: string | null;
  updatedAt: string | null;
  case: DashboardEntityRef;
  incident: DashboardEntityRef;
}

export interface DashboardIncidentHealth {
  id: string;
  name: string;
  status: string;
  severity: string | null;
  case: DashboardEntityRef;
  openFindings: number;
  openTasks: number;
  lastActivityAt: string | null;
  slaRiskCount: number;
}

export interface DashboardCaseHealth {
  id: string;
  name: string;
  status: string;
  activeIncidents: number;
  openFindings: number;
  openTasks: number;
  lastActivityAt: string | null;
  slaRiskCount: number;
}

export interface DashboardRecentActivity {
  id: string;
  actor: DashboardEntityRef | null;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  case: DashboardEntityRef | null;
  incident: DashboardEntityRef | null;
  summary?: string | null;
  timestamp: string | null;
}

export interface DashboardUnreadUpdate {
  id: string;
  title: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  body: string | null;
  timestamp: string | null;
}

export interface DashboardWorkloadItem {
  assignee: DashboardEntityRef;
  taskCount: number;
  overdueCount: number;
  dueSoonCount: number;
  completedCount: number;
}

export interface DashboardLabeledValue {
  label: string;
  value: number;
}

export interface DashboardWorkloadChartItem {
  assignee: string;
  openTasks: number;
  overdue: number;
  dueSoon: number;
}

export interface DashboardCharts {
  taskStatusDistribution: DashboardLabeledValue[];
  slaRiskBreakdown: DashboardLabeledValue[];
  workloadByAssignee: DashboardWorkloadChartItem[];
  activityTrend: DashboardLabeledValue[];
  unreadBreakdown: DashboardLabeledValue[];
  caseIncidentHealth: DashboardLabeledValue[];
}

export interface DashboardSummary {
  scope: "team" | "self";
  metrics: DashboardMetrics;
  sla: DashboardSla;
  unread: DashboardUnread;
  activeCases: number;
  activeIncidents: number;
  openTasks: number;
  openFindings: number;
  breakdowns: {
    caseStatus: DashboardBreakdown[];
    incidentSeverity: DashboardBreakdown[];
    findingStatus: DashboardBreakdown[];
    taskStatus: DashboardBreakdown[];
  };
  activity: DashboardActivity[];
  recentActivity: DashboardRecentActivity[];
  highPriorityTasks: DashboardTaskItem[];
  recentFindings: DashboardFindingItem[];
  activeIncidentSnapshot: DashboardIncidentHealth[];
  unreadUpdates: DashboardUnreadUpdate[];
}

export interface DashboardSlaResponse {
  summary: DashboardSla;
  overdueTasks: DashboardTaskItem[];
  dueSoonTasks: DashboardTaskItem[];
  attentionItems: DashboardTaskItem[];
}

export interface DashboardActivityResponse {
  activity: DashboardRecentActivity[];
}

export interface DashboardWorkloadResponse {
  scope: "team" | "self";
  workload: DashboardWorkloadItem[];
}

export interface DashboardCasesResponse {
  cases: DashboardCaseHealth[];
  incidents: DashboardIncidentHealth[];
}

export interface DashboardResponse {
  summary: DashboardSummary;
  charts: DashboardCharts;
  sla: DashboardSlaResponse;
  activity: DashboardActivityResponse;
  workload: DashboardWorkloadResponse;
  cases: DashboardCasesResponse;
}

export interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  case_name: string;
  incident_name: string;
  snippet?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}
