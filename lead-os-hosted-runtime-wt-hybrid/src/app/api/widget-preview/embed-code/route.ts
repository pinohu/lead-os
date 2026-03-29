import { requireOperatorApiSession } from "@/lib/operator-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { generateEmbedCode } from "@/lib/widget-preview.ts";

export async function GET(request: Request) {
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const siteUrl = searchParams.get("siteUrl");

  if (!tenantId) {
    return errorResponse("VALIDATION_ERROR", "tenantId query parameter is required", 400);
  }
  if (!siteUrl) {
    return errorResponse("VALIDATION_ERROR", "siteUrl query parameter is required", 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(siteUrl);
  } catch {
    return errorResponse("VALIDATION_ERROR", "siteUrl must be a valid URL", 400);
  }

  const snippets = await generateEmbedCode(tenantId, parsedUrl.origin);

  return successResponse(snippets);
}
