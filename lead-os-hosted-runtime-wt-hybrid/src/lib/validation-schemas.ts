import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive field schemas
// ---------------------------------------------------------------------------

/** URL-safe slug: 3-50 chars, lowercase alphanumeric with interior hyphens. */
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Must be lowercase alphanumeric with hyphens",
  );

/** RFC 5321 maximum email address length. */
export const emailSchema = z.string().email().max(254);

/** Absolute URL with maximum length guard. */
export const urlSchema = z.string().url().max(500);

/** Tenant identifier used as a path or query parameter. */
export const tenantIdSchema = z.string().min(1).max(100);

/**
 * Lead store key. Alphanumeric, hyphens, and underscores are typical
 * but the schema intentionally stays permissive; length is the hard limit.
 */
export const leadKeySchema = z.string().min(1).max(128);

/**
 * Freeform metadata object. Keys and values are individually length-capped
 * to prevent memory exhaustion from large payloads.
 */
export const metadataSchema = z
  .record(z.string().max(64), z.unknown())
  .optional();

// ---------------------------------------------------------------------------
// Enumerated domain schemas
// ---------------------------------------------------------------------------

/** Tenant billing / revenue model. */
export const revenueModelSchema = z.enum([
  "managed",
  "white-label",
  "implementation",
  "directory",
]);

/** Tenant subscription plan. */
export const planSchema = z.enum(["starter", "growth", "enterprise", "custom"]);

/** Tenant lifecycle status. */
export const tenantStatusSchema = z.enum([
  "provisioning",
  "active",
  "suspended",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Composite schemas
// ---------------------------------------------------------------------------

/** Cursor-based pagination query parameters. */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Full shape expected when creating a new tenant via the API.
 * Mirrors `CreateTenantInput` but validated at the Zod layer before
 * type-narrowing to the store type.
 */
export const tenantInputSchema = z.object({
  slug: slugSchema,
  brandName: z.string().min(1).max(200),
  siteUrl: urlSchema,
  supportEmail: emailSchema,
  defaultNiche: z.string().min(1).max(100),
  defaultService: z.string().min(1).max(200),
  revenueModel: revenueModelSchema,
  plan: planSchema,
  operatorEmails: z.array(emailSchema).min(1).max(50),
  accent: z.string().max(20).optional(),
  widgetOrigins: z.array(urlSchema).optional().default([]),
});
