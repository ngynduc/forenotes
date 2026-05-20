import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useDashboard() {
  const activeUserId = useScopeStore((s) => s.activeUserId);

  return useQuery({
    queryKey: ["dashboard", activeUserId],
    queryFn: () => api.getDashboard(),
    enabled: !!activeUserId,
    staleTime: 60_000,
  });
}
