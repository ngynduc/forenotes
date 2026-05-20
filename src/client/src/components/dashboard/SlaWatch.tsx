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
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">SLA Watch</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">All clear!</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.variant === "danger" ? (
                <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
              ) : (
                <Clock className="h-4 w-4 text-[var(--color-warning)]" />
              )}
              <span className="font-medium">{item.count}</span>
              <span className="text-[var(--color-text-muted)]">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
