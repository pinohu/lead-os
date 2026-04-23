#!/usr/bin/env bash
# scripts/restore-db.sh — restore from gzipped pg_dump into target URL (destructive).
set -euo pipefail

if [[ "${1:-}" == "" ]]; then
  echo "Usage: LEAD_OS_RESTORE_TARGET_URL=postgres://... $0 path/to/backup.sql.gz"
  exit 1
fi

DUMP="$1"
: "${LEAD_OS_RESTORE_TARGET_URL:?Set LEAD_OS_RESTORE_TARGET_URL to the database to restore into}"

if [[ ! -f "$DUMP" ]]; then
  echo "File not found: $DUMP"
  exit 1
fi

echo "[restore-db] Restoring $DUMP into configured target (this replaces public schema data where dump defines it)"
gunzip -c "$DUMP" | psql "$LEAD_OS_RESTORE_TARGET_URL" -v ON_ERROR_STOP=1
echo "[restore-db] Done"
