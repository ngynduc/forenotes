#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const [builtEntry, sourceEntry] = process.argv.slice(2);

if (!builtEntry || !sourceEntry) {
  process.stderr.write("Usage: run-node-or-tsx <built-entry.js> <source-entry.ts>\n");
  process.exit(1);
}

const useBuiltEntry = process.env.NODE_ENV === "production";
const command = useBuiltEntry ? process.execPath : "npx";
const args = useBuiltEntry ? [builtEntry] : ["tsx", sourceEntry];

if (useBuiltEntry && !existsSync(builtEntry)) {
  process.stderr.write(`Built entrypoint not found: ${builtEntry}. Build the app image or run npm run build first.\n`);
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env
});

if (result.error) {
  process.stderr.write(`${result.error.stack ?? result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
