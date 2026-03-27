export interface PersonalizationContext {
  visitorId?: string;
  niche?: string;
  funnelFamily?: string;
  funnelStage?: string;
  source?: string;
  device?: string;
  isReturning?: boolean;
  sessionCount?: number;
  score?: number;
  interests?: string[];
  engagementLevel?: "low" | "medium" | "high";
  persona?: string;
  objections?: string[];
  temperature?: "cold" | "warm" | "hot" | "burning";
}

export interface PersonalizedContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  urgencyMessage?: string;
  socialProof?: string;
  trustBadge?: string;
  offerHighlight?: string;
  variant: string;
}

export interface PersonalizedExperience {
  hero: PersonalizedContent;
  popup?: PersonalizedContent;
  chatGreeting?: string;
  recommendedMagnet?: string;
  recommendedFunnel?: string;
  contentBlocks: { id: string; content: PersonalizedContent; priority: number }[];
}

type Temperature = "cold" | "warm" | "hot" | "burning";

interface NicheContent {
  headline: string;
  subheadline: string;
  socialProof: string;
  trustBadge: string;
}

const NICHE_CONTENT: Record<string, Record<Temperature, NicheContent>> = {
  general: {
    cold: {
      headline: "Automate the busywork so you can focus on growth",
      subheadline: "See how businesses like yours eliminate manual follow-up and capture more leads without hiring.",
      socialProof: "Trusted by 200+ service businesses to automate their lead pipeline",
      trustBadge: "Free assessment included",
    },
    warm: {
      headline: "You have been exploring your options. Here is the fastest path forward.",
      subheadline: "Based on what you have looked at, we recommend starting with a focused diagnostic.",
      socialProof: "Most businesses see results within the first 30 days",
      trustBadge: "No commitment required",
    },
    hot: {
      headline: "Ready to stop losing leads? Let us build your system this week.",
      subheadline: "Book a strategy session and walk away with a concrete plan tailored to your business.",
      socialProof: "93% of strategy session attendees move forward within 2 weeks",
      trustBadge: "Money-back guarantee",
    },
    burning: {
      headline: "Your growth system is ready. Let us get you started today.",
      subheadline: "We have everything we need to begin. Pick a time that works for you.",
      socialProof: "Avg. 47% increase in qualified leads within 60 days",
      trustBadge: "Priority onboarding available",
    },
  },
  "client-portal": {
    cold: {
      headline: "Give your clients a branded portal that makes you look ten times your size",
      subheadline: "Stop chasing clients through email threads. Centralize communication, files, and billing in one place.",
      socialProof: "Used by 150+ agencies and consultancies",
      trustBadge: "Free portal walkthrough",
    },
    warm: {
      headline: "Your clients deserve a better experience. See what that looks like.",
      subheadline: "Watch how a branded portal transforms client retention and reduces support tickets.",
      socialProof: "Average 35% reduction in client churn after portal launch",
      trustBadge: "Case studies available",
    },
    hot: {
      headline: "Launch your client portal in under a week",
      subheadline: "Book a setup session and we will configure your branded workspace with your logo, colors, and workflows.",
      socialProof: "Portal setup typically takes 3-5 business days",
      trustBadge: "White-glove setup included",
    },
    burning: {
      headline: "Your portal is staged and ready. Let us go live.",
      subheadline: "We have your configuration ready. Pick a launch date and invite your first clients.",
      socialProof: "Clients report 4.8/5 satisfaction with the portal experience",
      trustBadge: "Launch support included",
    },
  },
  "re-syndication": {
    cold: {
      headline: "Turn one piece of content into a lead-generating engine across every channel",
      subheadline: "Stop creating content from scratch for every platform. Syndicate once, capture leads everywhere.",
      socialProof: "Content syndication clients see 3x more inbound leads",
      trustBadge: "Free content audit",
    },
    warm: {
      headline: "Your content is working harder than you think. Here is how to prove it.",
      subheadline: "See how re-syndication multiplies your best-performing content across channels automatically.",
      socialProof: "Average 280% increase in content reach after syndication",
      trustBadge: "Performance report included",
    },
    hot: {
      headline: "Start syndicating your content this week and watch the leads follow",
      subheadline: "Book a session and we will map out your syndication strategy with immediate next steps.",
      socialProof: "Most clients launch their first campaign within 48 hours",
      trustBadge: "Strategy session included",
    },
    burning: {
      headline: "Your syndication pipeline is ready to launch. Let us flip the switch.",
      subheadline: "Channels mapped, content queued, tracking live. Pick your launch window.",
      socialProof: "Clients average 12 new qualified leads per syndicated piece",
      trustBadge: "Priority launch queue",
    },
  },
  "immigration-law": {
    cold: {
      headline: "Help more families navigate immigration without drowning in intake paperwork",
      subheadline: "Streamline case qualification and client communication so you can focus on the work that matters.",
      socialProof: "Trusted by 40+ immigration law firms",
      trustBadge: "Compliance-first approach",
    },
    warm: {
      headline: "Your intake process is costing you qualified cases. Here is the fix.",
      subheadline: "See how firms like yours reduced intake drop-off by 60% with automated qualification.",
      socialProof: "Average 45% reduction in intake abandonment",
      trustBadge: "Bar-compliant workflows",
    },
    hot: {
      headline: "Qualify cases faster and reduce intake drop-off starting this week",
      subheadline: "Book a consultation and get a tailored intake workflow designed for immigration case types.",
      socialProof: "Firms report 2x more qualified consultations per month",
      trustBadge: "Free intake audit",
    },
    burning: {
      headline: "Your optimized intake system is ready. Let us launch it for your firm.",
      subheadline: "Case type routing, automated follow-up, and client portal are configured. Pick your go-live date.",
      socialProof: "95% client satisfaction with the new intake experience",
      trustBadge: "Dedicated onboarding specialist",
    },
  },
  construction: {
    cold: {
      headline: "Win more bids without spending more time on estimates",
      subheadline: "Automate your bid follow-up, qualification, and scheduling so your team can focus on job sites.",
      socialProof: "Used by 80+ contractors and construction firms",
      trustBadge: "Free bid recovery analysis",
    },
    warm: {
      headline: "You are leaving money on the table with every missed follow-up. Here is proof.",
      subheadline: "See how contractors recover 30% more bids with automated response and qualification systems.",
      socialProof: "Average 28% increase in bid-to-contract conversion",
      trustBadge: "ROI calculator available",
    },
    hot: {
      headline: "Start converting more bids into contracts this month",
      subheadline: "Book a strategy call and get a system built for your trade, territory, and team size.",
      socialProof: "Most contractors see ROI within the first 45 days",
      trustBadge: "Trade-specific templates",
    },
    burning: {
      headline: "Your bid recovery system is built and tested. Time to go live.",
      subheadline: "Automated follow-up, scheduling, and CRM are ready. Launch and start recovering revenue.",
      socialProof: "Contractors report $15K-$50K in recovered revenue in month one",
      trustBadge: "Guaranteed setup in 5 days",
    },
  },
  franchise: {
    cold: {
      headline: "Scale your franchise lead pipeline without scaling your sales team",
      subheadline: "Automate qualification, disclosure delivery, and follow-up across every franchise territory.",
      socialProof: "Serving 25+ franchise brands across North America",
      trustBadge: "FDD-compliant automation",
    },
    warm: {
      headline: "Your franchise leads need faster qualification. Here is how the top brands do it.",
      subheadline: "See how automated scoring and territory routing increase close rates for multi-unit brands.",
      socialProof: "Average 40% faster time-to-qualification for franchise leads",
      trustBadge: "Franchise case studies available",
    },
    hot: {
      headline: "Accelerate your franchise sales process starting this quarter",
      subheadline: "Book a strategy session and get a franchise-specific pipeline built for your brand.",
      socialProof: "Brands report 2.5x improvement in lead-to-Discovery-Day conversion",
      trustBadge: "Multi-territory support included",
    },
    burning: {
      headline: "Your franchise pipeline is configured and ready to launch across territories",
      subheadline: "Territory routing, automated FDD delivery, and scoring are live. Launch when you are ready.",
      socialProof: "Franchise brands average 35% more qualified Discovery Days per quarter",
      trustBadge: "Priority launch support",
    },
  },
  staffing: {
    cold: {
      headline: "Fill more roles faster by automating your candidate and client follow-up",
      subheadline: "Stop losing placements to slow response times. Automate outreach, qualification, and scheduling.",
      socialProof: "Used by 60+ staffing and recruiting firms",
      trustBadge: "Free pipeline audit",
    },
    warm: {
      headline: "Your response time is your competitive advantage. Here is how to win it.",
      subheadline: "See how staffing firms cut time-to-submittal by 50% with automated workflows.",
      socialProof: "Average 45% improvement in submittal-to-interview ratio",
      trustBadge: "Industry benchmarks included",
    },
    hot: {
      headline: "Automate your staffing pipeline and start filling roles faster this month",
      subheadline: "Book a session and get a workflow tailored to your verticals, clients, and team structure.",
      socialProof: "Firms report 30% more placements per recruiter after automation",
      trustBadge: "Vertical-specific templates",
    },
    burning: {
      headline: "Your automated staffing pipeline is ready. Launch and start placing faster.",
      subheadline: "Candidate matching, client follow-up, and scheduling are configured. Go live today.",
      socialProof: "Recruiters save an average of 12 hours per week with the automated pipeline",
      trustBadge: "Same-week launch guaranteed",
    },
  },
};

