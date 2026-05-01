import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { runMigrations } from "./migration-runner.ts";

let pool: Pool | null = null;
let migrationsRun: Promise<void> | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.LEAD_OS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

export function getPool(): Pool | null {
  if (pool) return pool;
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=disable") ? false : {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(process.env.DB_SSL_CA_CERT ? { ca: process.env.DB_SSL_CA_CERT } : {}),
    },
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
    idle_in_transaction_session_timeout: 10000,
  });
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (migrationsRun) return migrationsRun;

  migrationsRun = runMigrations(activePool).catch((err) => {
    console.error("[db] migration error:", err instanceof Error ? err.message : String(err));
    migrationsRun = null;
  });

  return migrationsRun;
}

export async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<import("pg").QueryResult<T>> {
  const activePool = getPool();
  if (!activePool) throw new Error("Postgres pool is not available");
  const tenantId = deriveTenantIdForRls(text, values);
  if (tenantId) {
    const client = await activePool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query<T>(text, values);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  return activePool.query<T>(text, values);
}

export function deriveTenantIdForRls(text: string, values: unknown[]): string | undefined {
  const firstValue = values[0];
  if (typeof firstValue !== "string" || firstValue.trim().length === 0) return undefined;
  const normalized = text.replace(/\s+/g, " ").toLowerCase();
  if (normalized.includes("tenant_id = $1") || normalized.includes("tenant_id=$1")) return firstValue;
  if (normalized.includes("tenant_id,") && normalized.includes("values ($1")) return firstValue;
  return undefined;
}

export async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
