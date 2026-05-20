import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  count: number;
  to?: string;
  variant?: "default" | "warning" | "danger";
}

export function MetricCard({ label, count, to, variant = "default" }: MetricCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => to && navigate(to)}
      className={cn(
        "flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition-shadow hover:shadow-md",
        to && "cursor-pointer",
        !to && "cursor-default"
      )}
    >
      <span className="text-2xl font-bold">
        {variant === "danger" && <span className="text-[var(--color-danger)]">{count}</span>}
        {variant === "warning" && <span className="text-[var(--color-warning)]">{count}</span>}
        {variant === "default" && count}
      </span>
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
    </button>
  );
}
