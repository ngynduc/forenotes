import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateIncidentInput } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useIncidents() {
  const caseId = useScopeStore((s) => s.selectedCaseId);
  return useQuery({
    queryKey: ["cases", caseId, "incidents"],
    queryFn: () => api.listIncidents(caseId!),
    enabled: !!caseId,
  });
}

export function useCreateIncident() {
  const caseId = useScopeStore((s) => s.selectedCaseId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncidentInput) => api.createIncident(caseId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases", caseId, "incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateIncidentInput> }) =>
      api.updateIncident(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useIncidentMembers(incidentId?: string) {
  return useQuery({
    queryKey: ["incidents", incidentId, "members"],
    queryFn: () => api.getIncidentMembers(incidentId!),
    enabled: !!incidentId,
  });
}
