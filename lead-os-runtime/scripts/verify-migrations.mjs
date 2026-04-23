// scripts/verify-migrations.mjs — verify ordered SQL migrations exist (optional DB check).
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "db", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

let prev = "";
for (const f of files) {
  if (prev && f <= prev) {
    console.error("Migration ordering issue:", prev, f);
    process.exit(1);
  }
  const sql = readFileSync(join(dir, f), "utf8");
  if (!sql.trim()) {
    console.error("Empty migration:", f);
    process.exit(1);
  }
  prev = f;
  console.log("OK", f);
}

console.error(`Verified ${files.length} migration files in ${dir}`);

const url = process.env.LEAD_OS_DATABASE_URL || process.env.DATABASE_URL;
if (url) {
  try {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: url, max: 1 });
    const r = await pool.query(
      "SELECT filename FROM lead_os_migrations ORDER BY id ASC",
    );
    const applied = new Set(r.rows.map((x) => x.filename));
    const missing = files.filter((f) => !applied.has(f));
    if (missing.length) {
      console.error("Not yet applied:", missing.join(", "));
      process.exitCode = 2;
    } else {
      console.error("All local migration files recorded in lead_os_migrations.");
    }
    await pool.end();
  } catch (e) {
    console.error("DB check skipped/failed:", e?.message || e);
    process.exitCode = 2;
  }
} else {
  console.error("DATABASE_URL not set — file-only verification done.");
}
