import type { MitreTactic, MitreTechnique } from "@shared/graph-types";
import { TechniqueCard } from "./TechniqueCard";

interface TacticColumnProps {
  tactic: MitreTactic;
  techniques: MitreTechnique[];
  onSelectTechnique: (technique: MitreTechnique) => void;
}

export function TacticColumn({ tactic, techniques, onSelectTechnique }: TacticColumnProps) {
  return (
    <div className="flex min-w-[160px] flex-col rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <h3 className="text-xs font-bold">{tactic.name}</h3>
      </div>
      <div className="flex flex-col gap-1 p-1">
        {techniques
          .sort((a, b) => a.mitreId.localeCompare(b.mitreId, undefined, { numeric: true }))
          .map((tech) => (
            <TechniqueCard
              key={tech.id}
              technique={tech}
              onClick={() => onSelectTechnique(tech)}
            />
          ))}
        {techniques.length === 0 && (
          <p className="py-2 text-center text-[10px] text-[var(--color-text-soft)]">No techniques</p>
        )}
      </div>
    </div>
  );
}
