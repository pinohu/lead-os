import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { runCreativeJob } from "@/lib/creative-scheduler";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const MAX_ID_LENGTH = 64;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Creative job not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const output = await runCreativeJob(id);

    return NextResponse.json(
      {
        data: output,
        error: null,
        meta: { artifactCount: output.artifacts.length },
      },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to run creative job";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "RUN_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
