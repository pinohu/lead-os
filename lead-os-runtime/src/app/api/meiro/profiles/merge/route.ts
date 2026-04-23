import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { mergeProfiles } from "@/lib/integrations/meiro-cdp-adapter";

const MergeSchema = z.object({
  profileId1: z.string().min(1),
  profileId2: z.string().min(1),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = MergeSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const merged = await mergeProfiles(validation.data.profileId1, validation.data.profileId2);

    if (!merged) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "One or both profiles not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: merged, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("meiro/profiles/merge POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "MERGE_FAILED", message: "Failed to merge profiles" }, meta: null },
      { status: 500, headers },
    );
  }
}
