// POST /api/intake/complete
// Finalize an intake conversation by routing it through the canonical
// routeLead() helper (which creates the Lead row) and triggering the same
// downstream side-effects the legacy form invokes. Returns a routing
// decision the client uses to render the success state.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { routeLead } from "@/lib/lead-routing";
import {
  sendNewLeadNotification,
  sendConsumerConfirmation,
  sendAdminLeadAlert,
} from "@/lib/email";
import { syncLeadToBoostspace } from "@/lib/lead-external-sync";
import { recordRevenueActionPlan } from "@/lib/revenue-actions";
import { deliverWebhookEvent } from "@/lib/webhook-delivery";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { TCPA_TEXT_V2, TCPA_VERSION } from "@/lib/tcpa-text";
import { CONCIERGE_PHONE_DISPLAY, CONCIERGE_PHONE_TEL } from "@/lib/concierge";
import {
  INTAKE_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/intake/session";
import type { IntakeOutcome, IntakeUrgency } from "@/lib/intake/types";

const CompleteSchema = z.object({
  conversationId: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const { conversationId } = parsed.data;

  const convo = await prisma.intakeConversation.findUnique({
    where: { id: conversationId },
  });
  if (!convo) {
    return NextResponse.json(
      { success: false, error: "conversation-not-found" },
      { status: 404 }
    );
  }

  // C4: only the cookie-bearer that started the conversation can complete it.
  // Legacy pre-cookie rows (sessionToken === null) fall through.
  const presentedSessionToken =
    request.cookies.get(INTAKE_SESSION_COOKIE)?.value ?? null;
  if (!verifySessionToken(convo.sessionToken, presentedSessionToken)) {
    return NextResponse.json(
      { success: false, error: "session-token-mismatch" },
      { status: 403 }
    );
  }

  // ── Idempotent: already-completed conversations return their lead ──
  if (convo.outcomeStatus === "completed" && convo.leadId) {
    const existingLead = await prisma.lead.findUnique({
      where: { id: convo.leadId },
    });
    if (existingLead) {
      const outcome = convo.outcome as unknown as Partial<IntakeOutcome>;
      return NextResponse.json({
        success: true,
        conversationId,
        leadId: existingLead.id,
        statusToken: existingLead.statusToken ?? "",
        routing: buildRoutingResponse(
          existingLead.routeType,
          existingLead.requestedProviderName ?? undefined,
          outcome.urgency
        ),
        closing: "You're all set — confirmation on its way to your inbox.",
      });
    }
  }

  if (convo.currentStep !== "contact") {
    return NextResponse.json(
      {
        success: false,
        error: `conversation-not-ready-to-complete (current step: ${convo.currentStep})`,
      },
      { status: 400 }
    );
  }

  const outcome = convo.outcome as unknown as Partial<IntakeOutcome>;
  if (
    !outcome.contact?.email ||
    !outcome.contact?.tcpaConsent ||
    !outcome.primaryNiche
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "conversation-missing-required-fields",
      },
      { status: 400 }
    );
  }

  try {
    // ── Compose the Lead.message field from the intake outcome ─────
    const messageParts: string[] = [];
    messageParts.push(`[Conversational intake]`);
    messageParts.push(`Problem: ${outcome.problemDescription ?? ""}`);
    if (outcome.urgency) messageParts.push(`Urgency: ${outcome.urgency}`);
    if (outcome.budget && outcome.budget !== "skipped") {
      messageParts.push(`Budget: ${outcome.budget}`);
    }
    if (outcome.zip) messageParts.push(`ZIP: ${outcome.zip}`);
    if (outcome.candidateNiches?.length) {
      const cand = outcome.candidateNiches
        .map(
          (c) =>
            `${c.slug} (${(c.confidence * 100).toFixed(0)}%)`
        )
        .join(", ");
      messageParts.push(`Niche classifier candidates: ${cand}`);
    }
    const composedMessage = messageParts.join("\n");

    const firstName = outcome.contact.firstName ?? "";
    const lastName = outcome.contact.lastName ?? "";
    const leadName = `${firstName} ${lastName}`.trim() || "New Lead";

    const tcpaIpAddress = (request.headers.get("x-forwarded-for") ?? "")
      .split(",")[0]
      .trim();

    // ── Route the lead through the canonical helper (creates the row) ──
    const result = await routeLead(outcome.primaryNiche, cityConfig.slug, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: outcome.contact.phone,
      email: outcome.contact.email,
      message: composedMessage,
      sourcePage: convo.startedFromNicheSlug
        ? `/${convo.startedFromNicheSlug}`
        : "/",
      routingIntent: "general",
      source: "erie-pro-intake-widget",
      timestamp: new Date().toISOString(),
      tcpaConsent: true,
      tcpaConsentText: TCPA_TEXT_V2(cityConfig.domain),
      tcpaConsentVersion: TCPA_VERSION,
      tcpaConsentAt: new Date().toISOString(),
      tcpaIpAddress,
      intakeConversationId: conversationId,
    });

    // Link conversation to lead
    await prisma.intakeConversation.update({
      where: { id: conversationId },
      data: {
        leadId: result.leadId,
        outcomeStatus: "completed",
        currentStep: "complete",
      },
    });

    // ── Revenue action plan (synchronous, like /api/lead) ──────────
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "erie-pro",
      eventType: result.routedTo ? "lead.routed" : "lead.submitted",
      customerEmail: outcome.contact.email,
      serviceSlug: outcome.primaryNiche,
      serviceLabel: outcome.primaryNiche,
      sourcePage: convo.startedFromNicheSlug
        ? `/${convo.startedFromNicheSlug}`
        : "/",
      sourcePageType: "intake_widget",
      metadata: {
        leadId: result.leadId,
        routeType: result.routeType,
        city: cityConfig.slug,
        routedToId: result.routedTo?.id ?? null,
        routedToName: result.routedTo?.businessName ?? null,
        intakeConversationId: conversationId,
        urgency: outcome.urgency,
        budget: outcome.budget,
      },
    }).catch((error) => {
      logger.error(
        "intake.complete",
        "Revenue action plan failed",
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    });

    // ── Background side-effects (mirror /api/lead) ────────────────
    after(async () => {
      try {
        const tasks: Promise<unknown>[] = [];

        if (result.routedTo && result.routedTo.email) {
          tasks.push(
            sendNewLeadNotification(
              result.routedTo.email,
              result.routedTo.businessName,
              leadName,
              outcome.contact!.email,
              outcome.contact!.phone ?? null,
              outcome.primaryNiche!,
              composedMessage
            ).catch((err) => {
              logger.error(
                "intake.complete",
                "Provider notification failed",
                err instanceof Error ? err : new Error(String(err))
              );
            })
          );
        }

        tasks.push(
          sendConsumerConfirmation(
            outcome.contact!.email,
            leadName === "New Lead" ? "" : leadName,
            outcome.primaryNiche!,
            result.routedTo?.businessName ?? null,
            result.statusToken,
            { requestedProviderName: null }
          ).catch((err) => {
            logger.error(
              "intake.complete",
              "Consumer confirmation failed",
              err instanceof Error ? err : new Error(String(err))
            );
          })
        );

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          tasks.push(
            sendAdminLeadAlert(adminEmail, {
              leadName,
              leadEmail: outcome.contact!.email,
              leadPhone: outcome.contact!.phone ?? null,
              niche: outcome.primaryNiche!,
              message: composedMessage,
              routedTo: result.routedTo?.businessName ?? null,
              routeType: result.routeType,
              leadId: result.leadId,
            }).catch((err) => {
              logger.error(
                "intake.complete",
                "Admin alert failed",
                err instanceof Error ? err : new Error(String(err))
              );
            })
          );
        }

        tasks.push(
          audit({
            action: result.routedTo ? "lead.routed" : "lead.submitted",
            entityType: "lead",
            entityId: result.leadId,
            providerId: result.routedTo?.id,
            metadata: {
              niche: outcome.primaryNiche,
              city: cityConfig.slug,
              source: "intake-widget",
              conversationId,
              urgency: outcome.urgency,
            },
          }).catch((err) => {
            logger.error(
              "intake.complete",
              "Audit log failed",
              err instanceof Error ? err : new Error(String(err))
            );
          })
        );

        if (result.routedTo) {
          tasks.push(
            deliverWebhookEvent(result.routedTo.id, "lead.created", {
              leadId: result.leadId,
              niche: outcome.primaryNiche,
              city: cityConfig.slug,
              firstName,
              lastName,
              email: outcome.contact!.email,
              routeType: result.routeType,
              source: "intake-widget",
            }).catch((err) => {
              logger.error(
                "intake.complete",
                "Webhook delivery failed",
                err instanceof Error ? err : new Error(String(err))
              );
            })
          );
        }

        tasks.push(
          syncLeadToBoostspace(result.leadId).catch((err) => {
            logger.error(
              "intake.complete",
              "Boost.space sync failed",
              err instanceof Error ? err : new Error(String(err))
            );
          })
        );

        await Promise.allSettled(tasks);
      } catch (err) {
        logger.error(
          "intake.complete",
          "Background tasks failed",
          err instanceof Error ? err : new Error(String(err))
        );
      }
    });

    return NextResponse.json({
      success: true,
      conversationId,
      leadId: result.leadId,
      statusToken: result.statusToken,
      routing: buildRoutingResponse(
        result.routeType,
        result.routedTo?.businessName ?? undefined,
        outcome.urgency
      ),
      closing: composeClosing(
        result.routeType,
        result.routedTo?.businessName ?? null,
        outcome.urgency
      ),
      actionPlan: actionPlanResult?.plan ?? null,
    });
  } catch (err) {
    logger.error(
      "intake.complete",
      "Failed",
      err instanceof Error ? err : new Error(String(err))
    );
    await prisma.intakeConversation
      .update({
        where: { id: conversationId },
        data: { outcomeStatus: "error" },
      })
      .catch(() => undefined);
    return NextResponse.json(
      { success: false, error: "internal-error" },
      { status: 500 }
    );
  }
}

