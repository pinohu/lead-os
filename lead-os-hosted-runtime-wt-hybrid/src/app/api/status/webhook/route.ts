import { NextResponse } from "next/server";
import { logAuditEntry, persistAuditEntry } from "@/lib/agent-audit-log";
import { recordCheck } from "@/lib/uptime-tracker";
import { timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// POST /api/status/webhook
// External monitoring tools (Betteruptime, Pingdom, UptimeRobot, etc.) call
// this endpoint to report component-level incidents.
// Protected by CRON_SECRET header.
// ---------------------------------------------------------------------------

interface WebhookBody {
  component: string;
  status: "healthy" | "degraded" | "down";
  message?: string;
  severity?: "critical" | "major" | "minor";
}

export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "") ?? "";

  const authOk =
    Boolean(secret) &&
    Boolean(authHeader) &&
    Buffer.from(authHeader).length === Buffer.from(secret).length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(secret));

  if (!authOk) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { component, status, message, severity } = body;

  if (!component || !status) {
    return NextResponse.json(
      { success: false, error: "component and status are required" },
      { status: 400 },
    );
  }

  if (!["healthy", "degraded", "down"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "status must be healthy | degraded | down" },
      { status: 400 },
    );
  }

  // ── Record to uptime tracker ────────────────────────────────────────────
  recordCheck(component, status, 0);

  // ── Log to audit trail ──────────────────────────────────────────────────
  const entry = logAuditEntry({
    tenantId: process.env.LEAD_OS_TENANT_ID ?? "default",
    teamId: process.env.LEAD_OS_TENANT_ID ?? "default",
    agentId: "status-webhook",
    action: `status.${status}${severity ? `.${severity}` : ""}`,
    status: status === "healthy" ? "success" : "failure",
    tokensUsed: 0,
    costUsd: 0,
    input: { component, status, message, severity },
    metadata: {
      source: "external-monitor",
      component,
      severity: severity ?? "minor",
    },
  });

  persistAuditEntry(entry).catch(() => {});

  return NextResponse.json({
    success: true,
    recorded: {
      id: entry.id,
      component,
      status,
      timestamp: entry.timestamp,
    },
  });
}
