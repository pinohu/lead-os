// ── Input Validation Schemas (Zod) ──────────────────────────────────
// Centralized validation for all API request bodies.
// Includes phone normalization, email lowercasing, and sanitization.

import { z } from "zod";
import { niches } from "./niches";
import { cityConfig } from "./city-config";

// ── Helpers ──────────────────────────────────────────────────────────

const VALID_NICHE_SLUGS = new Set(niches.map((n) => n.slug));
const VALID_CITIES = new Set([cityConfig.slug]);

/** Strip to digits, then format as E.164: +1XXXXXXXXXX */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // If 10 digits, prepend US country code
  if (digits.length === 10) return `+1${digits}`;
  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Return as-is with + prefix if already long enough
  return digits.length > 10 ? `+${digits}` : `+1${digits}`;
}

/** Strip HTML tags from text to prevent XSS in notifications/templates */
export function sanitizeText(text: string): string {
  return text
    // Decode HTML entities that could bypass tag stripping
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&(lt|gt|amp|quot|apos);/gi, (_, entity) => {
      const map: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }
      return map[entity.toLowerCase()] ?? ""
    })
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Strip remaining angle brackets
    .replace(/[<>]/g, "")
    .trim();
}

// ── Shared Refinements ───────────────────────────────────────────────

const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .transform((e) => e.toLowerCase().trim());

const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number too long")
  .refine(
    (p) => p.replace(/\D/g, "").length >= 10,
    "Phone number must contain at least 10 digits"
  )
  .transform(normalizePhone);

const nicheSchema = z
  .string()
  .refine((n) => VALID_NICHE_SLUGS.has(n), "Unknown niche");

const citySchema = z
  .string()
  .refine((c) => VALID_CITIES.has(c), "Unknown city")
  .default(cityConfig.slug);

// ── API Schemas ──────────────────────────────────────────────────────

/** POST /api/claim */
export const ClaimRequestSchema = z.object({
  niche: nicheSchema,
  tier: z.enum(["standard", "premium", "elite"]).default("standard"),
  providerName: z
    .string()
    .min(2, "Business name is required")
    .max(200, "Business name too long")
    .transform(sanitizeText),
  providerEmail: emailSchema,
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  description: z
    .string()
    .max(2000, "Description too long")
    .transform(sanitizeText)
    .optional(),
  license: z
    .string()
    .max(100, "License number too long")
    .transform(sanitizeText)
    .optional(),
  tosAccepted: z.literal(true, {
    error: "You must agree to the Terms of Service and Privacy Policy.",
  }),
});
export type ClaimRequest = z.infer<typeof ClaimRequestSchema>;

/** POST /api/lead */
export const LeadRequestSchema = z.object({
  firstName: z
    .string()
    .max(100)
    .transform(sanitizeText)
    .optional(),
  lastName: z
    .string()
    .max(100)
    .transform(sanitizeText)
    .optional(),
  email: emailSchema,
  phone: z
    .string()
    .max(20)
    .transform((p) => (p ? normalizePhone(p) : p))
    .optional(),
  message: z
    .string()
    .max(5000, "Message too long")
    .transform(sanitizeText)
    .optional(),
  niche: nicheSchema,
  city: citySchema,
  provider: z.string().max(200).optional(),
  // TCPA consent fields
  tcpaConsent: z.literal(true, {
    error: "You must consent to be contacted to submit this form. Check the consent box and try again.",
  }),
  tcpaConsentText: z.string().min(1).max(1000).optional(),
});
export type LeadRequest = z.infer<typeof LeadRequestSchema>;

/** POST /api/contact */
export const ContactRequestSchema = z.object({
  name: z
    .string()
    .max(200)
    .transform(sanitizeText)
    .optional(),
  email: emailSchema,
  phone: z
    .string()
    .max(20)
    .optional(),
  message: z
    .string()
    .max(5000, "Message too long")
    .transform(sanitizeText)
    .optional(),
  niche: z.string().max(100).optional(),
  /** When set, this contact came from an unclaimed directory listing page */
  listingId: z.string().max(100).optional(),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

/** POST /api/leads/purchase */
export const LeadPurchaseRequestSchema = z.object({
  niche: nicheSchema,
  buyerEmail: emailSchema,
  temperature: z.enum(["cold", "warm", "hot", "burning"]).default("warm"),
  leadId: z.string().max(100).optional(),
});
export type LeadPurchaseRequest = z.infer<typeof LeadPurchaseRequestSchema>;

// ── Utility ──────────────────────────────────────────────────────────

/** Format Zod errors into a user-friendly string */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
    .join("; ");
}

/** Max request body size in bytes (10KB) */
export const MAX_BODY_SIZE = 10 * 1024;
