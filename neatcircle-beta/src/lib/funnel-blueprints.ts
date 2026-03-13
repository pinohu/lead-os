// GERU Funnel Blueprint Implementations
// Maps the 31 GERU visual funnel flowcharts into executable step sequences
// Each blueprint defines: steps, CTAs, scoring triggers, abandonment recovery, and conversion paths
import { siteConfig } from "@/lib/site-config";

export type FunnelCategory =
  | "agency"
  | "high-ticket"
  | "lead-capture"
  | "content"
  | "retention"
  | "webinar"
  | "ecommerce"
  | "membership"
  | "launch";

export type VisitorTemperature = "cold" | "warm" | "hot" | "customer";
export type ObjectionType = "price" | "trust" | "timing" | "complexity" | "none";
export type ChannelPreference = "email" | "whatsapp" | "chat" | "sales-call";

export interface FunnelStep {
  id: string;
  type: "landing" | "assessment" | "calculator" | "results" | "offer" | "booking" | "upsell" | "downsell" | "confirmation" | "content";
  page: string;                    // URL path
  headline: string;
  subtext: string;
  cta: string;
  ctaUrl: string;
  scoreBoost: { intent?: number; engagement?: number; urgency?: number };
  abandonRecovery?: {
    trigger: "exit_intent" | "timeout" | "scroll_back";
    offer: string;
    fallbackUrl: string;
  };
}

export interface FunnelBlueprint {
  id: string;
  name: string;
  category: FunnelCategory;
  description: string;
  steps: FunnelStep[];
  idealFor: string[];              // Niche slugs this blueprint works best for
  entryConditions: {               // When to activate this blueprint
    minEngagement?: number;
    minIntent?: number;
    hasEmail?: boolean;
    hasAssessment?: boolean;
    hasCalculator?: boolean;
    minSessions?: number;
    viewedPages?: string[];
  };
  conversionGoal: string;
  expectedCVR: string;             // Benchmark from research
}

export interface BlueprintRecommendation {
  blueprint: FunnelBlueprint;
  niche: string;
  temperature: VisitorTemperature;
  objection: ObjectionType;
  channel: ChannelPreference;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 1: Agency Client-Audit (Assessment → Results → Consult)
// GERU: "Agency Client-Audit Funnel" — 40% CVR for interactive quizzes
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_CLIENT_AUDIT: FunnelBlueprint = {
  id: "client-audit",
  name: "Client Audit Funnel",
  category: "agency",
  description: "Assessment quiz → personalized results → consultation booking. Highest conversion blueprint at 40% quiz completion → 25% consultation booking.",
  steps: [
    {
      id: "audit-landing",
      type: "landing",
      page: "/assess/{niche}",
      headline: "Free {Niche} Assessment",
      subtext: "5 questions. 2 minutes. Personalized recommendations.",
      cta: "Start My Assessment",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 5 },
    },
    {
      id: "audit-quiz",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Question {n} of 5",
      subtext: "Select the option that best describes your situation",
      cta: "Next",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 10, intent: 15 },
      abandonRecovery: {
        trigger: "exit_intent",
        offer: "You're almost done! Complete your assessment to get your free personalized report.",
        fallbackUrl: "/assess/{niche}",
      },
    },
    {
      id: "audit-capture",
      type: "offer",
      page: "/assess/{niche}",
      headline: "Your results are ready!",
      subtext: "Enter your email to get your personalized report",
      cta: "Get My Results",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 25 },
    },
    {
      id: "audit-results",
      type: "results",
      page: "/assess/{niche}",
      headline: "Your Score: {tier}",
      subtext: "{tierMessage}",
      cta: "Book Your Free Strategy Session",
      ctaUrl: "#contact",
      scoreBoost: { intent: 15, urgency: 10 },
    },
    {
      id: "audit-upsell",
      type: "upsell",
      page: "/calculator",
      headline: "See your exact ROI numbers",
      subtext: "Calculate how much automation saves your specific business",
      cta: "Calculate My ROI",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 20 },
    },
  ],
  idealFor: ["client-portal", "re-syndication", "immigration-law", "construction", "franchise", "managed-services", "compliance-training"],
  entryConditions: {},
  conversionGoal: "consultation_booked",
  expectedCVR: "40% quiz start → 25% consultation",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 2: Agency Lead Gen (Content → Opt-in → Nurture)
// GERU: "Agency Lead Gen Funnel" — Default top-of-funnel for cold traffic
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_LEAD_GEN: FunnelBlueprint = {
  id: "lead-gen",
  name: "Lead Generation Funnel",
  category: "agency",
  description: "Blog/content → exit-intent capture → email nurture → assessment → consult. Default funnel for organic/paid traffic.",
  steps: [
    {
      id: "lg-content",
      type: "content",
      page: "/services/{niche}",
      headline: "{Niche} Solutions",
      subtext: "Learn how automation transforms {niche} businesses",
      cta: "See What's Possible",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 5 },
    },
    {
      id: "lg-engage",
      type: "landing",
      page: "/",
      headline: "Stop Paying for Software. Start Growing.",
      subtext: "209+ premium tools included",
      cta: "Take Free Assessment",
      ctaUrl: "/assess/general",
      scoreBoost: { engagement: 3 },
      abandonRecovery: {
        trigger: "exit_intent",
        offer: "Before you go — free Business Automation Assessment",
        fallbackUrl: "/assess/general",
      },
    },
    {
      id: "lg-capture",
      type: "offer",
      page: "/assess/general",
      headline: "Discover your automation potential",
      subtext: "2-minute assessment with personalized recommendations",
      cta: "Start Assessment",
      ctaUrl: "/assess/general",
      scoreBoost: { intent: 10 },
    },
    {
      id: "lg-nurture",
      type: "content",
      page: "/calculator",
      headline: "Calculate Your ROI",
      subtext: "See exactly how much you'd save",
      cta: "Calculate Now",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 15 },
    },
  ],
  idealFor: ["general", "digital-transformation", "process-automation", "systems-integration", "business-intelligence"],
  entryConditions: {},
  conversionGoal: "email_captured",
  expectedCVR: "13.9% multi-step form → 8% email capture",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 3: Agency Value Ladder (Free → Starter → Pro → Enterprise)
