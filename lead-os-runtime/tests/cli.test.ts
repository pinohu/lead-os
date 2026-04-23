import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/cli/index.ts";

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

test("parseArgs extracts command from argv", () => {
  const result = parseArgs(["node", "cli.ts", "health"]);
  assert.equal(result.command, "health");
  assert.equal(result.subcommand, null);
  assert.deepEqual(result.positional, []);
  assert.deepEqual(result.flags, {});
});

test("parseArgs extracts command with positional arg", () => {
  const result = parseArgs(["node", "cli.ts", "generate-niche", "immigration-law"]);
  assert.equal(result.command, "generate-niche");
  assert.deepEqual(result.positional, ["immigration-law"]);
});

test("parseArgs extracts flags with values", () => {
  const result = parseArgs(["node", "cli.ts", "score", "--source", "referral", "--pages", "5"]);
  assert.equal(result.command, "score");
  assert.equal(result.flags.source, "referral");
  assert.equal(result.flags.pages, "5");
});

test("parseArgs extracts boolean flags", () => {
  const result = parseArgs(["node", "cli.ts", "route", "--returning", "--chat"]);
  assert.equal(result.command, "route");
  assert.equal(result.flags.returning, true);
  assert.equal(result.flags.chat, true);
});

test("parseArgs handles --json flag", () => {
  const result = parseArgs(["node", "cli.ts", "health", "--json"]);
  assert.equal(result.command, "health");
  assert.equal(result.flags.json, true);
});

test("parseArgs handles --help flag", () => {
  const result = parseArgs(["node", "cli.ts", "provision", "--help"]);
  assert.equal(result.command, "provision");
  assert.equal(result.flags.help, true);
});

test("parseArgs handles subcommands for experiments", () => {
  const result = parseArgs(["node", "cli.ts", "experiments", "list"]);
  assert.equal(result.command, "experiments");
  assert.equal(result.subcommand, "list");
});

test("parseArgs handles subcommands for marketplace", () => {
  const result = parseArgs(["node", "cli.ts", "marketplace", "list", "--niche", "roofing"]);
  assert.equal(result.command, "marketplace");
  assert.equal(result.subcommand, "list");
  assert.equal(result.flags.niche, "roofing");
});

test("parseArgs handles design-spec export", () => {
  const result = parseArgs(["node", "cli.ts", "design-spec", "export", "--tenant", "abc"]);
  assert.equal(result.command, "design-spec");
  assert.equal(result.subcommand, "export");
  assert.equal(result.flags.tenant, "abc");
});

test("parseArgs handles design-spec apply with file path", () => {
  const result = parseArgs(["node", "cli.ts", "design-spec", "apply", "design.md"]);
  assert.equal(result.command, "design-spec");
  assert.equal(result.subcommand, "apply");
  assert.deepEqual(result.positional, ["design.md"]);
});

test("parseArgs handles provision with all flags", () => {
  const result = parseArgs([
    "node", "cli.ts", "provision", "my-tenant",
    "--niche", "roofing",
    "--plan", "starter",
    "--email", "admin@test.com",
    "--brand", "RoofPro",
    "--site", "https://roofpro.com",
    "--revenue-model", "managed",
  ]);
  assert.equal(result.command, "provision");
  assert.deepEqual(result.positional, ["my-tenant"]);
  assert.equal(result.flags.niche, "roofing");
  assert.equal(result.flags.plan, "starter");
  assert.equal(result.flags.email, "admin@test.com");
  assert.equal(result.flags.brand, "RoofPro");
  assert.equal(result.flags.site, "https://roofpro.com");
  assert.equal(result.flags["revenue-model"], "managed");
});

test("parseArgs returns empty command for bare --help", () => {
  const result = parseArgs(["node", "cli.ts", "--help"]);
  assert.equal(result.command, "");
  assert.equal(result.flags.help, true);
});

test("parseArgs handles mixed boolean and value flags", () => {
  const result = parseArgs(["node", "cli.ts", "route", "--source", "chat", "--returning", "--score", "85"]);
  assert.equal(result.command, "route");
  assert.equal(result.flags.source, "chat");
  assert.equal(result.flags.returning, true);
  assert.equal(result.flags.score, "85");
});
