import { OPTION_SETS, state } from "./state.js";
import { cleanObject, dateInputToIso, localDateTimeToIso, toDateInputValue, toLocalInputValue } from "./helpers.js";

export const ENTITY_DEFINITIONS = {
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
      { name: "status", label: "Status", type: "select", options: OPTION_SETS.caseStatus, required: true },
      { name: "summary", label: "Summary", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      caseName: item?.case_name || "",
      clientName: item?.client_name || "",
      startDate: toDateInputValue(item?.start_date),
      endDate: toDateInputValue(item?.end_date),
      status: item?.status || "open",
      summary: item?.summary || ""
    }),
    fromForm: (data) => cleanObject({
      caseName: data.caseName,
      clientName: data.clientName,
      startDate: dateInputToIso(data.startDate),
      endDate: dateInputToIso(data.endDate),
      status: data.status,
      summary: data.summary
    }),
    inline: {
      case_name: { type: "text", payloadKey: "caseName" },
      client_name: { type: "text", payloadKey: "clientName" },
      status: { type: "select", payloadKey: "status", options: OPTION_SETS.caseStatus }
    }
  },
  incident: {
    collection: "incidents",
    label: "Incident",
    createTitle: "Create Incident",
    editTitle: "Edit Incident",
    createAction: "Save Incident",
    updateAction: "Save Incident",
    create: () => ({ url: `/api/cases/${state.selectedCaseId}/incidents`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${id}`, method: "PATCH" }),
    fields: () => [
      { name: "name", label: "Incident Name", type: "text", required: true, autofocus: true },
      { name: "severity", label: "Severity", type: "select", options: OPTION_SETS.incidentSeverity },
      { name: "status", label: "Status", type: "select", options: OPTION_SETS.incidentStatus, required: true },
      { name: "summary", label: "Summary", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      name: item?.name || "",
      severity: item?.severity || "medium",
      status: item?.status || "open",
      summary: item?.summary || ""
    }),
    fromForm: (data) => cleanObject(data),
    inline: {
      name: { type: "text", payloadKey: "name" },
      severity: { type: "select", payloadKey: "severity", options: OPTION_SETS.incidentSeverity },
      status: { type: "select", payloadKey: "status", options: OPTION_SETS.incidentStatus }
    }
  },
  finding: {
    collection: "findings",
    label: "Finding",
    createTitle: "Add Finding",
    editTitle: "Finding Detail",
    createAction: "Save Finding",
    updateAction: "Save Finding",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/findings`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/findings/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/findings/${id}`, method: "DELETE" }),
    fields: (_item, mode) => [
      { name: "title", label: "Title", type: "text", required: true, autofocus: true },
      { name: "status", label: "Status", type: "select", options: OPTION_SETS.findingStatus, required: true },
      { name: "severity", label: "Severity", type: "select", options: ["", ...OPTION_SETS.findingSeverity] },
      { name: "confidence", label: "Confidence", type: "select", options: ["", ...OPTION_SETS.confidence] },
      { name: "description", label: "Long Description", type: "textarea", span: 2 },
      { name: "impact", label: "Impact", type: "textarea", span: 2 },
      { name: "recommendation", label: "Recommendation", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      title: item?.title || "",
      status: item?.status || "draft",
      severity: item?.severity || "",
      confidence: item?.confidence || "",
      ownerUserId: item?.owner_user_id || "",
      description: item?.description || "",
      impact: item?.impact || "",
      recommendation: item?.recommendation || ""
    }),
    fromForm: (data) => cleanObject(data),
    inline: {
      title: { type: "text", payloadKey: "title" },
      status: { type: "select", payloadKey: "status", options: OPTION_SETS.findingStatus },
      severity: { type: "select", payloadKey: "severity", options: ["", ...OPTION_SETS.findingSeverity] },
      confidence: { type: "select", payloadKey: "confidence", options: ["", ...OPTION_SETS.confidence] }
    }
  },
  timeline_event: {
    collection: "timelineEvents",
    label: "Timeline Event",
    createTitle: "Create Timeline Event",
    editTitle: "Timeline Event Detail",
    createAction: "Save Event",
    updateAction: "Save Event",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/timeline-events`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/timeline-events/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/timeline-events/${id}`, method: "DELETE" }),
    fields: (_item, mode) => [
      { name: "title", label: "Title", type: "text", required: true, autofocus: true },
      { name: "eventTime", label: "Event Time", type: "datetime-local", required: true },
      { name: "source", label: "Source", type: "text" },
      { name: "description", label: "Details", type: "textarea", span: 2 },
      { name: "rawEvidenceRef", label: "Raw Evidence Ref", type: "text", span: 2 }
    ],
    values: (item) => ({
      title: item?.title || "",
      eventTime: toLocalInputValue(item?.event_time),
      source: item?.source || "",
      ownerUserId: item?.owner_user_id || "",
      description: item?.description || "",
      rawEvidenceRef: item?.raw_evidence_ref || ""
    }),
    fromForm: (data) => cleanObject({ ...data, eventTime: localDateTimeToIso(data.eventTime) }),
    inline: {
      title: { type: "text", payloadKey: "title" },
      event_time: { type: "datetime-local", payloadKey: "eventTime", displayToDraft: toLocalInputValue, draftToPayload: localDateTimeToIso },
      source: { type: "text", payloadKey: "source" }
    }
  },
  task: {
    collection: "tasks",
    label: "Task",
    createTitle: "Create Task",
    editTitle: "Task Detail",
    createAction: "Save Task",
    updateAction: "Save Task",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/tasks`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/tasks/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/tasks/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "title", label: "Title", type: "text", required: true, autofocus: true },
      { name: "status", label: "Status", type: "select", options: OPTION_SETS.taskStatus, required: true },
      { name: "priority", label: "Priority", type: "select", options: OPTION_SETS.taskPriority, required: true },
      { name: "assigneeUserId", label: "Assignee", type: "member-select" },
      { name: "ownerUserId", label: "Owner", type: "member-select" },
      { name: "dueAt", label: "Due At", type: "datetime-local" },
      { name: "description", label: "Description", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      title: item?.title || "",
      status: item?.status || "todo",
      priority: item?.priority || "medium",
      assigneeUserId: item?.assignee_user_id || "",
      ownerUserId: item?.owner_user_id || "",
      dueAt: toLocalInputValue(item?.due_at),
      description: item?.description || ""
    }),
    fromForm: (data) => cleanObject({ ...data, dueAt: localDateTimeToIso(data.dueAt) }),
    inline: {
      title: { type: "text", payloadKey: "title" },
      status: { type: "select", payloadKey: "status", options: OPTION_SETS.taskStatus },
      priority: { type: "select", payloadKey: "priority", options: OPTION_SETS.taskPriority },
      assignee_user_id: { type: "member-select", payloadKey: "assigneeUserId" },
      due_at: { type: "datetime-local", payloadKey: "dueAt", displayToDraft: toLocalInputValue, draftToPayload: localDateTimeToIso }
    }
  },
  query: {
    collection: "queries",
    label: "Query",
    createTitle: "Create Query",
    editTitle: "Query Detail",
    createAction: "Save Query",
    updateAction: "Save Query",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/queries`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/queries/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/queries/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "name", label: "Name", type: "text", required: true, autofocus: true },
      { name: "language", label: "Language", type: "text", required: true },
      { name: "ownerUserId", label: "Owner", type: "member-select" },
      { name: "description", label: "Description", type: "textarea", span: 2 },
      { name: "queryBody", label: "Query Body", type: "code", span: 2, required: true }
    ],
    values: (item) => ({
      name: item?.name || "",
      language: item?.language || "spl",
      ownerUserId: item?.owner_user_id || "",
      description: item?.description || "",
      queryBody: item?.query_body || ""
    }),
    fromForm: (data) => cleanObject(data),
    inline: {
      name: { type: "text", payloadKey: "name" },
      language: { type: "text", payloadKey: "language" },
      owner_user_id: { type: "member-select", payloadKey: "ownerUserId" }
    }
  },
  indicator: {
    collection: "indicators",
    label: "Indicator",
    createTitle: "Add Indicator",
    editTitle: "Indicator Detail",
    createAction: "Save Indicator",
    updateAction: "Save Indicator",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/indicators`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/indicators/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/indicators/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "indicatorType", label: "Type", type: "select", options: OPTION_SETS.indicatorType, required: true, autofocus: true },
      { name: "value", label: "Value", type: "text", required: true },
      { name: "confidence", label: "Confidence", type: "select", options: ["", ...OPTION_SETS.confidence] },
      { name: "source", label: "Source", type: "text" },
      { name: "firstSeenAt", label: "First Seen", type: "datetime-local" },
      { name: "lastSeenAt", label: "Last Seen", type: "datetime-local" },
      { name: "description", label: "Description", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      indicatorType: item?.indicator_type || "host",
      value: item?.value || "",
      confidence: item?.confidence || "",
      source: item?.source || "",
      firstSeenAt: toLocalInputValue(item?.first_seen_at),
      lastSeenAt: toLocalInputValue(item?.last_seen_at),
      description: item?.description || ""
    }),
    fromForm: (data) => cleanObject({
      ...data,
      firstSeenAt: localDateTimeToIso(data.firstSeenAt),
      lastSeenAt: localDateTimeToIso(data.lastSeenAt)
    }),
    inline: {
      indicator_type: { type: "select", payloadKey: "indicatorType", options: OPTION_SETS.indicatorType },
      value: { type: "text", payloadKey: "value" },
      confidence: { type: "select", payloadKey: "confidence", options: ["", ...OPTION_SETS.confidence] },
      source: { type: "text", payloadKey: "source" }
    }
  },
  system: {
    collection: "systems",
    label: "System",
    createTitle: "Add System",
    editTitle: "System Detail",
    createAction: "Save System",
    updateAction: "Save System",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/systems`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/systems/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/systems/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "hostname", label: "Hostname", type: "text", required: true, autofocus: true },
      { name: "ipAddress", label: "IP Address", type: "text" },
      { name: "os", label: "OS", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["", ...OPTION_SETS.systemStatus] },
      { name: "owner", label: "Owner", type: "text" },
      { name: "notes", label: "Notes", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      hostname: item?.hostname || "",
      ipAddress: item?.ip_address || "",
      os: item?.os || "",
      status: item?.status || "",
      owner: item?.owner || "",
      notes: item?.notes || ""
    }),
    fromForm: (data) => cleanObject(data),
    inline: {
      hostname: { type: "text", payloadKey: "hostname" },
      ip_address: { type: "text", payloadKey: "ipAddress" },
      os: { type: "text", payloadKey: "os" },
      status: { type: "select", payloadKey: "status", options: ["", ...OPTION_SETS.systemStatus] },
      owner: { type: "text", payloadKey: "owner" }
    }
  },
  account: {
    collection: "accounts",
    label: "Account",
    createTitle: "Add Account",
    editTitle: "Account Detail",
    createAction: "Save Account",
    updateAction: "Save Account",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/accounts`, method: "POST" }),
    update: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/accounts/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/incidents/${state.selectedIncidentId}/accounts/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "username", label: "Username", type: "text", required: true, autofocus: true },
      { name: "domain", label: "Domain", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["", ...OPTION_SETS.accountStatus] },
      { name: "owner", label: "Owner", type: "text" },
      { name: "notes", label: "Notes", type: "textarea", span: 2 }
    ],
    values: (item) => ({
      username: item?.username || "",
      domain: item?.domain || "",
      status: item?.status || "",
      owner: item?.owner || "",
      notes: item?.notes || ""
    }),
    fromForm: (data) => cleanObject(data),
    inline: {
      username: { type: "text", payloadKey: "username" },
      domain: { type: "text", payloadKey: "domain" },
      status: { type: "select", payloadKey: "status", options: ["", ...OPTION_SETS.accountStatus] },
      owner: { type: "text", payloadKey: "owner" }
    }
  }
};
