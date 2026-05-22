import type { DashboardActivity } from "@shared/graph-types";

interface ActivityChartProps {
  data: DashboardActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.findings + d.tasks + d.timeline), 1);

  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Activity (Last 30 Days)</h3>
        <span className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">events</span>
      </div>
      <div className="flex items-end gap-[3px] rounded-[8px] bg-[var(--color-surface-muted)] p-3 shadow-[inset_0_0_0_1px_var(--color-border)]" style={{ height: 148 }}>
        {data.map((d, i) => {
          const total = d.findings + d.tasks + d.timeline;
          const h = (total / maxVal) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-[6px] bg-[var(--color-primary)] opacity-80 transition-[opacity,transform] duration-150 hover:scale-y-105 hover:opacity-100"
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.day}: ${total} events`}
            />
          );
        })}
      </div>
    </div>
  );
}
