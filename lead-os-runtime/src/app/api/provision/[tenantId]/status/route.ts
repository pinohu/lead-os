import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getProvisioningStatus } from "@/lib/tenant-provisioner";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { tenantId } = await params;

    if (!tenantId || typeof tenantId !== "string" || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const steps = await getProvisioningStatus(tenantId);

    if (steps.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "No provisioning data found for this tenant" }, meta: null },
        { status: 404, headers },
      );
    }

    const allCompleted = steps.every(
      (s) => s.status === "completed" || s.status === "skipped",
    );
    const hasFailed = steps.some((s) => s.status === "failed");

    return NextResponse.json(
      {
        data: {
          tenantId,
          steps,
          success: allCompleted && !hasFailed,
        },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "STATUS_FAILED", message: "Failed to retrieve provisioning status" }, meta: null },
      { status: 500, headers },
    );
  }
}
