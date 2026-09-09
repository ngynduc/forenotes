import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Clock3, LayoutGrid, ListChecks, RadioTower } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardLabeledValue, DashboardResponse, DashboardWorkloadChartItem } from "@shared/graph-types";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { SlaWatchTab } from "@/components/dashboard/SlaWatchTab";
import { WorkloadTab } from "@/components/dashboard/WorkloadTab";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/providers/TimezoneProvider";

export type DashboardTab = "overview" | "sla" | "workload";

export const DASHBOARD_TABS: Array<{ id: DashboardTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "sla", label: "SLA Watch", icon: ListChecks },
  { id: "workload", label: "Workload", icon: Clock3 }
];

export const DASHBOARD_NOTIFICATIONS_PATH = "/notifications";
export const OVERVIEW_CHART_TITLES = ["Task Status", "SLA Risk", "Workload"] as const;

export default function DashboardPage() {
  const { data, isLoading } = useDashboard(true);
  const { timezone } = useTimezone();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  if (isLoading) return <DashboardState>Loading operational picture…</DashboardState>;
  if (!data) return <DashboardState>No dashboard data.</DashboardState>;

  return (
    <div className="space-y-5">
      <DashboardHeader data={data} timezone={timezone} />
      <nav aria-label="Dashboard views" className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-panel)]">
        <div className="flex min-w-max gap-1">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                activeTab === tab.id
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary-border)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "overview" && (
        <OverviewTab data={data} onSelectTab={setActiveTab} onOpenNotifications={() => navigate(DASHBOARD_NOTIFICATIONS_PATH)} />
      )}
      {activeTab === "sla" && <SlaWatchTab data={data.sla} timezone={timezone} />}
      {activeTab === "workload" && <WorkloadTab data={data.workload} />}
    </div>
  );
}

function DashboardHeader({ data, timezone }: { data: DashboardResponse; timezone: string }) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-panel)]">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_25%,var(--color-primary-soft),transparent_60%)] opacity-70" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            <RadioTower className="h-3.5 w-3.5" /> Live operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] md:text-3xl">Command overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">Priority work, SLA exposure, and team capacity in one operational picture.</p>
        </div>
        <div className="grid gap-2 text-xs text-[var(--color-text-muted)] sm:grid-cols-3 lg:min-w-[420px]">
          <HeaderStat label="Timezone" value={timezone} />
          <HeaderStat label="Scope" value={data.summary.scope === "team" ? "Team-wide" : "Self"} />
          <HeaderStat label="Open tasks" value={String(data.summary.openTasks)} />
        </div>
      </div>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/80 px-3 py-2 backdrop-blur-sm">
      <div className="font-medium uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-1 truncate font-mono text-[var(--color-text)]">{value}</div>
    </div>
  );
}

function OverviewTab({ data, onSelectTab, onOpenNotifications }: {
  data: DashboardResponse;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenNotifications: () => void;
}) {
  return (
    <div className="space-y-5">
      <DashboardSummaryCards data={data} onSelectTab={onSelectTab} onOpenNotifications={onOpenNotifications} />
      <div className="grid gap-5 xl:grid-cols-3">
        <DistributionChart title={OVERVIEW_CHART_TITLES[0]} items={data.charts.taskStatusDistribution} onViewDetails={() => onSelectTab("sla")} />
        <DistributionChart title={OVERVIEW_CHART_TITLES[1]} items={data.charts.slaRiskBreakdown} onViewDetails={() => onSelectTab("sla")} />
        <WorkloadChart title={OVERVIEW_CHART_TITLES[2]} scope={data.summary.scope} items={data.charts.workloadByAssignee} onViewDetails={() => onSelectTab("workload")} />
      </div>
    </div>
  );
}

function ChartCard({ title, children, onViewDetails }: { title: string; children: ReactNode; onViewDetails: () => void }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-panel)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BarChart3 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <h2 className="truncate text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text)]">{title}</h2>
        </div>
        <button type="button" className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" onClick={onViewDetails}>View details</button>
      </div>
      {children}
    </section>
  );
}

function DistributionChart({ title, items, onViewDetails }: { title: string; items: DashboardLabeledValue[]; onViewDetails: () => void }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <ChartCard title={title} onViewDetails={onViewDetails}>
      {total === 0 ? <EmptyChart>No data in the current dashboard scope.</EmptyChart> : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate capitalize text-[var(--color-text-muted)]">{item.label}</span><span className="font-mono font-semibold text-[var(--color-text)]">{item.value}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, (item.value / total) * 100)}%`, backgroundColor: chartColor(index) }} /></div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function WorkloadChart({ title, scope, items, onViewDetails }: { title: string; scope: "team" | "self"; items: DashboardWorkloadChartItem[]; onViewDetails: () => void }) {
  const max = Math.max(...items.map((item) => item.openTasks), 1);
  return (
    <ChartCard title={scope === "team" ? title : `My ${title}`} onViewDetails={onViewDetails}>
      {items.length === 0 ? <EmptyChart>No workload data in scope.</EmptyChart> : (
        <div className="space-y-3">
          {items.slice(0, 8).map((item) => (
            <div key={item.assignee} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-[var(--color-text-muted)]">{item.assignee}</span><span className="font-mono font-semibold text-[var(--color-text)]">{item.openTasks} open</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(3, (item.openTasks / max) * 100)}%` }} /></div>
              <div className="flex gap-3 font-mono text-[11px]"><span className="text-[var(--color-danger)]">{item.overdue} overdue</span><span className="text-[var(--color-warning)]">{item.dueSoon} due soon</span></div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-10 text-center text-sm text-[var(--color-text-muted)]">{children}</p>;
}

function DashboardState({ children }: { children: ReactNode }) {
  return <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-sm text-[var(--color-text-muted)]">{children}</p>;
}

function chartColor(index: number) {
  return `var(--color-chart-${(index % 6) + 1})`;
}
