import { pool } from "../server/db/pool.js";
import { runMigrations } from "../server/db/setup.js";
import { getDemoAnchorTime, seedDemoDataset } from "../server/devDemo.js";

async function main() {
  await runMigrations(pool);

  const summary = await seedDemoDataset(pool, {
    anchorTime: getDemoAnchorTime()
  });

  process.stdout.write(
    [
      "Demo seed complete",
      `anchorTime=${summary.anchorTime}`,
      `createdUsers=${summary.createdUsers}`,
      `reusedUsers=${summary.reusedUsers}`,
      `createdCases=${summary.createdCases}`,
      `skippedCases=${summary.skippedCases}`,
      `createdIncidents=${summary.createdIncidents}`
    ].join("\n") + "\n"
  );
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
