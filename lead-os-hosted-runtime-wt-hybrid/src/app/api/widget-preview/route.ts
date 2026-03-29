import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  createPreviewSession,
  getPreviewSession,
} from "@/lib/widget-preview.ts";

export async function POST(request: Request) {
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const { tenantId, brandName, accentColor, niche, enabledFunnels, channels, logoUrl, customCss } =
    body as Record<string, unknown>;

  if (typeof tenantId !== "string" || !tenantId.trim()) {
    return errorResponse("VALIDATION_ERROR", "tenantId is required", 400);
  }
  if (typeof brandName !== "string" || !brandName.trim()) {
    return errorResponse("VALIDATION_ERROR", "brandName is required", 400);
  }
  if (typeof accentColor !== "string" || !accentColor.trim()) {
    return errorResponse("VALIDATION_ERROR", "accentColor is required", 400);
  }
  if (typeof niche !== "string" || !niche.trim()) {
    return errorResponse("VALIDATION_ERROR", "niche is required", 400);
  }

  const session = await createPreviewSession({
    tenantId: tenantId.trim(),
    brandName: brandName.trim(),
    accentColor: accentColor.trim(),
    niche: niche.trim(),
    enabledFunnels: Array.isArray(enabledFunnels) ? (enabledFunnels as string[]) : [],
    channels:
      channels != null && typeof channels === "object" && !Array.isArray(channels)
        ? (channels as Record<string, boolean>)
        : {},
    logoUrl: typeof logoUrl === "string" ? logoUrl : undefined,
    customCss: typeof customCss === "string" ? customCss : undefined,
  });

  return successResponse(session, null, 201);
}

export async function GET(request: Request) {
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return errorResponse("VALIDATION_ERROR", "sessionId query parameter is required", 400);
  }

  const session = await getPreviewSession(sessionId);
  if (!session) {
    return errorResponse("NOT_FOUND", "Preview session not found or has expired", 404);
  }

  return successResponse(session);
}
