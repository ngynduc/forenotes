import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { MitreMatrix } from "@/components/mitre/MitreMatrix";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { useLicense } from "@/hooks/use-license";
import { cn } from "@/lib/utils";

export default function GraphPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const graphView = useUIStore((s) => s.graphView);
  const setGraphView = useUIStore((s) => s.setGraphView);
  const license = useLicense();

  if (license.isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading license...</p>;
  }

  if (!license.hasFeature("graph")) {
    return (
      <LockedFeature
        feature="graph"
        description="Upgrade to Pro to use the relationship graph, MITRE matrix, and visual investigation links."
      />
    );
  }

  if (!incidentId) {
    return <ScopeGate required="incident" />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Relationship Graph</h2>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setGraphView("relationship")}
          className={cn(
            "rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition-colors",
            graphView === "relationship"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
          )}
        >
          Relationship Graph
        </button>
        <button
          type="button"
          onClick={() => setGraphView("mitre")}
          className={cn(
            "rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition-colors",
            graphView === "mitre"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
          )}
        >
          MITRE Matrix
        </button>
      </div>
      {graphView === "relationship" ? (
        <>
          <div className="mb-3">
            <GraphToolbar />
          </div>
          <RelationshipGraph />
        </>
      ) : (
        <MitreMatrix />
      )}
    </div>
  );
}
