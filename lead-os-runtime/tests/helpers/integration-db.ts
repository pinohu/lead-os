import { Client, Pool, type QueryResultRow } from "pg"
import { withEnv } from "../test-helpers.ts"

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://lead_os:lead_os_dev_password@127.0.0.1:5432/lead_os?sslmode=disable"

function getIntegrationDatabaseUrl(): string {
  return process.env.LEAD_OS_TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL
}

export function buildDbUrl(databaseName: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName))
    throw new Error(`Invalid integration database name: ${databaseName}`)
  const parsed = new URL(getIntegrationDatabaseUrl())
  parsed.pathname = `/${databaseName}`
  return parsed.toString()
}

async function ensureDatabaseByUrl(databaseUrl: string): Promise<void> {
  const directClient = new Client({
    connectionString: databaseUrl,
    ssl: false,
  })
  try {
    await directClient.connect()
    await directClient.query("SELECT 1")
    return
  } finally {
    await directClient.end().catch(() => {})
  }
}

export async function ensureIntegrationDatabase(databaseName?: string): Promise<string> {
  const databaseUrl = databaseName
    ? buildDbUrl(databaseName)
    : getIntegrationDatabaseUrl()
  await ensureDatabaseByUrl(databaseUrl)
  return databaseUrl
}

export async function setupIntegrationEnvironment(
  overrides: Record<string, string | undefined> = {},
): Promise<() => void> {
  const databaseUrl = await ensureIntegrationDatabase()
  const restore = withEnv({
    LEAD_OS_DISABLE_DB_POOL: "false",
    DATABASE_URL: databaseUrl,
    LEAD_OS_AUTH_SECRET: process.env.LEAD_OS_AUTH_SECRET ?? "test-auth-secret",
    LEAD_OS_ALLOW_RESET: "true",
    LEAD_OS_SINGLE_TENANT_ENFORCE: process.env.LEAD_OS_SINGLE_TENANT_ENFORCE ?? "false",
    ...overrides,
  })

  const { initializeDatabase, queryPostgres } = await import(
    "../../src/lib/db.ts"
  )
  await initializeDatabase()
  const tablesToTruncate = [
    "autonomy_execution_runs",
    "autonomy_agent_audit_log",
    "autonomy_action_log",
    "autonomy_routing_overrides",
    "autonomy_delivery_overrides",
    "autonomy_follow_up_jobs",
    "funnel_variants",
    "funnel_performance_metrics",
    "node_performance_metrics",
    "learning_state",
    "autonomy_agent_registry",
    "idempotency_records",
    "stripe_webhook_events",
    "operator_audit_log",
    "gtm_use_case_statuses",
    "nodes",
    "billing_subscriptions",
    "billing_plans",
    "lead_os_events",
    "lead_os_provider_executions",
    "lead_os_workflow_runs",
    "lead_os_leads",
    "leads",
  ]
  for (const tableName of tablesToTruncate) {
    if (!isSafeTableName(tableName)) continue
    try {
      await queryPostgres(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`)
    } catch {
      // Keep helper resilient across partial migration states.
    }
  }
  try {
    await queryPostgres(
      `INSERT INTO billing_plans (plan_key, display_name, max_nodes, pricing_execution_allowed, api_access_tier)
       VALUES
         ('developer', 'Developer', 500, true, 'full'),
         ('growth', 'Growth', 25, true, 'standard'),
         ('enterprise', 'Enterprise', 999999, true, 'full')
       ON CONFLICT (plan_key) DO NOTHING`,
    )
  } catch {
    // Table may not exist in minimal migration states.
  }
  return restore
}

export interface IntegrationDb {
  available: boolean
  url: string
  pool: Pool
  query: <T extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<import("pg").QueryResult<T>>
}

export async function setupIntegrationDb(databaseName?: string): Promise<IntegrationDb> {
  try {
    const url = await ensureIntegrationDatabase(databaseName)
    const pool = new Pool({
      connectionString: url,
      ssl: false,
    })
    await pool.query("SELECT 1")
    return {
      available: true,
      url,
      pool,
      query: (text, values = []) => pool.query(text, values),
    }
  } catch {
    const fallbackUrl = databaseName ? buildDbUrl(databaseName) : getIntegrationDatabaseUrl()
    const pool = new Pool({
      connectionString: fallbackUrl,
      ssl: false,
    })
    return {
      available: false,
      url: fallbackUrl,
      pool,
      query: (text, values = []) => pool.query(text, values),
    }
  }
}

export { withEnv }

export function setupTestDbEnv(
  overrides: Record<string, string | undefined> = {},
): () => void {
  return withEnv({
    LEAD_OS_DISABLE_DB_POOL: "false",
    DATABASE_URL: overrides.DATABASE_URL ?? getIntegrationDatabaseUrl(),
    LEAD_OS_AUTH_SECRET: overrides.LEAD_OS_AUTH_SECRET ?? "test-auth-secret",
    LEAD_OS_ALLOW_RESET: overrides.LEAD_OS_ALLOW_RESET ?? "true",
    LEAD_OS_SINGLE_TENANT_ENFORCE: overrides.LEAD_OS_SINGLE_TENANT_ENFORCE ?? "false",
    ...overrides,
  })
}

export function withIntegrationDbEnv(
  overrides: Record<string, string | undefined> = {},
): () => void {
  return setupTestDbEnv(overrides)
}

export async function ensureRuntimeMigrations(_databaseName?: string): Promise<void> {
  // Avoid forcing migration re-entry in tests; migration-runner state + partial
  // table objects from previous runs can produce non-deterministic DDL conflicts.
  return
}

export async function setupTestDatabase(databaseName?: string): Promise<{
  restore: () => void
  databaseUrl: string
}> {
  const databaseUrl = await ensureIntegrationDatabase(databaseName)
  const restore = setupTestDbEnv({ DATABASE_URL: databaseUrl })
  const { initializeDatabase } = await import("../../src/lib/db.ts")
  await initializeDatabase()
  return { restore, databaseUrl }
}

function isSafeTableName(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(name)
}

export async function truncateTables(tableNames: string[]): Promise<void> {
  const { queryPostgres } = await import("../../src/lib/db.ts")
  for (const tableName of tableNames) {
    if (!isSafeTableName(tableName))
      throw new Error(`Unsafe table name: ${tableName}`)
    try {
      await queryPostgres(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`)
    } catch {
      // Keep helper resilient across environments with partial migrations.
    }
  }
}
