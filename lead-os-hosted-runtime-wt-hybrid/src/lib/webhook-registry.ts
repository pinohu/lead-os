import { randomUUID, createHmac } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  status: "active" | "paused" | "failed";
  failureCount: number;
  lastDeliveryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "retrying";
  httpStatus?: number;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  responseBody?: string;
  createdAt: string;
  completedAt?: string;
}

const endpointStore = new Map<string, WebhookEndpoint>();
const deliveryStore = new Map<string, WebhookDelivery>();

const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  24 * 60 * 60_000,
];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
const MAX_CONSECUTIVE_FAILURES = 5;

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_webhook_endpoints (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          url TEXT NOT NULL,
          events JSONB NOT NULL DEFAULT '[]',
          secret TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          failure_count INTEGER NOT NULL DEFAULT 0,
          last_delivery_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_endpoints_tenant
          ON lead_os_webhook_endpoints (tenant_id);

        CREATE TABLE IF NOT EXISTS lead_os_webhook_deliveries (
          id TEXT PRIMARY KEY,
          endpoint_id TEXT NOT NULL,
          event TEXT NOT NULL,
          payload JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          http_status INTEGER,
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 6,
          next_retry_at TIMESTAMPTZ,
          response_body TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_deliveries_endpoint
          ON lead_os_webhook_deliveries (endpoint_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_deliveries_retry
          ON lead_os_webhook_deliveries (status, next_retry_at)
          WHERE status = 'retrying';
      `);
    } catch (error: unknown) {
      console.error("Failed to create webhook schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

function generateSecret(): string {
  return `whsec_${randomUUID().replace(/-/g, "")}`;
}

export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function registerWebhook(
  tenantId: string,
  url: string,
  events: string[],
): Promise<WebhookEndpoint> {
  await ensureSchema();

  const now = new Date().toISOString();
  const endpoint: WebhookEndpoint = {
    id: randomUUID(),
    tenantId,
    url,
    events,
    secret: generateSecret(),
    status: "active",
    failureCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  endpointStore.set(endpoint.id, endpoint);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_webhook_endpoints
         (id, tenant_id, url, events, secret, status, failure_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::timestamptz, $9::timestamptz)`,
      [endpoint.id, endpoint.tenantId, endpoint.url, JSON.stringify(endpoint.events), endpoint.secret, endpoint.status, endpoint.failureCount, endpoint.createdAt, endpoint.updatedAt],
    );
  }

  return endpoint;
}

export async function listWebhooks(tenantId: string): Promise<WebhookEndpoint[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT id, tenant_id, url, events, secret, status, failure_count, last_delivery_at, created_at, updated_at
       FROM lead_os_webhook_endpoints WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );

    return result.rows.map(rowToEndpoint);
  }

  return [...endpointStore.values()]
    .filter((e) => e.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getWebhook(id: string): Promise<WebhookEndpoint | null> {
  await ensureSchema();

  const cached = endpointStore.get(id);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query<QueryResultRow>(
    `SELECT id, tenant_id, url, events, secret, status, failure_count, last_delivery_at, created_at, updated_at
     FROM lead_os_webhook_endpoints WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return null;

  const endpoint = rowToEndpoint(result.rows[0]);
  endpointStore.set(endpoint.id, endpoint);
  return endpoint;
}

export async function updateWebhook(
  id: string,
  patch: Partial<Pick<WebhookEndpoint, "url" | "events" | "status">>,
): Promise<WebhookEndpoint | null> {
  await ensureSchema();

  const existing = await getWebhook(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: WebhookEndpoint = {
    ...existing,
    url: patch.url ?? existing.url,
    events: patch.events ?? existing.events,
    status: patch.status ?? existing.status,
    updatedAt: now,
  };

  endpointStore.set(id, updated);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_webhook_endpoints
       SET url = $1, events = $2::jsonb, status = $3, updated_at = $4::timestamptz
       WHERE id = $5`,
      [updated.url, JSON.stringify(updated.events), updated.status, updated.updatedAt, id],
    );
  }

  return updated;
}

