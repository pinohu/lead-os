import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  scheduleRecurringTask,
  listScheduledTasks,
} from "@/lib/agent-scheduler";
import { z } from "zod";

const ScheduleCreateSchema = z.object({
  agentId: z.string().min(1).max(100),
  schedule: z.object({
    cronExpression: z.string().min(1).max(100),
    task: z.object({
      type: z.string().min(1).max(200),
      input: z.record(z.string(), z.unknown()),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      maxRetries: z.number().int().min(0).max(10).optional(),
    }),
    timezone: z.string().max(100).optional(),
    maxMissedRuns: z.number().int().min(0).max(100).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "teamId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const tasks = await listScheduledTasks(teamId);
    return NextResponse.json(
      { data: tasks, error: null, meta: { count: tasks.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list scheduled tasks" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = ScheduleCreateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { agentId, schedule } = validation.data;
    const task = await scheduleRecurringTask(agentId, schedule);

    return NextResponse.json(
      { data: task, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create scheduled task" }, meta: null },
      { status: 500, headers },
    );
  }
}