const TEMPERATURE_CTA: Record<Temperature, { text: string; urlSuffix: string }> = {
  cold: { text: "Get your free assessment", urlSuffix: "/assess" },
  warm: { text: "See the case study", urlSuffix: "/case-studies" },
  hot: { text: "Book your strategy session", urlSuffix: "/book" },
  burning: { text: "Schedule your launch call", urlSuffix: "/book?priority=true" },
};

const TEMPERATURE_MAGNETS: Record<Temperature, string> = {
  cold: "quiz_assessment",
  warm: "report_insight",
  hot: "personalized_service",
  burning: "personalized_service",
};

const TEMPERATURE_FUNNELS: Record<Temperature, string> = {
  cold: "lead-magnet",
  warm: "authority",
  hot: "qualification",
  burning: "qualification",
};

const EXIT_INTENT_COPY: Record<Temperature, { headline: string; subheadline: string; ctaText: string }> = {
  cold: {
    headline: "Wait - grab your free guide before you go",
    subheadline: "Get our most popular resource delivered to your inbox in 30 seconds.",
    ctaText: "Send me the guide",
  },
  warm: {
    headline: "Before you go - see what others in your industry achieved",
    subheadline: "A quick case study showing real results from businesses like yours.",
    ctaText: "Show me the results",
  },
  hot: {
    headline: "Still deciding? Let us make it easy.",
    subheadline: "Book a no-obligation call and get a personalized recommendation in 15 minutes.",
    ctaText: "Book a quick call",
  },
  burning: {
    headline: "We saved your spot. Ready when you are.",
    subheadline: "Your configuration is ready. One click to get started.",
    ctaText: "Get started now",
  },
};

