export const GLOBAL_ROLES = ["commander", "response_lead", "analyst"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const CASE_STATUSES = ["open", "closed"] as const;
export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const INCIDENT_STATUSES = ["open", "closed", "contained"] as const;
export const FINDING_STATUSES = ["draft", "confirmed", "false_positive", "resolved"] as const;
export const FINDING_SEVERITIES = INCIDENT_SEVERITIES;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const INDICATOR_TYPES = [
  "host",
  "ip",
  "domain",
  "url",
  "email",
  "file_hash",
  "registry",
  "mutex",
  "process",
  "user_agent",
  "other"
] as const;
export const EVIDENCE_TYPES = ["timeline_event", "system", "account", "indicator", "query"] as const;
export const TASK_LINK_ENTITY_TYPES = [
  "finding",
  "timeline_event",
  "system",
  "account",
  "indicator",
  "query"
] as const;
export const GRAPH_NODE_TYPES = [
  "finding",
  "timeline_event",
  "task",
  "system",
  "account",
  "ioc",
  "query",
  "mitre_technique",
  "mitre_tactic",
  "user",
  "tag"
] as const;
export const GRAPH_EDGE_TYPES = [
  "related_to",
  "evidence_for",
  "caused_by",
  "followed_by",
  "investigates",
  "references",
  "observed_on",
  "used_account",
  "contains_ioc",
  "maps_to",
  "belongs_to_tactic",
  "subtechnique_of",
  "detects",
  "assigned_to",
  "has_tag"
] as const;
export const GRAPH_MODES = ["overview", "investigation", "timeline", "assets", "tasks", "mitre"] as const;

export const PERMISSION_KEYS = [
  "case:create",
  "case:update",
  "case:member_manage",
  "incident:create",
  "incident:update",
  "incident:member_manage",
  "finding:create",
  "finding:update",
  "finding:delete",
  "finding:evidence_link",
  "finding:evidence_unlink",
  "timeline:create",
  "timeline:update",
  "timeline:delete",
  "indicator:create",
  "indicator:update",
  "indicator:delete",
  "task:create",
  "task:update",
  // Reserved for owner/assignee changes so task assignees can update task progress without reassign rights.
  "task:assign",
  "task:link",
  "query:create",
  "query:update",
  "query:delete",
  "tag:custom_create",
  "tag:custom_update",
  "entity_link:read",
  "entity_link:create",
  "entity_link:delete",
  "graph:read",
  "mitre_matrix:read",
  "notification:read",
  "audit:read"
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type GraphNodeType = (typeof GRAPH_NODE_TYPES)[number];
export type GraphEdgeType = (typeof GRAPH_EDGE_TYPES)[number];
export type GraphMode = (typeof GRAPH_MODES)[number];
