import type { Database, DatabaseClient } from "./types.js";
import { AsyncLocalStorage } from "node:async_hooks";

interface TransactionState {
  client: DatabaseClient;
  afterCommit: Array<() => void>;
}

const requestTransaction = new AsyncLocalStorage<TransactionState>();

export function afterTransactionCommit(callback: () => void) {
  const transaction = requestTransaction.getStore();
  if (transaction) transaction.afterCommit.push(callback);
  else callback();
}

export function createRequestScopedDatabase(database: Database): Database {
  return {
    query<T extends import("pg").QueryResultRow = import("pg").QueryResultRow>(text: string, params?: unknown[]) {
      return (requestTransaction.getStore()?.client ?? database).query<T>(text, params);
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
  const state: TransactionState = { client, afterCommit: [] };
  let completed = false;
  const finish = async (commit: boolean) => {
    if (completed) {
      return;
    }
    completed = true;
    try {
      await client.query(commit ? "commit" : "rollback");
      if (commit) requestTransaction.exit(() => state.afterCommit.forEach((callback) => callback()));
    } finally {
      client.release();
    }
  };

  requestTransaction.run(state, () => {
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
    const state: TransactionState = { client, afterCommit: [] };
    const result = await requestTransaction.run(state, () => work(client));
    await client.query("commit");
    requestTransaction.exit(() => state.afterCommit.forEach((callback) => callback()));
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
