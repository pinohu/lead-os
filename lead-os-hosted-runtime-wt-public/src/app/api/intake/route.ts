import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { handleIntakePost } from "@/lib/intake-route";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  return handleIntakePost(request);
}
