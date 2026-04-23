import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getCreativeJob, updateCreativeJob, deleteCreativeJob } from "@/lib/creative-scheduler";

const MAX_ID_LENGTH = 64;

export async function GET(
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

    const job = await getCreativeJob(id);
    if (!job) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Creative job not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch creative job" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
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

    const body = await request.json();

    const patch: Record<string, unknown> = {};
    if (body.schedule) patch.schedule = body.schedule;
    if (body.config) patch.config = body.config;
    if (body.status) patch.status = body.status;

    const updated = await updateCreativeJob(id, patch);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Creative job not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update creative job" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
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

    const deleted = await deleteCreativeJob(id);
    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Creative job not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete creative job" }, meta: null },
      { status: 500, headers },
    );
  }
}
