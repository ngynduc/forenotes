import * as React from "react";
import { formatDateTime, formatDate, compactText } from "@/lib/utils";

export interface ColumnDef {
  key: string;
  label: string;
  sortKey: string;
  title?: boolean;
  editable?: boolean;
  badge?: "status" | "priority";
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  html?: boolean;
}

export interface TableDefinition {
  entityType: string;
  title: string;
  subtitle: string;
  createLabel?: string;
  emptyLabel: string;
  columns: ColumnDef[];
}

export const TABLE_DEFINITIONS: Record<string, TableDefinition> = {
  cases: {
    entityType: "case",
    title: "Current Cases",
    subtitle: "Case-oriented entry point for all investigation work.",
    createLabel: "Create Case",
    emptyLabel: "No cases are available for the current user.",
    columns: [
      { key: "caseName", label: "Case Name", sortKey: "caseName", title: true, editable: true },
      { key: "clientName", label: "Client", sortKey: "clientName", editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "userCaseRole", label: "Role", sortKey: "userCaseRole" },
      { key: "activeIncidents", label: "Active Incidents", sortKey: "activeIncidents" },
      { key: "updatedAt", label: "Last Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
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
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
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
      { key: "ownerDisplayName", label: "Owner", sortKey: "ownerDisplayName" },
      { key: "createdAt", label: "Created", sortKey: "createdAt", format: (v) => formatDateTime(v as string) },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  timeline: {
    entityType: "timeline_event",
    title: "Timeline",
    subtitle: "Chronological events scoped to the active incident.",
    createLabel: "Add Event",
    emptyLabel: "No timeline events yet.",
    columns: [
      { key: "eventTime", label: "Timestamp", sortKey: "eventTime", editable: true, format: (v) => formatDateTime(v as string) },
      { key: "title", label: "Event", sortKey: "title", title: true, editable: true },
      { key: "source", label: "Source", sortKey: "source", editable: true },
      { key: "ownerDisplayName", label: "Owner", sortKey: "ownerDisplayName" },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
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
      { key: "assigneeDisplayName", label: "Assignee", sortKey: "assigneeDisplayName" },
      { key: "dueAt", label: "Due", sortKey: "dueAt", editable: true, format: (v) => formatDate(v as string) },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  queries: {
    entityType: "query",
    title: "Queries",
    subtitle: "Stored detections, hunt logic, and review queries.",
    createLabel: "Create Query",
    emptyLabel: "No queries yet for this incident.",
    columns: [
      { key: "id", label: "ID", sortKey: "id" },
      { key: "name", label: "Query Name", sortKey: "name", title: true, editable: true },
      { key: "language", label: "Language", sortKey: "language", editable: true },
      { key: "ownerDisplayName", label: "Owner", sortKey: "ownerDisplayName" },
      { key: "description", label: "Description", sortKey: "description" },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  indicators: {
    entityType: "indicator",
    title: "Indicators",
    subtitle: "IOCs and detection indicators scoped to this incident.",
    createLabel: "Add Indicator",
    emptyLabel: "No indicators for this incident.",
    columns: [
      { key: "indicatorType", label: "Type", sortKey: "indicatorType", title: true, editable: true },
      { key: "value", label: "Value", sortKey: "value", editable: true },
      { key: "confidence", label: "Confidence", sortKey: "confidence" },
      { key: "source", label: "Source", sortKey: "source" },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  systems: {
    entityType: "system",
    title: "Systems",
    subtitle: "Affected systems in this incident.",
    createLabel: "Add System",
    emptyLabel: "No systems for this incident.",
    columns: [
      { key: "hostname", label: "Hostname", sortKey: "hostname", title: true, editable: true },
      { key: "ipAddress", label: "IP Address", sortKey: "ipAddress" },
      { key: "os", label: "OS", sortKey: "os", editable: true },
      { key: "status", label: "Status", sortKey: "status", editable: true, badge: "status" },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
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
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  notifications: {
    entityType: "notification",
    title: "Notifications",
    subtitle: "Assignment, membership, and record activity for the current user.",
    emptyLabel: "No notifications yet.",
    columns: [
      { key: "title", label: "Notification", sortKey: "title", title: true },
      { key: "eventType", label: "Event", sortKey: "eventType" },
      { key: "entityType", label: "Entity", sortKey: "entityType" },
      { key: "createdAt", label: "Created", sortKey: "createdAt", format: (v) => formatDateTime(v as string) },
      { key: "unseen", label: "State", sortKey: "unseen", format: (v) => (v ? "Unread" : "Read") },
    ],
  },
  audit: {
    entityType: "audit",
    title: "Audit Logs",
    subtitle: "Immutable accountability events for the active case and incident.",
    emptyLabel: "No audit events visible for this scope.",
    columns: [
      { key: "createdAt", label: "Timestamp", sortKey: "createdAt", format: (v) => formatDateTime(v as string) },
      { key: "actorUserId", label: "Actor", sortKey: "actorUserId" },
      { key: "action", label: "Action", sortKey: "action" },
      { key: "entityType", label: "Entity Type", sortKey: "entityType" },
      { key: "entityId", label: "Entity ID", sortKey: "entityId" },
      { key: "source", label: "Source", sortKey: "source" },
    ],
  },
  users: {
    entityType: "user",
    title: "Users",
    subtitle: "Demo identities available for assignment and permission checks.",
    createLabel: "Create User",
    emptyLabel: "No users yet.",
    columns: [
      { key: "displayName", label: "User", sortKey: "displayName", title: true },
      { key: "email", label: "Email", sortKey: "email" },
      { key: "globalRole", label: "Global Role", sortKey: "globalRole" },
      { key: "status", label: "Status", sortKey: "status" },
    ],
  },
  customTags: {
    entityType: "custom_tag",
    title: "Case Tags",
    subtitle: "Custom tags stay scoped to the selected case.",
    createLabel: "Create Tag",
    emptyLabel: "No custom tags for this case.",
    columns: [
      { key: "name", label: "Tag", sortKey: "name", title: true, editable: true },
      {
        key: "color",
        label: "Color",
        sortKey: "color",
        editable: true,
        format: (value) => {
          const color = String(value || "#0f766e");
          return React.createElement(
            "span",
            { className: "inline-flex items-center gap-2" },
            React.createElement("span", {
              className: "h-3 w-3 rounded-full border border-[var(--color-border)]",
              style: { backgroundColor: color },
            }),
            color.toUpperCase()
          );
        },
      },
      { key: "updatedAt", label: "Updated", sortKey: "updatedAt", format: (v) => formatDateTime(v as string) },
    ],
  },
  attackTags: {
    entityType: "attack_tag",
    title: "MITRE ATT&CK Tags",
    subtitle: "Global built-in ATT&CK tactics and techniques available to every case.",
    emptyLabel: "No ATT&CK tags are available.",
    columns: [
      { key: "attackId", label: "ATT&CK ID", sortKey: "attackId", title: true },
      { key: "name", label: "Name", sortKey: "name" },
      { key: "type", label: "Type", sortKey: "type" },
      { key: "tactic", label: "Tactic", sortKey: "tactic" },
    ],
  },
  search: {
    entityType: "search_result",
    title: "Search Results",
    subtitle: "Search results remain tied to the current case and incident context.",
    emptyLabel: "No search results yet.",
    columns: [
      { key: "title", label: "Result", sortKey: "title", title: true },
      { key: "entityType", label: "Type", sortKey: "entityType" },
      { key: "caseName", label: "Case", sortKey: "caseName" },
      { key: "incidentName", label: "Incident", sortKey: "incidentName" },
      { key: "snippet", label: "Match", sortKey: "snippet", format: (v) => compactText(v as string, 140) },
    ],
  },
};
