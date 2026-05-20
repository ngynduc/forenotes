import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { GraphToolbar } from "@/components/graph/GraphToolbar";

export default function GraphPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view graph.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Relationship Graph</h2>
      </div>
      <div className="mb-3">
        <GraphToolbar />
      </div>
      <RelationshipGraph />
    </div>
  );
}
