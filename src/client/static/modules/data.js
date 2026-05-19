import { api } from "./api.js";
import { can } from "./permissions.js";
import { activeCase, clearIncidentScope, setFlash, state } from "./state.js";

export async function refreshAll() {
  state.loading = true;
  await loadUsers();
  ensureActiveUser();

  if (!state.activeUserId) {
    state.loading = false;
    return;
  }

  await hydrateSession();
  await Promise.all([loadCases(), loadAttackTags(), refreshNotifications(), loadDashboardSummary()]);

  if (state.selectedCaseId && !state.cases.some((entry) => entry.id === state.selectedCaseId)) {
    state.selectedCaseId = "";
  }

  if (state.selectedCaseId) {
    await refreshCaseScope();
  } else {
    clearCaseScope();
  }

  state.loading = false;
}

export async function loadUsers() {
  state.users = (await api("/api/users", "GET", null, false)).users;
}

export async function hydrateSession() {
  const response = await api("/api/auth/me", "GET");
  state.currentUser = response.user;
  state.permissions = response.permissions || [];
}

export async function loadCases() {
  state.cases = (await api("/api/cases", "GET")).cases;
}

export async function loadAttackTags() {
  state.attackTags = (await api("/api/attack-tags", "GET", null, false)).attackTags;
}

export async function refreshCaseScope() {
  if (!state.selectedCaseId) {
    clearCaseScope();
    return;
  }

  const [members, customTags, incidents] = await Promise.all([
    api(`/api/cases/${state.selectedCaseId}/members`, "GET"),
    api(`/api/cases/${state.selectedCaseId}/custom-tags`, "GET"),
    api(`/api/cases/${state.selectedCaseId}/incidents`, "GET")
  ]);

  state.caseMembers = members.members;
  state.customTags = customTags.customTags;
  state.incidents = incidents.incidents;

  if (!state.incidents.some((entry) => entry.id === state.selectedIncidentId)) {
    state.selectedIncidentId = state.incidents[0]?.id || "";
  }

  if (state.selectedIncidentId) {
    await refreshIncidentScope();
  } else {
    clearIncidentScope();
    await refreshAuditLogs();
  }
}

export async function refreshIncidentScope() {
  if (!state.selectedIncidentId) {
    clearIncidentScope();
    return;
  }

  const incidentId = state.selectedIncidentId;
  const [members, findings, timelineEvents, indicators, systems, accounts, tasks, queries, entityLinks] = await Promise.all([
    api(`/api/incidents/${incidentId}/members`, "GET"),
    api(`/api/incidents/${incidentId}/findings`, "GET"),
    api(`/api/incidents/${incidentId}/timeline-events`, "GET"),
    api(`/api/incidents/${incidentId}/indicators`, "GET"),
    api(`/api/incidents/${incidentId}/systems`, "GET"),
    api(`/api/incidents/${incidentId}/accounts`, "GET"),
    api(`/api/incidents/${incidentId}/tasks`, "GET"),
    api(`/api/incidents/${incidentId}/queries`, "GET"),
    api(`/api/incidents/${incidentId}/entity-links`, "GET")
  ]);

  state.incidentMembers = members.members;
  state.findings = findings.findings;
  state.timelineEvents = timelineEvents.timelineEvents;
  state.indicators = indicators.indicators;
  state.systems = systems.systems;
  state.accounts = accounts.accounts;
  state.tasks = tasks.tasks;
  state.queries = queries.queries;
  state.entityLinks = entityLinks.entityLinks;

  await Promise.all([refreshNotifications(), refreshAuditLogs(), refreshGraphData()]);
}

export async function refreshNotifications() {
  try {
    state.notifications = (await api("/api/notifications", "GET")).notifications;
  } catch {
    state.notifications = [];
  }
}

export async function loadDashboardSummary() {
  try {
    state.dashboardSummary = (await api("/api/dashboard", "GET")).summary;
  } catch {
    state.dashboardSummary = null;
  }
}

export async function refreshAuditLogs() {
  if (!can("audit:read")) {
    state.auditLogs = [];
    return;
  }

  const caseId = state.selectedCaseId || activeCase()?.id;
  const params = new URLSearchParams();
  if (state.selectedIncidentId) {
    params.set("incidentId", state.selectedIncidentId);
  } else if (caseId) {
    params.set("caseId", caseId);
  }

  try {
    state.auditLogs = (await api(`/api/audit-logs?${params.toString()}`, "GET")).auditLogs;
  } catch {
    state.auditLogs = [];
  }
}

export async function selectCase(caseId) {
  state.selectedCaseId = caseId;
  state.selectedIncidentId = "";
  state.ui.activeSection = "findings";
  await refreshCaseScope();
}

export async function selectIncident(incidentId) {
  state.selectedIncidentId = incidentId;
  await refreshIncidentScope();
}

export async function refreshGraphData() {
  if (!state.selectedIncidentId) return;
  const g = state.ui.graph;
  try {
    const [graphData, matrixData] = await Promise.all([
      import("./graphApi.js").then((m) =>
        m.fetchIncidentGraph(state.selectedIncidentId, {
          mode: g.mode,
          entityTypes: g.entityTypes,
          linkTypes: g.linkTypes,
          includeDerived: g.includeDerived,
          includeManual: g.includeManual,
          depth: g.depth,
          q: g.q || undefined
        })
      ),
      import("./graphApi.js").then((m) =>
        m.fetchMitreMatrix(state.selectedIncidentId, {
          includeSubtechniques: g.matrixIncludeSubtechniques,
          minEvidence: g.matrixMinEvidence || undefined,
          q: g.matrixQ || undefined,
          tactic: g.matrixTactic || undefined,
          entityType: g.matrixEntityType || undefined
        })
      )
    ]);
    g.data = graphData;
    g.matrix = matrixData;
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export async function refreshAfterEntityChange(entityType) {
  if (entityType === "user") {
    await refreshAll();
    return;
  }
  if (["case", "case_member", "custom_tag"].includes(entityType)) {
    await loadCases();
    await refreshCaseScope();
    await refreshNotifications();
    await loadDashboardSummary();
    return;
  }
  if (entityType === "incident" || entityType === "incident_member" || requiresIncident(entityType)) {
    await refreshCaseScope();
    await refreshNotifications();
    await loadDashboardSummary();
    return;
  }
}

export function requiresCase(entityType) {
  return ["incident", "custom_tag", "case_member"].includes(entityType);
}

export function requiresIncident(entityType) {
  return ["finding", "timeline_event", "task", "query", "indicator", "system", "account", "incident_member"].includes(entityType);
}

function ensureActiveUser() {
  if (state.activeUserId && !state.users.some((user) => user.id === state.activeUserId)) {
    state.activeUserId = "";
    localStorage.removeItem("forenotes.activeUserId");
  }
  if (!state.activeUserId && state.users[0]) {
    state.activeUserId = state.users[0].id;
    localStorage.setItem("forenotes.activeUserId", state.activeUserId);
  }
}

function clearCaseScope() {
  state.caseMembers = [];
  state.incidents = [];
  state.customTags = [];
  state.selectedIncidentId = "";
  clearIncidentScope();
}
