import { Pool } from "pg";
import { env } from "../env.js";
import { runMigrations } from "./setup.js";

// Own pool without the app's statement timeout: schema changes such as index builds may legitimately run long.
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 2 });

runMigrations(pool)
  .then(() => {
    process.stdout.write("Migrations applied\n");
    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
