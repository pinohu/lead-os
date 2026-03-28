import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  recordTouch,
  getTouches,
  computeAttribution,
  type AttributionModel,
} from "@/lib/attribution";

const MAX_LEAD_KEY_LENGTH = 128;
const SAFE_LEAD_KEY_PATTERN = /^[\w-]{1,128}$/;

const VALID_MODELS: AttributionModel[] = ["first-touch", "last-touch", "linear", "time-decay", "position-based"];

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const leadKey = url.searchParams.get("leadKey");
    const rawModel = url.searchParams.get("model") ?? "position-based";
    const rawValue = url.searchParams.get("value");
    const totalValue = rawValue ? Number(rawValue) : 0;

    if (!leadKey) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (leadKey.length > MAX_LEAD_KEY_LENGTH || !SAFE_LEAD_KEY_PATTERN.test(leadKey)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey must contain only alphanumeric characters, underscores, or hyphens and be at most 128 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!VALID_MODELS.includes(rawModel as AttributionModel)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `model must be one of: ${VALID_MODELS.join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const model = rawModel as AttributionModel;
    const touches = await getTouches(leadKey);
    const result = computeAttribution(touches, model, totalValue);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[attribution]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        data: null,
        error: { code: "REPORT_FAILED", message: "Failed to generate attribution report" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

const MAX_CHANNEL_LENGTH = 100;
const MAX_SOURCE_LENGTH = 200;
const MAX_MEDIUM_LENGTH = 100;
const MAX_CAMPAIGN_LENGTH = 200;
const MAX_CONTENT_LENGTH = 200;
const MAX_EVENT_TYPE_LENGTH = 100;
// Referrer and page are URLs — cap them generously but not unbounded.
const MAX_URL_FIELD_LENGTH = 2048;
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_VALUE_LENGTH = 256;
const SAFE_EVENT_TYPE_PATTERN = /^[\w-]{1,100}$/;

function isValidAttributionMetadata(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > MAX_METADATA_KEYS) return false;
  return keys.every(
    (k) =>
      k.length <= MAX_METADATA_KEY_LENGTH &&
      (typeof obj[k] === "string"
        ? (obj[k] as string).length <= MAX_METADATA_VALUE_LENGTH
        : typeof obj[k] === "number" || typeof obj[k] === "boolean" || obj[k] === null),
  );
}

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

    if (!body.leadKey || typeof body.leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.leadKey.length > MAX_LEAD_KEY_LENGTH || !SAFE_LEAD_KEY_PATTERN.test(body.leadKey)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey must contain only alphanumeric characters, underscores, or hyphens and be at most 128 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.channel || typeof body.channel !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "channel is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.channel.length > MAX_CHANNEL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `channel must not exceed ${MAX_CHANNEL_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.source || typeof body.source !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "source is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.source.length > MAX_SOURCE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `source must not exceed ${MAX_SOURCE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.medium !== undefined && body.medium !== null) {
      if (typeof body.medium !== "string" || body.medium.length > MAX_MEDIUM_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `medium must be a string of at most ${MAX_MEDIUM_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.campaign !== undefined && body.campaign !== null) {
      if (typeof body.campaign !== "string" || body.campaign.length > MAX_CAMPAIGN_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `campaign must be a string of at most ${MAX_CAMPAIGN_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.content !== undefined && body.content !== null) {
      if (typeof body.content !== "string" || body.content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `content must be a string of at most ${MAX_CONTENT_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.referrer !== undefined && body.referrer !== null) {
      if (typeof body.referrer !== "string" || body.referrer.length > MAX_URL_FIELD_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `referrer must be a string of at most ${MAX_URL_FIELD_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.page !== undefined && body.page !== null) {
      if (typeof body.page !== "string" || body.page.length > MAX_URL_FIELD_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `page must be a string of at most ${MAX_URL_FIELD_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.eventType !== undefined && body.eventType !== null) {
      if (
        typeof body.eventType !== "string" ||
        body.eventType.length > MAX_EVENT_TYPE_LENGTH ||
        !SAFE_EVENT_TYPE_PATTERN.test(body.eventType)
      ) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "eventType must contain only alphanumeric characters and hyphens" }, meta: null },
          { status: 400, headers },
        );
      }
    }

    // Reject client-supplied timestamps — use server time exclusively.
    // Accepting client timestamps allows attackers to manipulate time-decay
    // attribution scores by backdating or forward-dating touches.
    if (body.timestamp !== undefined) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "timestamp is not accepted; server time is used" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.metadata !== undefined && !isValidAttributionMetadata(body.metadata)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "metadata must be a flat object with at most 20 string/number/boolean keys" }, meta: null },
        { status: 400, headers },
      );
    }

    const touch = await recordTouch({
      leadKey: body.leadKey,
      channel: body.channel,
      source: body.source,
      medium: body.medium ?? "",
      campaign: body.campaign ?? "",
      content: body.content ?? "",
      referrer: body.referrer ?? "",
      landingPage: body.page ?? "",
    });

    return NextResponse.json(
      { data: touch, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[attribution]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        data: null,
        error: { code: "TOUCH_FAILED", message: "Failed to record attribution touch" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
