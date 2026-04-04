import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("source includes required integration endpoints", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );

  assert.match(source, /\/api\/widgets\/boot/);
  assert.match(source, /\/api\/intake/);
  assert.match(source, /Open Hosted Assessment/);
});

test("source includes accessibility attributes", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );

  assert.match(source, /role.*dialog/);
  assert.match(source, /aria-modal/);
  assert.match(source, /aria-live/);
  assert.match(source, /aria-label/);
  assert.match(source, /aria-haspopup/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-required/);
});

test("source includes input validation", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );

  assert.match(source, /validateEmail/);
  assert.match(source, /validateMessage/);
  assert.match(source, /MAX_EMAIL_LEN/);
  assert.match(source, /MAX_MESSAGE_LEN/);
});

test("source includes boot config caching", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );

  assert.match(source, /sessionStorage/);
  assert.match(source, /BOOT_CACHE_KEY/);
  assert.match(source, /BOOT_CACHE_TTL_MS/);
});
