import { randomUUID } from "node:crypto";
import type { Database } from "./types.js";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../permissions/catalog.js";
import { hashPassword } from "../services/authService.js";
import type { GlobalRole } from "../../shared/domain.js";
import { env } from "../env.js";
import { ATTACK_TAG_SEED } from "./attackTagsSeed.js";

const DEVELOPMENT_USERS: Array<{
  username: string;
  email: string;
  displayName: string;
  globalRole: GlobalRole;
  password: string;
}> = [
  { username: "admin", email: "admin@example.com", displayName: "Admin", globalRole: "admin", password: "admin123" },
  {
    username: "commander",
    email: "commander@example.com",
    displayName: "Commander",
    globalRole: "commander",
    password: "commander123"
  },
  {
    username: "lead",
    email: "lead@example.com",
    displayName: "Response Lead",
    globalRole: "response_lead",
    password: "lead123"
  },
  {
    username: "analyst",
    email: "analyst@example.com",
    displayName: "Analyst",
    globalRole: "analyst",
    password: "analyst123"
  },
  { username: "viewer", email: "viewer@example.com", displayName: "Viewer", globalRole: "viewer", password: "viewer123" }
];

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
        tag.attackVersion,
        tag.externalUrl
      ]
    );
  }

  if (shouldSeedDevelopmentUsers()) {
    await ensureDevelopmentUsers(database);
  }

  await ensureBootstrapAdmin(database);
}

async function ensureDevelopmentUsers(database: Database) {
  for (const user of DEVELOPMENT_USERS) {
    await database.query(
      `
        insert into users (id, username, email, display_name, global_role, status, password_hash)
        values ($1, $2, $3, $4, $5, 'active', $6)
        on conflict (email) do update set
          username = excluded.username,
          display_name = excluded.display_name,
          global_role = excluded.global_role,
          status = excluded.status,
          password_hash = excluded.password_hash,
          updated_at = now()
      `,
      [
        randomUUID(),
        user.username,
        user.email,
        user.displayName,
        user.globalRole,
        await hashPassword(user.password)
      ]
    );
  }
}

async function ensureBootstrapAdmin(database: Database) {
  const existingAdmin = await database.query("select 1 from users where global_role = 'admin' limit 1");
  if (existingAdmin.rowCount && existingAdmin.rowCount > 0) {
    return;
  }

  if (process.env.NODE_ENV === "production" && env.FORENOTES_BOOTSTRAP_ADMIN_PASSWORD === "ChangeMe123!") {
    throw new Error("Refusing to bootstrap production with the default admin password.");
  }

  await database.query(
    `
      insert into users (
        id, username, email, display_name, global_role, status, password_hash, must_change_password, is_bootstrap_admin
      )
      values ($1, $2, $3, $4, 'admin', 'active', $5, $6, true)
      on conflict (email) do nothing
    `,
    [
      randomUUID(),
      normalizeUsername(env.FORENOTES_BOOTSTRAP_ADMIN_USERNAME),
      env.FORENOTES_BOOTSTRAP_ADMIN_EMAIL,
      env.FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME,
      await hashPassword(env.FORENOTES_BOOTSTRAP_ADMIN_PASSWORD),
      env.FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY || env.FORENOTES_BOOTSTRAP_ADMIN_PASSWORD === "ChangeMe123!"
    ]
  );
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function shouldSeedDevelopmentUsers() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return (
    process.env.FORENOTES_SEED_DEV_USERS === "1" ||
    env.FORENOTES_DEMO_MODE ||
    (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && process.env.VITEST !== "true")
  );
}
