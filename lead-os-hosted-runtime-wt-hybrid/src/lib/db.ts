import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.LEAD_OS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

export function getPool(): Pool | null {
  if (pool) return pool;
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    max: 10,
  });
  return pool;
}

export async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<import("pg").QueryResult<T>> {
  const activePool = getPool();
  if (!activePool) throw new Error("Postgres pool is not available");
  return activePool.query<T>(text, values);
}
