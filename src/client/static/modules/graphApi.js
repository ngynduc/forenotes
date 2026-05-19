import { api } from "./api.js";

export async function fetchIncidentGraph(incidentId, params = {}) {
  const searchParams = new URLSearchParams();

  if (params.mode) searchParams.set("mode", params.mode);
  if (params.entityTypes?.length) searchParams.set("entityTypes", params.entityTypes.join(","));
  if (params.linkTypes?.length) searchParams.set("linkTypes", params.linkTypes.join(","));
  if (params.includeDerived !== undefined) searchParams.set("includeDerived", String(params.includeDerived));
  if (params.includeManual !== undefined) searchParams.set("includeManual", String(params.includeManual));
  if (params.depth) searchParams.set("depth", params.depth);
  if (params.q) searchParams.set("q", params.q);

  const queryString = searchParams.toString();
  return api(`/api/incidents/${incidentId}/graph${queryString ? `?${queryString}` : ""}`);
}

export async function fetchMitreMatrix(incidentId, params = {}) {
  const searchParams = new URLSearchParams();

  if (params.includeSubtechniques !== undefined) searchParams.set("includeSubtechniques", String(params.includeSubtechniques));
  if (params.minEvidence) searchParams.set("minEvidence", String(params.minEvidence));
  if (params.q) searchParams.set("q", params.q);
  if (params.tactic) searchParams.set("tactic", params.tactic);
  if (params.entityType) searchParams.set("entityType", params.entityType);

  const queryString = searchParams.toString();
  return api(`/api/incidents/${incidentId}/mitre-matrix${queryString ? `?${queryString}` : ""}`);
}

export function createEntityLink(incidentId, payload) {
  return api(`/api/incidents/${incidentId}/entity-links`, "POST", payload);
}

export function deleteEntityLink(incidentId, linkId) {
  return api(`/api/incidents/${incidentId}/entity-links/${linkId}`, "DELETE");
}
