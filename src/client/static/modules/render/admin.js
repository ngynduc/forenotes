import { permissionAttrs } from "../permissions.js";
import { escapeHtml } from "../helpers.js";
import { state } from "../state.js";
import { TABLE_DEFINITIONS } from "../tableDefinitions.js";
import { renderTablePanel } from "./table.js";

export function renderAdminView() {
  return `
    <div class="admin-grid">
      ${renderMembersPanel("Case Members", "case", state.caseMembers, "case_member", "case:member_manage")}
      ${renderMembersPanel("Incident Members", "incident", state.incidentMembers, "incident_member", "incident:member_manage")}
    </div>
    <div class="admin-grid">
      ${renderTablePanel("incidents", state.incidents, TABLE_DEFINITIONS.incidents)}
      ${renderTablePanel("users", state.users, TABLE_DEFINITIONS.users)}
    </div>
    ${renderTablePanel("customTags", state.customTags, TABLE_DEFINITIONS.customTags)}
  `;
}

function renderMembersPanel(title, scope, rows, entityType, permission) {
  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>Membership is scoped and permission checked on the server.</p>
        </div>
        <button class="primary-button" type="button" data-action="open-modal" data-entity="${escapeHtml(entityType)}" ${permissionAttrs(permission, "manage members")}>Add</button>
      </div>
      <div class="member-list">
        ${rows.map((member) => renderMember(member, scope, permission)).join("") || `<div class="empty-state">No ${escapeHtml(scope)} members yet.</div>`}
      </div>
    </section>
  `;
}

function renderMember(member, scope, permission) {
  return `
    <div class="member-row">
      <div>
        <strong>${escapeHtml(member.display_name)}</strong>
        <span>${escapeHtml(member.email)} · ${escapeHtml(scope === "case" ? member.case_role : member.incident_role)}</span>
      </div>
      <button class="danger-button" type="button" data-action="remove-member" data-scope="${escapeHtml(scope)}" data-id="${escapeHtml(member.user_id)}" ${permissionAttrs(permission, "remove members")}>Remove</button>
    </div>
  `;
}
