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
  { key: "graph", label: "Graph", icon: "graph" },
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
  dashboardSummary: null,
  ui: {
    activeSection: "dashboard",
    sidebarExpanded: true,
    taskView: "board",
    entityTab: "indicators",
    graphView: "relationship",
    graph: {
      data: null,
      matrix: null,
      selectedNodeId: null,
      selectedTechniqueId: null,
      mode: "overview",
      entityTypes: [],
      linkTypes: [],
      includeDerived: true,
      includeManual: true,
      depth: "all",
      q: "",
      matrixQ: "",
      matrixTactic: "",
      matrixEntityType: "",
      matrixIncludeSubtechniques: true,
      matrixMinEvidence: 1,
      panX: 0,
      panY: 0,
      zoom: 1
    },
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

let _flashTimer = null;

export function setFlash(kind, message) {
  if (_flashTimer) {
    clearTimeout(_flashTimer);
    _flashTimer = null;
  }
  state.ui.flash = { kind, message };
  if (kind === "success") {
    _flashTimer = setTimeout(() => {
      state.ui.flash = null;
      _flashTimer = null;
      window.dispatchEvent(new CustomEvent("forenotes:rerender"));
    }, 4000);
  }
}

export function clearFlash() {
  if (_flashTimer) {
    clearTimeout(_flashTimer);
    _flashTimer = null;
  }
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
