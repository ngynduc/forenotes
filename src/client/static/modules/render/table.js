import { ENTITY_DEFINITIONS } from "../entities.js";
import { MEMBERSHIP_ENTITY_DEFINITIONS, memberOptions } from "../membershipEntities.js";
import { requiresCase, requiresIncident } from "../data.js";
import { actionPermission, can, permissionAttrs } from "../permissions.js";
import { comparableValue, compactText, escapeHtml, renderOptions } from "../helpers.js";
import { makeTableState, state } from "../state.js";

const ALL_ENTITIES = { ...ENTITY_DEFINITIONS, ...MEMBERSHIP_ENTITY_DEFINITIONS };

export function renderTablePanel(key, rows, definition, options = {}) {
  const tableState = state.ui.table[key] || makeTableState(definition.columns[0]?.sortKey || definition.columns[0]?.key || "created_at");
  const prepared = prepareRows(rows, definition, tableState);
  const createPermission = actionPermission(definition.entityType, "create");

  return `
    <section class="panel table-panel ${options.compact ? "is-compact" : ""}">
      ${options.compact ? "" : renderPanelHeader(definition, options, createPermission)}
      <div class="table-toolbar">
        <input
          type="search"
          placeholder="Filter this table"
          value="${escapeHtml(tableState.search)}"
          data-action="table-search"
          data-table="${escapeHtml(key)}"
        />
        <div class="table-meta">
          <span>${prepared.total} total</span>
          <select data-action="page-size" data-table="${escapeHtml(key)}">
            ${renderOptions([10, 25, 50, 100].map((value) => ({ value: String(value), label: `${value} / page` })), String(tableState.pageSize))}
          </select>
        </div>
      </div>
      ${prepared.pageRows.length ? renderTable(definition, prepared.pageRows, key, tableState) : `<div class="empty-state">${escapeHtml(definition.emptyLabel)}</div>`}
      <div class="table-footer">
        <button class="ghost-button" type="button" data-action="page-prev" data-table="${escapeHtml(key)}" ${prepared.page <= 1 ? "disabled" : ""}>Previous</button>
        <span class="page-pill">Page ${prepared.page} / ${prepared.totalPages}</span>
        <button class="ghost-button" type="button" data-action="page-next" data-table="${escapeHtml(key)}" ${prepared.page >= prepared.totalPages ? "disabled" : ""}>Next</button>
      </div>
    </section>
  `;
}

export function prepareRows(rows, definition, tableState) {
  const filtered = rows.filter((row) => matchesSearch(row, definition.columns, tableState.search));
  const sorted = [...filtered].sort((left, right) => compareRows(left, right, tableState.sortField, tableState.sortDir));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / tableState.pageSize));
  const page = Math.min(tableState.page, totalPages);
  const start = (page - 1) * tableState.pageSize;
  return {
    pageRows: sorted.slice(start, start + tableState.pageSize),
    total,
    totalPages,
    page
  };
}

function renderPanelHeader(definition, options, createPermission) {
  const missingContext = requiresCase(definition.entityType) && !state.selectedCaseId
    ? "disabled title=\"Select a case first\""
    : requiresIncident(definition.entityType) && !state.selectedIncidentId
      ? "disabled title=\"Select an incident first\""
      : "";
  const createLabel = definition.createLabel
    ? `<button class="primary-button" type="button" data-action="open-modal" data-entity="${escapeHtml(definition.entityType)}" ${missingContext || permissionAttrs(createPermission, `create ${definition.title.toLowerCase()}`)}>${escapeHtml(definition.createLabel)}</button>`
    : "";

  return `
    <div class="section-header">
      <div>
        <h2>${escapeHtml(definition.title)}</h2>
        <p>${escapeHtml(definition.subtitle || "")}</p>
      </div>
      <div class="toolbar-group">${createLabel}${options.extraActions || ""}</div>
    </div>
  `;
}

function renderTable(definition, rows, tableKey, tableState) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${definition.columns.map((column) => renderHeaderCell(column, tableKey, tableState)).join("")}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows.map((row) => renderRow(row, definition)).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderHeaderCell(column, tableKey, tableState) {
  const field = column.sortKey || column.key;
  const active = tableState.sortField === field;
  const mark = active ? (tableState.sortDir === "asc" ? " ^" : " v") : "";
  return `
    <th>
      <button class="sort-button" type="button" data-action="sort-table" data-table="${escapeHtml(tableKey)}" data-field="${escapeHtml(field)}">
        ${escapeHtml(column.label)}${escapeHtml(mark)}
      </button>
    </th>
  `;
}