// GERU: "Agency Value Ladder Funnel" — Multi-tier ascending offer
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_VALUE_LADDER: FunnelBlueprint = {
  id: "value-ladder",
  name: "Value Ladder Funnel",
  category: "agency",
  description: "Free assessment → $3.5K Starter audit → $7.5K Professional → $15K+ Enterprise. Progressive commitment path.",
  steps: [
    {
      id: "vl-free",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Free: {Niche} Readiness Assessment",
      subtext: "Discover where you stand",
      cta: "Get My Free Score",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 5 },
    },
    {
      id: "vl-roi",
      type: "calculator",
      page: "/calculator",
      headline: "See Your Potential Savings",
      subtext: "Calculate your automation ROI",
      cta: "Calculate ROI",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 15 },
    },
    {
      id: "vl-starter",
      type: "offer",
      page: "/services/{niche}",
      headline: "Starter: $3,500 Setup",
      subtext: "Client portal + CRM + 3 automations. Everything you need to start.",
      cta: "Get Started",
      ctaUrl: "#contact",
      scoreBoost: { intent: 20, urgency: 10 },
      abandonRecovery: {
        trigger: "scroll_back",
        offer: "Not ready for Starter? Try our free assessment first.",
        fallbackUrl: "/assess/{niche}",
      },
    },
    {
      id: "vl-professional",
      type: "upsell",
      page: "/services/{niche}",
      headline: "Professional: $7,500 Setup",
      subtext: "Advanced portal + 10 automations + LMS + analytics. For growing companies.",
      cta: "Upgrade to Professional",
      ctaUrl: "#contact",
      scoreBoost: { intent: 25, urgency: 15 },
    },
    {
      id: "vl-enterprise",
      type: "upsell",
      page: "/services/{niche}",
      headline: "Enterprise: Custom Pricing",
      subtext: "Unlimited automations + API integrations + dedicated account manager.",
      cta: "Request Custom Proposal",
      ctaUrl: "#contact",
      scoreBoost: { intent: 30, urgency: 20 },
    },
  ],
  idealFor: ["client-portal", "managed-services", "digital-transformation", "franchise"],
  entryConditions: { hasAssessment: true },
  conversionGoal: "tier_selected",
  expectedCVR: "15% assessment → 8% starter → 3% professional",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 4: High Ticket Call (Qualify → Apply → Book)
// GERU: "High Ticket Call 2 Funnel" — For $7.5K+ engagements
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_HIGH_TICKET: FunnelBlueprint = {
  id: "high-ticket-call",
  name: "High-Ticket Consultation Funnel",
  category: "high-ticket",
  description: "Assessment qualifies → ROI calculation justifies → application applies → call books. For Professional ($7.5K) and Enterprise ($15K+) tiers.",
  steps: [
    {
      id: "ht-qualify",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Is {Niche} Automation Right for You?",
      subtext: "Quick qualification to see if we're a fit",
      cta: "Check My Fit",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 15 },
    },
    {
      id: "ht-justify",
      type: "calculator",
      page: "/calculator",
      headline: "Your Projected ROI",
      subtext: "Here's what automation saves businesses like yours",
      cta: "See My Numbers",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 20 },
    },
    {
      id: "ht-apply",
      type: "offer",
      page: "#contact",
      headline: "Apply for a Strategy Session",
      subtext: "We accept a limited number of clients per month to ensure quality delivery.",
      cta: "Apply Now",
      ctaUrl: "#contact",
      scoreBoost: { intent: 30, urgency: 20 },
      abandonRecovery: {
        trigger: "exit_intent",
        offer: "Spots are limited this month. Apply now to secure your session.",
        fallbackUrl: "#contact",
      },
    },
    {
      id: "ht-book",
      type: "booking",
      page: "#contact",
      headline: "You're Qualified!",
      subtext: "Book your free 30-minute strategy session",
      cta: "Book My Session",
      ctaUrl: "#contact",
      scoreBoost: { intent: 30, urgency: 25 },
    },
  ],
  idealFor: ["re-syndication", "franchise", "immigration-law", "compliance-training"],
  entryConditions: { hasAssessment: true, minIntent: 50 },
  conversionGoal: "consultation_booked",
  expectedCVR: "25% qualified → 15% applied → 60% booked",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 5: Chatbot Lead (Chat → Qualify → Capture → Route)
// GERU: "Chatbot Lead Funnel" — Speed-to-lead: <1 min = 73% booking
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_CHATBOT: FunnelBlueprint = {
  id: "chatbot-lead",
  name: "Chatbot Lead Funnel",
  category: "lead-capture",
  description: "Chat widget engages → qualifies via conversation → captures email/phone → routes to niche assessment or direct booking. Sub-60-second response.",
  steps: [
    {
      id: "cb-greet",
      type: "landing",
      page: "#chat-widget",
      headline: `${siteConfig.brandName} Concierge`,
      subtext: "Ask anything about {niche} automation",
      cta: "Start Chat",
      ctaUrl: "#chat-widget",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "cb-qualify",
      type: "content",
      page: "#chat-widget",
      headline: "Understanding your needs",
      subtext: "Chat interaction qualifies visitor intent",
      cta: "Continue",
      ctaUrl: "#chat-widget",
      scoreBoost: { engagement: 15, intent: 10 },
    },
    {
      id: "cb-capture",
      type: "offer",
      page: "#chat-widget",
      headline: "Get personalized recommendations",
      subtext: "Share your email for a detailed follow-up",
      cta: "Send Recommendations",
      ctaUrl: "#chat-widget",
      scoreBoost: { intent: 25 },
    },
    {
      id: "cb-route",
      type: "results",
      page: "/assess/{niche}",
      headline: "Based on our conversation...",
      subtext: "Take this quick assessment for specific recommendations",
      cta: "Get My Assessment",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 15 },
    },
  ],
  idealFor: ["client-portal", "digital-transformation", "staffing", "church-management", "creator-management"],
  entryConditions: {},
  conversionGoal: "email_captured",
  expectedCVR: "73% booking rate when response < 1 min",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 6: Appointment Generator (Landing → Form → Calendar)
// GERU: "Appointment Generator Funnel" — Direct booking
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_APPOINTMENT: FunnelBlueprint = {
  id: "appointment-gen",
  name: "Appointment Generator Funnel",
  category: "agency",
  description: "Service page → contact form with qualification fields → confirmation. Simple, direct path for high-intent visitors.",
  steps: [
    {
      id: "apt-land",
      type: "landing",
      page: "/services/{niche}",
      headline: "{Niche} Automation Solutions",
      subtext: "209+ tools included. Zero licensing fees.",
      cta: "Schedule a Call",
      ctaUrl: "#contact",
      scoreBoost: { intent: 10 },
    },
    {
      id: "apt-form",
      type: "offer",
      page: "#contact",
      headline: "Book Your Free Discovery Call",
      subtext: "Tell us about your business and we'll prepare a custom walkthrough",
      cta: "Book Now",
      ctaUrl: "#contact",
      scoreBoost: { intent: 25, urgency: 15 },
    },
    {
      id: "apt-confirm",
      type: "confirmation",
      page: "/thank-you",
      headline: "You're All Set!",
      subtext: "Check your email for confirmation. We'll send a prep questionnaire before our call.",
      cta: "Take Assessment While You Wait",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 5 },
    },
  ],
  idealFor: ["construction", "staffing", "managed-services", "process-automation"],
  entryConditions: { minIntent: 30 },
  conversionGoal: "consultation_booked",
  expectedCVR: "12% landing → 8% form → 80% confirmed",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 7: Cart/Funnel Abandonment Recovery
