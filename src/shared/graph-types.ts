export type GraphMode = "overview" | "timeline" | "mitre";

export type GraphNodeType =
  | "case"
  | "incident"
  | "finding"
  | "timeline_event"
  | "task"
  | "query"
  | "indicator"
  | "system"
  | "account"
  | "mitre_technique"
  | "mitre_tactic";

export type GraphEdgeType =
  | "derived"
  | "manual"
  | "mitre";

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
  overdueTasks: number;
  dueSoonTasks: number;
  unreadNotifications: number;
}

export interface DashboardSla {
  overdueTasks: number;
  dueSoonTasks: number;
  staleIncidents: number;
  agingFindings: number;
  unreadNotifications: number;
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

export interface DashboardRecentActivity {
  id: string;
  kind: "case" | "incident" | "finding" | "task" | "timeline";
  title: string;
  detail: string;
  timestamp: string | null;
}

export interface DashboardResponse {
  summary: {
    metrics: DashboardMetrics;
    sla: DashboardSla;
    breakdowns: {
      caseStatus: DashboardBreakdown[];
      incidentSeverity: DashboardBreakdown[];
      findingStatus: DashboardBreakdown[];
      taskStatus: DashboardBreakdown[];
    };
    activity: DashboardActivity[];
    recentActivity: DashboardRecentActivity[];
  };
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
