// src/lib/api/cron-mutation-schemas.ts
// Zod bodies for cron POST routes.

import { z } from "zod";

const nicheEntry = z.union([
  z.string().min(1).max(256),
  z.object({
    niche: z.string().min(1).max(256),
    geo: z.string().max(200).optional(),
  }),
]);

export const CronDiscoveryBodySchema = z.object({
  tenantId: z.string().min(1).max(128).optional(),
  geo: z.string().max(200).optional(),
  niches: z.array(nicheEntry).max(500).optional(),
  autoIngest: z.boolean().optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  analyzeWebsites: z.boolean().optional(),
  maxPerNiche: z.number().int().min(1).max(50).optional(),
});

export const CronOptimizeBodySchema = z.object({
  schedule: z.enum(["daily", "weekly", "monthly"]),
  tenantId: z.string().min(1).max(128).optional(),
});

export const CronExperimentsBodySchema = z.object({
  tenantId: z.string().min(1).max(128).optional(),
});
