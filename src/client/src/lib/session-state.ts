import type { QueryClient } from "@tanstack/react-query";
import { useScopeStore } from "@/stores/scope-store";

export const SESSION_ENDED_EVENT = "forenotes:session-ended";

export function notifySessionEnded() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
}

export function clearClientSession(queryClient: QueryClient) {
  // Cancel in-flight reads before removing data belonging to the previous user.
  void queryClient.cancelQueries();
  queryClient.clear();
  useScopeStore.getState().clearSessionScope();
  queryClient.setQueryData(["auth", "me"], null);
}

export async function fetchWithSession(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "include", ...init });
  const pathname = new URL(url, "http://localhost").pathname;
  const credentialCheck = ["/api/auth/login", "/api/auth/change-password", "/api/auth/logout"].includes(pathname);
  if ((response.status === 401 && !credentialCheck) || (response.status === 403 && pathname === "/api/auth/me")) {
    notifySessionEnded();
  }
  return response;
}
