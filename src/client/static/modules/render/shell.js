import { activeCase, activeIncident, state, WORKSPACE_SECTIONS } from "../state.js";
import { can, permissionAttrs } from "../permissions.js";
import { escapeHtml, renderOptions, roleLabel } from "../helpers.js";
import { renderModal } from "./modal.js";
import { renderTablePanel } from "./table.js";
import { TABLE_DEFINITIONS } from "../tableDefinitions.js";
import { renderTasksView } from "./tasks.js";
import { renderAdminView } from "./admin.js";

const root = document.querySelector("#app");

export function renderApp() {
  root.innerHTML = `
    <div class="app-shell">
      ${renderTopNavigation()}
      ${state.ui.activeSection === "cases" ? renderCasesLanding() : renderWorkspace()}
    </div>
    ${renderModal()}
  `;
  focusActiveControl();
}

function renderTopNavigation() {
  const unseen = state.notifications.filter((entry) => entry.unseen).length;
  return `
    <header class="app-header">
      <button class="brand-mark" type="button" data-action="set-section" data-section="cases" aria-label="Open cases">
        <span class="brand-icon">F</span>
        <span>
          <strong>Forenotes</strong>
          <small>Investigation workspace</small>
        </span>
      </button>
      <nav class="header-nav" aria-label="Workspace navigation">
        <button class="${navClass("cases")}" type="button" data-action="set-section" data-section="cases">Cases</button>
        ${WORKSPACE_SECTIONS
          .filter((section) => !section.permission || can(section.permission))
          .map((section) => `<button class="${navClass(section.key)}" type="button" data-action="set-section" data-section="${escapeHtml(section.key)}">${escapeHtml(section.label)}</button>`)
          .join("")}
      </nav>
      <div class="session-tools">
        <form class="global-search" data-form="global-search">
          <input type="search" name="query" placeholder="Search current scope" value="${escapeHtml(state.ui.globalSearch)}" />
          <button class="secondary-button" type="submit">Search</button>
        </form>
        <select data-action="change-active-user" aria-label="Active user">
          ${state.users.map((user) => renderOptions([{ value: user.id, label: `${user.display_name} (${user.global_role})` }], state.activeUserId)).join("")}
        </select>
        <button class="ghost-button notification-trigger" type="button" data-action="toggle-notifications">
          Notifications${unseen ? ` (${unseen})` : ""}
        </button>
      </div>
    </header>
  `;
}

function renderCasesLanding() {
  return `
    <main class="page-shell">
      ${renderFlash()}
      <section class="landing-header">
        <div>
          <h1>Current Cases</h1>
          <p>Start from the active case list. Open a case to enter the incident workspace.</p>
        </div>
        <button class="primary-button" type="button" data-action="open-modal" data-entity="case" ${permissionAttrs("case:create", "create cases")}>Create Case</button>
      </section>
      ${renderTablePanel("cases", state.cases, { ...TABLE_DEFINITIONS.cases, createLabel: "" })}
    </main>
  `;
}

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
      <div class="workspace-grid ${state.ui.notificationPanelOpen ? "has-notifications" : "is-collapsed"}">
        <section class="operational-area">${renderActiveSection()}</section>
        ${renderNotificationPanel()}
      </div>
    </main>
  `;
}

function renderContextBar() {
  const selectedCase = activeCase();
  const selectedIncident = activeIncident();
  return `
    <section class="context-bar" aria-label="Workspace context">
      <div class="context-item"><span>Case</span><strong>${escapeHtml(selectedCase?.case_name || "None")}</strong></div>
      <label class="context-item context-select">
        <span>Incident</span>
        <select data-action="select-incident-context">
          ${state.incidents.length ? state.incidents.map((incident) => renderOptions([{ value: incident.id, label: incident.name }], state.selectedIncidentId)).join("") : '<option value="">No incidents</option>'}
        </select>
      </label>
      <div class="context-item"><span>Role</span><strong>${escapeHtml(roleLabel(selectedCase?.user_case_role || state.currentUser?.globalRole))}</strong></div>
      <button class="secondary-button" type="button" data-action="open-modal" data-entity="incident" ${permissionAttrs("incident:create", "create incidents")}>Create Incident</button>
    </section>
  `;
}

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
    case "queries":
      return renderTablePanel("queries", state.queries, TABLE_DEFINITIONS.queries);
    case "notifications":
      return renderTablePanel("notifications", state.notifications, TABLE_DEFINITIONS.notifications, {
        extraActions: `<button class="secondary-button" type="button" data-action="mark-all-read">Mark Visible Read</button>`
      });
    case "audit":
      return renderAuditSection();
    case "admin":
      return renderAdminView();
    default:
      return renderTablePanel("findings", state.findings, TABLE_DEFINITIONS.findings);
  }
}

function renderAuditSection() {
  if (!can("audit:read")) {
    return `<section class="panel"><div class="error-banner">Access denied. Required permission: audit:read</div></section>`;
  }
  return renderTablePanel("audit", state.auditLogs, TABLE_DEFINITIONS.audit);
}

function renderNotificationPanel() {
  if (!state.ui.notificationPanelOpen) {
    return `
      <aside class="notification-rail is-minimized">
        <button class="icon-button" type="button" data-action="toggle-notifications" aria-label="Expand notification panel">${bellIcon()}</button>
      </aside>
    `;
  }

  return `
    <aside class="notification-rail">
      <div class="section-header">
        <div>
          <h2>Notifications</h2>
          <p>${state.notifications.filter((entry) => entry.unseen).length} unread</p>
        </div>
        <button class="icon-button" type="button" data-action="toggle-notifications" aria-label="Collapse notification panel">${chevronIcon()}</button>
      </div>
      <div class="notification-list">
        ${state.notifications.slice(0, 8).map(renderNotificationItem).join("") || `<div class="empty-state">No notifications yet.</div>`}
      </div>
    </aside>
  `;
}

function renderNotificationItem(entry) {
  return `
    <button class="notification-item ${entry.unseen ? "is-unread" : ""}" type="button" data-action="open-notification" data-id="${escapeHtml(entry.id)}">
      <strong>${escapeHtml(entry.title)}</strong>
      <span>${escapeHtml(entry.event_type)} · ${escapeHtml(entry.entity_type || "event")}</span>
    </button>
  `;
}

function renderFlash() {
  return state.ui.flash ? `<div class="${state.ui.flash.kind === "error" ? "error-banner" : "success-banner"}">${escapeHtml(state.ui.flash.message)}</div>` : "";
}

function navClass(key) {
  return `nav-link ${state.ui.activeSection === key ? "is-active" : ""}`;
}

function focusActiveControl() {
  requestAnimationFrame(() => {
    if (state.ui.inlineEdit) {
      root.querySelector("[data-inline-input]")?.focus();
      return;
    }
    root.querySelector("[data-autofocus='true']")?.focus();
  });
}

function bellIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" /><path d="M10 21h4" /></svg>`;
}

function chevronIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg>`;
}
