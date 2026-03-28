import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  initializeLeadOSIndexes,
  syncLeadsToIndex,
  syncContentToIndex,
} from "@/lib/integrations/search-engine";

const SyncSchema = z.object({
  tenantId: z.string().min(1),
  targets: z.array(z.enum(["leads", "content", "all"])).default(["all"]),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = SyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.issues },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, targets } = parsed.data;
    const syncAll = targets.includes("all");

    await initializeLeadOSIndexes();

    const results: Record<string, number> = {};

    if (syncAll || targets.includes("leads")) {
      const { indexed } = await syncLeadsToIndex(tenantId);
      results.leads = indexed;
    }

    if (syncAll || targets.includes("content")) {
      const { indexed } = await syncContentToIndex(tenantId);
      results.content = indexed;
    }

    return NextResponse.json(
      { data: { tenantId, results }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SYNC_ERROR", message: "Index sync failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
