import {
  Client,
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";
import { runMigrations } from "./migration-runner.ts";

let pool: Pool | null = null;
let migrationsRun: Promise<void> | null = null;

function requireDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) return connectionString;
  throw new Error("DATABASE_URL is required for PostgreSQL connectivity.");
}

function shouldUseSsl(connectionString: string): boolean {
  if (connectionString.includes("sslmode=disable")) return false;
  if (connectionString.includes("localhost")) return false;
  if (connectionString.includes("127.0.0.1")) return false;
  return process.env.DB_SSL === "false" ? false : true;
}

export function getDatabaseUrl(): string {
  return requireDatabaseUrl();
}

export function getClient(): Client {
  return new Client({
    connectionString: requireDatabaseUrl(),
    ssl: shouldUseSsl(requireDatabaseUrl()) ? { rejectUnauthorized: false } : false,
  });
}

export async function connectClient(): Promise<Client> {
  const client = getClient();
  await client.connect();
  return client;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  const client = await connectClient();
  try {
    return await client.query<T>(text, values);
  } finally {
    await client.end();
  }
}

export function getPool(): Pool {
  if (pool) return pool;
  const connectionString = requireDatabaseUrl();
  pool = new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  if (migrationsRun) return migrationsRun;
  migrationsRun = runMigrations(getPool()).catch((error) => {
    migrationsRun = null;
    throw error;
  });
  return migrationsRun;
}

export async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  transactionPool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await transactionPool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
