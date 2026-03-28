import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { addJob, getQueueStats } from "@/lib/integrations/job-queue";

const AddJobSchema = z.object({
  queue: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  data: z.record(z.unknown()).default({}),
  options: z
    .object({
      delay: z.number().int().nonnegative().optional(),
      priority: z.number().int().optional(),
      attempts: z.number().int().positive().optional(),
      backoff: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const queue = searchParams.get("queue");

  if (!queue) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "queue query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const stats = await getQueueStats(queue);
    return NextResponse.json({ data: { queue, stats }, error: null, meta: null }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "QUEUE_ERROR", message: "Failed to retrieve queue stats" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = AddJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.issues },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { queue, name, data, options } = parsed.data;
    const jobId = await addJob(queue, { name, data, options });

    return NextResponse.json(
      { data: { jobId, queue, name }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "QUEUE_ERROR", message: "Failed to add job" }, meta: null },
      { status: 500, headers },
    );
  }
}
