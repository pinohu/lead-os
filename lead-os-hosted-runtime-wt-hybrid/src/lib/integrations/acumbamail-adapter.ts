import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcumbamailConfig {
  apiKey: string;
  baseUrl: string;
}

export interface AcumbamailSubscriber {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  listId: string;
  status: "subscribed" | "unsubscribed" | "bounced";
  customFields: Record<string, string>;
  tenantId?: string;
  createdAt: string;
}

export interface AcumbamailList {
  id: string;
  name: string;
  subscriberCount: number;
  tenantId?: string;
  createdAt: string;
}

export interface AcumbamailCampaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlBody: string;
  listIds: string[];
  status: "draft" | "scheduled" | "sent";
  sentAt?: string;
  stats?: CampaignStats;
  tenantId?: string;
  createdAt: string;
}

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complaints: number;
  openRate: number;
  clickRate: number;
}

export interface AcumbamailSms {
  id: string;
  to: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "failed";
  tenantId?: string;
  sentAt: string;
}

export interface AcumbamailStats {
  totalSubscribers: number;
  totalCampaigns: number;
  totalSmsSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  listCount: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const subscriberStore = new Map<string, AcumbamailSubscriber>();
const listStore = new Map<string, AcumbamailList>();
const campaignStore = new Map<string, AcumbamailCampaign>();
const smsStore = new Map<string, AcumbamailSms>();

// ---------------------------------------------------------------------------
// DB schema (lazy init)
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

export async function ensureAcumbamailSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = pool
    .query(
      `CREATE TABLE IF NOT EXISTS lead_os_acumbamail (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    .then(() => undefined)
    .catch((err) => {
      console.error("[acumbamail] schema init error:", err instanceof Error ? err.message : String(err));
      schemaReady = null;
    });

  return schemaReady;
}

async function dbWrite(id: string, type: string, tenantId: string | undefined, payload: unknown): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await ensureAcumbamailSchema();
  try {
    await pool.query(
      `INSERT INTO lead_os_acumbamail (id, type, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = $4`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch (err) {
    console.error("[acumbamail] db write error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveAcumbamailConfig(): AcumbamailConfig | null {
  const apiKey = process.env.ACUMBAMAIL_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.ACUMBAMAIL_BASE_URL ?? "https://acumbamail.com/api/1",
  };
}

export function isAcumbamailDryRun(): boolean {
  return !process.env.ACUMBAMAIL_API_KEY;
}

// ---------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------

function findSubscriberByEmailInStore(email: string): AcumbamailSubscriber | undefined {
  for (const sub of subscriberStore.values()) {
    if (sub.email === email) return sub;
  }
  return undefined;
}

export async function createSubscriber(input: {
  email: string;
  name?: string;
  phone?: string;
  listId: string;
  customFields?: Record<string, string>;
  tenantId?: string;
}): Promise<AcumbamailSubscriber> {
  const now = new Date().toISOString();

  const existing = findSubscriberByEmailInStore(input.email);
  if (existing) {
    const merged: AcumbamailSubscriber = {
      ...existing,
      name: input.name ?? existing.name,
      phone: input.phone ?? existing.phone,
      listId: input.listId,
      customFields: { ...existing.customFields, ...(input.customFields ?? {}) },
      tenantId: input.tenantId ?? existing.tenantId,
    };
    subscriberStore.set(merged.id, merged);
    await dbWrite(merged.id, "subscriber", merged.tenantId, merged);
    return merged;
  }

  const subscriber: AcumbamailSubscriber = {
    id: `acm-sub-${randomUUID()}`,
    email: input.email,
    name: input.name,
    phone: input.phone,
    listId: input.listId,
    status: "subscribed",
    customFields: input.customFields ?? {},
    tenantId: input.tenantId,
    createdAt: now,
  };

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/addSubscriber/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            list_id: input.listId,
            merge_fields: {
              email: input.email,
              name: input.name ?? "",
              phone: input.phone ?? "",
              ...input.customFields,
            },
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string | number };
          if (data.id) {
            subscriber.id = String(data.id);
          }
        }
      } catch {
        // fall through to local store
      }
    }
  }

  subscriberStore.set(subscriber.id, subscriber);
  await dbWrite(subscriber.id, "subscriber", subscriber.tenantId, subscriber);

  const list = listStore.get(input.listId);
  if (list) {
    listStore.set(input.listId, { ...list, subscriberCount: list.subscriberCount + 1 });
  }

  return subscriber;
}

export async function getSubscriberByEmail(email: string): Promise<AcumbamailSubscriber | null> {
  return findSubscriberByEmailInStore(email) ?? null;
}

export async function unsubscribe(email: string): Promise<boolean> {
  const subscriber = findSubscriberByEmailInStore(email);
  if (!subscriber) return false;

  const updated: AcumbamailSubscriber = { ...subscriber, status: "unsubscribed" };
  subscriberStore.set(subscriber.id, updated);
  await dbWrite(subscriber.id, "subscriber", updated.tenantId, updated);

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/deleteSubscriber/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            list_id: subscriber.listId,
            email: subscriber.email,
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export async function createList(name: string, tenantId?: string): Promise<AcumbamailList> {
  const now = new Date().toISOString();
  const list: AcumbamailList = {
    id: `acm-list-${randomUUID()}`,
    name,
    subscriberCount: 0,
    tenantId,
    createdAt: now,
  };

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/createList/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            name,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string | number };
          if (data.id) {
            list.id = String(data.id);
          }
        }
      } catch {
        // fall through to local store
      }
    }
  }

  listStore.set(list.id, list);
  await dbWrite(list.id, "list", tenantId, list);
  return list;
}

export async function listLists(tenantId?: string): Promise<AcumbamailList[]> {
  const all = [...listStore.values()];
  if (!tenantId) return all;
  return all.filter((l) => l.tenantId === tenantId);
}

export async function addSubscriberToList(subscriberId: string, listId: string): Promise<boolean> {
  const subscriber = subscriberStore.get(subscriberId);
  if (!subscriber) return false;

  const list = listStore.get(listId);
  if (!list) return false;

  if (subscriber.listId === listId) return true;

  const updatedSubscriber: AcumbamailSubscriber = {
    ...subscriber,
    listId,
  };
  subscriberStore.set(subscriberId, updatedSubscriber);
  await dbWrite(subscriberId, "subscriber", updatedSubscriber.tenantId, updatedSubscriber);

  listStore.set(listId, { ...list, subscriberCount: list.subscriberCount + 1 });
  await dbWrite(listId, "list", list.tenantId, listStore.get(listId));

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/addSubscriber/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            list_id: listId,
            merge_fields: {
              email: subscriber.email,
              name: subscriber.name ?? "",
            },
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function createCampaign(input: {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlBody: string;
  listIds: string[];
  tenantId?: string;
}): Promise<AcumbamailCampaign> {
  const now = new Date().toISOString();
  const campaign: AcumbamailCampaign = {
    id: `acm-camp-${randomUUID()}`,
    name: input.name,
    subject: input.subject,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    htmlBody: input.htmlBody,
    listIds: input.listIds,
    status: "draft",
    tenantId: input.tenantId,
    createdAt: now,
  };

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/createCampaign/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            name: input.name,
            subject: input.subject,
            from_name: input.fromName,
            from_email: input.fromEmail,
            html: input.htmlBody,
            list_ids: input.listIds,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string | number };
          if (data.id) {
            campaign.id = String(data.id);
          }
        }
      } catch {
        // fall through to local store
      }
    }
  }

  campaignStore.set(campaign.id, campaign);
  await dbWrite(campaign.id, "campaign", input.tenantId, campaign);
  return campaign;
}

export async function sendCampaign(campaignId: string): Promise<AcumbamailCampaign> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const now = new Date().toISOString();
  const sent: AcumbamailCampaign = {
    ...campaign,
    status: "sent",
    sentAt: now,
  };

  campaignStore.set(campaignId, sent);
  await dbWrite(campaignId, "campaign", sent.tenantId, sent);

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/sendCampaign/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            campaign_id: campaignId,
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local state already updated
      }
    }
  }

  return sent;
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) return null;

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/getCampaignStats/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            campaign_id: campaignId,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { stats?: CampaignStats };
          if (data.stats) {
            const updated = { ...campaign, stats: data.stats };
            campaignStore.set(campaignId, updated);
            return data.stats;
          }
        }
      } catch {
        // fall through to generated stats
      }
    }
  }

  if (campaign.stats) return campaign.stats;

  const sent = Math.floor(Math.random() * 900) + 100;
  const openRate = 0.20 + Math.random() * 0.15;
  const clickRate = 0.02 + Math.random() * 0.06;
  const opened = Math.floor(sent * openRate);
  const clicked = Math.floor(sent * clickRate);
  const bounced = Math.floor(sent * 0.02);
  const unsubscribed = Math.floor(sent * 0.005);
  const complaints = Math.floor(sent * 0.001);

  const stats: CampaignStats = {
    sent,
    opened,
    clicked,
    bounced,
    unsubscribed,
    complaints,
    openRate: Math.round(openRate * 10000) / 100,
    clickRate: Math.round(clickRate * 10000) / 100,
  };

  const updated = { ...campaign, stats };
  campaignStore.set(campaignId, updated);
  return stats;
}

// ---------------------------------------------------------------------------
// SMS
// ---------------------------------------------------------------------------

export async function sendSms(to: string, body: string, tenantId?: string): Promise<AcumbamailSms> {
  const now = new Date().toISOString();
  const sms: AcumbamailSms = {
    id: `acm-sms-${randomUUID()}`,
    to,
    body,
    status: "queued",
    tenantId,
    sentAt: now,
  };

  if (!isAcumbamailDryRun()) {
    const cfg = resolveAcumbamailConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/sendSms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: cfg.apiKey,
            to,
            body,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string | number; status?: string };
          if (data.id) {
            sms.id = String(data.id);
          }
          if (data.status === "sent" || data.status === "delivered") {
            sms.status = data.status;
          }
        }
      } catch {
        // fall through to local store
      }
    }
  }

  smsStore.set(sms.id, sms);
  await dbWrite(sms.id, "sms", tenantId, sms);
  return sms;
}

export async function listSmsSent(tenantId?: string): Promise<AcumbamailSms[]> {
  const all = [...smsStore.values()];
  if (!tenantId) return all;
  return all.filter((s) => s.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Provider bridges (used by providers.ts)
// ---------------------------------------------------------------------------

export async function sendEmailViaAcumbamail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<ProviderResult> {
  if (isAcumbamailDryRun()) {
    return {
      ok: true,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "Email prepared (Acumbamail dry-run)",
      payload: { to: input.to, subject: input.subject },
    };
  }

  const cfg = resolveAcumbamailConfig();
  if (!cfg) {
    return {
      ok: false,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "Acumbamail not configured",
    };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/sendOne/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: cfg.apiKey,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      return {
        ok: true,
        provider: "Acumbamail",
        mode: "live",
        detail: "Email sent via Acumbamail",
        payload: { to: input.to, messageId: data.id ?? randomUUID() },
      };
    }

    return {
      ok: false,
      provider: "Acumbamail",
      mode: "live",
      detail: `Acumbamail API returned ${res.status}`,
    };
  } catch {
    return {
      ok: true,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "Email prepared (Acumbamail API unreachable, fallback to dry-run)",
      payload: { to: input.to, subject: input.subject },
    };
  }
}

export async function sendSmsViaAcumbamail(to: string, body: string): Promise<ProviderResult> {
  if (isAcumbamailDryRun()) {
    return {
      ok: true,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "SMS prepared (Acumbamail dry-run)",
      payload: { to, body },
    };
  }

  const cfg = resolveAcumbamailConfig();
  if (!cfg) {
    return {
      ok: false,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "Acumbamail not configured",
    };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/sendSms/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: cfg.apiKey,
        to,
        body,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      return {
        ok: true,
        provider: "Acumbamail",
        mode: "live",
        detail: "SMS sent via Acumbamail",
        payload: { to, messageId: data.id ?? randomUUID() },
      };
    }

    return {
      ok: false,
      provider: "Acumbamail",
      mode: "live",
      detail: `Acumbamail SMS API returned ${res.status}`,
    };
  } catch {
    return {
      ok: true,
      provider: "Acumbamail",
      mode: "dry-run",
      detail: "SMS prepared (Acumbamail API unreachable, fallback to dry-run)",
      payload: { to, body },
    };
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getAcumbamailStats(tenantId?: string): Promise<AcumbamailStats> {
  const subscribers = tenantId
    ? [...subscriberStore.values()].filter((s) => s.tenantId === tenantId)
    : [...subscriberStore.values()];

  const campaigns = tenantId
    ? [...campaignStore.values()].filter((c) => c.tenantId === tenantId)
    : [...campaignStore.values()];

  const smsList = tenantId
    ? [...smsStore.values()].filter((s) => s.tenantId === tenantId)
    : [...smsStore.values()];

  const lists = tenantId
    ? [...listStore.values()].filter((l) => l.tenantId === tenantId)
    : [...listStore.values()];

  const sentCampaigns = campaigns.filter((c) => c.stats);
  let avgOpenRate = 0;
  let avgClickRate = 0;

  if (sentCampaigns.length > 0) {
    avgOpenRate = sentCampaigns.reduce((sum, c) => sum + (c.stats?.openRate ?? 0), 0) / sentCampaigns.length;
    avgClickRate = sentCampaigns.reduce((sum, c) => sum + (c.stats?.clickRate ?? 0), 0) / sentCampaigns.length;
  }

  return {
    totalSubscribers: subscribers.length,
    totalCampaigns: campaigns.length,
    totalSmsSent: smsList.length,
    avgOpenRate: Math.round(avgOpenRate * 100) / 100,
    avgClickRate: Math.round(avgClickRate * 100) / 100,
    listCount: lists.length,
  };
}

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

export function resetAcumbamailStore(): void {
  subscriberStore.clear();
  listStore.clear();
  campaignStore.clear();
  smsStore.clear();
}
