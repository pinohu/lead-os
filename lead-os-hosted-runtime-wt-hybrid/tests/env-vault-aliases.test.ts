import test from "node:test";
import assert from "node:assert/strict";
import { applyEnvVaultAliases } from "../src/lib/env-vault-aliases.ts";

function clearAliasKeys(): void {
  const keys = [
    "AITABLE_API_TOKEN",
    "AITABLE_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_API_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_SIIGNING_SECRET",
    "AI_API_KEY",
    "AI_PROVIDER",
    "OPENAI_API_KEY",
    "OPEN_AI_API_KEY",
    "ANTHROPIC_API_KEY",
    "REOON_API_KEY",
    "REOON_EMAIL_VERIFIER_API_KEY",
  ];
  for (const k of keys) delete process.env[k];
}

test("applyEnvVaultAliases copies AITABLE_API_KEY into AITABLE_API_TOKEN when token unset", () => {
  clearAliasKeys();
  process.env.AITABLE_API_KEY = "vault-token";
  applyEnvVaultAliases();
  assert.equal(process.env.AITABLE_API_TOKEN, "vault-token");
  clearAliasKeys();
});

test("applyEnvVaultAliases does not override explicit canonical", () => {
  clearAliasKeys();
  process.env.AITABLE_API_TOKEN = "explicit";
  process.env.AITABLE_API_KEY = "vault";
  applyEnvVaultAliases();
  assert.equal(process.env.AITABLE_API_TOKEN, "explicit");
  clearAliasKeys();
});

test("applyEnvVaultAliases maps STRIPE webhook typo to STRIPE_WEBHOOK_SECRET", () => {
  clearAliasKeys();
  process.env.STRIPE_SIIGNING_SECRET = "whsec_test";
  applyEnvVaultAliases();
  assert.equal(process.env.STRIPE_WEBHOOK_SECRET, "whsec_test");
  clearAliasKeys();
});

test("applyEnvVaultAliases sets AI_API_KEY from OPENAI when AI unset", () => {
  clearAliasKeys();
  process.env.OPENAI_API_KEY = "sk-test";
  applyEnvVaultAliases();
  assert.equal(process.env.AI_API_KEY, "sk-test");
  assert.equal(process.env.AI_PROVIDER, "openai");
  clearAliasKeys();
});
