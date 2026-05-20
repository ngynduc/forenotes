import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";
import { useGraphStore } from "@/stores/graph-store";

export function useGraph() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { mode, entityTypes, linkTypes, includeDerived, includeManual, depth, q } = useGraphStore();

  return useQuery({
    queryKey: ["graph", incidentId, mode, entityTypes, linkTypes, includeDerived, includeManual, depth, q],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (mode) params.mode = mode;
      if (entityTypes.length) params.entityTypes = entityTypes.join(",");
      if (linkTypes.length) params.linkTypes = linkTypes.join(",");
      params.includeDerived = String(includeDerived);
      params.includeManual = String(includeManual);
      if (depth) params.depth = depth;
      if (q) params.q = q;
      return api.getGraph(incidentId!, params);
    },
    enabled: !!incidentId,
  });
}

export function useMitreMatrixData() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);

  return useQuery({
    queryKey: ["mitre-matrix", incidentId],
    queryFn: () => api.getMitreMatrix(incidentId!),
    enabled: !!incidentId,
  });
}
