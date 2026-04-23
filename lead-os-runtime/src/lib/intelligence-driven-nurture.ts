// ---------------------------------------------------------------------------
// Intelligence-Driven Nurture Sequences
//
// Generates email sequences where every email is mapped to a specific stage
// of the buyer's decision journey and addresses a specific buying trigger,
// objection, or trust signal from the Customer Intelligence Engine.
//
// Day 0:  Address the buying trigger that brought them in
// Day 2:  Tackle their #1 objection with evidence
// Day 5:  Build trust using their preferred trust signal type
// Day 10: Show the decision journey — "here's what happens next"
// Day 14: Address their underlying fear directly
// Day 21: Competitor differentiation — why us vs alternatives
// Day 30: Conversion psychology — CTA matched to their motivation
// ---------------------------------------------------------------------------

import {
  getCustomerIntelligenceOrDefault,
  type BuyingTrigger,
  type ObjectionEntry,
  type CustomerIntelligenceProfile,
} from "./customer-intelligence.ts";

export interface IntelligenceDrivenEmail {
  stage: number;
  dayOffset: number;
  purpose: string;
  intelligenceSource: string;
  subject: string;
  previewText: string;
  bodyTemplate: string;
}

export interface IntelligenceNurtureSequence {
  niche: string;
  nicheLabel: string;
  totalEmails: number;
  totalDays: number;
  strategy: string;
  emails: IntelligenceDrivenEmail[];
}

function pickTrigger(triggers: BuyingTrigger[]): BuyingTrigger {
  const immediate = triggers.find((t) => t.urgency === "immediate");
  return immediate ?? triggers[0]!;
}

function pickTopObjection(objections: ObjectionEntry[]): ObjectionEntry {
  return objections[0]!;
}

function pickSecondObjection(objections: ObjectionEntry[]): ObjectionEntry {
  return objections[1] ?? objections[0]!;
}

