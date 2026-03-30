import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi-spec";

let cachedSpec: object | null = null;

export async function GET() {
  if (!cachedSpec) cachedSpec = buildOpenApiSpec();
  return NextResponse.json(cachedSpec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
    },
  });
}
