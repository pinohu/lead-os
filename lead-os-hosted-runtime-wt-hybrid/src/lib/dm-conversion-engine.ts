import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DMResponse {
  initialMessage: string;
  followUpMessages: string[];
  leadCaptureFields: string[];
  leadMagnetSlug?: string;
  bookingLink?: string;
}

export interface DMTrigger {
  id: string;
  tenantId: string;
  platform: string;
  triggerType: "comment-keyword" | "story-reply" | "post-engagement" | "direct-message";
  keywords: string[];
  response: DMResponse;
  funnelTarget: string;
  active: boolean;
}

export interface DMMessage {
  role: "bot" | "user";
  text: string;
  timestamp: string;
}

export interface DMConversation {
  id: string;
  tenantId: string;
  platform: string;
  userId: string;
  triggerId: string;
  messages: DMMessage[];
  leadCaptured: boolean;
  leadKey?: string;
  status: "active" | "captured" | "abandoned" | "escalated";
}

export type DMGoal = "lead-capture" | "booking" | "consultation" | "lead-magnet-delivery";

export interface ProcessCommentResult {
  matched: boolean;
  trigger?: DMTrigger;
  response?: string;
}

export interface ProcessDMResult {
  nextMessage: string;
  leadCaptured: boolean;
  leadKey?: string;
  conversationId: string;
}

export interface DMMetrics {
  conversationsStarted: number;
  leadsCaptured: number;
  conversionRate: number;
  avgMessagesToConversion: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const triggerStore = new Map<string, DMTrigger>();
const conversationStore = new Map<string, DMConversation>();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function persistTrigger(trigger: DMTrigger): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO dm_triggers (
      id, tenant_id, platform, trigger_type, keywords, response, funnel_target, active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO UPDATE SET
      keywords = EXCLUDED.keywords,
      response = EXCLUDED.response,
      funnel_target = EXCLUDED.funnel_target,
      active = EXCLUDED.active`,
    [
      trigger.id,
      trigger.tenantId,
      trigger.platform,
      trigger.triggerType,
      JSON.stringify(trigger.keywords),
      JSON.stringify(trigger.response),
      trigger.funnelTarget,
      trigger.active,
    ],
  );
}

async function persistConversation(convo: DMConversation): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO dm_conversations (
      id, tenant_id, platform, user_id, trigger_id, messages,
      lead_captured, lead_key, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (id) DO UPDATE SET
      messages = EXCLUDED.messages,
      lead_captured = EXCLUDED.lead_captured,
      lead_key = EXCLUDED.lead_key,
      status = EXCLUDED.status`,
    [
      convo.id,
      convo.tenantId,
      convo.platform,
      convo.userId,
      convo.triggerId,
      JSON.stringify(convo.messages),
      convo.leadCaptured,
      convo.leadKey ?? null,
      convo.status,
    ],
  );
}

// ---------------------------------------------------------------------------
// Trigger management
// ---------------------------------------------------------------------------

export async function createDMTrigger(
  tenantId: string,
  trigger: Omit<DMTrigger, "id" | "tenantId">,
): Promise<DMTrigger> {
  const record: DMTrigger = {
    ...trigger,
    id: generateId("trigger"),
    tenantId,
  };
  triggerStore.set(record.id, record);
  await persistTrigger(record);
  return record;
}

export function getDMTriggers(tenantId: string, platform?: string): DMTrigger[] {
  return [...triggerStore.values()].filter(
    (t) => t.tenantId === tenantId && (!platform || t.platform === platform),
  );
}

export async function updateDMTrigger(
  triggerId: string,
  updates: Partial<Omit<DMTrigger, "id" | "tenantId">>,
): Promise<DMTrigger | undefined> {
  const trigger = triggerStore.get(triggerId);
  if (!trigger) return undefined;
  const updated: DMTrigger = { ...trigger, ...updates };
  triggerStore.set(triggerId, updated);
  await persistTrigger(updated);
  return updated;
}