export function generateIntelligenceNurtureSequence(niche: string): IntelligenceNurtureSequence {
  const intel = getCustomerIntelligenceOrDefault(niche);
  const trigger = pickTrigger(intel.buyingTriggers);
  const topObjection = pickTopObjection(intel.objections);
  const secondObjection = pickSecondObjection(intel.objections);
  const journey = intel.decisionJourney;
  const psychology = intel.conversionPsychology;
  const trust = intel.trustSignals;
  const competitors = intel.competitors;

  const motivationCta =
    psychology.primaryMotivation === "fear-of-loss" ? "Don't let another opportunity slip away. Book your strategy session today." :
    psychology.primaryMotivation === "competitive-pressure" ? "Your competitors aren't waiting. Let's get you ahead." :
    psychology.primaryMotivation === "compliance" ? "Stay compliant while growing. Let us show you how." :
    psychology.primaryMotivation === "efficiency" ? "Get your hours back. Let's build your automation system this week." :
    "Let's build something great together. Book your session today.";

  const guaranteeLine =
    psychology.guaranteePreference === "money-back" ? "And yes — full money-back guarantee if you don't see results." :
    psychology.guaranteePreference === "results-based" ? "Results guaranteed — or you don't pay a cent." :
    psychology.guaranteePreference === "trial-period" ? "Start with a free trial. No commitment, cancel anytime." :
    "100% satisfaction guaranteed — no risk.";

  const emails: IntelligenceDrivenEmail[] = [
    // Day 0: Address the buying trigger
    {
      stage: 1,
      dayOffset: 0,
      purpose: "Address the specific buying trigger that brought them to us",
      intelligenceSource: `Buying trigger: "${trigger.event}" (urgency: ${trigger.urgency})`,
      subject: "We know why you're here — and we can help",
      previewText: trigger.event,
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `If you're reading this, chances are something specific happened: ${trigger.event.toLowerCase()}.\n\n` +
        `We've seen this exact situation hundreds of times with {{niche}} businesses. ${trigger.emotionalState} — we get it.\n\n` +
        `The good news: there's a clear path forward. {{brandName}} was built for exactly this moment.\n\n` +
        `Here's what we recommend as your first step: take our 2-minute {{niche}} assessment. It will score your current setup and show you the single highest-impact change you can make this week.\n\n` +
        `No commitment. No pitch. Just clarity.\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 2: Tackle their #1 objection
    {
      stage: 2,
      dayOffset: 2,
      purpose: "Address the most common objection with evidence",
      intelligenceSource: `Top objection: "${topObjection.objection}" | Fear: "${topObjection.underlyingFear}"`,
      subject: `"${topObjection.objection}" — let's talk about this`,
      previewText: topObjection.underlyingFear,
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `We hear this a lot from {{niche}} businesses: "${topObjection.objection}"\n\n` +
        `What's really behind that concern is something deeper: ${topObjection.underlyingFear.toLowerCase()}.\n\n` +
        `Here's what the data shows: ${topObjection.evidenceBasedResponse}\n\n` +
        `We didn't just make that up — it's backed by real results from {{niche}} businesses using {{brandName}}.\n\n` +
        `${guaranteeLine}\n\n` +
        `Would it help to see a quick case study from a {{niche}} business like yours?\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 5: Build trust using their preferred type
    {
      stage: 3,
      dayOffset: 5,
      purpose: "Build trust using the signals this buyer type values most",
      intelligenceSource: `Trust preference: ${trust.socialProofPreference} | Primary signals: ${trust.primary.slice(0, 2).join(", ")}`,
      subject: trust.socialProofPreference === "case-studies" ? "Real results from a {{niche}} business like yours" :
               trust.socialProofPreference === "metrics" ? "The numbers that {{niche}} leaders care about" :
               trust.socialProofPreference === "testimonials" ? "What other {{niche}} owners are saying about us" :
               "Here's why {{niche}} businesses trust {{brandName}}",
      previewText: trust.primary[0] ?? "See why leaders in your industry chose us",
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `When {{niche}} businesses evaluate a growth platform, we've found they care most about: ${trust.primary.slice(0, 3).join(", ")}.\n\n` +
        `That's why we made sure {{brandName}} delivers on all three.\n\n` +
        (trust.socialProofPreference === "case-studies" ?
          `We recently worked with a {{niche}} business in a situation just like yours. They were struggling with the same challenges you described, and within 60 days they saw measurable improvement across every metric that matters.\n\n` :
         trust.socialProofPreference === "metrics" ?
          `Here are the numbers our {{niche}} clients typically see: 47% more qualified leads in 60 days, 35% faster response times, and 2.3x higher close rates on scored leads.\n\n` :
          `Here's what a recent {{niche}} client told us: "{{brandName}} replaced 8 tools we were paying for separately and gave us better results from day one."\n\n`) +
        `What matters most to you? Reply and tell us — we'll tailor your next step around it.\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 10: Show the decision journey
    {
      stage: 4,
      dayOffset: 10,
      purpose: "Reduce uncertainty by showing what the journey looks like",
      intelligenceSource: `Decision journey: ${journey.totalDays} days, ${journey.touchpointsNeeded} touchpoints, ${journey.stakeholders} stakeholders`,
      subject: "Here's exactly what happens if you move forward",
      previewText: `Most {{niche}} businesses go from evaluation to results in ${journey.totalDays} days`,
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `Most {{niche}} businesses that use {{brandName}} follow a simple path:\n\n` +
        journey.stages.map((stage, i) => `${i + 1}. ${stage.name}: ${stage.primaryAction}`).join("\n") + `\n\n` +
        `Total timeline: about ${journey.totalDays} days from first look to first results.\n\n` +
        `No surprise steps. No hidden processes. No "we'll get back to you in 3 weeks." You know exactly what's coming at every stage.\n\n` +
        `Ready to start? The first step takes 2 minutes.\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 14: Address the underlying fear directly
    {
      stage: 5,
      dayOffset: 14,
      purpose: "Address the deeper fear that prevents action",
      intelligenceSource: `Second objection: "${secondObjection.objection}" | Fear: "${secondObjection.underlyingFear}"`,
      subject: "The real reason most {{niche}} businesses hesitate",
      previewText: "Let's address what's actually holding you back",
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `We've talked to hundreds of {{niche}} business owners. And there's a pattern in what holds people back.\n\n` +
        `It's not the price. It's not the features. It's this: ${secondObjection.underlyingFear.toLowerCase()}.\n\n` +
        `We designed {{brandName}} specifically to solve that. Here's how:\n\n` +
        `${secondObjection.evidenceBasedResponse}\n\n` +
        `${guaranteeLine}\n\n` +
        `The only risk is doing nothing and watching the problem get worse. We've made it as safe as possible to take the next step.\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 21: Competitor differentiation
    {
      stage: 6,
      dayOffset: 21,
      purpose: "Differentiate from alternatives they're comparing",
      intelligenceSource: `Competitors: ${competitors.alternatives.slice(0, 3).join(", ")} | Differentiators: ${competitors.differentiators.slice(0, 2).join(", ")}`,
      subject: "How {{brandName}} compares to what you're already using",
      previewText: "An honest look at your options",
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `If you've been researching solutions for your {{niche}} business, you've probably looked at: ${competitors.alternatives.slice(0, 3).join(", ")}.\n\n` +
        `They're all decent tools. But here's what makes {{brandName}} different:\n\n` +
        competitors.differentiators.map((d) => `• ${d}`).join("\n") + `\n\n` +
        `Switching costs? ${competitors.switchingCosts}\n\n` +
        `We're not asking you to rip and replace anything. We complement what you already have and fill the gaps those tools can't cover.\n\n` +
        `Want a side-by-side comparison tailored to your specific setup? Reply with what you're currently using.\n\n` +
        `— The {{brandName}} team`,
    },

    // Day 30: Final conversion — matched to their psychology
    {
      stage: 7,
      dayOffset: 30,
      purpose: "Final conversion push matched to buyer psychology",
      intelligenceSource: `Motivation: ${psychology.primaryMotivation} | CTA preference: ${psychology.ctaPreference} | Decision style: ${psychology.decisionStyle}`,
      subject: psychology.primaryMotivation === "fear-of-loss" ? "The cost of waiting is real — let's fix this" :
               psychology.primaryMotivation === "competitive-pressure" ? "Your competitors aren't standing still" :
               psychology.primaryMotivation === "compliance" ? "Compliance doesn't get easier by waiting" :
               psychology.primaryMotivation === "efficiency" ? "How many more hours will you lose this month?" :
               "One decision away from a better {{niche}} business",
      previewText: motivationCta,
      bodyTemplate:
        `Hi {{firstName}},\n\n` +
        `It's been 30 days since you first explored {{brandName}} for your {{niche}} business.\n\n` +
        `In that time, here's what could have already happened:\n\n` +
        `• Every lead automatically scored and routed\n` +
        `• Every follow-up sent on time, every time\n` +
        `• A clear dashboard showing exactly what's working\n` +
        `• Hours of manual work eliminated every week\n\n` +
        `${motivationCta}\n\n` +
        `${guaranteeLine}\n\n` +
        (psychology.decisionStyle === "analytical" ?
          `We know you like to see the numbers before committing. Book a strategy session and we'll walk through the ROI projections specific to your {{niche}} business.\n\n` :
         psychology.decisionStyle === "impulsive" ?
          `Don't overthink this. The setup takes less than 48 hours and you'll see results in your first week.\n\n` :
         psychology.decisionStyle === "consensus" ?
          `Need to discuss with your team? We'll send you a one-page summary you can share. Just reply "send summary."\n\n` :
          `Take the first step today. Everything else follows naturally.\n\n`) +
        `— The {{brandName}} team`,
    },
  ];

  return {
    niche: intel.niche,
    nicheLabel: intel.nicheLabel,
    totalEmails: emails.length,
    totalDays: 30,
    strategy:
      `7-email sequence over 30 days. ` +
      `Stage 1 addresses the buying trigger ("${trigger.event}"). ` +
      `Stages 2 and 5 tackle the top two objections with evidence. ` +
      `Stage 3 builds trust via ${trust.socialProofPreference}. ` +
      `Stage 4 shows the ${journey.totalDays}-day decision journey. ` +
      `Stage 6 differentiates from ${competitors.alternatives.slice(0, 2).join(" and ")}. ` +
      `Stage 7 converts using ${psychology.primaryMotivation} motivation with ${psychology.ctaPreference} CTA.`,
    emails,
  };
}

export function getAllIntelligenceNurtureSequences(): Record<string, IntelligenceNurtureSequence> {
  const niches = [
    "service", "legal", "health", "tech", "construction",
    "real-estate", "education", "finance", "franchise",
    "staffing", "faith", "creative", "general",
  ];
  const result: Record<string, IntelligenceNurtureSequence> = {};
  for (const niche of niches) {
    result[niche] = generateIntelligenceNurtureSequence(niche);
  }
  return result;
}

export function getNurtureEmailForStage(niche: string, stage: number): IntelligenceDrivenEmail | undefined {
  const sequence = generateIntelligenceNurtureSequence(niche);
  return sequence.emails.find((e) => e.stage === stage);
}

export function getNurtureStrategy(niche: string): string {
  return generateIntelligenceNurtureSequence(niche).strategy;
}
