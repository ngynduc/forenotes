import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";

export async function requireSupportedAgentFindingConfirmation(database: Database, findingId: string) {
  const finding = await database.query<{ created_by_agent: boolean; incident_id: string }>(
    "select created_by_agent,incident_id from findings where id=$1",
    [findingId]
  );
  if (!finding.rowCount || !finding.rows[0].created_by_agent) return;
  const support = await database.query(
    `select 1 from finding_observations fo
     join observations o on o.id=fo.observation_id
     join observation_evidence oe on oe.observation_id=o.id
     join evidence_records e on e.id=oe.evidence_id
     join incidents i on i.id=$2
     where fo.finding_id=$1 and o.case_id=i.case_id and e.case_id=i.case_id limit 1`,
    [findingId, finding.rows[0].incident_id]
  );
  if (!support.rowCount) {
    throw new AppError(409, "Agent finding requires a complete evidence and observation support chain before confirmation.");
  }
}
