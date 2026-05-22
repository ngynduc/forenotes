import { useDashboard } from "@/hooks/use-dashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { SlaWatch } from "@/components/dashboard/SlaWatch";
import { BreakdownBar } from "@/components/dashboard/BreakdownBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading dashboard...</p>;
  }

  const summary = data?.summary;
  if (!summary) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No dashboard data.</p>;
  }

  const { metrics, sla, breakdowns, activity, recentActivity } = summary;

  return (
    <div className="space-y-6 bg-[#f7f8f6]">
      <div className="rounded-[20px] border border-[#dfe5e1] bg-[#fbfcfa] p-5 shadow-[0_18px_48px_rgba(25,38,34,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Incident Command</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#17201d] md:text-3xl">Dashboard</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#66716d]">
              Operational pulse across cases, incidents, findings, and tasks.
            </p>
          </div>
          <div className="rounded-full border border-[#c9d5d0] bg-white px-3 py-1 text-xs font-medium text-[#40514d] shadow-[0_1px_2px_rgba(25,38,34,0.05)]">
            Live workspace view
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Open Cases" count={metrics.openCases} to="/cases" />
        <MetricCard label="Active Incidents" count={metrics.openIncidents} />
        <MetricCard label="Unresolved Findings" count={metrics.unresolvedFindings} to="/findings" variant={metrics.unresolvedFindings > 0 ? "warning" : "default"} />
        <MetricCard label="Overdue Tasks" count={metrics.overdueTasks} to="/tasks" variant={metrics.overdueTasks > 0 ? "danger" : "default"} />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={activity} />
        <SlaWatch sla={sla} />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownBar label="Finding Status" items={breakdowns.findingStatus} />
        <BreakdownBar label="Task Status" items={breakdowns.taskStatus} />
      </div>

      {/* Recent activity */}
      <RecentActivity items={recentActivity} />
    </div>
  );
}
