import { NextResponse } from "next/server";
import { recordOutcome } from "@/lib/openclaw/outcomes";

export async function POST(req) {
  const body = await req.json();
  const stored = recordOutcome(body);

  return NextResponse.json({ success: true, total: stored.length });
}
