import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import type { Pool } from "pg";

const MIGRATIONS_TABLE = "lead_os_migrations";
const LEGACY_MIGRATION_ALIASES: Record<string, string> = {
  "001_init_core.sql": "001_initial_schema.sql",
  "002_nodes.sql": "006_pricing_production.sql",
  "003_routing_delivery.sql": "003_additional_tables.sql",
  "004_tenants.sql": "002_multi_tenant.sql",
  "005_billing.sql": "007_billing_entitlements_audit.sql",
  "006_pricing_foundation.sql": "005_pricing_autopilot.sql",
  "007_operator_audit.sql": "007_billing_entitlements_audit.sql",
  "008_idempotency.sql": "008_idempotency_records.sql",
  "009_stripe_webhooks.sql": "009_stripe_webhook_idempotency_billing_cols.sql",
};

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`,
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function getMigrationFiles(migrationsDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(migrationsDir);
  } catch {
    return [];
  }
  const aliasPrefixes = new Set([
    "001_init_core.sql",
    "002_nodes.sql",
    "003_routing_delivery.sql",
    "004_tenants.sql",
    "005_billing.sql",
    "006_pricing_foundation.sql",
    "007_operator_audit.sql",
    "008_idempotency.sql",
    "009_stripe_webhooks.sql",
  ]);
  return entries
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => !aliasPrefixes.has(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function runMigrationFile(pool: Pool, filePath: string, filename: string): Promise<void> {
  const sql = await readFile(filePath, "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Strip any existing BEGIN/COMMIT from migration files so we own the transaction.
    const stripped = sql
      .replace(/^\s*BEGIN\s*;?\s*/i, "")
      .replace(/\s*COMMIT\s*;?\s*$/i, "");

    await client.query(stripped);
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
      [filename],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(
      `Migration failed: ${filename} — ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    client.release();
  }
}

export async function runMigrations(pool: Pool): Promise<void> {
  await ensureMigrationsTable(pool);

  const applied = await getAppliedMigrations(pool);
  const canonicalApplied = new Set<string>();
  for (const filename of applied) {
    canonicalApplied.add(filename);
    const canonical = LEGACY_MIGRATION_ALIASES[filename];
    if (canonical) canonicalApplied.add(canonical);
  }

  // Resolve relative to project root (two levels above src/lib/).
  const migrationsDir = resolve(
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "../../../db/migrations",
  );

  const files = await getMigrationFiles(migrationsDir);

  if (files.length === 0) {
    return;
  }

  const pending = files.filter((f) => !canonicalApplied.has(f));
  if (pending.length === 0) {
    return;
  }

  for (const filename of pending) {
    const filePath = join(migrationsDir, filename);
    await runMigrationFile(pool, filePath, filename);
    console.log(`[migration] applied: ${filename}`);
  }
}
