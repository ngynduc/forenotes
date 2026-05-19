import { escapeHtml, formatDateTime } from "../helpers.js";
import { state } from "../state.js";

const METRIC_CARDS = [
  { key: "openCases", label: "Open Cases", tone: "teal" },
  { key: "openIncidents", label: "Active Incidents", tone: "blue" },
  { key: "unresolvedFindings", label: "Unresolved Findings", tone: "amber" },
  { key: "overdueTasks", label: "Overdue Tasks", tone: "rose" }
];

export function renderDashboardView() {
  const summary = state.dashboardSummary;
  if (!summary) {
    return `
      <main class="page-shell">
        ${renderDashboardHeader()}
        <section class="panel dashboard-panel">
          <div class="empty-state is-large">Dashboard metrics are unavailable right now.</div>
        </section>
      </main>
    `;
  }

  return `
    <main class="page-shell dashboard-shell">
      ${renderDashboardHeader()}
      <section class="dashboard-content-grid">
        ${METRIC_CARDS.map((card) => renderMetricCard(card, summary.metrics)).join("")}
        <article class="panel dashboard-panel dashboard-activity-panel">
          <div class="section-header">
            <div>
              <h2>7 Day Activity</h2>
              <p>Findings, tasks, and timeline updates from visible incidents.</p>
            </div>
          </div>
          ${renderActivityChart(summary.activity)}
        </article>
        <article class="panel dashboard-panel dashboard-sla-panel">
          <div class="section-header">
            <div>
              <h2>SLA Watch</h2>
              <p>Items needing attention first.</p>
            </div>
          </div>
          <div class="sla-list">
            ${renderSlaItem("Tasks overdue", summary.sla.overdueTasks, "Missed due date")}
            ${renderSlaItem("Due in 24h", summary.sla.dueSoonTasks, "Active handoff window")}
            ${renderSlaItem("Stale incidents", summary.sla.staleIncidents, "No update in 72h")}
            ${renderSlaItem("Aging findings", summary.sla.agingFindings, "Open for 7+ days")}
            ${renderSlaItem("Unread notifications", summary.sla.unreadNotifications, "Pending review")}
          </div>
        </article>
        <article class="panel dashboard-panel dashboard-severity-panel">
          <div class="section-header">
            <div>
              <h2>Incident Severity</h2>
              <p>Current active investigation mix.</p>
            </div>
          </div>
          ${renderBreakdown(summary.breakdowns.incidentSeverity, "severity")}
        </article>
        <article class="panel dashboard-panel dashboard-task-panel">
          <div class="section-header">
            <div>
              <h2>Task Status</h2>
              <p>Execution load across visible incidents.</p>
            </div>
          </div>
          ${renderBreakdown(summary.breakdowns.taskStatus, "status")}
        </article>
        <article class="panel dashboard-panel dashboard-coverage-panel">
          <div class="section-header">
            <div>
              <h2>Case Coverage</h2>
              <p>Current portfolio posture.</p>
            </div>
          </div>
          <div class="dashboard-mini-metrics">
            <div>
              <strong>${summary.metrics.totalCases}</strong>
              <span>Total cases</span>
            </div>
            <div>
              <strong>${summary.metrics.totalIncidents}</strong>
              <span>Total incidents</span>
            </div>
            <div>
              <strong>${summary.metrics.criticalIncidents}</strong>
              <span>Critical incidents</span>
            </div>
            <div>
              <strong>${summary.metrics.unreadNotifications}</strong>
              <span>Unread alerts</span>
            </div>
          </div>
          ${renderBreakdown(summary.breakdowns.caseStatus, "status")}
        </article>
        <article class="panel dashboard-panel dashboard-recent-activity-panel">
          <div class="section-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest changes across cases and incidents you can access.</p>
            </div>
          </div>
          ${renderRecentActivity(summary.recentActivity)}
        </article>
      </section>
    </main>
  `;
}

