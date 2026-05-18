import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export interface DatabaseClient {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface Database extends DatabaseClient {
  connect?(): Promise<PoolClient>;
}

export function isPool(database: Database): database is Pool {
  return typeof (database as Pool).connect === "function";
}
