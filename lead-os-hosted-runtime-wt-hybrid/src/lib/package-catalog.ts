import { publicPlans, type PublicPlanId } from "./public-offer.ts";

export type PackageSlug =
  | "ai-opportunity-audit"
  | "ghost-expert-course-factory"
  | "ai-receptionist-missed-call-recovery"
  | "lead-reactivation-engine"
  | "speed-to-lead-system"
  | "content-repurposing-engine"
  | "ai-ugc-video-ad-studio"
  | "med-spa-growth-engine"
  | "webinar-lead-magnet-factory"
  | "founder-ai-chief-of-staff"
  | "ai-first-business-os"
  | "local-service-lead-engine"
  | "agency-client-workspace"
  | "directory-monetization-system"
  | "saas-trial-conversion-system"
  | "consultant-authority-funnel"
  | "franchise-territory-router"
  | "marketplace-lead-seller-system"
  | "affiliate-partner-revenue-system"
  | "reactivation-retention-system"
  | "operator-control-plane-system"
  | "content-distribution-engine"
  | "revenue-attribution-suite";

export type CredentialFieldType = "text" | "email" | "url" | "password" | "textarea" | "select";

export interface PackageCredentialField {
  key: string;
  label: string;
  type: CredentialFieldType;
  required: boolean;
  helper: string;
  options?: string[];
  sensitive?: boolean;
}

export interface PackageDeliverable {
  id: string;
  title: string;
  createdArtifact: string;
  launchSurface: "workspace" | "capture" | "operator" | "automation" | "billing" | "reporting";
}

export interface ProvisionablePackage {
  slug: PackageSlug;
  title: string;
  planIds: PublicPlanId[];
  customerOutcome: string;
  buyerPersona: string;
  launchPromise: string;
  pricingModel?: string;
  autonomousWorkflow?: string[];
  credentialFields: PackageCredentialField[];
  deliverables: PackageDeliverable[];
}

export const aiAgencyPackageSlugs = [
  "ai-opportunity-audit",
  "ghost-expert-course-factory",
  "ai-receptionist-missed-call-recovery",
  "lead-reactivation-engine",
  "speed-to-lead-system",
  "content-repurposing-engine",
  "ai-ugc-video-ad-studio",
  "med-spa-growth-engine",
  "webinar-lead-magnet-factory",
  "founder-ai-chief-of-staff",
  "ai-first-business-os",
] as const satisfies readonly PackageSlug[];

export const simpleOnboardingFieldKeys = [
  "brandName",
  "operatorEmail",
  "primaryDomain",
  "targetMarket",
  "primaryOffer",
  "idealCustomerProfile",
  "successMetric",
  "currentProcess",
  "fulfillmentConstraints",
  "brandVoice",
  "avatarVoiceConsent",
] as const;

const defaultNicheExamples = [
  "local services",
  "professional services",
  "B2B services",
  "creator-led businesses",
  "ecommerce brands",
  "multi-location operators",
];

const packageNicheExamples: Record<PackageSlug, string[]> = {
  "ai-opportunity-audit": ["SMBs", "agencies", "consultancies", "local operators", "startup teams"],
  "ghost-expert-course-factory": ["consultants", "coaches", "clinicians", "attorneys", "B2B experts"],
  "ai-receptionist-missed-call-recovery": ["med spas", "dentists", "HVAC", "roofers", "restaurants"],
  "lead-reactivation-engine": ["med spas", "real estate", "home services", "agencies", "coaches"],
  "speed-to-lead-system": ["law firms", "dental clinics", "real estate", "home services", "B2B SaaS"],
  "content-repurposing-engine": ["creators", "coaches", "consultants", "podcasters", "founders"],
  "ai-ugc-video-ad-studio": ["beauty ecommerce", "skincare", "wellness", "apparel", "consumer products"],
  "med-spa-growth-engine": ["med spas", "aesthetic clinics", "laser clinics", "wellness clinics", "salons"],
  "webinar-lead-magnet-factory": ["B2B SaaS", "agencies", "consultancies", "education brands", "communities"],
  "founder-ai-chief-of-staff": ["solo founders", "creators", "agency owners", "consultants", "executives"],
  "ai-first-business-os": ["SMBs", "startups", "agencies", "operator-led companies", "micro businesses"],
  "local-service-lead-engine": ["roofers", "HVAC", "landscapers", "plumbers", "electricians"],
  "agency-client-workspace": ["marketing agencies", "lead-gen agencies", "consultancies", "fractional CMOs", "operators"],
  "directory-monetization-system": ["local directories", "media sites", "niche directories", "community portals", "review sites"],
  "saas-trial-conversion-system": ["B2B SaaS", "PLG tools", "vertical SaaS", "AI apps", "subscription software"],
  "consultant-authority-funnel": ["consultants", "coaches", "fractional executives", "advisors", "experts"],
  "franchise-territory-router": ["franchises", "multi-location brands", "dealers", "field-service networks", "territory teams"],
  "marketplace-lead-seller-system": ["lead sellers", "pay-per-lead networks", "marketplaces", "agencies", "vertical media"],
  "affiliate-partner-revenue-system": ["affiliate programs", "partner teams", "channel programs", "creator programs", "resellers"],
  "reactivation-retention-system": ["clinics", "gyms", "coaches", "SaaS teams", "service businesses"],
  "operator-control-plane-system": ["agencies", "operators", "internal teams", "AI system owners", "service factories"],
  "content-distribution-engine": ["creators", "B2B marketers", "course sellers", "consultants", "communities"],
  "revenue-attribution-suite": ["agencies", "SaaS teams", "ecommerce brands", "partner programs", "lead sellers"],
};

export interface PackageAutomationContract {
  modular: true;
  fullyAutomated: boolean;
  requiresAdditionalConfiguration: false;
  simpleOnboardingFields: readonly string[];
  nicheExamples: string[];
  deliveryMode: "complete-solution";
}