export async function deleteWebhook(id: string): Promise<boolean> {
  await ensureSchema();

  endpointStore.delete(id);

  const pool = getPool();
  if (pool) {
    const result = await pool.query(`DELETE FROM lead_os_webhook_endpoints WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  return true;
}

export async function deliverWebhook(
  endpointId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<WebhookDelivery> {
  await ensureSchema();

  const endpoint = await getWebhook(endpointId);
  if (!endpoint) throw new Error(`Webhook endpoint ${endpointId} not found`);
  if (endpoint.status !== "active") throw new Error(`Webhook endpoint ${endpointId} is not active`);

  const now = new Date().toISOString();
  const delivery: WebhookDelivery = {
    id: randomUUID(),
    endpointId,
    event,
    payload,
    status: "pending",
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: now,
  };

  deliveryStore.set(delivery.id, delivery);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_webhook_deliveries
         (id, endpoint_id, event, payload, status, attempts, max_attempts, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::timestamptz)`,
      [delivery.id, delivery.endpointId, delivery.event, JSON.stringify(delivery.payload), delivery.status, delivery.attempts, delivery.maxAttempts, delivery.createdAt],
    );
  }

  return attemptDelivery(delivery, endpoint);
}

async function attemptDelivery(delivery: WebhookDelivery, endpoint: WebhookEndpoint): Promise<WebhookDelivery> {
  delivery.attempts++;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyString = JSON.stringify(delivery.payload);
  const signature = signWebhookPayload(`${timestamp}.${bodyString}`, endpoint.secret);

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LeadOS-Signature": `sha256=${signature}`,
        "X-LeadOS-Timestamp": timestamp,
        "X-LeadOS-Event": delivery.event,
        "X-LeadOS-Delivery-Id": delivery.id,
        "User-Agent": "LeadOS-Webhook/1.0",
      },
      body: bodyString,
      signal: AbortSignal.timeout(30_000),
    });

    delivery.httpStatus = response.status;

    const responseText = await response.text().catch(() => "");
    delivery.responseBody = responseText.slice(0, 4096);

    if (response.ok) {
      delivery.status = "delivered";
      delivery.completedAt = new Date().toISOString();

      endpoint.failureCount = 0;
      endpoint.lastDeliveryAt = delivery.completedAt;
      endpointStore.set(endpoint.id, endpoint);

      const pool = getPool();
      if (pool) {
        await pool.query(
          `UPDATE lead_os_webhook_endpoints SET failure_count = 0, last_delivery_at = $1::timestamptz WHERE id = $2`,
          [endpoint.lastDeliveryAt, endpoint.id],
        );
      }
    } else {
      handleDeliveryFailure(delivery, endpoint);
    }
  } catch (error: unknown) {
    delivery.responseBody = error instanceof Error ? error.message : "Unknown error";
    handleDeliveryFailure(delivery, endpoint);
  }

  deliveryStore.set(delivery.id, delivery);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_webhook_deliveries
       SET status = $1, http_status = $2, attempts = $3, next_retry_at = $4::timestamptz,
           response_body = $5, completed_at = $6::timestamptz
       WHERE id = $7`,
      [delivery.status, delivery.httpStatus ?? null, delivery.attempts, delivery.nextRetryAt ?? null, delivery.responseBody ?? null, delivery.completedAt ?? null, delivery.id],
    );
  }

  return delivery;
}

function handleDeliveryFailure(delivery: WebhookDelivery, endpoint: WebhookEndpoint): void {
  if (delivery.attempts >= delivery.maxAttempts) {
    delivery.status = "failed";
    delivery.completedAt = new Date().toISOString();
  } else {
    delivery.status = "retrying";
    const delayMs = RETRY_DELAYS_MS[delivery.attempts - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    delivery.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
  }

  endpoint.failureCount++;
  endpointStore.set(endpoint.id, endpoint);

  if (endpoint.failureCount >= MAX_CONSECUTIVE_FAILURES) {
    pauseEndpointOnFailure(endpoint.id).catch(() => {});
  }
}

export async function retryFailedDeliveries(): Promise<WebhookDelivery[]> {
  await ensureSchema();

  const now = new Date();
  const retried: WebhookDelivery[] = [];

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT d.id, d.endpoint_id, d.event, d.payload, d.status, d.http_status,
              d.attempts, d.max_attempts, d.next_retry_at, d.response_body, d.created_at, d.completed_at
       FROM lead_os_webhook_deliveries d
       WHERE d.status = 'retrying' AND d.next_retry_at <= $1::timestamptz
       LIMIT 100`,
      [now.toISOString()],
    );

    for (const row of result.rows) {
      const delivery = rowToDelivery(row);
      const endpoint = await getWebhook(delivery.endpointId);
      if (!endpoint || endpoint.status !== "active") {
        delivery.status = "failed";
        delivery.completedAt = now.toISOString();
        deliveryStore.set(delivery.id, delivery);
        await pool.query(
          `UPDATE lead_os_webhook_deliveries SET status = 'failed', completed_at = $1::timestamptz WHERE id = $2`,
          [delivery.completedAt, delivery.id],
        );
        continue;
      }

      const result = await attemptDelivery(delivery, endpoint);
      retried.push(result);
    }
  } else {
    for (const delivery of deliveryStore.values()) {
      if (delivery.status !== "retrying") continue;
      if (!delivery.nextRetryAt || new Date(delivery.nextRetryAt) > now) continue;

      const endpoint = endpointStore.get(delivery.endpointId);
      if (!endpoint || endpoint.status !== "active") {
        delivery.status = "failed";
        delivery.completedAt = now.toISOString();
        deliveryStore.set(delivery.id, delivery);
        continue;
      }

      const result = await attemptDelivery(delivery, endpoint);
      retried.push(result);
    }
  }

  return retried;
}

