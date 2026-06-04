import { cn } from "@/lib/utils";
import type { MitreTechnique } from "@shared/graph-types";

interface TechniqueCardProps {
  technique: MitreTechnique;
  onClick: () => void;
}

export function TechniqueCard({ technique, onClick }: TechniqueCardProps) {
  const hasEvidence = technique.counts.total > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded px-2 py-1.5 text-left text-xs transition-colors",
        hasEvidence
          ? "bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)] hover:text-white"
          : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-medium">{technique.mitreId}</span>
        {hasEvidence && (
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            hasEvidence ? "bg-[var(--color-primary)] text-white" : ""
          )}>
            {technique.counts.total}
          </span>
        )}
      </div>
      <p
        className={cn(
          "truncate text-[10px] text-[var(--color-text-muted)] transition-colors",
          hasEvidence ? "group-hover:text-white" : ""
        )}
      >
        {technique.name}
      </p>
    </button>
  );
}
