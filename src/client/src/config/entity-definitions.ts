import { cleanObject, dateInputToIso, localDateTimeToIso, toDateInputValue, toLocalInputValue } from "@/lib/utils";
import type { GraphNodeType } from "@shared/domain";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "datetime-local"
  | "email"
  | "password"
  | "code"
  | "color"
  | "user-select"
  | "member-select";
type EntityLinkSourceType = Extract<GraphNodeType, "finding" | "timeline_event">;

export interface EntityField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  autofocus?: boolean;
  options?: string[];
  placeholder?: string;
  span?: number;
}

export interface InlineField {
  type: FieldType;
  payloadKey: string;
  options?: string[];
  displayToDraft?: (v: string | null | undefined) => string;
  draftToPayload?: (v: string | null | undefined) => string | null;
}

export interface EntityDefinition {
  collection: string;
  label: string;
  createTitle: string;
  editTitle: string;
  createAction: string;
  updateAction: string;
  create: () => { url: string; method: string };
  update: (id: string) => { url: string; method: string };
  delete?: (id: string) => { url: string; method: string };
  fields: () => EntityField[];
  values: (item?: Record<string, unknown> | null) => Record<string, unknown>;
  fromForm: (data: Record<string, unknown>) => Record<string, unknown>;
  inline?: Record<string, InlineField>;
  entityLinkSourceType?: EntityLinkSourceType;
}

// Option sets
export const OPTION_SETS = {
  caseStatus: ["open", "closed"],
  incidentSeverity: ["low", "medium", "high", "critical"],
  incidentStatus: ["open", "contained", "closed"],
  findingStatus: ["draft", "confirmed", "false_positive", "resolved"],
  findingSeverity: ["low", "medium", "high", "critical"],
  confidence: ["low", "medium", "high"],
  taskStatus: ["todo", "in_progress", "blocked", "done"],
  taskPriority: ["low", "medium", "high", "critical"],
  indicatorType: ["host", "ip", "domain", "url", "email", "file_hash", "registry", "mutex", "process", "user_agent", "other"],
  accountStatus: ["active", "disabled", "compromised", "locked"],
  systemStatus: ["online", "offline", "compromised", "unknown"],
  globalRole: ["admin", "commander", "analyst", "viewer"],
  caseRole: ["commander", "analyst", "viewer"],
  evidenceType: ["timeline_event", "indicator", "system", "account", "query"],
} as const;

export const TASK_BOARD_COLUMNS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

// Helper - will be called from components that have scope store access
type GetScope = () => { activeUserId: string; selectedCaseId: string; selectedIncidentId: string };