const CHAT_GREETINGS: Record<Temperature, string[]> = {
  cold: [
    "Welcome! Looking for something specific or just exploring?",
    "Hi there! Can I point you in the right direction?",
    "Hey! What brought you here today?",
  ],
  warm: [
    "Welcome back! Anything I can help you find this time?",
    "Good to see you again. Ready to dive deeper?",
    "Hi again! I noticed you have been looking around. Have questions?",
  ],
  hot: [
    "Welcome back! Based on what you have looked at, I think I can save you some time. Want a quick recommendation?",
    "Hey! It looks like you are getting serious. Want to talk through your options?",
    "Good to see you back. Ready to take the next step?",
  ],
  burning: [
    "Welcome back! Everything is ready on our end. Want to get started?",
    "Hey! I see you have been doing your homework. Let us get you set up.",
    "Your setup is staged and ready. Want to pick a launch date?",
  ],
};

const OBJECTION_KEYWORDS: Record<string, string[]> = {
  price: ["expensive", "cost", "price", "afford", "budget", "cheap", "pricing", "investment", "money", "pay"],
  time: ["time", "busy", "how long", "timeline", "schedule", "rush", "urgent", "when", "deadline", "fast"],
  trust: ["scam", "legit", "real", "trust", "guarantee", "refund", "reviews", "proof", "testimonial", "risk"],
  complexity: ["complicated", "complex", "difficult", "hard", "technical", "confusing", "overwhelm", "simple", "easy"],
  fit: ["fit", "right for", "industry", "work for", "my type", "suitable", "relevant", "niche"],
  commitment: ["contract", "lock in", "cancel", "commitment", "obligation", "trial", "free", "no-commitment"],
};

