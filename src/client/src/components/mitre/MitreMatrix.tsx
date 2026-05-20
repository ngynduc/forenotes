import { useMitreMatrixData } from "@/hooks/use-graph";
import { useScopeStore } from "@/stores/scope-store";
import { TacticColumn } from "./TacticColumn";
import { MatrixToolbar } from "./MatrixToolbar";
import { TechniqueInspector } from "./TechniqueInspector";
import { useState } from "react";
import type { MitreTechnique } from "@shared/graph-types";

export function MitreMatrix() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { data, isLoading } = useMitreMatrixData();
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view MITRE matrix.</p>;
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading MITRE matrix...</p>;
  }

  const tactics = data?.tactics ?? [];
  const techniques = data?.techniques ?? [];

  return (
    <div>
      <MatrixToolbar />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-4">
        {tactics
          .sort((a, b) => a.order - b.order)
          .map((tactic) => (
            <TacticColumn
              key={tactic.id}
              tactic={tactic}
              techniques={techniques.filter((t) => t.tacticId === tactic.id)}
              onSelectTechnique={setSelectedTechnique}
            />
          ))}
      </div>
      {selectedTechnique && (
        <TechniqueInspector
          technique={selectedTechnique}
          onClose={() => setSelectedTechnique(null)}
        />
      )}
    </div>
  );
}
