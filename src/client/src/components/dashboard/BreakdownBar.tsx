import type { DashboardBreakdown } from "@shared/graph-types";

interface BreakdownBarProps {
  label: string;
  items: DashboardBreakdown[];
}

const COLORS: Record<string, string> = {
  open: "#0f766e",
  closed: "#64748b",
  critical: "#dc2626",
  high: "#f97316",
  medium: "#d97706",
  low: "#14b8a6",
  draft: "#94a3b8",
  confirmed: "#dc2626",
  false_positive: "#78716c",
  resolved: "#16a34a",
  todo: "#64748b",
  in_progress: "#f59e0b",
  blocked: "#dc2626",
  done: "#16a34a",
};

const FALLBACK_COLOR = "#0f766e";

export function BreakdownBar({ label, items }: BreakdownBarProps) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-[20px] border border-[#dfe5e1] bg-white p-5 shadow-[0_14px_34px_rgba(25,38,34,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#132927]">{label}</h3>
        <span className="font-mono text-xs font-semibold text-[#52615d]">{total} total</span>
      </div>
      <div className="flex h-5 overflow-hidden rounded-full bg-[#e8ecea] shadow-[inset_0_1px_2px_rgba(20,32,30,0.1)]">
        {items.map((item) => (
          <div
            key={item.value}
            className="transition-[filter] hover:brightness-110"
            style={{ width: `${(item.count / total) * 100}%`, backgroundColor: COLORS[item.value] ?? FALLBACK_COLOR }}
            title={`${item.value}: ${item.count}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {items.map((item) => (
          <span key={item.value} className="flex items-center gap-1.5 text-xs font-medium text-[#52615d]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
              style={{ backgroundColor: COLORS[item.value] ?? FALLBACK_COLOR }}
            />
            {item.value}: {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}
