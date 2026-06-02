export type GraphNodeType =
  | "case"
  | "incident"
  | "finding"
  | "timeline_event"
  | "task"
  | "indicator"
  | "system"
  | "account"
  | "mitre_technique";

export type GraphEdgeType =
  | "related_to"
  | "evidence_for"
  | "followed_by"
  | "assigned_to"
  | "contains_ioc"
  | "observed_on"
  | "used_account"
  | "maps_to";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  entityId: string;
  label: string;
  subtitle?: string;
  severity?: string;
  status?: string;
  counts?: Record<string, number>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  derived: boolean;
}