export async function getDeliveryHistory(endpointId: string, limit: number = 50): Promise<WebhookDelivery[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT id, endpoint_id, event, payload, status, http_status,
              attempts, max_attempts, next_retry_at, response_body, created_at, completed_at
       FROM lead_os_webhook_deliveries
       WHERE endpoint_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [endpointId, limit],
    );

    return result.rows.map(rowToDelivery);
  }

  return [...deliveryStore.values()]
    .filter((d) => d.endpointId === endpointId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
  const cached = deliveryStore.get(deliveryId);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query<QueryResultRow>(
    `SELECT id, endpoint_id, event, payload, status, http_status,
            attempts, max_attempts, next_retry_at, response_body, created_at, completed_at
     FROM lead_os_webhook_deliveries WHERE id = $1`,
    [deliveryId],
  );

  if (result.rows.length === 0) return null;
  const delivery = rowToDelivery(result.rows[0]);
  deliveryStore.set(delivery.id, delivery);
  return delivery;
}

export async function pauseEndpointOnFailure(endpointId: string): Promise<void> {
  const endpoint = await getWebhook(endpointId);
  if (!endpoint) return;

  endpoint.status = "failed";
  endpoint.updatedAt = new Date().toISOString();
  endpointStore.set(endpointId, endpoint);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_webhook_endpoints SET status = 'failed', updated_at = $1::timestamptz WHERE id = $2`,
      [endpoint.updatedAt, endpointId],
    );
  }
}

function rowToEndpoint(row: QueryResultRow): WebhookEndpoint {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    url: row.url as string,
    events: (row.events as string[]) ?? [],
    secret: row.secret as string,
    status: row.status as WebhookEndpoint["status"],
    failureCount: row.failure_count as number,
    lastDeliveryAt: row.last_delivery_at ? new Date(row.last_delivery_at as string).toISOString() : undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

function rowToDelivery(row: QueryResultRow): WebhookDelivery {
  return {
    id: row.id as string,
    endpointId: row.endpoint_id as string,
    event: row.event as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as WebhookDelivery["status"],
    httpStatus: row.http_status as number | undefined,
    attempts: row.attempts as number,
    maxAttempts: row.max_attempts as number,
    nextRetryAt: row.next_retry_at ? new Date(row.next_retry_at as string).toISOString() : undefined,
    responseBody: row.response_body as string | undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at as string).toISOString() : undefined,
  };
}

export function resetWebhookStore(): void {
  endpointStore.clear();
  deliveryStore.clear();
  schemaReady = null;
}
