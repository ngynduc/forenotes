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
  const supplemental = renderSupplementalSections(modal.entityType, item, mode);

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
          ${supplemental}
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

function renderSupplementalSections(entityType, item, mode) {
  if (mode !== "update" || !item) {
    return "";
  }
  if (entityType === "finding" || entityType === "timeline_event") {
    return [renderTagManagementSection(entityType, item), renderUserLinkSection(entityType, item)].join("");
  }
  return "";
}

function renderTagManagementSection(entityType, item) {
  const updateAllowed = canAccessEntity(entityType, "update", item);
  const attackTags = Array.isArray(item.attack_tags) ? item.attack_tags : [];
  const customTags = Array.isArray(item.custom_tags) ? item.custom_tags : [];
  const availableAttackTags = state.attackTags.filter((tag) => !attackTags.some((attached) => attached.id === tag.id));
  const availableCustomTags = state.customTags.filter((tag) => !customTags.some((attached) => attached.id === tag.id));

  return `
    <section class="modal-section">
      <div class="modal-section-header">
        <div>
          <h3>Tags</h3>
          <p>Show and attach tags directly on this ${escapeHtml(entityType === "finding" ? "finding" : "timeline event")}.</p>
        </div>
      </div>
      <div class="tag-section-grid">
        <div class="tag-group">
          <strong>Custom Tags</strong>
          <div class="tag-pill-list">
            ${renderTagPills(customTags, "custom")}
          </div>
          ${renderAttachTagForm(entityType, item.id, "custom", availableCustomTags, updateAllowed)}
        </div>
        <div class="tag-group">
          <strong>MITRE ATT&CK</strong>
          <div class="tag-pill-list">
            ${renderTagPills(attackTags, "attack")}
          </div>
          ${renderAttachTagForm(entityType, item.id, "attack", availableAttackTags, updateAllowed)}
        </div>
      </div>
    </section>
  `;
}

function renderTagPills(tags, kind) {
  if (!tags.length) {
    return `<span class="muted">No ${escapeHtml(kind === "attack" ? "ATT&CK" : "custom")} tags attached.</span>`;
  }
  return tags.map((tag) => {
    if (kind === "attack") {
      const label = [tag.attack_id, tag.name].filter(Boolean).join(" · ");
      return `<span class="tag-pill tag-pill-attack">${escapeHtml(label)}</span>`;
    }
    const style = tag.color ? ` style="--tag-color: ${escapeHtml(tag.color)}"` : "";
    return `<span class="tag-pill tag-pill-custom"${style}>${escapeHtml(tag.name)}</span>`;
  }).join("");
}

function renderAttachTagForm(entityType, itemId, tagType, options, updateAllowed) {
  const disabled = !updateAllowed || !options.length;
  const label = tagType === "attack" ? "Attach ATT&CK tag" : "Attach custom tag";
  const selectOptions = tagType === "attack"
    ? options.map((tag) => ({ value: tag.id, label: `${tag.attack_id} · ${tag.name}` }))
    : options.map((tag) => ({ value: tag.id, label: tag.name }));

  return `
    <div class="tag-attach-form" data-tag-attach="true">
      <select name="tagId" ${disabled ? "disabled" : ""} aria-label="${escapeHtml(label)}">
        <option value="">${escapeHtml(options.length ? label : "No more tags available")}</option>
        ${renderOptions(selectOptions, "")}
      </select>
      <button
        class="secondary-button"
        type="button"
        data-action="attach-tag"
        data-entity="${escapeHtml(entityType)}"
        data-id="${escapeHtml(itemId)}"
        data-tag-type="${escapeHtml(tagType)}"
        ${disabled ? "disabled" : ""}
      >Attach</button>
    </div>
  `;
}

function renderUserLinkSection(entityType, item) {
  const updateAllowed = canAccessEntity(entityType, "update", item) && can("entity_link:create");
  const ownerUserId = item.owner_user_id || "";
  const ownerUser = state.incidentMembers.find((member) => member.id === ownerUserId) || null;
  const manualLinks = state.entityLinks.filter((link) => {
    if (link.link_type !== "assigned_to") {
      return false;
    }

    const matchesSource = link.source_type === entityType && link.source_id === item.id && link.target_type === "user";
    const matchesTarget = link.target_type === entityType && link.target_id === item.id && link.source_type === "user";
    return matchesSource || matchesTarget;
  });

  const linkedUserIds = new Set(
    manualLinks.map((link) => link.source_type === "user" ? link.source_id : link.target_id)
  );
  if (ownerUserId) {
    linkedUserIds.add(ownerUserId);
  }

  const availableUsers = state.incidentMembers.filter((member) => !linkedUserIds.has(member.id));

  return `
    <section class="modal-section">
      <div class="modal-section-header">
        <div>
          <h3>Linked Users</h3>
          <p>Show ownership and attach additional incident users directly to this ${escapeHtml(entityType === "finding" ? "finding" : "timeline event")}.</p>
        </div>
      </div>
      <div class="tag-group">
        <strong>Current</strong>
        <div class="linked-entity-list">
          ${ownerUser ? renderDerivedOwnerRow(ownerUser) : `<span class="muted">No owner user on this record.</span>`}
          ${manualLinks.length ? manualLinks.map((link) => renderManualUserLinkRow(link, entityType)).join("") : `<span class="muted">No additional linked users.</span>`}
        </div>
        ${renderAttachUserLinkForm(entityType, item.id, availableUsers, updateAllowed)}
      </div>
    </section>
  `;
}

function renderDerivedOwnerRow(user) {
  return `
    <div class="linked-entity-row">
      <div>
        <div class="linked-entity-title">${escapeHtml(user.display_name || user.email || user.id)}</div>
        <div class="linked-entity-meta">owner · derived</div>
      </div>
      <span class="tag-pill tag-pill-attack">Owner</span>
    </div>
  `;
}

function renderManualUserLinkRow(link, entityType) {
  const userId = link.source_type === "user" ? link.source_id : link.target_id;
  const user = state.incidentMembers.find((member) => member.id === userId);
  const userLabel = user?.display_name || user?.email || userId;
  return `
    <div class="linked-entity-row">
      <div>
        <div class="linked-entity-title">${escapeHtml(userLabel)}</div>
        <div class="linked-entity-meta">${escapeHtml(link.link_type)} · manual</div>
      </div>
      <button
        class="ghost-button"
        type="button"
        data-action="delete-entity-link"
        data-entity="${escapeHtml(entityType)}"
        data-link-id="${escapeHtml(link.id)}"
      >Remove</button>
    </div>
  `;
}

function renderAttachUserLinkForm(entityType, itemId, users, updateAllowed) {
  const disabled = !updateAllowed || !users.length;
  return `
    <div class="tag-attach-form" data-entity-link-attach="true">
      <select name="targetId" ${disabled ? "disabled" : ""} aria-label="Attach linked user">
        <option value="">${escapeHtml(users.length ? "Attach linked user" : "No more incident users available")}</option>
        ${renderOptions(users.map((user) => ({ value: user.id, label: user.display_name || user.email || user.id })), "")}
      </select>
      <button
        class="secondary-button"
        type="button"
        data-action="attach-entity-link"
        data-entity="${escapeHtml(entityType)}"
        data-id="${escapeHtml(itemId)}"
        data-target-type="user"
        data-link-type="assigned_to"
        ${disabled ? "disabled" : ""}
      >Attach</button>
    </div>
  `;
}
