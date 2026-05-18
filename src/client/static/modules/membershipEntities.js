import { OPTION_SETS, state } from "./state.js";
import { cleanObject } from "./helpers.js";

export const MEMBERSHIP_ENTITY_DEFINITIONS = {
  user: {
    collection: "users",
    label: "User",
    createTitle: "Create User",
    editTitle: "Create User",
    createAction: "Create User",
    updateAction: "Create User",
    create: () => ({ url: "/api/users", method: "POST", includeAuth: false }),
    fields: () => [
      { name: "email", label: "Email", type: "email", required: true, autofocus: true },
      { name: "displayName", label: "Display Name", type: "text", required: true },
      { name: "globalRole", label: "Global Role", type: "select", options: OPTION_SETS.globalRole, required: true }
    ],
    values: () => ({ email: "", displayName: "", globalRole: "analyst" }),
    fromForm: (data) => cleanObject(data)
  },
  custom_tag: {
    collection: "customTags",
    label: "Custom Tag",
    createTitle: "Create Custom Tag",
    editTitle: "Edit Custom Tag",
    createAction: "Save Tag",
    updateAction: "Save Tag",
    create: () => ({ url: `/api/cases/${state.selectedCaseId}/custom-tags`, method: "POST" }),
    update: (id) => ({ url: `/api/cases/${state.selectedCaseId}/custom-tags/${id}`, method: "PATCH" }),
    delete: (id) => ({ url: `/api/cases/${state.selectedCaseId}/custom-tags/${id}`, method: "DELETE" }),
    fields: () => [
      { name: "name", label: "Tag Name", type: "text", required: true, autofocus: true },
      { name: "color", label: "Color", type: "text", placeholder: "#0f766e" }
    ],
    values: (item) => ({ name: item?.name || "", color: item?.color || "" }),
    fromForm: (data) => cleanObject(data),
    inline: {
      name: { type: "text", payloadKey: "name" },
      color: { type: "text", payloadKey: "color" }
    }
  },
  case_member: {
    label: "Case Member",
    createTitle: "Add Case Member",
    editTitle: "Add Case Member",
    createAction: "Add Member",
    updateAction: "Add Member",
    create: () => ({ url: `/api/cases/${state.selectedCaseId}/members`, method: "POST" }),
    fields: () => [
      { name: "userId", label: "User", type: "user-select", required: true, autofocus: true },
      { name: "caseRole", label: "Case Role", type: "text", required: true }
    ],
    values: () => ({ userId: availableCaseUserOptions()[0]?.value || "", caseRole: "member" }),
    fromForm: (data) => cleanObject(data)
  },
  incident_member: {
    label: "Incident Member",
    createTitle: "Add Incident Member",
    editTitle: "Add Incident Member",
    createAction: "Add Member",
    updateAction: "Add Member",
    create: () => ({ url: `/api/incidents/${state.selectedIncidentId}/members`, method: "POST" }),
    fields: () => [
      { name: "userId", label: "User", type: "incident-user-select", required: true, autofocus: true },
      { name: "incidentRole", label: "Incident Role", type: "text", required: true }
    ],
    values: () => ({ userId: availableIncidentUserOptions()[0]?.value || "", incidentRole: "analyst" }),
    fromForm: (data) => cleanObject(data)
  }
};

export function availableCaseUserOptions() {
  const existingIds = new Set(state.caseMembers.map((member) => member.user_id));
  return state.users
    .filter((user) => !existingIds.has(user.id))
    .map((user) => ({ value: user.id, label: `${user.display_name} (${user.global_role})` }));
}

export function availableIncidentUserOptions() {
  const incidentIds = new Set(state.incidentMembers.map((member) => member.user_id));
  return state.caseMembers
    .filter((member) => !incidentIds.has(member.user_id))
    .map((member) => ({ value: member.user_id, label: `${member.display_name} (${member.case_role})` }));
}

export function memberOptions() {
  return state.incidentMembers.map((member) => ({
    value: member.user_id,
    label: `${member.display_name} (${member.incident_role})`
  }));
}

export function allEntityDefinitions() {
  return {
    ...MEMBERSHIP_ENTITY_DEFINITIONS
  };
}
