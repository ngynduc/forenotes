import { pool } from "./pool.js";
import { runMigrations } from "./setup.js";

runMigrations(pool)
  .then(() => {
    process.stdout.write("Migrations applied\n");
    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
