import {
  automatedOffers,
  getOfferBySlug,
  getServiceOfferRecommendations,
  inferServiceFamily,
  type AutomatedOfferSlug,
} from "@/lib/automated-offers"
import { getNicheBySlug, niches, type LocalNiche } from "@/lib/niches"

export type FunnelSlug =
  | "provider-discovery"
  | "lead-readiness-scorecard"
  | "service-page-blueprint"
  | "missed-call-recovery"
  | "seasonal-booking"
  | "review-reputation"
  | "client-portal-starter"
  | "convertbox-funnel"
  | "provider-launch"
  | "growth-intelligence"
  | "government-opportunity"
  | "cart-abandonment"
  | "customer-onboarding"
  | "refund-prevention"

export type VisitorIntent = "requester" | "provider" | "unknown"
export type VisitorTemperature = "cold" | "warm" | "hot" | "customer"

export type FunnelStep = {
  id: string
  label: string
  visitorExperience: string
  systemAction: string
  exitEvent: string
}

export type ValueEquation = {
  dreamOutcome: string
  perceivedLikelihood: string
  timeDelay: string
  effortAndSacrifice: string
}

export type OfferMechanics = {
  ladderStage: string
  promise: string
  riskReversal: string
  bonusLogic: string[]
  postPurchaseSequence: string[]
}

export type PublicFunnelCopy = {
  eyebrow: string
  title: string
  subtitle: string
  whoItsFor: string
  problem: string
  outcome: string
  reassurance: string
  included: string[]
  steps: string[]
  faq: Array<{ question: string; answer: string }>
}

export type FunnelDefinition = {
  slug: FunnelSlug
  title: string
  geruPatterns: string[]
  purpose: string
  primaryAudience: VisitorIntent
  temperature: VisitorTemperature
  entryPoints: string[]
  exitPoints: string[]
  empathy: string
  motivation: string
  voice: string[]
  headline: string
  subheadline: string
  primaryCta: string
  primaryOfferSlug?: AutomatedOfferSlug
  orderBumpSlug?: AutomatedOfferSlug
  nextFunnelSlugs: FunnelSlug[]
  steps: FunnelStep[]
  valueEquation: ValueEquation
  offerMechanics: OfferMechanics
  publicCopy: PublicFunnelCopy
  measurementEvents: string[]
}

export type FunnelRecommendation = {
  funnel: FunnelDefinition
  serviceSlug?: string
  serviceLabel?: string
  serviceFamily?: string
  reason: string
  priority: number
  offer?: ReturnType<typeof getOfferBySlug>
  orderBump?: ReturnType<typeof getOfferBySlug>
  checkoutUrl?: string
}

