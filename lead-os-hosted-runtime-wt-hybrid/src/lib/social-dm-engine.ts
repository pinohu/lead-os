import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DMStage = "acknowledge" | "value" | "qualify" | "offer";
export type DMStatus = "sent" | "opened" | "replied" | "qualified" | "converted" | "dropped";
export type EngagementType = "comment" | "like" | "share" | "save" | "follow" | "dm";

export interface DMMessage {
  stage: DMStage;
  content: string;
  delayMinutes: number;
}

export interface DMSequence {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  platform: string;
  engagementType: EngagementType;
  sourceContentId: string;
  messages: DMMessage[];
  currentStage: DMStage;
  status: DMStatus;
  triggeredAt: string;
  lastUpdatedAt: string;
}

export interface DMFunnelMetrics {
  tenantId: string;
  sent: number;
  opened: number;
  replied: number;
  qualified: number;
  converted: number;
  dropped: number;
  openRate: number;
  replyRate: number;
  qualificationRate: number;
  conversionRate: number;
}

export interface DMTriggerConfig {
  tenantId: string;
  userId: string;
  userName: string;
  platform: string;
  engagementType: EngagementType;
  sourceContentId: string;
  niche?: string;
  topic?: string;
}

// ---------------------------------------------------------------------------
// DM sequence templates
// ---------------------------------------------------------------------------

interface SequenceTemplate {
  acknowledge: string;
  value: string;
  qualify: string;
  offer: string;
}

const NICHE_SEQUENCES: Record<string, SequenceTemplate> = {
  "pest-control": {
    acknowledge: "Hey {userName}! Thanks for engaging with our post about pest control. Dealing with pests is no joke - we get it.",
    value: "Quick tip: most DIY pest treatments only address symptoms, not the root cause. The #1 thing pros do differently is identify entry points first. Want our free home inspection checklist?",
    qualify: "Just curious - are you dealing with a specific pest issue right now, or more of a prevention mindset? Either way, we can help point you in the right direction.",
    offer: "Based on what you've shared, I think our free pest assessment would be perfect for you. It takes 5 minutes and gives you a custom action plan. Want me to send the link?",
  },
  "real-estate": {
    acknowledge: "Hey {userName}! Glad our real estate content caught your eye. The market is wild right now, isn't it?",
    value: "Here's something most agents won't tell you: the best deals right now are in {topic} properties that have been sitting 60+ days. Want our off-market deal finder guide?",
    qualify: "Quick question - are you looking to buy, sell, or invest? And what's your timeline looking like?",
    offer: "Perfect! We have a free market analysis that shows you exactly where the opportunities are in your area. Takes 2 minutes to set up. Want me to send it over?",
  },
  "dental": {
    acknowledge: "Hey {userName}! Thanks for the engagement on our dental health post. Taking care of your smile is so important!",
    value: "Fun fact: 80% of adults have some form of gum disease and don't know it. The good news? It's reversible in early stages. Want our free oral health self-check guide?",
    qualify: "Just curious - is there a specific dental concern you're looking into, or are you more interested in preventive care? We help with both!",
    offer: "Great news - we're offering a complimentary smile assessment this month. It includes a full evaluation and personalized care plan. Want me to reserve a spot for you?",
  },
};

const DEFAULT_SEQUENCE: SequenceTemplate = {
  acknowledge: "Hey {userName}! Thanks for engaging with our content. Glad it resonated with you!",
  value: "Here's a bonus tip related to what you saw: most people in the industry miss this one key thing. Want our free guide that breaks it all down?",
  qualify: "Quick question - what's your biggest challenge right now with {topic}? I might be able to point you in the right direction.",
  offer: "Based on our conversation, I think our free consultation would be really valuable for you. It's a no-pressure 15-minute call where we map out a plan. Interested?",
};

