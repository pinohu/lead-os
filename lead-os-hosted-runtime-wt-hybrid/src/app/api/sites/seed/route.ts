import { NextRequest, NextResponse } from "next/server";
import {
  getDynastySite,
  saveDynastySite,
  seedAllPresetConfigs,
} from "../../../../lib/dynasty-landing-engine.ts";
import { requireOperatorApiSession } from "../../../../lib/operator-auth.ts";
import { buildCorsHeaders } from "../../../../lib/cors.ts";

export const dynamic = "force-dynamic";

/**
 * POST /api/sites/seed
 *
 * Seeds all 22 preset dynasty landing page configs. Idempotent — existing
 * slugs are skipped. Requires operator auth.
 */
export async function POST(request: NextRequest) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const presets = seedAllPresetConfigs();
    let seeded = 0;

    for (const config of presets) {
      const existing = await getDynastySite(config.slug);
      if (!existing) {
        await saveDynastySite(config);
        seeded++;
      }
    }

    const skipped = presets.length - seeded;
    return NextResponse.json(
      {
        data: { total: presets.length, seeded, skipped },
        error: null,
        meta: { seededAt: new Date().toISOString() },
      },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to seed presets";
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message }, meta: {} },
      { status: 500, headers },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}
