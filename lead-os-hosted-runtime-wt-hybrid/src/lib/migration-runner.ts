import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import type { Pool } from "pg";

const MIGRATIONS_TABLE = "lead_os_migrations";

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
  return entries
    .filter((f) => f.endsWith(".sql"))
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

  // Resolve relative to project root (two levels above src/lib/).
  const migrationsDir = resolve(
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "../../../db/migrations",
  );

  const files = await getMigrationFiles(migrationsDir);

  if (files.length === 0) {
    return;
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    return;
  }

  for (const filename of pending) {
    const filePath = join(migrationsDir, filename);
    await runMigrationFile(pool, filePath, filename);
    console.log(`[migration] applied: ${filename}`);
  }
}
