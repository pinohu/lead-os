import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead, type HostedLeadPayload } from "@/lib/intake";

const intakeSchema = z.object({
  email: z.string().email().max(320),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  medium: z.string().max(100).optional(),
  campaign: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  message: z.string().max(5000).optional(),
  dryRun: z.boolean().optional(),
}).passthrough();

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const raw = await request.json();
    const parsed = intakeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422, headers },
      );
    }
    const result = await persistLead(parsed.data as HostedLeadPayload);
    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Intake failed" },
      { status: 400, headers },
    );
  }
}
