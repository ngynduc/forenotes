import type { GlobalRole, PermissionKey } from "../../shared/domain.js";
import { PERMISSION_KEYS } from "../../shared/domain.js";

export interface PermissionDefinition {
  key: PermissionKey;
  description: string;
}

export const PERMISSIONS: PermissionDefinition[] = PERMISSION_KEYS.map((key) => ({
  key,
  description: key
}));

export const ROLE_PERMISSIONS: Record<GlobalRole, PermissionKey[]> = {
  commander: [...PERMISSION_KEYS],
  response_lead: [...PERMISSION_KEYS],
  analyst: [
    "entity_link:read",
    "entity_link:create",
    "graph:read",
    "mitre_matrix:read",
    "finding:create",
    "finding:update",
    "finding:evidence_link",
    "finding:evidence_unlink",
    "timeline:create",
    "timeline:update",
    "indicator:create",
    "indicator:update",
    "query:create",
    "query:update",
    "tag:custom_create",
    "tag:custom_update",
    "notification:read"
  ]
};
