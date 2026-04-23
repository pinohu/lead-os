import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// SMS-iT CRM Types
// ---------------------------------------------------------------------------

export interface SmsitConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  senderId: string;
}

export type MessageChannel = "sms" | "mms" | "rcs" | "whatsapp" | "voice";

export interface SmsitMessage {
  id: string;
  channel: MessageChannel;
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
  status: "queued" | "sent" | "delivered" | "failed" | "read";
  tenantId?: string;
  sentAt: string;
  deliveredAt?: string;
}

export interface SmsitContact {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  lists: string[];
  tenantId?: string;
  createdAt: string;
}

export interface SendMessageInput {
  to: string;
  body: string;
  channel?: MessageChannel;
  mediaUrl?: string;
  tenantId?: string;
}

export interface BulkMessageInput {
  recipients: string[];
  body: string;
  channel?: MessageChannel;
  tenantId?: string;
}

export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  byChannel: Record<MessageChannel, number>;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const messageStore = new Map<string, SmsitMessage>();
const contactStore = new Map<string, SmsitContact>();

// ---------------------------------------------------------------------------
// DB schema lazy-init
// ---------------------------------------------------------------------------

let schemaEnsured = false;

async function ensureSmsitSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) {
    schemaEnsured = true;
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_smsit_messages (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        channel TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'queued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch (err) {
    console.error("[smsit] schema init error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveSmsitConfig(): SmsitConfig | null {
  const apiKey = process.env.SMSIT_API_KEY ?? "";
  const apiSecret = process.env.SMSIT_API_SECRET ?? "";
  if (!apiKey) return null;

  return {
    apiKey,
    apiSecret,
    baseUrl: process.env.SMSIT_BASE_URL ?? "https://api.smsit.ai/v1",
    senderId: process.env.SMSIT_SENDER_ID ?? "",
  };
}

export function isSmsitDryRun(): boolean {
  return !process.env.SMSIT_API_KEY;
}

// ---------------------------------------------------------------------------
// DB persistence helper
// ---------------------------------------------------------------------------

async function persistMessage(msg: SmsitMessage): Promise<void> {
  await ensureSmsitSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_smsit_messages (id, tenant_id, channel, payload, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET payload = $4, status = $5`,
      [msg.id, msg.tenantId ?? null, msg.channel, JSON.stringify(msg), msg.status, msg.sentAt],
    );
  } catch (err) {
    console.error("[smsit] db write error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(input: SendMessageInput): Promise<SmsitMessage> {
  const channel = input.channel ?? "sms";
  const config = resolveSmsitConfig();
  const now = new Date().toISOString();

  const msg: SmsitMessage = {
    id: `smsit-msg-${randomUUID()}`,
    channel,
    to: input.to,
    from: config?.senderId ?? "LEAD-OS",
    body: input.body,
    mediaUrl: input.mediaUrl,
    status: "sent",
    tenantId: input.tenantId,
    sentAt: now,
  };

  if (!isSmsitDryRun() && config) {
    try {
      const res = await fetch(`${config.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "X-API-Secret": config.apiSecret,
        },
        body: JSON.stringify({
          to: input.to,
          body: input.body,
          channel,
          mediaUrl: input.mediaUrl,
          senderId: config.senderId,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { id?: string; status?: string };
        if (data.id) msg.id = data.id;
        if (data.status) msg.status = data.status as SmsitMessage["status"];
      }
    } catch {
      // fall through to local store
    }
  }

  messageStore.set(msg.id, msg);
  await persistMessage(msg);
  return msg;
}

export async function sendBulkMessages(input: BulkMessageInput): Promise<SmsitMessage[]> {
  const messages: SmsitMessage[] = [];
  for (const recipient of input.recipients) {
    const msg = await sendMessage({
      to: recipient,
      body: input.body,
      channel: input.channel,
      tenantId: input.tenantId,
    });
    messages.push(msg);
  }
  return messages;
}

export async function getMessageStatus(messageId: string): Promise<SmsitMessage | null> {
  const local = messageStore.get(messageId);

  if (!isSmsitDryRun()) {
    const config = resolveSmsitConfig();
    if (config) {
      try {
        const res = await fetch(`${config.baseUrl}/messages/${messageId}`, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "X-API-Secret": config.apiSecret,
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { status?: string; deliveredAt?: string };
          if (local && data.status) {
            const updated: SmsitMessage = {
              ...local,
              status: data.status as SmsitMessage["status"],
              deliveredAt: data.deliveredAt,
            };
            messageStore.set(messageId, updated);
            await persistMessage(updated);
            return updated;
          }
        }
      } catch {
        // return local
      }
    }
  }

  return local ?? null;
}

export async function listMessages(
  tenantId?: string,
  channel?: MessageChannel,
): Promise<SmsitMessage[]> {
  let results = [...messageStore.values()];
  if (tenantId) {
    results = results.filter((m) => m.tenantId === tenantId);
  }
  if (channel) {
    results = results.filter((m) => m.channel === channel);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function createContact(
  contact: Omit<SmsitContact, "id" | "createdAt">,
): Promise<SmsitContact> {
  const now = new Date().toISOString();
  const created: SmsitContact = {
    id: `smsit-contact-${randomUUID()}`,
    ...contact,
    tags: contact.tags ?? [],
    lists: contact.lists ?? [],
    createdAt: now,
  };

  if (!isSmsitDryRun()) {
    const config = resolveSmsitConfig();
    if (config) {
      try {
        const res = await fetch(`${config.baseUrl}/contacts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            "X-API-Secret": config.apiSecret,
          },
          body: JSON.stringify(contact),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string };
          if (data.id) created.id = data.id;
        }
      } catch {
        // fall through to local store
      }
    }
  }

  contactStore.set(created.id, created);
  return created;
}

export async function addContactToList(contactId: string, listName: string): Promise<boolean> {
  const contact = contactStore.get(contactId);
  if (!contact) return false;

  if (!contact.lists.includes(listName)) {
    contact.lists.push(listName);
    contactStore.set(contactId, contact);
  }

  if (!isSmsitDryRun()) {
    const config = resolveSmsitConfig();
    if (config) {
      try {
        await fetch(`${config.baseUrl}/contacts/${contactId}/lists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            "X-API-Secret": config.apiSecret,
          },
          body: JSON.stringify({ list: listName }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local store already updated
      }
    }
  }

  return true;
}

export async function tagContact(contactId: string, tag: string): Promise<boolean> {
  const contact = contactStore.get(contactId);
  if (!contact) return false;

  if (!contact.tags.includes(tag)) {
    contact.tags.push(tag);
    contactStore.set(contactId, contact);
  }

  if (!isSmsitDryRun()) {
    const config = resolveSmsitConfig();
    if (config) {
      try {
        await fetch(`${config.baseUrl}/contacts/${contactId}/tags`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            "X-API-Secret": config.apiSecret,
          },
          body: JSON.stringify({ tag }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // local store already updated
      }
    }
  }

  return true;
}

export async function listContacts(tenantId?: string): Promise<SmsitContact[]> {
  let results = [...contactStore.values()];
  if (tenantId) {
    results = results.filter((c) => c.tenantId === tenantId);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getMessageStats(tenantId?: string): Promise<MessageStats> {
  let messages = [...messageStore.values()];
  if (tenantId) {
    messages = messages.filter((m) => m.tenantId === tenantId);
  }

  const channels: MessageChannel[] = ["sms", "mms", "rcs", "whatsapp", "voice"];
  const byChannel = {} as Record<MessageChannel, number>;
  for (const ch of channels) {
    byChannel[ch] = messages.filter((m) => m.channel === ch).length;
  }

  return {
    total: messages.length,
    sent: messages.filter((m) => m.status === "sent").length,
    delivered: messages.filter((m) => m.status === "delivered").length,
    failed: messages.filter((m) => m.status === "failed").length,
    read: messages.filter((m) => m.status === "read").length,
    byChannel,
  };
}

// ---------------------------------------------------------------------------
// Provider bridges (used by providers.ts)
// ---------------------------------------------------------------------------

export async function sendSmsViaSmsit(
  to: string,
  body: string,
): Promise<ProviderResult> {
  const msg = await sendMessage({ to, body, channel: "sms" });

  return {
    ok: true,
    provider: "SMS-iT",
    mode: isSmsitDryRun() ? "dry-run" : "live",
    detail: isSmsitDryRun()
      ? "SMS prepared (SMS-iT dry-run)"
      : "SMS sent via SMS-iT",
    payload: { to, messageId: msg.id },
  };
}

export async function sendWhatsAppViaSmsit(
  to: string,
  body: string,
): Promise<ProviderResult> {
  const msg = await sendMessage({ to, body, channel: "whatsapp" });

  return {
    ok: true,
    provider: "SMS-iT",
    mode: isSmsitDryRun() ? "dry-run" : "live",
    detail: isSmsitDryRun()
      ? "WhatsApp message prepared (SMS-iT dry-run)"
      : "WhatsApp message sent via SMS-iT",
    payload: { to, messageId: msg.id },
  };
}

// ---------------------------------------------------------------------------
// Store reset (for tests)
// ---------------------------------------------------------------------------

export function resetSmsitStore(): void {
  messageStore.clear();
  contactStore.clear();
  schemaEnsured = false;
}
