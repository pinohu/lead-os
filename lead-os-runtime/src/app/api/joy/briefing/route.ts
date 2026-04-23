import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { generateMorningBriefing } from "@/lib/joy-engine";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const briefing = await generateMorningBriefing(
    context?.tenantId ?? "default",
  );

  return NextResponse.json({ data: briefing, error: null, meta: null });
}
