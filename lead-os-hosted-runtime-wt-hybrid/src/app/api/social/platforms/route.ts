import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { PLATFORM_PROFILES } from "@/lib/platform-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const platformKeys = Object.keys(PLATFORM_PROFILES);

    return NextResponse.json(
      {
        data: PLATFORM_PROFILES,
        error: null,
        meta: {
          count: platformKeys.length,
          platforms: platformKeys,
        },
      },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FETCH_FAILED", message: "Failed to retrieve platform profiles" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
