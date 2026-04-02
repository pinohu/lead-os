import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { scrapeUrl } from "@/lib/integrations/hexomatic-adapter";

const ScrapeSchema = z.object({
  url: z.string().url(),
  selectors: z.array(
    z.object({
      name: z.string().min(1),
      selector: z.string().min(1),
      type: z.enum(["text", "href", "src", "html", "attribute"]),
      attribute: z.string().optional(),
    }),
  ),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = ScrapeSchema.safeParse(raw);

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

    const rows = await scrapeUrl(validation.data.url, validation.data.selectors);

    return NextResponse.json(
      { data: rows, error: null, meta: { count: rows.length } },
      { headers },
    );
  } catch (err) {
    logger.error("hexomatic/scrape POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: "Failed to scrape URL" }, meta: null },
      { status: 500, headers },
    );
  }
}
