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
    <div className="rounded-[20px] border border-[#dfe5e1] bg-white p-5 shadow-[0_14px_34px_rgba(25,38,34,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#132927]">SLA Watch</h3>
        <span className="rounded-full border border-[#e7d3ad] bg-[#fff8e6] px-2.5 py-1 text-xs font-medium text-[#92400e]">
          {items.length ? "attention" : "clear"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[14px] bg-[#f7f9f7] px-3 py-4 text-sm text-[#52615d]">All clear.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 rounded-[14px] bg-[#fbfcfa] px-3 py-2 text-sm shadow-[inset_0_0_0_1px_rgba(25,38,34,0.08)]">
              {item.variant === "danger" ? (
                <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
              ) : (
                <Clock className="h-4 w-4 text-[#d97706]" />
              )}
              <span className="font-mono text-base font-semibold tabular-nums text-[#17201d]">{item.count}</span>
              <span className="text-[#52615d]">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
