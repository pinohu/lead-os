import { NextResponse } from "next/server";
import { listCredentials } from "@/lib/credentials-vault";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getLeadRecords } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

const EMAIL_PROVIDER_CATEGORIES = new Set(["communication"]);
const EMAIL_PROVIDERS = new Set(["emailit", "sendgrid", "mailgun", "postmark", "resend", "smtp"]);

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const credentials = listCredentials(tenantConfig.tenantId);
  const leads = await getLeadRecords();

  const brandConfigured = tenantConfig.brandName !== "Lead OS" && tenantConfig.brandName !== "Lead OS Hosted";

  const emailConnected = credentials.some(
    (c) =>
      c.status === "active" &&
      (EMAIL_PROVIDERS.has(c.provider) || EMAIL_PROVIDER_CATEGORIES.has(c.provider)),
  );

  const widgetConfigured = tenantConfig.widgetOrigins.length > 0;

  const firstLeadCaptured = leads.length > 0;

  return NextResponse.json({
    data: {
      brandConfigured,
      emailConnected,
      widgetConfigured,
      firstLeadCaptured,
      scoringReviewed: false,
      goneLive: false,
    },
    error: null,
    meta: null,
  });
}
