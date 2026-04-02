import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createAutomation,
  listAutomations,
} from "@/lib/integrations/hexomatic-adapter";

const SelectorSchema = z.object({
  name: z.string().min(1),
  selector: z.string().min(1),
  type: z.enum(["text", "href", "src", "html", "attribute"]),
  attribute: z.string().optional(),
});

const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(500),
  sourceUrls: z.array(z.string().url()).min(0),
  selectors: z.array(SelectorSchema),
  schedule: z.string().optional(),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const automations = await listAutomations(tenantId);

    return NextResponse.json(
      { data: automations, error: null, meta: { count: automations.length } },
      { headers },
    );
  } catch (err) {
    logger.error("hexomatic/automations GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch automations" }, meta: null },
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
    const validation = CreateAutomationSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const automation = await createAutomation(validation.data);

    return NextResponse.json(
      { data: automation, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("hexomatic/automations POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create automation" }, meta: null },
      { status: 500, headers },
    );
  }
}
