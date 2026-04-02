import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { listProfiles, resolveIdentity } from "@/lib/integrations/meiro-cdp-adapter";

const ResolveIdentitySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const limit = url.searchParams.get("limit");

    const profiles = await listProfiles(tenantId, limit ? Number(limit) : undefined);

    return NextResponse.json(
      { data: profiles, error: null, meta: { count: profiles.length } },
      { headers },
    );
  } catch (err) {
    logger.error("meiro/profiles GET failed", { error: err instanceof Error ? err.message : String(err) });
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
    const validation = ResolveIdentitySchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const result = await resolveIdentity(validation.data.email, validation.data.phone);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("meiro/profiles POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "RESOLVE_FAILED", message: "Failed to resolve identity" }, meta: null },
      { status: 500, headers },
    );
  }
}
