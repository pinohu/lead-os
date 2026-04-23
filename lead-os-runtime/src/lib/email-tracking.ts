import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface EmailTrackingEvent {
  id: string;
  leadKey: string;
  emailId: string;
  eventType: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed";
  linkUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EmailTrackingPixel {
  trackingId: string;
  pixelUrl: string;
}

export interface TrackedLink {
  originalUrl: string;
  trackedUrl: string;
  trackingId: string;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

const MAX_STORE_SIZE = 10_000;

const emailEventStore: EmailTrackingEvent[] = [];

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_email_tracking (
          id TEXT PRIMARY KEY,
          lead_key TEXT NOT NULL,
          email_id TEXT NOT NULL,
          event_type TEXT NOT NULL
            CHECK (event_type IN ('sent','delivered','opened','clicked','bounced','unsubscribed')),
          link_url TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_email_tracking_lead_key
          ON lead_os_email_tracking (lead_key, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_email_tracking_email_id
          ON lead_os_email_tracking (email_id);
      `);
    } catch (error: unknown) {
      console.error("Failed to create email tracking schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureSchema();
  return activePool.query<T>(text, values);
}

function encodeTrackingId(leadKey: string, emailId: string): string {
  const raw = `${leadKey}:${emailId}`;
  return Buffer.from(raw).toString("base64url");
}

export function generateTrackingPixel(
  leadKey: string,
  emailId: string,
  baseUrl: string,
): EmailTrackingPixel {
  const trackingId = encodeTrackingId(leadKey, emailId);
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const pixelUrl = `${normalizedBase}/api/email/pixel/${trackingId}.gif`;

  return { trackingId, pixelUrl };
}

export function generateTrackedLinks(
  links: string[],
  leadKey: string,
  emailId: string,
  baseUrl: string,
): TrackedLink[] {
  const trackingId = encodeTrackingId(leadKey, emailId);
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return links.map((originalUrl) => {
    const encodedUrl = encodeURIComponent(originalUrl);
    const trackedUrl = `${normalizedBase}/api/email/click/${trackingId}?url=${encodedUrl}`;
    return { originalUrl, trackedUrl, trackingId };
  });
}

export async function recordEmailEvent(
  event: Omit<EmailTrackingEvent, "id" | "createdAt">,
): Promise<EmailTrackingEvent> {
  const record: EmailTrackingEvent = {
    ...event,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  emailEventStore.push(record);
  if (emailEventStore.length > MAX_STORE_SIZE) { emailEventStore.splice(0, emailEventStore.length - MAX_STORE_SIZE); }

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `INSERT INTO lead_os_email_tracking (id, lead_key, email_id, event_type, link_url, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.leadKey,
        record.emailId,
        record.eventType,
        record.linkUrl ?? null,
        record.metadata ? JSON.stringify(record.metadata) : null,
        record.createdAt,
      ],
    );
  }

  return record;
}

export async function getEmailEvents(leadKey: string): Promise<EmailTrackingEvent[]> {
  const activePool = getPool();
  if (activePool) {
    const result = await queryPostgres<{
      id: string;
      lead_key: string;
      email_id: string;
      event_type: string;
      link_url: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(
      `SELECT id, lead_key, email_id, event_type, link_url, metadata, created_at
       FROM lead_os_email_tracking
       WHERE lead_key = $1
       ORDER BY created_at DESC`,
      [leadKey],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadKey: row.lead_key,
      emailId: row.email_id,
      eventType: row.event_type as EmailTrackingEvent["eventType"],
      linkUrl: row.link_url ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  return emailEventStore
    .filter((e) => e.leadKey === leadKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getEmailMetrics(leadKey: string): Promise<EmailMetrics> {
  const counts = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
  };

  const activePool = getPool();
  if (activePool) {
    const result = await queryPostgres<{ event_type: string; count: number }>(
      `SELECT event_type, COUNT(*)::int AS count
       FROM lead_os_email_tracking
       WHERE lead_key = $1
       GROUP BY event_type`,
      [leadKey],
    );

    for (const row of result.rows) {
      const eventType = row.event_type as keyof typeof counts;
      if (eventType in counts) {
        counts[eventType] = row.count;
      }
    }
  } else {
    const events = emailEventStore.filter((e) => e.leadKey === leadKey);
    for (const event of events) {
      counts[event.eventType]++;
    }
  }

  const deliveredOrSent = counts.delivered > 0 ? counts.delivered : counts.sent;

  return {
    ...counts,
    openRate: deliveredOrSent > 0 ? counts.opened / deliveredOrSent : 0,
    clickRate: deliveredOrSent > 0 ? counts.clicked / deliveredOrSent : 0,
  };
}
