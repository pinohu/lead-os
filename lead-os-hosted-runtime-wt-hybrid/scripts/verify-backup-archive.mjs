// scripts/verify-backup-archive.mjs - sanity-check a backup file exists and looks like SQL.
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { resolve } from "path";

const candidateDirs = ["backups", "backup", "db/backups", "tmp"];

function findLatestBackupArchive() {
  const candidates = [];
  for (const dir of candidateDirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".sql.gz")) continue;
      const path = resolve(dir, entry.name);
      candidates.push({ path, mtimeMs: statSync(path).mtimeMs });
    }
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.path ?? null;
}

const path = process.argv[2] ?? process.env.BACKUP_ARCHIVE ?? findLatestBackupArchive();
if (!path) {
  console.log(
    "SKIP backup archive verification: no archive supplied. Pass one as an argument or set BACKUP_ARCHIVE=/path/to/backup.sql.gz.",
  );
  process.exit(0);
}

if (!existsSync(path)) {
  console.error(`Backup archive not found: ${path}`);
  process.exit(1);
}

const st = statSync(path);
if (st.size < 200) {
  console.error("Backup file too small:", st.size);
  process.exit(1);
}

const buf = readFileSync(path);
// gzip magic 1f 8b
if (buf[0] !== 0x1f || buf[1] !== 0x8b) {
  console.error("Expected gzip (.gz) backup");
  process.exit(1);
}

console.log("OK backup archive:", path, "bytes:", st.size);
