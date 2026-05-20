import { useQuery } from "@tanstack/react-query";
import { api, type CurrentUser } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";

export function useCurrentUser() {
  const activeUserId = useScopeStore((s) => s.activeUserId);
  return useQuery({
    queryKey: ["auth", "me", activeUserId],
    queryFn: () => api.getMe(),
    enabled: !!activeUserId,
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
      incident_member: { create: "incident:member_manage", delete: "incident:member_manage" },
    };
    const permission = ENTITY_PERMISSIONS[entityType]?.[mode];
    if (entityType === "task" && mode === "update" && item) {
      return can(permission) || item.assigneeUserId === data?.user?.id || item.assignee_user_id === data?.user?.id;
    }
    return can(permission);
  }

  return { permissions, can, canAccessEntity };
}
