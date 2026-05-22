import type { DashboardActivity } from "@shared/graph-types";

interface ActivityChartProps {
  data: DashboardActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.findings + d.tasks + d.timeline), 1);

  return (
    <div className="rounded-[20px] border border-[#dfe5e1] bg-white p-5 shadow-[0_14px_34px_rgba(25,38,34,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#132927]">Activity (Last 30 Days)</h3>
        <span className="rounded-full border border-[#cfe3dc] bg-[#eef7f4] px-2.5 py-1 text-xs font-medium text-[#0f766e]">events</span>
      </div>
      <div className="flex items-end gap-[3px] rounded-[14px] bg-[linear-gradient(180deg,#f1f6f3_0%,#fafbf8_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(25,38,34,0.04)]" style={{ height: 148 }}>
        {data.map((d, i) => {
          const total = d.findings + d.tasks + d.timeline;
          const h = (total / maxVal) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-[6px] bg-[linear-gradient(180deg,#14b8a6_0%,#0f766e_60%,#134e4a_100%)] opacity-80 shadow-[0_6px_16px_rgba(15,118,110,0.22)] transition-[opacity,transform] duration-150 hover:scale-y-105 hover:opacity-100"
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.day}: ${total} events`}
            />
          );
        })}
      </div>
    </div>
  );
}
