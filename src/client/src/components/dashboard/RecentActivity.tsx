import { useNavigate } from "react-router";
import { formatDateTime } from "@/lib/utils";
import type { DashboardRecentActivity } from "@shared/graph-types";

interface RecentActivityProps {
  items: DashboardRecentActivity[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  const navigate = useNavigate();

  if (!items.length) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Recent Activity</h3>
      <ul className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <li
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded px-2 py-1 hover:bg-[var(--color-surface-muted)]"
            onClick={() => navigate(`/${item.kind === "case" ? "cases" : item.kind === "incident" ? "cases" : item.kind}s`)}
          >
            <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-xs font-medium capitalize">
              {item.kind}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm">{item.title}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-[var(--color-text-soft)]">
              {item.timestamp ? formatDateTime(item.timestamp) : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