function renderDashboardHeader() {
  return `
    <section class="landing-header dashboard-header">
      <div>
        <h1>Operations Dashboard</h1>
        <p>Real-time workload, SLA pressure, and recent movement across your visible investigations.</p>
      </div>
      <div class="dashboard-header-meta">
        <button class="secondary-button" type="button" data-action="refresh">Refresh</button>
      </div>
    </section>
  `;
}

function renderMetricCard(card, metrics) {
  return `
    <article class="panel dashboard-metric-card metric-${metricArea(card.key)} tone-${card.tone}">
      <span class="dashboard-metric-label">${escapeHtml(card.label)}</span>
      <strong>${Number(metrics[card.key] || 0)}</strong>
    </article>
  `;
}

function renderSlaItem(label, value, note) {
  return `
    <div class="sla-item">
      <div>
        <strong>${Number(value || 0)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
      <small>${escapeHtml(note)}</small>
    </div>
  `;
}

function renderBreakdown(items, kind) {
  if (!items?.length) {
    return `<div class="empty-state">No ${escapeHtml(kind)} data available.</div>`;
  }
  const maxCount = Math.max(...items.map((entry) => Number(entry.count || 0)), 1);
  return `
    <div class="dashboard-breakdown">
      ${items.map((entry) => `
        <div class="dashboard-breakdown-row">
          <div class="dashboard-breakdown-meta">
            <span>${escapeHtml(toLabel(entry.value))}</span>
            <strong>${Number(entry.count || 0)}</strong>
          </div>
          <div class="dashboard-breakdown-bar">
            <span style="width:${Math.max(10, Math.round((Number(entry.count || 0) / maxCount) * 100))}%"></span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderActivityChart(days) {
  const maxValue = Math.max(
    1,
    ...days.flatMap((entry) => [Number(entry.findings || 0), Number(entry.tasks || 0), Number(entry.timeline || 0)])
  );

  return `
    <div class="dashboard-chart">
      ${days.map((entry) => `
        <div class="dashboard-chart-day">
          <div class="dashboard-chart-bars">
            <span class="series-findings" style="height:${barHeight(entry.findings, maxValue)}%"></span>
            <span class="series-tasks" style="height:${barHeight(entry.tasks, maxValue)}%"></span>
            <span class="series-timeline" style="height:${barHeight(entry.timeline, maxValue)}%"></span>
          </div>
          <div class="dashboard-chart-totals">${Number(entry.findings || 0) + Number(entry.tasks || 0) + Number(entry.timeline || 0)}</div>
          <div class="dashboard-chart-label">${shortDay(entry.day)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRecentActivity(items) {
  if (!items?.length) {
    return `<div class="empty-state">No recent activity yet.</div>`;
  }
  return `
    <div class="dashboard-activity-list">
      ${items.map((entry) => `
        <div class="dashboard-activity-item">
          <div class="dashboard-activity-kind">${escapeHtml(entry.kind)}</div>
          <div class="dashboard-activity-body">
            <strong>${escapeHtml(entry.title)}</strong>
            <span>${escapeHtml(entry.detail || "Updated")}</span>
          </div>
          <div class="dashboard-activity-time" title="${escapeHtml(formatDateTime(entry.timestamp))}">
            ${escapeHtml(formatRelativeTime(entry.timestamp))}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function barHeight(value, maxValue) {
  const numeric = Number(value || 0);
  if (numeric <= 0) {
    return 0;
  }
  return Math.max(10, Math.round((numeric / maxValue) * 100));
}

function shortDay(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: "short" });
}

function toLabel(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

function metricArea(key) {
  switch (key) {
    case "openCases":
      return "open";
    case "openIncidents":
      return "incidents";
    case "unresolvedFindings":
      return "findings";
    case "overdueTasks":
      return "tasks";
    default:
      return "metric";
  }
}

function formatRelativeTime(value) {
  const timestamp = Date.parse(value || "");
  if (Number.isNaN(timestamp)) {
    return "unknown";
  }
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / (60 * 1000));
  if (minutes < 60) {
    return `${Math.max(1, minutes)}m ago`;
  }
  const hours = Math.round(diff / (60 * 60 * 1000));
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  return `${days}d ago`;
}