export async function deleteDMTrigger(triggerId: string): Promise<boolean> {
  const existed = triggerStore.has(triggerId);
  triggerStore.delete(triggerId);
  const pool = getPool();
  if (pool && existed) {
    await pool.query("DELETE FROM dm_triggers WHERE id = $1", [triggerId]);
  }
  return existed;
}

// ---------------------------------------------------------------------------
// Comment processing
// ---------------------------------------------------------------------------

export async function processIncomingComment(
  tenantId: string,
  platform: string,
  comment: string,
): Promise<ProcessCommentResult> {
  const triggers = getDMTriggers(tenantId, platform).filter(
    (t) => t.active && t.triggerType === "comment-keyword",
  );

  const lowerComment = comment.toLowerCase();

  for (const trigger of triggers) {
    const matched = trigger.keywords.some((kw) => lowerComment.includes(kw.toLowerCase()));
    if (matched) {
      return {
        matched: true,
        trigger,
        response: trigger.response.initialMessage,
      };
    }
  }

  return { matched: false };
}

// ---------------------------------------------------------------------------
// DM conversation flow
// ---------------------------------------------------------------------------

export async function processIncomingDM(
  tenantId: string,
  platform: string,
  userId: string,
  message: string,
): Promise<ProcessDMResult> {
  const existingConvo = [...conversationStore.values()].find(
    (c) =>
      c.tenantId === tenantId &&
      c.platform === platform &&
      c.userId === userId &&
      c.status === "active",
  );

  if (existingConvo) {
    return continueConversation(existingConvo, message);
  }

  const triggers = getDMTriggers(tenantId, platform).filter(
    (t) => t.active && t.triggerType === "direct-message",
  );

  const lowerMessage = message.toLowerCase();
  const matchedTrigger = triggers.find((t) =>
    t.keywords.some((kw) => lowerMessage.includes(kw.toLowerCase())),
  );

  if (!matchedTrigger) {
    return {
      nextMessage: "Thanks for reaching out! How can I help you today?",
      leadCaptured: false,
      conversationId: generateId("convo"),
    };
  }

  const convo: DMConversation = {
    id: generateId("convo"),
    tenantId,
    platform,
    userId,
    triggerId: matchedTrigger.id,
    messages: [
      { role: "user", text: message, timestamp: new Date().toISOString() },
      {
        role: "bot",
        text: matchedTrigger.response.initialMessage,
        timestamp: new Date().toISOString(),
      },
    ],
    leadCaptured: false,
    status: "active",
  };

  conversationStore.set(convo.id, convo);
  await persistConversation(convo);

  return {
    nextMessage: matchedTrigger.response.initialMessage,
    leadCaptured: false,
    conversationId: convo.id,
  };
}

async function continueConversation(
  convo: DMConversation,
  userMessage: string,
): Promise<ProcessDMResult> {
  const trigger = triggerStore.get(convo.triggerId);
  const userMessageCount = convo.messages.filter((m) => m.role === "user").length;
  const followUps = trigger?.response.followUpMessages ?? [];

  const updatedMessages: DMMessage[] = [
    ...convo.messages,
    { role: "user", text: userMessage, timestamp: new Date().toISOString() },
  ];

  const isLeadMessage =
    userMessageCount >= 1 &&
    (trigger?.response.leadCaptureFields ?? []).some((field) => {
      if (field === "email") return /\S+@\S+\.\S+/.test(userMessage);
      if (field === "phone") return /[\d\s\-+()]{7,}/.test(userMessage);
      if (field === "name") return userMessage.trim().split(" ").length >= 2;
      return userMessage.trim().length > 0;
    });

  if (isLeadMessage) {
    const leadKey = `lead-${convo.tenantId}-${convo.userId}-${Date.now()}`;
    const closingMessage =
      trigger?.response.bookingLink
        ? `Excellent! Here is your booking link: ${trigger.response.bookingLink}`
        : trigger?.response.leadMagnetSlug
          ? `Your resource is ready. Access it here: /magnets/${trigger.response.leadMagnetSlug}`
          : "Got it! Someone from our team will be in touch shortly.";

    updatedMessages.push({ role: "bot", text: closingMessage, timestamp: new Date().toISOString() });

    const updated: DMConversation = {
      ...convo,
      messages: updatedMessages,
      leadCaptured: true,
      leadKey,
      status: "captured",
    };
    conversationStore.set(convo.id, updated);
    await persistConversation(updated);

    return { nextMessage: closingMessage, leadCaptured: true, leadKey, conversationId: convo.id };
  }

  const followUpIndex = Math.min(userMessageCount - 1, followUps.length - 1);
  const nextMessage =
    followUpIndex >= 0 && followUps[followUpIndex]
      ? followUps[followUpIndex]
      : "Could you share a bit more so I can help you best?";

  updatedMessages.push({ role: "bot", text: nextMessage, timestamp: new Date().toISOString() });

  const updated: DMConversation = { ...convo, messages: updatedMessages };
  conversationStore.set(convo.id, updated);
  await persistConversation(updated);

  return { nextMessage, leadCaptured: false, conversationId: convo.id };
}

