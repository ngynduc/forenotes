import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-auth";

interface PermissionGateProps {
  permission?: string | null;
  entityType?: string;
  mode?: "create" | "update" | "delete";
  item?: Record<string, unknown> | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  entityType,
  mode,
  item,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAccessEntity } = usePermissions();

  if (entityType && mode) {
    return canAccessEntity(entityType, mode, item) ? <>{children}</> : <>{fallback}</>;
  }

  if (permission) {
    return can(permission) ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}
