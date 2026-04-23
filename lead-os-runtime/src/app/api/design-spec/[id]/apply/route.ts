import { NextResponse } from "next/server";
import { getDesignSpec, activateSpec } from "@/lib/design-spec-store.ts";
import { applyDesignSpec } from "@/lib/design-spec-applicator.ts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stored = await getDesignSpec(id);

  if (!stored) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Design spec ${id} not found` } },
      { status: 404 },
    );
  }

  try {
    const result = await applyDesignSpec(stored.tenantId, id, stored.spec);

    if (result.success) {
      await activateSpec(id);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "APPLICATION_ERROR", message: error instanceof Error ? error.message : "Failed to apply design spec" } },
      { status: 500 },
    );
  }
}