function getSequenceTemplate(niche: string): SequenceTemplate {
  const normalized = niche.toLowerCase().replace(/\s+/g, "-");
  return NICHE_SEQUENCES[normalized] ?? DEFAULT_SEQUENCE;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const sequenceStore = new Map<string, DMSequence[]>();

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

function buildMessages(template: SequenceTemplate, userName: string, topic: string): DMMessage[] {
  const interpolate = (text: string): string =>
    text.replace(/\{userName\}/g, userName).replace(/\{topic\}/g, topic);

  return [
    { stage: "acknowledge" as DMStage, content: interpolate(template.acknowledge), delayMinutes: 5 },
    { stage: "value" as DMStage, content: interpolate(template.value), delayMinutes: 60 },
    { stage: "qualify" as DMStage, content: interpolate(template.qualify), delayMinutes: 1440 },
    { stage: "offer" as DMStage, content: interpolate(template.offer), delayMinutes: 2880 },
  ];
}

export function triggerDMSequence(config: DMTriggerConfig): DMSequence {
  const { tenantId, userId, userName, platform, engagementType, sourceContentId, niche = "default", topic = "your area of interest" } = config;

  const existing = sequenceStore.get(tenantId) ?? [];
  const alreadyActive = existing.find(
    (s) => s.userId === userId && s.platform === platform && (s.status === "sent" || s.status === "opened"),
  );

  if (alreadyActive) {
    return alreadyActive;
  }

  const template = getSequenceTemplate(niche);
  const messages = buildMessages(template, userName, topic);
  const now = new Date().toISOString();

  const sequence: DMSequence = {
    id: crypto.randomUUID(),
    tenantId,
    userId,
    userName,
    platform,
    engagementType,
    sourceContentId,
    messages,
    currentStage: "acknowledge",
    status: "sent",
    triggeredAt: now,
    lastUpdatedAt: now,
  };

  existing.push(sequence);
  sequenceStore.set(tenantId, existing);

  return sequence;
}

export function advanceSequence(
  tenantId: string,
  sequenceId: string,
  newStatus: DMStatus,
): DMSequence | undefined {
  const sequences = sequenceStore.get(tenantId) ?? [];
  const idx = sequences.findIndex((s) => s.id === sequenceId);
  if (idx === -1) return undefined;

  const stageOrder: DMStage[] = ["acknowledge", "value", "qualify", "offer"];
  const currentStageIdx = stageOrder.indexOf(sequences[idx].currentStage);
  const nextStage = currentStageIdx < stageOrder.length - 1
    ? stageOrder[currentStageIdx + 1]
    : sequences[idx].currentStage;

  sequences[idx] = {
    ...sequences[idx],
    status: newStatus,
    currentStage: newStatus === "dropped" ? sequences[idx].currentStage : nextStage,
    lastUpdatedAt: new Date().toISOString(),
  };

  return sequences[idx];
}

export function updateSequenceStatus(
  tenantId: string,
  sequenceId: string,
  status: DMStatus,
): DMSequence | undefined {
  const sequences = sequenceStore.get(tenantId) ?? [];
  const idx = sequences.findIndex((s) => s.id === sequenceId);
  if (idx === -1) return undefined;

  sequences[idx] = {
    ...sequences[idx],
    status,
    lastUpdatedAt: new Date().toISOString(),
  };

  return sequences[idx];
}

export function getSequences(tenantId: string): DMSequence[] {
  return sequenceStore.get(tenantId) ?? [];
}

export function getSequencesByPlatform(tenantId: string, platform: string): DMSequence[] {
  const sequences = sequenceStore.get(tenantId) ?? [];
  return sequences.filter((s) => s.platform === platform);
}

export function getActiveSequences(tenantId: string): DMSequence[] {
  const sequences = sequenceStore.get(tenantId) ?? [];
  return sequences.filter((s) => s.status !== "converted" && s.status !== "dropped");
}

// ---------------------------------------------------------------------------
// Funnel metrics
// ---------------------------------------------------------------------------

export function getDMFunnelMetrics(tenantId: string): DMFunnelMetrics {
  const sequences = sequenceStore.get(tenantId) ?? [];
  const total = sequences.length;

  const statusCounts: Record<DMStatus, number> = {
    sent: 0,
    opened: 0,
    replied: 0,
    qualified: 0,
    converted: 0,
    dropped: 0,
  };

  for (const seq of sequences) {
    statusCounts[seq.status] += 1;
  }

  const openedPlus = statusCounts.opened + statusCounts.replied + statusCounts.qualified + statusCounts.converted;
  const repliedPlus = statusCounts.replied + statusCounts.qualified + statusCounts.converted;
  const qualifiedPlus = statusCounts.qualified + statusCounts.converted;

  return {
    tenantId,
    sent: total,
    opened: openedPlus,
    replied: repliedPlus,
    qualified: qualifiedPlus,
    converted: statusCounts.converted,
    dropped: statusCounts.dropped,
    openRate: total > 0 ? Number((openedPlus / total).toFixed(4)) : 0,
    replyRate: total > 0 ? Number((repliedPlus / total).toFixed(4)) : 0,
    qualificationRate: total > 0 ? Number((qualifiedPlus / total).toFixed(4)) : 0,
    conversionRate: total > 0 ? Number((statusCounts.converted / total).toFixed(4)) : 0,
  };
}

export function _resetStores(): void {
  sequenceStore.clear();
}
