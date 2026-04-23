/**
 * Error reporting module. When SENTRY_DSN is set, errors are reported to Sentry.
 * When not set, errors are logged to console with structured JSON in production.
 * This is a zero-dependency wrapper — no npm packages required.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV ?? "development";
const RELEASE = process.env.npm_package_version ?? "0.0.0";

interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  route?: string;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always log structured
  if (ENVIRONMENT === "production") {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      stack,
      ...context,
    }));
  } else {
    console.error("[error-reporting]", message, context);
  }

  // Send to Sentry if configured (using the envelope API — no SDK needed)
  if (SENTRY_DSN) {
    sendToSentry(message, stack, context).catch(() => {
      // Sentry reporting failure must not break the application
    });
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext): void {
  if (ENVIRONMENT === "production") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    }));
  }

  if (SENTRY_DSN && level === "error") {
    sendToSentry(message, undefined, context).catch(() => {});
  }
}

async function sendToSentry(message: string, stack: string | undefined, context?: ErrorContext): Promise<void> {
  if (!SENTRY_DSN) return;

  try {
    const url = new URL(SENTRY_DSN);
    const projectId = url.pathname.replace("/", "");
    const publicKey = url.username;
    const host = url.hostname;
    const envelopeUrl = `https://${host}/api/${projectId}/envelope/`;

    const header = JSON.stringify({ event_id: crypto.randomUUID().replace(/-/g, ""), dsn: SENTRY_DSN });
    const itemHeader = JSON.stringify({ type: "event" });
    const event = JSON.stringify({
      exception: stack ? {
        values: [{
          type: "Error",
          value: message,
          stacktrace: { frames: parseStackFrames(stack) },
        }],
      } : undefined,
      message: !stack ? { formatted: message } : undefined,
      level: "error",
      environment: ENVIRONMENT,
      release: RELEASE,
      tags: {
        tenantId: context?.tenantId,
        route: context?.route,
      },
      user: context?.userId ? { id: context.userId } : undefined,
      extra: context?.extra,
      timestamp: Math.floor(Date.now() / 1000),
    });

    await fetch(envelopeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=leados/1.0, sentry_key=${publicKey}`,
      },
      body: `${header}\n${itemHeader}\n${event}`,
    });
  } catch {
    // Silent failure — Sentry reporting must never break the app
  }
}

function parseStackFrames(stack: string): Array<{ filename: string; function: string; lineno: number }> {
  return stack
    .split("\n")
    .slice(1, 6) // Top 5 frames
    .map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
      if (match) return { function: match[1]!, filename: match[2]!, lineno: Number(match[3]) };
      const simpleMatch = line.match(/at\s+(.+?):(\d+):\d+/);
      if (simpleMatch) return { function: "<anonymous>", filename: simpleMatch[1]!, lineno: Number(simpleMatch[2]) };
      return { function: "<unknown>", filename: line.trim(), lineno: 0 };
    });
}

export function initErrorReporting(): void {
  if (typeof process !== "undefined") {
    process.on("uncaughtException", (error) => {
      captureException(error, { extra: { type: "uncaughtException" } });
    });
    process.on("unhandledRejection", (reason) => {
      captureException(reason, { extra: { type: "unhandledRejection" } });
    });
  }
}