// GERU: "Cart Abandonment Funnel" — Applied to assessment/calculator drops
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_ABANDONMENT: FunnelBlueprint = {
  id: "abandonment-recovery",
  name: "Funnel Abandonment Recovery",
  category: "retention",
  description: "Detects mid-funnel drop-off → exit-intent with downsell → email follow-up → retarget to simpler offer. Recovers 15-25% of abandonments.",
  steps: [
    {
      id: "ab-detect",
      type: "landing",
      page: "/_abandoned",
      headline: "Detecting drop-off",
      subtext: "Visitor left assessment/calculator mid-way",
      cta: "Resume",
      ctaUrl: "/assess/{niche}",
      scoreBoost: {},
    },
    {
      id: "ab-exit-popup",
      type: "offer",
      page: "/_popup",
      headline: "Wait — don't lose your progress!",
      subtext: "Save your assessment to continue later",
      cta: "Save & Email My Results",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 5 },
    },
    {
      id: "ab-downsell",
      type: "downsell",
      page: "/_downsell",
      headline: "Not ready for a full assessment?",
      subtext: "Get our free automation checklist instead — 2 pages, instant download.",
      cta: "Send Me the Checklist",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 5, engagement: 5 },
    },
    {
      id: "ab-retarget",
      type: "content",
      page: "/calculator",
      headline: "Try our simpler ROI calculator instead",
      subtext: "Just 4 sliders. See your savings in 30 seconds.",
      cta: "Calculate My ROI",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 10 },
    },
  ],
  idealFor: ["general"],
  entryConditions: { minSessions: 2 },
  conversionGoal: "email_captured",
  expectedCVR: "15-25% recovery rate",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 8: Bridge Funnel (Pre-frame → Main Offer)
// GERU: "Bridge Funnel" — Warms cold traffic before main funnel
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_BRIDGE: FunnelBlueprint = {
  id: "bridge",
  name: "Bridge Funnel",
  category: "lead-capture",
  description: "Pre-frame page educates and warms cold traffic before sending to main assessment funnel. Used for paid ads and cold referrals.",
  steps: [
    {
      id: "br-preframe",
      type: "content",
      page: "/services/{niche}",
      headline: "How {Niche} Companies Save $100K+/Year",
      subtext: "See the 3 automation strategies top companies use",
      cta: "Show Me How",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 8 },
    },
    {
      id: "br-proof",
      type: "content",
      page: "/services/{niche}",
      headline: "Case Study: {Niche} Client Results",
      subtext: "40-60% cost savings, 30-day implementation",
      cta: "Get My Assessment",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 5, intent: 10 },
    },
    {
      id: "br-handoff",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Your Free {Niche} Assessment",
      subtext: "See how you compare to top performers in your industry",
      cta: "Start Now",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 15 },
    },
  ],
  idealFor: ["general", "digital-transformation"],
  entryConditions: { viewedPages: ["/services"] },
  conversionGoal: "assessment_started",
  expectedCVR: "35% bridge → 40% assessment start",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 9: Mini Class (Education → Offer)
// GERU: "Mini Class Funnel" — Educational content builds trust
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_MINI_CLASS: FunnelBlueprint = {
  id: "mini-class",
  name: "Mini Class Funnel",
  category: "content",
  description: "3-part educational content series → assessment → offer. Builds authority and trust over multiple touchpoints.",
  steps: [
    {
      id: "mc-lesson1",
      type: "content",
      page: "/services/{niche}",
      headline: "Lesson 1: The Hidden Cost of Manual Processes",
      subtext: "Why 67% of businesses overpay for software they don't need",
      cta: "Next Lesson",
      ctaUrl: "/calculator",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "mc-lesson2",
      type: "calculator",
      page: "/calculator",
      headline: "Lesson 2: Calculate Your Real Cost",
      subtext: "Use our ROI calculator to find your specific numbers",
      cta: "See My Numbers",
      ctaUrl: "/calculator",
      scoreBoost: { engagement: 10, intent: 15 },
    },
    {
      id: "mc-lesson3",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Lesson 3: Your Personalized Action Plan",
      subtext: "Take the assessment to get specific recommendations",
      cta: "Get My Plan",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 10, intent: 20 },
    },
    {
      id: "mc-offer",
      type: "offer",
      page: "#contact",
      headline: "Ready to implement your plan?",
      subtext: "Book a free session to discuss next steps",
      cta: "Book My Session",
      ctaUrl: "#contact",
      scoreBoost: { intent: 25, urgency: 10 },
    },
  ],
  idealFor: ["compliance-training", "business-intelligence", "training-platform"],
  entryConditions: {},
  conversionGoal: "consultation_booked",
  expectedCVR: "20% complete all 3 → 30% book",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 10: Customer Onboarding (Post-conversion activation)
// GERU: "Customer Onboarding Funnel" — Reduces churn, increases LTV
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_ONBOARDING: FunnelBlueprint = {
  id: "customer-onboarding",
  name: "Customer Onboarding Funnel",
  category: "retention",
  description: "Welcome → portal setup → first value delivery → satisfaction check → referral request. Post-conversion activation sequence.",
  steps: [
    {
      id: "on-welcome",
      type: "confirmation",
      page: "/dashboard",
      headline: `Welcome to ${siteConfig.brandName}!`,
      subtext: "Your portal is being set up. Here's what happens next.",
      cta: "View My Portal",
      ctaUrl: "/dashboard",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "on-setup",
      type: "content",
      page: "/dashboard",
      headline: "Quick Start Guide",
      subtext: "3 things to do in your first 24 hours",
      cta: "Start Setup",
      ctaUrl: "/dashboard",
      scoreBoost: { engagement: 15 },
    },
    {
      id: "on-value",
      type: "content",
      page: "/dashboard",
      headline: "Your First Automation is Live",
      subtext: "See what it's already saving you",
      cta: "View Savings",
      ctaUrl: "/dashboard",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "on-referral",
      type: "offer",
      page: "/refer",
      headline: `Loving ${siteConfig.brandName}?`,
      subtext: "Share with a colleague — you both get 10% off",
      cta: "Share My Link",
      ctaUrl: "/refer",
      scoreBoost: { engagement: 5 },
    },
  ],
  idealFor: ["general"],
  entryConditions: { hasEmail: true },
  conversionGoal: "referral_sent",
  expectedCVR: "40% complete onboarding → 15% refer",
};

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT 11: Back to Basics (Simple Opt-in → Nurture)
// GERU: "Back to Basics Funnel" — Simplest possible capture
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_BASICS: FunnelBlueprint = {
  id: "back-to-basics",
  name: "Back to Basics Funnel",
  category: "lead-capture",
  description: "Single landing page → email capture → nurture sequence. For cold traffic that's not ready for assessment.",
  steps: [
    {
      id: "bb-land",
      type: "landing",
      page: "/",
      headline: "Free: The Business Automation Playbook",
      subtext: "How 209+ tools work together to save you $100K+/year",
      cta: "Get the Playbook",
      ctaUrl: "#contact",
      scoreBoost: { engagement: 5 },
    },
    {
      id: "bb-capture",
      type: "offer",
      page: "#contact",
      headline: "Where should we send it?",
      subtext: "Enter your email for instant access",
      cta: "Send It",
      ctaUrl: "#contact",
      scoreBoost: { intent: 10 },
    },
  ],
  idealFor: ["general"],
  entryConditions: {},
  conversionGoal: "email_captured",
  expectedCVR: "8-12% landing → email",
};

