import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  enrichFromLinkedIn,
  enrichFromEmail,
} from "@/lib/integrations/leadrocks-adapter";

const EnrichSchema = z.object({
  linkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
}).refine((data) => data.linkedinUrl || data.email, {
  message: "Either linkedinUrl or email must be provided",
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = EnrichSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid enrichment input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { linkedinUrl, email } = validation.data;

    if (linkedinUrl) {
      const contact = await enrichFromLinkedIn({ linkedinUrl });
      return NextResponse.json(
        { data: contact, error: contact ? null : { code: "NOT_FOUND", message: "No contact found for LinkedIn URL" }, meta: null },
        { status: contact ? 200 : 404, headers },
      );
    }

    if (email) {
      const contact = await enrichFromEmail({ email });
      return NextResponse.json(
        { data: contact, error: contact ? null : { code: "NOT_FOUND", message: "No contact found for email" }, meta: null },
        { status: contact ? 200 : 404, headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "INVALID_INPUT", message: "Provide linkedinUrl or email" }, meta: null },
      { status: 400, headers },
    );
  } catch (err) {
    console.error("[leadrocks/enrich POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "ENRICH_FAILED", message: "Failed to enrich contact" }, meta: null },
      { status: 500, headers },
    );
  }
}
