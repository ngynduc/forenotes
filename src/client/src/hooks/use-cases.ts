import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateCaseInput } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: () => api.listCases(),
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCaseInput) => api.createCase(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCaseInput> }) =>
      api.updateCase(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });
}

export function useCaseMembers(caseId?: string) {
  return useQuery({
    queryKey: ["cases", caseId, "members"],
    queryFn: () => api.getCaseMembers(caseId!),
    enabled: !!caseId,
  });
}

export function useAddCaseMember(caseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; caseRole: string }) => api.addCaseMember(caseId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases", caseId, "members"] });
      qc.invalidateQueries({ queryKey: ["cases", caseId, "incidents"] });
    },
  });
}

export function useUpdateCaseMember(caseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, caseRole }: { userId: string; caseRole: string }) =>
      api.updateCaseMember(caseId!, userId, { caseRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases", caseId, "members"] });
      qc.invalidateQueries({ queryKey: ["cases", caseId, "incidents"] });
    },
  });
}

export function useRemoveCaseMember(caseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.removeCaseMember(caseId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases", caseId, "members"] });
      qc.invalidateQueries({ queryKey: ["cases", caseId, "incidents"] });
    },
  });
}
