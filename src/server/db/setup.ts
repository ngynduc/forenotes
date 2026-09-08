import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Database } from "./types.js";
import { bootstrapSecurityModel } from "./bootstrap.js";
import { withTransaction } from "./transaction.js";

export async function runMigrations(database: Database) {
  const migrationsDir = path.resolve("src/server/db/migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  await database.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const existingSchema = await database.query("select 1 from information_schema.tables where table_name = 'users'");
  if (existingSchema.rowCount && existingSchema.rowCount > 0) {
    const recorded = await database.query<{ filename: string }>("select filename from schema_migrations");
    if (recorded.rowCount === 0) {
      for (const file of files) {
        await database.query("insert into schema_migrations (filename) values ($1) on conflict do nothing", [file]);
      }
    }
  }

  for (const file of files) {
    const applied = await database.query("select 1 from schema_migrations where filename = $1", [file]);
    if (applied.rowCount && applied.rowCount > 0) {
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await withTransaction(database, async (transaction) => {
      await transaction.query(sql);
      await transaction.query("insert into schema_migrations (filename) values ($1)", [file]);
    });
  }

  await bootstrapSecurityModel(database);
}
