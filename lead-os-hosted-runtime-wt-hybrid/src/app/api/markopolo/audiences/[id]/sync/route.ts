import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { syncAudienceToPlatform } from "@/lib/integrations/markopolo-adapter";

const SyncSchema = z.object({
  platform: z.enum(["facebook", "google", "tiktok", "snapchat", "linkedin"]),
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
    const raw = await request.json();
    const validation = SyncSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const sync = await syncAudienceToPlatform(id, validation.data.platform);

    return NextResponse.json(
      { data: sync, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[markopolo/audiences/[id]/sync POST]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Failed to sync audience";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "SYNC_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
