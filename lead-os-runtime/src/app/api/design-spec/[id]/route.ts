import { NextResponse } from "next/server";
import { validateDesignSpec, parseDesignSpec } from "@/lib/design-spec.ts";
import {
  getDesignSpec,
  updateDesignSpec,
  archiveSpec,
} from "@/lib/design-spec-store.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const spec = await getDesignSpec(id);

  if (!spec) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Design spec ${id} not found` } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: spec });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await getDesignSpec(id);

  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Design spec ${id} not found` } },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const updates: { spec?: typeof existing.spec; status?: typeof existing.status } = {};

    if (body.spec) {
      const validation = validateDesignSpec(body.spec);
      if (!validation.valid) {
        return NextResponse.json(
          { error: { code: "VALIDATION_FAILED", message: "Spec validation failed", details: validation.errors } },
          { status: 422 },
        );
      }
      updates.spec = parseDesignSpec(JSON.stringify(body.spec));
    }

    if (body.status) {
      if (!["draft", "active", "archived"].includes(body.status)) {
        return NextResponse.json(
          { error: { code: "INVALID_STATUS", message: "Status must be draft, active, or archived" } },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    const updated = await updateDesignSpec(id, updates);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: error instanceof Error ? error.message : "Failed to update spec" } },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await getDesignSpec(id);

  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Design spec ${id} not found` } },
      { status: 404 },
    );
  }

  const archived = await archiveSpec(id);
  return NextResponse.json({ data: archived });
}
