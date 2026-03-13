import { siteConfig } from "./site-config";
import {
  inferChannelPreference,
  inferObjectionType,
  inferVisitorTemperature,
  normalizeNicheSlug,
  recommendBlueprintForVisitor,
} from "./funnel-blueprints";

export interface ExperienceProfile {
  visitorId?: string;
  scores: { engagement: number; intent: number; composite: number };
  capturedEmail?: string;
  capturedPhone?: string;
  assessmentCompleted?: boolean;
  roiCalculatorUsed?: boolean;
  chatEngaged?: boolean;
  whatsappOptIn?: boolean;
  sessions: number;
  pagesViewed: string[];
  nicheInterest?: string;
  funnelStage?: string;
  referralSource?: string;
  utmSource?: string;
  utmMedium?: string;
}

export interface HeroExperience {
  experimentId: string;
  variantId: string;
  eyebrow: string;
  headline: string;
  highlight: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  trustBar: string[];
  urgencyNote: string;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getExperimentBucket(seed: string, experimentId: string, variants: string[]) {
  const hash = hashString(`${seed}:${experimentId}`);
  return variants[hash % variants.length] ?? variants[0];
}

function niceNiche(value?: string) {
  const normalized = normalizeNicheSlug(value);
  if (normalized === "general") return "your business";
  return normalized.replace(/-/g, " ");
}

export function buildHeroExperience(profile: ExperienceProfile): HeroExperience {
  const recommendation = recommendBlueprintForVisitor(profile);
  const temperature = inferVisitorTemperature(profile);
  const objection = inferObjectionType(profile);
  const channel = inferChannelPreference(profile);
  const seed = profile.visitorId ?? profile.capturedEmail ?? "anonymous";
  const niche = niceNiche(profile.nicheInterest);
  const nicheSlug = normalizeNicheSlug(profile.nicheInterest);
  const variantId = getExperimentBucket(seed, "hero-v1", ["roi", "proof", "speed"]);

  const trustBarBase = [
    "Adaptive funnel routing",
    `${channel === "whatsapp" ? "WhatsApp-first" : "Multi-channel"} follow-up`,
    `${temperature.toUpperCase()} traffic optimization`,
  ];

  if (variantId === "roi") {
    return {
      experimentId: "hero-v1",
      variantId,
      eyebrow: `Best-fit path: ${recommendation.blueprint.name}`,
      headline: `Turn ${niche} traffic into`,
      highlight: "measurable pipeline and revenue.",
      subheadline:
        objection === "price"
          ? `See the exact ROI before you commit. ${siteConfig.brandName} adapts the entry path, proof sequence, and offer framing by visitor intent.`
          : `${siteConfig.brandName} adapts capture, qualification, and nurture around each visitor so the right prospects move faster and weaker traffic gets educated first.`,
      primaryCta: {
        label: objection === "price" ? "Calculate My ROI" : "See My Best Path",
        href: objection === "price" ? "/calculator" : `/assess/${nicheSlug}`,
      },
      secondaryCta: {
        label: temperature === "hot" ? "Book Strategy Call" : "Watch On-Demand Webinar",
        href: temperature === "hot" ? "#contact" : "/webinar/on-demand",
      },
      trustBar: [...trustBarBase, "Revenue-minded qualification"],
      urgencyNote:
        temperature === "hot"
          ? "You look like a high-intent visitor. We will fast-track you to the highest-conviction next step."
          : "Start with the lowest-friction path. The platform will escalate the offer as your intent becomes clearer.",
    };
  }

  if (variantId === "proof") {
    return {
      experimentId: "hero-v1",
      variantId,
      eyebrow: `Designed for ${niche}`,
      headline: `Replace generic lead capture with`,
      highlight: "proof-driven conversion paths.",
      subheadline:
        objection === "trust"
          ? `When trust is the blocker, the system pivots into documentary, case-proof, and webinar flows before asking for a call.`
          : `Visitors don’t all need the same CTA. ${siteConfig.brandName} changes proof, messaging, and next-best action based on behavior, objection, and channel preference.`,
      primaryCta: {
        label: "Watch the Story Version",
        href: `/stories/${nicheSlug === "general" ? "client-portal" : nicheSlug}`,
      },
      secondaryCta: {
        label: "Take Free Assessment",
        href: `/assess/${nicheSlug}`,
      },
      trustBar: [...trustBarBase, "Proof before pressure"],
      urgencyNote: "The platform sequences narrative, ROI, and qualification instead of forcing every visitor into the same jump-to-call flow.",
    };
  }

  return {
    experimentId: "hero-v1",
    variantId,
    eyebrow: `Optimized for ${temperature} visitors`,
    headline: "Speed-to-lead wins when the right",
    highlight: "next step appears instantly.",
    subheadline:
      channel === "sales-call"
        ? `Your strongest visitors should not wait. ${siteConfig.brandName} identifies urgency and accelerates them into direct consult and conversion routes.`
        : `${siteConfig.brandName} dynamically shifts between chat, assessment, webinar, and ROI offers so visitors get the path most likely to convert right now.`,
    primaryCta: {
      label: channel === "sales-call" ? "Book Strategy Call" : "Start Smart Assessment",
      href: channel === "sales-call" ? "#contact" : `/assess/${nicheSlug}`,
    },
    secondaryCta: {
      label: "Open Concierge",
      href: "#chat-widget",
    },
    trustBar: [...trustBarBase, "Fast-path for hot leads"],
    urgencyNote: "The system is optimizing for response speed, objection fit, and momentum preservation.",
  };
}
