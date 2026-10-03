import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export type InvestigationCollection = "runs" | "evidence" | "observations" | "hypotheses" | "findings" | "actions";

export function useInvestigationRecords(collection: InvestigationCollection, runId?: string) {
  const caseId = useScopeStore((state) => state.selectedCaseId);
  const incidentId = useScopeStore((state) => state.selectedIncidentId);
  return useQuery({
    queryKey: ["investigation", caseId, incidentId, runId, collection],
    queryFn: () => api.listInvestigationRecords(caseId, collection, { incidentId: incidentId || undefined, runId: runId || undefined }),
    enabled: Boolean(caseId)
  });
}

export function useUpdateInvestigationRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collection, recordId, data }: {
      collection: "evidence" | "observations" | "hypotheses";
      recordId: string;
      data: Record<string, unknown>;
    }) => api.updateInvestigationRecord(collection, recordId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investigation"] })
  });
}

export function useMcpTokens() {
  return useQuery({ queryKey: ["mcp-tokens"], queryFn: api.listMcpTokens });
}

export function useCreateMcpToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createMcpToken,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] })
  });
}

export function useRevokeMcpToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.revokeMcpToken,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] })
  });
}