function resolveTemperature(context: PersonalizationContext): Temperature {
  if (context.temperature) return context.temperature;

  const score = context.score ?? 0;
  const sessionCount = context.sessionCount ?? 1;

  if (score >= 85 || context.engagementLevel === "high") return "burning";
  if (score >= 60 || (sessionCount >= 3 && context.isReturning)) return "hot";
  if (score >= 30 || context.isReturning || context.engagementLevel === "medium") return "warm";
  return "cold";
}

function getNicheContent(niche: string, temp: Temperature): NicheContent {
  const nicheMap = NICHE_CONTENT[niche] ?? NICHE_CONTENT["general"];
  return nicheMap[temp];
}

function buildVariantKey(context: PersonalizationContext, temp: Temperature): string {
  return [
    context.niche ?? "general",
    temp,
    context.device ?? "desktop",
    context.isReturning ? "returning" : "new",
  ].join(":");
}

export function resolvePersona(context: PersonalizationContext): string {
  if (context.persona) return context.persona;

  const temp = resolveTemperature(context);
  const stage = context.funnelStage ?? "anonymous";

  if (temp === "burning") return "ready_buyer";
  if (temp === "hot") return "evaluator";
  if (stage === "qualified" || stage === "engaged") return "active_evaluator";
  if (context.isReturning) return "returning_researcher";
  if (context.source === "referral") return "referred_prospect";
  if (context.source === "paid" || context.source === "ad") return "ad_responder";
  return "curious_visitor";
}

export function detectObjections(messages: string[]): string[] {
  const detected = new Set<string>();

  for (const message of messages) {
    const lower = message.toLowerCase();
    for (const [objection, keywords] of Object.entries(OBJECTION_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        detected.add(objection);
      }
    }
  }

  return [...detected];
}

export function getHeroContent(context: PersonalizationContext): PersonalizedContent {
  const temp = resolveTemperature(context);
  const niche = context.niche ?? "general";
  const content = getNicheContent(niche, temp);
  const cta = TEMPERATURE_CTA[temp];

  return {
    headline: content.headline,
    subheadline: content.subheadline,
    ctaText: cta.text,
    ctaUrl: cta.urlSuffix,
    urgencyMessage: temp === "burning"
      ? "Limited availability this week"
      : temp === "hot"
        ? "Spots filling up for this month"
        : undefined,
    socialProof: content.socialProof,
    trustBadge: content.trustBadge,
    offerHighlight: temp === "burning"
      ? "Priority onboarding with dedicated support"
      : temp === "hot"
        ? "Free strategy session with actionable takeaways"
        : undefined,
    variant: buildVariantKey(context, temp),
  };
}

export function getChatGreeting(context: PersonalizationContext): string {
  const temp = resolveTemperature(context);
  const greetings = CHAT_GREETINGS[temp];
  const index = Math.floor(Math.random() * greetings.length);
  return greetings[index];
}

