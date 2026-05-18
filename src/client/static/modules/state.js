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
  globalRole: ["commander", "response_lead", "analyst"],
  evidenceType: ["timeline_event", "indicator", "system", "account", "query"]
};

export const TASK_BOARD_COLUMNS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" }
];

export const SIDEBAR_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "cases", label: "Cases", icon: "cases" },
  { key: "findings", label: "Findings", icon: "findings" },
  { key: "timeline", label: "Timeline", icon: "timeline" },
  { key: "tasks", label: "Tasks", icon: "tasks" },
  { key: "entities", label: "Entities", icon: "entities" },
  { key: "queries", label: "Queries", icon: "queries" },
  { key: "tags", label: "Tags", icon: "tags" },
  { key: "notifications", label: "Notifications", icon: "notifications" },
  { key: "settings", label: "Settings", icon: "settings" }
];

export function makeTableState(sortField, sortDir = "desc") {
  return {
    search: "",
    sortField,
    sortDir,
    page: 1,
    pageSize: 10
  };
}

export const state = {
  loading: true,
  users: [],
  activeUserId: localStorage.getItem("forenotes.activeUserId") || "",
  currentUser: null,
  permissions: [],
  cases: [],
  selectedCaseId: "",
  incidents: [],
  selectedIncidentId: "",
  caseMembers: [],
  incidentMembers: [],
  customTags: [],
  attackTags: [],
  findings: [],
  timelineEvents: [],
  indicators: [],
  systems: [],
  accounts: [],
  tasks: [],
  queries: [],
  notifications: [],
  auditLogs: [],
  searchResults: [],
  ui: {
    activeSection: "dashboard",
    sidebarExpanded: true,
    taskView: "board",
    modal: null,
    inlineEdit: null,
    flash: null,
    globalSearch: "",
    table: {
      cases: makeTableState("updated_at"),
      incidents: makeTableState("updated_at"),
      findings: makeTableState("updated_at"),
      timeline: makeTableState("event_time"),
      tasks: makeTableState("updated_at"),
      queries: makeTableState("updated_at"),
      attackTags: makeTableState("attack_id", "asc"),
      indicators: makeTableState("updated_at"),
      systems: makeTableState("updated_at"),
      accounts: makeTableState("updated_at"),
      notifications: makeTableState("created_at"),
      audit: makeTableState("created_at"),
      users: makeTableState("display_name", "asc"),
      members: makeTableState("display_name", "asc"),
      search: makeTableState("title", "asc")
    }
  }
};

export function setFlash(kind, message) {
  state.ui.flash = { kind, message };
}

export function clearFlash() {
  state.ui.flash = null;
}

export function clearIncidentScope() {
  state.incidentMembers = [];
  state.findings = [];
  state.timelineEvents = [];
  state.indicators = [];
  state.systems = [];
  state.accounts = [];
  state.tasks = [];
  state.queries = [];
  state.auditLogs = [];
  state.searchResults = [];
}

export function activeCase() {
  return state.cases.find((entry) => entry.id === state.selectedCaseId) || null;
}

export function activeIncident() {
  return state.incidents.find((entry) => entry.id === state.selectedIncidentId) || null;
}
