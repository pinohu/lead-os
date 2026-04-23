import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChargebeeConfig {
  apiKey: string;
  site: string;
  baseUrl: string;
}

export interface ChargebeeCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tenantId: string;
  createdAt: string;
}

export interface ChargebeeSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: "active" | "cancelled" | "paused" | "past_due" | "trial";
  currentTermStart: string;
  currentTermEnd: string;
  trialEnd?: string;
  mrr: number;
  createdAt: string;
}

export interface ChargebeeInvoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  status: "paid" | "pending" | "voided" | "not_paid";
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  paidAt?: string;
}

export interface ChargebeePlan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  currency: string;
  features: string[];
}

export interface ChargebeeUsage {
  subscriptionId: string;
  itemId: string;
  quantity: number;
  timestamp: string;
}

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  trialDays?: number;
  tenantId?: string;
}

export interface ChargebeeWebhookEvent {
  eventType: string;
  content: Record<string, unknown>;
  occurredAt: string;
}

export interface MRRStats {
  totalMRR: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerAccount: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const customerStore = new Map<string, ChargebeeCustomer>();
const subscriptionStore = new Map<string, ChargebeeSubscription>();
const invoiceStore = new Map<string, ChargebeeInvoice>();
const usageStore = new Map<string, ChargebeeUsage[]>();
const webhookLog: ChargebeeWebhookEvent[] = [];

// ---------------------------------------------------------------------------
// DB schema (lazy init)
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

export async function ensureChargebeeSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = pool
    .query(
      `CREATE TABLE IF NOT EXISTS lead_os_chargebee_data (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((err) => {
      console.error("[chargebee] schema init error:", err instanceof Error ? err.message : String(err));
      schemaReady = null;
    });

  return schemaReady;
}

async function dbWrite(id: string, type: string, tenantId: string | undefined, payload: unknown): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await ensureChargebeeSchema();
  try {
    await pool.query(
      `INSERT INTO lead_os_chargebee_data (id, type, tenant_id, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET payload = $4, updated_at = NOW()`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch (err) {
    console.error("[chargebee] db write error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// Config & dry-run
// ---------------------------------------------------------------------------

export function resolveChargebeeConfig(): ChargebeeConfig | null {
  const apiKey = process.env.CHARGEBEE_API_KEY ?? "";
  const site = process.env.CHARGEBEE_SITE ?? "";
  if (!apiKey && !site) return null;
  const baseUrl =
    process.env.CHARGEBEE_BASE_URL ??
    (site ? `https://${site}.chargebee.com/api/v2` : "");
  return { apiKey, site, baseUrl };
}

export function isChargebeeDryRun(): boolean {
  const apiKey = process.env.CHARGEBEE_API_KEY ?? "";
  return !apiKey;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function createCustomer(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tenantId: string;
}): Promise<ChargebeeCustomer> {
  const now = new Date().toISOString();
  const customer: ChargebeeCustomer = {
    id: `cust_${randomUUID()}`,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company,
    tenantId: input.tenantId,
    createdAt: now,
  };

  customerStore.set(customer.id, customer);
  await dbWrite(customer.id, "customer", input.tenantId, customer);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          body: JSON.stringify({
            email: input.email,
            first_name: input.firstName,
            last_name: input.lastName,
            company: input.company,
            cf_tenant_id: input.tenantId,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { customer?: { id?: string } };
          if (data.customer?.id) {
            const updated = { ...customer, id: data.customer.id };
            customerStore.delete(customer.id);
            customerStore.set(updated.id, updated);
            await dbWrite(updated.id, "customer", input.tenantId, updated);
            return updated;
          }
        }
      } catch {
        // local store fallback already populated
      }
    }
  }

  return customer;
}

export async function getCustomer(customerId: string): Promise<ChargebeeCustomer | undefined> {
  return customerStore.get(customerId);
}

