// src/app/api/queue/route.ts
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server.js";
import { requireAlignedTenant } from "../../../lib/api-mutation-guard.ts";
import { requireOperatorApiSession } from "../../../lib/operator-auth.ts";
import { getPricingQueueStats } from "../../../lib/pricing/queue-client.ts";
import { countDeadLetterJobs } from "../../../lib/pricing/repository.ts";

export const dynamic = "force-dynamic";

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authorizeCronOrAuthSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.LEAD_OS_AUTH_SECRET;
  if (!secret) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const header = request.headers.get("x-cron-secret");
  if (bearer && !bearer.startsWith("los_") && !bearer.startsWith("sess_") && timingSafeEqualStr(bearer, secret)) {
    return true;
  }
  if (header && timingSafeEqualStr(header, secret)) return true;
  return false;
}

export async function GET(request: Request) {
  const cronOk = authorizeCronOrAuthSecret(request);
  if (!cronOk) {
    const { session, response } = await requireOperatorApiSession(request);
    if (!session) {
      return response ?? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const align = requireAlignedTenant(request);
    if (!align.ok) {
      return NextResponse.json({ ok: false, error: align.message }, { status: align.status });
    }
  }

  const [queues, deadLetterRows] = await Promise.all([getPricingQueueStats(), countDeadLetterJobs()]);
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    queues: {
      pricing_main: queues.main,
      pricing_measure: queues.measure,
      pricing_dlq: queues.dlq,
    },
    dead_letter_jobs: { persisted_row_count: deadLetterRows },
  });
}
