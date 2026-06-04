import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Database } from "./types.js";
import { bootstrapSecurityModel } from "./bootstrap.js";

export async function runMigrations(database: Database) {
  const migrationsDir = path.resolve("src/server/db/migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await database.query(sql);
  }

  await bootstrapSecurityModel(database);
}
