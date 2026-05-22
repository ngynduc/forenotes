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
    shell: "border-[#dfe5e1] bg-[#ffffff] text-[#10201f] shadow-[0_14px_34px_rgba(25,38,34,0.07)] hover:border-[#bed4cd] hover:shadow-[0_18px_40px_rgba(25,38,34,0.1)]",
    count: "text-[#0f766e]",
    marker: "bg-[#14b8a6]",
  },
  warning: {
    shell: "border-[#ead8ad] bg-[#fffdf7] text-[#2b2112] shadow-[0_14px_34px_rgba(25,38,34,0.07)] hover:border-[#e3b858] hover:shadow-[0_18px_40px_rgba(161,98,7,0.11)]",
    count: "text-[#b45309]",
    marker: "bg-[#f59e0b]",
  },
  danger: {
    shell: "border-[#edc8c3] bg-[#fffafa] text-[#2d1411] shadow-[0_14px_34px_rgba(25,38,34,0.07)] hover:border-[#e69087] hover:shadow-[0_18px_40px_rgba(180,35,24,0.12)]",
    count: "text-[#b42318]",
    marker: "bg-[#ef4444]",
  },
} satisfies Record<NonNullable<MetricCardProps["variant"]>, { shell: string; count: string; marker: string }>;

export function MetricCard({ label, count, to, variant = "default" }: MetricCardProps) {
  const navigate = useNavigate();
  const style = CARD_STYLES[variant];

  return (
    <button
      onClick={() => to && navigate(to)}
      className={cn(
        "group relative flex min-h-32 flex-col overflow-hidden rounded-[18px] border p-4 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 active:scale-[0.96]",
        style.shell,
        to && "cursor-pointer",
        !to && "cursor-default"
      )}
    >
      <span className={cn("absolute right-4 top-4 h-2 w-10 rounded-full opacity-85", style.marker)} />
      <span className={cn("font-mono text-4xl font-semibold leading-none tracking-tight tabular-nums", style.count)}>
        {count}
      </span>
      <span className="mt-auto text-sm font-medium text-[#40514d]">{label}</span>
    </button>
  );
}
