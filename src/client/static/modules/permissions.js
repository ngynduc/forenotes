import { state } from "./state.js";

export const ENTITY_PERMISSIONS = {
  case: { create: "case:create", update: "case:update" },
  incident: { create: "incident:create", update: "incident:update" },
  finding: { create: "finding:create", update: "finding:update", delete: "finding:delete" },
  timeline_event: { create: "timeline:create", update: "timeline:update", delete: "timeline:delete" },
  task: { create: "task:create", update: "task:update", delete: "task:update" },
  query: { create: "query:create", update: "query:update", delete: "query:delete" },
  custom_tag: { create: "tag:custom_create", update: "tag:custom_update", delete: "tag:custom_update" },
  case_member: { create: "case:member_manage", delete: "case:member_manage" },
  incident_member: { create: "incident:member_manage", delete: "incident:member_manage" },
  user: { create: null }
};

export function can(permission) {
  return !permission || state.permissions.includes(permission);
}

export function actionPermission(entityType, mode) {
  return ENTITY_PERMISSIONS[entityType]?.[mode] || null;
}

export function permissionMessage(permission, action = "perform this action") {
  return `You do not have permission to ${action}. Required permission: ${permission}`;
}

export function permissionAttrs(permission, action) {
  if (can(permission)) {
    return "";
  }
  return `disabled aria-disabled="true" title="${permissionMessage(permission, action)}"`;
}