const baseFields: PackageCredentialField[] = [
  {
    key: "brandName",
    label: "Client brand name",
    type: "text",
    required: true,
    helper: "Used to personalize the finished solution and customer-facing pages.",
  },
  {
    key: "operatorEmail",
    label: "Primary delivery contact",
    type: "email",
    required: true,
    helper: "Receives completion notices, customer-ready links, and outcome reports.",
  },
  {
    key: "primaryDomain",
    label: "Primary domain",
    type: "url",
    required: true,
    helper: "The customer's site or domain where the finished solution should point traffic.",
  },
  {
    key: "targetMarket",
    label: "Target customer segment",
    type: "text",
    required: true,
    helper: "Example: roofing companies in Erie, B2B SaaS founders, local med spas.",
  },
  {
    key: "primaryOffer",
    label: "Outcome the customer wants to sell or achieve",
    type: "textarea",
    required: true,
    helper: "Describe the result this solution should create for the customer's buyers or internal team.",
  },
  {
    key: "idealCustomerProfile",
    label: "Who this solution is for",
    type: "textarea",
    required: true,
    helper: "Describe the buyer, patient, lead, student, client, or internal user who should benefit.",
  },
  {
    key: "successMetric",
    label: "How success should be measured",
    type: "text",
    required: true,
    helper: "Example: booked appointments, recovered revenue, hours saved, content shipped, calls answered.",
  },
  {
    key: "currentProcess",
    label: "How the customer handles this problem today",
    type: "textarea",
    required: true,
    helper: "Explain the current manual process, bottlenecks, missed opportunities, or broken handoffs.",
  },
  {
    key: "fulfillmentConstraints",
    label: "Rules, limits, and approval requirements",
    type: "textarea",
    required: true,
    helper: "Include compliance rules, claims to avoid, human approval points, geography, hours, or service limits.",
  },
  {
    key: "brandVoice",
    label: "Brand voice and customer experience",
    type: "textarea",
    required: true,
    helper: "Describe how the finished solution should sound and feel to customers.",
  },
];

const crmField: PackageCredentialField = {
  key: "crmApiKey",
  label: "CRM or customer list access details",
  type: "textarea",
  required: false,
  helper: "Optional. If omitted, the solution launches with an import-ready customer list and handoff process.",
  sensitive: true,
};

const stripeField: PackageCredentialField = {
  key: "stripeSecretKey",
  label: "Billing or payment account access details",
  type: "textarea",
  required: false,
  helper: "Optional. If omitted, the solution launches with quote, invoice, and payment-handoff instructions.",
  sensitive: true,
};

const webhookField: PackageCredentialField = {
  key: "webhookUrl",
  label: "Where completed lead or outcome notices should be sent",
  type: "url",
  required: false,
  helper: "Optional destination for lead notices, status changes, and outcome updates.",
};

const calendarField: PackageCredentialField = {
  key: "bookingUrl",
  label: "Booking calendar link",
  type: "url",
  required: false,
  helper: "Optional. If omitted, the solution launches with a qualified-lead handoff and booking instructions.",
};

const crmExportField: PackageCredentialField = {
  key: "crmExportUrl",
  label: "Customer list, old lead list, or CRM export",
  type: "url",
  required: false,
  helper: "Optional. If omitted, the solution launches with an import-ready list template and reactivation plan.",
  sensitive: true,
};

const adAccountField: PackageCredentialField = {
  key: "adAccountAccess",
  label: "Ad account, campaign, or performance context",
  type: "textarea",
  required: false,
  helper: "Optional. Include past ads, spend, winners, losers, or reporting access if available.",
  sensitive: true,
};

const contentSourceField: PackageCredentialField = {
  key: "sourceAssetUrl",
  label: "Source material for the solution",
  type: "url",
  required: false,
  helper: "Optional video, webinar, podcast, document, notes, product page, or prior training material.",
};

const brandAssetsField: PackageCredentialField = {
  key: "brandAssetsUrl",
  label: "Brand assets and examples",
  type: "url",
  required: false,
  helper: "Logo, colors, fonts, product images, examples, and visual references.",
};

const consentField: PackageCredentialField = {
  key: "avatarVoiceConsent",
  label: "Avatar or voice consent confirmation",
  type: "select",
  required: true,
  helper: "Required for avatar, voice, or likeness generation. Select not-applicable when no likeness is produced.",
  options: ["approved", "not-applicable"],
};

const complianceField: PackageCredentialField = {
  key: "complianceRules",
  label: "Additional compliance or claims rules",
  type: "textarea",
  required: false,
  helper: "Medical, financial, legal, ad-platform, privacy, claim-substantiation, or brand restrictions.",
};

const socialAccessField: PackageCredentialField = {
  key: "socialAccountAccess",
  label: "Social publishing or approval context",
  type: "textarea",
  required: false,
  helper: "Optional. Include approval rules, target platforms, publishing cadence, or scheduler access.",
  sensitive: true,
};

const emailCalendarAccessField: PackageCredentialField = {
  key: "emailCalendarAccess",
  label: "Inbox, calendar, and task process details",
  type: "textarea",
  required: false,
  helper: "Optional. Include delegation rules, recurring meetings, task systems, and follow-up preferences.",
  sensitive: true,
};

const voicePhoneField: PackageCredentialField = {
  key: "phoneProviderAccess",
  label: "Phone, SMS, and call-routing details",
  type: "textarea",
  required: false,
  helper: "Optional. Include numbers, call-forwarding rules, SMS preferences, and escalation contacts.",
  sensitive: true,
};

function deliverables(prefix: string, items: Array<[string, string, PackageDeliverable["launchSurface"]]>): PackageDeliverable[] {
  return items.map(([title, createdArtifact, launchSurface], index) => ({
    id: `${prefix}-${index + 1}`,
    title,
    createdArtifact,
    launchSurface,
  }));
}

