import type { DashboardActivity } from "@shared/graph-types";

interface ActivityChartProps {
  data: DashboardActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.findings + d.tasks + d.timeline), 1);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Activity (Last 30 Days)</h3>
      <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
        {data.map((d, i) => {
          const total = d.findings + d.tasks + d.timeline;
          const h = (total / maxVal) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t bg-[var(--color-primary)] opacity-70 hover:opacity-100 transition-opacity"
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.day}: ${total} events`}
            />
          );
        })}
      </div>
    </div>
  );
}