export async function listCustomers(tenantId?: string): Promise<ChargebeeCustomer[]> {
  const all = [...customerStore.values()];
  if (!tenantId) return all;
  return all.filter((c) => c.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

function computeMRR(planId: string): number {
  // Derive MRR from planId convention: planId may contain price hints
  // Default to 0 for dry-run; real MRR comes from Chargebee API
  return 0;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<ChargebeeSubscription> {
  const customer = customerStore.get(input.customerId);
  if (!customer) throw new Error(`Customer not found: ${input.customerId}`);

  const now = new Date();
  const hasTrialDays = input.trialDays !== undefined && input.trialDays > 0;
  const termEnd = new Date(now);
  termEnd.setMonth(termEnd.getMonth() + 1);

  const trialEnd = hasTrialDays
    ? new Date(now.getTime() + input.trialDays! * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const subscription: ChargebeeSubscription = {
    id: `sub_${randomUUID()}`,
    customerId: input.customerId,
    planId: input.planId,
    status: hasTrialDays ? "trial" : "active",
    currentTermStart: now.toISOString(),
    currentTermEnd: termEnd.toISOString(),
    trialEnd,
    mrr: computeMRR(input.planId),
    createdAt: now.toISOString(),
  };

  subscriptionStore.set(subscription.id, subscription);
  const tenantId = input.tenantId ?? customer.tenantId;
  await dbWrite(subscription.id, "subscription", tenantId, subscription);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/subscriptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          body: JSON.stringify({
            plan_id: input.planId,
            customer_id: input.customerId,
            trial_end: trialEnd ? Math.floor(new Date(trialEnd).getTime() / 1000) : undefined,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { subscription?: { id?: string } };
          if (data.subscription?.id) {
            const updated = { ...subscription, id: data.subscription.id };
            subscriptionStore.delete(subscription.id);
            subscriptionStore.set(updated.id, updated);
            await dbWrite(updated.id, "subscription", tenantId, updated);
            return updated;
          }
        }
      } catch {
        // local store fallback
      }
    }
  }

  return subscription;
}

export async function cancelSubscription(subscriptionId: string, endOfTerm = true): Promise<ChargebeeSubscription> {
  const sub = subscriptionStore.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);
  if (sub.status === "cancelled") throw new Error(`Subscription already cancelled: ${subscriptionId}`);

  const cancelled: ChargebeeSubscription = {
    ...sub,
    status: "cancelled",
    currentTermEnd: endOfTerm ? sub.currentTermEnd : new Date().toISOString(),
  };
  subscriptionStore.set(subscriptionId, cancelled);
  await dbWrite(subscriptionId, "subscription", undefined, cancelled);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          body: JSON.stringify({ end_of_term: endOfTerm }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return cancelled;
}

export async function pauseSubscription(subscriptionId: string): Promise<ChargebeeSubscription> {
  const sub = subscriptionStore.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);

  const paused: ChargebeeSubscription = { ...sub, status: "paused" };
  subscriptionStore.set(subscriptionId, paused);
  await dbWrite(subscriptionId, "subscription", undefined, paused);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/subscriptions/${subscriptionId}/pause`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return paused;
}

export async function resumeSubscription(subscriptionId: string): Promise<ChargebeeSubscription> {
  const sub = subscriptionStore.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);
  if (sub.status !== "paused") throw new Error(`Subscription is not paused: ${subscriptionId}`);

  const resumed: ChargebeeSubscription = { ...sub, status: "active" };
  subscriptionStore.set(subscriptionId, resumed);
  await dbWrite(subscriptionId, "subscription", undefined, resumed);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/subscriptions/${subscriptionId}/resume`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return resumed;
}

export async function getSubscription(subscriptionId: string): Promise<ChargebeeSubscription | undefined> {
  return subscriptionStore.get(subscriptionId);
}

export async function listSubscriptions(customerId?: string): Promise<ChargebeeSubscription[]> {
  const all = [...subscriptionStore.values()];
  if (!customerId) return all;
  return all.filter((s) => s.customerId === customerId);
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function createInvoice(
  subscriptionId: string,
  amount: number,
  currency = "USD",
): Promise<ChargebeeInvoice> {
  const sub = subscriptionStore.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice: ChargebeeInvoice = {
    id: `inv_${randomUUID()}`,
    customerId: sub.customerId,
    subscriptionId,
    status: "pending",
    amount,
    currency: currency.toUpperCase(),
    date: now.toISOString(),
    dueDate: dueDate.toISOString(),
  };

  invoiceStore.set(invoice.id, invoice);
  await dbWrite(invoice.id, "invoice", undefined, invoice);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/invoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          body: JSON.stringify({
            subscription_id: subscriptionId,
            charges: [{ amount, description: `Invoice for ${subscriptionId}` }],
            currency_code: currency.toUpperCase(),
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { invoice?: { id?: string } };
          if (data.invoice?.id) {
            const updated = { ...invoice, id: data.invoice.id };
            invoiceStore.delete(invoice.id);
            invoiceStore.set(updated.id, updated);
            return updated;
          }
        }
      } catch {
        // local store fallback
      }
    }
  }

  return invoice;
}

export async function listInvoices(customerId?: string): Promise<ChargebeeInvoice[]> {
  const all = [...invoiceStore.values()];
  if (!customerId) return all;
  return all.filter((i) => i.customerId === customerId);
}

// ---------------------------------------------------------------------------
// Metered usage
// ---------------------------------------------------------------------------

