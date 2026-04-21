import { NextResponse } from "next/server";
import { recordOutcome } from "@/lib/openclaw/outcomes";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const saved = recordOutcome({
      leadKey: body.leadKey,
      status: body.status,
      value: body.value || 0
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
}
