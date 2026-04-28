import test from "node:test";
import assert from "node:assert/strict";
import {
  getConfiguredOperatorEmails,
  getOperatorAuthSecret,
} from "../src/lib/operator-auth-config.ts";

test("operator auth has no hard-coded personal email fallback", () => {
  const originalOperatorEmails = process.env.LEAD_OS_OPERATOR_EMAILS;
  const originalSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  delete process.env.LEAD_OS_OPERATOR_EMAILS;
  delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  try {
    assert.equal(getConfiguredOperatorEmails().includes("polycarpohu@gmail.com"), false);
  } finally {
    if (originalOperatorEmails === undefined) {
      delete process.env.LEAD_OS_OPERATOR_EMAILS;
    } else {
      process.env.LEAD_OS_OPERATOR_EMAILS = originalOperatorEmails;
    }
    if (originalSupportEmail === undefined) {
      delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
    } else {
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL = originalSupportEmail;
    }
  }
});

test("operator auth fails closed when LEAD_OS_AUTH_SECRET is missing", async () => {
  const originalSecret = process.env.LEAD_OS_AUTH_SECRET;
  delete process.env.LEAD_OS_AUTH_SECRET;

  try {
    assert.throws(() => getOperatorAuthSecret(), /LEAD_OS_AUTH_SECRET is required/);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.LEAD_OS_AUTH_SECRET;
    } else {
      process.env.LEAD_OS_AUTH_SECRET = originalSecret;
    }
  }
});
