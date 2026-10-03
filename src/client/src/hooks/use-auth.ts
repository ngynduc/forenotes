import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginInput } from "@/lib/api";
import { useNavigate } from "react-router";
import { clearClientSession } from "@/lib/session-state";
import { useScopeStore } from "@/stores/scope-store";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.getMe(),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setActiveUser = useScopeStore((s) => s.setActiveUser);

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: async ({ user }) => {
      clearClientSession(qc);
      setActiveUser(user.id);
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      clearClientSession(qc);
      navigate("/login", { replace: true });
    },
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      api.changePassword(input),
    onSuccess: () => {
      clearClientSession(qc);
      navigate("/login", { replace: true });
    },
  });
}

export function usePermissions() {
  const { data } = useCurrentUser();
  const permissions = data?.permissions ?? [];

  function can(permission: string | null | undefined): boolean {
    if (!permission) return true;
    return permissions.includes(permission);
  }

  function canAccessEntity(
    entityType: string,
    mode: "create" | "update" | "delete",
    item?: { assigneeUserId?: string; assignee_user_id?: string } | null
  ): boolean {
    const ENTITY_PERMISSIONS: Record<string, Record<string, string>> = {
      case: { create: "case:create", update: "case:update" },
      incident: { create: "incident:create", update: "incident:update" },
      finding: { create: "finding:create", update: "finding:update", delete: "finding:delete" },
      timeline_event: { create: "timeline:create", update: "timeline:update", delete: "timeline:delete" },
      task: { create: "task:create", update: "task:update", delete: "task:update" },
      query: { create: "query:create", update: "query:update", delete: "query:delete" },
      custom_tag: { create: "tag:custom_create", update: "tag:custom_update", delete: "tag:custom_update" },
      case_member: { create: "case:member_manage", delete: "case:member_manage" },
    };
    const permission = ENTITY_PERMISSIONS[entityType]?.[mode];
    if (entityType === "task" && mode === "update" && item) {
      return can(permission) || item.assigneeUserId === data?.user?.id || item.assignee_user_id === data?.user?.id;
    }
    return can(permission);
  }

  return { permissions, can, canAccessEntity };
}
