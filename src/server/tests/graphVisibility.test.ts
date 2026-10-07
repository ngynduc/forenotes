import { randomUUID } from "node:crypto";
import { newDb } from "pg-mem";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { runMigrations } from "../db/setup.js";
import type { GraphResponse } from "../../shared/graph-types.js";

async function setup() {
  const adapter = newDb().adapters.createPg();
  const pool = new adapter.Pool();
  await runMigrations(pool);
  const userId = randomUUID();
  await pool.query("insert into users (id, username, email, display_name, global_role) values ($1, 'graph-commander', 'graph@example.invalid', 'Graph commander', 'commander')", [userId]);
  const app = createApp(pool, { accessLogWriter: () => undefined });
  const caseResponse = await request(app).post("/api/cases").set("x-user-id", userId).send({ caseName: "Graph visibility", status: "open" });
  expect(caseResponse.status).toBe(201);
  const caseId = caseResponse.body.case.id as string;
  const incidentResponse = await request(app).post(`/api/cases/${caseId}/incidents`).set("x-user-id", userId).send({ name: "Graph visibility", status: "open" });
  expect(incidentResponse.status).toBe(201);
  const incidentId = incidentResponse.body.incident.id as string;
  const findingId = randomUUID();
  const otherFindingId = randomUUID();
  for (const id of [findingId, otherFindingId]) {
    await pool.query("insert into findings (id, incident_id, title, status, owner_user_id, created_by_user_id) values ($1, $2, 'Tagged evidence', 'draft', $3, $3)", [id, incidentId, userId]);
  }
  const tagResponse = await request(app).post(`/api/cases/${caseId}/custom-tags`).set("x-user-id", userId).send({ name: "Graph tag", color: "#ff0000" });
  expect(tagResponse.status).toBe(201);
  const tagId = tagResponse.body.customTag.id as string;
  await pool.query("insert into finding_custom_tags (finding_id, custom_tag_id, incident_id, case_id) values ($1, $2, $3, $4)", [findingId, tagId, incidentId, caseId]);
  const technique = (await pool.query("select id from attack_tags where attack_id = 'T1059.001'")).rows[0];
  const tactic = (await pool.query("select id from attack_tags where attack_id = 'TA0002'")).rows[0];
  await pool.query("insert into finding_attack_tags (finding_id, attack_tag_id, incident_id) values ($1, $2, $3)", [findingId, technique.id, incidentId]);
  for (const [type, targetId] of [["tag", tagId], ["mitre_tactic", tactic.id], ["finding", otherFindingId]]) {
    await pool.query("insert into incident_entity_links (id, incident_id, source_type, source_id, target_type, target_id, link_type, created_by_user_id) values ($1, $2, 'finding', $3, $4, $5, 'related_to', $6)", [randomUUID(), incidentId, findingId, type, targetId, userId]);
  }
  return { pool, app, userId, incidentId, findingId, otherFindingId, tagId, techniqueId: technique.id };
}

describe("Relationship graph tag visibility", () => {
  let context: Awaited<ReturnType<typeof setup>>;
  beforeAll(async () => { context = await setup(); });
  afterAll(async () => { await context?.pool.end(); });

  it("excludes all tag nodes and their manual/derived edges across graph filters", async () => {
    const { app, userId, incidentId, findingId, otherFindingId } = context;
    for (const query of ["mode=overview", "mode=timeline", "mode=investigation", "mode=assets", "mode=tasks", "mode=mitre", "includeDerived=false", "entityTypes=finding,tag,mitre_tactic,mitre_technique"]) {
      const response = await request(app).get(`/api/incidents/${incidentId}/graph?${query}`).set("x-user-id", userId);
      expect(response.status).toBe(200);
      const graph = response.body as GraphResponse;
      expect(graph.nodes.some(n => ["tag", "mitre_tactic", "mitre_technique"].includes(n.type))).toBe(false);
      expect(graph.edges.some(e => ["has_tag", "maps_to", "belongs_to_tactic", "subtechnique_of"].includes(e.type))).toBe(false);
      expect(graph.nodes.map(n => n.entityId)).toEqual(expect.arrayContaining([findingId, otherFindingId]));
      const ids = new Set(graph.nodes.map(n => n.id));
      expect(graph.edges.every(e => ids.has(e.source) && ids.has(e.target))).toBe(true);
      expect(graph.stats).toMatchObject({ totalNodes: graph.nodes.length, totalEdges: graph.edges.length, mitreTechniques: 0, mitreTactics: 0 });
    }
  });

  it("preserves tag attachments and the dedicated MITRE Matrix", async () => {
    const { app, userId, incidentId, findingId, tagId, techniqueId } = context;
    const tags = await request(app).get(`/api/incidents/${incidentId}/findings/${findingId}/tags`).set("x-user-id", userId);
    expect(tags.status).toBe(200);
    expect(JSON.stringify(tags.body)).toContain(tagId);
    expect(JSON.stringify(tags.body)).toContain(techniqueId);
    const matrix = await request(app).get(`/api/incidents/${incidentId}/mitre-matrix`).set("x-user-id", userId);
    expect(matrix.status).toBe(200);
    expect(matrix.body.techniques).toEqual(expect.arrayContaining([expect.objectContaining({ mitreId: "T1059.001" })]));
  });
});
