import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { resolveNextNurtureStage } from "@/lib/automation";
import { sendEmail } from "@/lib/email-sender";
import { getTemplate, type EmailContext } from "@/lib/email-templates";
import { sendSmsAction, sendWhatsAppAction } from "@/lib/providers";
import { appendEvents, getLeadRecords, markNurtureStageSent } from "@/lib/runtime-store";
import { resolveTenantConfig } from "@/lib/tenant";
import { createCanonicalEvent } from "@/lib/trace";

function generateUnsubscribeToken(email: string, tenant: string): string {
  const secret = process.env.LEAD_OS_AUTH_SECRET;
  if (!secret) throw new Error("LEAD_OS_AUTH_SECRET is required");
  return createHmac("sha256", secret)
    .update(`${email.toLowerCase().trim()}::${tenant}`)
    .digest("hex")
    .slice(0, 24);
}

function buildUnsubscribeUrl(siteUrl: string, email: string, tenantId: string): string {
  const token = generateUnsubscribeToken(email, tenantId);
  return `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenantId)}&token=${token}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Cron not configured" } }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const processed: Array<{ leadKey: string; stage: string; channels: string[] }> = [];

  for (const lead of await getLeadRecords()) {
    const stage = resolveNextNurtureStage(lead);
    if (!stage) continue;

    const tenantId = lead.trace.tenant ?? "default-tenant";
    const tenant = await resolveTenantConfig(tenantId);
    const channels: string[] = [];

    if (stage.channels.includes("email") && lead.email) {
      const template = getTemplate(stage.templateId);

      if (template) {
        const context: EmailContext = {
          firstName: lead.firstName ?? "",
          lastName: lead.lastName ?? "",
          email: lead.email,
          brandName: tenant.brandName,
          siteUrl: tenant.siteUrl,
          supportEmail: tenant.supportEmail,
          nicheName: lead.niche ?? tenant.defaultNiche,
          unsubscribeUrl: buildUnsubscribeUrl(tenant.siteUrl, lead.email, tenantId),
          currentYear: new Date().getFullYear().toString(),
        };

        await sendEmail({
          to: lead.email,
          templateId: stage.templateId,
          context,
          tenantId,
          leadKey: lead.leadKey,
          tags: ["nurture", stage.id],
        });
      } else {
        const context: EmailContext = {
          firstName: lead.firstName ?? "",
          brandName: tenant.brandName,
          siteUrl: tenant.siteUrl,
          supportEmail: tenant.supportEmail,
          nicheName: lead.niche ?? tenant.defaultNiche,
          unsubscribeUrl: buildUnsubscribeUrl(tenant.siteUrl, lead.email, tenantId),
          currentYear: new Date().getFullYear().toString(),
        };

        await sendEmail({
          to: lead.email,
          template: {
            id: stage.templateId,
            name: stage.label,
            subject: `${lead.firstName ? lead.firstName + ", " : ""}${stage.label.toLowerCase()} from ${tenant.brandName}`,
            category: "nurture",
            htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Hi {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">${stage.label} - we wanted to follow up on your {{nicheName}} inquiry.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">Visit <a href="{{siteUrl}}" style="color:#14b8a6;">our website</a> to learn more, or reply to this email with any questions.</p>`,
            textTemplate: `Hi {{firstName}},\n\n${stage.label} - we wanted to follow up on your {{nicheName}} inquiry.\n\nVisit {{siteUrl}} to learn more.\n\nBest,\n{{brandName}}`,
            variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          context,
          tenantId,
          leadKey: lead.leadKey,
          tags: ["nurture", stage.id],
        });
      }
      channels.push("email");
    }

    if (stage.channels.includes("whatsapp") && lead.phone) {
      const tenant = await resolveTenantConfig(lead.trace.tenant ?? "default-tenant");
      await sendWhatsAppAction({
        phone: lead.phone,
        body: `Hi ${lead.firstName ?? "there"}, ${stage.label.toLowerCase()} from ${tenant.brandName}. Visit ${tenant.siteUrl} for your next step.`,
      });
      channels.push("whatsapp");
    }
    if (stage.channels.includes("sms") && lead.phone) {
      const tenant = await resolveTenantConfig(lead.trace.tenant ?? "default-tenant");
      await sendSmsAction({
        phone: lead.phone,
        body: `${lead.firstName ?? "Hi"}, ${stage.label.toLowerCase()} from ${tenant.brandName}: ${tenant.siteUrl}`,
      });
      channels.push("sms");
    }

    await markNurtureStageSent(lead.leadKey, stage.id);
    await appendEvents([
      createCanonicalEvent(lead.trace, "retention_sequence_started", "internal", "NURTURED", {
        stageId: stage.id,
        templateId: stage.templateId,
        label: stage.label,
        channels,
      }),
    ]);
    processed.push({ leadKey: lead.leadKey, stage: stage.id, channels });
  }

  return NextResponse.json({
    data: { processed, count: processed.length },
    error: null,
  });
}
