import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TimeFilterRequest } from "@/lib/timeFilters";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";

function useIncidentId() {
  return useScopeStore((s) => s.selectedIncidentId);
}

function useCaseId() {
  return useScopeStore((s) => s.selectedCaseId);
}

// Findings
export function useFindings(filter?: TimeFilterRequest | null) {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "findings", filter?.field ?? "", filter?.start ?? "", filter?.end ?? ""],
    queryFn: () => api.listFindings(id!, filter),
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
export function useTimelineEvents(filter?: TimeFilterRequest | null) {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "timeline-events", filter?.field ?? "", filter?.start ?? "", filter?.end ?? ""],
    queryFn: () => api.listTimelineEvents(id!, filter),
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
  const activeUserId = useScopeStore((s) => s.activeUserId);
  return useQuery({
    queryKey: ["notifications", activeUserId],
    queryFn: () => api.listNotifications(),
    enabled: !!activeUserId,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
}

export function useMarkNotificationRead() {
  const activeUserId = useScopeStore((s) => s.activeUserId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", activeUserId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
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

export function useCreateEntityLink() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createEntityLink>[1]) => api.createEntityLink(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", id, "entity-links"] });
      qc.invalidateQueries({ queryKey: ["graph", id] });
      qc.invalidateQueries({ queryKey: ["mitre-matrix", id] });
    },
  });
}

export function useDeleteEntityLink() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => api.deleteEntityLink(id!, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", id, "entity-links"] });
      qc.invalidateQueries({ queryKey: ["graph", id] });
      qc.invalidateQueries({ queryKey: ["mitre-matrix", id] });
    },
  });
}

export function useReportTemplates() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "report-templates"],
    queryFn: () => api.listReportTemplates(id!),
    enabled: !!id,
  });
}

export function useCreateReportTemplate() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createReportTemplate>[1]) => api.createReportTemplate(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "report-templates"] }),
  });
}

export function useUpdateReportTemplate() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Parameters<typeof api.updateReportTemplate>[2] }) =>
      api.updateReportTemplate(id!, templateId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "report-templates"] }),
  });
}

export function useDuplicateReportTemplate() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) => api.duplicateReportTemplate(id!, templateId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "report-templates"] }),
  });
}

export function useDeleteReportTemplate() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => api.deleteReportTemplate(id!, templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "report-templates"] }),
  });
}

export function useReports() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["incidents", id, "reports"],
    queryFn: () => api.listReports(id!),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const id = useIncidentId();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.generateReport>[1]) => api.generateReport(id!, data),
  });
}

export function useCreateReport() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createReport>[1]) => api.createReport(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "reports"] }),
  });
}

export function useUpdateReport() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Parameters<typeof api.updateReport>[2] }) =>
      api.updateReport(id!, reportId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "reports"] }),
  });
}

export function useDeleteReport() {
  const id = useIncidentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => api.deleteReport(id!, reportId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id, "reports"] }),
  });
}

export function useExportReportPdf() {
  const id = useIncidentId();
  return useMutation({
    mutationFn: ({ reportId, pdfTemplateId }: { reportId: string; pdfTemplateId?: string }) => api.exportReportPdf(id!, reportId, { pdfTemplateId }),
  });
}

export function usePdfTemplates() {
  const id = useIncidentId();
  return useQuery({
    queryKey: ["pdf-templates", id ?? ""],
    queryFn: () => api.listPdfTemplates(id),
  });
}

export function useCreatePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createPdfTemplate>[0]) => api.createPdfTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-templates"] }),
  });
}

export function useUpdatePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Parameters<typeof api.updatePdfTemplate>[1] }) =>
      api.updatePdfTemplate(templateId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-templates"] }),
  });
}

export function useDuplicatePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) => api.duplicatePdfTemplate(templateId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-templates"] }),
  });
}

export function useDeletePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => api.deletePdfTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-templates"] }),
  });
}

export function usePreviewPdfTemplate() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.previewPdfTemplate>[0]) => api.previewPdfTemplate(data),
  });
}

export function useLlmSettings() {
  return useQuery({
    queryKey: ["llm-settings"],
    queryFn: () => api.getLlmSettings(),
  });
}

export function useSaveLlmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.saveLlmSettings>[0]) => api.saveLlmSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["llm-settings"] }),
  });
}

export function useDeleteLlmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteLlmSettings(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["llm-settings"] }),
  });
}

export function useTestLlmSettings() {
  return useMutation({
    mutationFn: () => api.testLlmSettings(),
  });
}