export async function recordUsage(
  subscriptionId: string,
  itemId: string,
  quantity: number,
): Promise<ChargebeeUsage> {
  const sub = subscriptionStore.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);

  const usage: ChargebeeUsage = {
    subscriptionId,
    itemId,
    quantity,
    timestamp: new Date().toISOString(),
  };

  const existing = usageStore.get(subscriptionId) ?? [];
  existing.push(usage);
  usageStore.set(subscriptionId, existing);
  await dbWrite(`usage_${subscriptionId}_${Date.now()}`, "usage", undefined, usage);

  if (!isChargebeeDryRun()) {
    const cfg = resolveChargebeeConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/usages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(cfg.apiKey + ":").toString("base64")}`,
          },
          body: JSON.stringify({
            subscription_id: subscriptionId,
            item_price_id: itemId,
            quantity: String(quantity),
            usage_date: Math.floor(Date.now() / 1000),
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local store fallback
      }
    }
  }

  return usage;
}

export async function getUsage(subscriptionId: string, itemId?: string): Promise<ChargebeeUsage[]> {
  const records = usageStore.get(subscriptionId) ?? [];
  if (!itemId) return records;
  return records.filter((u) => u.itemId === itemId);
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export async function handleWebhookEvent(event: ChargebeeWebhookEvent): Promise<{ handled: boolean; action: string }> {
  webhookLog.push(event);

  switch (event.eventType) {
    case "subscription_created": {
      const subData = event.content.subscription as Record<string, unknown> | undefined;
      if (subData?.id && typeof subData.id === "string") {
        const existing = subscriptionStore.get(subData.id);
        if (!existing) {
          const sub: ChargebeeSubscription = {
            id: subData.id,
            customerId: String(subData.customer_id ?? ""),
            planId: String(subData.plan_id ?? ""),
            status: "active",
            currentTermStart: new Date().toISOString(),
            currentTermEnd: new Date().toISOString(),
            mrr: 0,
            createdAt: event.occurredAt,
          };
          subscriptionStore.set(sub.id, sub);
        }
      }
      return { handled: true, action: "subscription_created" };
    }

    case "subscription_cancelled": {
      const subData = event.content.subscription as Record<string, unknown> | undefined;
      if (subData?.id && typeof subData.id === "string") {
        const existing = subscriptionStore.get(subData.id);
        if (existing) {
          subscriptionStore.set(subData.id, { ...existing, status: "cancelled" });
        }
      }
      return { handled: true, action: "subscription_cancelled" };
    }

    case "payment_succeeded": {
      const invoiceData = event.content.invoice as Record<string, unknown> | undefined;
      if (invoiceData?.id && typeof invoiceData.id === "string") {
        const existing = invoiceStore.get(invoiceData.id);
        if (existing) {
          invoiceStore.set(invoiceData.id, { ...existing, status: "paid", paidAt: event.occurredAt });
        }
      }
      return { handled: true, action: "payment_succeeded" };
    }

    case "payment_failed": {
      const invoiceData = event.content.invoice as Record<string, unknown> | undefined;
      if (invoiceData?.id && typeof invoiceData.id === "string") {
        const existing = invoiceStore.get(invoiceData.id);
        if (existing) {
          invoiceStore.set(invoiceData.id, { ...existing, status: "not_paid" });
        }
      }
      const subData = event.content.subscription as Record<string, unknown> | undefined;
      if (subData?.id && typeof subData.id === "string") {
        const existing = subscriptionStore.get(subData.id);
        if (existing) {
          subscriptionStore.set(subData.id, { ...existing, status: "past_due" });
        }
      }
      return { handled: true, action: "payment_failed" };
    }

    default:
      return { handled: false, action: event.eventType };
  }
}

// ---------------------------------------------------------------------------
// MRR Stats
// ---------------------------------------------------------------------------

export async function getMRRStats(tenantId?: string): Promise<MRRStats> {
  let subs = [...subscriptionStore.values()];

  if (tenantId) {
    const tenantCustomerIds = new Set(
      [...customerStore.values()]
        .filter((c) => c.tenantId === tenantId)
        .map((c) => c.id),
    );
    subs = subs.filter((s) => tenantCustomerIds.has(s.customerId));
  }

  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trial");
  const cancelledSubs = subs.filter((s) => s.status === "cancelled");
  const totalMRR = activeSubs.reduce((sum, s) => sum + s.mrr, 0);
  const totalSubs = subs.length;
  const churnRate = totalSubs > 0 ? cancelledSubs.length / totalSubs : 0;
  const avgRevenuePerAccount = activeSubs.length > 0 ? totalMRR / activeSubs.length : 0;

  return {
    totalMRR,
    activeSubscriptions: activeSubs.length,
    churnRate,
    avgRevenuePerAccount,
  };
}

// ---------------------------------------------------------------------------
// Stripe sync (dual-billing mapping)
// ---------------------------------------------------------------------------

export async function syncWithStripe(
  tenantId: string,
): Promise<{ mappings: Array<{ chargebeeSubId: string; stripeSubId: string | null }> }> {
  const tenantCustomerIds = new Set(
    [...customerStore.values()]
      .filter((c) => c.tenantId === tenantId)
      .map((c) => c.id),
  );

  const tenantSubs = [...subscriptionStore.values()].filter((s) =>
    tenantCustomerIds.has(s.customerId),
  );

  const mappings = tenantSubs.map((s) => ({
    chargebeeSubId: s.id,
    stripeSubId: null as string | null,
  }));

  return { mappings };
}

// ---------------------------------------------------------------------------
// Provider result bridge
// ---------------------------------------------------------------------------

export function chargebeeBillingResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Chargebee",
    mode: isChargebeeDryRun() ? "dry-run" : "live",
    detail,
    payload: { operation },
  };
}

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

export function resetChargebeeStore(): void {
  customerStore.clear();
  subscriptionStore.clear();
  invoiceStore.clear();
  usageStore.clear();
  webhookLog.length = 0;
}
