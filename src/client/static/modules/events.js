import { refreshAll, selectCase, selectIncident } from "./data.js";
import {
  deleteEntity,
  markAllVisibleNotificationsRead,
  markNotificationRead,
  openModal,
  openNotification,
  removeMember,
  runSearch,
  saveInlineEdit,
  startInlineEdit,
  submitModal
} from "./actions.js";
import { moveTask } from "./render/tasks.js";
import { setFlash, state } from "./state.js";
import { initCodeEditors } from "./code-editor.js";

export function initEvents(render) {
  const wrappedRender = () => {
    render();
    initCodeEditors(document.querySelector("#app"));
  };
  const root = document.querySelector("#app");
  root.addEventListener("click", (event) => handleClick(event, wrappedRender));
  root.addEventListener("change", (event) => handleChange(event, wrappedRender));
  root.addEventListener("input", (event) => handleInput(event, wrappedRender));
  root.addEventListener("focusout", (event) => handleFocusOut(event, wrappedRender));
  root.addEventListener("submit", (event) => handleSubmit(event, wrappedRender));
  root.addEventListener("dragstart", handleDragStart);
  root.addEventListener("dragover", handleDragOver);
  root.addEventListener("drop", (event) => handleDrop(event, wrappedRender));
  document.addEventListener("keydown", (event) => handleKeydown(event, wrappedRender));
}

async function handleClick(event, render) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }
  if (event.target.matches("select, option, input, textarea")) {
    return;
  }
  const action = target.dataset.action;
  const id = target.dataset.id || "";
  const entityType = target.dataset.entity || "";

  if (action === "set-section") {
    state.ui.activeSection = target.dataset.section;
  } else if (action === "toggle-task-view") {
    state.ui.taskView = target.dataset.view;
  } else if (action === "toggle-sidebar") {
    state.ui.sidebarExpanded = !state.ui.sidebarExpanded;
  } else if (action === "refresh") {
    await refreshAll();
  } else if (action === "select-case") {
    await selectCase(id);
  } else if (action === "open-modal") {
    openModal(entityType, id);
  } else if (action === "close-modal") {
    state.ui.modal = null;
  } else if (action === "edit-cell") {
    startInlineEdit(entityType, id, target.dataset.field);
  } else if (action === "save-inline") {
    await saveInlineEdit();
  } else if (action === "cancel-inline") {
    state.ui.inlineEdit = null;
  } else if (action === "submit-modal") {
    const form = target.closest("form");
    if (form instanceof HTMLFormElement) {
      await submitModal(form);
    }
  } else {
    await handleTableActions(action, target, id, entityType);
  }
  render();
}

async function handleTableActions(action, target, id, entityType) {
  if (action === "sort-table") {
    const tableState = state.ui.table[target.dataset.table];
    const field = target.dataset.field;
    tableState.sortDir = tableState.sortField === field && tableState.sortDir === "asc" ? "desc" : "asc";
    tableState.sortField = field;
  } else if (action === "page-prev" || action === "page-next") {
    const tableState = state.ui.table[target.dataset.table];
    tableState.page = Math.max(1, tableState.page + (action === "page-prev" ? -1 : 1));
  } else if (action === "mark-read") {
    await markNotificationRead(id);
  } else if (action === "mark-all-read") {
    await markAllVisibleNotificationsRead();
  } else if (action === "open-notification") {
    await openNotification(id);
  } else if (action === "delete-entity") {
    await deleteEntity(entityType, id);
  } else if (action === "remove-member") {
    await removeMember(target.dataset.scope, id);
  }
}

async function handleChange(event, render) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const action = target.dataset.action;

  if (action === "change-active-user" && target instanceof HTMLSelectElement) {
    state.activeUserId = target.value;
    localStorage.setItem("forenotes.activeUserId", state.activeUserId);
    state.selectedCaseId = "";
    state.selectedIncidentId = "";
    state.ui.activeSection = "cases";
    await refreshAll();
    render();
    return;
  }
  if (action === "select-incident-context" && target instanceof HTMLSelectElement) {
    await selectIncident(target.value);
    render();
    return;
  }
  if (action === "page-size" && target instanceof HTMLSelectElement) {
    const tableState = state.ui.table[target.dataset.table];
    tableState.pageSize = Number(target.value);
    tableState.page = 1;
    render();
    return;
  }
  if (target.matches("[data-inline-input]")) {
    state.ui.inlineEdit.draft = target.value;
  }
}

function handleInput(event, render) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target.matches("[data-inline-input]")) {
    state.ui.inlineEdit.draft = target.value;
    return;
  }
  if (target.matches("[data-action='table-search']")) {
    const tableState = state.ui.table[target.dataset.table];
    tableState.search = target.value;
    tableState.page = 1;
  }
}

function handleFocusOut(event, render) {
  if (event.target.matches("[data-action='table-search']")) {
    // re-render on blur so table reflects applied filter
    render();
  }
}

async function handleSubmit(event, render) {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  if (form.dataset.form === "modal") {
    await submitModal(form);
  } else if (form.dataset.form === "global-search") {
    await runSearch(form);
  }
  render();
}

function handleDragStart(event) {
  const card = event.target.closest("[data-drag-task]");
  if (card) {
    event.dataTransfer.setData("text/plain", card.dataset.dragTask);
  }
}

function handleDragOver(event) {
  if (event.target.closest("[data-drop-status]")) {
    event.preventDefault();
  }
}

async function handleDrop(event, render) {
  const column = event.target.closest("[data-drop-status]");
  if (!column) {
    return;
  }
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  if (!taskId) {
    return;
  }
  try {
    await moveTask(taskId, column.dataset.dropStatus);
    setFlash("success", "Task status updated.");
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
  render();
}

async function handleKeydown(event, render) {
  if (event.key === "Escape") {
    if (state.ui.inlineEdit) {
      state.ui.inlineEdit = null;
      render();
      return;
    }
    if (state.ui.modal) {
      state.ui.modal = null;
      render();
    }
  }
  if (event.key === "Enter" && state.ui.inlineEdit && event.target.matches("[data-inline-input]")) {
    event.preventDefault();
    await saveInlineEdit();
    render();
    return;
  }
  if (event.key === "Enter" && event.target.matches("[data-action='table-search']")) {
    event.preventDefault();
    render();
  }
}
