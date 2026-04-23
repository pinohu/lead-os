import { requireOperatorApiSession } from "@/lib/operator-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getPreviewSession, submitTestLead } from "@/lib/widget-preview.ts";

export async function POST(request: Request) {
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const { sessionId, name, email, phone, service } = body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return errorResponse("VALIDATION_ERROR", "sessionId is required", 400);
  }
  if (typeof name !== "string" || !name.trim()) {
    return errorResponse("VALIDATION_ERROR", "name is required", 400);
  }
  if (typeof email !== "string" || !email.trim()) {
    return errorResponse("VALIDATION_ERROR", "email is required", 400);
  }

  const session = await getPreviewSession(sessionId.trim());
  if (!session) {
    return errorResponse("NOT_FOUND", "Preview session not found or has expired", 404);
  }

  const testLead = await submitTestLead(sessionId.trim(), {
    name: name.trim(),
    email: email.trim(),
    phone: typeof phone === "string" ? phone.trim() || undefined : undefined,
    service: typeof service === "string" ? service.trim() || undefined : undefined,
  });

  if (!testLead) {
    return errorResponse("INTERNAL_ERROR", "Failed to submit test lead", 500);
  }

  return successResponse(testLead, null, 201);
}
