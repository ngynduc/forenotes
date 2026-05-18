import { ENTITY_DEFINITIONS } from "../entities.js";
import { availableCaseUserOptions, availableIncidentUserOptions, memberOptions, MEMBERSHIP_ENTITY_DEFINITIONS } from "../membershipEntities.js";
import { actionPermission, can, canAccessEntity, permissionMessage } from "../permissions.js";
import { escapeHtml, renderOptions } from "../helpers.js";
import { state } from "../state.js";

const ALL_ENTITIES = { ...ENTITY_DEFINITIONS, ...MEMBERSHIP_ENTITY_DEFINITIONS };

export function renderModal() {
  if (!state.ui.modal) {
    return "";
  }

  const modal = state.ui.modal;
  const definition = ALL_ENTITIES[modal.entityType];
  if (!definition) {
    return `<div class="error-banner">Unknown entity type: ${escapeHtml(modal.entityType)}</div>`;
  }
  const item = modal.itemId ? findEntityItem(modal.entityType, modal.itemId) : null;
  const mode = modal.itemId ? "update" : "create";
  const permission = actionPermission(modal.entityType, mode);
  const values = definition.values(item);
  const fields = definition.fields(item, mode);

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <div>
            <span class="overline">${escapeHtml(definition.label)}</span>
            <h2 id="modal-title">${escapeHtml(modal.itemId ? definition.editTitle : definition.createTitle)}</h2>
            <p>Keep the quick fields tight; use long fields only where investigation context requires it.</p>
          </div>
          <button class="icon-button" type="button" data-action="close-modal" aria-label="Close modal">${closeIcon()}</button>
        </div>
        ${permission && !canAccessEntity(modal.entityType, mode, item) ? `<div class="error-banner">${escapeHtml(permissionMessage(permission, mode))}</div>` : ""}
        <form class="modal-form" data-form="modal" data-entity="${escapeHtml(modal.entityType)}" data-id="${escapeHtml(modal.itemId || "")}">
          <div class="modal-grid">
            ${fields.map((field) => renderField(field, values[field.name] ?? "")).join("")}
          </div>
          <div class="modal-actions">
            <div class="toolbar-group">
              <button class="primary-button" type="button" data-action="submit-modal" ${permission && !canAccessEntity(modal.entityType, mode, item) ? "disabled" : ""}>
                ${escapeHtml(modal.itemId ? definition.updateAction : definition.createAction)}
              </button>
              <button class="ghost-button" type="button" data-action="close-modal">Cancel</button>
            </div>
            ${renderDeleteButton(modal, definition)}
          </div>
        </form>
      </section>
    </div>
  `;
}

export function findEntityItem(entityType, id) {
  const definition = ALL_ENTITIES[entityType];
  if (!definition?.collection) {
    return null;
  }
  return state[definition.collection].find((entry) => entry.id === id) || null;
}

function renderField(field, value) {
  return `
    <label class="field-label ${field.span === 2 ? "field-span-2" : ""}">
      <span>${escapeHtml(field.label)}</span>
      ${renderFieldControl(field, value)}
    </label>
  `;
}

function renderFieldControl(field, value) {
  if (field.type === "textarea") {
    return `<textarea name="${escapeHtml(field.name)}" ${field.required ? "required" : ""} ${field.autofocus ? 'data-autofocus="true"' : ""}>${escapeHtml(value)}</textarea>`;
  }
  if (field.type === "code") {
    return renderCodeEditor(field, value);
  }
  if (isSelect(field.type)) {
    return `
      <select name="${escapeHtml(field.name)}" ${field.required ? "required" : ""} ${field.autofocus ? 'data-autofocus="true"' : ""}>
        ${renderSelectOptions(field, value)}
      </select>
    `;
  }
  return `
    <input
      type="${escapeHtml(field.type)}"
      name="${escapeHtml(field.name)}"
      value="${escapeHtml(value)}"
      ${field.required ? "required" : ""}
      ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""}
      ${field.autofocus ? 'data-autofocus="true"' : ""}
    />
  `;
}

function renderSelectOptions(field, value) {
  if (field.type === "member-select") {
    return renderOptions([{ value: "", label: "Unassigned" }, ...memberOptions()], value);
  }
  if (field.type === "user-select") {
    return renderOptions(availableCaseUserOptions(), value);
  }
  if (field.type === "incident-user-select") {
    return renderOptions(availableIncidentUserOptions(), value);
  }
  return renderOptions(field.options.map((entry) => ({ value: String(entry), label: String(entry || "None") })), value);
}

function renderDeleteButton(modal, definition) {
  if (!modal.itemId || !definition.delete) {
    return "";
  }
  const permission = actionPermission(modal.entityType, "delete");
  return `<button class="danger-button" type="button" data-action="delete-entity" data-entity="${escapeHtml(modal.entityType)}" data-id="${escapeHtml(modal.itemId)}" ${permission && !can(permission) ? "disabled" : ""}>Delete</button>`;
}

function isSelect(type) {
  return ["select", "member-select", "user-select", "incident-user-select"].includes(type);
}

function closeIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" /></svg>`;
}

function renderCodeEditor(field, value) {
  return `
    <div class="code-editor-wrapper" data-language="${escapeHtml(field.language || "spl")}">
      <div class="code-editor-toolbar">
        <span class="code-editor-lang">${escapeHtml((field.language || "spl").toUpperCase())}</span>
        <button class="code-editor-copy ghost-button" type="button" aria-label="Copy to clipboard">Copy</button>
      </div>
      <div class="code-editor-body">
        <div class="code-editor-gutter"></div>
        <div class="code-editor-highlight">
          <pre aria-hidden="true"><code></code></pre>
          <textarea
            name="${escapeHtml(field.name)}"
            ${field.required ? "required" : ""}
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
          >${escapeHtml(value)}</textarea>
        </div>
      </div>
    </div>
  `;
}