export const salesFunnels: FunnelDefinition[] = [
  {
    slug: "provider-discovery",
    title: "Provider Discovery Funnel",
    geruPatterns: ["Back To Basics", "Ask Them", "Agency Lead Gen"],
    purpose: "Identify provider intent on service pages without interrupting residents who need service.",
    primaryAudience: "provider",
    temperature: "cold",
    entryPoints: ["Service page provider section", "ConvertBox provider branch", "For-business page", "Exit intent", "Return visit"],
    exitPoints: ["Scorecard started", "Provider dismissed", "Requester path selected", "Paid offer clicked"],
    empathy: "The provider is busy and skeptical. The first step should feel like a useful local diagnostic, not a marketing pitch.",
    motivation: "They want to know whether Erie County buyers can clearly choose them before they spend money.",
    voice: ["local", "plainspoken", "diagnostic", "low pressure"],
    headline: "Do Erie County buyers have a clear reason to choose you?",
    subheadline: "Get a quick read on your service page, follow-up path, reviews, and booking readiness.",
    primaryCta: "Get my free scorecard",
    primaryOfferSlug: "erie-lead-readiness-scorecard",
    nextFunnelSlugs: ["lead-readiness-scorecard", "service-page-blueprint"],
    steps: [
      {
        id: "intent-question",
        label: "Provider intent question",
        visitorExperience: "A short question asks whether the visitor provides this service in Erie County.",
        systemAction: "Tag visitorSegment=provider and attach the current service context.",
        exitEvent: "funnel.provider_discovery.segmented",
      },
      {
        id: "service-confirmation",
        label: "Service confirmation",
        visitorExperience: "The provider confirms or changes the service category.",
        systemAction: "Resolve service family and load service-specific recommendations.",
        exitEvent: "funnel.provider_discovery.service_selected",
      },
      {
        id: "scorecard-entry",
        label: "Scorecard entry",
        visitorExperience: "The provider is invited to get a free lead readiness scorecard.",
        systemAction: "Send provider to scorecard capture or embedded scorecard form.",
        exitEvent: "funnel.provider_discovery.scorecard_clicked",
      },
    ],
    valueEquation: {
      dreamOutcome: "Know whether Erie County buyers can understand and trust the provider quickly.",
      perceivedLikelihood: "The diagnostic asks only service-relevant questions and immediately returns a next best step.",
      timeDelay: "The first useful signal arrives before any paid offer is shown.",
      effortAndSacrifice: "No account, rebuild, or long consultation is required to start.",
    },
    offerMechanics: {
      ladderStage: "Free lead magnet",
      promise: "Give providers a fast, useful read on whether their local lead path is clear.",
      riskReversal: "No payment or commitment before the provider sees the diagnostic path.",
      bonusLogic: ["Service-specific recommendation", "Provider/requester separation", "Next-step routing"],
      postPurchaseSequence: ["Scorecard invitation", "Best-fit offer recommendation", "Soft nurture if no purchase"],
    },
    publicCopy: {
      eyebrow: "For Erie County providers",
      title: "Find out if local buyers can quickly understand why they should choose you.",
      subtitle: "Get a clear first step for improving how your service business shows up, earns trust, and turns interest into real conversations.",
      whoItsFor: "For service providers who suspect their website or listing could be doing more, but do not want to start with a big project.",
      problem: "Many good providers lose ready buyers simply because the page does not make the next step obvious, the proof is hard to see, or the follow-up path feels unclear.",
      outcome: "You leave with a useful read on what deserves attention first.",
      reassurance: "This is a low-pressure starting point. It helps you decide whether a deeper improvement is worth your time.",
      included: [
        "A quick review of your service category and buyer situation.",
        "A plain-language view of what may be costing you leads.",
        "A recommended next step based on your service and urgency.",
        "A path that keeps residents requesting service separate from provider growth options.",
      ],
      steps: [
        "Tell Erie.Pro what kind of service business you run.",
        "Answer a few practical questions about your page, proof, and follow-up.",
        "See the clearest next step for improving your local lead path.",
      ],
      faq: [
        { question: "Is this for residents looking for service?", answer: "No. Residents should continue using the service request path. This option is for providers who want to improve how they get chosen." },
        { question: "Do I need a website already?", answer: "No. If you have a listing, page, or even just a basic online presence, the first step can still help." },
      ],
    },
    measurementEvents: ["funnel_view", "provider_intent_selected", "scorecard_start", "requester_redirect"],
  },
  {
    slug: "lead-readiness-scorecard",
    title: "Lead Readiness Scorecard Funnel",
    geruPatterns: ["Agency Client-Audit"],
    purpose: "Convert provider curiosity into a scored diagnosis and a best-fit next offer.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Provider Discovery Funnel", "For-business page", "Email follow-up", "Checkout abandonment fallback"],
    exitPoints: ["Scorecard completed", "Recommended offer clicked", "Checkout started", "Nurture enrolled"],
    empathy: "The provider wants proof of the gap before buying anything.",
    motivation: "They want a clear answer to what is leaking leads and what to fix first.",
    voice: ["specific", "useful", "calm", "service-aware"],
    headline: "See where Erie County leads may be slipping away.",
    subheadline: "Answer a few questions about your service page, proof, intake, and follow-up path.",
    primaryCta: "Start the scorecard",
    primaryOfferSlug: "erie-lead-readiness-scorecard",
    nextFunnelSlugs: ["service-page-blueprint", "missed-call-recovery", "seasonal-booking", "review-reputation", "client-portal-starter"],
    steps: [
      {
        id: "category",
        label: "Category",
        visitorExperience: "Choose the service category and whether the business handles urgent, seasonal, or scheduled work.",
        systemAction: "Infer family and urgency.",
        exitEvent: "funnel.scorecard.category_completed",
      },
      {
        id: "readiness",
        label: "Readiness questions",
        visitorExperience: "Answer questions about page clarity, reviews, response speed, and booking path.",
        systemAction: "Score conversion, response, trust, seasonality, and operations gaps.",
        exitEvent: "funnel.scorecard.questions_completed",
      },
      {
        id: "recommendation",
        label: "Recommendation",
        visitorExperience: "See one primary gap and the best next offer.",
        systemAction: "Record recommendation and offer click path.",
        exitEvent: "funnel.scorecard.recommendation_viewed",
      },
    ],
    valueEquation: {
      dreamOutcome: "See the biggest lead-readiness gap before spending money.",
      perceivedLikelihood: "A scored framework makes the recommendation feel earned instead of arbitrary.",
      timeDelay: "Providers get clarity in minutes.",
      effortAndSacrifice: "The provider answers a small set of plain-language questions.",
    },
    offerMechanics: {
      ladderStage: "Free diagnostic / trust tripwire precursor",
      promise: "Turn vague curiosity into one prioritized growth move.",
      riskReversal: "Free diagnostic first; paid recommendation only after the gap is visible.",
      bonusLogic: ["Category-specific scoring", "One priority gap", "Recommended offer path"],
      postPurchaseSequence: ["Result recap", "Quick win", "Offer-specific follow-up"],
    },
    publicCopy: {
      eyebrow: "Free provider checkup",
      title: "See where Erie County leads may be slipping away.",
      subtitle: "Answer a few simple questions and get a practical read on your page, trust signals, response speed, and booking path.",
      whoItsFor: "For providers who want clarity before buying a full improvement package.",
      problem: "It is hard to fix lead flow when you do not know whether the issue is the offer, the page, the proof, the intake, or the follow-up.",
      outcome: "You get a focused recommendation instead of a vague list of marketing ideas.",
      reassurance: "The scorecard is meant to be useful on its own. If the next step is not right for you, you can stop there.",
      included: [
        "A practical review of page clarity, trust, intake, and follow-up.",
        "A service-aware recommendation for what to fix first.",
        "A simple priority path you can act on without guessing.",
        "A next-step option only if it fits what the scorecard finds.",
      ],
      steps: [
        "Choose your service category.",
        "Answer practical readiness questions.",
        "Review the recommended first improvement.",
      ],
      faq: [
        { question: "How long does it take?", answer: "It is designed to be quick. You should be able to get useful direction in a few minutes." },
        { question: "Will I be pushed into a large package?", answer: "No. The point is to identify the right next step, including a small one if that is the better fit." },
      ],
    },
    measurementEvents: ["scorecard_start", "scorecard_complete", "recommendation_click", "checkout_start"],
  },
  {
    slug: "service-page-blueprint",
    title: "Service Page Conversion Blueprint Funnel",
    geruPatterns: ["Agency Client-Audit", "Bridge", "Ecom Sales"],
    purpose: "Sell the default low-ticket conversion product for all service categories.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Scorecard result", "Service page provider CTA", "Provider email nurture", "Checkout recovery"],
    exitPoints: ["Blueprint purchased", "Review bump accepted", "Checkout abandoned", "ConvertBox upsell clicked"],
    empathy: "The provider does not want a vague strategy. They want a concrete plan for one page.",
    motivation: "They want to know exactly what to say, show, ask, and send next.",
    voice: ["concrete", "practical", "outcome-first"],
    headline: "Turn one Erie County service page into a clearer path to booked work.",
    subheadline: "Get a service-specific conversion brief with messaging, trust, CTA, intake, and follow-up guidance.",
    primaryCta: "Get my blueprint",
    primaryOfferSlug: "service-page-conversion-blueprint",
    orderBumpSlug: "review-reputation-growth-kit",
    nextFunnelSlugs: ["convertbox-funnel", "provider-launch"],
    steps: [
      {
        id: "offer",
        label: "Offer",
        visitorExperience: "The provider sees the page-specific promise and deliverables.",
        systemAction: "Record offer view with service family.",
        exitEvent: "funnel.blueprint.offer_viewed",
      },
      {
        id: "checkout",
        label: "Checkout",
        visitorExperience: "ThriveCart checkout shows the blueprint and a reputation bump.",
        systemAction: "Track checkout click and preserve service context.",
        exitEvent: "funnel.blueprint.checkout_started",
      },
      {
        id: "delivery",
        label: "Delivery",
        visitorExperience: "The blueprint is generated and delivered.",
        systemAction: "Create fulfillment job and asset.",
        exitEvent: "funnel.blueprint.fulfilled",
      },
    ],
    valueEquation: {
      dreamOutcome: "Have one service page tell the right story, ask the right question, and guide the next action.",
      perceivedLikelihood: "The deliverable is tied to the provider's exact service category and page context.",
      timeDelay: "A focused blueprint is faster than a full website rebuild.",
      effortAndSacrifice: "The provider receives decisions, copy direction, proof placement, and follow-up guidance in one artifact.",
    },
    offerMechanics: {
      ladderStage: "Trust tripwire / core workflow playbook",
      promise: "A concrete service-page conversion plan, not a vague marketing audit.",
      riskReversal: "Clear deliverable expectation and low-ticket price keep perceived risk low.",
      bonusLogic: ["Reputation bump handles proof objections", "Checkout copy restates deliverables", "Next offer is only shown after fit is clear"],
      postPurchaseSequence: ["Welcome and delivery expectation", "Quick win: apply the headline/CTA first", "Common mistakes", "Case-use example", "Next rung invitation", "Testimonial request"],
    },
    publicCopy: {
      eyebrow: "Service page improvement",
      title: "Make one Erie County service page clearer, more trustworthy, and easier to act on.",
      subtitle: "Get practical page guidance for your exact service so visitors understand what you do, why you are credible, and what to do next.",
      whoItsFor: "For providers who already have a service page or listing and want it to work harder before rebuilding everything.",
      problem: "Most service pages describe the business, but they do not guide a visitor through trust, fit, urgency, and contact.",
      outcome: "You receive a focused plan for improving one page so it can support more serious inquiries.",
      reassurance: "This is intentionally narrow. One strong page can teach you what to improve before touching the rest of the site.",
      included: [
        "A stronger headline and message direction.",
        "Recommended trust signals for your service category.",
        "A clearer call-to-action path.",
        "Follow-up guidance for people who are interested but not ready yet.",
      ],
      steps: [
        "Choose the service page you want to improve.",
        "Review the recommended copy, proof, and next-step changes.",
        "Apply the highest-impact changes first.",
      ],
      faq: [
        { question: "Is this a full website redesign?", answer: "No. It focuses on one service page so you can make a practical improvement without a full rebuild." },
        { question: "Can this work for any Erie.Pro service?", answer: "Yes. The guidance adjusts to the service category and the kind of buyer decision involved." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "bump_accept", "purchase", "asset_open"],
  },
  {
    slug: "missed-call-recovery",
    title: "Missed-Call Recovery Funnel",
    geruPatterns: ["Appointment Generator", "Cart Abandonment", "Customer Onboarding"],
    purpose: "Monetize urgent service categories with a fast response and recovery kit.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Emergency service pages", "Scorecard response gap", "ConvertBox urgent branch", "Emergency provider email segment"],
    exitPoints: ["Kit purchased", "Review bump accepted", "ConvertBox funnel upsell clicked"],
    empathy: "Urgent-service providers know missed calls are expensive, but they need a simple recovery system.",
    motivation: "They want fewer lost jobs when they cannot answer immediately.",
    voice: ["urgent", "direct", "reassuring"],
    headline: "Recover service leads that would otherwise call the next provider.",
    subheadline: "Use callback scripts, SMS/email templates, and response rules for urgent Erie County requests.",
    primaryCta: "Recover missed calls",
    primaryOfferSlug: "missed-call-recovery-kit",
    orderBumpSlug: "review-reputation-growth-kit",
    nextFunnelSlugs: ["convertbox-funnel", "growth-intelligence"],
    steps: [
      {
        id: "loss-frame",
        label: "Loss frame",
        visitorExperience: "The provider sees how one missed urgent call becomes a lost job.",
        systemAction: "Tag response_gap.",
        exitEvent: "funnel.missed_call.loss_frame_viewed",
      },
      {
        id: "kit-checkout",
        label: "Kit checkout",
        visitorExperience: "The provider buys the recovery kit with a review bump option.",
        systemAction: "Route to ThriveCart product 163.",
        exitEvent: "funnel.missed_call.checkout_started",
      },
      {
        id: "follow-up",
        label: "Follow-up",
        visitorExperience: "The provider receives templates and a next-step checklist.",
        systemAction: "Deliver automation kit and recommend ConvertBox Funnel-in-a-Box.",
        exitEvent: "funnel.missed_call.fulfilled",
      },
    ],
    valueEquation: {
      dreamOutcome: "Recover urgent jobs that would otherwise move to the next provider.",
      perceivedLikelihood: "Scripts and response rules match the emotional state of urgent service buyers.",
      timeDelay: "Templates can be used the same day.",
      effortAndSacrifice: "No CRM rebuild is required to start recovering missed inquiries.",
    },
    offerMechanics: {
      ladderStage: "Urgency-specific tripwire",
      promise: "A fast response system for high-intent missed calls and messages.",
      riskReversal: "Low-price kit plus practical scripts makes the purchase easy to justify.",
      bonusLogic: ["Review kit as proof layer", "SMS/email templates reduce effort", "ConvertBox upsell only after recovery gap is clear"],
      postPurchaseSequence: ["Welcome", "Quick win: install one callback script", "Common response mistakes", "Service-loss example", "Next automation step", "Outcome/testimonial request"],
    },
    publicCopy: {
      eyebrow: "Urgent lead recovery",
      title: "Stop losing ready buyers just because you missed the first call.",
      subtitle: "Use simple callback, message, and follow-up assets for urgent service inquiries where timing matters.",
      whoItsFor: "For providers in urgent or fast-moving categories like plumbing, HVAC, towing, restoration, locksmith, and repair services.",
      problem: "Urgent buyers rarely wait. If they do not hear back quickly, they often call the next provider.",
      outcome: "You get a practical recovery path for calls, texts, and inquiries that might otherwise be lost.",
      reassurance: "You do not need a complicated CRM to start. The goal is a simple response path you can use quickly.",
      included: [
        "Callback scripts for missed urgent inquiries.",
        "SMS and email recovery templates.",
        "Voicemail and response-time guidance.",
        "A simple way to prioritize the hottest missed opportunities.",
      ],
      steps: [
        "Identify the urgent inquiries you are most likely to miss.",
        "Use the scripts and messages that fit your service.",
        "Follow up quickly with a clear next step.",
      ],
      faq: [
        { question: "Will this replace my phone system?", answer: "No. It gives you practical recovery language and rules you can use with the tools you already have." },
        { question: "Is this only for emergency services?", answer: "It is strongest for urgent services, but any provider that loses jobs from slow response can use it." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "asset_open", "upsell_click"],
  },
  {
    slug: "seasonal-booking",
    title: "Seasonal Booking Funnel",
    geruPatterns: ["Evergreen Launch", "Ecom Coupon", "Micro Continuity"],
    purpose: "Help seasonal providers act before demand peaks.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Seasonal service pages", "Time-based ConvertBox triggers", "Growth Intelligence reports", "Pre-season email prompts"],
    exitPoints: ["Campaign pack purchased", "Growth subscription started", "Seasonal reminder scheduled"],
    empathy: "Seasonal providers often market too late, after buyers have already chosen someone.",
    motivation: "They want to be ready before the rush.",
    voice: ["timely", "planning-oriented", "specific"],
    headline: "Book demand before the seasonal rush starts.",
    subheadline: "Get Erie County timing, offer prompts, email/SMS copy, and booking reminders for your service.",
    primaryCta: "Plan my seasonal campaign",
    primaryOfferSlug: "seasonal-booking-campaign-pack",
    orderBumpSlug: "growth-intelligence-subscription",
    nextFunnelSlugs: ["growth-intelligence"],
    steps: [
      {
        id: "timing",
        label: "Timing prompt",
        visitorExperience: "The provider sees why the next seasonal window matters now.",
        systemAction: "Tag seasonal_gap.",
        exitEvent: "funnel.seasonal.timing_viewed",
      },
      {
        id: "campaign",
        label: "Campaign offer",
        visitorExperience: "The provider buys the campaign pack.",
        systemAction: "Route to ThriveCart product 164.",
        exitEvent: "funnel.seasonal.checkout_started",
      },
      {
        id: "continuity",
        label: "Continuity",
        visitorExperience: "The provider is offered monthly intelligence.",
        systemAction: "Recommend subscription continuation.",
        exitEvent: "funnel.seasonal.continuity_viewed",
      },
    ],
    valueEquation: {
      dreamOutcome: "Enter the seasonal demand window before local buyers have already chosen someone.",
      perceivedLikelihood: "The campaign pack is anchored to Erie County timing and service seasonality.",
      timeDelay: "Providers can deploy the campaign before the next demand spike.",
      effortAndSacrifice: "Prebuilt prompts, reminders, and copy reduce planning burden.",
    },
    offerMechanics: {
      ladderStage: "Seasonal campaign tripwire",
      promise: "A timely campaign path for demand that is easy to miss.",
      riskReversal: "The offer is concrete enough to evaluate immediately.",
      bonusLogic: ["Growth subscription as continuity bump", "Seasonal reminders", "Service timing prompts"],
      postPurchaseSequence: ["Welcome", "Quick win: choose the next seasonal window", "Common timing mistakes", "Campaign example", "Continuity invitation", "Result/testimonial request"],
    },
    publicCopy: {
      eyebrow: "Seasonal demand planning",
      title: "Get ready before Erie County buyers start searching heavily.",
      subtitle: "Plan the right message, timing, and reminders before your seasonal demand window gets crowded.",
      whoItsFor: "For providers whose demand changes by season, weather, holidays, maintenance cycles, or local events.",
      problem: "Many seasonal providers start marketing after buyers have already made a choice.",
      outcome: "You get a campaign path that helps you show up earlier and stay easier to remember.",
      reassurance: "The goal is not more noise. It is a timely, service-specific campaign you can actually use.",
      included: [
        "Seasonal timing guidance for your service.",
        "Offer prompts matched to the upcoming demand window.",
        "Email and message copy for timely outreach.",
        "Booking reminders that help buyers act earlier.",
      ],
      steps: [
        "Choose the seasonal window that matters next.",
        "Use the matching campaign message and reminders.",
        "Start outreach before demand peaks.",
      ],
      faq: [
        { question: "What if my service is not obviously seasonal?", answer: "Many services still have timing patterns. The page will make the most sense for services with clear seasonal or deadline-driven demand." },
        { question: "Do I need an email list?", answer: "An email list helps, but the copy can also support texts, posts, website sections, and direct follow-up." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "subscription_click"],
  },
  {
    slug: "review-reputation",
    title: "Review & Reputation Funnel",
    geruPatterns: ["Bridge", "Customer Onboarding", "Value Ladder"],
    purpose: "Make local trust visible and create a universal low-risk order bump.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Scorecard trust gap", "Order bump", "Post-purchase onboarding", "Trust-heavy service pages"],
    exitPoints: ["Kit purchased", "Blueprint upsell clicked", "Review follow-up scheduled"],
    empathy: "The provider may do good work but lacks a consistent way to turn that into visible proof.",
    motivation: "They want more buyers to trust them before calling.",
    voice: ["respectful", "trust-building", "plain"],
    headline: "Turn completed service work into more trust for the next Erie County buyer.",
    subheadline: "Get review request scripts, QR copy, email/SMS follow-up, and proof placement guidance.",
    primaryCta: "Grow my reputation",
    primaryOfferSlug: "review-reputation-growth-kit",
    nextFunnelSlugs: ["service-page-blueprint"],
    steps: [
      {
        id: "proof-gap",
        label: "Proof gap",
        visitorExperience: "The provider sees why proof matters before contact.",
        systemAction: "Tag trust_gap.",
        exitEvent: "funnel.reputation.proof_gap_viewed",
      },
      {
        id: "kit",
        label: "Kit",
        visitorExperience: "The provider buys the reputation kit or adds it as a bump.",
        systemAction: "Route to ThriveCart product 165.",
        exitEvent: "funnel.reputation.checkout_started",
      },
    ],
    valueEquation: {
      dreamOutcome: "Make good completed work visible enough to influence the next buyer.",
      perceivedLikelihood: "Scripts, QR prompts, and placement guidance are simple and familiar.",
      timeDelay: "Providers can start requesting better reviews immediately.",
      effortAndSacrifice: "The kit removes awkward wording and follow-up uncertainty.",
    },
    offerMechanics: {
      ladderStage: "Universal order bump / standalone trust kit",
      promise: "Turn proof into a repeatable growth asset.",
      riskReversal: "Small, practical asset stack with an obvious use case.",
      bonusLogic: ["Bump addresses trust objections", "Works across every service family", "Pairs naturally with page blueprints"],
      postPurchaseSequence: ["Welcome", "Quick win: send one review request", "Common review mistakes", "Proof placement example", "Blueprint invitation", "Testimonial request"],
    },
    publicCopy: {
      eyebrow: "Reputation support",
      title: "Make your good work easier for the next buyer to trust.",
      subtitle: "Use review request language, follow-up messages, and proof placement guidance that feels natural and professional.",
      whoItsFor: "For providers who do good work but do not consistently turn completed jobs into visible trust.",
      problem: "Buyers often compare proof before they contact anyone. If your best work is invisible, trust is harder to earn.",
      outcome: "You get a simple way to ask for reviews and use proof without sounding awkward or pushy.",
      reassurance: "The language is respectful and customer-friendly. It is designed to protect trust, not pressure people.",
      included: [
        "Review request scripts.",
        "Email and SMS follow-up language.",
        "QR and page placement guidance.",
        "Ideas for using proof on service pages and follow-up messages.",
      ],
      steps: [
        "Choose the customer moment when a review request feels natural.",
        "Use the matching message or script.",
        "Place proof where future buyers can actually see it.",
      ],
      faq: [
        { question: "Will this sound pushy to customers?", answer: "No. The language is written to be polite, simple, and easy for customers to ignore if they prefer." },
        { question: "Can I use this even if I have few reviews?", answer: "Yes. It helps you start building the habit and gives guidance for making the proof you do have more visible." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "blueprint_upsell_click"],
  },
  {
    slug: "client-portal-starter",
    title: "Client Portal Starter Funnel",
    geruPatterns: ["Customer Onboarding"],
    purpose: "Help delivery-heavy providers make the post-lead experience feel organized.",
    primaryAudience: "provider",
    temperature: "warm",
    entryPoints: ["Operations scorecard gap", "Professional services", "Health services", "Cleaning/turnover services", "Government scanner buyers"],
    exitPoints: ["Portal pack purchased", "SuiteDash-ready asset delivered", "Provider Launch upsell clicked"],
    empathy: "The provider wants customers to feel handled after the first inquiry.",
    motivation: "They want fewer lost details, fewer unclear next steps, and a more professional intake path.",
    voice: ["organized", "clear", "client-centered"],
    headline: "Make the service experience feel organized after the lead says yes.",
    subheadline: "Get intake, client stages, task templates, and onboarding messages for repeatable delivery.",
    primaryCta: "Create my portal starter",
    primaryOfferSlug: "client-portal-starter-pack",
    orderBumpSlug: "review-reputation-growth-kit",
    nextFunnelSlugs: ["provider-launch"],
    steps: [
      {
        id: "operations-gap",
        label: "Operations gap",
        visitorExperience: "The provider sees how unclear intake affects buyer confidence.",
        systemAction: "Tag operations_gap.",
        exitEvent: "funnel.portal.operations_gap_viewed",
      },
      {
        id: "portal-checkout",
        label: "Portal checkout",
        visitorExperience: "The provider buys the portal starter pack.",
        systemAction: "Route to ThriveCart product 162.",
        exitEvent: "funnel.portal.checkout_started",
      },
    ],
    valueEquation: {
      dreamOutcome: "Make service delivery feel organized after the customer says yes.",
      perceivedLikelihood: "The pack maps intake, stages, tasks, and client messages into a clear flow.",
      timeDelay: "Providers can apply the intake and stage templates without a full system rollout.",
      effortAndSacrifice: "Prebuilt client stages reduce repeated explanation and missed details.",
    },
    offerMechanics: {
      ladderStage: "Toolkit / implementation asset pack",
      promise: "A starter operating path for better post-lead delivery.",
      riskReversal: "Buyers receive usable templates rather than open-ended consulting.",
      bonusLogic: ["Review bump strengthens proof", "Provider Launch upsell covers full foundation", "Works best for appointment and professional services"],
      postPurchaseSequence: ["Welcome", "Quick win: install the intake stage", "Common onboarding mistakes", "Delivery example", "Provider Launch invitation", "Testimonial request"],
    },
    publicCopy: {
      eyebrow: "Client experience setup",
      title: "Make the customer experience feel organized after someone says yes.",
      subtitle: "Get intake, onboarding, task, and message guidance so customers know what is happening next.",
      whoItsFor: "For appointment, professional, cleaning, health, and service providers who need a smoother handoff after inquiry or booking.",
      problem: "Even when a buyer is ready, unclear intake and follow-up can create doubt, delays, and repeated questions.",
      outcome: "You get a starter path for making the service experience feel more professional and predictable.",
      reassurance: "This is a practical starter pack, not a complicated operations overhaul.",
      included: [
        "Intake questions and stages.",
        "Customer onboarding messages.",
        "Task and handoff templates.",
        "A clearer path from inquiry to service delivery.",
      ],
      steps: [
        "Map the first customer handoff.",
        "Use the intake and onboarding templates.",
        "Give customers a clearer expectation of what happens next.",
      ],
      faq: [
        { question: "Do I need SuiteDash to use this?", answer: "It is SuiteDash-ready, but the structure can also guide your current intake and follow-up process." },
        { question: "Is this for one-person providers?", answer: "Yes. It is especially useful when a small team needs to look organized without adding more admin work." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "launch_upsell_click"],
  },
  {
    slug: "convertbox-funnel",
    title: "ConvertBox Funnel-in-a-Box Funnel",
    geruPatterns: ["Ask Them", "Chatbot Lead", "Agency Value Ladder"],
    purpose: "Sell a tailored overlay funnel for providers with service pages or existing websites.",
    primaryAudience: "provider",
    temperature: "hot",
    entryPoints: ["Blueprint buyer", "Website conversion scorecard gap", "Provider asks about lead capture", "Service page provider branch"],
    exitPoints: ["Funnel kit purchased", "Missed-call bump accepted", "Provider Launch upsell clicked"],
    empathy: "The provider already has traffic or pages and wants the path to be smarter without rebuilding everything.",
    motivation: "They want the right question, at the right time, with the right handoff.",
    voice: ["smart", "specific", "service-aware"],
    headline: "Give your service pages a smarter on-page lead path.",
    subheadline: "Get overlay steps, triggers, copy, fields, and checkout paths matched to your service category.",
    primaryCta: "Build my funnel plan",
    primaryOfferSlug: "convertbox-funnel-in-a-box",
    orderBumpSlug: "missed-call-recovery-kit",
    nextFunnelSlugs: ["provider-launch", "growth-intelligence"],
    steps: [
      {
        id: "path-gap",
        label: "Path gap",
        visitorExperience: "The provider sees that the page needs a guided decision path.",
        systemAction: "Tag funnel_gap.",
        exitEvent: "funnel.convertbox.path_gap_viewed",
      },
      {
        id: "funnel-checkout",
        label: "Funnel checkout",
        visitorExperience: "The provider buys the ConvertBox funnel plan.",
        systemAction: "Route to ThriveCart product 159.",
        exitEvent: "funnel.convertbox.checkout_started",
      },
      {
        id: "implementation",
        label: "Implementation map",
        visitorExperience: "The provider receives steps, triggers, fields, and copy.",
        systemAction: "Generate automation kit.",
        exitEvent: "funnel.convertbox.fulfilled",
      },
    ],
    valueEquation: {
      dreamOutcome: "Give each service page a guided lead path that asks the right question at the right time.",
      perceivedLikelihood: "The plan specifies overlay steps, triggers, fields, and handoffs instead of generic popups.",
      timeDelay: "Providers can apply the funnel plan to an existing website without redesigning the site.",
      effortAndSacrifice: "Branching logic and copy are already decided for the service context.",
    },
    offerMechanics: {
      ladderStage: "Toolkit / conversion asset pack",
      promise: "A service-aware ConvertBox path that supports the visitor rather than interrupting them.",
      riskReversal: "The deliverable is specific, inspectable, and tied to the buyer's current page.",
      bonusLogic: ["Missed-call kit handles response objections", "Provider Launch upsell handles full setup", "Overlay logic preserves resident UX"],
      postPurchaseSequence: ["Welcome", "Quick win: deploy the first trigger", "Common popup mistakes", "Funnel path example", "Provider Launch invitation", "Testimonial request"],
    },
    publicCopy: {
      eyebrow: "Website lead path",
      title: "Give your website a smarter way to turn visitors into real inquiries.",
      subtitle: "Add a guided on-page path that asks helpful questions, points visitors to the right next step, and supports your service goals.",
      whoItsFor: "For providers who already have a website or service page and want more of the right visitors to take action.",
      problem: "Many websites wait for visitors to figure everything out alone. Good visitors leave when the page does not help them choose, ask, or book.",
      outcome: "You get a service-specific on-page lead path that feels helpful to visitors and practical for your business.",
      reassurance: "This is not about annoying popups. It is about showing the right prompt at the right moment with useful choices.",
      included: [
        "Visitor-friendly prompts for your service.",
        "Questions that help route people to the right next step.",
        "Suggested display timing that avoids overwhelming visitors.",
        "Copy for inquiry, booking, follow-up, and offer paths.",
      ],
      steps: [
        "Choose the service page or website path to improve.",
        "Use the recommended visitor prompts and questions.",
        "Connect the final step to inquiry, checkout, booking, or follow-up.",
      ],
      faq: [
        { question: "Will this annoy visitors?", answer: "It should not. The experience is designed to be helpful, easy to dismiss, and matched to the visitor's intent." },
        { question: "Is this only for ConvertBox?", answer: "It is designed for ConvertBox, but the copy and decision path can also guide other website prompt tools." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "launch_upsell_click"],
  },
  {
    slug: "provider-launch",
    title: "Provider Launch Kit Funnel",
    geruPatterns: ["Agency Value Ladder", "High Ticket Call"],
    purpose: "Sell the complete provider foundation for serious, high-intent providers.",
    primaryAudience: "provider",
    temperature: "hot",
    entryPoints: ["High scorecard intent", "Multiple offer clicks", "For-business page", "Provider claim flow"],
    exitPoints: ["Launch kit purchased", "Growth subscription started", "Appointment requested"],
    empathy: "The provider needs the full operating foundation, not one isolated template.",
    motivation: "They want positioning, intake, proof, follow-up, and launch assets aligned.",
    voice: ["serious", "complete", "businesslike"],
    headline: "Set up the operating foundation for a serious Erie County service provider.",
    subheadline: "Get the positioning, intake, proof, follow-up, and launch assets needed to look ready.",
    primaryCta: "Launch my provider kit",
    primaryOfferSlug: "provider-launch-kit",
    orderBumpSlug: "growth-intelligence-subscription",
    nextFunnelSlugs: ["growth-intelligence", "government-opportunity"],
    steps: [
      {
        id: "foundation",
        label: "Foundation",
        visitorExperience: "The provider sees the full launch foundation.",
        systemAction: "Tag high_intent_provider.",
        exitEvent: "funnel.launch.foundation_viewed",
      },
      {
        id: "launch-checkout",
        label: "Launch checkout",
        visitorExperience: "The provider buys the launch kit.",
        systemAction: "Route to ThriveCart product 158.",
        exitEvent: "funnel.launch.checkout_started",
      },
    ],
    valueEquation: {
      dreamOutcome: "Look ready, trustworthy, and organized across the whole provider foundation.",
      perceivedLikelihood: "The kit bundles positioning, intake, proof, follow-up, and launch assets into one coherent system.",
      timeDelay: "The provider avoids piecing together disconnected templates.",
      effortAndSacrifice: "A fixed package reduces decision fatigue and setup ambiguity.",
    },
    offerMechanics: {
      ladderStage: "Premium implementation bundle",
      promise: "A complete local provider launch foundation.",
      riskReversal: "Scope is fixed and deliverables are explicit.",
      bonusLogic: ["Growth Intelligence supports continuity", "Scanner upsell fits high-value providers", "Lower rungs remain available for cautious buyers"],
      postPurchaseSequence: ["Welcome", "Quick win: complete foundation intake", "Common launch mistakes", "Provider example", "Continuity invitation", "Testimonial request"],
    },
    publicCopy: {
      eyebrow: "Provider foundation",
      title: "Set up the basics your service business needs to look ready and trustworthy.",
      subtitle: "Bring your offer, intake, proof, follow-up, and launch materials into one clearer provider foundation.",
      whoItsFor: "For serious Erie County providers who want more than one isolated template.",
      problem: "When your page, proof, intake, and follow-up do not match, buyers can feel friction even if you are the right provider.",
      outcome: "You get a more complete foundation for showing up professionally and handling interested buyers.",
      reassurance: "This is a fixed package with clear deliverables, so you know what you are getting.",
      included: [
        "Positioning and service-message guidance.",
        "Intake and follow-up assets.",
        "Trust and reputation prompts.",
        "Launch-ready materials for your provider presence.",
      ],
      steps: [
        "Clarify your service and buyer situation.",
        "Receive the practical assets for your foundation.",
        "Use the materials to improve how buyers understand and contact you.",
      ],
      faq: [
        { question: "Is this bigger than the page blueprint?", answer: "Yes. The blueprint focuses on one page. The launch kit covers more of the provider foundation." },
        { question: "Who should start here?", answer: "Providers who already know they want a fuller setup path instead of starting with a smaller diagnostic." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "purchase", "subscription_click"],
  },
  {
    slug: "growth-intelligence",
    title: "Growth Intelligence Funnel",
    geruPatterns: ["Micro Continuity", "Freemium Membership"],
    purpose: "Turn one-time kit buyers into recurring monthly intelligence customers.",
    primaryAudience: "provider",
    temperature: "customer",
    entryPoints: ["Post-purchase thank-you page", "Provider Launch buyer", "Seasonal kit buyer", "Monthly email"],
    exitPoints: ["Subscription active", "Monthly report delivered", "Churn/save flow entered"],
    empathy: "The provider does not want to keep guessing what to focus on.",
    motivation: "They want a repeatable monthly growth rhythm.",
    voice: ["steady", "practical", "forward-looking"],
    headline: "Know which Erie County service opportunities deserve attention each month.",
    subheadline: "Get monthly demand, seasonal, conversion, and next-action guidance for your category.",
    primaryCta: "Start growth intelligence",
    primaryOfferSlug: "growth-intelligence-subscription",
    nextFunnelSlugs: ["refund-prevention"],
    steps: [
      {
        id: "continuity-offer",
        label: "Continuity offer",
        visitorExperience: "The buyer sees why one-time improvements need ongoing signals.",
        systemAction: "Tag subscription_offer_view.",
        exitEvent: "funnel.growth.continuity_viewed",
      },
      {
        id: "subscription",
        label: "Subscription checkout",
        visitorExperience: "The buyer starts the monthly subscription.",
        systemAction: "Route to ThriveCart product 160.",
        exitEvent: "funnel.growth.checkout_started",
      },
    ],
    valueEquation: {
      dreamOutcome: "Know what to improve or promote each month without guessing.",
      perceivedLikelihood: "Monthly reports focus on demand, seasonality, conversion, and next actions.",
      timeDelay: "The buyer receives a repeatable monthly cadence instead of occasional strategy dumps.",
      effortAndSacrifice: "The subscription turns research and prioritization into a recurring service.",
    },
    offerMechanics: {
      ladderStage: "Managed monthly service",
      promise: "Ongoing local growth intelligence for the provider's category.",
      riskReversal: "Month-to-month continuity with clear report deliverables.",
      bonusLogic: ["Best sold after a concrete win", "Seasonal campaigns reinforce the need for continuity", "Save funnel protects retention"],
      postPurchaseSequence: ["Welcome", "Quick win: read this month's one action", "Common prioritization mistakes", "Monthly result example", "Next opportunity prompt", "Feedback request"],
    },
    publicCopy: {
      eyebrow: "Monthly guidance",
      title: "Know what deserves attention this month instead of guessing.",
      subtitle: "Get recurring service-category guidance for demand timing, improvement priorities, and local opportunities.",
      whoItsFor: "For providers who want a steady monthly rhythm for improving and watching their category.",
      problem: "Without regular guidance, it is easy to react late, chase the wrong idea, or forget the small changes that compound.",
      outcome: "You get a recurring view of what to focus on next.",
      reassurance: "This is meant to be practical, brief, and decision-oriented.",
      included: [
        "Monthly service-category notes.",
        "Seasonal and timing prompts.",
        "Recommended next actions.",
        "Opportunity and improvement signals when relevant.",
      ],
      steps: [
        "Start the monthly guidance plan.",
        "Review the clearest action for your category.",
        "Use the recommendation to decide what to improve or promote next.",
      ],
      faq: [
        { question: "Is this a custom consulting retainer?", answer: "No. It is a recurring guidance product designed to keep you oriented without a heavy consulting engagement." },
        { question: "Can I cancel later?", answer: "Yes. The support should keep earning its place." },
      ],
    },
    measurementEvents: ["subscription_offer_view", "checkout_start", "subscription_start", "report_open"],
  },
  {
    slug: "government-opportunity",
    title: "Government Opportunity Scanner Funnel",
    geruPatterns: ["Micro Continuity", "High Ticket Call", "Bridge"],
    purpose: "Sell recurring opportunity scanning for providers that can serve public-sector or institutional buyers.",
    primaryAudience: "provider",
    temperature: "hot",
    entryPoints: ["Gov-capable service family", "Provider Launch buyer", "High-value provider category", "Cleaning/snow/construction/restoration segments"],
    exitPoints: ["Subscription active", "Portal bump accepted", "Opportunity delivered"],
    empathy: "The provider may be able to serve public buyers but does not know where to look or what matters.",
    motivation: "They want relevant opportunities summarized in time to act.",
    voice: ["clear", "procurement-aware", "practical"],
    headline: "Track public-sector opportunities that can matter to Erie County providers.",
    subheadline: "Get monthly opportunity alerts and fit summaries for your service category.",
    primaryCta: "Start opportunity scanning",
    primaryOfferSlug: "government-opportunity-scanner",
    orderBumpSlug: "client-portal-starter-pack",
    nextFunnelSlugs: ["client-portal-starter", "refund-prevention"],
    steps: [
      {
        id: "bridge",
        label: "Opportunity bridge",
        visitorExperience: "The provider sees why opportunities are often missed.",
        systemAction: "Tag gov_capable_provider.",
        exitEvent: "funnel.gov.bridge_viewed",
      },
      {
        id: "scanner-checkout",
        label: "Scanner checkout",
        visitorExperience: "The provider starts the monthly scanner.",
        systemAction: "Route to ThriveCart product 161.",
        exitEvent: "funnel.gov.checkout_started",
      },
    ],
    valueEquation: {
      dreamOutcome: "Find public-sector opportunities worth acting on before the window closes.",
      perceivedLikelihood: "Fit summaries filter noise and connect opportunities to the provider's category.",
      timeDelay: "Relevant opportunities are surfaced monthly without manual searching.",
      effortAndSacrifice: "The provider avoids combing through procurement portals from scratch.",
    },
    offerMechanics: {
      ladderStage: "Premium monthly scanner",
      promise: "Relevant opportunity alerts and fit summaries for public-sector capable services.",
      riskReversal: "Subscription value is judged by the usefulness of recurring opportunity summaries.",
      bonusLogic: ["Client portal bump supports institutional readiness", "Provider Launch supports eligibility readiness", "Works only for service families with realistic public-sector fit"],
      postPurchaseSequence: ["Welcome", "Quick win: define fit criteria", "Common bid-readiness mistakes", "Opportunity example", "Portal readiness invitation", "Feedback request"],
    },
    publicCopy: {
      eyebrow: "Opportunity monitoring",
      title: "See public-sector opportunities that may fit your service business.",
      subtitle: "Get relevant opportunity alerts and plain-language fit summaries so you do not have to search from scratch.",
      whoItsFor: "For providers that can serve institutions, agencies, commercial properties, or public-sector buyers.",
      problem: "Many local providers could pursue larger opportunities, but they do not see them early enough or know whether they are worth attention.",
      outcome: "You get a simpler way to notice relevant opportunities and decide whether to act.",
      reassurance: "This does not promise contract wins. It helps you see and evaluate opportunities more consistently.",
      included: [
        "Category-aware opportunity monitoring.",
        "Plain-language fit summaries.",
        "Timing and next-action notes.",
        "Readiness prompts for larger buyers.",
      ],
      steps: [
        "Confirm your service category and opportunity fit.",
        "Review relevant opportunities when they appear.",
        "Decide whether to act, ignore, or prepare for a future fit.",
      ],
      faq: [
        { question: "Does this guarantee government work?", answer: "No. It helps you find and evaluate opportunities. Winning depends on fit, readiness, pricing, and the buyer's process." },
        { question: "Which providers is this best for?", answer: "It is strongest for services that can realistically serve public, institutional, commercial, or recurring buyers." },
      ],
    },
    measurementEvents: ["offer_view", "checkout_start", "subscription_start", "opportunity_open"],
  },
  {
    slug: "cart-abandonment",
    title: "Cart Abandonment Funnel",
    geruPatterns: ["Cart Abandonment Sequence"],
    purpose: "Recover buyers who start ThriveCart checkout but do not purchase.",
    primaryAudience: "provider",
    temperature: "hot",
    entryPoints: ["Checkout URL clicked", "ThriveCart checkout started", "Payment not completed"],
    exitPoints: ["Purchase completed", "Downsell accepted", "Nurture started", "Unsubscribed"],
    empathy: "The buyer may be distracted, uncertain, or worried about fit.",
    motivation: "They need a reminder, a clearer value summary, or a lower-friction next step.",
    voice: ["helpful", "unpressured", "clear"],
    headline: "Your Erie.Pro checkout is still open.",
    subheadline: "Here is what the offer gives you and the simplest next step if the full kit is not right yet.",
    primaryCta: "Return to checkout",
    nextFunnelSlugs: ["service-page-blueprint", "lead-readiness-scorecard"],
    steps: [
      {
        id: "one-hour",
        label: "One-hour reminder",
        visitorExperience: "The buyer receives a simple reminder.",
        systemAction: "Send reminder if purchase is absent.",
        exitEvent: "funnel.abandonment.one_hour_sent",
      },
      {
        id: "objection",
        label: "Objection email",
        visitorExperience: "The buyer receives a value and fit clarification.",
        systemAction: "Branch by abandoned offer.",
        exitEvent: "funnel.abandonment.objection_sent",
      },
      {
        id: "fallback",
        label: "Fallback",
        visitorExperience: "The buyer is offered a simpler next step.",
        systemAction: "Recommend blueprint or scorecard.",
        exitEvent: "funnel.abandonment.fallback_sent",
      },
    ],
    valueEquation: {
      dreamOutcome: "Complete the purchase without losing context or feeling pressured.",
      perceivedLikelihood: "The reminder restates value, fit, and guarantee without introducing fake discounts.",
      timeDelay: "One helpful recovery touch happens soon after the checkout signal.",
      effortAndSacrifice: "The buyer gets a direct return path or a simpler fallback.",
    },
    offerMechanics: {
      ladderStage: "Recovery path",
      promise: "Recover real hesitation without training buyers to wait for discounts.",
      riskReversal: "Restate the existing guarantee and offer a reply path for questions.",
      bonusLogic: ["No surprise discount", "One clear recovery CTA", "Fallback to a simpler product when fit is uncertain"],
      postPurchaseSequence: ["24-hour reminder", "Value recap", "Question invitation", "Clean exit if not interested"],
    },
    publicCopy: {
      eyebrow: "Need a moment?",
      title: "Come back when you are ready to finish.",
      subtitle: "If you were interested but got interrupted, you can return to the right Erie.Pro option without starting over.",
      whoItsFor: "For providers who started looking at an offer but need more time, clarity, or a simpler next step.",
      problem: "Sometimes a useful next step gets lost because the timing was off or a question came up.",
      outcome: "You can return to the option, review what is included, and decide without pressure.",
      reassurance: "No guilt, no surprise pressure, and no fake urgency.",
      included: [
        "A simple reminder of the option you were considering.",
        "A plain summary of what it helps with.",
        "A way back to checkout if you still want it.",
        "A lighter next step if the full option is not right.",
      ],
      steps: [
        "Review the option again.",
        "Decide whether it still fits.",
        "Continue, choose a lighter next step, or leave it alone.",
      ],
      faq: [
        { question: "Will I be pressured to buy?", answer: "No. The goal is a helpful return path, not pressure." },
        { question: "Will there be a discount for waiting?", answer: "No. The best reason to continue is fit, not a manufactured discount." },
      ],
    },
    measurementEvents: ["checkout_start", "abandonment_detected", "recovery_click", "recovered_purchase"],
  },
  {
    slug: "customer-onboarding",
    title: "Customer Onboarding Funnel",
    geruPatterns: ["Customer Onboarding"],
    purpose: "Make buyers feel confident after purchase and move them toward asset use and ascension.",
    primaryAudience: "provider",
    temperature: "customer",
    entryPoints: ["ThriveCart purchase", "Webhook event", "Thank-you page", "Asset delivery"],
    exitPoints: ["Asset opened", "Next offer clicked", "Support requested", "Subscription offered"],
    empathy: "The buyer needs confidence that their purchase is being handled and clarity on what to do first.",
    motivation: "They want the deliverable, a first action, and proof that Erie.Pro is organized.",
    voice: ["reassuring", "specific", "organized"],
    headline: "Purchase received. Your Erie.Pro deliverable is being prepared.",
    subheadline: "Start with the fastest action once your asset is ready.",
    primaryCta: "Open my deliverable",
    nextFunnelSlugs: ["growth-intelligence", "provider-launch", "convertbox-funnel"],
    steps: [
      {
        id: "thank-you",
        label: "Thank-you",
        visitorExperience: "The buyer sees confirmation and next-step timing.",
        systemAction: "Record purchase and trigger fulfillment.",
        exitEvent: "funnel.onboarding.thank_you_viewed",
      },
      {
        id: "asset",
        label: "Asset",
        visitorExperience: "The buyer opens the deliverable.",
        systemAction: "Track asset open and recommend next offer.",
        exitEvent: "funnel.onboarding.asset_opened",
      },
    ],
    valueEquation: {
      dreamOutcome: "Feel confident the purchase is useful and know exactly what to do first.",
      perceivedLikelihood: "A structured post-purchase sequence turns delivery into guided implementation.",
      timeDelay: "The buyer receives a first-action prompt immediately.",
      effortAndSacrifice: "Emails reduce the chance that the buyer buys, downloads, and never uses the asset.",
    },
    offerMechanics: {
      ladderStage: "Post-purchase activation",
      promise: "Every buyer gets guided toward use, feedback, and the next appropriate rung.",
      riskReversal: "Guarantee language remains visible after purchase, which builds trust and reduces regret.",
      bonusLogic: ["Quick win protects activation", "Common mistakes prevent refunds", "Day 14 next-step offer is soft, not pushy"],
      postPurchaseSequence: ["0hr welcome", "Day 1 quick win", "Day 3 common mistakes", "Day 7 use case", "Day 14 next step", "Day 30 testimonial request"],
    },
    publicCopy: {
      eyebrow: "After you buy",
      title: "Know exactly what to do first after your purchase.",
      subtitle: "Get a clear start, practical reminders, and guidance that helps you use what you bought instead of leaving it untouched.",
      whoItsFor: "For Erie.Pro customers who want the first step to feel clear after checkout.",
      problem: "A lot of useful material goes unused because the buyer is not sure where to start.",
      outcome: "You get a guided first action and simple follow-up so the purchase becomes easier to apply.",
      reassurance: "The guidance is meant to reduce overwhelm, not add more tasks.",
      included: [
        "Clear confirmation after purchase.",
        "A quick first action.",
        "Common mistake guidance.",
        "A practical example and later feedback request.",
      ],
      steps: [
        "Confirm what you bought and where to find it.",
        "Take the first useful action.",
        "Use the follow-up guidance to keep moving.",
      ],
      faq: [
        { question: "Will I know what to do first?", answer: "Yes. The experience is designed to make the first useful action clear." },
        { question: "Can I ask for help if something is unclear?", answer: "Yes. The follow-up path is meant to make confusion easier to catch and answer." },
      ],
    },
    measurementEvents: ["purchase", "thank_you_view", "asset_open", "next_offer_click"],
  },
  {
    slug: "refund-prevention",
    title: "Refund Prevention / Save Funnel",
    geruPatterns: ["Refund Prevention"],
    purpose: "Reduce cancellations by matching the save response to the buyer's reason.",
    primaryAudience: "provider",
    temperature: "customer",
    entryPoints: ["Refund request", "Subscription cancellation", "Low engagement", "Asset unopened", "Failed payment"],
    exitPoints: ["Saved", "Paused", "Downgraded", "Refunded", "Feedback captured"],
    empathy: "The buyer may feel overwhelmed, unclear on value, or unsure whether the offer fits.",
    motivation: "They want to feel heard and be offered a simpler path if one exists.",
    voice: ["respectful", "calm", "no-pressure"],
    headline: "Before you cancel, tell us what did not fit.",
    subheadline: "We may be able to simplify the next step, pause the plan, or point you to the exact asset you need.",
    primaryCta: "Tell us what happened",
    nextFunnelSlugs: [],
    steps: [
      {
        id: "reason",
        label: "Reason",
        visitorExperience: "The customer chooses why they want to cancel.",
        systemAction: "Tag save_reason.",
        exitEvent: "funnel.refund.reason_selected",
      },
      {
        id: "save-path",
        label: "Save path",
        visitorExperience: "The customer sees a pause, downgrade, quick-start, or graceful exit.",
        systemAction: "Record save outcome.",
        exitEvent: "funnel.refund.save_path_viewed",
      },
    ],
    valueEquation: {
      dreamOutcome: "Leave, pause, or simplify without feeling ignored.",
      perceivedLikelihood: "Reason-based save paths show the customer that the response matches their actual problem.",
      timeDelay: "The save path appears at the moment of cancellation or refund intent.",
      effortAndSacrifice: "The buyer can choose a simpler option or graceful exit without negotiation.",
    },
    offerMechanics: {
      ladderStage: "Retention / save path",
      promise: "Protect trust even when a customer wants to cancel.",
      riskReversal: "Refund and exit paths stay respectful; no pressure traps.",
      bonusLogic: ["Pause for timing objections", "Quick-start for overwhelm", "Downgrade for budget", "Feedback for product improvement"],
      postPurchaseSequence: ["Reason capture", "Matched save path", "Pause/downgrade/quick-start/exit", "Feedback recorded"],
    },
    publicCopy: {
      eyebrow: "Need to change course?",
      title: "Choose the next step that fits where you are now.",
      subtitle: "If an Erie.Pro option is not fitting, you should be able to pause, simplify, ask for help, or exit respectfully.",
      whoItsFor: "For customers who feel stuck, uncertain, overwhelmed, or no longer ready.",
      problem: "Sometimes the offer is useful, but the timing, complexity, or fit is wrong.",
      outcome: "You can choose a more appropriate next step without feeling trapped.",
      reassurance: "The goal is to preserve trust, even when the right answer is to stop.",
      included: [
        "A clear way to explain what did not fit.",
        "A simpler next step when one makes sense.",
        "A pause or exit path when that is the right answer.",
        "Feedback that helps Erie.Pro improve.",
      ],
      steps: [
        "Choose what is not working.",
        "Review the simplest matching option.",
        "Pause, simplify, continue, or exit.",
      ],
      faq: [
        { question: "Will I be forced through a hard sell?", answer: "No. The experience should respect your decision and help only if there is a better fit." },
        { question: "What if I just want to stop?", answer: "That should be an available path. Trust matters more than forcing a poor fit." },
      ],
    },
    measurementEvents: ["cancel_signal", "reason_selected", "save_offer_view", "saved", "refund"],
  },
]

export const digitalProductsLessons = {
  sourceRepository: "pinohu/digitalproducts",
  adoptedPrinciples: [
    "One outcome per offer: each Erie.Pro product must promise one concrete provider result.",
    "Value equation discipline: raise dream outcome and likelihood while lowering delay and effort.",
    "Bonuses are objection-handling assets, not filler.",
    "Order bumps should raise average order value without confusing the primary checkout decision.",
    "No fake scarcity or abandonment discounts; use honest urgency and respectful recovery.",
    "Every purchase needs activation, quick win, mistake prevention, next-rung awareness, and testimonial capture.",
    "Bundles should be built only from adjacent products for the same avatar.",
    "Operate one implementation sprint at a time so Erie.Pro does not spread itself thin.",
  ],
  valueLadder: [
    { rung: "Free", price: "$0", role: "Lead magnet or diagnostic that earns trust before a sale." },
    { rung: "Trust tripwire", price: "$49-$149", role: "Specific playbook, kit, or blueprint with a fast practical win." },
    { rung: "Toolkit", price: "$197-$497", role: "Templates, decision trees, SOPs, and implementation assets." },
    { rung: "Bundle", price: "$497-$997", role: "Adjacent assets packaged as a named operating system." },
    { rung: "Implementation sprint", price: "$2,500-$10,000", role: "Fixed-window done-with-you or done-for-you setup." },
    { rung: "Managed monthly", price: "$500-$5,000/mo", role: "Ongoing operation, optimization, reporting, or opportunity monitoring." },
  ],
  salesPageSections: [
    "Specific outcome headline",
    "Avatar-qualifying subheadline",
    "Pain and current-state clarity",
    "Promise and transformation",
    "Authority and why Erie.Pro",
    "What is inside, outcome-framed",
    "Bonus stack",
    "Risk reversal",
    "Social proof",
    "Pricing stack",
    "FAQ",
    "Final CTA with honest urgency",
  ],
  postPurchaseCadence: [
    "0hr welcome and delivery confirmation",
    "Day 1 quick win",
    "Day 3 common mistakes",
    "Day 7 use case or example",
    "Day 14 soft next-step invitation",
    "Day 30 testimonial and feedback request",
  ],
  sprintModel: [
    "Days 1-3: validate, outline, price, and engineer the offer.",
    "Days 4-8: build the deliverable and bonuses.",
    "Days 9-11: polish, sales page, checkout, and email workflow.",
    "Days 12-13: pre-launch checks and proof/testimonial gathering.",
    "Day 14: launch, measure, and decide the next improvement.",
  ],
}

export function getFunnelBySlug(slug: string | null | undefined) {
  if (!slug) return null
  return salesFunnels.find((funnel) => funnel.slug === slug) ?? null
}

export function getFunnelsForService(serviceSlug: string): FunnelRecommendation[] {
  const niche = getNicheBySlug(serviceSlug)
  if (!niche) return []
  const serviceFamily = inferServiceFamily(niche.slug)
  const offerRecommendations = getServiceOfferRecommendations(niche)

  const prioritized = new Map<FunnelSlug, { reason: string; priority: number }>()
  prioritized.set("provider-discovery", {
    reason: `Start by separating ${niche.label.toLowerCase()} providers from residents requesting service.`,
    priority: 10,
  })
  prioritized.set("lead-readiness-scorecard", {
    reason: `Diagnose the ${niche.label.toLowerCase()} provider's page, proof, intake, and follow-up path.`,
    priority: 20,
  })
  prioritized.set("service-page-blueprint", {
    reason: `The default paid first step for ${niche.label.toLowerCase()} providers.`,
    priority: 30,
  })

  for (const recommendation of offerRecommendations) {
    const priority = recommendation.priority + 30
    if (recommendation.offerSlug === "missed-call-recovery-kit") {
      prioritized.set("missed-call-recovery", {
        reason: recommendation.conversionAngle,
        priority,
      })
    }
    if (recommendation.offerSlug === "seasonal-booking-campaign-pack") {
      prioritized.set("seasonal-booking", {
        reason: recommendation.conversionAngle,
        priority,
      })
    }
    if (recommendation.offerSlug === "client-portal-starter-pack") {
      prioritized.set("client-portal-starter", {
        reason: recommendation.conversionAngle,
        priority,
      })
    }
    if (recommendation.offerSlug === "government-opportunity-scanner") {
      prioritized.set("government-opportunity", {
        reason: recommendation.conversionAngle,
        priority,
      })
    }
  }

  prioritized.set("convertbox-funnel", {
    reason: `Give ${niche.label.toLowerCase()} providers a service-aware overlay funnel for existing pages.`,
    priority: 80,
  })
  prioritized.set("review-reputation", {
    reason: `Help ${niche.label.toLowerCase()} providers make trust visible before buyers call.`,
    priority: 90,
  })
  prioritized.set("provider-launch", {
    reason: `Offer the complete foundation to serious ${niche.label.toLowerCase()} providers.`,
    priority: 100,
  })
  prioritized.set("growth-intelligence", {
    reason: `Keep ${niche.label.toLowerCase()} providers focused on monthly demand and next actions.`,
    priority: 110,
  })
  prioritized.set("customer-onboarding", {
    reason: "Every purchase should enter onboarding and fulfillment.",
    priority: 900,
  })
  prioritized.set("cart-abandonment", {
    reason: "Every checkout start should have a recovery path.",
    priority: 910,
  })
  prioritized.set("refund-prevention", {
    reason: "Every subscription or purchase should have a save path.",
    priority: 920,
  })

  return Array.from(prioritized.entries())
    .map(([slug, details]) => {
      const funnel = getFunnelBySlug(slug)!
      const offer = funnel.primaryOfferSlug ? getOfferBySlug(funnel.primaryOfferSlug) : undefined
      return {
        funnel,
        serviceSlug: niche.slug,
        serviceLabel: niche.label,
        serviceFamily,
        reason: details.reason,
        priority: details.priority,
        offer,
        orderBump: funnel.orderBumpSlug ? getOfferBySlug(funnel.orderBumpSlug) : undefined,
        checkoutUrl: offer?.checkoutUrl,
      }
    })
    .sort((a, b) => a.priority - b.priority)
}

export function getFunnelJourneyMap(serviceSlug?: string) {
  const niche = serviceSlug ? getNicheBySlug(serviceSlug) : null
  const serviceFamily = niche ? inferServiceFamily(niche.slug) : undefined
  const recommendations = niche ? getFunnelsForService(niche.slug) : []
  return {
    service: niche
      ? {
          slug: niche.slug,
          label: niche.label,
          family: serviceFamily,
          avgProjectValue: niche.avgProjectValue,
        }
      : null,
    entryPoints: [
      "Live Erie.Pro service pages",
      "ConvertBox provider overlays",
      "For-business and claim pages",
      "ThriveCart checkout starts",
      "Post-purchase thank-you and asset pages",
      "Subscription cancellation or support signals",
    ],
    globalExitPoints: [
      "Requester lead submitted",
      "Provider scorecard completed",
      "Checkout started",
      "Purchase completed",
      "Asset delivered",
      "Subscription started",
      "Recovered abandoned checkout",
      "Customer saved or gracefully exited",
    ],
    recommendations,
  }
}

export function choosePrimaryFunnel(input: {
  serviceSlug?: string | null
  visitorIntent?: VisitorIntent | null
  temperature?: VisitorTemperature | null
  eventType?: string | null
  sourcePageType?: string | null
}) {
  const service = input.serviceSlug ? getNicheBySlug(input.serviceSlug) : null
  const family = service ? inferServiceFamily(service.slug) : null
  const eventType = input.eventType?.toLowerCase() ?? ""

  if (input.visitorIntent === "requester") return getFunnelBySlug("provider-discovery")
  if (input.temperature === "customer" || eventType.includes("purchase")) return getFunnelBySlug("customer-onboarding")
  if (eventType.includes("checkout") && eventType.includes("abandon")) return getFunnelBySlug("cart-abandonment")

  if (family === "Emergency Home Response" || family === "Auto Marine Roadside") {
    return getFunnelBySlug("missed-call-recovery")
  }
  if (family === "Seasonal Erie Services") return getFunnelBySlug("seasonal-booking")
  if (
    family === "Professional and Financial" ||
    family === "Health and Appointments" ||
    family === "Cleaning and Turnover"
  ) {
    return getFunnelBySlug("client-portal-starter")
  }

  if (input.temperature === "hot") return getFunnelBySlug("convertbox-funnel")
  if (input.temperature === "warm") return getFunnelBySlug("service-page-blueprint")
  return getFunnelBySlug("provider-discovery")
}

export function getServiceFamilySummary() {
  const families = new Map<string, LocalNiche[]>()
  for (const niche of niches) {
    const family = inferServiceFamily(niche.slug)
    const existing = families.get(family) ?? []
    existing.push(niche)
    families.set(family, existing)
  }

  return Array.from(families.entries()).map(([family, items]) => ({
    family,
    count: items.length,
    services: items.map((item) => ({ slug: item.slug, label: item.label })),
    primaryFunnels: items[0] ? getFunnelsForService(items[0].slug).slice(0, 5).map((item) => item.funnel.slug) : [],
  }))
}

export function getOfferFunnelCoverage() {
  return automatedOffers.map((offer) => ({
    offer,
    funnels: salesFunnels.filter(
      (funnel) => funnel.primaryOfferSlug === offer.slug || funnel.orderBumpSlug === offer.slug,
    ),
  }))
}

export function getDigitalProductsLessons() {
  return digitalProductsLessons
}
