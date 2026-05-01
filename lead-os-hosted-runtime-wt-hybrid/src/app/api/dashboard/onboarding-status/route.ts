import { NextResponse } from "next/server";
import { listCredentials } from "@/lib/credentials-vault";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getChecklistProgress, emitChecklistEvent } from "@/lib/onboarding-events";
import { getLeadRecords } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

const EMAIL_PROVIDERS = new Set(["emailit", "sendgrid", "mailgun", "postmark", "resend", "smtp"]);
const EMAIL_PROVIDER_CATEGORIES = new Set(["communication"]);

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  // Resolve tenant: prefer explicit query/header, fall back to singleton config.
  const url = new URL(request.url);
  const tenantId =
    request.headers.get("x-tenant-id") ??
    url.searchParams.get("tenantId") ??
    tenantConfig.tenantId;

  // Derive live-state steps that can be auto-detected from current config.
  const credentials = listCredentials(tenantId);
  const leads = await getLeadRecords();

  const brandConfiguredLive =
    tenantConfig.brandName !== "Lead OS";

  const emailConnectedLive = credentials.some(
    (c) =>
      c.status === "active" &&
      (EMAIL_PROVIDERS.has(c.provider) || EMAIL_PROVIDER_CATEGORIES.has(c.provider)),
  );

  const widgetConfiguredLive = tenantConfig.widgetOrigins.length > 0;
  const firstLeadCapturedLive = leads.length > 0;

  // Emit events for auto-detected completions so the event store stays in sync.
  const now = new Date().toISOString();
  const autoEmits: Promise<void>[] = [];

  if (brandConfiguredLive) {
    autoEmits.push(
      emitChecklistEvent({ tenantId, eventType: "brand-configured", occurredAt: now }),
    );
  }
  if (emailConnectedLive) {
    autoEmits.push(
      emitChecklistEvent({ tenantId, eventType: "email-connected", occurredAt: now }),
    );
  }
  if (widgetConfiguredLive) {
    autoEmits.push(
      emitChecklistEvent({ tenantId, eventType: "widget-configured", occurredAt: now }),
    );
  }
  if (firstLeadCapturedLive) {
    autoEmits.push(
      emitChecklistEvent({ tenantId, eventType: "first-lead-captured", occurredAt: now }),
    );
  }

  await Promise.all(autoEmits);

  // Read merged progress from the event store (includes manual steps like scoringReviewed / goneLive).
  const progress = await getChecklistProgress(tenantId);

  return NextResponse.json({
    data: {
      brandConfigured: progress.brandConfigured,
      emailConnected: progress.emailConnected,
      widgetConfigured: progress.widgetConfigured,
      firstLeadCaptured: progress.firstLeadCaptured,
      scoringReviewed: progress.scoringReviewed,
      goneLive: progress.goneLive,
    },
    error: null,
    meta: {
      completedAt: progress.completedAt ?? null,
      updatedAt: progress.updatedAt,
    },
  });
}
