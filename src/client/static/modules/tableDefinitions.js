import { compactText, formatDate, formatDateTime, roleLabel, summarizeJson } from "./helpers.js";
import { state } from "./state.js";

export const TABLE_DEFINITIONS = {
  cases: {
    entityType: "case",
    title: "Current Cases",
    subtitle: "Case-oriented entry point for all investigation work.",
    createLabel: "Create Case",
    emptyLabel: "No cases are available for the current user.",
    columns: [
      { key: "case_name", label: "Case Name", sortKey: "case_name", title: true, editable: true },
      { key: "client_name", label: "Client", sortKey: "client_name", editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "user_case_role", label: "Role", sortKey: "user_case_role", format: roleLabel },
      { key: "active_incidents", label: "Active Incidents", sortKey: "active_incidents" },
      { key: "updated_at", label: "Last Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  incidents: {
    entityType: "incident",
    title: "Incidents",
    subtitle: "Incident scopes inside the selected case.",
    createLabel: "Create Incident",
    emptyLabel: "Create an incident inside this case.",
    columns: [
      { key: "name", label: "Incident", sortKey: "name", title: true, editable: true },
      { key: "severity", label: "Severity", sortKey: "severity", editable: true, badge: "priority" },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  findings: {
    entityType: "finding",
    title: "Findings",
    subtitle: "Dense review table with inline quick edits and detail modal for long analysis.",
    createLabel: "Add Finding",
    emptyLabel: "No findings yet for this incident.",
    columns: [
      { key: "title", label: "Finding", sortKey: "title", title: true, editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "severity", label: "Severity", sortKey: "severity", editable: true, badge: "priority" },
      { key: "confidence", label: "Confidence", sortKey: "confidence", editable: true },
      { key: "owner_user_id", label: "Owner", sortKey: "owner_user_id", editable: true, format: formatMemberName },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  timeline: {
    entityType: "timeline_event",
    title: "Timeline",
    subtitle: "Chronological events scoped to the active incident.",
    createLabel: "Add Event",
    emptyLabel: "No timeline events yet.",
    columns: [
      { key: "event_time", label: "Timestamp", sortKey: "event_time", editable: true, format: formatDateTime },
      { key: "title", label: "Event", sortKey: "title", title: true, editable: true },
      { key: "source", label: "Source", sortKey: "source", editable: true },
      { key: "owner_user_id", label: "Owner", sortKey: "owner_user_id", editable: true, format: formatMemberName },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  tasks: {
    entityType: "task",
    title: "Task Table",
    subtitle: "Operational coordination with inline status, priority, and assignment edits.",
    createLabel: "Create Task",
    emptyLabel: "No tasks yet for this incident.",
    columns: [
      { key: "title", label: "Task", sortKey: "title", title: true, editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "priority", label: "Priority", sortKey: "priority", editable: true, badge: "priority" },
      { key: "assignee_user_id", label: "Assignee", sortKey: "assignee_user_id", editable: true, format: formatMemberName },
      { key: "due_at", label: "Due", sortKey: "due_at", editable: true, format: formatDate },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  queries: {
    entityType: "query",
    title: "Queries",
    subtitle: "Stored detections, hunt logic, and review queries.",
    createLabel: "Create Query",
    emptyLabel: "No queries yet for this incident.",
    columns: [
      { key: "name", label: "Name", sortKey: "name", title: true, editable: true },
      { key: "language", label: "Language", sortKey: "language", editable: true },
      { key: "owner_user_id", label: "Owner", sortKey: "owner_user_id", editable: true, format: formatMemberName },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  notifications: {
    entityType: "notification",
    title: "Notifications",
    subtitle: "Assignment, membership, and record activity for the current user.",
    emptyLabel: "No notifications yet.",
    columns: [
      { key: "title", label: "Notification", sortKey: "title", title: true },
      { key: "event_type", label: "Event", sortKey: "event_type" },
      { key: "entity_type", label: "Entity", sortKey: "entity_type" },
      { key: "created_at", label: "Created", sortKey: "created_at", format: formatDateTime },
      { key: "unseen", label: "State", sortKey: "unseen", format: (value) => (value ? "Unread" : "Read") }
    ]
  },
  audit: {
    entityType: "audit",
    title: "Audit Logs",
    subtitle: "Immutable accountability events for the active case and incident.",
    emptyLabel: "No audit events visible for this scope.",
    columns: [
      { key: "created_at", label: "Timestamp", sortKey: "created_at", format: formatDateTime },
      { key: "actor_user_id", label: "Actor", sortKey: "actor_user_id", format: compactActor },
      { key: "action", label: "Action", sortKey: "action" },
      { key: "entity_type", label: "Entity Type", sortKey: "entity_type" },
      { key: "entity_id", label: "Entity ID", sortKey: "entity_id", format: compactId },
      { key: "after_json", label: "Changes", sortKey: "action", format: summarizeJson },
      { key: "source", label: "Source", sortKey: "source", format: () => "API/UI" }
    ]
  },
  users: {
    entityType: "user",
    title: "Users",
    subtitle: "Demo identities available for assignment and permission checks.",
    createLabel: "Create User",
    emptyLabel: "No users yet.",
    columns: [
      { key: "display_name", label: "User", sortKey: "display_name", title: true },
      { key: "email", label: "Email", sortKey: "email" },
      { key: "global_role", label: "Global Role", sortKey: "global_role", format: roleLabel },
      { key: "status", label: "Status", sortKey: "status" }
    ]
  },
  customTags: {
    entityType: "custom_tag",
    title: "Case Tags",
    subtitle: "Custom tags stay scoped to the selected case.",
    createLabel: "Create Tag",
    emptyLabel: "No custom tags for this case.",
    columns: [
      { key: "name", label: "Tag", sortKey: "name", title: true, editable: true },
      { key: "color", label: "Color", sortKey: "color", editable: true },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  indicators: {
    entityType: "indicator",
    title: "Indicators",
    subtitle: "IOCs and detection indicators scoped to this incident.",
    createLabel: "Add Indicator",
    emptyLabel: "No indicators for this incident.",
    columns: [
      { key: "indicator_type", label: "Type", sortKey: "indicator_type", title: true, editable: true },
      { key: "value", label: "Value", sortKey: "value", editable: true },
      { key: "confidence", label: "Confidence", sortKey: "confidence" },
      { key: "source", label: "Source", sortKey: "source" },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  systems: {
    entityType: "system",
    title: "Systems",
    subtitle: "Affected systems in this incident.",
    createLabel: "Add System",
    emptyLabel: "No systems for this incident.",
    columns: [
      { key: "hostname", label: "Hostname", sortKey: "hostname", title: true, editable: true },
      { key: "ip_address", label: "IP Address", sortKey: "ip_address" },
      { key: "os", label: "OS", sortKey: "os", editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  accounts: {
    entityType: "account",
    title: "Accounts",
    subtitle: "User accounts relevant to this incident.",
    createLabel: "Add Account",
    emptyLabel: "No accounts for this incident.",
    columns: [
      { key: "username", label: "Username", sortKey: "username", title: true, editable: true },
      { key: "domain", label: "Domain", sortKey: "domain" },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "owner", label: "Owner", sortKey: "owner" },
      { key: "updated_at", label: "Updated", sortKey: "updated_at", format: formatDateTime }
    ]
  },
  search: {
    entityType: "search_result",
    title: "Search Results",
    subtitle: "Search results remain tied to the current case and incident context.",
    emptyLabel: "No search results yet.",
    columns: [
      { key: "title", label: "Result", sortKey: "title", title: true },
      { key: "entity_type", label: "Type", sortKey: "entity_type" },
      { key: "case_name", label: "Case", sortKey: "case_name" },
      { key: "incident_name", label: "Incident", sortKey: "incident_name" },
      { key: "snippet", label: "Match", sortKey: "snippet", format: (value) => compactText(value, 140) }
    ]
  }
};

export function formatMemberName(value) {
  if (!value) {
    return "Unassigned";
  }
  const member = state.incidentMembers.find((entry) => entry.user_id === value) ||
    state.caseMembers.find((entry) => entry.user_id === value);
  return member ? member.display_name : compactId(value);
}

function compactId(value) {
  return String(value || "-").slice(0, 8);
}

function compactActor(value) {
  const user = state.users.find((entry) => entry.id === value);
  return user ? user.display_name : compactId(value);
}
