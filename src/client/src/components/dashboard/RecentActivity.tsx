import { useNavigate } from "react-router";
import { formatDateTime } from "@/lib/utils";
import { formatUtcTimestampForTitle } from "@/lib/timezone";
import { useScopeStore } from "@/stores/scope-store";
import type { DashboardRecentActivity } from "@shared/graph-types";

interface RecentActivityProps {
  items: DashboardRecentActivity[];
}

const KIND_STYLES: Record<string, string> = {
  case: "bg-[var(--color-surface-muted)] text-[var(--color-primary)]",
  incident: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  finding: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  task: "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]",
  timeline: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function RecentActivity({ items }: RecentActivityProps) {
  const navigate = useNavigate();
  const selectCase = useScopeStore((s) => s.selectCase);
  const selectIncident = useScopeStore((s) => s.selectIncident);

  if (!items.length) return null;

  function openActivityItem(item: DashboardRecentActivity) {
    if (item.caseId) {
      selectCase(item.caseId);
    }
    if (item.incidentId) {
      selectIncident(item.incidentId);
    }

    switch (item.kind) {
      case "case":
        navigate(`/cases?caseId=${encodeURIComponent(item.id)}`);
        return;
      case "incident":
        navigate(`/cases?incidentId=${encodeURIComponent(item.id)}`);
        return;
      case "finding":
        navigate(`/findings?itemId=${encodeURIComponent(item.id)}`);
        return;
      case "task":
        navigate(`/tasks?itemId=${encodeURIComponent(item.id)}`);
        return;
      case "timeline":
        navigate(`/timeline?itemId=${encodeURIComponent(item.id)}`);
        return;
      default:
        navigate("/");
    }
  }

  return (
    <div className="relative rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent Activity</h3>
        <span className="font-mono text-xs font-semibold text-[var(--color-text-muted)]">{items.length} events</span>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-[8px] px-3 py-2 text-left transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-[var(--color-surface-muted)] active:scale-[0.96]"
              onClick={() => openActivityItem(item)}
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${KIND_STYLES[item.kind] ?? "bg-[var(--color-surface-subtle)] text-[var(--color-text-soft)]"}`}>
                {item.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{item.detail}</p>
              </div>
              <span
                className="shrink-0 font-mono text-xs text-[var(--color-text-soft)]"
                title={formatUtcTimestampForTitle(item.timestamp)}
              >
                {item.timestamp ? formatDateTime(item.timestamp) : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
