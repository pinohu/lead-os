import {
  getAllowedOperatorEmails as resolveAllowedOperatorEmails,
} from "./operator-auth-core.ts";
import { tenantConfig } from "./tenant.ts";

export function getOperatorAuthSecret() {
  const secret = process.env.LEAD_OS_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("LEAD_OS_AUTH_SECRET is required for operator authentication");
  }
  return secret;
}

export function getConfiguredOperatorEmails() {
  return resolveAllowedOperatorEmails(process.env.LEAD_OS_OPERATOR_EMAILS, [
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    tenantConfig.supportEmail,
  ]);
}