export function getEntityDefinitions(getScope: GetScope): Record<string, EntityDefinition> {
  return {
    case: {
      collection: "cases",
      label: "Case",
      createTitle: "Create Case",
      editTitle: "Edit Case",
      createAction: "Save Case",
      updateAction: "Save Case",
      create: () => ({ url: "/api/cases", method: "POST" }),
      update: (id) => ({ url: `/api/cases/${id}`, method: "PATCH" }),
      fields: () => [
        { name: "caseName", label: "Case Name", type: "text", required: true, autofocus: true },
        { name: "clientName", label: "Client Name", type: "text" },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "endDate", label: "End Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: [...OPTION_SETS.caseStatus], required: true },
        { name: "summary", label: "Summary", type: "textarea", span: 2 },
        { name: "initialMemberUserId", label: "Initial Member", type: "user-select" },
        { name: "initialMemberRole", label: "Initial Member Role", type: "select", options: [...OPTION_SETS.caseRole] },
      ],
      values: (item) => ({
        caseName: (item?.caseName as string) || "",
        clientName: (item?.clientName as string) || "",
        startDate: toDateInputValue((item?.startDate as string) || ""),
        endDate: toDateInputValue((item?.endDate as string) || ""),
        status: (item?.status as string) || "open",
        summary: (item?.summary as string) || "",
        initialMemberUserId: "",
        initialMemberRole: "analyst",
      }),
      fromForm: (data) =>
        cleanObject({
          caseName: data.caseName,
          clientName: data.clientName,
          status: data.status,
          summary: data.summary,
          startDate: dateInputToIso((data.startDate as string) || ""),
          endDate: dateInputToIso((data.endDate as string) || ""),
          members: data.initialMemberUserId
            ? [{ userId: data.initialMemberUserId, caseRole: data.initialMemberRole || "analyst" }]
            : undefined,
        }),
      inline: {
        caseName: { type: "text", payloadKey: "caseName" },
        clientName: { type: "text", payloadKey: "clientName" },
        status: { type: "select", payloadKey: "status", options: [...OPTION_SETS.caseStatus] },
      },
    },
    incident: {
      collection: "incidents",
      label: "Incident",
      createTitle: "Create Incident",
      editTitle: "Edit Incident",
      createAction: "Save Incident",
      updateAction: "Save Incident",
      create: () => ({ url: `/api/cases/${getScope().selectedCaseId}/incidents`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${id}`, method: "PATCH" }),
      fields: () => [
        { name: "name", label: "Incident Name", type: "text", required: true, autofocus: true },
        { name: "severity", label: "Severity", type: "select", options: [...OPTION_SETS.incidentSeverity] },
        { name: "status", label: "Status", type: "select", options: [...OPTION_SETS.incidentStatus], required: true },
        { name: "summary", label: "Summary", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        name: (item?.name as string) || "",
        severity: (item?.severity as string) || "medium",
        status: (item?.status as string) || "open",
        summary: (item?.summary as string) || "",
      }),
      fromForm: (data) => cleanObject(data),
      inline: {
        name: { type: "text", payloadKey: "name" },
        severity: { type: "select", payloadKey: "severity", options: [...OPTION_SETS.incidentSeverity] },
        status: { type: "select", payloadKey: "status", options: [...OPTION_SETS.incidentStatus] },
      },
    },
    finding: {
      collection: "findings",
      label: "Finding",
      createTitle: "Add Finding",
      editTitle: "Finding Detail",
      createAction: "Save Finding",
      updateAction: "Save Finding",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/findings`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/findings/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/findings/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "title", label: "Title", type: "text", required: true, autofocus: true },
        { name: "status", label: "Status", type: "select", options: [...OPTION_SETS.findingStatus], required: true },
        { name: "severity", label: "Severity", type: "select", options: ["", ...OPTION_SETS.findingSeverity] },
        { name: "confidence", label: "Confidence", type: "select", options: ["", ...OPTION_SETS.confidence] },
        { name: "description", label: "Long Description", type: "textarea", span: 2 },
        { name: "impact", label: "Impact", type: "textarea", span: 2 },
        { name: "recommendation", label: "Recommendation", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        title: (item?.title as string) || "",
        status: (item?.status as string) || "draft",
        severity: (item?.severity as string) || "",
        confidence: (item?.confidence as string) || "",
        description: (item?.description as string) || "",
        impact: (item?.impact as string) || "",
        recommendation: (item?.recommendation as string) || "",
      }),
      fromForm: (data) =>
        cleanObject({
          title: data.title,
          status: data.status,
          severity: data.severity,
          confidence: data.confidence,
          description: data.description,
          impact: data.impact,
          recommendation: data.recommendation,
        }),
      inline: {
        title: { type: "text", payloadKey: "title" },
        status: { type: "select", payloadKey: "status", options: [...OPTION_SETS.findingStatus] },
        severity: { type: "select", payloadKey: "severity", options: ["", ...OPTION_SETS.findingSeverity] },
        confidence: { type: "select", payloadKey: "confidence", options: ["", ...OPTION_SETS.confidence] },
      },
      entityLinkSourceType: "finding",
    },
    timeline_event: {
      collection: "timelineEvents",
      label: "Timeline Event",
      createTitle: "Create Timeline Event",
      editTitle: "Timeline Event Detail",
      createAction: "Save Event",
      updateAction: "Save Event",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/timeline-events`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/timeline-events/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/timeline-events/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "title", label: "Title", type: "text", required: true, autofocus: true },
        { name: "eventTime", label: "Event Time", type: "datetime-local", required: true },
        { name: "source", label: "Source", type: "text" },
        { name: "description", label: "Details", type: "textarea", span: 2 },
        { name: "rawEvidenceRef", label: "Raw Evidence Ref", type: "text", span: 2 },
      ],
      values: (item) => ({
        title: (item?.title as string) || "",
        eventTime: toLocalInputValue((item?.eventTime as string) || ""),
        source: (item?.source as string) || "",
        description: (item?.description as string) || "",
        rawEvidenceRef: (item?.rawEvidenceRef as string) || "",
      }),
      fromForm: (data) =>
        cleanObject({
          ...data,
          eventTime: localDateTimeToIso((data.eventTime as string) || ""),
        }),
      inline: {
        title: { type: "text", payloadKey: "title" },
        eventTime: { type: "datetime-local", payloadKey: "eventTime" },
        source: { type: "text", payloadKey: "source" },
      },
      entityLinkSourceType: "timeline_event",
    },
    task: {
      collection: "tasks",
      label: "Task",
      createTitle: "Create Task",
      editTitle: "Task Detail",
      createAction: "Save Task",
      updateAction: "Save Task",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/tasks`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/tasks/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/tasks/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "title", label: "Title", type: "text", required: true, autofocus: true },
        { name: "status", label: "Status", type: "select", options: [...OPTION_SETS.taskStatus], required: true },
        { name: "priority", label: "Priority", type: "select", options: [...OPTION_SETS.taskPriority], required: true },
        { name: "assigneeUserId", label: "Assignee", type: "member-select" },
        { name: "ownerUserId", label: "Owner", type: "member-select" },
        { name: "dueAt", label: "Due At", type: "datetime-local" },
        { name: "description", label: "Description", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        title: (item?.title as string) || "",
        status: (item?.status as string) || "todo",
        priority: (item?.priority as string) || "medium",
        assigneeUserId: (item?.assigneeUserId as string) || "",
        ownerUserId: (item?.ownerUserId as string) || getScope().activeUserId || "",
        dueAt: toLocalInputValue((item?.dueAt as string) || ""),
        description: (item?.description as string) || "",
      }),
      fromForm: (data) =>
        cleanObject({
          ...data,
          dueAt: localDateTimeToIso((data.dueAt as string) || ""),
        }),
      inline: {
        title: { type: "text", payloadKey: "title" },
        status: { type: "select", payloadKey: "status", options: [...OPTION_SETS.taskStatus] },
        priority: { type: "select", payloadKey: "priority", options: [...OPTION_SETS.taskPriority] },
        assigneeUserId: { type: "member-select", payloadKey: "assigneeUserId" },
        dueAt: { type: "datetime-local", payloadKey: "dueAt" },
      },
    },
    query: {
      collection: "queries",
      label: "Query",
      createTitle: "Create Query",
      editTitle: "Query Detail",
      createAction: "Save Query",
      updateAction: "Save Query",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/queries`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/queries/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/queries/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "name", label: "Name", type: "text", required: true, autofocus: true },
        { name: "language", label: "Language", type: "text", required: true },
        { name: "ownerUserId", label: "Owner", type: "member-select" },
        { name: "description", label: "Description", type: "textarea", span: 2 },
        { name: "queryBody", label: "Query Body", type: "code", span: 2, required: true },
      ],
      values: (item) => ({
        name: (item?.name as string) || "",
        language: (item?.language as string) || "spl",
        ownerUserId: (item?.ownerUserId as string) || "",
        description: (item?.description as string) || "",
        queryBody: (item?.queryBody as string) || "",
      }),
      fromForm: (data) => cleanObject(data),
      inline: {
        name: { type: "text", payloadKey: "name" },
        language: { type: "text", payloadKey: "language" },
        ownerUserId: { type: "member-select", payloadKey: "ownerUserId" },
      },
    },
    indicator: {
      collection: "indicators",
      label: "Indicator",
      createTitle: "Add Indicator",
      editTitle: "Indicator Detail",
      createAction: "Save Indicator",
      updateAction: "Save Indicator",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/indicators`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/indicators/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/indicators/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "indicatorType", label: "Type", type: "select", options: [...OPTION_SETS.indicatorType], required: true, autofocus: true },
        { name: "value", label: "Value", type: "text", required: true },
        { name: "confidence", label: "Confidence", type: "select", options: ["", ...OPTION_SETS.confidence] },
        { name: "source", label: "Source", type: "text" },
        { name: "firstSeenAt", label: "First Seen", type: "datetime-local" },
        { name: "lastSeenAt", label: "Last Seen", type: "datetime-local" },
        { name: "description", label: "Description", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        indicatorType: (item?.indicatorType as string) || "host",
        value: (item?.value as string) || "",
        confidence: (item?.confidence as string) || "",
        source: (item?.source as string) || "",
        firstSeenAt: toLocalInputValue((item?.firstSeenAt as string) || ""),
        lastSeenAt: toLocalInputValue((item?.lastSeenAt as string) || ""),
        description: (item?.description as string) || "",
      }),
      fromForm: (data) =>
        cleanObject({
          ...data,
          firstSeenAt: localDateTimeToIso((data.firstSeenAt as string) || ""),
          lastSeenAt: localDateTimeToIso((data.lastSeenAt as string) || ""),
        }),
      inline: {
        indicatorType: { type: "select", payloadKey: "indicatorType", options: [...OPTION_SETS.indicatorType] },
        value: { type: "text", payloadKey: "value" },
        confidence: { type: "select", payloadKey: "confidence", options: ["", ...OPTION_SETS.confidence] },
        source: { type: "text", payloadKey: "source" },
      },
    },
    system: {
      collection: "systems",
      label: "System",
      createTitle: "Add System",
      editTitle: "System Detail",
      createAction: "Save System",
      updateAction: "Save System",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/systems`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/systems/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/systems/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "hostname", label: "Hostname", type: "text", required: true, autofocus: true },
        { name: "ipAddress", label: "IP Address", type: "text" },
        { name: "os", label: "OS", type: "text" },
        { name: "status", label: "Status", type: "select", options: ["", ...OPTION_SETS.systemStatus] },
        { name: "owner", label: "Owner", type: "text" },
        { name: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        hostname: (item?.hostname as string) || "",
        ipAddress: (item?.ipAddress as string) || "",
        os: (item?.os as string) || "",
        status: (item?.status as string) || "",
        owner: (item?.owner as string) || "",
        notes: (item?.notes as string) || "",
      }),
      fromForm: (data) => cleanObject(data),
      inline: {
        hostname: { type: "text", payloadKey: "hostname" },
        ipAddress: { type: "text", payloadKey: "ipAddress" },
        os: { type: "text", payloadKey: "os" },
        status: { type: "select", payloadKey: "status", options: ["", ...OPTION_SETS.systemStatus] },
        owner: { type: "text", payloadKey: "owner" },
      },
    },
    account: {
      collection: "accounts",
      label: "Account",
      createTitle: "Add Account",
      editTitle: "Account Detail",
      createAction: "Save Account",
      updateAction: "Save Account",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/accounts`, method: "POST" }),
      update: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/accounts/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/incidents/${getScope().selectedIncidentId}/accounts/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "username", label: "Username", type: "text", required: true, autofocus: true },
        { name: "domain", label: "Domain", type: "text" },
        { name: "status", label: "Status", type: "select", options: ["", ...OPTION_SETS.accountStatus] },
        { name: "owner", label: "Owner", type: "text" },
        { name: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
      values: (item) => ({
        username: (item?.username as string) || "",
        domain: (item?.domain as string) || "",
        status: (item?.status as string) || "",
        owner: (item?.owner as string) || "",
        notes: (item?.notes as string) || "",
      }),
      fromForm: (data) => cleanObject(data),
      inline: {
        username: { type: "text", payloadKey: "username" },
        domain: { type: "text", payloadKey: "domain" },
        status: { type: "select", payloadKey: "status", options: ["", ...OPTION_SETS.accountStatus] },
        owner: { type: "text", payloadKey: "owner" },
      },
    },
    // Membership entities
    custom_tag: {
      collection: "customTags",
      label: "Custom Tag",
      createTitle: "Create Custom Tag",
      editTitle: "Edit Custom Tag",
      createAction: "Save Tag",
      updateAction: "Save Tag",
      create: () => ({ url: `/api/cases/${getScope().selectedCaseId}/custom-tags`, method: "POST" }),
      update: (id) => ({ url: `/api/cases/${getScope().selectedCaseId}/custom-tags/${id}`, method: "PATCH" }),
      delete: (id) => ({ url: `/api/cases/${getScope().selectedCaseId}/custom-tags/${id}`, method: "DELETE" }),
      fields: () => [
        { name: "name", label: "Tag Name", type: "text", required: true, autofocus: true },
        { name: "color", label: "Color", type: "color" },
      ],
      values: (item) => ({ name: (item?.name as string) || "", color: (item?.color as string) || "#0f766e" }),
      fromForm: (data) => cleanObject(data),
      inline: {
        name: { type: "text", payloadKey: "name" },
        color: { type: "color", payloadKey: "color" },
      },
    },
    user: {
      collection: "users",
      label: "User",
      createTitle: "Create User",
      editTitle: "Create User",
      createAction: "Create User",
      updateAction: "Create User",
      create: () => ({ url: "/api/users", method: "POST" }),
      update: () => ({ url: "/api/users", method: "POST" }),
      fields: () => [
        { name: "username", label: "Username", type: "text", required: true, autofocus: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "displayName", label: "Display Name", type: "text", required: true },
        { name: "password", label: "Temporary Password", type: "password", required: true },
        { name: "globalRole", label: "Global Role", type: "select", options: [...OPTION_SETS.globalRole], required: true },
      ],
      values: () => ({ username: "", email: "", displayName: "", password: "", globalRole: "analyst" }),
      fromForm: (data) => cleanObject(data),
    },
    case_member: {
      collection: "caseMembers",
      label: "Case Member",
      createTitle: "Add Case Member",
      editTitle: "Add Case Member",
      createAction: "Add Member",
      updateAction: "Add Member",
      create: () => ({ url: `/api/cases/${getScope().selectedCaseId}/members`, method: "POST" }),
      update: () => ({ url: `/api/cases/${getScope().selectedCaseId}/members`, method: "POST" }),
      fields: () => [
        { name: "userId", label: "User", type: "user-select", required: true, autofocus: true },
        { name: "caseRole", label: "Case Role", type: "select", options: [...OPTION_SETS.caseRole], required: true },
      ],
      values: () => ({ userId: "", caseRole: "analyst" }),
      fromForm: (data) => data,
    },
    incident_member: {
      collection: "incidentMembers",
      label: "Incident Member",
      createTitle: "Add Incident Member",
      editTitle: "Add Incident Member",
      createAction: "Add Member",
      updateAction: "Add Member",
      create: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/members`, method: "POST" }),
      update: () => ({ url: `/api/incidents/${getScope().selectedIncidentId}/members`, method: "POST" }),
      fields: () => [
        { name: "userId", label: "User", type: "user-select", required: true, autofocus: true },
        { name: "incidentRole", label: "Incident Role", type: "text", required: true },
      ],
      values: () => ({ userId: "", incidentRole: "analyst" }),
      fromForm: (data) => data,
    },
  };
}
