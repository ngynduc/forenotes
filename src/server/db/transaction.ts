import type { Database, DatabaseClient } from "./types.js";
import { AsyncLocalStorage } from "node:async_hooks";

interface TransactionState {
  client: DatabaseClient;
  afterCommit: Array<() => void>;
  afterRollback: Array<() => void>;
}

const requestTransaction = new AsyncLocalStorage<TransactionState>();

export function afterTransactionCommit(callback: () => void) {
  const transaction = requestTransaction.getStore();
  if (transaction) transaction.afterCommit.push(callback);
  else callback();
}

export function afterTransactionRollback(callback: () => void) {
  requestTransaction.getStore()?.afterRollback.push(callback);
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
  const state: TransactionState = { client, afterCommit: [], afterRollback: [] };
  let completed = false;
  const finish = async (commit: boolean) => {
    if (completed) {
      return;
    }
    completed = true;
    let committed = false;
    try {
      await client.query(commit ? "commit" : "rollback");
      committed = commit;
      if (commit) requestTransaction.exit(() => state.afterCommit.forEach((callback) => callback()));
    } finally {
      if (!committed) requestTransaction.exit(() => state.afterRollback.forEach((callback) => callback()));
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
  const state: TransactionState = { client, afterCommit: [], afterRollback: [] };
  let committed = false;
  try {
    await client.query("begin");
    // Expose only query: pg clients also have connect(), but cannot be reconnected.
    const transaction: DatabaseClient = { query: client.query.bind(client) };
    const result = await requestTransaction.run(state, () => work(transaction));
    await client.query("commit");
    committed = true;
    requestTransaction.exit(() => state.afterCommit.forEach((callback) => callback()));
    return result;
  } catch (error) {
    if (!committed) {
      try {
        await client.query("rollback");
      } finally {
        requestTransaction.exit(() => state.afterRollback.forEach((callback) => callback()));
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