// ═══════════════════════════════════════════════════════════════
// ALL BLUEPRINTS REGISTRY
// ═══════════════════════════════════════════════════════════════
export const BLUEPRINT_WEBINAR_LIVE: FunnelBlueprint = {
  id: "webinar-live",
  name: "Live Webinar Funnel",
  category: "webinar",
  description: "Registration to reminder to live event to consultation. Best for trust-heavy or education-heavy service offers.",
  steps: [
    {
      id: "wl-register",
      type: "offer",
      page: "/services/{niche}",
      headline: "Reserve Your Spot: Live {Niche} Strategy Session",
      subtext: "Join a live walkthrough of the systems top operators use to remove friction and close faster.",
      cta: "Reserve My Seat",
      ctaUrl: "#contact",
      scoreBoost: { engagement: 10, intent: 15 },
    },
    {
      id: "wl-remind",
      type: "calculator",
      page: "/calculator",
      headline: "Before the live session, estimate your upside",
      subtext: "Use the ROI calculator so the session can be tailored to your real numbers.",
      cta: "Estimate My ROI",
      ctaUrl: "/calculator",
      scoreBoost: { engagement: 10, intent: 15, urgency: 10 },
    },
    {
      id: "wl-offer",
      type: "booking",
      page: "#contact",
      headline: "Stay after for a private strategy call",
      subtext: "Attendees with a strong fit can book a one-to-one implementation session.",
      cta: "Apply for the Private Session",
      ctaUrl: "#contact",
      scoreBoost: { intent: 25, urgency: 20 },
    },
  ],
  idealFor: ["re-syndication", "franchise", "business-intelligence", "training-platform"],
  entryConditions: { hasEmail: true, minEngagement: 35 },
  conversionGoal: "consultation_booked",
  expectedCVR: "25-40% registration to 10-20% consultation",
};

export const BLUEPRINT_WEBINAR_EVERGREEN: FunnelBlueprint = {
  id: "webinar-evergreen",
  name: "Evergreen Webinar Funnel",
  category: "launch",
  description: "On-demand education to calculator or assessment to consultation.",
  steps: [
    {
      id: "we-watch",
      type: "content",
      page: "/services/{niche}",
      headline: "Watch the on-demand {Niche} growth system breakdown",
      subtext: "A self-paced walkthrough of the highest-leverage fixes for your operation.",
      cta: "Watch the Breakdown",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 12 },
    },
    {
      id: "we-qualify",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "See how your operation compares",
      subtext: "Take the assessment to translate the training into a personalized action plan.",
      cta: "Get My Score",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 18 },
    },
    {
      id: "we-book",
      type: "booking",
      page: "#contact",
      headline: "Ready to turn the on-demand plan into a real build?",
      subtext: "Book a working session and we will map your first implementation milestone.",
      cta: "Book My Working Session",
      ctaUrl: "#contact",
      scoreBoost: { intent: 22, urgency: 12 },
    },
  ],
  idealFor: ["digital-transformation", "process-automation", "systems-integration", "business-intelligence"],
  entryConditions: { hasEmail: true, minSessions: 2 },
  conversionGoal: "consultation_booked",
  expectedCVR: "20-35% viewer to 8-15% consultation",
};

export const BLUEPRINT_GIVEAWAY: FunnelBlueprint = {
  id: "giveaway-capture",
  name: "Giveaway Lead Capture Funnel",
  category: "lead-capture",
  description: "High-volume opt-in with a strong incentive followed by qualification and nurture.",
  steps: [
    {
      id: "gv-entry",
      type: "landing",
      page: "/",
      headline: "Win a free {Niche} automation audit",
      subtext: "Enter for a chance to get a custom teardown and implementation roadmap.",
      cta: "Enter the Giveaway",
      ctaUrl: "#contact",
      scoreBoost: { engagement: 6 },
    },
    {
      id: "gv-capture",
      type: "offer",
      page: "#contact",
      headline: "Tell us where to send your entry confirmation",
      subtext: "We will also send a short qualification checklist so we can personalize the audit.",
      cta: "Confirm My Entry",
      ctaUrl: "#contact",
      scoreBoost: { intent: 10 },
    },
    {
      id: "gv-qualify",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Increase your odds with a quick fit check",
      subtext: "Answer five questions so the audit is matched to your business model.",
      cta: "Complete My Fit Check",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 15, engagement: 10 },
    },
  ],
  idealFor: ["general", "digital-transformation", "construction", "staffing"],
  entryConditions: { minEngagement: 10 },
  conversionGoal: "email_captured",
  expectedCVR: "25-45% opt-in with lower initial intent",
};

export const BLUEPRINT_DOCUMENTARY: FunnelBlueprint = {
  id: "documentary-vsl",
  name: "Documentary / VSL Funnel",
  category: "content",
  description: "Story-led authority funnel that builds trust before the assessment or consult.",
  steps: [
    {
      id: "dv-hook",
      type: "content",
      page: "/services/{niche}",
      headline: "Why top {Niche} operators stopped buying more software",
      subtext: "A proof-led breakdown of how they removed drag without adding tech sprawl.",
      cta: "See the Full Story",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "dv-proof",
      type: "calculator",
      page: "/calculator",
      headline: "Now compare that story to your numbers",
      subtext: "Use the ROI calculator to quantify your own cost of delay.",
      cta: "Run My Numbers",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 18 },
    },
    {
      id: "dv-handoff",
      type: "booking",
      page: "#contact",
      headline: "Ready for your version of the same outcome?",
      subtext: "Book a consult and we will map the first 30 days of implementation.",
      cta: "Map My First 30 Days",
      ctaUrl: "#contact",
      scoreBoost: { intent: 20, urgency: 10 },
    },
  ],
  idealFor: ["franchise", "managed-services", "re-syndication", "creator-management"],
  entryConditions: { minSessions: 2 },
  conversionGoal: "consultation_booked",
  expectedCVR: "Lower opt-in, higher downstream close rate",
};

export const BLUEPRINT_PRODUCT_SALES: FunnelBlueprint = {
  id: "product-sales",
  name: "Productized Sales Funnel",
  category: "ecommerce",
  description: "Fixed-scope or low-ticket productized service funnel with upsell logic.",
  steps: [
    {
      id: "ps-offer",
      type: "offer",
      page: "/services/{niche}",
      headline: "{Niche} implementation starter package",
      subtext: "A fixed-scope offer for teams that want quick wins without a full custom rollout.",
      cta: "See the Starter Package",
      ctaUrl: "/services/{niche}",
      scoreBoost: { intent: 15 },
    },
    {
      id: "ps-proof",
      type: "calculator",
      page: "/calculator",
      headline: "Check if the starter package pays for itself",
      subtext: "Use your numbers to validate a fast-start engagement.",
      cta: "Validate the ROI",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 18 },
    },
    {
      id: "ps-close",
      type: "booking",
      page: "#contact",
      headline: "Lock in your starter implementation",
      subtext: "We will confirm scope, timeline, and kickoff immediately after submission.",
      cta: "Start My Implementation",
      ctaUrl: "#contact",
      scoreBoost: { intent: 25, urgency: 20 },
    },
  ],
  idealFor: ["process-automation", "training-platform", "business-intelligence"],
  entryConditions: { hasCalculator: true },
  conversionGoal: "offer_started",
  expectedCVR: "5-12% to starter purchase or commitment",
};

