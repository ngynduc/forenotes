import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useTasks() {
  const id = useScopeStore((s) => s.selectedIncidentId);
  return useQuery({
    queryKey: ["incidents", id, "tasks"],
    queryFn: () => api.listTasks(id!),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const id = useScopeStore((s) => s.selectedIncidentId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createTask>[1]) => api.createTask(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useUpdateTask() {
  const id = useScopeStore((s) => s.selectedIncidentId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      api.updateTask(id!, taskId, data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}

export function useDeleteTask() {
  const id = useScopeStore((s) => s.selectedIncidentId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(id!, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", id] }),
  });
}
