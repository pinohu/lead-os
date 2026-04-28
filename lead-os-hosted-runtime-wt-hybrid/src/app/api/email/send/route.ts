import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getDefaultTemplates } from "@/lib/email-templates";
import { sendEmail, type SendEmailInput } from "@/lib/email-sender";
import { createSelfServiceToken } from "@/lib/self-service-tokens";
import { resolveTenantConfig } from "@/lib/tenant";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TO_LENGTH = 254;

function generateUnsubscribeToken(email: string, tenant: string): string {
  return createSelfServiceToken("unsubscribe", email, tenant, 24) ?? "";
}

function generatePreferencesToken(email: string, tenantId: string): string {
  return createSelfServiceToken("preferences", email, tenantId, 32) ?? "";
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body.to || typeof body.to !== "string" || !EMAIL_PATTERN.test(body.to) || body.to.length > MAX_TO_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "to must be a valid email address" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.templateId || typeof body.templateId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "templateId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.context || typeof body.context !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "context object is required" }, meta: null },
        { status: 400, headers },
      );
    }

    getDefaultTemplates();

    const recipientEmail = body.to.trim();
    const tenantId = body.tenantId;
    const context = { ...body.context };

    if (!context.unsubscribeUrl || !context.brandName || !context.siteUrl) {
      const tenant = await resolveTenantConfig(tenantId);
      if (!context.brandName) context.brandName = tenant.brandName;
      if (!context.siteUrl) context.siteUrl = tenant.siteUrl;
      if (!context.supportEmail) context.supportEmail = tenant.supportEmail;
      if (!context.currentYear) context.currentYear = new Date().getFullYear().toString();

      if (!context.unsubscribeUrl) {
        const unsubToken = generateUnsubscribeToken(recipientEmail, tenantId);
        if (!unsubToken) {
          return NextResponse.json(
            { data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Self-service links are not configured" }, meta: null },
            { status: 503, headers },
          );
        }
        context.unsubscribeUrl = `${tenant.siteUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}&tenant=${encodeURIComponent(tenantId)}&token=${unsubToken}`;
      }
      if (!context.preferencesUrl) {
        const prefToken = generatePreferencesToken(recipientEmail, tenantId);
        if (!prefToken) {
          return NextResponse.json(
            { data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Self-service links are not configured" }, meta: null },
            { status: 503, headers },
          );
        }
        context.preferencesUrl = `${tenant.siteUrl}/preferences?email=${encodeURIComponent(recipientEmail)}&tenant=${encodeURIComponent(tenantId)}&token=${prefToken}`;
      }
    }

    const input: SendEmailInput = {
      to: recipientEmail,
      templateId: body.templateId,
      context,
      tenantId,
      leadKey: body.leadKey,
      emailId: body.emailId,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      replyTo: body.replyTo,
    };

    const result = await sendEmail(input);

    const statusCode = result.ok ? 200 : 422;

    return NextResponse.json(
      { data: result, error: result.ok ? null : { code: "SEND_FAILED", message: result.detail }, meta: null },
      { status: statusCode, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message: "Failed to send email" }, meta: null },
      { status: 500, headers },
    );
  }
}
