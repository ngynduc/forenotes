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
  admin: [...PERMISSION_KEYS],
  commander: [...PERMISSION_KEYS],
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
    "report_template:create",
    "report_template:update",
    "report_template:delete",
    "report:read",
    "report:generate",
    "report:update",
    "report:delete",
    "report:export",
    "llm_settings:manage",
    "tag:custom_create",
    "tag:custom_update",
    "notification:read"
  ],
  viewer: [
    "entity_link:read",
    "graph:read",
    "mitre_matrix:read",
    "report:read",
    "report:export",
    "notification:read"
  ]
};
