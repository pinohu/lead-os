// tests/gtm-print-cli.test.ts
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runGtmPrint(args: string[]) {
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", join(root, "scripts", "gtm-print.ts"), "--", ...args],
    { encoding: "utf8", cwd: root },
  );
}

describe("gtm:print CLI", () => {
  it("prints JSON for all use cases", () => {
    const r = runGtmPrint(["--json"]);
    assert.equal(r.status, 0, r.stderr);
    const data = JSON.parse(r.stdout) as { id: number }[];
    assert.equal(data.length, 10);
    assert.equal(data[0]?.id, 1);
  });

  it("filters by id", () => {
    const r = runGtmPrint(["--json", "--id=2"]);
    assert.equal(r.status, 0, r.stderr);
    const data = JSON.parse(r.stdout) as { id: number; slug: string }[];
    assert.equal(data.length, 1);
    assert.equal(data[0]?.id, 2);
    assert.equal(data[0]?.slug, "exclusive-category-ownership");
  });

  it("filters by slug including Erie alias", () => {
    const r = runGtmPrint(["--json", "--slug=erie-plumbing"]);
    assert.equal(r.status, 0, r.stderr);
    const data = JSON.parse(r.stdout) as { slug: string }[];
    assert.equal(data.length, 1);
    assert.equal(data[0]?.slug, "erie-exclusive-niche");
  });
});
