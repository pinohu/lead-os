import {
  getAllowedOperatorEmails as resolveAllowedOperatorEmails,
  normalizeOrigin,
} from "./operator-auth-core.ts";
import { tenantConfig } from "./tenant.ts";

function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production"
  );
}

export function getOperatorAuthSecret() {
  const secret = process.env.LEAD_OS_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("LEAD_OS_AUTH_SECRET is required for operator authentication");
  }
  return secret;
}

export function getConfiguredOperatorEmails() {
  const emails = resolveAllowedOperatorEmails(process.env.LEAD_OS_OPERATOR_EMAILS);
  if (emails.length === 0 && isProductionRuntime()) {
    throw new Error("LEAD_OS_OPERATOR_EMAILS is required in production for operator authentication");
  }
  return emails;
}

export function getCanonicalSiteOrigin() {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL?.trim() || tenantConfig.siteUrl);
}
