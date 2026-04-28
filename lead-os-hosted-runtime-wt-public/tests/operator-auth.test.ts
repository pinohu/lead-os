import test from "node:test";
import assert from "node:assert/strict";
import {
  getConfiguredOperatorEmails,
  getOperatorAuthSecret,
} from "../src/lib/operator-auth-config.ts";

test("operator auth uses only LEAD_OS_OPERATOR_EMAILS for allowed operators", () => {
  const originalOperatorEmails = process.env.LEAD_OS_OPERATOR_EMAILS;
  const originalSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  delete process.env.LEAD_OS_OPERATOR_EMAILS;
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@yourdeputy.com";

  try {
    assert.deepEqual(getConfiguredOperatorEmails(), []);
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

test("operator auth requires LEAD_OS_OPERATOR_EMAILS in production", () => {
  const originalOperatorEmails = process.env.LEAD_OS_OPERATOR_EMAILS;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT;

  delete process.env.LEAD_OS_OPERATOR_EMAILS;
  process.env.NODE_ENV = "production";
  delete process.env.VERCEL_ENV;
  delete process.env.RAILWAY_ENVIRONMENT;

  try {
    assert.throws(
      () => getConfiguredOperatorEmails(),
      /LEAD_OS_OPERATOR_EMAILS is required in production/,
    );
  } finally {
    if (originalOperatorEmails === undefined) {
      delete process.env.LEAD_OS_OPERATOR_EMAILS;
    } else {
      process.env.LEAD_OS_OPERATOR_EMAILS = originalOperatorEmails;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    if (originalRailwayEnvironment === undefined) {
      delete process.env.RAILWAY_ENVIRONMENT;
    } else {
      process.env.RAILWAY_ENVIRONMENT = originalRailwayEnvironment;
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
