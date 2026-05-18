import { api } from "../api.js";
import { refreshIncidentScope } from "../data.js";
import { permissionAttrs } from "../permissions.js";
import { escapeHtml } from "../helpers.js";
import { state, TASK_BOARD_COLUMNS } from "../state.js";
import { TABLE_DEFINITIONS } from "../tableDefinitions.js";
import { renderTablePanel } from "./table.js";

export function renderTasksView() {
  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Task Kanban</h2>
          <p>Drag tasks between columns to update operational status.</p>
        </div>
        <button class="primary-button" type="button" data-action="open-modal" data-entity="task" ${permissionAttrs("task:create", "create tasks")}>Create Task</button>
      </div>
      <div class="kanban-grid">
        ${TASK_BOARD_COLUMNS.map(renderTaskColumn).join("")}
      </div>
    </section>
    ${renderTablePanel("tasks", state.tasks, TABLE_DEFINITIONS.tasks)}
  `;
}

export async function moveTask(taskId, status) {
  await api(`/api/incidents/${state.selectedIncidentId}/tasks/${taskId}`, "PATCH", { status });
  await refreshIncidentScope();
}

function renderTaskColumn(column) {
  const tasks = state.tasks.filter((entry) => entry.status === column.value);
  return `
    <div class="kanban-column" data-drop-status="${escapeHtml(column.value)}">
      <div class="kanban-header">
        <h3>${escapeHtml(column.label)}</h3>
        <span>${tasks.length}</span>
      </div>
      <div class="kanban-list">
        ${tasks.map(renderTaskCard).join("") || `<div class="empty-state">No tasks</div>`}
      </div>
    </div>
  `;
}

function renderTaskCard(task) {
  return `
    <article class="kanban-card" draggable="true" data-drag-task="${escapeHtml(task.id)}">
      <button class="row-link" type="button" data-action="open-modal" data-entity="task" data-id="${escapeHtml(task.id)}">
        <span class="row-title">${escapeHtml(task.title)}</span>
        <span class="row-subtle">${escapeHtml(task.description || "No description")}</span>
      </button>
      <div class="board-card-meta">
        <span class="priority-badge">${escapeHtml(task.priority)}</span>
        <span>${escapeHtml(task.assignee_user_id ? "Assigned" : "Unassigned")}</span>
      </div>
    </article>
  `;
}
