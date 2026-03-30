import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import {
  getRecoveryActions,
  detectAndRecover,
} from "@/lib/autonomous-recovery";

/** GET – returns recent autonomous recovery actions */
export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context?.tenantId ?? "default";
  const actions = getRecoveryActions(tenantId);

  return NextResponse.json({ data: actions, error: null, meta: null });
}

/** POST – trigger a manual recovery scan */
export async function POST(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context?.tenantId ?? "default";
  const actions = await detectAndRecover(tenantId);

  return NextResponse.json({
    data: { actions, count: actions.length },
    error: null,
    meta: null,
  });
}
