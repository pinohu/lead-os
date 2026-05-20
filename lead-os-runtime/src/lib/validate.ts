// src/lib/validate.ts
import { z } from "zod";

export const intakeSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
  category: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  service: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  tenant_id: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

export const createNodeSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  webhook_url: z.string().url().max(2000).optional().nullable(),
  email: z.string().email().max(254).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateNodeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  webhook_url: z.string().url().max(2000).optional().nullable(),
  email: z.string().email().max(254).optional().nullable(),
  is_active: z.boolean().optional(),
});
