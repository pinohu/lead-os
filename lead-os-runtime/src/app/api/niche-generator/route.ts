import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateNicheConfig } from "@/lib/niche-generator";
import { nicheStore } from "@/lib/niche-store";

const NAME_PATTERN = /^[a-zA-Z0-9\s\-]+$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const { name, industry, keywords } = body as {
      name?: string;
      industry?: string;
      keywords?: string[];
    };

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "name is required and must be a string",
            details: [{ field: "name", issue: "Required field" }],
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length < NAME_MIN_LENGTH || trimmedName.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`,
            details: [{ field: "name", issue: `Length must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH}` }],
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    if (!NAME_PATTERN.test(trimmedName)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "name must contain only alphanumeric characters, spaces, and hyphens",
            details: [{ field: "name", issue: "Invalid characters" }],
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    if (keywords !== undefined && !Array.isArray(keywords)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "keywords must be an array of strings",
            details: [{ field: "keywords", issue: "Must be an array" }],
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const config = generateNicheConfig({
      name: trimmedName,
      industry: typeof industry === "string" ? industry : undefined,
      keywords: Array.isArray(keywords) ? keywords.filter((k): k is string => typeof k === "string") : undefined,
    });

    nicheStore.set(config.slug, config);

    return NextResponse.json(
      { data: config, error: null, meta: null },
      { status: 201, headers },
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
