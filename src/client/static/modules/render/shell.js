import { activeCase, activeIncident, SIDEBAR_NAV_ITEMS, state } from "../state.js";
import { can, permissionAttrs } from "../permissions.js";
import { escapeHtml, formatDateTime, renderOptions, roleLabel } from "../helpers.js";
import { renderModal } from "./modal.js";
import { renderTablePanel } from "./table.js";
import { TABLE_DEFINITIONS } from "../tableDefinitions.js";
import { renderTasksView } from "./tasks.js";
import { renderAdminView } from "./admin.js";
import { renderDashboardView } from "./dashboard.js";
import { renderGraphWorkspace } from "./graph.js";

const root = document.querySelector("#app");

export function renderApp() {
  root.innerHTML = `
    <div class="app-shell ${state.ui.sidebarExpanded ? "" : "sidebar-collapsed"}">
      ${renderSidebarRail()}
      ${renderSidebarPanel()}
      <div class="app-main">
        ${renderTopBar()}
        ${renderMainContent()}
      </div>
    </div>
    ${renderModal()}
  `;
  focusActiveControl();
}

function renderMainContent() {
  if (state.ui.activeSection === "dashboard") {
    return renderDashboardView();
  }
  if (state.ui.activeSection === "cases") {
    return renderCasesLanding();
  }
  return renderWorkspace();
}

/* ── Sidebar Icon Rail (always visible) ── */

function renderSidebarRail() {
  return `
    <nav class="sidebar-rail" aria-label="Icon navigation">
      <button class="rail-item rail-brand" type="button" data-action="set-section" data-section="dashboard" aria-label="Dashboard">
        <span class="rail-brand-icon">F</span>
      </button>
      <div class="rail-sep" aria-hidden="true"></div>
      ${SIDEBAR_NAV_ITEMS
        .filter((item) => item.key !== "dashboard")
        .map((item) => `
          <button class="rail-item ${state.ui.activeSection === item.key ? "is-active" : ""}" type="button" data-action="set-section" data-section="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}">
            ${iconSVG(item.icon)}
          </button>
        `).join("")}
      <div class="rail-spacer" aria-hidden="true"></div>
      <button class="rail-item" type="button" data-action="toggle-sidebar" aria-label="${state.ui.sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}" title="${state.ui.sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}">
        ${state.ui.sidebarExpanded ? iconSVG("chevron-left") : iconSVG("chevron-right")}
      </button>
    </nav>
  `;
}

/* ── Sidebar Expanded Panel ── */

function renderSidebarPanel() {
  return `
    <aside class="sidebar-panel" aria-label="Workspace navigation">
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon">F</span>
        <div class="sidebar-brand-text">
          <strong>Forenotes</strong>
          <small>Investigation workspace</small>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${SIDEBAR_NAV_ITEMS.map((item) => `
          <button class="sidebar-nav-item ${state.ui.activeSection === item.key ? "is-active" : ""}" type="button" data-action="set-section" data-section="${escapeHtml(item.key)}">
            ${iconSVG(item.icon)}
            <span>${escapeHtml(item.label)}</span>
          </button>
        `).join("")}
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-collapse-btn" type="button" data-action="toggle-sidebar" aria-label="Collapse sidebar" title="Collapse sidebar">
          ${iconSVG("chevron-left")}
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  `;
}

/* ── Top Bar (inside app-main) ── */

function renderTopBar() {
  const selectedCase = activeCase();
  return `
    <header class="app-header" aria-label="Session toolbar">
      <div class="header-context">
        ${selectedCase ? `
          <span class="context-breadcrumb">
            <span class="context-breadcrumb-case">${escapeHtml(selectedCase.case_name)}</span>
            ${activeIncident() ? `<span class="context-breadcrumb-sep" aria-hidden="true">/</span><span class="context-breadcrumb-incident">${escapeHtml(activeIncident().name)}</span>` : ""}
          </span>
        ` : `<span class="context-breadcrumb is-dimmed">No case selected</span>`}
      </div>
      <div class="header-tools">
        <form class="global-search" data-form="global-search">
          <input type="search" name="query" placeholder="Search current scope" value="${escapeHtml(state.ui.globalSearch)}" />
        </form>
        <select data-action="change-active-user" aria-label="Active user">
          ${state.users.map((user) => renderOptions([ {value: user.id, label: `${user.display_name} (${user.global_role})` }], state.activeUserId)).join("")}
        </select>
      </div>
    </header>
  `;
}

