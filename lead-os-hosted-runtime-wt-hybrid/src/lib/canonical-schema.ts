import { z } from "zod";

export const LeadSchema = z.object({
  id: z.string(),
  source: z.string(),
  segment: z.string().optional(),
  lifecycleStage: z.enum([
    "anonymous",
    "engaged",
    "captured",
    "qualified",
    "nurturing",
    "booked",
    "offered",
    "converted",
    "onboarding",
    "active",
    "retention-risk",
    "referral-ready",
    "churned",
  ]),
  intentScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  compositeScore: z.number().min(0).max(100),
  predictedValue: z.number().optional(),
  temperature: z.enum(["cold", "warm", "hot", "burning"]),
  persona: z.string().optional(),
  niche: z.string(),
  tenantId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const InteractionSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  type: z.enum([
    "page_view",
    "form_submit",
    "quiz_answer",
    "calculator_use",
    "chat_message",
    "email_open",
    "email_click",
    "sms_reply",
    "call_completed",
    "booking_made",
    "document_signed",
    "payment_made",
    "referral_sent",
    "widget_interaction",
  ]),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()),
  channel: z.string().optional(),
  score: z.number().optional(),
});

export const SessionSchema = z.object({
  sessionId: z.string(),
  leadId: z.string().optional(),
  visitorId: z.string(),
  source: z.string(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  device: z.enum(["desktop", "mobile", "tablet"]),
  startedAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  pageViews: z.number().min(0),
  duration: z.number().min(0),
});

export const ConversionEventSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  funnel: z.string(),
  step: z.string().optional(),
  revenue: z.number().min(0),
  currency: z.string().default("USD"),
  timestamp: z.string().datetime(),
  attribution: z
    .object({
      source: z.string(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
});

export const IntakePayloadSchema = z
  .object({
    source: z.string().min(1).max(50),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    company: z.string().max(200).optional(),
    service: z.string().max(100).optional(),
    niche: z.string().max(100).optional(),
    message: z.string().max(5000).optional(),
    score: z.number().min(0).max(100).optional(),
    returning: z.boolean().optional(),
    askingForQuote: z.boolean().optional(),
    wantsBooking: z.boolean().optional(),
    wantsCheckout: z.boolean().optional(),
    prefersChat: z.boolean().optional(),
    contentEngaged: z.boolean().optional(),
    preferredFamily: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Either email or phone is required",
  });

export const DecisionSignalSchema = z.object({
  source: z.string(),
  service: z.string().optional(),
  niche: z.string().optional(),
  hasEmail: z.boolean(),
  hasPhone: z.boolean(),
  returning: z.boolean().optional(),
  askingForQuote: z.boolean().optional(),
  wantsBooking: z.boolean().optional(),
  wantsCheckout: z.boolean().optional(),
  prefersChat: z.boolean().optional(),
  contentEngaged: z.boolean().optional(),
  score: z.number().optional(),
  preferredFamily: z.string().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type ConversionEvent = z.infer<typeof ConversionEventSchema>;
export type IntakePayload = z.infer<typeof IntakePayloadSchema>;
export type DecisionSignal = z.infer<typeof DecisionSignalSchema>;

export function validateOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Validation failed${context ? ` (${context})` : ""}: ${errors}`,
    );
  }
  return result.data;
}

export function validateSafe<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { valid: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, data: result.data };
  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    ),
  };
}
