// tests/backup-scripts.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

describe("backup / restore scripts", () => {
  it("backup-db.sh references pg_dump and gzip", () => {
    const s = readFileSync(join(root, "scripts", "backup-db.sh"), "utf8");
    assert.ok(s.includes("pg_dump"));
    assert.ok(s.includes("gzip"));
  });

  it("restore-db.sh references psql and gunzip", () => {
    const s = readFileSync(join(root, "scripts", "restore-db.sh"), "utf8");
    assert.ok(s.includes("psql"));
    assert.ok(s.includes("gunzip"));
  });

  it("verify-backup-archive.mjs rejects tiny non-gzip files", () => {
    const r = spawnSync(
      process.execPath,
      [join(root, "scripts", "verify-backup-archive.mjs"), join(root, "package.json")],
      { encoding: "utf8" },
    );
    assert.notEqual(r.status, 0);
  });
});
