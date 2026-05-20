import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";

function useIncidentId() {
  return useScopeStore((s) => s.selectedIncidentId);
}

function useCaseId() {
  return useScopeStore((s) => s.selectedCaseId);
}

// Findings
export function useFindings() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "findings"],
    queryFn: () => api.listFindings(id!),
    enabled: !!id,
  });
}

export function useCreateFinding() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createFinding>[1]) => api.createFinding(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateFinding() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: Record<string, unknown> }) =>
      api.updateFinding(id!, findingId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useDeleteFinding() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (findingId: string) => api.deleteFinding(id!, findingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Timeline Events
export function useTimelineEvents() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "timeline-events"],
    queryFn: () => api.listTimelineEvents(id!),
    enabled: !!id,
  });
}

export function useCreateTimelineEvent() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createTimelineEvent>[1]) => api.createTimelineEvent(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateTimelineEvent() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      api.updateTimelineEvent(id!, eventId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Indicators
export function useIndicators() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "indicators"],
    queryFn: () => api.listIndicators(id!),
    enabled: !!id,
  });
}

export function useCreateIndicator() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createIndicator>[1]) => api.createIndicator(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateIndicator() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ indicatorId, data }: { indicatorId: string; data: Record<string, unknown> }) =>
      api.updateIndicator(id!, indicatorId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Systems
export function useSystems() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "systems"],
    queryFn: () => api.listSystems(id!),
    enabled: !!id,
  });
}

export function useCreateSystem() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createSystem>[1]) => api.createSystem(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateSystem() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ systemId, data }: { systemId: string; data: Record<string, unknown> }) =>
      api.updateSystem(id!, systemId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Accounts
export function useAccounts() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "accounts"],
    queryFn: () => api.listAccounts(id!),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createAccount>[1]) => api.createAccount(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateAccount() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: Record<string, unknown> }) =>
      api.updateAccount(id!, accountId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Queries (entity type)
export function useQueries() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "queries"],
    queryFn: () => api.listQueries(id!),
    enabled: !!id,
  });
}

export function useCreateQuery() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createQuery>[1]) => api.createQuery(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateQuery() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ queryId, data }: { queryId: string; data: Record<string, unknown> }) =>
      api.updateQuery(id!, queryId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

// Tags
export function useCustomTags() {
  const caseId = useCaseId();
  return useQuery({
    queryKey: ["cases", caseId, "custom-tags"],
    queryFn: () => api.listCustomTags(caseId!),
    enabled: !!caseId,
  });
}

export function useAttackTags() {
  return useQuery({
    queryKey: ["attack-tags"],
    queryFn: () => api.listAttackTags(),
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.listNotifications(),
  });
}

// Audit Logs
export function useAuditLogs(caseId?: string, incidentId?: string) {
  const params: Record<string, string> = {};
  if (caseId) params.caseId = caseId;
  if (incidentId) params.incidentId = incidentId;
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => api.listAuditLogs(params),
  });
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.listUsers(),
  });
}

// Entity Links
export function useEntityLinks() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "entity-links"],
    queryFn: () => api.listEntityLinks(id!),
    enabled: !!id,
  });
}
