import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  analyzeChannelPerformance,
  rankChannels,
  generateBudgetAllocation,
  generateChannelStrategy,
  identifyUnexploitedChannels,
  recordChannelMetric,
} from "@/lib/channel-domination";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const niche = url.searchParams.get("niche");
    const period = url.searchParams.get("period") ?? undefined;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const analysis = analyzeChannelPerformance(tenantId, period);
    const ranking = rankChannels(analysis);

    let strategy = null;
    let unexploited = null;
    if (niche) {
      strategy = generateChannelStrategy(tenantId, niche);
      const currentChannels = analysis.map((a) => a.channel);
      unexploited = identifyUnexploitedChannels(niche, currentChannels);
    }

    return NextResponse.json(
      {
        data: { analysis, ranking, strategy, unexploited },
        error: null,
        meta: { channelCount: analysis.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch channel domination data" }, meta: null },
      { status: 500, headers },
    );
  }
}

const MAX_CHANNEL_LENGTH = 100;
const MAX_PERIOD_LENGTH = 50;

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const { action, tenantId, totalBudget, metrics } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (action === "allocate") {
      if (typeof totalBudget !== "number" || !isFinite(totalBudget) || totalBudget < 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "totalBudget must be a non-negative number" }, meta: null },
          { status: 400, headers },
        );
      }

      const analysis = analyzeChannelPerformance(tenantId);
      const ranking = rankChannels(analysis);
      const allocation = generateBudgetAllocation(ranking, totalBudget);

      return NextResponse.json(
        {
          data: { allocation, ranking },
          error: null,
          meta: { totalBudget, channelCount: allocation.length },
        },
        { headers },
      );
    }

    if (action === "record-metrics") {
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "metrics array is required" }, meta: null },
          { status: 400, headers },
        );
      }

      for (const m of metrics) {
        if (!m.channel || typeof m.channel !== "string" || m.channel.length > MAX_CHANNEL_LENGTH) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "Each metric must have a valid channel" }, meta: null },
            { status: 400, headers },
          );
        }
        if (!m.period || typeof m.period !== "string" || m.period.length > MAX_PERIOD_LENGTH) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "Each metric must have a valid period" }, meta: null },
            { status: 400, headers },
          );
        }
        recordChannelMetric({
          channel: m.channel,
          leadVolume: Number(m.leadVolume) || 0,
          cost: Number(m.cost) || 0,
          conversions: Number(m.conversions) || 0,
          revenue: Number(m.revenue) || 0,
          period: m.period,
        });
      }

      return NextResponse.json(
        {
          data: { recorded: metrics.length },
          error: null,
          meta: null,
        },
        { status: 201, headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "action must be 'allocate' or 'record-metrics'" }, meta: null },
      { status: 400, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "ACTION_FAILED", message: "Failed to process channel domination action" }, meta: null },
      { status: 400, headers },
    );
  }
}
