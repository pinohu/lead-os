#!/usr/bin/env bash
# scripts/backup-db.sh — timestamped pg_dump of LEAD_OS primary database.
set -euo pipefail

URL="${LEAD_OS_DATABASE_URL:-${DATABASE_URL:-}}"
: "${URL:?Set LEAD_OS_DATABASE_URL or DATABASE_URL}"

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
OUT_DIR="${LEAD_OS_BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
OUT_FILE="${OUT_DIR}/lead-os-${TS}.sql.gz"

echo "[backup-db] Writing $OUT_FILE"
pg_dump "$URL" --no-owner --no-acl | gzip -c > "$OUT_FILE"
ls -la "$OUT_FILE"
echo "[backup-db] Done"
