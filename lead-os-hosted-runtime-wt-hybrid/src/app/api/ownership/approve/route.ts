import { NextResponse } from "next/server";
import { approveClaim } from "@/lib/ownership/node-ownership-store";

export async function POST(req: Request) {
  const body = await req.json();

  const record = approveClaim(body.nodeId, body.ownerId);

  if (!record) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, record });
}
