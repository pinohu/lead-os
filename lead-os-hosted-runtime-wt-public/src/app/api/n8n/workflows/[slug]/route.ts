import { NextResponse } from "next/server";
import { getN8nStarterWorkflow } from "@/lib/n8n-starter-pack";
import { requireOperatorApiSession } from "@/lib/operator-auth";

type Params = Promise<{ slug: string }>;

export async function GET(request: Request, context: { params: Params }) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const workflow = getN8nStarterWorkflow(slug);

  if (!workflow) {
    return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json(workflow.workflow, {
    headers: {
      "Content-Disposition": `attachment; filename="${workflow.slug}.json"`,
    },
  });
}
