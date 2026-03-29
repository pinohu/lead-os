import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createList,
  listLists,
} from "@/lib/integrations/sendfox-adapter";

const CreateListSchema = z.object({
  name: z.string().min(1).max(200),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const lists = await listLists(tenantId);

    return NextResponse.json(
      { data: lists, error: null, meta: { count: lists.length } },
      { headers },
    );
  } catch (err) {
    console.error("[sendfox/lists GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch lists" }, meta: null },
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
    const validation = CreateListSchema.safeParse(raw);

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

    const { name, tenantId } = validation.data;
    const list = await createList(name, tenantId);

    return NextResponse.json(
      { data: list, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[sendfox/lists POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create list" }, meta: null },
      { status: 500, headers },
    );
  }
}
