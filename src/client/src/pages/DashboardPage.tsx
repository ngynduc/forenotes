import { useState } from "react";
import type { ReactNode } from "react";
import { Activity, BarChart3, BriefcaseBusiness, Clock3, LayoutGrid, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useTimezone } from "@/providers/TimezoneProvider";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { SlaWatchTab } from "@/components/dashboard/SlaWatchTab";
import { ActivityTab } from "@/components/dashboard/ActivityTab";
import { WorkloadTab } from "@/components/dashboard/WorkloadTab";
import { CasesIncidentsTab } from "@/components/dashboard/CasesIncidentsTab";
import { cn } from "@/lib/utils";
import type { DashboardCharts, DashboardLabeledValue, DashboardResponse, DashboardWorkloadChartItem } from "@shared/graph-types";

type DashboardTab = "overview" | "sla" | "activity" | "workload" | "cases";

const TABS: Array<{ id: DashboardTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "sla", label: "SLA Watch", icon: ListChecks },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "workload", label: "Workload", icon: Clock3 },
  { id: "cases", label: "Cases / Incidents", icon: BriefcaseBusiness }
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard(true);
  const { timezone } = useTimezone();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading dashboard...</p>;
  }

  if (!data) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No dashboard data.</p>;
  }

  return (
    <div className="space-y-5">
      <DashboardHeader data={data} timezone={timezone} />

      <div className="overflow-x-auto rounded-[8px] border border-[var(--color-border)] bg-white p-1 shadow-sm">
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && <OverviewTab data={data} timezone={timezone} onSelectTab={setActiveTab} />}
      {activeTab === "sla" && <SlaWatchTab data={data.sla} timezone={timezone} />}
      {activeTab === "activity" && <ActivityTab data={data.activity} timezone={timezone} />}
      {activeTab === "workload" && <WorkloadTab data={data.workload} />}
      {activeTab === "cases" && <CasesIncidentsTab data={data.cases} timezone={timezone} />}
    </div>
  );
}

function DashboardHeader({ data, timezone }: { data: DashboardResponse; timezone: string }) {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] md:text-3xl">Dashboard</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Operational overview across active cases, tasks, SLA, and recent activity.
          </p>
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
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2">
      <div className="font-medium uppercase tracking-wide text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-1 truncate font-mono text-[var(--color-text)]">{value}</div>
    </div>
  );
}

function OverviewTab({ data, timezone, onSelectTab }: { data: DashboardResponse; timezone: string; onSelectTab: (tab: DashboardTab) => void }) {
  return (
    <div className="space-y-5">
      <DashboardSummaryCards data={data} onSelectTab={onSelectTab} />

      <div className="grid gap-5 lg:grid-cols-2">
        <DistributionChart title="Task Status Distribution" items={data.charts.taskStatusDistribution} onViewDetails={() => onSelectTab("sla")} />
        <DistributionChart title="SLA Risk Breakdown" items={data.charts.slaRiskBreakdown} onViewDetails={() => onSelectTab("sla")} />
        <WorkloadChart scope={data.summary.scope} items={data.charts.workloadByAssignee} onViewDetails={() => onSelectTab("workload")} />
        <TrendChart title="Activity Trend" items={data.charts.activityTrend} timezone={timezone} onViewDetails={() => onSelectTab("activity")} />
        <MetricChart title="Case / Incident Health" items={data.charts.caseIncidentHealth} onViewDetails={() => onSelectTab("cases")} />
        <MetricChart title="Unread Breakdown" items={data.charts.unreadBreakdown} onViewDetails={() => onSelectTab("activity")} />
      </div>
    </div>
  );
}

function ChartCard({ title, children, onViewDetails }: { title: string; children: ReactNode; onViewDetails?: () => void }) {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BarChart3 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        </div>
        {onViewDetails && (
          <button
            type="button"
            className="shrink-0 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
            onClick={onViewDetails}
          >
            View details
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function DistributionChart({ title, items, onViewDetails }: { title: string; items: DashboardLabeledValue[]; onViewDetails?: () => void }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard title={title} onViewDetails={onViewDetails}>
      {total === 0 ? (
        <EmptyChart>No data in the current dashboard scope.</EmptyChart>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate capitalize text-[var(--color-text-muted)]">{item.label}</span>
                <span className="font-mono font-semibold text-[var(--color-text)]">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(3, (item.value / total) * 100)}%`, backgroundColor: chartColor(index) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function WorkloadChart({ scope, items, onViewDetails }: { scope: "team" | "self"; items: DashboardWorkloadChartItem[]; onViewDetails?: () => void }) {
  const max = Math.max(...items.map((item) => item.openTasks), 1);

  return (
    <ChartCard title={scope === "team" ? "Workload by Assignee" : "My Workload"} onViewDetails={onViewDetails}>
      {items.length === 0 ? (
        <EmptyChart>No workload data in scope.</EmptyChart>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 8).map((item, index) => (
            <div key={item.assignee} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-[var(--color-text-muted)]">{item.assignee}</span>
                <span className="font-mono font-semibold text-[var(--color-text)]">{item.openTasks} open</span>
              </div>
              <div className="grid h-2 grid-cols-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(3, (item.openTasks / max) * 100)}%` }} />
              </div>
              <div className="flex gap-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                <span className="text-rose-700">{item.overdue} overdue</span>
                <span className="text-amber-700">{item.dueSoon} due soon</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function TrendChart({ title, items, timezone, onViewDetails }: { title: string; items: DashboardLabeledValue[]; timezone: string; onViewDetails?: () => void }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ChartCard title={title} onViewDetails={onViewDetails}>
      {items.length === 0 ? (
        <EmptyChart>No activity in the selected range.</EmptyChart>
      ) : (
        <div>
          <div className="flex h-40 items-end gap-2 rounded-[8px] bg-[var(--color-surface-muted)] p-3">
            {items.map((item, index) => (
              <div
                key={item.label}
                className="flex-1 rounded-t-[6px] bg-[var(--color-primary)]"
                style={{ height: `${Math.max(4, (item.value / max) * 100)}%`, opacity: 0.55 + index / Math.max(items.length * 2, 1) }}
                title={`${item.label} (${timezone}): ${item.value}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-2 font-mono text-[11px] text-[var(--color-text-muted)]">
            <span>{items[0]?.label}</span>
            <span>{items.at(-1)?.label}</span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function MetricChart({ title, items, onViewDetails }: { title: string; items: DashboardLabeledValue[]; onViewDetails?: () => void }) {
  return (
    <ChartCard title={title} onViewDetails={onViewDetails}>
      {items.every((item) => item.value === 0) ? (
        <EmptyChart>No data in the current dashboard scope.</EmptyChart>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, index) => (
            <div key={item.label} className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
              <div className="font-mono text-2xl font-semibold tabular-nums" style={{ color: chartColor(index) }}>
                {item.value}
              </div>
              <div className="mt-1 truncate text-xs text-[var(--color-text-muted)]" title={item.label}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-10 text-center text-sm text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}

function chartColor(index: number) {
  const colors = ["#0f766e", "#b91c1c", "#b45309", "#2563eb", "#4f46e5", "#64748b"];
  return colors[index % colors.length];
}
