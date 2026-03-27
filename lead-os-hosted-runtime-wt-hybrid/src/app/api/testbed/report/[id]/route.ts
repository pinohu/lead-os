import { NextResponse } from "next/server";
import { getTestbedReport } from "@/lib/vertical-testbed";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Report id is required" } },
      { status: 400 },
    );
  }

  const report = getTestbedReport(id);

  if (!report) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Report not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: report });
}
