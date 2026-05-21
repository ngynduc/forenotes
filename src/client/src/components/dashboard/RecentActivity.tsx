import { useNavigate } from "react-router";
import { formatDateTime } from "@/lib/utils";
import { formatUtcTimestampForTitle } from "@/lib/timezone";
import { useScopeStore } from "@/stores/scope-store";
import type { DashboardRecentActivity } from "@shared/graph-types";

interface RecentActivityProps {
  items: DashboardRecentActivity[];
}

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
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Recent Activity</h3>
      <ul className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded px-2 py-1 text-left hover:bg-[var(--color-surface-muted)]"
              onClick={() => openActivityItem(item)}
            >
              <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-xs font-medium capitalize">
                {item.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.title}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{item.detail}</p>
              </div>
              <span
                className="shrink-0 text-xs text-[var(--color-text-soft)]"
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
