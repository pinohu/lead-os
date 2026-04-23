import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { nicheStore } from "@/lib/niche-store";
import type { GeneratedNicheConfig } from "@/lib/niche-generator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const config = nicheStore.get(slug);
  if (!config) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found`, details: [] },
        meta: null,
      },
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { data: config, error: null, meta: null },
    { status: 200, headers },
  );
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge<T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== undefined &&
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const config = nicheStore.get(slug);
  if (!config) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found`, details: [] },
        meta: null,
      },
      { status: 404, headers },
    );
  }

  try {
    const body = await request.json();
    const immutableKeys = ["slug", "createdAt", "industry"];
    for (const key of immutableKeys) {
      if (key in body) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "VALIDATION_ERROR",
              message: `Cannot modify immutable field: ${key}`,
              details: [{ field: key, issue: "Immutable" }],
            },
            meta: null,
          },
          { status: 400, headers },
        );
      }
    }

    const updated = deepMerge(
      config as unknown as Record<string, unknown>,
      body as DeepPartial<Record<string, unknown>>,
    ) as unknown as GeneratedNicheConfig;

    nicheStore.set(slug, updated);

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    const message = error instanceof SyntaxError
      ? "Invalid JSON in request body"
      : "Internal server error";
    const status = error instanceof SyntaxError ? 400 : 500;

    return NextResponse.json(
      {
        data: null,
        error: { code: status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR", message, details: [] },
        meta: null,
      },
      { status, headers },
    );
  }
}
