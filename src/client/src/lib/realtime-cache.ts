import type { Query, QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";

interface NotificationEvent {
  recipientUserId: string;
  caseId?: string;
  notification: {
    event_type: string;
    incident_id?: string | null;
    entity_id?: string | null;
  };
}

type NavigateAway = () => void;

function incidentQuery(query: Query, incidentId: string) {
  const key = query.queryKey;
  return (["incidents", "graph", "mitre-matrix", "pdf-templates"].includes(String(key[0])) && key[1] === incidentId)
    || (key[0] === "investigation" && (key[2] === incidentId || !key[2]))
    || (key[0] === "audit-logs" && typeof key[1] === "object" && key[1] !== null
      && "incidentId" in key[1] && key[1].incidentId === incidentId);
}

async function evictQueries(queryClient: QueryClient, predicate: (query: Query) => boolean) {
  await queryClient.cancelQueries({ predicate });
  queryClient.removeQueries({ predicate });
}

async function revokeAccess(queryClient: QueryClient, scope: { caseId?: string; incidentId?: string }, navigateAway: NavigateAway) {
  const state = useScopeStore.getState();
  const removesCase = Boolean(scope.caseId && !scope.incidentId);
  const leavesCurrentView = removesCase ? state.selectedCaseId === scope.caseId : state.selectedIncidentId === scope.incidentId;
  const incidentIds = new Set<string>();
  if (scope.incidentId) incidentIds.add(scope.incidentId);
  if (removesCase && scope.caseId) {
    const cached = queryClient.getQueryData<{ incidents: Array<{ id: string }> }>(["cases", scope.caseId, "incidents"]);
    cached?.incidents.forEach((incident) => incidentIds.add(incident.id));
    if (state.selectedCaseId === scope.caseId && state.selectedIncidentId) incidentIds.add(state.selectedIncidentId);
  }

  // Stop rendering the revoked scope before awaiting any network work.
  if (leavesCurrentView) {
    if (removesCase) state.selectCase("");
    else state.clearIncident();
    navigateAway();
    useUIStore.getState().setFlash({ kind: "info", message: removesCase ? "Your access to this case was removed." : "Your access to this incident was removed." });
  }
  await evictQueries(queryClient, (query) =>
    [...incidentIds].some((id) => incidentQuery(query, id))
    || (removesCase && ["cases", "investigation"].includes(String(query.queryKey[0])) && query.queryKey[1] === scope.caseId));
  // Dashboard data embeds incident summaries; discard it rather than display stale summaries on errors.
  await queryClient.resetQueries({ queryKey: ["dashboard"] });
  if (removesCase) {
    queryClient.setQueryData<{ cases: Array<{ id: string }> }>(["cases"], (data) =>
      data ? { ...data, cases: data.cases.filter((entry) => entry.id !== scope.caseId) } : data);
  } else {
    queryClient.setQueriesData<{ incidents: Array<{ id: string }> }>({
      predicate: (query) => query.queryKey[0] === "cases" && query.queryKey[2] === "incidents",
    }, (data) => data ? { ...data, incidents: data.incidents.filter((entry) => entry.id !== scope.incidentId) } : data);
  }
}

export async function refreshAccessQueries(queryClient: QueryClient, caseId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
    queryClient.invalidateQueries({ queryKey: ["cases"], exact: true }),
    queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "cases"
      && (!caseId || query.queryKey[1] === caseId) && ["incidents", "members"].includes(String(query.queryKey[2])) }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export async function handleRealtimeNotification(queryClient: QueryClient, userId: string, event: NotificationEvent, navigateAway: NavigateAway) {
  if (event.recipientUserId !== userId || useScopeStore.getState().activeUserId !== userId) return;
  const item = event.notification;
  const caseId = event.caseId ?? (item.event_type.startsWith("case.") ? item.entity_id ?? undefined : undefined);
  if (item.event_type === "case.member_removed") await revokeAccess(queryClient, { caseId }, navigateAway);
  if (item.event_type === "incident.member_removed") await revokeAccess(queryClient, { incidentId: item.incident_id ?? item.entity_id ?? undefined }, navigateAway);
  const membershipEvent = item.event_type.startsWith("case.member_") || item.event_type.startsWith("incident.member_");
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
    membershipEvent || item.event_type === "incident.created" ? refreshAccessQueries(queryClient, caseId)
      : queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export async function refreshCurrentUser(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  // User directories and audit/investigation views depend on mutable global permissions.
  await queryClient.resetQueries({ predicate: (query) => ["users", "audit-logs", "investigation"].includes(String(query.queryKey[0])) });
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export async function reconcileRealtimeAccess(queryClient: QueryClient, userId: string, navigateAway: NavigateAway) {
  await refreshAccessQueries(queryClient);
  const state = useScopeStore.getState();
  if (state.activeUserId !== userId || !state.selectedCaseId) return;
  const caseId = state.selectedCaseId;
  const cases = await queryClient.fetchQuery({ queryKey: ["cases"], queryFn: api.listCases, staleTime: 0 });
  if (!cases.cases.some((entry) => entry.id === caseId)) {
    await revokeAccess(queryClient, { caseId }, navigateAway);
    return;
  }
  if (!state.selectedIncidentId) return;
  const incidentId = state.selectedIncidentId;
  const incidents = await queryClient.fetchQuery({ queryKey: ["cases", caseId, "incidents"], queryFn: () => api.listIncidents(caseId), staleTime: 0 });
  if (!incidents.incidents.some((entry) => entry.id === incidentId)) await revokeAccess(queryClient, { incidentId }, navigateAway);
}
