// ---------------------------------------------------------------------------
// Weaponized Creative Engine
// Ties creative generation directly to lead psychology scores.
// Not "generate a page" — "generate a page that converts THIS lead
// based on THEIR psychology."
// ---------------------------------------------------------------------------

import type {
  LeadContext,
  LeadContextScores,
  PsychologyProfile,
} from "./context-engine.ts";
import type { NicheDefinition } from "./catalog.ts";
import {
  generateFearTrigger,
  generateDesireTrigger,
  generateIdentityMessage,
  generateDeepObjectionResponse,
  type PersonaType,
} from "./deep-psychology.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreativeTemperature = LeadContextScores["temperature"];

export type CreativeStrategyName = "educational" | "benefit" | "direct" | "immediate";

export interface CreativeStrategy {
  name: CreativeStrategyName;
  temperature: CreativeTemperature;
  tone: string;
  urgencyLevel: number;
  trustEmphasis: number;
  ctaStrength: number;
  socialProofWeight: number;
}

export interface HeroSection {
  headline: string;
  subheadline: string;
  ctaText: string;
  imageSuggestion: string;
  trustBadges: string[];
  showCountdown: boolean;
  countdownLabel: string;
}

export interface LandingPageSections {
  hero: HeroSection;
  socialProof: string[];
  benefitsList: string[];
  objectionHandlers: string[];
  finalCta: string;
}

export interface DynamicEmail {
  day: number;
  subject: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  sendCondition: string;
  stage: string;
}

export interface AdaptiveAd {
  platform: string;
  headline: string;
  description: string;
  ctaButton: string;
  displayUrl?: string;
  primaryText?: string;
  introText?: string;
}

export interface AdaptiveCreativePackage {
  strategy: CreativeStrategy;
  landingPage: LandingPageSections;
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
  adHeadlines: string[];
  ctaText: string;
  socialPost: string;
}

// ---------------------------------------------------------------------------
// Strategy selection
// ---------------------------------------------------------------------------

const STRATEGY_MAP: Record<CreativeTemperature, CreativeStrategy> = {
  cold: {
    name: "educational",
    temperature: "cold",
    tone: "educational, approachable, no-pressure",
    urgencyLevel: 10,
    trustEmphasis: 90,
    ctaStrength: 20,
    socialProofWeight: 70,
  },
  warm: {
    name: "benefit",
    temperature: "warm",
    tone: "benefit-focused, encouraging, social-proof-heavy",
    urgencyLevel: 40,
    trustEmphasis: 60,
    ctaStrength: 50,
    socialProofWeight: 80,
  },
  hot: {
    name: "direct",
    temperature: "hot",
    tone: "direct, urgent, scarcity-driven",
    urgencyLevel: 75,
    trustEmphasis: 40,
    ctaStrength: 80,
    socialProofWeight: 50,
  },
  burning: {
    name: "immediate",
    temperature: "burning",
    tone: "immediate-action, exclusive-access, phone-prominent",
    urgencyLevel: 95,
    trustEmphasis: 20,
    ctaStrength: 95,
    socialProofWeight: 30,
  },
};

export function selectCreativeStrategy(
  scores: LeadContextScores,
  temperature?: CreativeTemperature,
): CreativeStrategy {
  const temp = temperature ?? scores.temperature;
  return { ...STRATEGY_MAP[temp] };
}

// ---------------------------------------------------------------------------
// Headline generation helpers
// ---------------------------------------------------------------------------

function headlineFromFear(nicheSlug: string, fears: string[]): string {
  if (fears.length === 0) return "";
  const trigger = generateFearTrigger(nicheSlug, fears[0]);
  return trigger.message;
}

function headlineFromDesire(nicheSlug: string, desires: string[]): string {
  if (desires.length === 0) return "";
  const triggers = generateDesireTrigger(nicheSlug, desires);
  return triggers.length > 0 ? triggers[0].message : "";
}

