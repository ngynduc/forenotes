import { randomUUID } from "node:crypto";
import type { Database } from "./types.js";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../permissions/catalog.js";

const ATTACK_TAG_SEED = [
  {
    attackId: "TA0002",
    name: "Execution",
    type: "tactic",
    tactic: "Execution"
  },
  {
    attackId: "T1003",
    name: "OS Credential Dumping",
    type: "technique",
    tactic: "Credential Access"
  },
  {
    attackId: "T1059",
    name: "Command and Scripting Interpreter",
    type: "technique",
    tactic: "Execution"
  },
  {
    attackId: "T1059.001",
    name: "PowerShell",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution"
  },
  {
    attackId: "TA0006",
    name: "Credential Access",
    type: "tactic",
    tactic: "Credential Access"
  }
] as const;

export async function bootstrapSecurityModel(database: Database) {
  for (const permission of PERMISSIONS) {
    await database.query(
      `
        insert into permissions (id, key, description)
        values ($1, $2, $3)
        on conflict (key) do update set description = excluded.description
      `,
      [randomUUID(), permission.key, permission.description]
    );
  }

  for (const [role, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionKey of permissionKeys) {
      await database.query(
        `
          insert into role_permissions (role, permission_key)
          values ($1, $2)
          on conflict do nothing
        `,
        [role, permissionKey]
      );
    }
  }

  for (const tag of ATTACK_TAG_SEED) {
    await database.query(
      `
        insert into attack_tags (
          id, attack_id, name, type, parent_attack_id, tactic, attack_version, external_url
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (attack_id) do update set
          name = excluded.name,
          type = excluded.type,
          parent_attack_id = excluded.parent_attack_id,
          tactic = excluded.tactic,
          attack_version = excluded.attack_version,
          external_url = excluded.external_url,
          updated_at = now()
      `,
      [
        randomUUID(),
        tag.attackId,
        tag.name,
        tag.type,
        "parentAttackId" in tag ? tag.parentAttackId : null,
        tag.tactic,
        "phase1-seed",
        `https://attack.mitre.org/${tag.type === "tactic" ? "tactics" : "techniques"}/${tag.attackId}/`
      ]
    );
  }
}
