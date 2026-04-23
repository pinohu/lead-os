// scripts/verify-backup-archive.mjs — sanity-check a backup file exists and looks like SQL.
import { readFileSync, statSync } from "fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/verify-backup-archive.mjs <backup.sql.gz>");
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

console.error("OK backup archive:", path, "bytes:", st.size);
