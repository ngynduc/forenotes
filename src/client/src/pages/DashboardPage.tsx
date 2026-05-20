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
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>

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
