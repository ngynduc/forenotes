import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleRealtimeNotification, reconcileRealtimeAccess, refreshCurrentUser } from "./realtime-cache";
import { clearClientSession } from "./session-state";
import { useScopeStore } from "@/stores/scope-store";
import { api } from "./api";

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useScopeStore.setState({ activeUserId: "user", selectedCaseId: "case", selectedIncidentId: "incident" });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

function notification(eventType: string, entityId = "incident") {
  return { recipientUserId: "user", caseId: "case", notification: { event_type: eventType, entity_id: entityId, incident_id: entityId } };
}

it("clears every user's cached record, cancels in-flight reads, and resets persisted scope on logout/password change", async () => {
  client.setQueryData(["graph", "incident"], { sensitive: true });
  let complete!: (value: string) => void;
  const pending = client.fetchQuery({ queryKey: ["incidents", "incident", "findings"], queryFn: () => new Promise<string>((resolve) => { complete = resolve; }) }).catch(() => undefined);
  clearClientSession(client);
  complete("old confidential data");
  await pending;
  expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([["auth", "me"]]);
  expect(client.getQueryData(["auth", "me"])).toBeNull();
  expect(useScopeStore.getState()).toMatchObject({ activeUserId: "", selectedCaseId: "", selectedIncidentId: "" });
});

describe("central realtime invalidation", () => {
  it("refetches active incident selectors on membership addition and leaves unrelated queries alone", async () => {
    const fetchIncidents = vi.fn(async () => ({ incidents: [{ id: "incident" }] }));
    const observer = new QueryObserver(client, { queryKey: ["cases", "case", "incidents"], queryFn: fetchIncidents, initialData: { incidents: [] }, staleTime: Infinity });
    const unsubscribe = observer.subscribe(() => undefined);
    client.setQueryData(["auth", "me"], { user: { id: "user" } });
    client.setQueryData(["cases"], { cases: [] });
    client.setQueryData(["attack-tags"], []);
    client.setQueryData(["graph", "other"], {});
    await handleRealtimeNotification(client, "user", notification("incident.member_added"), vi.fn());
    expect(fetchIncidents).toHaveBeenCalledOnce();
    expect(client.getQueryData(["cases", "case", "incidents"])).toEqual({ incidents: [{ id: "incident" }] });
    expect(client.getQueryState(["auth", "me"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["cases"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["attack-tags"])?.isInvalidated).toBe(false);
    expect(client.getQueryState(["graph", "other"])?.isInvalidated).toBe(false);
    unsubscribe();
  });

  it("ordinary notifications refresh notifications/dashboard but do not invalidate incident lists", async () => {
    client.setQueryData(["cases", "case", "incidents"], { incidents: [] });
    client.setQueryData(["notifications", "user"], []);
    await handleRealtimeNotification(client, "user", notification("task.assigned"), vi.fn());
    expect(client.getQueryState(["notifications", "user"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["cases", "case", "incidents"])?.isInvalidated).toBe(false);
  });

  it("exits a revoked incident immediately and evicts its entities, graph, reports, and investigation data", async () => {
    client.setQueryData(["cases", "case", "incidents"], { incidents: [{ id: "incident" }, { id: "other" }] });
    const removedKeys = [["incidents", "incident", "reports"], ["graph", "incident"], ["mitre-matrix", "incident"], ["investigation", "case", "incident"], ["pdf-templates", "incident"]];
    removedKeys.forEach((key) => client.setQueryData(key, { sensitive: true }));
    client.setQueryData(["graph", "other"], {});
    const navigate = vi.fn();
    const work = handleRealtimeNotification(client, "user", notification("incident.member_removed"), navigate);
    expect(navigate).toHaveBeenCalledOnce();
    expect(useScopeStore.getState().selectedIncidentId).toBe("");
    await work;
    removedKeys.forEach((key) => expect(client.getQueryData(key)).toBeUndefined());
    expect(client.getQueryData(["cases", "case", "incidents"])).toEqual({ incidents: [{ id: "other" }] });
    expect(client.getQueryData(["graph", "other"])).toEqual({});
  });

  it("case removal also evicts data for all cached incidents in that case", async () => {
    client.setQueryData(["cases"], { cases: [{ id: "case" }, { id: "other-case" }] });
    client.setQueryData(["cases", "case", "incidents"], { incidents: [{ id: "incident" }, { id: "sibling" }] });
    client.setQueryData(["graph", "sibling"], { sensitive: true });
    client.setQueryData(["investigation", "case", ""], {});
    await handleRealtimeNotification(client, "user", notification("case.member_removed", "case"), vi.fn());
    expect(useScopeStore.getState()).toMatchObject({ selectedCaseId: "", selectedIncidentId: "" });
    expect(client.getQueryData(["graph", "sibling"])).toBeUndefined();
    expect(client.getQueryData(["investigation", "case", ""])).toBeUndefined();
    expect(client.getQueryData(["cases"])).toEqual({ cases: [{ id: "other-case" }] });
  });

  it("ignores events addressed to a different user", async () => {
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await handleRealtimeNotification(client, "user", { ...notification("incident.member_removed"), recipientUserId: "other" }, vi.fn());
    expect(invalidate).not.toHaveBeenCalled();
    expect(useScopeStore.getState().selectedIncidentId).toBe("incident");
  });

  it("refreshes mutable user state without touching tag catalogs", async () => {
    client.setQueryData(["auth", "me"], {});
    client.setQueryData(["users"], { old: true });
    client.setQueryData(["attack-tags"], []);
    await refreshCurrentUser(client);
    expect(client.getQueryState(["auth", "me"])?.isInvalidated).toBe(true);
    expect(client.getQueryData(["users"])).toBeUndefined();
    expect(client.getQueryState(["attack-tags"])?.isInvalidated).toBe(false);
  });

  it("reconciles a removal missed while disconnected", async () => {
    vi.spyOn(api, "listCases").mockResolvedValue({ cases: [] });
    client.setQueryData(["graph", "incident"], { sensitive: true });
    const navigate = vi.fn();
    await reconcileRealtimeAccess(client, "user", navigate);
    expect(navigate).toHaveBeenCalledOnce();
    expect(client.getQueryData(["graph", "incident"])).toBeUndefined();
  });

  it("clears case member directories when mutable global permissions change", async () => {
    const directoryKeys = [["cases", "case", "member-candidates"], ["cases", "other-case", "member-candidates"]];
    directoryKeys.forEach((key) => client.setQueryData(key, { users: [{ id: "old-candidate" }] }));
    client.setQueryData(["cases", "case", "members"], { members: [] });
    await refreshCurrentUser(client);
    directoryKeys.forEach((key) => expect(client.getQueryData(key)).toBeUndefined());
    expect(client.getQueryData(["cases", "case", "members"])).toEqual({ members: [] });
  });
});

it("reports lost authentication centrally without treating a rejected password as logout", async () => {
  const target = new EventTarget();
  vi.stubGlobal("window", target);
  const ended = vi.fn();
  target.addEventListener("forenotes:session-ended", ended);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 })));
  try {
    await expect(api.changePassword({ currentPassword: "wrong", newPassword: "NewPassword123!", confirmPassword: "NewPassword123!" })).rejects.toThrow();
    expect(ended).not.toHaveBeenCalled();
    await expect(api.getMe()).rejects.toThrow();
    expect(ended).toHaveBeenCalledOnce();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "User is disabled" }), { status: 403 })));
    await expect(api.getMe()).rejects.toThrow();
    expect(ended).toHaveBeenCalledTimes(2);
  } finally { vi.unstubAllGlobals(); }
});