/* ── Cases Landing ── */

function renderCasesLanding() {
  return `
    <main class="page-shell">
      ${renderFlash()}
      <section class="landing-header">
        <div>
          <h1>Current Cases</h1>
          <p>Select a case to enter the investigation workspace, or create a new case.</p>
        </div>
        <button class="primary-button" type="button" data-action="open-modal" data-entity="case" ${permissionAttrs("case:create", "create cases")}>Create Case</button>
      </section>
      ${renderTablePanel("cases", state.cases, { ...TABLE_DEFINITIONS.cases, createLabel: "" })}
    </main>
  `;
}

/* ── Workspace ── */

function renderWorkspace() {
  if (!state.selectedCaseId) {
    return `
      <main class="page-shell">
        ${renderFlash()}
        <div class="empty-state is-large">Select a case from the Current Cases table before entering workspace sections.</div>
        ${renderTablePanel("cases", state.cases, TABLE_DEFINITIONS.cases)}
      </main>
    `;
  }

  return `
    <main class="workspace-root">
      ${renderContextBar()}
      ${renderFlash()}
      <div class="operational-area">${renderActiveSection()}</div>
    </main>
  `;
}

/* ── Context Bar ── */

function renderContextBar() {
  const selectedCase = activeCase();
  const selectedIncident = activeIncident();
  return `
    <section class="context-bar" aria-label="Workspace context">
      <div class="context-item"><span>Case</span><strong>${escapeHtml(selectedCase?.case_name || "None")}</strong></div>
      <label class="context-item context-select">
        <span>Incident</span>
        <select data-action="select-incident-context">
          ${state.incidents.length ? state.incidents.map((incident) => renderOptions([ {value: incident.id, label: incident.name }], state.selectedIncidentId)).join("") : '<option value="">No incidents</option>'}
        </select>
      </label>
      <div class="context-item"><span>Role</span><strong>${escapeHtml(roleLabel(selectedCase?.user_case_role || state.currentUser?.globalRole))}</strong></div>
      <button class="secondary-button" type="button" data-action="open-modal" data-entity="incident" ${permissionAttrs("incident:create", "create incidents")}>Create Incident</button>
    </section>
  `;
}

/* ── Active Section Router ── */

function renderActiveSection() {
  switch (state.ui.activeSection) {
    case "findings":
      return `
        ${state.searchResults.length ? renderTablePanel("search", state.searchResults, TABLE_DEFINITIONS.search) : ""}
        ${renderTablePanel("findings", state.findings, TABLE_DEFINITIONS.findings)}
      `;
    case "timeline":
      return renderTablePanel("timeline", state.timelineEvents, TABLE_DEFINITIONS.timeline);
    case "tasks":
      return renderTasksView();
    case "entities":
      return renderEntitiesSection();
    case "queries":
      return renderTablePanel("queries", state.queries, TABLE_DEFINITIONS.queries);
    case "graph":
      return renderGraphWorkspace();
    case "tags":
      return `
        ${renderTablePanel("customTags", state.customTags, TABLE_DEFINITIONS.customTags)}
        ${renderTablePanel("attackTags", state.attackTags, TABLE_DEFINITIONS.attackTags)}
      `;
    case "notifications":
      return renderTablePanel("notifications", state.notifications, TABLE_DEFINITIONS.notifications, {
        extraActions: `<button class="secondary-button" type="button" data-action="mark-all-read">Mark Visible Read</button>`
      });
    case "audit":
      return renderAuditSection();
    case "settings":
      return renderAdminView();
    default:
      return renderTablePanel("findings", state.findings, TABLE_DEFINITIONS.findings);
  }
}

