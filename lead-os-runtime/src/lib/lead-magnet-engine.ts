import { readFileSync } from "fs";
import { resolve } from "path";

export interface LeadMagnet {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  deliveryType: "pdf" | "email-course" | "video" | "template" | "checklist" | "tool" | "webinar" | "assessment" | "calculator" | "guide";
  assetUrl?: string;
  formFields: FormFieldSpec[];
  funnelFamily: string;
  niche: string;
  tags: string[];
  conversionRate?: number;
  status: "active" | "draft" | "archived";
  metadata: Record<string, unknown>;
}

export interface FormFieldSpec {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface MagnetRecommendation {
  magnet: LeadMagnet;
  score: number;
  reason: string;
}

export interface DeliveryRecord {
  id: string;
  leadKey: string;
  magnetId: string;
  status: "pending" | "delivered" | "opened" | "failed";
  deliveredAt?: string;
  openedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const ASSET_TYPE_TO_DELIVERY: Record<string, LeadMagnet["deliveryType"]> = {
  interactive_quiz: "assessment",
  scored_assessment: "assessment",
  calculator: "calculator",
  roi_calculator: "calculator",
  savings_calculator: "calculator",
  template: "template",
  google_sheet_template: "template",
  notion_template: "template",
  editable_template: "template",
  swipe_file: "template",
  email_swipe: "template",
  mini_course: "email-course",
  email_course: "email-course",
  video_course: "video",
  video_series: "video",
  video_lesson: "video",
  toolkit: "guide",
  resource_pack: "guide",
  starter_kit: "guide",
  checklist: "checklist",
  interactive_checklist: "checklist",
  audit_checklist: "checklist",
  pdf: "pdf",
  ebook: "pdf",
  report: "pdf",
  whitepaper: "pdf",
  free_tool: "tool",
  saas_tool: "tool",
  plg_tool: "tool",
  webinar: "webinar",
  webinar_replay: "webinar",
  live_workshop: "webinar",
  community: "guide",
  slack_community: "guide",
  membership_trial: "guide",
  personalized_audit: "assessment",
  free_consultation: "assessment",
  custom_report: "pdf",
};

const FUNNEL_STAGE_TO_FAMILY: Record<string, string> = {
  TOFU: "lead-magnet",
  MOFU: "authority",
  BOFU: "qualification",
};

interface CatalogMagnetRaw {
  id: string;
  title: string;
  category: string;
  niche_applicability: string[];
  persona: string;
  funnel_stage: string;
  trigger_event: string;
  asset_type: string;
  value_promise: string;
  hook: string;
  capture_mechanism?: {
    type: string;
    fields: string[];
    gating_rule?: string;
    consent?: string[];
  };
  delivery_method?: {
    primary_channel: string;
    assets: string[];
    personalization?: string;
  };
  traffic_fit?: string[];
  notes?: string;
  landing_page_structure?: unknown;
  nurture_sequence?: unknown;
  conversion_path?: unknown;
  automation_logic?: unknown;
  required_tools?: string[];
}

interface CatalogFileRaw {
  catalog_version: string;
  count: number;
  categories: { code: string; key: string; label: string }[];
  magnets: CatalogMagnetRaw[];
}

function buildSlug(id: string, title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\[.*?\]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${id}-${base}`.slice(0, 80);
}

function mapCaptureFieldsToFormFields(fields: string[]): FormFieldSpec[] {
  return fields.map((field) => {
    const isOptional = field.startsWith("optional_");
    const cleanName = field.replace(/^optional_/, "");

    const fieldMap: Record<string, Omit<FormFieldSpec, "name">> = {
      email: { label: "Email Address", type: "email", required: true, placeholder: "you@example.com" },
      first_name: { label: "First Name", type: "text", required: true, placeholder: "Your first name" },
      last_name: { label: "Last Name", type: "text", required: false, placeholder: "Your last name" },
      phone: { label: "Phone Number", type: "phone", required: false, placeholder: "(555) 123-4567" },
      company: { label: "Company", type: "text", required: false, placeholder: "Your company name" },
      company_name: { label: "Company Name", type: "text", required: false, placeholder: "Your company name" },
      company_size: { label: "Company Size", type: "select", required: false, options: ["1-10", "11-50", "51-200", "201-1000", "1000+"] },
      role: { label: "Your Role", type: "text", required: false, placeholder: "Your role or title" },
      industry: { label: "Industry", type: "text", required: false, placeholder: "Your industry" },
      website: { label: "Website", type: "text", required: false, placeholder: "https://yoursite.com" },
      revenue: { label: "Annual Revenue", type: "select", required: false, options: ["Under $100K", "$100K-$500K", "$500K-$1M", "$1M-$5M", "$5M+"] },
      team_size: { label: "Team Size", type: "select", required: false, options: ["Solo", "2-5", "6-15", "16-50", "50+"] },
      goal: { label: "Primary Goal", type: "textarea", required: false, placeholder: "What are you trying to achieve?" },
      message: { label: "Message", type: "textarea", required: false, placeholder: "Tell us more..." },
    };

    const mapped = fieldMap[cleanName] ?? {
      label: cleanName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      type: "text" as const,
      required: false,
      placeholder: "",
    };

    return {
      name: cleanName,
      ...mapped,
      required: isOptional ? false : mapped.required,
    };
  });
}

function transformMagnet(raw: CatalogMagnetRaw): LeadMagnet {
  const deliveryType = ASSET_TYPE_TO_DELIVERY[raw.asset_type] ?? "guide";
  const funnelFamily = FUNNEL_STAGE_TO_FAMILY[raw.funnel_stage] ?? "lead-magnet";
  const captureFields = raw.capture_mechanism?.fields ?? ["email", "first_name"];
  const primaryNiche = raw.niche_applicability[0] ?? "general";

  return {
    id: raw.id,
    slug: buildSlug(raw.id, raw.title),
    category: raw.category,
    title: raw.title,
    description: raw.value_promise,
    deliveryType,
    formFields: mapCaptureFieldsToFormFields(captureFields),
    funnelFamily,
    niche: primaryNiche,
    tags: [
      raw.category,
      raw.funnel_stage.toLowerCase(),
      raw.persona,
      raw.asset_type,
      ...(raw.traffic_fit ?? []),
    ],
    conversionRate: undefined,
    status: "active",
    metadata: {
      hook: raw.hook,
      triggerEvent: raw.trigger_event,
      persona: raw.persona,
      funnelStage: raw.funnel_stage,
      assetType: raw.asset_type,
      nicheApplicability: raw.niche_applicability,
      deliveryMethod: raw.delivery_method,
      trafficFit: raw.traffic_fit,
      notes: raw.notes,
    },
  };
}

let catalogCache: LeadMagnet[] | null = null;

export function loadCatalog(): LeadMagnet[] {
  if (catalogCache) return catalogCache;

  const catalogPath = resolve(
    process.cwd(),
    "..",
    "docs",
    "libraries",
    "lead-magnets",
    "catalog.v1.json",
  );

  try {
    const raw = readFileSync(catalogPath, "utf-8");
    const parsed: CatalogFileRaw = JSON.parse(raw);
    catalogCache = parsed.magnets.map(transformMagnet);
    return catalogCache;
  } catch (error: unknown) {
    console.error("Failed to load catalog:", error);
    catalogCache = [];
    return catalogCache;
  }
}

export function getMagnetBySlug(slug: string): LeadMagnet | undefined {
  const catalog = loadCatalog();
  return catalog.find((m) => m.slug === slug) ?? catalog.find((m) => m.id === slug);
}

export function getMagnetsByCategory(category: string): LeadMagnet[] {
  return loadCatalog().filter((m) => m.category === category);
}

export function getMagnetsByNiche(niche: string): LeadMagnet[] {
  return loadCatalog().filter((m) => {
    const applicability = (m.metadata.nicheApplicability as string[]) ?? [];
    return m.niche === niche || applicability.includes(niche);
  });
}

function computeNicheScore(magnet: LeadMagnet, niche?: string): number {
  if (!niche) return 0;
  const applicability = (magnet.metadata.nicheApplicability as string[]) ?? [];
  if (magnet.niche === niche) return 1.0;
  if (applicability.includes(niche)) return 0.8;
  if (applicability.includes("general")) return 0.3;
  return 0;
}

function computeFunnelFamilyScore(magnet: LeadMagnet, funnelFamily?: string): number {
  if (!funnelFamily) return 0;
  if (magnet.funnelFamily === funnelFamily) return 1.0;
  const funnelStage = magnet.metadata.funnelStage as string;
  if (funnelFamily === "lead-magnet" && funnelStage === "TOFU") return 0.9;
  if (funnelFamily === "authority" && funnelStage === "MOFU") return 0.9;
  if (funnelFamily === "qualification" && funnelStage === "BOFU") return 0.9;
  return 0.2;
}

function computeSourceScore(magnet: LeadMagnet, source?: string): number {
  if (!source) return 0;
  const trafficFit = (magnet.metadata.trafficFit as string[]) ?? [];
  const sourceMapping: Record<string, string[]> = {
    paid: ["paid_social", "paid_search"],
    organic: ["organic", "seo"],
    social: ["paid_social", "organic"],
    referral: ["referral", "retargeting"],
    retargeting: ["retargeting"],
    email: ["email", "retargeting"],
    direct: ["organic"],
    content: ["organic", "content"],
    blog: ["organic", "content"],
  };
  const mappedSources = sourceMapping[source] ?? [source];
  const match = mappedSources.some((s) => trafficFit.includes(s));
  return match ? 1.0 : 0.2;
}

function computeInterestsScore(magnet: LeadMagnet, interests?: string[]): number {
  if (!interests || interests.length === 0) return 0;
  const magnetTerms = [
    magnet.category,
    magnet.title.toLowerCase(),
    magnet.description.toLowerCase(),
    ...(magnet.tags ?? []),
  ].join(" ");
  const matches = interests.filter((interest) =>
    magnetTerms.includes(interest.toLowerCase()),
  );
  return matches.length > 0 ? Math.min(1.0, matches.length / interests.length) : 0;
}

export function recommendMagnets(
  context: {
    niche?: string;
    funnelFamily?: string;
    source?: string;
    score?: number;
    interests?: string[];
  },
  limit = 5,
): MagnetRecommendation[] {
  const catalog = loadCatalog().filter((m) => m.status === "active");

  const scored = catalog.map((magnet) => {
    const nicheScore = computeNicheScore(magnet, context.niche);
    const funnelScore = computeFunnelFamilyScore(magnet, context.funnelFamily);
    const sourceScore = computeSourceScore(magnet, context.source);
    const interestsScore = computeInterestsScore(magnet, context.interests);

    const totalScore =
      nicheScore * 0.4 +
      funnelScore * 0.3 +
      sourceScore * 0.15 +
      interestsScore * 0.15;

    const reasons: string[] = [];
    if (nicheScore >= 0.8) reasons.push(`strong niche fit for ${context.niche}`);
    if (funnelScore >= 0.8) reasons.push(`aligns with ${context.funnelFamily} funnel`);
    if (sourceScore >= 0.8) reasons.push(`matches ${context.source} traffic`);
    if (interestsScore > 0) reasons.push("overlaps with stated interests");

    const reason = reasons.length > 0
      ? reasons.join("; ")
      : "general relevance";

    return { magnet, score: Math.round(totalScore * 100) / 100, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

const deliveryStore = new Map<string, DeliveryRecord>();
const deliveryByLeadStore = new Map<string, string[]>();

function generateDeliveryId(): string {
  return `del_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function recordDelivery(
  delivery: Omit<DeliveryRecord, "id" | "createdAt">,
): Promise<DeliveryRecord> {
  const record: DeliveryRecord = {
    ...delivery,
    id: generateDeliveryId(),
    createdAt: new Date().toISOString(),
  };

  deliveryStore.set(record.id, record);

  const existing = deliveryByLeadStore.get(record.leadKey) ?? [];
  existing.push(record.id);
  deliveryByLeadStore.set(record.leadKey, existing);

  return record;
}

export async function getDeliveries(leadKey: string): Promise<DeliveryRecord[]> {
  const ids = deliveryByLeadStore.get(leadKey) ?? [];
  return ids
    .map((id) => deliveryStore.get(id))
    .filter((record): record is DeliveryRecord => record !== undefined);
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryRecord["status"],
): Promise<void> {
  const record = deliveryStore.get(deliveryId);
  if (!record) {
    throw new Error(`Delivery record not found: ${deliveryId}`);
  }

  record.status = status;
  if (status === "delivered" && !record.deliveredAt) {
    record.deliveredAt = new Date().toISOString();
  }
  if (status === "opened" && !record.openedAt) {
    record.openedAt = new Date().toISOString();
  }

  deliveryStore.set(deliveryId, record);
}
