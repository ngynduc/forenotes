import type { PoolClient, QueryResult } from "pg";
import { describe, expect, it, vi } from "vitest";
import { afterTransactionCommit, withTransaction } from "../db/transaction.js";

function fixture() {
  const query = vi.fn(async (sql: string): Promise<QueryResult> => {
    if (sql === "fail") throw new Error("Write failed");
    return { rows: [], rowCount: 0, command: "", oid: 0, fields: [] };
  });
  const reconnect = vi.fn(async () => { throw new Error("Client has already been connected."); });
  const release = vi.fn();
  const client = { query, connect: reconnect, release } as unknown as PoolClient;
  const database = { query, connect: vi.fn(async () => client) };
  return { database, query, reconnect, release };
}

describe("nested transactions", () => {
  it("reuses the connected client and defers callbacks until the outer commit", async () => {
    const { database, query, reconnect, release } = fixture();
    const committed = vi.fn();
    const result = await withTransaction(database, async (outer) => {
      const value = await withTransaction(outer, async (inner) => {
        await inner.query("write");
        afterTransactionCommit(committed);
        return "created";
      });
      expect(committed).not.toHaveBeenCalled();
      return value;
    });
    expect(result).toBe("created");
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["begin", "write", "commit"]);
    expect(database.connect).toHaveBeenCalledTimes(1);
    expect(reconnect).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    expect(committed).toHaveBeenCalledTimes(1);
  });

  it("rolls back the outer transaction and discards callbacks on nested failure", async () => {
    const { database, query, reconnect, release } = fixture();
    const committed = vi.fn();
    await expect(withTransaction(database, async (outer) => {
      await withTransaction(outer, async (inner) => {
        afterTransactionCommit(committed);
        await inner.query("fail");
      });
    })).rejects.toThrow("Write failed");
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["begin", "fail", "rollback"]);
    expect(reconnect).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    expect(committed).not.toHaveBeenCalled();
  });
});