function renderRow(row, definition) {
  const entityType = definition.entityType;
  return `
    <tr>
      ${definition.columns.map((column) => renderCell(row, column, entityType)).join("")}
      <td>${renderActions(row, entityType)}</td>
    </tr>
  `;
}

function renderCell(row, column, entityType) {
  const edit = state.ui.inlineEdit;
  const isEditing = edit && edit.entityType === entityType && edit.id === row.id && edit.field === column.key;
  if (isEditing) {
    return `<td>${renderInlineEditor(edit)}</td>`;
  }

  const display = renderCellDisplay(row, column);
  const editable = Boolean(column.editable && ALL_ENTITIES[entityType]?.inline?.[column.key]);
  const permission = actionPermission(entityType, "update");

  return `
    <td>
      <button
        class="cell-button ${editable ? "is-editable" : ""}"
        type="button"
        data-action="${editable && can(permission) ? "edit-cell" : column.title && ALL_ENTITIES[entityType] ? "open-modal" : "noop"}"
        data-entity="${escapeHtml(entityType)}"
        data-id="${escapeHtml(row.id)}"
        data-field="${escapeHtml(column.key)}"
      >${display}</button>
    </td>
  `;
}

function renderCellDisplay(row, column) {
  const rawValue = row[column.key];
  let value = column.format ? column.format(rawValue, row) : rawValue || "-";
  if (column.badge) {
    return `<span class="${column.badge}-badge is-${rawValue}">${escapeHtml(rawValue || "n/a")}</span>`;
  }
  if (column.title) {
    return `<span class="row-title">${escapeHtml(value)}</span><span class="row-subtle">${escapeHtml(compactText(row.description || row.summary || row.query_body || row.id))}</span>`;
  }
  return escapeHtml(value);
}

function renderActions(row, entityType) {
  if (entityType === "case") {
    return `<button class="secondary-button" type="button" data-action="select-case" data-id="${escapeHtml(row.id)}">Open Workspace</button>`;
  }
  if (entityType === "notification") {
    return `
      <div class="row-actions">
        <button class="secondary-button" type="button" data-action="open-notification" data-id="${escapeHtml(row.id)}">Open</button>
        <button class="ghost-button" type="button" data-action="mark-read" data-id="${escapeHtml(row.id)}" ${row.unseen ? "" : "disabled"}>Mark Read</button>
      </div>
    `;
  }
  if (entityType === "audit" || entityType === "search_result") {
    return `<span class="muted">Review</span>`;
  }
  if (!ALL_ENTITIES[entityType]) {
    return `<span class="muted">-</span>`;
  }
  return `<button class="secondary-button" type="button" data-action="open-modal" data-entity="${escapeHtml(entityType)}" data-id="${escapeHtml(row.id)}">Open</button>`;
}

function renderInlineEditor(edit) {
  const control = edit.type === "select" || edit.type === "member-select"
    ? `<select data-inline-input="true">${renderOptions(edit.options, edit.draft)}</select>`
    : `<input type="${escapeHtml(edit.type || "text")}" value="${escapeHtml(edit.draft || "")}" data-inline-input="true" />`;

  return `
    <div class="inline-editor">
      ${control}
      <button class="secondary-button" type="button" data-action="save-inline">Save</button>
      <button class="ghost-button" type="button" data-action="cancel-inline">Cancel</button>
    </div>
  `;
}

function matchesSearch(row, columns, query) {
  if (!query) {
    return true;
  }
  const value = query.toLowerCase();
  return columns.some((column) => String(row[column.key] || "").toLowerCase().includes(value));
}

function compareRows(left, right, key, direction) {
  const leftValue = comparableValue(left[key]);
  const rightValue = comparableValue(right[key]);
  if (leftValue < rightValue) {
    return direction === "asc" ? -1 : 1;
  }
  if (leftValue > rightValue) {
    return direction === "asc" ? 1 : -1;
  }
  return 0;
}

export function inlineOptions(inlineDefinition) {
  if (inlineDefinition.type === "member-select") {
    return [{ value: "", label: "Unassigned" }, ...memberOptions()];
  }
  return (inlineDefinition.options || []).map((entry) => ({ value: String(entry), label: String(entry || "None") }));
}
