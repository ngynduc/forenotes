import type { DashboardSla } from "@shared/graph-types";
import { AlertTriangle, Clock } from "lucide-react";

interface SlaWatchProps {
  sla: DashboardSla;
}

export function SlaWatch({ sla }: SlaWatchProps) {
  const items = [];
  if (sla.overdueTasks > 0) items.push({ label: "Overdue Tasks", count: sla.overdueTasks, variant: "danger" });
  if (sla.dueSoonTasks > 0) items.push({ label: "Due Soon", count: sla.dueSoonTasks, variant: "warning" });
  if (sla.staleIncidents > 0) items.push({ label: "Stale Incidents", count: sla.staleIncidents, variant: "warning" });
  if (sla.agingFindings > 0) items.push({ label: "Aging Findings", count: sla.agingFindings, variant: "warning" });
  if (sla.unreadNotifications > 0) items.push({ label: "Unread", count: sla.unreadNotifications, variant: "default" });

  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">SLA Watch</h3>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-warning-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
          {items.length ? "attention" : "clear"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[8px] bg-[var(--color-surface-muted)] px-3 py-4 text-sm text-[var(--color-text-muted)]">All clear.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 rounded-[8px] bg-[var(--color-surface)] px-3 py-2 text-sm border border-[var(--color-border)]">
              {item.variant === "danger" ? (
                <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
              ) : (
                <Clock className="h-4 w-4 text-[var(--color-warning)]" />
              )}
              <span className="font-mono text-base font-semibold tabular-nums text-[var(--color-text)]">{item.count}</span>
              <span className="text-[var(--color-text-muted)]">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
