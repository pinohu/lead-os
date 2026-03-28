// Lago adapter for usage-based / metered billing.
// Uses Lago API when LAGO_API_KEY + LAGO_URL are set.
// Falls back to in-memory tracking when not configured.

export interface UsageEvent {
  tenantId: string;
  eventType: string;
  units: number;
  timestamp?: string;
  metadata?: Record<string, string>;
}

export interface UsageSummary {
  tenantId: string;
  period: string;
  events: {
    type: string;
    totalUnits: number;
    unitPrice: number;
    totalCost: number;
  }[];
  totalCost: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  period: string;
  amount: number;
  status: "draft" | "pending" | "paid" | "overdue";
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pre-configured Lead OS usage types
// ---------------------------------------------------------------------------

export const LEAD_OS_USAGE_TYPES: {
  type: string;
  defaultPrice: number;
  description: string;
}[] = [
  { type: "lead-captured", defaultPrice: 0.05, description: "Lead captured via form or widget" },
  { type: "email-sent", defaultPrice: 0.002, description: "Outbound email delivered" },
  { type: "sms-sent", defaultPrice: 0.015, description: "Outbound SMS delivered" },
  { type: "whatsapp-sent", defaultPrice: 0.012, description: "Outbound WhatsApp message delivered" },
  { type: "page-deployed", defaultPrice: 0.10, description: "Landing page deployed" },
  { type: "video-generated", defaultPrice: 0.50, description: "AI video generated" },
  { type: "api-call", defaultPrice: 0.001, description: "External API call proxied" },
];

// ---------------------------------------------------------------------------
// In-memory store (dry-run / fallback)
// ---------------------------------------------------------------------------

// eventStore: Map<tenantId, Map<period, Map<eventType, totalUnits>>>
const eventStore = new Map<string, Map<string, Map<string, number>>>();
const invoiceStore = new Map<string, Invoice>();

const pricingMap = new Map<string, { unitPrice: number; description: string }>(
  LEAD_OS_USAGE_TYPES.map((t) => [
    t.type,
    { unitPrice: t.defaultPrice, description: t.description },
  ]),
);

export function resetBillingStore(): void {
  eventStore.clear();
  invoiceStore.clear();
}

// ---------------------------------------------------------------------------
// Lago client helpers
// ---------------------------------------------------------------------------

function getLagoConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.LAGO_API_KEY;
  const baseUrl = process.env.LAGO_URL;
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, "") };
}

async function lagoRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getLagoConfig();
  if (!config) throw new Error("Lago not configured");

  const res = await fetch(`${config.baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Lago API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function currentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addToStore(event: UsageEvent): void {
  const period = event.timestamp
    ? event.timestamp.slice(0, 7)
    : currentPeriod();

  if (!eventStore.has(event.tenantId)) {
    eventStore.set(event.tenantId, new Map());
  }
  const byPeriod = eventStore.get(event.tenantId)!;

  if (!byPeriod.has(period)) {
    byPeriod.set(period, new Map());
  }
  const byType = byPeriod.get(period)!;

  byType.set(event.eventType, (byType.get(event.eventType) ?? 0) + event.units);
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function recordUsage(event: UsageEvent): Promise<string> {
  const config = getLagoConfig();
  const id = generateEventId();

  if (!config) {
    addToStore(event);
    return id;
  }

  await lagoRequest<unknown>("/events", {
    method: "POST",
    body: JSON.stringify({
      event: {
        transaction_id: id,
        external_subscription_id: event.tenantId,
        code: event.eventType,
        timestamp: event.timestamp
          ? Math.floor(new Date(event.timestamp).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        properties: {
          units: String(event.units),
          ...event.metadata,
        },
      },
    }),
  });

  addToStore(event);
  return id;
}

export async function recordBulkUsage(events: UsageEvent[]): Promise<string[]> {
  return Promise.all(events.map((e) => recordUsage(e)));
}

export async function getUsageSummary(
  tenantId: string,
  period?: string,
): Promise<UsageSummary> {
  const p = period ?? currentPeriod();
  const byType = eventStore.get(tenantId)?.get(p) ?? new Map<string, number>();

  const events = Array.from(byType.entries()).map(([type, totalUnits]) => {
    const pricing = pricingMap.get(type);
    const unitPrice = pricing?.unitPrice ?? 0;
    return {
      type,
      totalUnits,
      unitPrice,
      totalCost: totalUnits * unitPrice,
    };
  });

  const totalCost = events.reduce((sum, e) => sum + e.totalCost, 0);

  return { tenantId, period: p, events, totalCost };
}

export async function generateInvoice(
  tenantId: string,
  period: string,
): Promise<Invoice> {
  const summary = await getUsageSummary(tenantId, period);
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const invoice: Invoice = {
    id,
    tenantId,
    period,
    amount: summary.totalCost,
    status: "draft",
    items: summary.events.map((e) => ({
      description: pricingMap.get(e.type)?.description ?? e.type,
      quantity: e.totalUnits,
      unitPrice: e.unitPrice,
      total: e.totalCost,
    })),
    createdAt: new Date().toISOString(),
  };

  invoiceStore.set(id, invoice);
  return invoice;
}

export async function getInvoice(
  invoiceId: string,
): Promise<Invoice | undefined> {
  return invoiceStore.get(invoiceId);
}

export async function listInvoices(tenantId: string): Promise<Invoice[]> {
  return Array.from(invoiceStore.values()).filter(
    (inv) => inv.tenantId === tenantId,
  );
}

export function setPricing(
  eventType: string,
  unitPrice: number,
  description: string,
): void {
  pricingMap.set(eventType, { unitPrice, description });
}

export function getPricing(): {
  eventType: string;
  unitPrice: number;
  description: string;
}[] {
  return Array.from(pricingMap.entries()).map(([eventType, p]) => ({
    eventType,
    ...p,
  }));
}