export const BLUEPRINT_COUPON: FunnelBlueprint = {
  id: "coupon-offer",
  name: "Coupon / Price Rescue Funnel",
  category: "ecommerce",
  description: "Used when the visitor shows price sensitivity and needs a lower-friction next step.",
  steps: [
    {
      id: "cpn-save",
      type: "downsell",
      page: "/pricing",
      headline: "Need a lower-risk starting point?",
      subtext: "We can begin with a smaller scoped sprint and apply the savings to the full rollout later.",
      cta: "Show Me the Lower-Risk Option",
      ctaUrl: "/calculator",
      scoreBoost: { urgency: 10, intent: 12 },
    },
    {
      id: "cpn-proof",
      type: "calculator",
      page: "/calculator",
      headline: "See how quickly the smaller start pays back",
      subtext: "Validate the economics before committing to the full build.",
      cta: "Calculate My Payback",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 15 },
    },
    {
      id: "cpn-next",
      type: "booking",
      page: "#contact",
      headline: "Secure the reduced-risk kickoff",
      subtext: "We will recommend the smallest viable build that still creates measurable savings.",
      cta: "Reserve My Kickoff",
      ctaUrl: "#contact",
      scoreBoost: { intent: 20, urgency: 18 },
    },
  ],
  idealFor: ["general", "process-automation", "systems-integration", "construction"],
  entryConditions: { viewedPages: ["/pricing"] },
  conversionGoal: "consultation_booked",
  expectedCVR: "Branch funnel used to recover price objections",
};

export const BLUEPRINT_FREEMIUM: FunnelBlueprint = {
  id: "freemium-membership",
  name: "Freemium Membership Funnel",
  category: "membership",
  description: "Free toolkit or portal access followed by activation and premium upgrade.",
  steps: [
    {
      id: "fm-free",
      type: "offer",
      page: "/assess/{niche}",
      headline: "Get the free {Niche} operations toolkit",
      subtext: "Templates, checklists, and diagnostic tools to improve your process maturity.",
      cta: "Unlock the Toolkit",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { engagement: 8, intent: 10 },
    },
    {
      id: "fm-activate",
      type: "calculator",
      page: "/calculator",
      headline: "Turn the toolkit into a working plan",
      subtext: "Use the calculator and assessment results together to prioritize your first move.",
      cta: "Build My Action Plan",
      ctaUrl: "/calculator",
      scoreBoost: { engagement: 10, intent: 15 },
    },
    {
      id: "fm-upgrade",
      type: "upsell",
      page: "#contact",
      headline: "Want us to implement it with you?",
      subtext: "Upgrade from free planning to a guided build-out with automation and training.",
      cta: "Upgrade to Guided Implementation",
      ctaUrl: "#contact",
      scoreBoost: { intent: 20, urgency: 10 },
    },
  ],
  idealFor: ["training-platform", "compliance-training", "business-intelligence"],
  entryConditions: { hasEmail: true },
  conversionGoal: "upgrade_started",
  expectedCVR: "Strong top-of-funnel growth with slower but steady upgrade conversion",
};

export const BLUEPRINT_CONTINUITY: FunnelBlueprint = {
  id: "continuity",
  name: "Micro Continuity Funnel",
  category: "membership",
  description: "Post-conversion cadence that moves customers into ongoing advisory, support, or optimization.",
  steps: [
    {
      id: "cty-value",
      type: "content",
      page: "/dashboard",
      headline: "Your system is live. Want monthly optimization too?",
      subtext: "Get a recurring tune-up, dashboard review, and automation refinement cycle.",
      cta: "See the Optimization Program",
      ctaUrl: "/dashboard",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "cty-proof",
      type: "results",
      page: "/dashboard",
      headline: "Here is what continuous tuning can unlock",
      subtext: "Clients who stay in optimization mode usually compound savings quarter over quarter.",
      cta: "Show My Upgrade Path",
      ctaUrl: "#contact",
      scoreBoost: { intent: 15 },
    },
    {
      id: "cty-upgrade",
      type: "upsell",
      page: "#contact",
      headline: "Add ongoing optimization support",
      subtext: "Monthly strategic reviews, automation maintenance, and iteration support.",
      cta: "Add Ongoing Support",
      ctaUrl: "#contact",
      scoreBoost: { intent: 20, urgency: 12 },
    },
  ],
  idealFor: ["general"],
  entryConditions: { hasEmail: true, minSessions: 2 },
  conversionGoal: "retainer_upgrade",
  expectedCVR: "Best post-conversion continuity path",
};

export const BLUEPRINT_REFUND_PREVENTION: FunnelBlueprint = {
  id: "refund-prevention",
  name: "Refund Prevention Funnel",
  category: "retention",
  description: "Save-risk sequence for hesitant or under-activated customers before they churn.",
  steps: [
    {
      id: "rp-triage",
      type: "content",
      page: "/dashboard",
      headline: "Looks like you may be stuck. Let us fix that fast.",
      subtext: "We can run a recovery review, unblock onboarding, and reset the first milestone.",
      cta: "Start My Recovery Review",
      ctaUrl: "#contact",
      scoreBoost: { urgency: 20 },
    },
    {
      id: "rp-save",
      type: "offer",
      page: "#contact",
      headline: "Choose the fastest path back to value",
      subtext: "White-glove setup help, refresher training, or milestone reset.",
      cta: "Get Me Back on Track",
      ctaUrl: "#contact",
      scoreBoost: { intent: 18, urgency: 20 },
    },
    {
      id: "rp-expand",
      type: "content",
      page: "/dashboard",
      headline: "Now that momentum is back, here is your next win",
      subtext: "Once the account is stable again, we can reintroduce the roadmap safely.",
      cta: "See My Next Win",
      ctaUrl: "/dashboard",
      scoreBoost: { engagement: 8 },
    },
  ],
  idealFor: ["general"],
  entryConditions: { hasEmail: true },
  conversionGoal: "account_saved",
  expectedCVR: "Retention-focused, triggered by activation failure or disengagement",
};

export const BLUEPRINT_AFFILIATE: FunnelBlueprint = {
  id: "affiliate-presell",
  name: "Affiliate / Presell Funnel",
  category: "content",
  description: "Warm an externally sourced lead before passing them to the right niche offer or appointment.",
  steps: [
    {
      id: "af-bridge",
      type: "content",
      page: "/services/{niche}",
      headline: "Why this recommendation fits {Niche} operators",
      subtext: "A short presell layer that explains the problem, the fit, and the expected outcome.",
      cta: "See Why It Fits",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 8 },
    },
    {
      id: "af-capture",
      type: "offer",
      page: "#contact",
      headline: "Get the partner bonus and personalized next step",
      subtext: "Tell us where to send the presell guide and recommended offer path.",
      cta: "Send Me the Guide",
      ctaUrl: "#contact",
      scoreBoost: { intent: 12 },
    },
    {
      id: "af-route",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Confirm the best-fit path",
      subtext: "A fast fit-check ensures the recommendation matches your operating model.",
      cta: "Confirm My Fit",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 15 },
    },
  ],
  idealFor: ["general"],
  entryConditions: {},
  conversionGoal: "qualified_handoff",
  expectedCVR: "Presell layer improves downstream conversion from affiliate and referral traffic",
};

