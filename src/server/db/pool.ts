import { Pool } from "pg";
import { env } from "../env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  // Fail a request after 10s instead of queueing forever when the pool is exhausted.
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
  // Request transactions span body uploads, so allow slow clients but not abandoned transactions.
  idle_in_transaction_session_timeout: 5 * 60_000
});

// Without a listener, an idle client dropped by Postgres (restart, network blip) crashes the process.
pool.on("error", (error) => {
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event: "db_pool_error", message: error.message })}\n`);
});
