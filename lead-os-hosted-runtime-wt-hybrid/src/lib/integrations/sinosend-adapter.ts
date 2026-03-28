import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SinosendConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface EmailCampaign {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface EmailSequence {
  id: string;
  tenantId: string;
  name: string;
  trigger: "lead-score-change" | "new-lead" | "tag-added" | "manual";
  steps: SequenceStep[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  delayHours: number;
  subject: string;
  htmlBody: string;
  condition?: string;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  email: string;
  currentStep: number;
  status: "active" | "completed" | "paused" | "unsubscribed";
  enrolledAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const campaignStore = new Map<string, EmailCampaign>();
const sequenceStore = new Map<string, EmailSequence>();
const enrollmentStore = new Map<string, SequenceEnrollment[]>();

export function resetSinosendStore(): void {
  campaignStore.clear();
  sequenceStore.clear();
  enrollmentStore.clear();
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: SinosendConfig): SinosendConfig {
  return {
    apiKey: config?.apiKey ?? process.env.SINOSEND_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.SINOSEND_BASE_URL ?? "https://api.sinosend.com/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: SinosendConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Sinosend API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "Sinosend connection verified" }
      : { ok: false, message: `Sinosend returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function createCampaign(
  tenantId: string,
  name: string,
  subject: string,
  htmlBody: string,
  recipients: string[],
): Promise<EmailCampaign> {
  const now = new Date().toISOString();
  const campaign: EmailCampaign = {
    id: `camp-${randomUUID()}`,
    tenantId,
    name,
    subject,
    htmlBody,
    recipients,
    status: "draft",
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
    createdAt: now,
    updatedAt: now,
  };
  campaignStore.set(campaign.id, campaign);
  return campaign;
}

export async function getCampaign(campaignId: string): Promise<EmailCampaign | undefined> {
  return campaignStore.get(campaignId);
}

export async function listCampaigns(tenantId: string): Promise<EmailCampaign[]> {
  return [...campaignStore.values()].filter((c) => c.tenantId === tenantId);
}

export async function sendCampaign(campaignId: string): Promise<EmailCampaign> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const sent: EmailCampaign = {
    ...campaign,
    status: "sent",
    sentAt: new Date().toISOString(),
    stats: {
      sent: campaign.recipients.length,
      delivered: campaign.recipients.length,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    },
    updatedAt: new Date().toISOString(),
  };
  campaignStore.set(campaignId, sent);
  return sent;
}

export async function deleteCampaign(campaignId: string): Promise<boolean> {
  return campaignStore.delete(campaignId);
}

// ---------------------------------------------------------------------------
// Sequence CRUD
// ---------------------------------------------------------------------------

export async function createSequence(
  tenantId: string,
  name: string,
  trigger: EmailSequence["trigger"],
  steps: Omit<SequenceStep, "id">[],
): Promise<EmailSequence> {
  const now = new Date().toISOString();
  const sequence: EmailSequence = {
    id: `seq-${randomUUID()}`,
    tenantId,
    name,
    trigger,
    steps: steps.map((s) => ({ ...s, id: `step-${randomUUID()}` })),
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  sequenceStore.set(sequence.id, sequence);
  return sequence;
}

export async function getSequence(sequenceId: string): Promise<EmailSequence | undefined> {
  return sequenceStore.get(sequenceId);
}

export async function listSequences(tenantId: string): Promise<EmailSequence[]> {
  return [...sequenceStore.values()].filter((s) => s.tenantId === tenantId);
}

export async function deleteSequence(sequenceId: string): Promise<boolean> {
  return sequenceStore.delete(sequenceId);
}

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

export async function enrollInSequence(
  sequenceId: string,
  email: string,
): Promise<SequenceEnrollment> {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) throw new Error(`Sequence not found: ${sequenceId}`);

  const enrollment: SequenceEnrollment = {
    id: `enroll-${randomUUID()}`,
    sequenceId,
    email,
    currentStep: 0,
    status: "active",
    enrolledAt: new Date().toISOString(),
  };
  const existing = enrollmentStore.get(sequenceId) ?? [];
  existing.push(enrollment);
  enrollmentStore.set(sequenceId, existing);
  return enrollment;
}

export async function listEnrollments(sequenceId: string): Promise<SequenceEnrollment[]> {
  return enrollmentStore.get(sequenceId) ?? [];
}