export function getExitIntentOffer(context: PersonalizationContext): PersonalizedContent {
  const temp = resolveTemperature(context);
  const exitCopy = EXIT_INTENT_COPY[temp];
  const niche = context.niche ?? "general";
  const content = getNicheContent(niche, temp);

  return {
    headline: exitCopy.headline,
    subheadline: exitCopy.subheadline,
    ctaText: exitCopy.ctaText,
    ctaUrl: temp === "hot" || temp === "burning" ? "/book" : "/lead-magnet",
    socialProof: content.socialProof,
    trustBadge: content.trustBadge,
    variant: `exit:${buildVariantKey(context, temp)}`,
  };
}

export function getRecommendedFunnel(context: PersonalizationContext): string {
  if (context.funnelFamily) return context.funnelFamily;
  const temp = resolveTemperature(context);
  return TEMPERATURE_FUNNELS[temp];
}

export function personalize(context: PersonalizationContext): PersonalizedExperience {
  const temp = resolveTemperature(context);
  const hero = getHeroContent(context);
  const chatGreeting = getChatGreeting(context);
  const recommendedMagnet = TEMPERATURE_MAGNETS[temp];
  const recommendedFunnel = getRecommendedFunnel(context);

  const contentBlocks: PersonalizedExperience["contentBlocks"] = [];

  if (temp === "cold" || temp === "warm") {
    contentBlocks.push({
      id: "lead-magnet-offer",
      content: {
        headline: "Get a head start with a free resource",
        subheadline: "Actionable insights you can apply immediately, no strings attached.",
        ctaText: "Download now",
        ctaUrl: "/lead-magnet",
        socialProof: hero.socialProof,
        variant: `block:magnet:${hero.variant}`,
      },
      priority: 1,
    });
  }

  if (temp === "warm" || temp === "hot") {
    const niche = context.niche ?? "general";
    const warmContent = getNicheContent(niche, "warm");
    contentBlocks.push({
      id: "case-study",
      content: {
        headline: "See how others did it",
        subheadline: warmContent.subheadline,
        ctaText: "Read the case study",
        ctaUrl: "/case-studies",
        socialProof: warmContent.socialProof,
        variant: `block:case:${hero.variant}`,
      },
      priority: temp === "warm" ? 1 : 2,
    });
  }

  if (temp === "hot" || temp === "burning") {
    contentBlocks.push({
      id: "booking-cta",
      content: {
        headline: "Talk to someone who gets your industry",
        subheadline: "15 minutes, no pressure. Walk away with a clear plan either way.",
        ctaText: "Book a call",
        ctaUrl: "/book",
        urgencyMessage: temp === "burning" ? "Limited spots this week" : undefined,
        socialProof: hero.socialProof,
        variant: `block:book:${hero.variant}`,
      },
      priority: 1,
    });
  }

  if (context.objections && context.objections.length > 0) {
    contentBlocks.push({
      id: "objection-handler",
      content: buildObjectionContent(context.objections, hero.variant),
      priority: 2,
    });
  }

  contentBlocks.sort((a, b) => a.priority - b.priority);

  const popup = (temp === "cold" || temp === "warm")
    ? getExitIntentOffer(context)
    : undefined;

  return {
    hero,
    popup,
    chatGreeting,
    recommendedMagnet,
    recommendedFunnel,
    contentBlocks,
  };
}

function buildObjectionContent(objections: string[], variant: string): PersonalizedContent {
  const objectionResponses: Record<string, string> = {
    price: "We offer flexible plans starting at a fraction of what a full-time hire costs.",
    time: "Most clients are fully set up within 5 business days with minimal time investment on your end.",
    trust: "We offer a satisfaction guarantee and can share references from businesses in your industry.",
    complexity: "We handle the technical setup. You focus on your business. It is that simple.",
    fit: "We specialize in your industry and have templates built specifically for your use case.",
    commitment: "No long-term contracts. Cancel anytime. Start with a free assessment to see if it fits.",
  };

  const responses = objections
    .map((o) => objectionResponses[o])
    .filter((r): r is string => r !== undefined);

  return {
    headline: "We hear you. Here is what you should know.",
    subheadline: responses[0] ?? "We built this for businesses exactly like yours.",
    ctaText: "See how it works",
    ctaUrl: "/how-it-works",
    variant: `block:objection:${variant}`,
  };
}
