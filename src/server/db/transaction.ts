import type { Database, DatabaseClient } from "./types.js";
import { AsyncLocalStorage } from "node:async_hooks";

const requestTransaction = new AsyncLocalStorage<DatabaseClient>();

export function createRequestScopedDatabase(database: Database): Database {
  return {
    query<T extends import("pg").QueryResultRow = import("pg").QueryResultRow>(text: string, params?: unknown[]) {
      return (requestTransaction.getStore() ?? database).query<T>(text, params);
    }
  };
}

export async function runRequestTransaction(
  database: Database,
  next: () => void,
  onComplete: (commit: () => Promise<void>, rollback: () => Promise<void>) => void
) {
  if (!database.connect) {
    next();
    return;
  }

  const client = await database.connect();
  await client.query("begin");
  let completed = false;
  const finish = async (commit: boolean) => {
    if (completed) {
      return;
    }
    completed = true;
    try {
      await client.query(commit ? "commit" : "rollback");
    } finally {
      client.release();
    }
  };

  requestTransaction.run(client, () => {
    onComplete(() => finish(true), () => finish(false));
    next();
  });
}

export async function withTransaction<T>(database: Database, work: (client: DatabaseClient) => Promise<T>) {
  if (!database.connect) {
    return work(database);
  }

  const client = await database.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
