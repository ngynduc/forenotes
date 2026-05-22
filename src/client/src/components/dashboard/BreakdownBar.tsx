import type { DashboardBreakdown } from "@shared/graph-types";

interface BreakdownBarProps {
  label: string;
  items: DashboardBreakdown[];
}

const COLORS: Record<string, string> = {
  open: "var(--color-status-open)",
  closed: "var(--color-text-soft)",
  critical: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-warning)",
  low: "var(--color-primary)",
  draft: "var(--color-text-soft)",
  confirmed: "var(--color-status-confirmed)",
  false_positive: "var(--color-status-false-positive)",
  resolved: "var(--color-status-done)",
  todo: "var(--color-status-todo)",
  in_progress: "var(--color-status-progress)",
  blocked: "var(--color-status-blocked)",
  done: "var(--color-status-done)",
};

const FALLBACK_COLOR = "var(--color-primary)";

export function BreakdownBar({ label, items }: BreakdownBarProps) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
        <span className="font-mono text-xs font-semibold text-[var(--color-text-muted)]">{total} total</span>
      </div>
      <div className="flex h-5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
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
          <span key={item.value} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[item.value] ?? FALLBACK_COLOR }}
            />
            {item.value}: {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}
