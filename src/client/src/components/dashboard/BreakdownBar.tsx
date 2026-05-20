import type { DashboardBreakdown } from "@shared/graph-types";

interface BreakdownBarProps {
  label: string;
  items: DashboardBreakdown[];
}

const COLORS: Record<string, string> = {
  open: "bg-[var(--color-primary)]",
  closed: "bg-[var(--color-text-soft)]",
  critical: "bg-[var(--color-danger)]",
  high: "bg-orange-500",
  medium: "bg-[var(--color-warning)]",
  low: "bg-[var(--color-primary)]",
  draft: "bg-[var(--color-text-soft)]",
  confirmed: "bg-[var(--color-primary)]",
  false_positive: "bg-gray-400",
  resolved: "bg-green-500",
  todo: "bg-[var(--color-text-soft)]",
  in_progress: "bg-[var(--color-warning)]",
  blocked: "bg-[var(--color-danger)]",
  done: "bg-green-500",
};

export function BreakdownBar({ label, items }: BreakdownBarProps) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">{label}</h3>
      <div className="flex h-4 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        {items.map((item) => (
          <div
            key={item.value}
            className={`${COLORS[item.value] ?? "bg-[var(--color-primary)]"}`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${item.value}: ${item.count}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {items.map((item) => (
          <span key={item.value} className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${COLORS[item.value] ?? "bg-[var(--color-primary)]"}`} />
            {item.value}: {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}