export const provisionablePackages: ProvisionablePackage[] = [
  {
    slug: "ai-opportunity-audit",
    title: "AI opportunity audit",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "SMBs, founders, agencies, and operators who know AI matters but do not know what to install first.",
    customerOutcome: "Get a concrete AI implementation roadmap that shows where AI will save time, recover revenue, or reduce operating risk.",
    launchPromise: "A finished AI opportunity report with maturity score, process map, prioritized solution backlog, ROI estimates, and 30-day rollout plan.",
    pricingModel: "$500-$15,000 audit depending on company size; upgrades into implementation packages.",
    autonomousWorkflow: [
      "Audit Agent collects business model, departments, pain points, goals, constraints, and success metrics.",
      "Process Mapping Agent converts inputs into sales, marketing, delivery, admin, finance, and support workflows.",
      "Opportunity Agent scores each workflow by ROI, complexity, risk, and time-to-value.",
      "Roadmap Agent produces a 30-day install plan with quick wins and high-ticket follow-on packages.",
    ],
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("ai-audit", [
      ["AI maturity score", "Scored assessment of current AI usage, data readiness, operational leverage, and outcome potential.", "reporting"],
      ["Department workflow map", "Sales, marketing, delivery, admin, support, finance, and leadership process inventory.", "workspace"],
      ["Solution opportunity backlog", "Prioritized list of outcome improvements ranked by revenue impact, hours saved, complexity, and risk.", "automation"],
      ["ROI estimate table", "Plain-language estimate of hours saved, revenue recovered, risk reduced, and monthly value.", "reporting"],
      ["Recommended implementation plan", "Step-by-step solution plan mapped to the customer's current systems and constraints.", "workspace"],
      ["30-day implementation roadmap", "Week-by-week plan for the first workflow installs and owner responsibilities.", "operator"],
      ["Risk and compliance notes", "Data, claims, approval, privacy, and human-review requirements for AI deployment.", "workspace"],
      ["Upgrade path", "Recommended next package: receptionist, reactivation, content engine, chief of staff, or AI-first OS.", "operator"],
    ]),
  },
  {
    slug: "ghost-expert-course-factory",
    title: "Ghost expert course factory",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Experts, consultants, coaches, educators, and regulated professionals with valuable expertise but no finished course.",
    customerOutcome: "Turn trapped expertise into a finished branded course without the expert writing scripts or performing on camera.",
    launchPromise: "A finished course-production solution with knowledge extraction, curriculum, scripts, avatar-ready modules, workbook, launch copy, and QA.",
    pricingModel: "$5,000-$40,000 per course; $2,000-$8,000 per language localization; $1,000-$5,000/month updates.",
    autonomousWorkflow: [
      "Knowledge Extraction Agent interviews the expert module-by-module from voice notes or calls.",
      "Curriculum Agent turns raw expertise into modules, lessons, outcomes, exercises, and edge cases.",
      "Teaching Polish Agent adds pacing, pauses, examples, emphasis, and plain-language transitions.",
      "Production Agent prepares avatar/video scripts, branded backgrounds, workbook, sales page, and launch emails.",
    ],
    credentialFields: [...baseFields, consentField, contentSourceField, brandAssetsField, complianceField, webhookField],
    deliverables: deliverables("ghost-course", [
      ["Expert intake interview map", "Question set that extracts tacit knowledge, examples, mistakes, objections, and edge cases.", "workspace"],
      ["Course architecture", "Promise, learner profile, modules, lesson outcomes, sequencing, and completion criteria.", "workspace"],
      ["Polished lesson scripts", "Avatar-ready scripts with teaching rhythm, emphasis notes, pauses, and human-sounding phrasing.", "automation"],
      ["Avatar production brief", "Consent status, visual style, backgrounds, icon system, and video rendering checklist.", "automation"],
      ["Workbook and exercises", "Lesson summaries, worksheets, action steps, checklists, and student implementation prompts.", "workspace"],
      ["Course sales page copy", "Headline, promise, audience, modules, proof blocks, offer stack, FAQs, and CTA copy.", "capture"],
      ["Launch email sequence", "Announcement, value, objection, proof, deadline, and enrollment emails.", "automation"],
      ["Course QA report", "Checks for module completeness, claim risk, missing examples, learning outcomes, and handoff readiness.", "reporting"],
    ]),
  },
  {
    slug: "ai-receptionist-missed-call-recovery",
    title: "AI receptionist and missed-call recovery",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Med spas, dentists, HVAC, roofers, salons, restaurants, clinics, and appointment-heavy local businesses.",
    customerOutcome: "Recover missed calls, answer common questions, qualify callers, and book appointments 24/7.",
    launchPromise: "A complete missed-call recovery solution with business knowledge base, call flows, booking handoff, transcript log, SMS fallback, and monitoring.",
    pricingModel: "$2,000-$15,000 setup plus $400-$3,000/month; usage billed to the customer.",
    autonomousWorkflow: [
      "Voice Intake Agent collects services, hours, prices, FAQs, booking rules, and escalation contacts.",
      "Conversation Designer Agent creates answer, qualify, book, transfer, spam-filter, and fallback flows.",
      "Test Call Agent simulates appointment, price, emergency, objection, spam, and escalation scenarios.",
      "Monitoring Agent reviews transcripts and proposes script improvements weekly.",
    ],
    credentialFields: [...baseFields, calendarField, voicePhoneField, crmField, complianceField, webhookField],
    deliverables: deliverables("ai-receptionist", [
      ["Business knowledge base", "Structured services, pricing, hours, location, policies, FAQs, and disallowed answers.", "workspace"],
      ["Inbound call script", "Greeting, qualification, FAQ, booking, transfer, and fallback call flow.", "automation"],
      ["Booking handoff", "Calendar routing logic with confirmation and unavailable-slot fallback.", "operator"],
      ["Missed-call SMS recovery", "Prepared SMS sequence for callers who disconnect or cannot complete booking.", "automation"],
      ["Human escalation rules", "Urgent, sensitive, angry, medical/legal, and high-value caller transfer logic.", "operator"],
      ["Call transcript dashboard", "Call summary, lead details, intent, booking state, and next action view.", "reporting"],
      ["Test call suite", "Acceptance scenarios for common questions, booking, spam, escalation, and off-hours calls.", "workspace"],
      ["Optimization report", "Weekly improvement checklist for unanswered questions, drop-offs, and booking failures.", "reporting"],
    ]),
  },
  {
    slug: "lead-reactivation-engine",
    title: "Lead reactivation engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Businesses with dormant CRM leads, old inquiries, stale quotes, abandoned consults, or past customers.",
    customerOutcome: "Turn leads the business already paid for into booked appointments and recovered pipeline.",
    launchPromise: "A complete lead reactivation solution with list cleanup, segments, SMS/email/call sequences, reply handling, booking, and ROI reporting.",
    pricingModel: "$3,000-$15,000 setup or $50-$300 per booked appointment; optional $1,000-$5,000/month optimization.",
    autonomousWorkflow: [
      "CRM Audit Agent cleans, deduplicates, suppresses, and segments the old list.",
      "Offer Agent creates reactivation angles from the customer's service, promotion, and lead history.",
      "Reply Agent classifies yes, no, later, question, objection, complaint, unsubscribe, and booked states.",
      "Booking Agent schedules qualified leads and updates the outcome dashboard.",
    ],
    credentialFields: [...baseFields, crmExportField, calendarField, crmField, voicePhoneField, complianceField, webhookField],
    deliverables: deliverables("lead-reactivation", [
      ["CRM cleanup plan", "Import, dedupe, suppression, stale-record, missing-field, and segment readiness report.", "workspace"],
      ["Dormant lead segments", "Buckets for no-show, old inquiry, abandoned quote, past customer, churn risk, and high-value lead.", "operator"],
      ["Reactivation offer map", "Offer angles for check-in, reopened quote, limited slots, new package, and past-customer winback.", "workspace"],
      ["SMS/email sequence", "Multi-touch reactivation messages with compliance-safe opt-out and reply routing.", "automation"],
      ["AI reply classifier", "Rules for reply categories, booking intent, objections, and human handoff.", "automation"],
      ["Booked appointment flow", "Calendar handoff, confirmation message, CRM status update, and no-show recovery.", "operator"],
      ["Recovered revenue dashboard", "Leads contacted, replies, booked appointments, pipeline value, and estimated recovered revenue.", "reporting"],
      ["Suppression and consent log", "Do-not-contact, unsubscribe, duplicate, invalid, and sensitive-contact handling.", "reporting"],
    ]),
  },
  {
    slug: "speed-to-lead-system",
    title: "Speed-to-lead system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Businesses running paid ads, landing pages, form fills, quote requests, demos, or booking funnels.",
    customerOutcome: "Contact every new lead within 60 seconds so competitors do not win the conversation first.",
    launchPromise: "A complete speed-to-lead solution with instant intake, SMS/email/voice follow-up, qualification, booking, CRM update, and SLA reporting.",
    pricingModel: "$3,000-$10,000 setup plus about 20% monthly retainer.",
    autonomousWorkflow: [
      "Webhook Agent captures every ad, landing-page, form, or chat lead event.",
      "Qualification Agent scores fit, urgency, budget, timeline, and service interest.",
      "Voice/SMS Agent responds immediately with approved scripts and fallback handling.",
      "SLA Reporting Agent tracks time-to-first-touch, booked calls, and conversion movement.",
    ],
    credentialFields: [...baseFields, calendarField, crmField, voicePhoneField, adAccountField, webhookField],
    deliverables: deliverables("speed-lead", [
      ["Lead capture webhook", "Endpoint and payload schema for Meta, Google, landing pages, and quote forms.", "automation"],
      ["Instant response script", "Approved SMS, email, and optional voice script triggered immediately after lead submission.", "automation"],
      ["Lead qualification flow", "Question set and score rules for fit, urgency, budget, timeline, and route.", "capture"],
      ["Booking route", "Calendar handoff with rep routing, fallback, reminders, and confirmation states.", "operator"],
      ["CRM pipeline update", "Field map for new, contacted, qualified, booked, no-response, and nurture stages.", "automation"],
      ["Sales rep alert", "Internal alert template with lead context, score, source, and next action.", "operator"],
      ["Follow-up sequence", "No-response and later-interest follow-up messages with stop conditions.", "automation"],
      ["Speed-to-lead dashboard", "Time-to-first-touch, contacted count, booked count, source, and SLA miss report.", "reporting"],
    ]),
  },
  {
    slug: "content-repurposing-engine",
    title: "AI content repurposing engine",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Creators, consultants, coaches, founders, podcasters, agencies, and expert-led businesses.",
    customerOutcome: "Turn one source asset into a full month of platform-native content without asking the customer to create more.",
    launchPromise: "A complete content repurposing solution with transcript extraction, idea mining, posts, newsletters, blogs, carousels, captions, calendar, and approvals.",
    pricingModel: "$1,500-$8,000/month; premium creator packages can exceed $10,000/month.",
    autonomousWorkflow: [
      "Transcript Agent extracts source material from videos, calls, podcasts, or documents.",
      "Insight Agent identifies hooks, frameworks, stories, claims, and quotable moments.",
      "Platform Agent adapts content for LinkedIn, X, Instagram, YouTube, newsletter, and blog formats.",
      "Scheduler Agent prepares an approval queue and publishing calendar.",
    ],
    credentialFields: [...baseFields, contentSourceField, brandAssetsField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("content-repurpose", [
      ["Source transcript and idea map", "Clean transcript with hooks, frameworks, stories, quotes, and content pillars extracted.", "workspace"],
      ["LinkedIn/X post pack", "Platform-native text posts with hooks, proof, CTA, and audience-specific framing.", "workspace"],
      ["Newsletter and blog drafts", "Longer-form assets derived from the same source with subject lines and SEO titles.", "workspace"],
      ["Short-form clip plan", "Clip timestamps, hooks, titles, captions, and visual notes for Shorts/Reels/TikTok.", "workspace"],
      ["Carousel copy", "Slide-by-slide carousel copy with headline, proof, lesson, and CTA structure.", "workspace"],
      ["Publishing calendar", "30-day calendar with platform, asset, CTA, and approval status.", "operator"],
      ["Approval queue", "Client-ready review board showing approved, revise, rejected, and scheduled assets.", "operator"],
      ["Performance report", "Engagement, followers, clicks, leads, top themes, and next-month content recommendations.", "reporting"],
    ]),
  },
  {
    slug: "ai-ugc-video-ad-studio",
    title: "AI UGC and video ad studio",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Ecommerce, beauty, skincare, wellness, product, and paid-media brands that need constant creative testing.",
    customerOutcome: "Create high-volume product ad creative faster and cheaper than traditional UGC production.",
    launchPromise: "A complete ad-creative solution with product research, review mining, hooks, scripts, AI UGC briefs, static ads, compliance checks, and testing plan.",
    pricingModel: "$1,500-$5,000/month or $100-$300 per creative; $3,000-$10,000/month with ad management.",
    autonomousWorkflow: [
      "Research Agent mines reviews, Reddit, comments, competitor formats, and customer language.",
      "Hook Agent finds unusual, non-commodity customer phrasing for creative differentiation.",
      "Script Agent writes UGC scripts, product demos, testimonials-style disclaimers, and static ad copy.",
      "Compliance Agent blocks fake endorsements, unsupported claims, and platform-risky copy.",
    ],
    credentialFields: [...baseFields, brandAssetsField, adAccountField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("ugc-studio", [
      ["Product and audience brief", "Product promise, audience pain, objections, proof, claim limits, and creative guardrails.", "workspace"],
      ["Review and Reddit language mine", "Customer phrases, pains, desired outcomes, objections, and surprising hook material.", "workspace"],
      ["Hook library", "Angles for problem, benefit, objection, social proof, comparison, demo, and curiosity creatives.", "workspace"],
      ["UGC script pack", "Short-form scripts with opening hook, product moment, proof, CTA, and platform notes.", "workspace"],
      ["AI video production brief", "Avatar/scene/product-shot prompts, shot list, voice notes, and export specs.", "automation"],
      ["Static ad concepts", "Image ad directions, copy variants, headline variants, and CTA variants.", "workspace"],
      ["Creative testing matrix", "Variant map by hook, format, audience, product angle, and hypothesis.", "reporting"],
      ["Compliance and claims report", "Unsupported claims, synthetic endorsement warnings, disclosure notes, and revision requirements.", "reporting"],
    ]),
  },
  {
    slug: "med-spa-growth-engine",
    title: "Med spa growth engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Med spas and aesthetic clinics selling high-value services like Botox, laser hair removal, body contouring, and weight-loss treatments.",
    customerOutcome: "Generate more booked consultations through AI-powered ad creative, Google Business Profile optimization, reviews, and local attribution.",
    launchPromise: "A med-spa-specific growth solution with ad creative, local SEO checklist, review engine, directory citations, and lead dashboard.",
    pricingModel: "$2,000-$3,000/month for creative/local SEO; higher when paid media management is included.",
    autonomousWorkflow: [
      "Local Audit Agent checks Google Business Profile, keywords, photos, reviews, service categories, and citation consistency.",
      "Creative Research Agent extracts med spa service pains, benefits, objections, and before/after-safe language.",
      "Ad Agent creates monthly static/video creative briefs and copy variants.",
      "Reporting Agent tracks calls, form fills, consultation requests, and source-level ROI.",
    ],
    credentialFields: [...baseFields, brandAssetsField, adAccountField, calendarField, complianceField, webhookField],
    deliverables: deliverables("med-spa-growth", [
      ["Google Business Profile audit", "Keyword, category, review, photo, service, post, Q&A, and map-pack readiness report.", "reporting"],
      ["Review-generation flow", "Review request sequence, QR/link handoff, internal owner instructions, and response templates.", "automation"],
      ["Local citation package", "Name, address, phone, category, description, and directory submission checklist.", "workspace"],
      ["Monthly ad creative pack", "Ten ad concepts with hooks, copy, visual direction, CTA, and service-specific angle.", "workspace"],
      ["Service pain-point research", "Botox, laser, body contouring, weight-loss, and skin-treatment customer language map.", "workspace"],
      ["Consultation capture funnel", "Lead page and qualification questions for med spa consultations.", "capture"],
      ["Lead and booking dashboard", "Calls, forms, qualified leads, booked consultations, and estimated treatment value.", "reporting"],
      ["Compliance-safe claims checklist", "Before/after, medical claim, pricing, guarantee, testimonial, and ad-platform constraints.", "operator"],
    ]),
  },
  {
    slug: "webinar-lead-magnet-factory",
    title: "Webinar lead magnet factory",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "B2B companies, SaaS teams, agencies, consultants, and education businesses with webinars or recorded trainings.",
    customerOutcome: "Turn existing webinars into lead magnets that generate new subscribers, sales calls, and pipeline.",
    launchPromise: "A complete webinar-to-lead-magnet solution with transcript, ebook, checklist, LinkedIn posts, landing copy, nurture emails, and opt-in tracking.",
    pricingModel: "$750-$1,500 per asset or $2,000-$8,000/month for recurring webinar repurposing.",
    autonomousWorkflow: [
      "Transcript Agent processes the webinar and extracts frameworks, examples, claims, and CTAs.",
      "Lead Magnet Agent turns the content into ebook, checklist, white paper, and landing-page assets.",
      "Distribution Agent writes LinkedIn, email, and comment-to-get promotion copy.",
      "Analytics Agent tracks opt-ins, registrations, and content reuse.",
    ],
    credentialFields: [...baseFields, contentSourceField, brandAssetsField, webhookField],
    deliverables: deliverables("webinar-magnet", [
      ["Webinar transcript", "Clean transcript with sections, speaker notes, examples, and key teaching points.", "workspace"],
      ["Branded lead magnet", "Ebook, checklist, white paper, or guide created from the webinar content.", "workspace"],
      ["Landing page copy", "Headline, promise, bullets, preview, opt-in form copy, and CTA for the lead magnet.", "capture"],
      ["Email nurture sequence", "Delivery, value, objection, case study, and sales-action follow-up emails.", "automation"],
      ["LinkedIn promo pack", "Comment-to-get post, carousel outline, text posts, and DM follow-up copy.", "workspace"],
      ["Repurposed article", "Search-friendly article or summary that points readers to the lead magnet.", "workspace"],
      ["Opt-in tracking view", "Lead magnet downloads, source, conversion rate, and influenced pipeline fields.", "reporting"],
      ["Reuse inventory", "Map of webinar sections converted into assets and remaining material for future content.", "operator"],
    ]),
  },
  {
    slug: "founder-ai-chief-of-staff",
    title: "Founder AI chief of staff",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Busy founders, creators, executives, small teams, and operators drowning in admin, inbox, CRM, and reporting work.",
    customerOutcome: "Save 10-20 hours per week with an AI assistant that actually does follow-up, triage, summaries, and business-health reporting.",
    launchPromise: "A complete founder operations solution with inbox rules, calendar support, stale-lead alerts, dashboards, daily brief, and weekly executive summary.",
    pricingModel: "$2,000-$10,000 setup plus $1,000-$5,000/month.",
    autonomousWorkflow: [
      "Founder Intake Agent maps priorities, communications, escalation rules, recurring decisions, and desired time savings.",
      "Inbox Agent triages urgent, reply-needed, delegate, wait, and archive messages.",
      "CRM Agent identifies stale leads, at-risk deals, and follow-up opportunities.",
      "Briefing Agent produces daily priorities and weekly executive summaries.",
    ],
    credentialFields: [...baseFields, emailCalendarAccessField, crmField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("founder-chief", [
      ["Founder operating profile", "Priorities, communication style, escalation rules, decision preferences, and protected-time rules.", "workspace"],
      ["Inbox triage rules", "Urgent, reply-needed, delegate, wait, archive, sales, support, finance, and personal categories.", "automation"],
      ["Calendar support workflow", "Scheduling, prep notes, reminders, follow-ups, and conflict handling.", "automation"],
      ["CRM stale-lead monitor", "At-risk leads, overdue follow-ups, next-step suggestions, and owner notifications.", "operator"],
      ["Daily priority brief", "Morning summary of urgent items, calendar, blocked decisions, follow-ups, and recommended actions.", "reporting"],
      ["Weekly executive dashboard", "Sales, support, content, operations, risk, and open-loop summary.", "reporting"],
      ["Task routing workflow", "Rules for creating tasks, assigning owners, due dates, and follow-up checks.", "automation"],
      ["Permission and safety rules", "Actions allowed automatically, actions requiring approval, and actions never allowed.", "operator"],
    ]),
  },
  {
    slug: "ai-first-business-os",
    title: "AI-first business OS",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "SMBs, startups, agencies, and operators ready for an installed AI-first operating system with ongoing optimization.",
    customerOutcome: "Rebuild repetitive business operations into an AI-agent-operated system that frees founder and team bandwidth.",
    launchPromise: "A complete AI-first operating-system solution with business brain, department map, agents, skills, data handoffs, dashboards, QA, and optimization cadence.",
    pricingModel: "$5,000-$15,000 setup plus $2,000-$4,000/month for micro/SMB; higher for larger companies.",
    autonomousWorkflow: [
      "Audit Agent reviews company context, processes, meetings, docs, bottlenecks, and desired outcomes.",
      "Business Brain Agent creates reusable company context for every department agent.",
      "Department Agent builds marketing, sales, delivery, admin, finance, and support operating layers.",
      "Skill Agent installs reusable workflows for lead gen, content, onboarding, reporting, follow-up, and fulfillment.",
    ],
    credentialFields: [...baseFields, emailCalendarAccessField, crmField, stripeField, socialAccessField, webhookField],
    deliverables: deliverables("ai-first-os", [
      ["Business brain", "Company profile, offers, customers, constraints, tone, process rules, and source-of-truth map.", "workspace"],
      ["Department architecture", "Marketing, sales, delivery, admin, finance, support, and leadership agent responsibilities.", "workspace"],
      ["Agent roster", "Named agents with responsibilities, permissions, inputs, outputs, and review requirements.", "operator"],
      ["Reusable skill library", "Lead generation, content, onboarding, reporting, follow-up, fulfillment, and QA skill definitions.", "automation"],
      ["Data handoff plan", "Stripe, CRM, calendar, email, documents, transcripts, Slack, analytics, and warehouse handoff map.", "automation"],
      ["Operating dashboards", "Revenue, leads, delivery, support, bottlenecks, tasks, and AI execution visibility.", "reporting"],
      ["QA and approval gates", "Acceptance tests, human approval points, risk thresholds, rollback, and audit log requirements.", "operator"],
      ["Monthly optimization cadence", "Review loop for performance, failures, new skills, prompt updates, and workflow improvements.", "reporting"],
    ]),
  },
  {
    slug: "local-service-lead-engine",
    title: "Local service lead engine",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Local service businesses and agencies selling local lead generation.",
    customerOutcome: "Capture urgent local service demand, qualify it, route it, and prove source-level ROI.",
    launchPromise: "A launched local lead capture workspace with intake, scoring, follow-up, embed code, and operator view.",
    credentialFields: [...baseFields, calendarField, crmField, webhookField],
    deliverables: deliverables("local", [
      ["Hosted lead capture page", "Public capture page with offer, form, routing metadata, and thank-you state.", "capture"],
      ["Embeddable website widget", "Script tag and iframe-ready capture surface for the customer domain.", "capture"],
      ["Urgency scoring model", "Signal map for quote intent, booking intent, phone presence, and time sensitivity.", "automation"],
      ["Service routing rules", "Rules that route by service requested, urgency, and contact completeness.", "automation"],
      ["Five-touch nurture sequence", "Email/SMS-ready follow-up plan for unbooked leads.", "automation"],
      ["Booking handoff", "Calendar handoff block with fallback instructions when no booking URL is present.", "operator"],
      ["Local attribution table", "UTM and source table showing raw leads, qualified leads, and pipeline value.", "reporting"],
      ["Operator dashboard view", "Workspace status, lead counts, routing status, and activation checklist.", "operator"],
      ["Launch QA checklist", "Acceptance tests for capture, scoring, routing, embed, and notification readiness.", "workspace"],
    ]),
  },
  {
    slug: "agency-client-workspace",
    title: "Agency client workspace",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Agencies launching client-facing lead systems.",
    customerOutcome: "Create a client workspace that an agency can brand, operate, and report from.",
    launchPromise: "A branded client workspace with capture, dashboard, reporting, credentials checklist, and client-ready handoff.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("agency", [
      ["Client workspace shell", "Branded client workspace with plan, market, offer, and operator details.", "workspace"],
      ["Client capture funnel", "Lead capture page and embed configuration scoped to the client.", "capture"],
      ["Client routing policy", "Rules for quote, booking, support, and nurture handoff.", "automation"],
      ["Agency operator dashboard", "Single view of client status, readiness, and lead flow.", "operator"],
      ["Client report template", "Weekly performance report structure with source and ROI sections.", "reporting"],
      ["White-label handoff page", "Customer-facing launch page that explains exactly what was built.", "workspace"],
      ["Credential checklist", "CRM, email, domain, webhook, and billing connection requirements.", "operator"],
      ["Acceptance test pack", "Runnable checklist for form capture, scoring, routing, and dashboard verification.", "workspace"],
    ]),
  },
  {
    slug: "directory-monetization-system",
    title: "Directory monetization system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Directory owners and local media operators.",
    customerOutcome: "Turn directory traffic into routed, monetizable lead demand.",
    launchPromise: "A category-based directory intake system with buyer routing, source tracking, and monetization surfaces.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("directory", [
      ["Category intake page", "Lead capture surface grouped by category, location, and urgency.", "capture"],
      ["Buyer routing matrix", "Routing table for buyer category, service area, and exclusivity status.", "automation"],
      ["Claimable lead inventory", "Public sample inventory and operator inventory table.", "operator"],
      ["Lead pricing table", "Price bands by category, urgency, and exclusivity.", "billing"],
      ["Buyer onboarding form", "Credential and service-area form for new lead buyers.", "capture"],
      ["Attribution report", "Source, category, qualified count, and revenue table.", "reporting"],
      ["Exclusivity rules", "Territory and buyer lockout logic documented for operators.", "automation"],
      ["Revenue ledger view", "Revenue summary for claimed, pending, refunded, and closed leads.", "reporting"],
    ]),
  },
  {
    slug: "saas-trial-conversion-system",
    title: "SaaS trial conversion system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "SaaS founders and product-led growth teams.",
    customerOutcome: "Convert trial users by routing activation signals into nudges, demos, and revenue events.",
    launchPromise: "A trial conversion workspace with onboarding events, scoring, lifecycle nudges, and revenue attribution.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("saas", [
      ["Trial intake form", "Signup qualification form tied to company size, use case, and urgency.", "capture"],
      ["Activation event map", "Tracked milestones for signup, setup, usage, invite, and billing intent.", "automation"],
      ["Trial scoring model", "Fit, intent, engagement, and urgency score configuration.", "automation"],
      ["Lifecycle email sequence", "Activation, rescue, proof, demo, and close-loop messages.", "automation"],
      ["Demo routing policy", "Rules for demo-ready users, product-qualified accounts, and nurture users.", "automation"],
      ["Subscription handoff", "Stripe-ready checkout and lifecycle requirement checklist.", "billing"],
      ["Trial ROI dashboard", "Trial source, activation rate, qualified accounts, and pipeline value.", "reporting"],
      ["Operator playbook", "Daily actions for stuck, hot, expanding, and at-risk trials.", "operator"],
    ]),
  },
  {
    slug: "consultant-authority-funnel",
    title: "Consultant authority funnel",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Consultants, experts, coaches, and service providers.",
    customerOutcome: "Qualify prospects before they book and give the consultant a complete authority funnel.",
    launchPromise: "A launched authority intake, qualification path, nurture sequence, booking handoff, and operator summary.",
    credentialFields: [...baseFields, calendarField, webhookField],
    deliverables: deliverables("consultant", [
      ["Authority landing page", "Offer-led capture page with problem, outcome, and qualification form.", "capture"],
      ["Prospect qualifier", "Question set that captures budget, urgency, problem, and fit.", "capture"],
      ["Booking handoff", "Qualified lead path to booking URL with fallback operator notification.", "operator"],
      ["Proof sequence", "Follow-up sequence using proof, objection handling, and close-loop prompts.", "automation"],
      ["Lead brief", "Operator-ready summary of the prospect's pain, desired outcome, and next action.", "operator"],
      ["Qualification scoring", "Score rules for urgency, fit, authority, budget, and timeline.", "automation"],
      ["Consulting pipeline board", "New, qualified, booked, proposal, won, and nurture stages.", "operator"],
      ["Proposal trigger", "Structured handoff for proposal or contract generation after qualification.", "automation"],
    ]),
  },
  {
    slug: "franchise-territory-router",
    title: "Franchise territory router",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Franchises, territory operators, and multi-location brands.",
    customerOutcome: "Route leads to the right territory while keeping brand-level visibility.",
    launchPromise: "A territory-aware capture and routing system with operator controls and territory reporting.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("franchise", [
      ["Territory intake page", "Capture form that accepts location, service, urgency, and contact information.", "capture"],
      ["Territory routing matrix", "Routing rules by ZIP, city, state, territory owner, and fallback.", "automation"],
      ["Brand operator dashboard", "Brand-level status across territories and production readiness.", "operator"],
      ["Location operator view", "Territory-specific lead and routing summary.", "operator"],
      ["Conflict resolution rules", "Rules for overlapping territories, overflow, and unavailable owners.", "automation"],
      ["Territory attribution report", "Source and revenue view by territory and market.", "reporting"],
      ["SLA monitor", "Response-time targets and overdue handoff indicators.", "operator"],
      ["Franchise launch checklist", "Credential, domain, CRM, routing, and notification requirements.", "workspace"],
    ]),
  },
  {
    slug: "marketplace-lead-seller-system",
    title: "Marketplace lead seller system",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Lead sellers and pay-per-lead marketplace operators.",
    customerOutcome: "Package qualified leads into buyer-ready inventory with pricing, claim, and outcome tracking.",
    launchPromise: "A launched marketplace surface with inventory, buyer claim flow, pricing logic, and revenue tracking.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("marketplace", [
      ["Lead inventory board", "Buyer-facing inventory cards with score, category, market, and price.", "operator"],
      ["Buyer claim flow", "Claim action model with payment and routing requirements.", "billing"],
      ["Lead quality scoring", "Score rubric for lead freshness, intent, fit, and contact completeness.", "automation"],
      ["Pricing engine setup", "Price bands by quality, category, market, and exclusivity.", "billing"],
      ["Buyer onboarding", "Buyer profile, categories, territories, caps, and webhook destination.", "capture"],
      ["Outcome reporting", "Accepted, rejected, contacted, booked, won, and refunded statuses.", "reporting"],
      ["Revenue summary", "Gross revenue, refunds, net revenue, and buyer performance.", "reporting"],
      ["Compliance notes", "Consent, resale, suppression, and audit requirements for operators.", "workspace"],
    ]),
  },
  {
    slug: "affiliate-partner-revenue-system",
    title: "Affiliate and partner revenue system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Affiliate operators, partner programs, and channel teams.",
    customerOutcome: "Capture partner-sourced leads and attribute revenue back to the right partner.",
    launchPromise: "A partner-ready capture, attribution, commission, and reporting workspace.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("affiliate", [
      ["Partner capture links", "Partner-aware capture URLs and UTM conventions.", "capture"],
      ["Partner attribution model", "First-touch, last-touch, and partner override attribution rules.", "reporting"],
      ["Commission table", "Commission tiers, qualifying events, and payout-ready status.", "billing"],
      ["Partner dashboard view", "Partner leads, qualified count, revenue, and pending payout view.", "operator"],
      ["Fraud checks", "Duplicate, self-referral, suspicious domain, and velocity checks.", "automation"],
      ["Conversion event webhook", "Webhook payload structure for closed-won and subscription events.", "automation"],
      ["Partner onboarding form", "Partner profile, payout details placeholder, markets, and approved offers.", "capture"],
      ["ROI report", "Partner-sourced revenue, cost, conversion, and quality summary.", "reporting"],
    ]),
  },
  {
    slug: "reactivation-retention-system",
    title: "Reactivation and retention system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators with dormant leads, churn risk, or repeat purchase opportunities.",
    customerOutcome: "Bring dormant leads and customers back into a measurable revenue path.",
    launchPromise: "A launched reactivation workspace with segments, messages, routing, and outcome tracking.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("retention", [
      ["Dormant segment intake", "Customer/lead segment definition for dormant, at-risk, and winback groups.", "workspace"],
      ["Reactivation sequence", "Multi-touch email/SMS-ready messages for winback and next-step offers.", "automation"],
      ["Risk scoring model", "Signals for inactivity, missed milestone, no booking, churn risk, and lost deal.", "automation"],
      ["Offer rotation rules", "Rules for discount, proof, consultation, and deadline offers.", "automation"],
      ["Outcome board", "Reactivated, booked, purchased, unsubscribed, and no-response statuses.", "operator"],
      ["Suppression rules", "Respect unsubscribe, do-not-contact, duplicate, and stale records.", "automation"],
      ["Retention ROI report", "Recovered opportunities, revenue potential, and response rate.", "reporting"],
      ["Operator daily list", "Prioritized people or accounts requiring human follow-up.", "operator"],
    ]),
  },
  {
    slug: "operator-control-plane-system",
    title: "Operator control plane system",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Internal operators, agencies, and autonomous system owners.",
    customerOutcome: "Operate the full system from a single control plane with readiness, toggles, queues, and revenue status.",
    launchPromise: "A launched operator workspace with control plane views, readiness checks, and action surfaces.",
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("control", [
      ["System health panel", "API, dashboard, database, billing, queues, and live-send status.", "operator"],
      ["Activation checklist", "Dependency checklist tied to production readiness.", "operator"],
      ["Queue visibility surface", "Queue, retry, and dead-letter placeholders with setup requirements.", "operator"],
      ["Feature toggle register", "Runtime toggles for billing enforcement, sends, and provider behavior.", "operator"],
      ["Revenue command center", "Billing, subscription, quote, invoice, and revenue summary sections.", "billing"],
      ["Audit trail view", "Operator action, credential, provisioning, and launch event log model.", "reporting"],
      ["Agent execution surface", "Agent-callable actions and workflow handoff map.", "automation"],
      ["Incident runbook", "Failure modes, retry steps, rollback path, and escalation targets.", "workspace"],
    ]),
  },
  {
    slug: "content-distribution-engine",
    title: "Content distribution engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators who need reusable content, lead magnets, and distribution workflows.",
    customerOutcome: "Launch content capture paths that turn audience attention into qualified leads.",
    launchPromise: "A content-led capture package with lead magnets, distribution plan, scoring, and attribution.",
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("content", [
      ["Lead magnet page", "Capture page tied to a resource, report, checklist, or calculator.", "capture"],
      ["Resource delivery flow", "Confirmation and delivery steps for the promised content.", "automation"],
      ["Content nurture sequence", "Follow-up sequence that turns content engagement into a sales action.", "automation"],
      ["Distribution calendar", "Channel and cadence plan for posting, email, partner, and paid distribution.", "workspace"],
      ["Engagement scoring", "Signals for resource download, page depth, return visits, and clicks.", "automation"],
      ["CTA experiment setup", "Offer and CTA variants ready for A/B testing.", "automation"],
      ["Content attribution report", "Source, resource, lead quality, and conversion summary.", "reporting"],
      ["Repurposing brief", "Reusable hooks, angles, and follow-up assets for the operator.", "workspace"],
    ]),
  },
  {
    slug: "revenue-attribution-suite",
    title: "Revenue attribution suite",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators who need to prove campaign, partner, buyer, or channel ROI.",
    customerOutcome: "Connect lead capture to revenue outcomes and show what is working.",
    launchPromise: "A reporting-ready attribution workspace with source tracking, conversion events, and ROI views.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("revenue", [
      ["Source tracking map", "UTM, referrer, partner, campaign, and medium conventions.", "reporting"],
      ["Conversion event schema", "Captured, qualified, booked, paid, won, refunded, and retained events.", "automation"],
      ["ROI dashboard", "Lead count, qualified count, revenue, cost, and ROI by source.", "reporting"],
      ["Revenue webhook", "Webhook payload structure for purchase, subscription, invoice, and refund events.", "automation"],
      ["Attribution model", "First-touch, last-touch, linear, and override attribution definitions.", "reporting"],
      ["Pipeline value table", "Expected value, actual revenue, close rate, and confidence view.", "reporting"],
      ["Executive report", "Customer-showable summary of what generated revenue and what to fix.", "workspace"],
      ["Data quality checklist", "Missing UTMs, duplicate leads, missing outcomes, and stale events.", "operator"],
    ]),
  },
];

export function getProvisionablePackage(slug: string): ProvisionablePackage | undefined {
  return provisionablePackages.find((pkg) => pkg.slug === slug);
}

export function getPackagePlanNames(pkg: ProvisionablePackage): string {
  return pkg.planIds.map((planId) => publicPlans.find((plan) => plan.id === planId)?.name ?? planId).join(", ");
}

export function getPackagesForPlan(planId: PublicPlanId): ProvisionablePackage[] {
  return provisionablePackages.filter((pkg) => pkg.planIds.includes(planId));
}

export function getPackageNicheExamples(slug: PackageSlug): string[] {
  return packageNicheExamples[slug] ?? defaultNicheExamples;
}

export function getPackageAutomationContract(pkg: ProvisionablePackage): PackageAutomationContract {
  return {
    modular: true,
    fullyAutomated: pkg.deliverables.length >= 8 && (pkg.autonomousWorkflow?.length ?? 0) >= 4,
    requiresAdditionalConfiguration: false,
    simpleOnboardingFields: simpleOnboardingFieldKeys,
    nicheExamples: getPackageNicheExamples(pkg.slug),
    deliveryMode: "complete-solution",
  };
}