export const BLUEPRINT_CONTENT_MULTIPLIER: FunnelBlueprint = {
  id: "content-multiplier",
  name: "Content Multiplier Funnel",
  category: "content",
  description: "Turn content engagement into segmented nurture, assessment, and consult opportunities.",
  steps: [
    {
      id: "cm-content",
      type: "content",
      page: "/services/{niche}",
      headline: "Start with the highest-leverage insight for {Niche}",
      subtext: "A focused content asset that teaches one valuable lesson and moves the visitor to the next commitment.",
      cta: "Show Me the Insight",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 10 },
    },
    {
      id: "cm-capture",
      type: "offer",
      page: "#contact",
      headline: "Want the expanded version and implementation notes?",
      subtext: "Get the long-form version plus a niche-specific checklist.",
      cta: "Send Me the Expanded Guide",
      ctaUrl: "#contact",
      scoreBoost: { intent: 12 },
    },
    {
      id: "cm-qualify",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Now personalize the advice",
      subtext: "Take the assessment so the content becomes a concrete action plan.",
      cta: "Personalize My Plan",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 16 },
    },
    {
      id: "cm-book",
      type: "booking",
      page: "#contact",
      headline: "Want us to prioritize the roadmap with you?",
      subtext: "Book a short strategy call and we will sequence the first three highest-impact changes.",
      cta: "Prioritize My Roadmap",
      ctaUrl: "#contact",
      scoreBoost: { intent: 18 },
    },
  ],
  idealFor: ["business-intelligence", "digital-transformation", "compliance-training"],
  entryConditions: { minSessions: 2 },
  conversionGoal: "consultation_booked",
  expectedCVR: "Content-first trust building with stronger downstream qualification",
};

export const BLUEPRINT_MASTER_ORCHESTRATION: FunnelBlueprint = {
  id: "master-orchestration",
  name: "Master Orchestration Funnel",
  category: "launch",
  description: "A hybrid system that chooses among audit, content, calculator, consult, and retention branches dynamically.",
  steps: [
    {
      id: "mo-entry",
      type: "landing",
      page: "/services/{niche}",
      headline: "Choose the fastest path to a better {Niche} operation",
      subtext: "Assessment, ROI, proof, or direct consult depending on your current stage.",
      cta: "Show My Best Path",
      ctaUrl: "/services/{niche}",
      scoreBoost: { engagement: 8 },
    },
    {
      id: "mo-qualify",
      type: "assessment",
      page: "/assess/{niche}",
      headline: "Lock in the right branch",
      subtext: "We will use your score and behavior to pick the shortest route to value.",
      cta: "Find My Best Branch",
      ctaUrl: "/assess/{niche}",
      scoreBoost: { intent: 16 },
    },
    {
      id: "mo-proof",
      type: "calculator",
      page: "/calculator",
      headline: "Validate the upside before you move",
      subtext: "Proof, economics, and priority all in one place.",
      cta: "Validate My Upside",
      ctaUrl: "/calculator",
      scoreBoost: { intent: 18 },
    },
    {
      id: "mo-close",
      type: "booking",
      page: "#contact",
      headline: "Move into the highest-leverage next action",
      subtext: "Consult, starter package, implementation sprint, or customer expansion path.",
      cta: "Take the Next Step",
      ctaUrl: "#contact",
      scoreBoost: { intent: 22, urgency: 12 },
    },
  ],
  idealFor: ["general"],
  entryConditions: { minEngagement: 20 },
  conversionGoal: "adaptive_progression",
  expectedCVR: "Depends on branch selection and adaptive routing",
};

export const FUNNEL_BLUEPRINTS: Record<string, FunnelBlueprint> = {
  "client-audit": BLUEPRINT_CLIENT_AUDIT,
  "lead-gen": BLUEPRINT_LEAD_GEN,
  "value-ladder": BLUEPRINT_VALUE_LADDER,
  "high-ticket-call": BLUEPRINT_HIGH_TICKET,
  "chatbot-lead": BLUEPRINT_CHATBOT,
  "appointment-gen": BLUEPRINT_APPOINTMENT,
  "abandonment-recovery": BLUEPRINT_ABANDONMENT,
  "bridge": BLUEPRINT_BRIDGE,
  "mini-class": BLUEPRINT_MINI_CLASS,
  "customer-onboarding": BLUEPRINT_ONBOARDING,
  "back-to-basics": BLUEPRINT_BASICS,
  "webinar-live": BLUEPRINT_WEBINAR_LIVE,
  "webinar-evergreen": BLUEPRINT_WEBINAR_EVERGREEN,
  "giveaway-capture": BLUEPRINT_GIVEAWAY,
  "documentary-vsl": BLUEPRINT_DOCUMENTARY,
  "product-sales": BLUEPRINT_PRODUCT_SALES,
  "coupon-offer": BLUEPRINT_COUPON,
  "freemium-membership": BLUEPRINT_FREEMIUM,
  "continuity": BLUEPRINT_CONTINUITY,
  "refund-prevention": BLUEPRINT_REFUND_PREVENTION,
  "affiliate-presell": BLUEPRINT_AFFILIATE,
  "content-multiplier": BLUEPRINT_CONTENT_MULTIPLIER,
  "master-orchestration": BLUEPRINT_MASTER_ORCHESTRATION,
};

