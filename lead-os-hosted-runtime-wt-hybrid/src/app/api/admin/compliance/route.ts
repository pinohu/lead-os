import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { generateAccessReview, generateEncryptionReport, generateSessionReport, generateRetentionReport } from "@/lib/compliance";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:settings");
  if (response) return response;

  const url = new URL(request.url);
  const reportType = url.searchParams.get("report") ?? "encryption";
  const tenantId = context?.tenantId ?? "default";

  let report;
  switch (reportType) {
    case "access-review":
      report = await generateAccessReview(tenantId);
      break;
    case "encryption":
      report = generateEncryptionReport();
      break;
    case "sessions":
      report = await generateSessionReport(tenantId);
      break;
    case "retention":
      report = await generateRetentionReport(tenantId);
      break;
    default:
      return NextResponse.json({ data: null, error: { code: "INVALID_REPORT", message: `Unknown report type: ${reportType}. Valid: access-review, encryption, sessions, retention` }, meta: null }, { status: 400 });
  }

  return NextResponse.json({ data: report, error: null, meta: null });
}
