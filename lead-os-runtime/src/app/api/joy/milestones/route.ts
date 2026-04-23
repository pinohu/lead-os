import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { getMilestones, acknowledgeMilestone } from "@/lib/joy-engine";

/** GET – returns unacknowledged milestones for the authenticated tenant */
export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context?.tenantId ?? "default";
  const milestones = getMilestones(tenantId).filter((m) => !m.acknowledged);

  return NextResponse.json({ data: milestones, error: null, meta: null });
}

/** POST – acknowledge (mark as seen) a milestone */
export async function POST(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context?.tenantId ?? "default";

  let body: { milestoneId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
        meta: null,
      },
      { status: 400 },
    );
  }

  if (!body.milestoneId) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BAD_REQUEST",
          message: "milestoneId is required",
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  const ok = acknowledgeMilestone(tenantId, body.milestoneId);

  if (!ok) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Milestone not found" },
        meta: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: { acknowledged: true },
    error: null,
    meta: null,
  });
}