// ---------------------------------------------------------------------------
// Sequence generation
// ---------------------------------------------------------------------------

const SEQUENCE_TEMPLATES: Record<DMGoal, Record<string, DMResponse>> = {
  "lead-capture": {
    default: {
      initialMessage:
        "Hey! Thanks for reaching out. I have something that can help you — can I get your name and email so I can send it over?",
      followUpMessages: [
        "What is your biggest challenge with {niche} right now?",
        "Got it! Drop your email below and I will send you the exact resource.",
      ],
      leadCaptureFields: ["name", "email"],
    },
  },
  booking: {
    default: {
      initialMessage:
        "Great to hear from you! I have limited spots available. What day works best for a quick call?",
      followUpMessages: [
        "Perfect. Use this link to grab a time: {bookingLink}",
        "Can I get your name and email to send the confirmation?",
      ],
      leadCaptureFields: ["name", "email"],
      bookingLink: "https://calendly.com/example",
    },
  },
  consultation: {
    default: {
      initialMessage:
        "Hi! Tell me a bit about what you are working on and I will let you know if I can help.",
      followUpMessages: [
        "How long have you been dealing with this?",
        "What have you tried so far?",
        "Drop your email and I will send over a free strategy outline.",
      ],
      leadCaptureFields: ["email"],
    },
  },
  "lead-magnet-delivery": {
    default: {
      initialMessage:
        "Awesome! Your free resource is almost ready to send. What email should I use?",
      followUpMessages: [
        "Just to confirm — I am sending {leadMagnetSlug} to you. What is the best email?",
      ],
      leadCaptureFields: ["email"],
    },
  },
};

export function generateDMSequence(niche: string, goal: DMGoal): DMResponse {
  const template = SEQUENCE_TEMPLATES[goal]?.default ?? SEQUENCE_TEMPLATES["lead-capture"].default;

  const personalize = (text: string) =>
    text.replace("{niche}", niche).replace("{leadMagnetSlug}", `${niche}-guide`);

  return {
    ...template,
    initialMessage: personalize(template.initialMessage),
    followUpMessages: template.followUpMessages.map(personalize),
  };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export function getDMMetrics(tenantId: string): DMMetrics {
  const convos = [...conversationStore.values()].filter((c) => c.tenantId === tenantId);
  const conversationsStarted = convos.length;
  const captured = convos.filter((c) => c.leadCaptured);
  const leadsCaptured = captured.length;
  const conversionRate = conversationsStarted > 0 ? leadsCaptured / conversationsStarted : 0;

  const totalMessages =
    captured.reduce((sum, c) => sum + c.messages.filter((m) => m.role === "user").length, 0);
  const avgMessagesToConversion = leadsCaptured > 0 ? totalMessages / leadsCaptured : 0;

  return { conversationsStarted, leadsCaptured, conversionRate, avgMessagesToConversion };
}

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

export function resetDMStore(): void {
  triggerStore.clear();
  conversationStore.clear();
}
