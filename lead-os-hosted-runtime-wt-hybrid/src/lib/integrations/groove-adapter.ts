import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// GrooveMail Types
// ---------------------------------------------------------------------------

export interface GrooveMailConfig {
  apiKey: string;
  baseUrl: string;
  listId?: string;
}

export interface GrooveMailContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  listId: string;
  subscribedAt: string;
}

export interface GrooveMailCampaign {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromName: string;
  fromEmail: string;
  listId: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GrooveMailSequence {
  id: string;
  tenantId: string;
  name: string;
  steps: GrooveMailSequenceStep[];
  status: "active" | "paused" | "draft";
  enrolledCount: number;
  createdAt: string;
}

export interface GrooveMailSequenceStep {
  id: string;
  delayHours: number;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface GrooveMailEnrollment {
  id: string;
  sequenceId: string;
  contactEmail: string;
  currentStep: number;
  status: "active" | "completed" | "paused" | "bounced";
  enrolledAt: string;
  lastStepAt?: string;
}

// ---------------------------------------------------------------------------
// GrooveAffiliate Types
// ---------------------------------------------------------------------------

export interface GrooveAffiliateConfig {
  apiKey: string;
  baseUrl: string;
  programId?: string;
}

export interface AffiliateProgram {
  id: string;
  tenantId: string;
  name: string;
  commissionType: "percentage" | "fixed";
  commissionRate: number;
  cookieDuration: number;
  payoutMinimum: number;
  active: boolean;
  affiliateCount: number;
  createdAt: string;
}

export interface Affiliate {
  id: string;
  programId: string;
  email: string;
  name: string;
  status: "pending" | "approved" | "suspended";
  referralCode: string;
  trackingUrl: string;
  stats: {
    clicks: number;
    signups: number;
    conversions: number;
    totalCommission: number;
    pendingPayout: number;
  };
  joinedAt: string;
}

export interface AffiliateConversion {
  id: string;
  affiliateId: string;
  programId: string;
  tenantId: string;
  orderId?: string;
  amount: number;
  commission: number;
  status: "pending" | "approved" | "paid" | "rejected";
  convertedAt: string;
}

export interface AffiliatePayoutSummary {
  affiliateId: string;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
  conversionCount: number;
}

// ---------------------------------------------------------------------------
// Shared adapter instances & in-memory stores
// ---------------------------------------------------------------------------

const mailAdapter = new BaseAdapter("GrooveMail", "GROOVE", "https://api.groove.cm/v1");
const affiliateAdapter = new BaseAdapter("GrooveAffiliate", "GROOVE_AFFILIATE", "https://api.groove.cm/v1");

const contactStore = new Map<string, GrooveMailContact>();
const campaignStore = new Map<string, GrooveMailCampaign>();
const sequenceStore = new Map<string, GrooveMailSequence>();
const enrollmentStore = new Map<string, GrooveMailEnrollment[]>();
const transactionalStore = new Map<string, Record<string, unknown>>();

const programStore = new Map<string, AffiliateProgram>();
const affiliateStore = new Map<string, Affiliate>();
const conversionStore = new Map<string, AffiliateConversion>();

export function resetGrooveStores(): void {
  contactStore.clear();
  campaignStore.clear();
  sequenceStore.clear();
  enrollmentStore.clear();
  transactionalStore.clear();
  programStore.clear();
  affiliateStore.clear();
  conversionStore.clear();
  mailAdapter.resetStore();
  affiliateAdapter.resetStore();
}

// ---------------------------------------------------------------------------
// GrooveMail — Config & Dry-run
// ---------------------------------------------------------------------------

export function getGrooveMailConfig(): GrooveMailConfig {
  return {
    apiKey: process.env.GROOVE_API_KEY ?? "",
    baseUrl: process.env.GROOVE_BASE_URL ?? "https://api.groove.cm/v1",
    listId: process.env.GROOVE_LIST_ID,
  };
}

export function isGrooveMailDryRun(): boolean {
  const apiKey = process.env.GROOVE_API_KEY ?? "";
  const liveSendsEnabled = process.env.LEAD_OS_ENABLE_LIVE_SENDS;
  return !apiKey || liveSendsEnabled === "false";
}

// ---------------------------------------------------------------------------
// GrooveMail — Health Check
// ---------------------------------------------------------------------------

export async function grooveMailHealthCheck(): Promise<{ ok: boolean; message: string }> {
  const cfg = getGrooveMailConfig();
  if (!cfg.apiKey) {
    return { ok: true, message: "GrooveMail dry-run mode (no API key configured)" };
  }
  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok
      ? { ok: true, message: "GrooveMail connection verified" }
      : { ok: false, message: `GrooveMail returned ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "GrooveMail connection failed",
    };
  }
}

// ---------------------------------------------------------------------------
// GrooveMail — Contacts
// ---------------------------------------------------------------------------

export async function addContact(
  email: string,
  firstName?: string,
  lastName?: string,
  tags?: string[],
  listId?: string,
): Promise<GrooveMailContact> {
  const cfg = getGrooveMailConfig();
  const resolvedListId = listId ?? cfg.listId ?? "default";
  const contactKey = `${email}:${resolvedListId}`;

  if (isGrooveMailDryRun()) {
    const existing = contactStore.get(contactKey);
    const contact: GrooveMailContact = {
      id: existing?.id ?? `contact-${randomUUID()}`,
      email,
      firstName,
      lastName,
      tags: tags ?? existing?.tags ?? [],
      listId: resolvedListId,
      subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
    };
    contactStore.set(contactKey, contact);
    return contact;
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ email, firstName, lastName, tags, listId: resolvedListId }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const data = (await res.json()) as { contact?: GrooveMailContact };
      const contact = data.contact ?? {
        id: `contact-${randomUUID()}`,
        email,
        firstName,
        lastName,
        tags: tags ?? [],
        listId: resolvedListId,
        subscribedAt: new Date().toISOString(),
      };
      contactStore.set(contactKey, contact);
      return contact;
    }
  } catch {
    // fall through to local store on error
  }

  const contact: GrooveMailContact = {
    id: `contact-${randomUUID()}`,
    email,
    firstName,
    lastName,
    tags: tags ?? [],
    listId: resolvedListId,
    subscribedAt: new Date().toISOString(),
  };
  contactStore.set(contactKey, contact);
  return contact;
}

export async function removeContact(email: string, listId?: string): Promise<boolean> {
  const cfg = getGrooveMailConfig();
  const resolvedListId = listId ?? cfg.listId ?? "default";
  const contactKey = `${email}:${resolvedListId}`;

  contactStore.delete(contactKey);

  if (isGrooveMailDryRun()) {
    return true;
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/contacts/unsubscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ email, listId: resolvedListId }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function addTagToContact(email: string, tag: string): Promise<boolean> {
  // Update local store first
  for (const [key, contact] of contactStore.entries()) {
    if (contact.email === email) {
      if (!contact.tags.includes(tag)) {
        contact.tags.push(tag);
        contactStore.set(key, contact);
      }
    }
  }

  if (isGrooveMailDryRun()) {
    return true;
  }

  const cfg = getGrooveMailConfig();
  try {
    const res = await fetch(`${cfg.baseUrl}/contacts/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ email, tag }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// GrooveMail — Campaigns
// ---------------------------------------------------------------------------

export async function createCampaign(
  tenantId: string,
  name: string,
  subject: string,
  htmlBody: string,
  options?: {
    textBody?: string;
    fromName?: string;
    fromEmail?: string;
    listId?: string;
  },
): Promise<GrooveMailCampaign> {
  const cfg = getGrooveMailConfig();
  const now = new Date().toISOString();
  const campaign: GrooveMailCampaign = {
    id: `camp-${randomUUID()}`,
    tenantId,
    name,
    subject,
    htmlBody,
    textBody: options?.textBody,
    fromName: options?.fromName ?? "CX React",
    fromEmail: options?.fromEmail ?? (process.env.LEAD_OS_FROM_EMAIL ?? "noreply@example.com"),
    listId: options?.listId ?? cfg.listId ?? "default",
    status: "draft",
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
    createdAt: now,
    updatedAt: now,
  };

  campaignStore.set(campaign.id, campaign);

  if (!isGrooveMailDryRun()) {
    try {
      const res = await fetch(`${cfg.baseUrl}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(campaign),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { campaign?: { id?: string } };
        if (data.campaign?.id) {
          const updated = { ...campaign, id: data.campaign.id };
          campaignStore.delete(campaign.id);
          campaignStore.set(updated.id, updated);
          return updated;
        }
      }
    } catch {
      // local store fallback already populated
    }
  }

  return campaign;
}

export async function sendCampaign(campaignId: string): Promise<GrooveMailCampaign> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const sent: GrooveMailCampaign = {
    ...campaign,
    status: "sent",
    sentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  campaignStore.set(campaignId, sent);

  if (!isGrooveMailDryRun()) {
    const cfg = getGrooveMailConfig();
    try {
      await fetch(`${cfg.baseUrl}/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local state already updated
    }
  }

  return sent;
}

export async function getCampaignStats(
  campaignId: string,
): Promise<GrooveMailCampaign["stats"] | null> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) return null;

  if (!isGrooveMailDryRun()) {
    const cfg = getGrooveMailConfig();
    try {
      const res = await fetch(`${cfg.baseUrl}/campaigns/${campaignId}/stats`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { stats?: GrooveMailCampaign["stats"] };
        if (data.stats) {
          const updated = { ...campaign, stats: data.stats, updatedAt: new Date().toISOString() };
          campaignStore.set(campaignId, updated);
          return data.stats;
        }
      }
    } catch {
      // return local stats
    }
  }

  return campaign.stats;
}

export async function listCampaigns(tenantId: string): Promise<GrooveMailCampaign[]> {
  return [...campaignStore.values()].filter((c) => c.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// GrooveMail — Sequences
// ---------------------------------------------------------------------------

export async function createSequence(
  tenantId: string,
  name: string,
  steps: Omit<GrooveMailSequenceStep, "id">[],
): Promise<GrooveMailSequence> {
  const now = new Date().toISOString();
  const sequence: GrooveMailSequence = {
    id: `seq-${randomUUID()}`,
    tenantId,
    name,
    steps: steps.map((s) => ({ ...s, id: `step-${randomUUID()}` })),
    status: "active",
    enrolledCount: 0,
    createdAt: now,
  };

  sequenceStore.set(sequence.id, sequence);

  if (!isGrooveMailDryRun()) {
    const cfg = getGrooveMailConfig();
    try {
      await fetch(`${cfg.baseUrl}/sequences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(sequence),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return sequence;
}

export async function enrollInSequence(
  sequenceId: string,
  email: string,
): Promise<GrooveMailEnrollment> {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) throw new Error(`Sequence not found: ${sequenceId}`);

  const enrollment: GrooveMailEnrollment = {
    id: `enroll-${randomUUID()}`,
    sequenceId,
    contactEmail: email,
    currentStep: 0,
    status: "active",
    enrolledAt: new Date().toISOString(),
  };

  const existing = enrollmentStore.get(sequenceId) ?? [];
  existing.push(enrollment);
  enrollmentStore.set(sequenceId, existing);

  const updatedSequence = { ...sequence, enrolledCount: sequence.enrolledCount + 1 };
  sequenceStore.set(sequenceId, updatedSequence);

  if (!isGrooveMailDryRun()) {
    const cfg = getGrooveMailConfig();
    try {
      await fetch(`${cfg.baseUrl}/sequences/${sequenceId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return enrollment;
}

export async function pauseSequence(sequenceId: string): Promise<GrooveMailSequence> {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) throw new Error(`Sequence not found: ${sequenceId}`);

  const paused = { ...sequence, status: "paused" as const };
  sequenceStore.set(sequenceId, paused);

  if (!isGrooveMailDryRun()) {
    const cfg = getGrooveMailConfig();
    try {
      await fetch(`${cfg.baseUrl}/sequences/${sequenceId}/pause`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local state already updated
    }
  }

  return paused;
}

export async function listSequences(tenantId: string): Promise<GrooveMailSequence[]> {
  return [...sequenceStore.values()].filter((s) => s.tenantId === tenantId);
}

export async function listEnrollments(sequenceId: string): Promise<GrooveMailEnrollment[]> {
  return enrollmentStore.get(sequenceId) ?? [];
}

// ---------------------------------------------------------------------------
// GrooveMail — Transactional Email
// ---------------------------------------------------------------------------

export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  fromName?: string,
  fromEmail?: string,
): Promise<{ ok: boolean; messageId: string; mode: "live" | "dry-run" }> {
  const messageId = `msg-${randomUUID()}`;

  if (isGrooveMailDryRun()) {
    transactionalStore.set(messageId, {
      to,
      subject,
      htmlBody,
      textBody,
      fromName,
      fromEmail,
      sentAt: new Date().toISOString(),
    });
    return { ok: true, messageId, mode: "dry-run" };
  }

  const cfg = getGrooveMailConfig();
  try {
    const res = await fetch(`${cfg.baseUrl}/emails/transactional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        htmlBody,
        textBody,
        fromName: fromName ?? "CX React",
        fromEmail: fromEmail ?? (process.env.LEAD_OS_FROM_EMAIL ?? "noreply@example.com"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const data = (await res.json()) as { messageId?: string };
      return { ok: true, messageId: data.messageId ?? messageId, mode: "live" };
    }
    return { ok: false, messageId, mode: "live" };
  } catch {
    // fall back to dry-run on error
    transactionalStore.set(messageId, {
      to,
      subject,
      htmlBody,
      textBody,
      fromName,
      fromEmail,
      sentAt: new Date().toISOString(),
    });
    return { ok: true, messageId, mode: "dry-run" };
  }
}

// ---------------------------------------------------------------------------
// GrooveMail — Provider bridge (used by providers.ts sendEmailAction)
// ---------------------------------------------------------------------------

export async function sendEmailViaGroove(payload: {
  email: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<ProviderResult> {
  if (isGrooveMailDryRun()) {
    const messageId = `msg-${randomUUID()}`;
    transactionalStore.set(messageId, {
      to: payload.email,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      sentAt: new Date().toISOString(),
    });
    return {
      ok: true,
      provider: "Groove",
      mode: "dry-run",
      detail: "Email prepared (Groove dry-run)",
      payload: { to: payload.email, subject: payload.subject },
    };
  }

  const result = await sendTransactionalEmail(
    payload.email,
    payload.subject,
    payload.htmlBody,
    payload.textBody,
  );

  return {
    ok: result.ok,
    provider: "Groove",
    mode: result.mode,
    detail: result.ok ? "Email sent via Groove" : "Groove email send failed",
    payload: { to: payload.email, messageId: result.messageId },
  };
}

// ---------------------------------------------------------------------------
// GrooveAffiliate — Config & Dry-run
// ---------------------------------------------------------------------------

export function getGrooveAffiliateConfig(): GrooveAffiliateConfig {
  return {
    apiKey: process.env.GROOVE_AFFILIATE_API_KEY ?? process.env.GROOVE_API_KEY ?? "",
    baseUrl: process.env.GROOVE_AFFILIATE_BASE_URL ?? "https://api.groove.cm/v1",
    programId: process.env.GROOVE_AFFILIATE_PROGRAM_ID,
  };
}

export function isGrooveAffiliateDryRun(): boolean {
  const cfg = getGrooveAffiliateConfig();
  return !cfg.apiKey;
}

// ---------------------------------------------------------------------------
// GrooveAffiliate — Programs
// ---------------------------------------------------------------------------

export async function createAffiliateProgram(
  tenantId: string,
  name: string,
  commissionType: "percentage" | "fixed",
  commissionRate: number,
  options?: {
    cookieDuration?: number;
    payoutMinimum?: number;
  },
): Promise<AffiliateProgram> {
  const now = new Date().toISOString();
  const program: AffiliateProgram = {
    id: `prog-${randomUUID()}`,
    tenantId,
    name,
    commissionType,
    commissionRate,
    cookieDuration: options?.cookieDuration ?? 30,
    payoutMinimum: options?.payoutMinimum ?? 50,
    active: true,
    affiliateCount: 0,
    createdAt: now,
  };

  programStore.set(program.id, program);

  if (!isGrooveAffiliateDryRun()) {
    const cfg = getGrooveAffiliateConfig();
    try {
      await fetch(`${cfg.baseUrl}/affiliate/programs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(program),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return program;
}

export async function getAffiliateProgram(programId: string): Promise<AffiliateProgram | undefined> {
  return programStore.get(programId);
}

export async function listAffiliatePrograms(tenantId: string): Promise<AffiliateProgram[]> {
  return [...programStore.values()].filter((p) => p.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// GrooveAffiliate — Affiliates
// ---------------------------------------------------------------------------

export async function registerAffiliate(
  programId: string,
  email: string,
  name: string,
): Promise<Affiliate> {
  const program = programStore.get(programId);
  if (!program) throw new Error(`Affiliate program not found: ${programId}`);

  const referralCode = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const cfg = getGrooveAffiliateConfig();
  const baseUrl = cfg.baseUrl.replace("/v1", "");
  const trackingUrl = `${baseUrl}/ref/${referralCode}`;

  const affiliate: Affiliate = {
    id: `aff-${randomUUID()}`,
    programId,
    email,
    name,
    status: "pending",
    referralCode,
    trackingUrl,
    stats: {
      clicks: 0,
      signups: 0,
      conversions: 0,
      totalCommission: 0,
      pendingPayout: 0,
    },
    joinedAt: new Date().toISOString(),
  };

  affiliateStore.set(affiliate.id, affiliate);

  const updatedProgram = { ...program, affiliateCount: program.affiliateCount + 1 };
  programStore.set(programId, updatedProgram);

  if (!isGrooveAffiliateDryRun()) {
    try {
      await fetch(`${cfg.baseUrl}/affiliate/programs/${programId}/affiliates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({ email, name }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return affiliate;
}

export async function getAffiliate(affiliateId: string): Promise<Affiliate | undefined> {
  return affiliateStore.get(affiliateId);
}

export async function listAffiliates(programId: string): Promise<Affiliate[]> {
  return [...affiliateStore.values()].filter((a) => a.programId === programId);
}

// ---------------------------------------------------------------------------
// GrooveAffiliate — Conversions
// ---------------------------------------------------------------------------

export async function recordConversion(
  affiliateId: string,
  amount: number,
  orderId?: string,
): Promise<AffiliateConversion> {
  const affiliate = affiliateStore.get(affiliateId);
  if (!affiliate) throw new Error(`Affiliate not found: ${affiliateId}`);

  const program = programStore.get(affiliate.programId);
  if (!program) throw new Error(`Program not found: ${affiliate.programId}`);

  const commission =
    program.commissionType === "percentage"
      ? (amount * program.commissionRate) / 100
      : program.commissionRate;

  const conversion: AffiliateConversion = {
    id: `conv-${randomUUID()}`,
    affiliateId,
    programId: affiliate.programId,
    tenantId: program.tenantId,
    orderId,
    amount,
    commission,
    status: "pending",
    convertedAt: new Date().toISOString(),
  };

  conversionStore.set(conversion.id, conversion);

  // Update affiliate stats
  const updatedAffiliate: Affiliate = {
    ...affiliate,
    stats: {
      ...affiliate.stats,
      conversions: affiliate.stats.conversions + 1,
      totalCommission: affiliate.stats.totalCommission + commission,
      pendingPayout: affiliate.stats.pendingPayout + commission,
    },
  };
  affiliateStore.set(affiliateId, updatedAffiliate);

  if (!isGrooveAffiliateDryRun()) {
    const cfg = getGrooveAffiliateConfig();
    try {
      await fetch(`${cfg.baseUrl}/affiliate/conversions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(conversion),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return conversion;
}

export async function getConversions(
  affiliateId: string,
  since?: string,
): Promise<AffiliateConversion[]> {
  const all = [...conversionStore.values()].filter((c) => c.affiliateId === affiliateId);
  if (!since) return all;
  const sinceDate = new Date(since).getTime();
  return all.filter((c) => new Date(c.convertedAt).getTime() >= sinceDate);
}

export async function getPayoutSummary(affiliateId: string): Promise<AffiliatePayoutSummary> {
  const conversions = [...conversionStore.values()].filter((c) => c.affiliateId === affiliateId);

  const totalEarned = conversions.reduce((sum, c) => sum + c.commission, 0);
  const totalPaid = conversions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.commission, 0);
  const pendingPayout = conversions
    .filter((c) => c.status === "approved" || c.status === "pending")
    .reduce((sum, c) => sum + c.commission, 0);

  return {
    affiliateId,
    totalEarned,
    totalPaid,
    pendingPayout,
    conversionCount: conversions.length,
  };
}

export async function approveConversion(conversionId: string): Promise<AffiliateConversion> {
  const conversion = conversionStore.get(conversionId);
  if (!conversion) throw new Error(`Conversion not found: ${conversionId}`);

  const approved = { ...conversion, status: "approved" as const };
  conversionStore.set(conversionId, approved);

  if (!isGrooveAffiliateDryRun()) {
    const cfg = getGrooveAffiliateConfig();
    try {
      await fetch(`${cfg.baseUrl}/affiliate/conversions/${conversionId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local state already updated
    }
  }

  return approved;
}

export async function markConversionPaid(conversionId: string): Promise<AffiliateConversion> {
  const conversion = conversionStore.get(conversionId);
  if (!conversion) throw new Error(`Conversion not found: ${conversionId}`);

  const paid = { ...conversion, status: "paid" as const };
  conversionStore.set(conversionId, paid);

  // Update affiliate pending payout
  const affiliate = affiliateStore.get(conversion.affiliateId);
  if (affiliate) {
    const updatedAffiliate: Affiliate = {
      ...affiliate,
      stats: {
        ...affiliate.stats,
        pendingPayout: Math.max(0, affiliate.stats.pendingPayout - conversion.commission),
      },
    };
    affiliateStore.set(conversion.affiliateId, updatedAffiliate);
  }

  if (!isGrooveAffiliateDryRun()) {
    const cfg = getGrooveAffiliateConfig();
    try {
      await fetch(`${cfg.baseUrl}/affiliate/conversions/${conversionId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local state already updated
    }
  }

  return paid;
}

// ---------------------------------------------------------------------------
// GrooveAffiliate — Signup URL
// ---------------------------------------------------------------------------

export function generateAffiliateSignupUrl(programId: string): string {
  const cfg = getGrooveAffiliateConfig();
  const baseUrl = cfg.baseUrl.replace("/v1", "");
  return `${baseUrl}/affiliate/signup?programId=${programId}`;
}