// ── Routing response composer ─────────────────────────────────────────

function buildRoutingResponse(
  routeType: string,
  providerName: string | undefined,
  urgency: IntakeUrgency | undefined
) {
  const expectedResponseTime =
    urgency === "emergency"
      ? "within the next hour"
      : urgency === "this-week"
      ? "within a business day"
      : "within 2 business days";

  if (routeType === "unmatched") {
    return {
      routeType: "concierge" as const,
      expectedResponseTime: "within an hour",
      nextActionLabel: `Call the concierge: ${CONCIERGE_PHONE_DISPLAY}`,
      nextActionHref: CONCIERGE_PHONE_TEL,
    };
  }
  return {
    routeType: "claimed" as const,
    providerName,
    expectedResponseTime,
    nextActionLabel: providerName
      ? `${providerName} will contact you ${expectedResponseTime}.`
      : `A local provider will contact you ${expectedResponseTime}.`,
  };
}

function composeClosing(
  routeType: string,
  providerName: string | null,
  urgency: IntakeUrgency | undefined
): string {
  if (routeType === "unmatched") {
    return `Nobody has claimed this lane in ${cityConfig.name} yet, so the concierge line will route you to whoever can help right now. Call ${CONCIERGE_PHONE_DISPLAY} if you want to talk to a human immediately.`;
  }
  if (providerName) {
    const window =
      urgency === "emergency"
        ? "within the hour"
        : urgency === "this-week"
        ? "within a business day"
        : "soon";
    return `Connecting you with ${providerName}. They'll be in touch ${window}.`;
  }
  return "You're all set. A local provider will reach out shortly.";
}