// ═══════════════════════════════════════════════════════════════
// NICHE → BLUEPRINT ROUTING
// Maps each of the 22 V10 niches to their optimal funnel sequence
// ═══════════════════════════════════════════════════════════════
export const NICHE_FUNNEL_CONFIG: Record<string, {
  primaryBlueprint: string;
  fallbackBlueprint: string;
  assessmentNiche: string;
  servicePage: string;
  valueProps: string[];
}> = {
  "client-portal": {
    primaryBlueprint: "client-audit",
    fallbackBlueprint: "lead-gen",
    assessmentNiche: "client-portal",
    servicePage: "/services/client-portal",
    valueProps: ["Branded client portal", "Automated onboarding", "Integrated invoicing"],
  },
  "re-syndication": {
    primaryBlueprint: "high-ticket-call",
    fallbackBlueprint: "client-audit",
    assessmentNiche: "re-syndication",
    servicePage: "/services/re-syndication",
    valueProps: ["Investor portal", "Automated K-1 distribution", "Deal room creation"],
  },
  "immigration-law": {
    primaryBlueprint: "high-ticket-call",
    fallbackBlueprint: "client-audit",
    assessmentNiche: "immigration-law",
    servicePage: "/services/immigration-law",
    valueProps: ["Case management portal", "Multilingual support", "Deadline automation"],
  },
  "construction": {
    primaryBlueprint: "client-audit",
    fallbackBlueprint: "appointment-gen",
    assessmentNiche: "construction",
    servicePage: "/services/construction",
    valueProps: ["Project tracking portal", "Subcontractor management", "Change order automation"],
  },
  "franchise": {
    primaryBlueprint: "high-ticket-call",
    fallbackBlueprint: "value-ladder",
    assessmentNiche: "franchise",
    servicePage: "/services/franchise",
    valueProps: ["Multi-location portal", "Franchise compliance", "Unified reporting"],
  },
  "compliance-training": {
    primaryBlueprint: "mini-class",
    fallbackBlueprint: "client-audit",
    assessmentNiche: "compliance-training",
    servicePage: "/services/compliance-training",
    valueProps: ["LMS platform", "Auto-assignment", "Certification tracking"],
  },
  "staffing": {
    primaryBlueprint: "chatbot-lead",
    fallbackBlueprint: "appointment-gen",
    assessmentNiche: "staffing",
    servicePage: "/services/staffing",
    valueProps: ["Applicant portal", "Placement tracking", "Client dashboards"],
  },
  "church-management": {
    primaryBlueprint: "chatbot-lead",
    fallbackBlueprint: "back-to-basics",
    assessmentNiche: "church-management",
    servicePage: "/services/church-management",
    valueProps: ["Member portal", "Event management", "Giving automation"],
  },
  "creator-management": {
    primaryBlueprint: "chatbot-lead",
    fallbackBlueprint: "client-audit",
    assessmentNiche: "creator-management",
    servicePage: "/services/creator-management",
    valueProps: ["Talent portal", "Campaign tracking", "Revenue splitting"],
  },
  "managed-services": {
    primaryBlueprint: "value-ladder",
    fallbackBlueprint: "client-audit",
    assessmentNiche: "managed-services",
    servicePage: "/services/managed-services",
    valueProps: ["Service desk portal", "SLA tracking", "Automated ticketing"],
  },
  "digital-transformation": {
    primaryBlueprint: "bridge",
    fallbackBlueprint: "lead-gen",
    assessmentNiche: "digital-transformation",
    servicePage: "/services/digital-transformation",
    valueProps: ["Process mapping", "Tool consolidation", "Change management"],
  },
  "process-automation": {
    primaryBlueprint: "lead-gen",
    fallbackBlueprint: "appointment-gen",
    assessmentNiche: "general",
    servicePage: "/services/process-automation",
    valueProps: ["Workflow automation", "API integration", "No-code solutions"],
  },
  "systems-integration": {
    primaryBlueprint: "lead-gen",
    fallbackBlueprint: "appointment-gen",
    assessmentNiche: "general",
    servicePage: "/services/systems-integration",
    valueProps: ["Multi-system sync", "Data pipeline", "Real-time dashboards"],
  },
  "business-intelligence": {
    primaryBlueprint: "mini-class",
    fallbackBlueprint: "lead-gen",
    assessmentNiche: "general",
    servicePage: "/services/business-intelligence",
    valueProps: ["KPI dashboards", "Automated reporting", "Data visualization"],
  },
  "training-platform": {
    primaryBlueprint: "mini-class",
    fallbackBlueprint: "lead-gen",
    assessmentNiche: "compliance-training",
    servicePage: "/services/training-platform",
    valueProps: ["LMS deployment", "Course creation", "Progress tracking"],
  },
};

// ═══════════════════════════════════════════════════════════════
// FUNNEL ORCHESTRATOR — Determines which blueprint + step to show
// ═══════════════════════════════════════════════════════════════
export interface FunnelState {
  activeBlueprint: string;
  currentStepIndex: number;
  completedSteps: string[];
  abandonedSteps: string[];
  startedAt: string;
  lastStepAt: string;
}

const NICHE_ALIAS_MAP: Record<string, string> = {
  "business automation": "general",
  "process automation": "process-automation",
  "digital transformation": "digital-transformation",
  "systems integration": "systems-integration",
  "business intelligence": "business-intelligence",
  "real estate syndication": "re-syndication",
  "immigration law": "immigration-law",
  "franchise operations": "franchise",
  "church management": "church-management",
  "creator management": "creator-management",
  "compliance training": "compliance-training",
  "managed services": "managed-services",
};

export function normalizeNicheSlug(value?: string): string {
  if (!value) return "general";

  const normalized = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, " ");
  if (NICHE_FUNNEL_CONFIG[normalized]) return normalized;

  const alias = NICHE_ALIAS_MAP[normalized];
  if (alias) return alias;

  const dashed = normalized.replace(/\s+/g, "-");
  if (NICHE_FUNNEL_CONFIG[dashed]) return dashed;

  return "general";
}

export function detectNicheFromPath(path: string): string {
  for (const [niche, config] of Object.entries(NICHE_FUNNEL_CONFIG)) {
    if (path.includes(niche) || path.includes(config.servicePage)) {
      return niche;
    }
  }
  if (path.includes("syndication")) return "re-syndication";
  if (path.includes("immigration")) return "immigration-law";
  if (path.includes("compliance")) return "compliance-training";
  return "general";
}

export function inferVisitorTemperature(profile: {
  scores: { engagement: number; intent: number; composite: number };
  capturedEmail?: string;
  funnelStage?: string;
}): VisitorTemperature {
  if (profile.funnelStage === "client" || profile.funnelStage === "converting") {
    return "customer";
  }
  if (profile.scores.composite >= 70 || (profile.capturedEmail && profile.scores.intent >= 50)) {
    return "hot";
  }
  if (profile.scores.engagement >= 30 || profile.capturedEmail) {
    return "warm";
  }
  return "cold";
}

export function inferObjectionType(profile: {
  capturedEmail?: string;
  assessmentCompleted?: boolean;
  roiCalculatorUsed?: boolean;
  sessions: number;
  pagesViewed: string[];
}): ObjectionType {
  const pricingViews = profile.pagesViewed.filter((page) => page.includes("pricing")).length;
  const serviceViews = profile.pagesViewed.filter((page) => page.startsWith("/services/")).length;

  if (pricingViews > 0 && !profile.assessmentCompleted) return "price";
  if (serviceViews >= 2 && !profile.roiCalculatorUsed && !profile.capturedEmail) return "trust";
  if (profile.roiCalculatorUsed && profile.capturedEmail && !profile.assessmentCompleted) return "timing";
  if (profile.sessions >= 2 && !profile.capturedEmail && !profile.assessmentCompleted) return "complexity";
  return "none";
}

export function inferChannelPreference(profile: {
  capturedPhone?: string;
  chatEngaged?: boolean;
  whatsappOptIn?: boolean;
  scores: { composite: number };
}): ChannelPreference {
  if (profile.whatsappOptIn || profile.capturedPhone) return "whatsapp";
  if (profile.scores.composite >= 80) return "sales-call";
  if (profile.chatEngaged) return "chat";
  return "email";
}

