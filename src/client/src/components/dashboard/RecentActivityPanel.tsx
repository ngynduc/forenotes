import { useNavigate } from "react-router";
import type { DashboardRecentActivity } from "@shared/graph-types";
import { formatDateTimeForTimezone, formatRelativeTime, formatUtcTimestampForTitle } from "@/lib/timezone";
import { useScopeStore } from "@/stores/scope-store";

interface RecentActivityPanelProps {
  items: DashboardRecentActivity[];
  timezone: string;
  limit?: number;
  compact?: boolean;
}

const ENTITY_TONES: Record<string, string> = {
  case: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-border)]",
  incident: "bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info-border)]",
  finding: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning-border)]",
  task: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger-border)]",
  timeline_event: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]"
};

export function RecentActivityPanel({ items, timezone, limit = 8, compact = false }: RecentActivityPanelProps) {
  const navigate = useNavigate();
  const selectCase = useScopeStore((s) => s.selectCase);
  const selectIncident = useScopeStore((s) => s.selectIncident);
  const visibleItems = items.slice(0, limit);

  function openActivityItem(item: DashboardRecentActivity) {
    if (item.case?.id) {
      selectCase(item.case.id);
    }
    if (item.incident?.id) {
      selectIncident(item.incident.id);
    }

    switch (item.entityType) {
      case "case":
        navigate(`/cases?caseId=${encodeURIComponent(item.entityId)}`);
        return;
      case "incident":
        navigate(`/cases?incidentId=${encodeURIComponent(item.entityId)}`);
        return;
      case "finding":
        navigate(`/findings?itemId=${encodeURIComponent(item.entityId)}`);
        return;
      case "task":
        navigate(`/tasks?itemId=${encodeURIComponent(item.entityId)}`);
        return;
      case "timeline_event":
        navigate(`/timeline?itemId=${encodeURIComponent(item.entityId)}`);
        return;
      default:
        navigate("/");
    }
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-panel)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent Activity</h3>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-muted)]">
          {visibleItems.length} events
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
          No recent activity.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="grid w-full gap-3 rounded-[8px] border border-transparent px-3 py-3 text-left transition-[background-color,border-color] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] md:grid-cols-[minmax(0,1fr)_auto]"
                onClick={() => openActivityItem(item)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ENTITY_TONES[item.entityType] ?? ENTITY_TONES.timeline_event}`}>
                      {formatEntityType(item.entityType)}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-[var(--color-text)]">
                      {item.actor?.name ?? "System"} {item.action} {formatEntityType(item.entityType)} "{item.entityTitle}"
                    </span>
                  </div>
                  {!compact && (
                    <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                      {item.incident ? `Incident: ${item.incident.name}` : "Incident: none"} - {item.case ? `Case: ${item.case.name}` : "Case: none"}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-left md:text-right">
                  <p
                    className="font-mono text-xs text-[var(--color-text)]"
                    title={formatUtcTimestampForTitle(item.timestamp)}
                  >
                    {formatDateTimeForTimezone(item.timestamp, timezone)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatRelativeTime(item.timestamp)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatEntityType(value: string) {
  return value.replace(/_/g, " ");
}
