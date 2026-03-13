import { createContact } from "@/lib/suitedash";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { serverSiteConfig } from "@/lib/site-config";
import { clampText, isPlainObject, isValidEmail, isValidPhone } from "@/lib/request-guards";
import { buildLeadKey } from "@/lib/trace";

export type IntakeSource =
  | "contact_form"
  | "assessment"
  | "roi_calculator"
  | "exit_intent"
  | "chat"
  | "whatsapp_optin"
  | "newsletter"
  | "manual";

export interface LeadIntakePayload {
  source: IntakeSource;
  visitorId?: string;
  sessionId?: string;
  leadKey?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  niche?: string;
  blueprintId?: string;
  stepId?: string;
  experimentId?: string;
  variantId?: string;
  message?: string;
  page?: string;
  score?: number;
  tier?: string;
  metadata?: Record<string, unknown>;
}

interface IntakeResult {
  success: boolean;
  existing?: boolean;
  contactCreated?: boolean;
  uid?: string;
  logged?: boolean;
  alerted?: boolean;
  normalized: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    service?: string;
    niche?: string;
  };
}

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? embeddedSecrets.aitable.apiToken,
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? embeddedSecrets.aitable.datasheetId,
  apiBase: "https://aitable.ai/fusion/v1",
};

const DISCORD_HIGH_VALUE =
  process.env.DISCORD_HIGH_VALUE_WEBHOOK ?? embeddedSecrets.discord.highValueWebhook;
const TELEGRAM_HIGH_VALUE_CHAT =
  process.env.TELEGRAM_HIGH_VALUE_CHAT ?? embeddedSecrets.telegram.highValueChat;
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ?? embeddedSecrets.telegram.botToken;
const intakeReplayStore = new Map<string, number>();
const INTAKE_REPLAY_WINDOW_MS = 5 * 60 * 1000;
const VALID_SOURCES: IntakeSource[] = [
  "contact_form",
  "assessment",
  "roi_calculator",
  "exit_intent",
  "chat",
  "whatsapp_optin",
  "newsletter",
  "manual",
];

function normalizeName(raw?: string) {
  if (!raw) return "";
  return raw.trim().replace(/\s+/g, " ");
}

function deriveFirstName(email?: string) {
  if (!email) return "Lead";
  return email.split("@")[0].replace(/[^a-zA-Z0-9]+/g, " ").trim() || "Lead";
}