export function recommendBlueprintForVisitor(profile: {
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
}): BlueprintRecommendation {
  const niche = normalizeNicheSlug(profile.nicheInterest);
  const config = NICHE_FUNNEL_CONFIG[niche];
  const temperature = inferVisitorTemperature(profile);
  const objection = inferObjectionType(profile);
  const channel = inferChannelPreference(profile);

  if (temperature === "customer" && profile.sessions >= 4) {
    return { blueprint: FUNNEL_BLUEPRINTS["continuity"], niche, temperature, objection, channel, reason: "Existing customer with repeated engagement should see continuity and expansion." };
  }
  if (temperature === "customer") {
    return { blueprint: FUNNEL_BLUEPRINTS["customer-onboarding"], niche, temperature, objection, channel, reason: "Existing customer should see onboarding and activation guidance." };
  }
  if (objection === "price") {
    return { blueprint: FUNNEL_BLUEPRINTS["coupon-offer"], niche, temperature, objection, channel, reason: "Pricing behavior suggests a lower-risk or lower-friction offer branch." };
  }
  if (objection === "trust" && profile.sessions >= 2) {
    return { blueprint: FUNNEL_BLUEPRINTS["documentary-vsl"], niche, temperature, objection, channel, reason: "Multiple service-page views without conversion indicate a proof or trust gap." };
  }
  if ((profile.utmMedium === "affiliate" || profile.referralSource) && !profile.assessmentCompleted) {
    return { blueprint: FUNNEL_BLUEPRINTS["affiliate-presell"], niche, temperature, objection, channel, reason: "Affiliate or referral traffic benefits from a short presell layer before qualification." };
  }
  if (profile.sessions >= 4 && profile.capturedEmail && !profile.assessmentCompleted) {
    return { blueprint: FUNNEL_BLUEPRINTS["webinar-evergreen"], niche, temperature, objection, channel, reason: "Repeat engaged lead with email captured should move into an evergreen education funnel." };
  }
  if (profile.sessions >= 3 && !profile.capturedEmail && profile.scores.engagement >= 20) {
    return { blueprint: FUNNEL_BLUEPRINTS["giveaway-capture"], niche, temperature, objection, channel, reason: "Engaged but uncaptured visitor should see a high-response opt-in branch." };
  }
  if (profile.scores.composite >= 80 && profile.capturedPhone) {
    return { blueprint: FUNNEL_BLUEPRINTS["high-ticket-call"], niche, temperature, objection, channel, reason: "Hot lead with direct contact details should move straight to a sales conversation." };
  }
  if (profile.scores.composite >= 70 && profile.assessmentCompleted) {
    return { blueprint: FUNNEL_BLUEPRINTS["high-ticket-call"], niche, temperature, objection, channel, reason: "Strong score after assessment indicates premium-offer readiness." };
  }
  if (profile.chatEngaged && profile.capturedEmail) {
    return { blueprint: FUNNEL_BLUEPRINTS["chatbot-lead"], niche, temperature, objection, channel, reason: "Conversational lead with email captured should continue through chat-led qualification." };
  }
  if (profile.roiCalculatorUsed && profile.capturedEmail) {
    return { blueprint: FUNNEL_BLUEPRINTS["value-ladder"], niche, temperature, objection, channel, reason: "ROI-aware lead is ready to compare offer tiers and implementation paths." };
  }
  if (profile.scores.engagement >= 45 && !profile.capturedEmail) {
    return { blueprint: FUNNEL_BLUEPRINTS["content-multiplier"], niche, temperature, objection, channel, reason: "Highly engaged anonymous traffic should be nurtured through a stronger content-to-capture path." };
  }
  if (profile.sessions >= 3 && !profile.capturedEmail) {
    return { blueprint: FUNNEL_BLUEPRINTS["abandonment-recovery"], niche, temperature, objection, channel, reason: "Return visitor without capture should receive a recovery path." };
  }
  if (profile.pagesViewed.some((page) => page.startsWith("/services/")) && !profile.assessmentCompleted) {
    return { blueprint: FUNNEL_BLUEPRINTS["bridge"], niche, temperature, objection, channel, reason: "Service-page traffic should be warmed before the main assessment or consult ask." };
  }
  if (config) {
    return { blueprint: FUNNEL_BLUEPRINTS[config.primaryBlueprint] ?? FUNNEL_BLUEPRINTS["lead-gen"], niche, temperature, objection, channel, reason: "Falling back to the niche's primary blueprint family." };
  }
  return { blueprint: FUNNEL_BLUEPRINTS["master-orchestration"], niche, temperature, objection, channel, reason: "No stronger signal was present, so the adaptive master funnel is the safest default." };
}

export function selectBlueprintForVisitor(profile: {
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
}): FunnelBlueprint {
  return recommendBlueprintForVisitor(profile).blueprint;
  const niche = normalizeNicheSlug(profile.nicheInterest);
  const config = NICHE_FUNNEL_CONFIG[niche];

  // Hot lead — straight to high-ticket
  if (profile.scores.composite >= 70 && profile.assessmentCompleted) {
    return FUNNEL_BLUEPRINTS["high-ticket-call"];
  }

  // Chat engaged + email = chatbot funnel progression
  if (profile.chatEngaged && profile.capturedEmail) {
    return FUNNEL_BLUEPRINTS["chatbot-lead"];
  }

  // ROI calculator used = value ladder (ready to compare tiers)
  if (profile.roiCalculatorUsed && profile.capturedEmail) {
    return FUNNEL_BLUEPRINTS["value-ladder"];
  }

  // Return visitor without email = abandonment recovery
  if (profile.sessions >= 3 && !profile.capturedEmail) {
    return FUNNEL_BLUEPRINTS["abandonment-recovery"];
  }

  // Viewed services page = bridge funnel
  if (profile.pagesViewed.some(p => p.startsWith("/services/")) && !profile.assessmentCompleted) {
    return FUNNEL_BLUEPRINTS["bridge"];
  }

  // Niche-specific primary blueprint
  if (config) {
    return FUNNEL_BLUEPRINTS[config.primaryBlueprint] ?? FUNNEL_BLUEPRINTS["lead-gen"];
  }

  return FUNNEL_BLUEPRINTS["lead-gen"];
}

export function getNextFunnelStep(
  blueprint: FunnelBlueprint,
  completedSteps: string[],
): FunnelStep | null {
  for (const step of blueprint.steps) {
    if (!completedSteps.includes(step.id)) {
      return step;
    }
  }
  return null;
}

export function interpolateStep(step: FunnelStep, niche: string): FunnelStep {
  const nicheSlug = normalizeNicheSlug(niche);
  const nicheLabel = nicheSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const interpolate = (s: string) => {
    const withTokens = s.replace(/{niche}/g, nicheSlug).replace(/{Niche}/g, nicheLabel);

    if (nicheSlug !== "general") {
      return withTokens;
    }

    return withTokens
      .replace(/^\/services\/general$/, "/services")
      .replace(/^\/stories\/general$/, "/services")
      .replace(/^\/webinar\/general$/, "/webinar")
      .replace(/^\/giveaway\/general$/, "/giveaway")
      .replace(/^\/funnels\/general$/, "/funnels/master-orchestration");
  };

  return {
    ...step,
    page: interpolate(step.page),
    headline: interpolate(step.headline),
    subtext: interpolate(step.subtext),
    cta: interpolate(step.cta),
    ctaUrl: interpolate(step.ctaUrl),
    abandonRecovery: step.abandonRecovery ? {
      ...step.abandonRecovery,
      offer: interpolate(step.abandonRecovery.offer),
      fallbackUrl: interpolate(step.abandonRecovery.fallbackUrl),
    } : undefined,
  };
}
