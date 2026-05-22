import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  count: number;
  to?: string;
  variant?: "default" | "warning" | "danger";
}

const CARD_STYLES = {
  default: {
    shell: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm hover:border-[var(--color-border-strong)]",
    count: "text-[var(--color-primary)]",
    marker: "bg-[var(--color-primary)]",
  },
  warning: {
    shell: "border-[var(--color-border)] bg-[var(--color-warning-soft)] text-[var(--color-text)] shadow-sm hover:border-[var(--color-border-strong)]",
    count: "text-[var(--color-warning)]",
    marker: "bg-[var(--color-warning)]",
  },
  danger: {
    shell: "border-[var(--color-border)] bg-[var(--color-danger-soft)] text-[var(--color-text)] shadow-sm hover:border-[var(--color-border-strong)]",
    count: "text-[var(--color-danger)]",
    marker: "bg-[var(--color-danger)]",
  },
} satisfies Record<NonNullable<MetricCardProps["variant"]>, { shell: string; count: string; marker: string }>;

export function MetricCard({ label, count, to, variant = "default" }: MetricCardProps) {
  const navigate = useNavigate();
  const style = CARD_STYLES[variant];

  return (
    <button
      onClick={() => to && navigate(to)}
      className={cn(
        "group relative flex min-h-32 flex-col overflow-hidden rounded-[10px] border p-4 text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5 active:scale-[0.96]",
        style.shell,
        to && "cursor-pointer",
        !to && "cursor-default"
      )}
    >
      <span className={cn("absolute right-4 top-4 h-2 w-10 rounded-full opacity-85", style.marker)} />
      <span className={cn("font-mono text-4xl font-semibold leading-none tracking-tight tabular-nums", style.count)}>
        {count}
      </span>
      <span className="mt-auto text-sm font-medium text-[var(--color-text-muted)]">{label}</span>
    </button>
  );
}