function slugify(value?: string) {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildTags(payload: LeadIntakePayload) {
  const tags = [`source-${payload.source}`, serverSiteConfig.tenantSlug];
  const interest = slugify(payload.service || payload.niche);
  if (interest) tags.push(`interest-${interest}`);
  if (payload.tier) tags.push(`tier-${slugify(payload.tier)}`);
  return Array.from(new Set(tags));
}

function buildReplayKey(payload: LeadIntakePayload, normalized: IntakeResult["normalized"]) {
  return [
    payload.source,
    payload.sessionId ?? "",
    normalized.email ?? "",
    normalized.phone ?? "",
    normalized.service ?? normalized.niche ?? "",
  ].join("|");
}

function isRecentReplay(key: string) {
  const now = Date.now();
  const existing = intakeReplayStore.get(key);
  if (existing && now - existing < INTAKE_REPLAY_WINDOW_MS) return true;
  intakeReplayStore.set(key, now);
  return false;
}

async function logToAITable(payload: LeadIntakePayload, normalized: IntakeResult["normalized"]) {
  if (!AITABLE.apiToken) return false;

  const detail = {
    kind: "intake",
    source: payload.source,
    trace: {
      visitorId: payload.visitorId,
      sessionId: payload.sessionId,
      leadKey: payload.leadKey ?? buildLeadKey(normalized.email, normalized.phone),
      page: payload.page,
      service: payload.service,
      niche: payload.niche,
      blueprintId: payload.blueprintId,
      stepId: payload.stepId,
      experimentId: payload.experimentId,
      variantId: payload.variantId,
    },
    score: payload.score,
    tier: payload.tier,
    metadata: payload.metadata ?? {},
  };

  await fetch(`${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AITABLE.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Title: `INTAKE-${payload.source.toUpperCase()} - ${payload.service || payload.niche || "general"}`,
            Scenario: payload.service || payload.niche || "general",
            Company: payload.company || normalized.firstName,
            "Contact Email": normalized.email ?? "",
            "Contact Name": `${normalized.firstName} ${normalized.lastName}`.trim(),
            Status: "LEAD-CAPTURED",
            Touchpoint: payload.source,
            "AI Generated": JSON.stringify(detail).slice(0, 900),
          },
        },
      ],
      fieldKey: "name",
    }),
  }).catch(() => {});

  return true;
}

async function alertHighValue(payload: LeadIntakePayload, normalized: IntakeResult["normalized"]) {
  const shouldAlert = Boolean(payload.phone) || (payload.score ?? 0) >= 80;
  if (!shouldAlert) return false;

  const text = `HIGH VALUE INTAKE
Source: ${payload.source}
Name: ${normalized.firstName} ${normalized.lastName}
Email: ${normalized.email ?? "unknown"}
Phone: ${normalized.phone ?? "unknown"}
Service: ${payload.service ?? payload.niche ?? "general"}
Score: ${payload.score ?? "n/a"}
Page: ${payload.page ?? "/"}
Blueprint: ${payload.blueprintId ?? "n/a"}
Step: ${payload.stepId ?? "n/a"}`;

  if (DISCORD_HIGH_VALUE) {
    fetch(DISCORD_HIGH_VALUE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "High-Value Lead Intake",
            color: 0xff0000,
            fields: [
              { name: "Source", value: payload.source, inline: true },
              {
                name: "Name",
                value: `${normalized.firstName} ${normalized.lastName}`.trim(),
                inline: true,
              },
              {
                name: "Service",
                value: payload.service ?? payload.niche ?? "general",
                inline: true,
              },
              { name: "Email", value: normalized.email ?? "unknown", inline: true },
              { name: "Phone", value: normalized.phone ?? "unknown", inline: true },
              { name: "Score", value: String(payload.score ?? "n/a"), inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).catch(() => {});
  }

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_HIGH_VALUE_CHAT) {
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_HIGH_VALUE_CHAT,
        text,
      }),
    }).catch(() => {});
  }

  return true;
}

export async function processLeadIntake(payload: LeadIntakePayload): Promise<IntakeResult> {
  if (!VALID_SOURCES.includes(payload.source)) throw new Error("Invalid intake source.");
  if (!payload.email && !payload.phone) throw new Error("An email or phone number is required.");
  if (payload.email && !isValidEmail(payload.email)) throw new Error("Invalid email address.");
  if (payload.phone && !isValidPhone(payload.phone)) throw new Error("Invalid phone number.");

  const normalized = {
    firstName: normalizeName(clampText(payload.firstName, 80)) || deriveFirstName(payload.email),
    lastName: normalizeName(clampText(payload.lastName, 80)) || ".",
    email: payload.email?.trim().toLowerCase(),
    phone: payload.phone?.trim(),
    service: clampText(payload.service, 120) || undefined,
    niche: clampText(payload.niche, 120) || undefined,
  };
  const sessionId = clampText(payload.sessionId, 120) || undefined;
  const visitorId = clampText(payload.visitorId, 120) || undefined;
  const leadKey = payload.leadKey || buildLeadKey(normalized.email, normalized.phone);
  const blueprintId = clampText(payload.blueprintId, 120) || undefined;
  const stepId = clampText(payload.stepId, 120) || undefined;
  const experimentId = clampText(payload.experimentId, 120) || undefined;
  const variantId = clampText(payload.variantId, 120) || undefined;
  const replayKey = buildReplayKey({ ...payload, sessionId }, normalized);
  const replayed = isRecentReplay(replayKey);
  const company = clampText(payload.company, 160) || undefined;
  const message = clampText(payload.message, 1200) || undefined;
  const page = clampText(payload.page, 240) || undefined;
  const tier = clampText(payload.tier, 80) || undefined;
  const score =
    typeof payload.score === "number" && Number.isFinite(payload.score)
      ? Math.max(0, Math.min(payload.score, 100))
      : undefined;
  const metadata = isPlainObject(payload.metadata) ? payload.metadata : {};

  let uid: string | undefined;
  let existing = false;
  let contactCreated = false;

  if (normalized.email && !replayed) {
    const response = await createContact({
      first_name: normalized.firstName,
      last_name: normalized.lastName,
      email: normalized.email,
      role: "Lead",
      company_name: company,
      phone: normalized.phone,
      tags: buildTags(payload),
      notes: [
        normalized.service ? `Service interest: ${normalized.service}` : "",
        normalized.niche ? `Niche: ${normalized.niche}` : "",
        message ? `Message: ${message}` : "",
        page ? `Page: ${page}` : "",
        score != null ? `Score: ${score}` : "",
        tier ? `Tier: ${tier}` : "",
        blueprintId ? `Blueprint: ${blueprintId}` : "",
        stepId ? `Step: ${stepId}` : "",
      ].filter(Boolean),
      send_welcome_email: false,
    });

    uid = response.data?.uid as string | undefined;
    existing = response.message === "Contact already exists";
    contactCreated = true;
  }

  const enrichedPayload: LeadIntakePayload = {
    ...payload,
    visitorId,
    sessionId,
    leadKey,
    company,
    message,
    page,
    tier,
    score,
    metadata,
    blueprintId,
    stepId,
    experimentId,
    variantId,
  };

  const [logged, alerted] = replayed
    ? [false, false]
    : await Promise.all([
        logToAITable(enrichedPayload, normalized),
        alertHighValue(enrichedPayload, normalized),
      ]);

  return {
    success: true,
    existing: existing || replayed,
    contactCreated,
    uid,
    logged,
    alerted,
    normalized,
  };
}
