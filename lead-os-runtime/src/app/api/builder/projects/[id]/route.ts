import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  getProject,
  updateProject,
  deleteProject,
} from "@/lib/integrations/visual-builder";

const UpdateProjectSchema = z.object({
  html: z.string().optional(),
  css: z.string().optional(),
  components: z.unknown().optional(),
  styles: z.unknown().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Project not found: ${id}` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: { project }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch project";
    return NextResponse.json(
      { data: null, error: { code: "GET_PROJECT_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const parsed = UpdateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({
              field: i.path.join("."),
              issue: i.message,
            })),
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const project = await updateProject(id, parsed.data);

    return NextResponse.json(
      { data: { project }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update project";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_PROJECT_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const deleted = await deleteProject(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Project not found: ${id}` }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete project";
    return NextResponse.json(
      { data: null, error: { code: "DELETE_PROJECT_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}