function ctaForIdentity(identityType: string, strategy: CreativeStrategy): string {
  const persona = identityType as PersonaType;
  const ctaMap: Record<string, Record<CreativeStrategyName, string>> = {
    "decision-maker": {
      educational: "See the Data",
      benefit: "Get Your Custom Report",
      direct: "Start Now — Limited Spots",
      immediate: "Claim Your Exclusive Access",
    },
    researcher: {
      educational: "Download the Full Comparison",
      benefit: "Compare All Options",
      direct: "Get Your Analysis",
      immediate: "Access the Complete Breakdown",
    },
    "budget-holder": {
      educational: "Calculate Your ROI",
      benefit: "See Your Savings",
      direct: "Lock In This Price",
      immediate: "Secure Your Rate Now",
    },
    implementer: {
      educational: "See How It Works",
      benefit: "Try the Demo",
      direct: "Start Your Trial",
      immediate: "Get Started Immediately",
    },
    innovator: {
      educational: "Explore the Technology",
      benefit: "See What's New",
      direct: "Be the First to Try It",
      immediate: "Get Early Access",
    },
    pragmatist: {
      educational: "See Real Results",
      benefit: "View Case Studies",
      direct: "Get Proven Results",
      immediate: "Start Seeing Results Today",
    },
  };

  const personaCtas = ctaMap[persona] ?? ctaMap["decision-maker"];
  return personaCtas[strategy.name];
}