/* ── Entities Combined Section ── */

const ENTITY_TABS = [
  { key: "indicators", label: "Indicators", tableKey: "indicators", collection: "indicators", def: () => TABLE_DEFINITIONS.indicators },
  { key: "systems", label: "Systems", tableKey: "systems", collection: "systems", def: () => TABLE_DEFINITIONS.systems },
  { key: "accounts", label: "Accounts", tableKey: "accounts", collection: "accounts", def: () => TABLE_DEFINITIONS.accounts }
];

function renderEntitiesSection() {
  if (!state.selectedIncidentId) {
    return `<section class="panel"><div class="empty-state is-large">Select an incident to browse entities.</div></section>`;
  }
  return `
    <div class="entity-tab-bar">
      ${ENTITY_TABS.map((tab) => `
        <button class="entity-tab ${state.ui.entityTab === tab.key ? "is-active" : ""}" type="button" data-action="set-entity-tab" data-entity-tab="${escapeHtml(tab.key)}">
          ${escapeHtml(tab.label)}
        </button>
      `).join("")}
    </div>
    ${renderActiveEntityTab()}
  `;
}

function renderActiveEntityTab() {
  const activeTab = ENTITY_TABS.find((tab) => tab.key === state.ui.entityTab) || ENTITY_TABS[0];
  return renderTablePanel(activeTab.tableKey, state[activeTab.collection], activeTab.def());
}

/* ── Audit ── */

function renderAuditSection() {
  if (!can("audit:read")) {
    return `<section class="panel"><div class="error-banner">Access denied. Required permission: audit:read</div></section>`;
  }
  return renderTablePanel("audit", state.auditLogs, TABLE_DEFINITIONS.audit);
}


/* ── Flash ── */

function renderFlash() {
  return state.ui.flash ? `<div class="${state.ui.flash.kind === "error" ? "error-banner" : "success-banner"}">${escapeHtml(state.ui.flash.message)}</div>` : "";
}

/* ── Helpers ── */

function focusActiveControl() {
  requestAnimationFrame(() => {
    if (state.ui.inlineEdit) {
      root.querySelector("[data-inline-input]")?.focus();
      return;
    }
    root.querySelector("[data-autofocus='true']")?.focus();
  });
}

/* ── SVG Icons ── */

function iconSVG(name) {
  const icons = {
    dashboard: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></svg>`,
    cases: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1.5l-1.2-2.4A1 1 0 0 0 15.5 4h-7a1 1 0 0 0-.8.6L6.5 7H5a2 2 0 0 0-2 2z"/><path d="M3 13h18"/></svg>`,
    findings: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"/><line x1="16" y1="16" x2="21" y2="21"/></svg>`,
    timeline: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>`,
    tasks: `<svg aria-hidden="true" viewBox="0 0 24 24"><polyline points="9 11 11 13 15 9"/><rect x="4" y="4" width="16" height="16" rx="2.4"/></svg>`,
    entities: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" rx="1.4"/><rect x="13" y="2" width="9" height="9" rx="1.4"/><rect x="2" y="13" width="9" height="9" rx="1.4"/><rect x="13" y="13" width="9" height="9" rx="1.4"/></svg>`,
    queries: `<svg aria-hidden="true" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    graph: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="6" x2="6" y2="17"/><line x1="16" y1="6" x2="18" y2="17"/><line x1="6" y1="18" x2="16" y2="6"/></svg>`,
    tags: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 9.5 9.5 3l9 1.5L20 13.5 13.5 20z"/><circle cx="15.5" cy="8.5" r="1.2"/></svg>`,
    notifications: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z"/><path d="M10 21h4"/></svg>`,
    settings: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.8"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M4.9 19.1l2.1-2.1m10-10 2.1-2.1"/></svg>`,
    "chevron-left": `<svg aria-hidden="true" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
    "chevron-right": `<svg aria-hidden="true" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`
  };
  return icons[name] || "";
}
