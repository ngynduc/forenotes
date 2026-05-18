import { api } from "./api.js";
import { refreshAfterEntityChange, refreshNotifications, requiresCase, requiresIncident } from "./data.js";
import { ENTITY_DEFINITIONS } from "./entities.js";
import { cleanObject } from "./helpers.js";
import { MEMBERSHIP_ENTITY_DEFINITIONS } from "./membershipEntities.js";
import { actionPermission, can, permissionMessage } from "./permissions.js";
import { findEntityItem } from "./render/modal.js";
import { inlineOptions } from "./render/table.js";
import { clearFlash, setFlash, state } from "./state.js";

const ALL_ENTITIES = { ...ENTITY_DEFINITIONS, ...MEMBERSHIP_ENTITY_DEFINITIONS };

export function openModal(entityType, itemId = "") {
  clearFlash();
  if (requiresCase(entityType) && !state.selectedCaseId) {
    setFlash("error", "Select a case first.");
    return;
  }
  if (requiresIncident(entityType) && !state.selectedIncidentId) {
    setFlash("error", "Select an incident first.");
    return;
  }
  const definition = ALL_ENTITIES[entityType];
  if (!definition) {
    setFlash("error", `Unknown entity type: ${entityType}`);
    return;
  }
  const permission = actionPermission(entityType, itemId ? "update" : "create");
  if (permission && !can(permission)) {
    setFlash("error", permissionMessage(permission, itemId ? "edit this record" : "create this record"));
    return;
  }
  state.ui.modal = { entityType, itemId };
}

export async function submitModal(form) {
  const entityType = form.dataset.entity;
  const itemId = form.dataset.id || "";
  const definition = ALL_ENTITIES[entityType];
  const mode = itemId ? "update" : "create";
  const permission = actionPermission(entityType, mode);

  if (permission && !can(permission)) {
    setFlash("error", permissionMessage(permission, mode));
    return;
  }

  const payload = definition.fromForm(Object.fromEntries(new FormData(form).entries()));
  const request = itemId ? definition.update(itemId) : definition.create();
  try {
    await api(request.url, request.method, payload, request.includeAuth !== false);
    state.ui.modal = null;
    setFlash("success", `${definition.label} ${itemId ? "updated" : "created"}.`);
    await refreshAfterEntityChange(entityType);
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export function startInlineEdit(entityType, id, field) {
  const definition = ALL_ENTITIES[entityType];
  const row = findEntityItem(entityType, id);
  const inlineDefinition = definition?.inline?.[field];
  const permission = actionPermission(entityType, "update");
  if (!row || !inlineDefinition || !can(permission)) {
    return;
  }
  const rawValue = row[field];
  state.ui.inlineEdit = {
    entityType,
    id,
    field,
    type: inlineDefinition.type,
    payloadKey: inlineDefinition.payloadKey,
    draft: inlineDefinition.displayToDraft ? inlineDefinition.displayToDraft(rawValue) : rawValue ?? "",
    options: inlineOptions(inlineDefinition),
    draftToPayload: inlineDefinition.draftToPayload || ((value) => value)
  };
}

export async function saveInlineEdit() {
  const edit = state.ui.inlineEdit;
  if (!edit) {
    return;
  }
  const definition = ALL_ENTITIES[edit.entityType];
  const request = definition.update(edit.id);
  const payload = cleanObject({ [edit.payloadKey]: edit.draftToPayload(edit.draft) });

  try {
    await api(request.url, request.method, payload);
    state.ui.inlineEdit = null;
    setFlash("success", `${definition.label} updated.`);
    await refreshAfterEntityChange(edit.entityType);
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export async function deleteEntity(entityType, id) {
  const definition = ALL_ENTITIES[entityType];
  if (!definition?.delete) {
    return;
  }
  try {
    const request = definition.delete(id);
    await api(request.url, request.method);
    state.ui.modal = null;
    setFlash("success", `${definition.label} deleted.`);
    await refreshAfterEntityChange(entityType);
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export async function markNotificationRead(notificationId) {
  try {
    await api(`/api/notifications/${notificationId}/read`, "POST");
    await refreshNotifications();
    setFlash("success", "Notification marked as read.");
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export async function markAllVisibleNotificationsRead() {
  const visible = state.notifications.filter((entry) => entry.unseen).map((entry) => entry.id);
  for (const notificationId of visible) {
    await api(`/api/notifications/${notificationId}/read`, "POST");
  }
  await refreshNotifications();
  setFlash("success", "Visible notifications marked as read.");
}

export async function openNotification(notificationId) {
  const notification = state.notifications.find((entry) => entry.id === notificationId);
  if (!notification) {
    return;
  }
  if (notification.unseen) {
    await api(`/api/notifications/${notificationId}/read`, "POST");
    await refreshNotifications();
  }
  if (notification.entity_type === "finding") {
    state.ui.activeSection = "findings";
  } else if (notification.entity_type === "task") {
    state.ui.activeSection = "tasks";
  } else if (notification.entity_type === "query") {
    state.ui.activeSection = "queries";
  } else {
    state.ui.activeSection = "notifications";
  }
}

export async function removeMember(scope, userId) {
  try {
    if (scope === "case") {
      await api(`/api/cases/${state.selectedCaseId}/members/${userId}`, "DELETE");
      await refreshAfterEntityChange("case_member");
    } else {
      await api(`/api/incidents/${state.selectedIncidentId}/members/${userId}`, "DELETE");
      await refreshAfterEntityChange("incident_member");
    }
    setFlash("success", "Member removed.");
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}

export async function runSearch(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const query = String(data.query || "").trim();
  state.ui.globalSearch = query;
  if (!query) {
    state.searchResults = [];
    return;
  }
  const params = new URLSearchParams({ q: query });
  if (state.selectedIncidentId) {
    params.set("incidentId", state.selectedIncidentId);
  } else if (state.selectedCaseId) {
    params.set("caseId", state.selectedCaseId);
  }
  try {
    state.searchResults = (await api(`/api/search?${params.toString()}`, "GET")).results;
    state.ui.activeSection = "findings";
    setFlash("success", `Search loaded ${state.searchResults.length} result(s).`);
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
}
