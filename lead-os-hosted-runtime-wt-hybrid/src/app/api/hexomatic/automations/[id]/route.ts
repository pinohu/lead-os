import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getAutomation,
  runAutomation,
  pauseAutomation,
} from "@/lib/integrations/hexomatic-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const automation = await getAutomation(id);

    if (!automation) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Automation not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: automation, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[hexomatic/automations/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch automation" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const automation = await runAutomation(id);

    return NextResponse.json(
      { data: automation, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[hexomatic/automations/[id] POST]", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to run automation";
    const status = message.includes("not found") ? 404 : message.includes("already completed") ? 409 : 500;
    return NextResponse.json(
      { data: null, error: { code: "RUN_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const automation = await pauseAutomation(id);

    return NextResponse.json(
      { data: automation, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[hexomatic/automations/[id] PATCH]", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to pause automation";
    const status = message.includes("not found") ? 404 : message.includes("not running") ? 409 : 500;
    return NextResponse.json(
      { data: null, error: { code: "PAUSE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
