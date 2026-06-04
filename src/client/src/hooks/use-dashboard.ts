import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useDashboard(enabled = true) {
  const activeUserId = useScopeStore((s) => s.activeUserId);

  return useQuery({
    queryKey: ["dashboard", activeUserId],
    queryFn: () => api.getDashboard(),
    enabled: enabled && !!activeUserId,
    staleTime: 60_000,
  });
}
