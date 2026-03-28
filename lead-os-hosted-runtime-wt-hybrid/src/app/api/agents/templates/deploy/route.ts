import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  deployProspectingTeam,
  deployContentTeam,
  deployOutreachTeam,
  deployFullStackTeam,
} from "@/lib/agent-templates";
import { z } from "zod";

const DeploySchema = z.object({
  tenantId: z.string().min(1).max(100),
  templateId: z.enum([
    "prospecting-team",
    "content-team",
    "outreach-team",
    "full-stack-team",
  ]),
  niche: z.string().min(1).max(200),
});

const DEPLOYERS: Record<
  string,
  (tenantId: string, niche: string) => Promise<import("@/lib/paperclip-orchestrator").AgentTeam>
> = {
  "prospecting-team": deployProspectingTeam,
  "content-team": deployContentTeam,
  "outreach-team": deployOutreachTeam,
  "full-stack-team": deployFullStackTeam,
};

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = DeploySchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, templateId, niche } = validation.data;
    const deployer = DEPLOYERS[templateId];
    const team = await deployer(tenantId, niche);

    return NextResponse.json(
      { data: team, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[agents-templates-deploy]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "DEPLOY_FAILED", message: "Failed to deploy template" }, meta: null },
      { status: 500, headers },
    );
  }
}
