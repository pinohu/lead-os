import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { convertCallbackToLead } from "@/lib/integrations/novocall-adapter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    let tenantId: string | undefined;
    try {
      const body = await request.json();
      if (typeof body.tenantId === "string") {
        tenantId = body.tenantId;
      }
    } catch {
      // No body or invalid JSON — proceed without tenantId override
    }

    const lead = await convertCallbackToLead(id, tenantId);
    return NextResponse.json(
      { data: lead, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to convert callback to lead";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[novocall/callbacks/[id]/convert POST]", message);
    return NextResponse.json(
      { data: null, error: { code: "CONVERT_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
