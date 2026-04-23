import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { connectProfile, listProfiles } from "@/lib/integrations/vista-social-adapter";

const ConnectProfileSchema = z.object({
  platform: z.enum(["facebook", "instagram", "twitter", "linkedin", "tiktok", "pinterest", "youtube"]),
  handle: z.string().min(1).max(200),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const profiles = await listProfiles(tenantId);

    return NextResponse.json(
      { data: profiles, error: null, meta: { count: profiles.length } },
      { headers },
    );
  } catch (err) {
    logger.error("vista-social/profiles GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list profiles" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = ConnectProfileSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { platform, handle, tenantId } = validation.data;
    const profile = await connectProfile(platform, handle, tenantId);

    return NextResponse.json(
      { data: profile, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("vista-social/profiles POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to connect profile" }, meta: null },
      { status: 500, headers },
    );
  }
}
