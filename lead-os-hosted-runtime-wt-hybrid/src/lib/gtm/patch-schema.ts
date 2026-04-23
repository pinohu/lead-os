// src/lib/gtm/patch-schema.ts
// Zod schema for operator GTM status updates.

import { z } from "zod";

const StatusEnum = z.enum(["not_started", "in_progress", "live", "paused"]);

export const GtmStatusPatchSchema = z
  .object({
    slug: z.string().min(1).max(200),
    status: StatusEnum.optional(),
    notes: z.string().max(8000).optional(),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, {
    message: "Provide at least one of status or notes",
    path: ["slug"],
  });

export type GtmStatusPatchInput = z.infer<typeof GtmStatusPatchSchema>;
