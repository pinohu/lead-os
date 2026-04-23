// src/lib/validate.ts
import { z } from "zod";

export const intakeSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
  source: z.string().max(100).optional(),
  service: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  tenant_id: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
