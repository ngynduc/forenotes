import { AlertTriangle, Bell, Clock3, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardResponse } from "@shared/graph-types";
import { formatRelativeTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type DashboardTab = "overview" | "sla" | "activity" | "workload" | "cases";

interface DashboardSummaryCardsProps {
  data: DashboardResponse;
  onSelectTab: (tab: DashboardTab) => void;
}

const CARD_STYLES = {
  rose: "border-rose-200 bg-white text-rose-700",
  amber: "border-amber-200 bg-white text-amber-700",
  blue: "border-blue-200 bg-white text-blue-700",
  teal: "border-teal-200 bg-white text-teal-700"
};

export function DashboardSummaryCards({ data, onSelectTab }: DashboardSummaryCardsProps) {
  const { summary, sla } = data;
  const assignedOverdue = new Set(sla.overdueTasks.map((task) => task.assignee?.id).filter(Boolean)).size;
  const oldestOverdue = sla.overdueTasks[0]?.dueAt ? formatRelativeTime(sla.overdueTasks[0].dueAt).replace(" ago", "") : "None";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="SLA Watch"
        value={summary.sla.attention}
        helper="Tasks, stale incidents, and aging findings needing review"
        tone="teal"
        icon={ListChecks}
        onClick={() => onSelectTab("sla")}
        breakdown={[
          ["Overdue tasks", summary.sla.overdueTasks],
          ["Due soon", summary.sla.dueSoonTasks],
          ["Blocked", summary.sla.blockedTasks]
        ]}
      />
      <SummaryCard
        title="Overdue Tasks"
        value={summary.sla.overdueTasks}
        helper={`Oldest overdue: ${oldestOverdue}`}
        tone="rose"
        icon={AlertTriangle}
        onClick={() => onSelectTab("sla")}
        breakdown={[
          ["Assigned users", assignedOverdue],
          ["Attention items", sla.attentionItems.length],
          ["Open tasks", summary.openTasks]
        ]}
      />
      <SummaryCard
        title="Due Soon"
        value={summary.sla.dueSoonTasks}
        helper="Upcoming due dates across visible work"
        tone="amber"
        icon={Clock3}
        onClick={() => onSelectTab("sla")}
        breakdown={[
          ["Next 24h", summary.sla.next24h],
          ["Next 72h", summary.sla.next72h],
          ["Active incidents", summary.activeIncidents]
        ]}
      />
      <SummaryCard
        title="Unread"
        value={summary.unread.total}
        helper="Unread updates addressed to you"
        tone="blue"
        icon={Bell}
        onClick={() => onSelectTab("activity")}
        breakdown={[
          ["Mentions", summary.unread.mentions],
          ["Case updates", summary.unread.caseUpdates],
          ["Task updates", summary.unread.taskUpdates]
        ]}
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  helper: string;
  tone: keyof typeof CARD_STYLES;
  icon: LucideIcon;
  breakdown: Array<[string, number]>;
  onClick: () => void;
}

function SummaryCard({ title, value, helper, tone, icon: Icon, breakdown, onClick }: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[172px] flex-col rounded-[8px] border p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
        CARD_STYLES[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
        <span className="rounded-[6px] bg-[var(--color-surface-muted)] p-2">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-mono text-4xl font-semibold leading-none tabular-nums">{value}</div>
      <p className="mt-2 min-h-9 text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
      <div className="mt-auto space-y-1.5 pt-3">
        {breakdown.map(([label, count]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-[var(--color-text-muted)]">{label}</span>
            <span className="font-mono font-semibold tabular-nums text-[var(--color-text)]">{count}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
