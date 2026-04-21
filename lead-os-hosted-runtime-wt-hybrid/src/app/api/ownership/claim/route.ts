import { NextResponse } from "next/server";
import { createClaim } from "@/lib/ownership/node-ownership-store";

export async function POST(req: Request) {
  const body = await req.json();

  const record = createClaim(body.nodeId, body.ownerId);

  return NextResponse.json({ success: true, record });
}
