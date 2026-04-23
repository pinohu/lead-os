import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EasyTextConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SmsMessage {
  id: string;
  tenantId: string;
  to: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "failed";
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface SmsCampaign {
  id: string;
  tenantId: string;
  name: string;
  body: string;
  recipients: string[];
  status: "draft" | "sending" | "sent" | "failed";
  stats: SmsStats;
  createdAt: string;
  updatedAt: string;
}

export interface SmsStats {
  sent: number;
  delivered: number;
  failed: number;
  optedOut: number;
}

export interface SmsSequence {
  id: string;
  tenantId: string;
  name: string;
  trigger: "lead-event" | "score-change" | "manual";
  steps: SmsSequenceStep[];
  active: boolean;
  createdAt: string;
}

export interface SmsSequenceStep {
  id: string;
  delayMinutes: number;
  body: string;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Easy Text Marketing", "EASY_TEXT", "https://api.easytextmarketing.com/v1");

const messageStore = new Map<string, SmsMessage>();
const campaignStore = new Map<string, SmsCampaign>();
const sequenceStore = new Map<string, SmsSequence>();

export function resetEasyTextStore(): void {
  messageStore.clear();
  campaignStore.clear();
  sequenceStore.clear();
  adapter.resetStore();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: EasyTextConfig): Promise<{ ok: boolean; message: string }> {
  return adapter.healthCheck(config);
}

// ---------------------------------------------------------------------------
// Single SMS
// ---------------------------------------------------------------------------

export async function sendSms(
  tenantId: string,
  to: string,
  body: string,
): Promise<SmsMessage> {
  const now = new Date().toISOString();
  const message: SmsMessage = {
    id: `sms-${randomUUID()}`,
    tenantId,
    to,
    body,
    status: "delivered",
    sentAt: now,
    deliveredAt: now,
    createdAt: now,
  };
  messageStore.set(message.id, message);
  return message;
}

export async function getMessage(messageId: string): Promise<SmsMessage | undefined> {
  return messageStore.get(messageId);
}

export async function listMessages(tenantId: string): Promise<SmsMessage[]> {
  return [...messageStore.values()].filter((m) => m.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// SMS Campaign
// ---------------------------------------------------------------------------

export async function createCampaign(
  tenantId: string,
  name: string,
  body: string,
  recipients: string[],
): Promise<SmsCampaign> {
  const now = new Date().toISOString();
  const campaign: SmsCampaign = {
    id: `smscamp-${randomUUID()}`,
    tenantId,
    name,
    body,
    recipients,
    status: "draft",
    stats: { sent: 0, delivered: 0, failed: 0, optedOut: 0 },
    createdAt: now,
    updatedAt: now,
  };
  campaignStore.set(campaign.id, campaign);
  return campaign;
}

export async function sendCampaign(campaignId: string): Promise<SmsCampaign> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) throw new Error(`SMS campaign not found: ${campaignId}`);

  const sent: SmsCampaign = {
    ...campaign,
    status: "sent",
    stats: {
      sent: campaign.recipients.length,
      delivered: campaign.recipients.length,
      failed: 0,
      optedOut: 0,
    },
    updatedAt: new Date().toISOString(),
  };
  campaignStore.set(campaignId, sent);
  return sent;
}

export async function getCampaign(campaignId: string): Promise<SmsCampaign | undefined> {
  return campaignStore.get(campaignId);
}

export async function listCampaigns(tenantId: string): Promise<SmsCampaign[]> {
  return [...campaignStore.values()].filter((c) => c.tenantId === tenantId);
}

export async function deleteCampaign(campaignId: string): Promise<boolean> {
  return campaignStore.delete(campaignId);
}

// ---------------------------------------------------------------------------
// SMS Sequence
// ---------------------------------------------------------------------------

export async function createSequence(
  tenantId: string,
  name: string,
  trigger: SmsSequence["trigger"],
  steps: Omit<SmsSequenceStep, "id">[],
): Promise<SmsSequence> {
  const sequence: SmsSequence = {
    id: `smseq-${randomUUID()}`,
    tenantId,
    name,
    trigger,
    steps: steps.map((s) => ({ ...s, id: `smstep-${randomUUID()}` })),
    active: true,
    createdAt: new Date().toISOString(),
  };
  sequenceStore.set(sequence.id, sequence);
  return sequence;
}

export async function getSequence(sequenceId: string): Promise<SmsSequence | undefined> {
  return sequenceStore.get(sequenceId);
}

export async function listSequences(tenantId: string): Promise<SmsSequence[]> {
  return [...sequenceStore.values()].filter((s) => s.tenantId === tenantId);
}
