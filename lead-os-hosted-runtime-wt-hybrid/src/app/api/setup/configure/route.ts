import { NextResponse, type NextRequest } from "next/server";

interface ConfigurePayload {
  brandName: string;
  supportEmail: string;
  defaultNiche: string;
  accent: string;
}

interface ConfigureResponse {
  ok: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(body: unknown): ConfigurePayload {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const raw = body as Record<string, unknown>;

  const brandName = typeof raw.brandName === "string" ? raw.brandName.trim() : "";
  if (!brandName || brandName.length > 80) {
    throw new Error("brandName must be a non-empty string of at most 80 characters.");
  }

  const supportEmail = typeof raw.supportEmail === "string" ? raw.supportEmail.trim() : "";
  if (!supportEmail || !EMAIL_RE.test(supportEmail)) {
    throw new Error("supportEmail must be a valid email address.");
  }

  const defaultNiche = typeof raw.defaultNiche === "string" ? raw.defaultNiche.trim() : "";
  if (!defaultNiche) {
    throw new Error("defaultNiche must be a non-empty string.");
  }

  const accent = typeof raw.accent === "string" ? raw.accent.trim() : "";
  if (!accent || !HEX_COLOR_RE.test(accent)) {
    throw new Error("accent must be a valid 6-digit hex colour (e.g. #14b8a6).");
  }

  return { brandName, supportEmail, defaultNiche, accent };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ConfigureResponse | ErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  let payload: ConfigurePayload;
  try {
    payload = validatePayload(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload." },
      { status: 422 },
    );
  }

  // Apply configuration to the running process. These values override the
  // module-level tenantConfig object for the lifetime of this process. In a
  // production deployment with a database, the operator should persist these
  // as environment variables or tenant-store records and redeploy.
  try {
    const { tenantConfig } = await import("@/lib/tenant");
    tenantConfig.brandName = payload.brandName;
    tenantConfig.supportEmail = payload.supportEmail;
    tenantConfig.defaultNiche = payload.defaultNiche;
    tenantConfig.accent = payload.accent;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Configuration was validated but could not be applied to the running process: " +
          (err instanceof Error ? err.message : String(err)),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Configuration applied to the running process. To persist these values across restarts, set the corresponding environment variables and redeploy.",
  });
}
