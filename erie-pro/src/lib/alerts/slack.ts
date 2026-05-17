// ── Slack alert dispatcher ───────────────────────────────────────────
// Posts alerts to a Slack incoming webhook. The webhook URL lives in
// SLACK_ALERTS_WEBHOOK_URL env var; when unset, alerts are logged but
// not posted (safe-by-default for local dev).
//
// Dedup: each alert has a stable `key`. We use the existing
// `audit_logs` table (action="alert.posted", entityId=alert.key) to
// avoid re-posting the same key within DEDUP_WINDOW_HOURS.

import type { Alert, AlertSeverity } from "@/lib/alerts/thresholds";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

const DEDUP_WINDOW_HOURS = 24;
const SLACK_WEBHOOK_ENV = "SLACK_ALERTS_WEBHOOK_URL";

const COLOR_BY_SEVERITY: Record<AlertSeverity, string> = {
  info: "#3b82f6",     // blue
  warning: "#f59e0b",  // amber
  critical: "#ef4444", // red
};

const EMOJI_BY_SEVERITY: Record<AlertSeverity, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

/**
 * Build the Slack message payload. Pure — exposed for testability.
 */
export function buildSlackPayload(alert: Alert, siteDomain: string = "erie.pro"): object {
  return {
    attachments: [
      {
        color: COLOR_BY_SEVERITY[alert.severity],
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${EMOJI_BY_SEVERITY[alert.severity]} ${alert.title}`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: alert.body },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*${alert.severity.toUpperCase()}* · \`${alert.key}\` · ${siteDomain}`,
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Post a single alert to Slack. Returns true if posted, false if
 * deduped or webhook is not configured.
 */
export async function postAlertToSlack(
  alert: Alert,
  siteDomain: string = "erie.pro"
): Promise<{ posted: boolean; reason?: string }> {
  const webhookUrl = process.env[SLACK_WEBHOOK_ENV];
  if (!webhookUrl) {
    logger.info(
      "alerts/slack",
      `${SLACK_WEBHOOK_ENV} not set; would have posted: ${alert.title}`
    );
    return { posted: false, reason: "webhook_not_configured" };
  }

  // Dedup: check audit_logs for recent identical alert
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000);
  try {
    const recent = await prisma.auditLog.findFirst({
      where: {
        action: "alert.posted",
        entityId: alert.key,
        createdAt: { gte: cutoff },
      },
      select: { id: true },
    });
    if (recent) {
      logger.info("alerts/slack", `Dedup: skipping ${alert.key} (posted within ${DEDUP_WINDOW_HOURS}h)`);
      return { posted: false, reason: "deduped" };
    }
  } catch (err) {
    // If dedup check fails, fall through to posting (better to double-post
    // than to miss an alert).
    logger.warn(
      "alerts/slack",
      `Dedup check failed: ${err instanceof Error ? err.message : err}`
    );
  }

  const payload = buildSlackPayload(alert, siteDomain);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error(
        "alerts/slack",
        `Slack post failed (${res.status}): ${text.slice(0, 200)}`
      );
      return { posted: false, reason: `http_${res.status}` };
    }
  } catch (err) {
    logger.error(
      "alerts/slack",
      `Slack fetch error: ${err instanceof Error ? err.message : err}`
    );
    return { posted: false, reason: "fetch_error" };
  }

  // Record dedup marker
  try {
    await prisma.auditLog.create({
      data: {
        action: "alert.posted",
        entityType: "alert",
        entityId: alert.key,
        metadata: {
          severity: alert.severity,
          title: alert.title,
          context: alert.context,
        },
      },
    });
  } catch (err) {
    logger.warn(
      "alerts/slack",
      `Failed to record dedup marker: ${err instanceof Error ? err.message : err}`
    );
  }

  return { posted: true };
}

/** Post a batch of alerts. Continues on individual failures. */
export async function postAlertsToSlack(
  alerts: readonly Alert[],
  siteDomain: string = "erie.pro"
): Promise<{ posted: number; deduped: number; failed: number }> {
  let posted = 0;
  let deduped = 0;
  let failed = 0;
  for (const alert of alerts) {
    const result = await postAlertToSlack(alert, siteDomain);
    if (result.posted) posted++;
    else if (result.reason === "deduped") deduped++;
    else failed++;
  }
  return { posted, deduped, failed };
}
