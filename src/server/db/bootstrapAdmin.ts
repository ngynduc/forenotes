import { pool } from "./pool.js";
import { ensureBootstrapAdmin } from "./bootstrap.js";

ensureBootstrapAdmin(pool)
  .then(() => {
    process.stdout.write("Bootstrap admin ensured\n");
    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