function imageSuggestionForStage(emotionalStage: string): string {
  const suggestions: Record<string, string> = {
    unaware: "lifestyle-aspirational",
    curiosity: "educational-infographic",
    consideration: "product-demo-screenshot",
    evaluation: "comparison-chart",
    commitment: "social-proof-collage",
    advocacy: "community-celebration",
  };
  return suggestions[emotionalStage] ?? "professional-hero";
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

export function personalizeHeroSection(
  nicheConfig: NicheDefinition,
  strategy: CreativeStrategy,
  psychology: PsychologyProfile,
): HeroSection {
  const hasFears = psychology.fearTriggers.length > 0;
  const hasDesires = psychology.desireTriggers.length > 0;

  let headline: string;
  if (hasFears && strategy.urgencyLevel > 50) {
    headline = headlineFromFear(nicheConfig.slug, psychology.fearTriggers);
  } else if (hasDesires) {
    headline = headlineFromDesire(nicheConfig.slug, psychology.desireTriggers);
  } else {
    headline = `Transform Your ${nicheConfig.label} Operations Today`;
  }

  if (!headline) {
    headline = `Transform Your ${nicheConfig.label} Operations Today`;
  }

  let subheadline: string;
  if (hasDesires) {
    const triggers = generateDesireTrigger(nicheConfig.slug, psychology.desireTriggers);
    subheadline = triggers.length > 0
      ? triggers[0].message
      : `Discover how leading ${nicheConfig.label} businesses are getting ahead.`;
  } else {
    subheadline = `Discover how leading ${nicheConfig.label} businesses are getting ahead.`;
  }

  const ctaText = ctaForIdentity(psychology.identityType, strategy);

  const imageSuggestion = imageSuggestionForStage(psychology.emotionalStage);

  const trustBadges: string[] = [];
  if (psychology.trustLevel < 40) {
    trustBadges.push("verified-reviews", "money-back-guarantee", "industry-certification", "ssl-secure");
  } else if (psychology.trustLevel < 70) {
    trustBadges.push("verified-reviews", "industry-certification");
  }

  const showCountdown = strategy.urgencyLevel > 60;
  const countdownLabel = showCountdown
    ? strategy.name === "immediate"
      ? "Offer expires in:"
      : "Limited spots remaining — offer closes in:"
    : "";

  return {
    headline,
    subheadline,
    ctaText,
    imageSuggestion,
    trustBadges,
    showCountdown,
    countdownLabel,
  };
}

// ---------------------------------------------------------------------------
// Landing page sections
// ---------------------------------------------------------------------------

function buildSocialProof(
  nicheConfig: NicheDefinition,
  strategy: CreativeStrategy,
  psychology: PsychologyProfile,
): string[] {
  const proofs: string[] = [];

  if (psychology.trustLevel < 40) {
    proofs.push(`"This transformed our ${nicheConfig.label.toLowerCase()} business." — Verified Customer`);
    proofs.push(`Trusted by 500+ ${nicheConfig.label.toLowerCase()} professionals`);
    proofs.push("4.9/5 average rating from verified users");
    proofs.push("SOC 2 compliant and independently audited");
  } else if (strategy.socialProofWeight > 50) {
    proofs.push(`Join 500+ ${nicheConfig.label.toLowerCase()} businesses already growing`);
    proofs.push("See why industry leaders chose us");
  }

  return proofs;
}

function buildBenefits(
  nicheConfig: NicheDefinition,
  psychology: PsychologyProfile,
): string[] {
  const benefits: string[] = [];

  if (psychology.desireTriggers.length > 0) {
    const triggers = generateDesireTrigger(nicheConfig.slug, psychology.desireTriggers);
    for (const t of triggers.slice(0, 3)) {
      benefits.push(t.message);
    }
  }

  if (benefits.length === 0) {
    benefits.push(
      `Streamline your ${nicheConfig.label.toLowerCase()} workflow`,
      "Reduce manual tasks by up to 60%",
      "Get real-time visibility into your pipeline",
    );
  }

  return benefits;
}

function buildObjectionHandlers(
  nicheConfig: NicheDefinition,
  psychology: PsychologyProfile,
): string[] {
  const handlers: string[] = [];

  for (const objection of psychology.objections.slice(0, 3)) {
    const response = generateDeepObjectionResponse(objection, nicheConfig.slug);
    handlers.push(`${response.objection}: ${response.deepResponse}`);
  }

  return handlers;
}

function buildLandingPage(
  nicheConfig: NicheDefinition,
  strategy: CreativeStrategy,
  psychology: PsychologyProfile,
): LandingPageSections {
  const hero = personalizeHeroSection(nicheConfig, strategy, psychology);
  const socialProof = buildSocialProof(nicheConfig, strategy, psychology);
  const benefitsList = buildBenefits(nicheConfig, psychology);
  const objectionHandlers = buildObjectionHandlers(nicheConfig, psychology);

  let finalCta: string;
  if (strategy.name === "immediate") {
    finalCta = "Call us now — your dedicated specialist is waiting";
  } else if (strategy.name === "direct") {
    finalCta = "Start your free trial — limited availability";
  } else if (strategy.name === "benefit") {
    finalCta = "See how it works for your business";
  } else {
    finalCta = "Learn more about how we can help";
  }

  return { hero, socialProof, benefitsList, objectionHandlers, finalCta };
}

// ---------------------------------------------------------------------------
// Email generation
// ---------------------------------------------------------------------------

function generateEmailSubject(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string {
  if (strategy.name === "immediate") {
    return `[Action Required] Your exclusive ${nicheConfig.label.toLowerCase()} offer expires soon`;
  }
  if (strategy.name === "direct" && psychology.fearTriggers.length > 0) {
    return `Don't let ${psychology.fearTriggers[0]} cost you another day`;
  }
  if (psychology.desireTriggers.length > 0) {
    return `How to achieve ${psychology.desireTriggers[0]} in your ${nicheConfig.label.toLowerCase()} business`;
  }
  return `${nicheConfig.label}: A smarter approach to growth`;
}

function generateEmailBody(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string {
  const parts: string[] = [];

  if (psychology.identityType === "decision-maker") {
    parts.push("As a leader in your organization, you need results backed by data.");
  } else if (psychology.identityType === "researcher") {
    parts.push("You are clearly doing your homework, and we respect that.");
  } else {
    parts.push(`Hi — we help ${nicheConfig.label.toLowerCase()} businesses like yours grow faster.`);
  }

  if (psychology.fearTriggers.length > 0 && strategy.urgencyLevel > 40) {
    const trigger = generateFearTrigger(nicheConfig.slug, psychology.fearTriggers[0]);
    parts.push(trigger.message);
  }

  if (psychology.desireTriggers.length > 0) {
    const triggers = generateDesireTrigger(nicheConfig.slug, psychology.desireTriggers);
    if (triggers.length > 0) {
      parts.push(triggers[0].message);
    }
  }

  if (strategy.urgencyLevel > 60) {
    parts.push("This offer is only available for a limited time. Act now to secure your spot.");
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// SMS generation
// ---------------------------------------------------------------------------

function generateSms(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string {
  if (strategy.name === "immediate") {
    return `URGENT: Your ${nicheConfig.label.toLowerCase()} growth plan is ready. Spots are filling fast — reply YES to claim yours now.`;
  }
  if (strategy.name === "direct") {
    return `Your custom ${nicheConfig.label.toLowerCase()} strategy is ready. Limited availability — tap here to see your plan.`;
  }
  if (strategy.name === "benefit") {
    return `See how ${nicheConfig.label.toLowerCase()} businesses are growing 2x faster. Check out your personalized report.`;
  }
  return `New resource: "${nicheConfig.assessmentTitle}" — take the free assessment to see where you stand.`;
}

// ---------------------------------------------------------------------------
// Ad headlines
// ---------------------------------------------------------------------------

function generateAdHeadlines(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string[] {
  const headlines: string[] = [];

  if (psychology.fearTriggers.length > 0) {
    headlines.push(`Stop Losing ${nicheConfig.label} Revenue`);
  } else {
    headlines.push(`Grow Your ${nicheConfig.label} Business`);
  }

  if (psychology.desireTriggers.length > 0) {
    headlines.push(`Achieve ${psychology.desireTriggers[0]} Faster`);
  } else {
    headlines.push(`Automate Your ${nicheConfig.label} Workflow`);
  }

  if (strategy.urgencyLevel > 60) {
    headlines.push("Limited Time — Start Your Free Trial");
  } else {
    headlines.push(`See Why 500+ ${nicheConfig.label} Pros Trust Us`);
  }

  return headlines;
}

// ---------------------------------------------------------------------------
// Social post
// ---------------------------------------------------------------------------

function generateSocialPost(
  psychology: PsychologyProfile,
  nicheConfig: NicheDefinition,
): string {
  if (psychology.desireTriggers.length > 0) {
    return `Want to achieve ${psychology.desireTriggers[0]} in your ${nicheConfig.label.toLowerCase()} business? Here's how top performers are doing it. #${nicheConfig.slug.replace(/-/g, "")} #growth`;
  }
  return `${nicheConfig.label} businesses are transforming their operations. See what's possible. #${nicheConfig.slug.replace(/-/g, "")} #automation`;
}

// ---------------------------------------------------------------------------
// Main creative generation
// ---------------------------------------------------------------------------

export function generateAdaptiveCreative(
  leadContext: LeadContext,
  nicheConfig: NicheDefinition,
): AdaptiveCreativePackage {
  const strategy = selectCreativeStrategy(leadContext.scores);
  const psychology = leadContext.psychologyProfile;

  const landingPage = buildLandingPage(nicheConfig, strategy, psychology);
  const emailSubject = generateEmailSubject(psychology, strategy, nicheConfig);
  const emailBody = generateEmailBody(psychology, strategy, nicheConfig);
  const smsMessage = generateSms(psychology, strategy, nicheConfig);
  const adHeadlines = generateAdHeadlines(psychology, strategy, nicheConfig);
  const ctaText = ctaForIdentity(psychology.identityType, strategy);
  const socialPost = generateSocialPost(psychology, nicheConfig);

  return {
    strategy,
    landingPage,
    emailSubject,
    emailBody,
    smsMessage,
    adHeadlines,
    ctaText,
    socialPost,
  };
}

// ---------------------------------------------------------------------------
// Dynamic email sequence
// ---------------------------------------------------------------------------

const DEFAULT_STAGES = ["awareness", "objection", "urgency", "proof", "final"];

export function generateDynamicEmailSequence(
  leadContext: LeadContext,
  nicheConfig: NicheDefinition,
  stages?: string[],
): DynamicEmail[] {
  const psychology = leadContext.psychologyProfile;
  const strategy = selectCreativeStrategy(leadContext.scores);
  const sequenceStages = stages ?? DEFAULT_STAGES;

  const emails: DynamicEmail[] = [];
  const daySchedule = [0, 2, 5, 7, 10];

  for (let i = 0; i < sequenceStages.length; i++) {
    const stage = sequenceStages[i];
    const day = daySchedule[i] ?? i * 3;

    emails.push(buildSequenceEmail(stage, day, psychology, strategy, nicheConfig));
  }

  return emails;
}

function buildSequenceEmail(
  stage: string,
  day: number,
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): DynamicEmail {
  const baseUrl = `https://app.example.com/${nicheConfig.slug}`;

  switch (stage) {
    case "awareness":
      return {
        day,
        subject: buildAwarenessSubject(psychology, nicheConfig),
        body: buildAwarenessBody(psychology, nicheConfig),
        ctaText: "Learn More",
        ctaUrl: `${baseUrl}/learn`,
        sendCondition: "lead has not converted",
        stage,
      };

    case "objection":
      return {
        day,
        subject: buildObjectionSubject(psychology, nicheConfig),
        body: buildObjectionBody(psychology, nicheConfig),
        ctaText: "See the Answers",
        ctaUrl: `${baseUrl}/faq`,
        sendCondition: "lead has not converted and has not booked a call",
        stage,
      };

    case "urgency":
      return {
        day,
        subject: `Time is running out for your ${nicheConfig.label.toLowerCase()} growth plan`,
        body: buildUrgencyBody(psychology, strategy, nicheConfig),
        ctaText: strategy.urgencyLevel > 60 ? "Claim Your Spot" : "See Your Options",
        ctaUrl: `${baseUrl}/offer`,
        sendCondition: "lead has not converted and engagement score < 60",
        stage,
      };

    case "proof":
      return {
        day,
        subject: `How ${nicheConfig.label.toLowerCase()} businesses like yours are winning`,
        body: buildProofBody(psychology, nicheConfig),
        ctaText: ctaForIdentity(psychology.identityType, strategy),
        ctaUrl: `${baseUrl}/case-studies`,
        sendCondition: "lead has not converted",
        stage,
      };

    case "final":
      return {
        day,
        subject: buildFinalSubject(psychology, nicheConfig),
        body: buildFinalBody(psychology, strategy, nicheConfig),
        ctaText: "Last Chance — Act Now",
        ctaUrl: `${baseUrl}/final-offer`,
        sendCondition: "lead has not converted and email 4 was opened",
        stage,
      };

    default:
      return {
        day,
        subject: `Update from ${nicheConfig.label}`,
        body: `We have new resources for your ${nicheConfig.label.toLowerCase()} business.`,
        ctaText: "See What's New",
        ctaUrl: baseUrl,
        sendCondition: "lead has not converted",
        stage,
      };
  }
}

function buildAwarenessSubject(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  if (psychology.emotionalStage === "curiosity") {
    return `Curious about improving your ${nicheConfig.label.toLowerCase()} results?`;
  }
  return `${nicheConfig.assessmentTitle} — free for a limited time`;
}

function buildAwarenessBody(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  const parts: string[] = [];
  if (psychology.emotionalStage === "curiosity") {
    parts.push(`You're exploring ways to improve your ${nicheConfig.label.toLowerCase()} operations — we can help.`);
  } else {
    parts.push(`Most ${nicheConfig.label.toLowerCase()} businesses are leaving growth on the table without realizing it.`);
  }
  parts.push(`Take our free ${nicheConfig.assessmentTitle} to see where you stand.`);
  return parts.join("\n\n");
}

function buildObjectionSubject(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  if (psychology.objections.length > 0) {
    return `"${psychology.objections[0]}" — here's the truth`;
  }
  return `Common concerns about ${nicheConfig.label.toLowerCase()} automation, answered`;
}

function buildObjectionBody(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  const parts: string[] = [];
  parts.push("We hear these questions a lot. Here are honest answers:");

  for (const objection of psychology.objections.slice(0, 3)) {
    const response = generateDeepObjectionResponse(objection, nicheConfig.slug);
    parts.push(`Q: ${response.objection}\nA: ${response.deepResponse}`);
  }

  if (psychology.objections.length === 0) {
    parts.push(
      `Many ${nicheConfig.label.toLowerCase()} professionals wonder if automation is right for them. The data says yes.`,
    );
  }

  return parts.join("\n\n");
}

function buildUrgencyBody(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string {
  const parts: string[] = [];

  if (psychology.fearTriggers.length > 0 && strategy.urgencyLevel > 50) {
    const trigger = generateFearTrigger(nicheConfig.slug, psychology.fearTriggers[0]);
    parts.push(trigger.message);
  }

  parts.push(
    `Every day without a system in place costs your ${nicheConfig.label.toLowerCase()} business real revenue.`,
  );

  if (strategy.urgencyLevel > 60) {
    parts.push("We only have a few onboarding slots left this month. Don't miss your window.");
  }

  return parts.join("\n\n");
}

function buildProofBody(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  const parts: string[] = [];

  if (psychology.identityType === "decision-maker") {
    parts.push("Here are the numbers that matter:");
    parts.push(`- ${nicheConfig.label} clients see an average 3.2x ROI in the first 90 days`);
    parts.push("- 92% of users report measurable time savings within the first month");
  } else {
    parts.push(`See what other ${nicheConfig.label.toLowerCase()} professionals are saying:`);
    parts.push(`"This changed everything for our team." — Verified ${nicheConfig.label} Customer`);
  }

  return parts.join("\n");
}

function buildFinalSubject(psychology: PsychologyProfile, nicheConfig: NicheDefinition): string {
  if (psychology.fearTriggers.length > 0) {
    return `Last chance: don't let ${psychology.fearTriggers[0]} hold you back`;
  }
  return `Final reminder: your ${nicheConfig.label.toLowerCase()} growth plan expires tomorrow`;
}

function buildFinalBody(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): string {
  const parts: string[] = [];

  parts.push("This is our final reminder.");

  if (psychology.fearTriggers.length > 0) {
    const trigger = generateFearTrigger(nicheConfig.slug, psychology.fearTriggers[0]);
    parts.push(trigger.message);
  }

  if (strategy.urgencyLevel > 60) {
    parts.push(
      `Your exclusive ${nicheConfig.label.toLowerCase()} offer expires at midnight. After that, standard pricing applies.`,
    );
  }

  parts.push("Reply to this email or click below to lock in your rate.");

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Platform-specific ad generation
// ---------------------------------------------------------------------------

export function generateAdaptiveAd(
  leadContext: LeadContext,
  nicheConfig: NicheDefinition,
  platform: "google" | "facebook" | "linkedin",
): AdaptiveAd {
  const strategy = selectCreativeStrategy(leadContext.scores);
  const psychology = leadContext.psychologyProfile;

  switch (platform) {
    case "google":
      return buildGoogleAd(psychology, strategy, nicheConfig);
    case "facebook":
      return buildFacebookAd(psychology, strategy, nicheConfig);
    case "linkedin":
      return buildLinkedInAd(psychology, strategy, nicheConfig);
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

function buildGoogleAd(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): AdaptiveAd {
  let headline: string;
  if (psychology.fearTriggers.length > 0 && strategy.urgencyLevel > 50) {
    headline = `Stop ${psychology.fearTriggers[0]}`;
  } else if (psychology.desireTriggers.length > 0) {
    headline = `Get ${psychology.desireTriggers[0]}`;
  } else {
    headline = `${nicheConfig.label} Growth`;
  }

  let description: string;
  if (strategy.name === "immediate" || strategy.name === "direct") {
    description = `Limited time offer for ${nicheConfig.label.toLowerCase()} businesses. Get started today and see results fast.`;
  } else {
    description = `Free ${nicheConfig.assessmentTitle}. See where your business stands and discover untapped growth.`;
  }

  return {
    platform: "google",
    headline: truncate(headline, 30),
    description: truncate(description, 90),
    ctaButton: ctaForIdentity(psychology.identityType, strategy),
    displayUrl: `example.com/${nicheConfig.slug}`,
  };
}

function buildFacebookAd(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): AdaptiveAd {
  let headline: string;
  if (psychology.desireTriggers.length > 0) {
    headline = `Achieve ${psychology.desireTriggers[0]} in Your ${nicheConfig.label} Business`;
  } else {
    headline = `Transform Your ${nicheConfig.label} Operations`;
  }

  let primaryText: string;
  if (psychology.fearTriggers.length > 0) {
    primaryText = `Tired of ${psychology.fearTriggers[0]}? You're not alone. See how top performers solved it.`;
  } else {
    primaryText = `${nicheConfig.label} businesses are growing faster with the right systems. See how.`;
  }

  return {
    platform: "facebook",
    headline: truncate(headline, 40),
    description: truncate(`Free ${nicheConfig.assessmentTitle}`, 30),
    ctaButton: strategy.urgencyLevel > 60 ? "Sign Up" : "Learn More",
    primaryText: truncate(primaryText, 125),
  };
}

function buildLinkedInAd(
  psychology: PsychologyProfile,
  strategy: CreativeStrategy,
  nicheConfig: NicheDefinition,
): AdaptiveAd {
  let headline: string;
  if (psychology.identityType === "decision-maker") {
    headline = `${nicheConfig.label} Leaders: Data-Driven Growth Is Here`;
  } else {
    headline = `The Modern ${nicheConfig.label} Growth Playbook`;
  }

  let introText: string;
  if (psychology.desireTriggers.length > 0) {
    introText = `Looking to achieve ${psychology.desireTriggers[0]}? Leading ${nicheConfig.label.toLowerCase()} organizations are using a systematic approach to growth.`;
  } else {
    introText = `${nicheConfig.label} organizations are adopting automated growth systems. See the playbook.`;
  }

  return {
    platform: "linkedin",
    headline: truncate(headline, 50),
    description: truncate(`${nicheConfig.assessmentTitle} — free for professionals`, 40),
    ctaButton: ctaForIdentity(psychology.identityType, strategy),
    introText,
  };
}
