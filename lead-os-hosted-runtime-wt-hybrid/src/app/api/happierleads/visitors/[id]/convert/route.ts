import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { convertVisitorToLead } from "@/lib/integrations/happierleads-adapter";

const ConvertSchema = z.object({
  tenantId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    let tenantId: string | undefined;
    try {
      const raw = await request.json();
      const validation = ConvertSchema.safeParse(raw);
      if (validation.success) {
        tenantId = validation.data.tenantId;
      }
    } catch {
      // Empty body is fine -- tenantId is optional
    }

    const lead = await convertVisitorToLead(id, tenantId);

    return NextResponse.json(
      { data: lead, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[happierleads/visitors/[id]/convert POST]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Failed to convert visitor";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "CONVERT_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
