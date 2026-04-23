import { z } from "zod"

export const intakeSchema = z.object({
  email: z.string().email().max(254),
  firstName: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().max(2000),
})

export type IntakeInput = z.infer<typeof intakeSchema>
