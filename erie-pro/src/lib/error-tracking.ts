// ── Error Tracking (Sentry) ───────────────────────────────────────────
// Lightweight Sentry integration. Only active when SENTRY_DSN is set.
// For full Sentry integration, install @sentry/nextjs and configure
// sentry.client.config.ts + sentry.server.config.ts.

import { logger } from "@/lib/logger";

const SENTRY_DSN = process.env.SENTRY_DSN;

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
}

/**
 * Report an error to Sentry. Fire-and-forget.
 * Falls back to logger.error when Sentry is not configured.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  if (!SENTRY_DSN) {
    logger.error("sentry", "Uncaptured error:", error, context);
    return;
  }

  // When @sentry/nextjs is installed, replace this with:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error, { tags: context?.tags, extra: context?.extra, user: context?.user });

  // Lightweight HTTP fallback — sends to Sentry envelope endpoint
  const dsn = new URL(SENTRY_DSN);
  const projectId = dsn.pathname.replace("/", "");
  const publicKey = dsn.username;
  const envelopeUrl = `https://${dsn.host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    exception: {
      values: [
        {
          type: error instanceof Error ? error.constructor.name : "Error",
          value: errorMessage,
          stacktrace: errorStack ? { frames: parseStack(errorStack) } : undefined,
        },
      ],
    },
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  };

  const envelope = `{"event_id":"${event.event_id}","sent_at":"${new Date().toISOString()}"}\n{"type":"event"}\n${JSON.stringify(event)}`;

  fetch(envelopeUrl, {
    method: "POST",
    body: envelope,
  }).catch(() => {
    logger.error("sentry", "Failed to send error to Sentry");
  });
}

function parseStack(stack: string) {
  return stack
    .split("\n")
    .slice(1, 10)
    .map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3]),
          colno: parseInt(match[4]),
        };
      }
      return { function: line.trim(), filename: "unknown", lineno: 0, colno: 0 };
    });
}
