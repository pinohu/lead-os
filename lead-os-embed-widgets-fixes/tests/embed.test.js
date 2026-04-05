import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src", "index.js"), "utf8");

test("source includes required integration endpoints", () => {
  assert.match(source, /\/api\/widgets\/boot/);
  assert.match(source, /\/api\/intake/);
  assert.match(source, /Open Hosted Assessment/);
});

test("source includes accessibility attributes", () => {
  assert.match(source, /role.*dialog/);
  assert.match(source, /aria-live/);
  assert.match(source, /aria-label/);
  assert.match(source, /aria-haspopup/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-required/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /focus-visible/);
});

test("source includes input validation", () => {
  assert.match(source, /validateEmail/);
  assert.match(source, /validateMessage/);
  assert.match(source, /MAX_EMAIL_LEN/);
  assert.match(source, /MAX_MESSAGE_LEN/);
});

test("source includes boot config caching", () => {
  assert.match(source, /sessionStorage/);
  assert.match(source, /BOOT_CACHE_KEY/);
  assert.match(source, /BOOT_CACHE_TTL_MS/);
});

test("source includes fetch timeout via AbortController", () => {
  assert.match(source, /AbortController/);
  assert.match(source, /FETCH_TIMEOUT_MS/);
});

test("source includes accent color validation", () => {
  assert.match(source, /HEX_COLOR_RE/);
  assert.match(source, /safeAccent/);
});

test("source includes close button and scroll support", () => {
  assert.match(source, /Close widget/);
  assert.match(source, /overflowY/);
  assert.match(source, /maxHeight/);
});

test("source includes unique ID generation", () => {
  assert.match(source, /uid/);
  assert.match(source, /instanceCounter/);
});

test("source includes success message auto-dismiss", () => {
  assert.match(source, /SUCCESS_DISMISS_MS/);
});

test("source includes character counter", () => {
  assert.match(source, /charCounter/);
});
