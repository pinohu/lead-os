// ---------------------------------------------------------------------------
// Customer Intelligence Engine
//
// Deep, factual buyer research for every industry niche. This data drives
// every page, email, CTA, funnel step, and design choice in LeadOS.
//
// Each profile answers: Who is the buyer? What triggered them to search?
// What objections will they raise? What makes them trust? What converts them?
// ---------------------------------------------------------------------------

export interface IdealCustomerProfile {
  title: string;
  role: string;
  companySize: string;
  revenueRange: string;
  techStack: string[];
  buyingAuthority: "sole-decider" | "influences-decision" | "committee";
  budgetCycle: string;
  decisionTimeline: string;
  industries: string[];
}

export interface BuyingTrigger {
  event: string;
  urgency: "immediate" | "this-quarter" | "this-year";
  searchBehavior: string;
  emotionalState: string;
}

export interface DecisionJourney {
  totalDays: number;
  touchpointsNeeded: number;
  stakeholders: number;
  stages: Array<{
    name: string;
    durationDays: number;
    primaryAction: string;
    contentNeeded: string;
    dropOffRisk: string;
  }>;
}

export interface ObjectionEntry {
  objection: string;
  underlyingFear: string;
  evidenceBasedResponse: string;
  proofType: "case-study" | "statistic" | "guarantee" | "demo" | "testimonial";
}

export interface TrustSignalProfile {
  primary: string[];
  secondary: string[];
  dealbreakers: string[];
  certificationsThatMatter: string[];
  socialProofPreference: "peer-reviews" | "case-studies" | "metrics" | "logos" | "testimonials";
}

export interface ConversionPsychology {
  primaryMotivation: "fear-of-loss" | "aspiration" | "competitive-pressure" | "compliance" | "efficiency";
  riskTolerance: "low" | "medium" | "high";
  decisionStyle: "analytical" | "emotional" | "consensus" | "impulsive";
  priceAnchor: string;
  guaranteePreference: "money-back" | "results-based" | "satisfaction" | "trial-period";
  ctaPreference: "book-call" | "start-trial" | "see-demo" | "get-assessment" | "download-guide";
}

export interface CompetitorAwareness {
  alternatives: string[];
  switchingCosts: string;
  differentiators: string[];
  weaknesses: string[];
}

export interface ContentConversionMap {
  stage: string;
  contentType: string;
  topic: string;
  conversionGoal: string;
  expectedCvr: string;
}

export interface CustomerIntelligenceProfile {
  niche: string;
  nicheLabel: string;
  lastUpdated: string;
  icp: IdealCustomerProfile;
  buyingTriggers: BuyingTrigger[];
  decisionJourney: DecisionJourney;
  objections: ObjectionEntry[];
  trustSignals: TrustSignalProfile;
  conversionPsychology: ConversionPsychology;
  competitors: CompetitorAwareness;
  contentMap: ContentConversionMap[];
}

// ---------------------------------------------------------------------------
// 13 Industry Intelligence Profiles
// ---------------------------------------------------------------------------

export const CUSTOMER_INTELLIGENCE: Record<string, CustomerIntelligenceProfile> = {
  service: {
    niche: "service",
    nicheLabel: "Home Services & Trades",
    lastUpdated: "2026-03-30",
    icp: {
      title: "Owner-operator or general manager",
      role: "Business owner who also manages field operations",
      companySize: "2-25 employees",
      revenueRange: "$200K-$5M annual",
      techStack: ["Google Business Profile", "QuickBooks", "Paper scheduling or basic CRM", "Facebook page"],
      buyingAuthority: "sole-decider",
      budgetCycle: "Monthly — cash flow driven, no formal procurement",
      decisionTimeline: "1-7 days for sub-$500/mo tools",
      industries: ["Plumbing", "HVAC", "Electrical", "Roofing", "Cleaning", "Landscaping", "Pest Control", "Painting"],
    },
    buyingTriggers: [
      { event: "Lost a job to a competitor who responded faster", urgency: "immediate", searchBehavior: "Googles 'how to get more plumbing leads' or 'contractor CRM'", emotionalState: "Frustrated and motivated — they saw money walk away" },
      { event: "Seasonal slowdown approaching", urgency: "this-quarter", searchBehavior: "Searches for marketing ideas or lead gen services", emotionalState: "Anxious about upcoming dry spell" },
      { event: "Hired a new employee and needs to keep them busy", urgency: "immediate", searchBehavior: "Looks for ways to increase job volume", emotionalState: "Financially committed — needs ROI on the hire" },
      { event: "Competitor opened nearby or started advertising", urgency: "this-quarter", searchBehavior: "Researches competitor tactics, local SEO", emotionalState: "Threatened — territorial instinct kicks in" },
      { event: "Got a bad review that hurt their phone calls", urgency: "immediate", searchBehavior: "Searches review management, reputation repair", emotionalState: "Panicked — reviews directly affect revenue" },
      { event: "Spouse or partner complains about working weekends", urgency: "this-year", searchBehavior: "Searches business automation, efficiency", emotionalState: "Guilt and exhaustion — wants life back" },
    ],
    decisionJourney: {
      totalDays: 3,
      touchpointsNeeded: 4,
      stakeholders: 1,
      stages: [
        { name: "Problem recognized", durationDays: 0, primaryAction: "Googles the pain point", contentNeeded: "Blog post or ad that mirrors their exact problem", dropOffRisk: "Page loads slow or copy feels generic" },
        { name: "Solution explored", durationDays: 1, primaryAction: "Visits 2-3 websites, checks reviews", contentNeeded: "Landing page with local proof and clear pricing", dropOffRisk: "No pricing visible or no reviews from their trade" },
        { name: "Trust established", durationDays: 1, primaryAction: "Reads a case study or watches a testimonial", contentNeeded: "Case study from same trade with specific numbers", dropOffRisk: "No proof from their specific niche" },
        { name: "Decision made", durationDays: 1, primaryAction: "Calls or books online", contentNeeded: "Simple booking page or click-to-call", dropOffRisk: "Complex forms or no phone number visible" },
      ],
    },
    objections: [
      { objection: "I tried marketing before and it didn't work", underlyingFear: "Wasting money again on something that promises results", evidenceBasedResponse: "Show specific ROI from a business in their exact trade — 'Smith Plumbing went from 12 to 34 jobs/month in 60 days'", proofType: "case-study" },
      { objection: "I don't have time to learn new software", underlyingFear: "Adding more complexity to an already overwhelming week", evidenceBasedResponse: "We set it up for you. Average setup is 48 hours. You don't touch it until leads start coming in.", proofType: "demo" },
      { objection: "I get most of my work from word of mouth", underlyingFear: "Change is unnecessary — what's working might break", evidenceBasedResponse: "Word of mouth is great. We amplify it with automated review requests and referral tracking. 73% of consumers trust online reviews as much as personal recommendations.", proofType: "statistic" },
      { objection: "How do I know the leads will be good?", underlyingFear: "Paying for tire-kickers who never convert", evidenceBasedResponse: "Every lead is scored on 4 dimensions. You only get notified about leads above your threshold. Average close rate on scored leads is 2.3x higher.", proofType: "statistic" },
      { objection: "It's too expensive for a small business like mine", underlyingFear: "Cash flow is tight and this might not pay for itself", evidenceBasedResponse: "If one extra job per month covers the cost, you're profitable from month one. Average job value in your trade is $X — we need to land just one.", proofType: "guarantee" },
    ],
    trustSignals: {
      primary: ["Google reviews from other contractors", "Before/after revenue numbers", "Phone number visible on every page", "Real person they can talk to"],
      secondary: ["BBB rating", "Years in business", "Number of businesses served", "Local references"],
      dealbreakers: ["No phone number", "Long contract required", "No case studies from their trade", "Automated-only support"],
      certificationsThatMatter: ["Google Partner", "BBB Accredited", "Local Chamber member"],
      socialProofPreference: "testimonials",
    },
    conversionPsychology: {
      primaryMotivation: "fear-of-loss",
      riskTolerance: "low",
      decisionStyle: "impulsive",
      priceAnchor: "They spend $500-2,000/mo on various marketing already — show how you replace that spend",
      guaranteePreference: "money-back",
      ctaPreference: "book-call",
    },
    competitors: {
      alternatives: ["Housecall Pro", "Jobber", "ServiceTitan", "GoHighLevel via agency", "Local marketing agency", "Google Ads DIY"],
      switchingCosts: "Low — most aren't locked into contracts. Data migration is minimal.",
      differentiators: ["Multi-niche support (they do plumbing AND HVAC)", "AI scoring (nobody else in this market has it)", "Marketplace (sell excess leads)", "One platform replaces 8 tools"],
      weaknesses: ["ServiceTitan has deeper field service features", "Jobber has better mobile app for technicians", "Local agencies offer hands-on relationship"],
    },
    contentMap: [
      { stage: "Awareness", contentType: "Blog post", topic: "How to stop losing {{niche}} jobs to faster competitors", conversionGoal: "Click to assessment", expectedCvr: "3-5%" },
      { stage: "Awareness", contentType: "Social proof ad", topic: "How [Company] doubled their {{niche}} bookings in 30 days", conversionGoal: "Click to landing page", expectedCvr: "2-4%" },
      { stage: "Consideration", contentType: "Assessment", topic: "{{Niche}} Business Growth Assessment (2 minutes)", conversionGoal: "Complete assessment → email capture", expectedCvr: "40-60%" },
      { stage: "Consideration", contentType: "ROI calculator", topic: "See how much revenue you're leaving on the table", conversionGoal: "Email capture → book call", expectedCvr: "20-35%" },
      { stage: "Decision", contentType: "Case study", topic: "How a {{niche}} company went from 15 to 40 jobs/month", conversionGoal: "Book consultation", expectedCvr: "15-25%" },
      { stage: "Decision", contentType: "Offer page", topic: "Start getting leads this week — money-back guarantee", conversionGoal: "Purchase or book", expectedCvr: "8-15%" },
    ],
  },

  legal: {
    niche: "legal",
    nicheLabel: "Law Firms & Legal Practices",
    lastUpdated: "2026-03-30",
    icp: {
      title: "Managing partner or practice group leader",
      role: "Attorney who oversees firm operations and business development",
      companySize: "2-50 attorneys",
      revenueRange: "$500K-$20M annual",
      techStack: ["Clio or PracticePanther", "Microsoft 365", "Basic website with contact form", "Avvo/Justia listing"],
      buyingAuthority: "sole-decider",
      budgetCycle: "Quarterly — tied to case revenue cycles",
      decisionTimeline: "2-4 weeks for $500+/mo commitments",
      industries: ["Personal Injury", "Family Law", "Criminal Defense", "Immigration", "Estate Planning", "Corporate Law", "Employment Law"],
    },
    buyingTriggers: [
      { event: "Intake conversion rate dropped below 40%", urgency: "immediate", searchBehavior: "Searches 'law firm intake automation' or 'legal CRM'", emotionalState: "Data-driven urgency — they see the numbers slipping" },
      { event: "Missed a statute of limitations deadline or near-miss", urgency: "immediate", searchBehavior: "Searches compliance tracking, deadline management", emotionalState: "Fear — malpractice exposure is existential" },
      { event: "Marketing spend increased but case quality decreased", urgency: "this-quarter", searchBehavior: "Searches lead scoring, case qualification", emotionalState: "Frustrated — spending more, getting less" },
      { event: "Associate or paralegal quit, taking institutional knowledge", urgency: "immediate", searchBehavior: "Searches practice management, process documentation", emotionalState: "Vulnerable — key person dependency exposed" },
      { event: "Competitor firm launched a slick website or ad campaign", urgency: "this-quarter", searchBehavior: "Researches legal marketing, authority positioning", emotionalState: "Competitive — doesn't want to fall behind" },
    ],
    decisionJourney: {
      totalDays: 21,
      touchpointsNeeded: 8,
      stakeholders: 2,
      stages: [
        { name: "Problem acknowledged", durationDays: 0, primaryAction: "Searches or asks peer for recommendation", contentNeeded: "Authority content — 'How top law firms automate intake'", dropOffRisk: "Content feels too salesy or not legal-specific" },
        { name: "Research phase", durationDays: 7, primaryAction: "Reads 3-5 articles, checks competitor solutions", contentNeeded: "Comparison guide, compliance documentation, legal-specific case study", dropOffRisk: "No bar-compliant language or legal industry proof" },
        { name: "Evaluation", durationDays: 7, primaryAction: "Books demo, involves office manager", contentNeeded: "Live demo tailored to their practice area", dropOffRisk: "Demo is generic or doesn't show their case type" },
        { name: "Decision", durationDays: 7, primaryAction: "Reviews with partner(s), checks references", contentNeeded: "ROI projection, implementation timeline, reference from similar firm", dropOffRisk: "No reference from their practice area or firm size" },
      ],
    },
    objections: [
      { objection: "Is this bar-compliant?", underlyingFear: "Regulatory risk — anything that touches client data must be compliant", evidenceBasedResponse: "Built with bar compliance in mind. Client data encrypted AES-256. HIPAA-adjacent controls. No client data shared across tenants. We can provide our security documentation.", proofType: "demo" },
      { objection: "Our intake process is fine, we just need more leads", underlyingFear: "Don't want to change workflows that feel comfortable", evidenceBasedResponse: "Most firms that say this are converting 20-30% of consultations. The industry leaders convert 60%+. A 10% improvement at your case value is $X/month.", proofType: "statistic" },
      { objection: "We're too small to need automation", underlyingFear: "Automation feels like an enterprise thing — we're just 5 attorneys", evidenceBasedResponse: "Automation saves the most time for small firms where every attorney wears multiple hats. 15 minutes per intake × 50 consults/month = 12.5 hours back.", proofType: "case-study" },
      { objection: "How is this different from Clio?", underlyingFear: "Already invested in practice management — don't want another tool", evidenceBasedResponse: "Clio manages your cases after intake. We optimize everything before — lead scoring, intake automation, nurture. They integrate, not compete.", proofType: "demo" },
    ],
    trustSignals: {
      primary: ["Built for law firm intake and consult routing", "Bar-sensitive language throughout", "Practice-area case-fit proof", "Security documentation available"],
      secondary: ["Integration with Clio/PracticePanther", "References from similar-sized firms", "Compliance certifications"],
      dealbreakers: ["No encryption documentation", "No legal industry experience", "Required to share data across tenants", "No phone support"],
      certificationsThatMatter: ["SOC 2", "Bar Association partnerships", "Legal technology certifications"],
      socialProofPreference: "case-studies",
    },
    conversionPsychology: {
      primaryMotivation: "competitive-pressure",
      riskTolerance: "low",
      decisionStyle: "analytical",
      priceAnchor: "Compare to the cost of one lost case ($5K-$50K) — the platform pays for itself with one saved case",
      guaranteePreference: "satisfaction",
      ctaPreference: "get-assessment",
    },
    competitors: {
      alternatives: ["Clio Grow", "Lawmatics", "Intake.me", "Smith.ai", "GoHighLevel via legal marketing agency"],
      switchingCosts: "Medium — existing data in Clio, staff trained on current tools",
      differentiators: ["4D lead scoring (nobody else scores legal leads on intent + fit + engagement + urgency)", "Multi-practice support (PI + family + immigration in one instance)", "Marketplace for lead sharing between non-competing practices"],
      weaknesses: ["Clio has deeper practice management", "Lawmatics has more legal-specific templates", "Smith.ai has live receptionist service"],
    },
    contentMap: [
      { stage: "Awareness", contentType: "Authority article", topic: "Why 60% of law firm consultations never convert — and how to fix it", conversionGoal: "Email capture or assessment start", expectedCvr: "4-8%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Legal Intake Readiness Assessment (2 min)", conversionGoal: "Complete → email → book demo", expectedCvr: "35-50%" },
      { stage: "Consideration", contentType: "Case study", topic: "How [Firm] cut intake processing from 48 hours to 15 minutes", conversionGoal: "Book demo", expectedCvr: "15-25%" },
      { stage: "Decision", contentType: "Comparison page", topic: "Legal intake scoring vs Clio Grow and Lawmatics", conversionGoal: "Book demo", expectedCvr: "10-20%" },
      { stage: "Decision", contentType: "ROI calculator", topic: "Calculate the revenue you're losing to slow intake", conversionGoal: "Book consultation", expectedCvr: "20-35%" },
    ],
  },

  health: {
    niche: "health",
    nicheLabel: "Healthcare & Medical Practices",
    lastUpdated: "2026-03-30",
    icp: {
      title: "Practice owner, office manager, or marketing director",
      role: "Controls operational decisions and patient acquisition budget",
      companySize: "1-10 providers, 5-50 staff",
      revenueRange: "$500K-$10M annual",
      techStack: ["EHR (Epic, athenahealth, or Dentrix)", "Phone system", "Basic website", "Google Business Profile"],
      buyingAuthority: "sole-decider",
      budgetCycle: "Monthly — tied to patient volume and insurance cycles",
      decisionTimeline: "2-3 weeks",
      industries: ["Dental", "Dermatology", "Chiropractic", "Physical Therapy", "Optometry", "Veterinary", "Mental Health", "Pediatrics"],
    },
    buyingTriggers: [
      { event: "No-show rate exceeded 15%", urgency: "immediate", searchBehavior: "Searches 'reduce no-shows' or 'appointment reminder software'", emotionalState: "Frustrated — empty chairs cost $200-500 each" },
      { event: "New provider joined and needs a full schedule", urgency: "immediate", searchBehavior: "Searches 'new patient acquisition' or 'dental marketing'", emotionalState: "Financial pressure — new provider is a cost center until booked" },
      { event: "Insurance panel change reduced patient volume", urgency: "this-quarter", searchBehavior: "Searches 'attract patients without insurance' or 'patient acquisition'", emotionalState: "Anxious — revenue source disrupted" },
      { event: "Competitor opened a modern practice nearby", urgency: "this-quarter", searchBehavior: "Researches digital marketing, online scheduling, reviews", emotionalState: "Threatened — patients have a shiny new option" },
      { event: "Staff member who managed patient outreach left", urgency: "immediate", searchBehavior: "Searches 'automate patient communication' or 'patient recall'", emotionalState: "Scrambling — institutional knowledge lost" },
    ],
    decisionJourney: {
      totalDays: 14,
      touchpointsNeeded: 6,
      stakeholders: 2,
      stages: [
        { name: "Problem felt", durationDays: 0, primaryAction: "Googles the symptom (no-shows, empty schedule, bad reviews)", contentNeeded: "Blog post or ad addressing the specific symptom", dropOffRisk: "Content doesn't mention their specialty" },
        { name: "Solution research", durationDays: 5, primaryAction: "Reads 2-3 solutions, checks if HIPAA-compatible", contentNeeded: "HIPAA-compliant feature list, specialty-specific demo", dropOffRisk: "No HIPAA mention or no specialty relevance" },
        { name: "Office manager involved", durationDays: 4, primaryAction: "OM evaluates implementation effort and EHR integration", contentNeeded: "Integration guide, implementation timeline, training plan", dropOffRisk: "Looks complex or doesn't integrate with their EHR" },
        { name: "Decision", durationDays: 5, primaryAction: "Provider and OM agree, check references", contentNeeded: "Case study from same specialty, pricing transparency", dropOffRisk: "Hidden costs or no reference from their specialty" },
      ],
    },
    objections: [
      { objection: "Is this HIPAA-compliant?", underlyingFear: "Regulatory violation could cost the practice everything", evidenceBasedResponse: "SOC 2 controls mapped. Data encrypted at rest and in transit. BAA available. No patient PHI stored in our system — we handle scheduling and marketing, not clinical data.", proofType: "demo" },
      { objection: "We already have an EHR that handles scheduling", underlyingFear: "Don't want to duplicate tools or confuse staff", evidenceBasedResponse: "We don't replace your EHR. We feed it qualified, reminded, pre-verified patients. Think of us as the pipeline that fills your EHR's schedule.", proofType: "demo" },
      { objection: "Our patients find us through referrals, not the internet", underlyingFear: "Online marketing feels beneath a medical practice", evidenceBasedResponse: "77% of patients check online reviews before booking, even after a referral. We amplify your referrals by making sure your online presence matches your reputation.", proofType: "statistic" },
    ],
    trustSignals: {
      primary: ["HIPAA-compatible language", "Case study from their specialty", "Integration with their EHR", "No long-term contract"],
      secondary: ["Number of practices served", "Patient satisfaction improvement metrics", "Staff training included"],
      dealbreakers: ["No HIPAA mention", "Requires patient data access", "No specialty-specific content", "Long implementation timeline"],
      certificationsThatMatter: ["HIPAA-compatible", "SOC 2", "EHR integration certifications"],
      socialProofPreference: "metrics",
    },
    conversionPsychology: {
      primaryMotivation: "efficiency",
      riskTolerance: "low",
      decisionStyle: "analytical",
      priceAnchor: "Cost of one empty appointment slot ($200-500) × no-show rate × 30 days = monthly waste. Platform costs less than 2 missed appointments.",
      guaranteePreference: "results-based",
      ctaPreference: "get-assessment",
    },
    competitors: {
      alternatives: ["Weave", "Solutionreach", "Demandforce", "PatientPop", "Birdeye for healthcare"],
      switchingCosts: "Medium — patient communication history in current tool",
      differentiators: ["Multi-specialty support", "AI scoring for patient quality", "Reactivation automation that others charge extra for", "Practice growth analytics beyond just reviews"],
      weaknesses: ["Weave has deeper phone integration", "PatientPop has more healthcare-specific templates", "Solutionreach has longer track record in healthcare"],
    },
    contentMap: [
      { stage: "Awareness", contentType: "Blog post", topic: "The hidden cost of no-shows: how {{specialty}} practices lose $X/month", conversionGoal: "Assessment start", expectedCvr: "3-6%" },
      { stage: "Consideration", contentType: "Assessment", topic: "{{Specialty}} Practice Growth Assessment", conversionGoal: "Email capture → demo", expectedCvr: "40-55%" },
      { stage: "Consideration", contentType: "Guide", topic: "The Complete Guide to {{Specialty}} Patient Acquisition in 2026", conversionGoal: "Email capture", expectedCvr: "15-25%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Practice] added 50 new patients/month with zero ad spend", conversionGoal: "Book consultation", expectedCvr: "15-25%" },
      { stage: "Decision", contentType: "ROI calculator", topic: "Calculate your practice's growth potential", conversionGoal: "Book demo", expectedCvr: "20-35%" },
    ],
  },

  tech: {
    niche: "tech",
    nicheLabel: "Technology & SaaS Companies",
    lastUpdated: "2026-03-30",
    icp: {
      title: "VP Marketing, Head of Growth, or CEO (at smaller companies)",
      role: "Owns pipeline and conversion metrics",
      companySize: "10-200 employees, Series A to C",
      revenueRange: "$1M-$50M ARR",
      techStack: ["HubSpot or Salesforce", "Intercom or Drift", "Mixpanel or Amplitude", "Segment", "Stripe"],
      buyingAuthority: "influences-decision",
      budgetCycle: "Quarterly — tied to board reporting and OKRs",
      decisionTimeline: "3-6 weeks for $1K+/mo tools",
      industries: ["B2B SaaS", "Fintech", "Healthtech", "DevTools", "Martech", "EdTech", "Cybersecurity"],
    },
    buyingTriggers: [
      { event: "Trial-to-paid conversion dropped below 5%", urgency: "immediate", searchBehavior: "Searches 'improve SaaS trial conversion' or 'PLG onboarding'", emotionalState: "Board pressure — this metric is in the deck" },
      { event: "Churn spiked above 5% monthly", urgency: "immediate", searchBehavior: "Searches 'reduce SaaS churn' or 'customer health scoring'", emotionalState: "Panic — churn is the silent killer of SaaS" },
      { event: "Competitor launched a feature that users are asking about", urgency: "this-quarter", searchBehavior: "Searches competitive analysis tools, differentiation strategies", emotionalState: "Defensive — feature parity race anxiety" },
      { event: "Board asked for CAC payback improvement", urgency: "this-quarter", searchBehavior: "Searches 'reduce CAC SaaS' or 'product-led growth'", emotionalState: "Performance pressure from investors" },
      { event: "Scaling from 100 to 1000 users and manual onboarding breaking", urgency: "immediate", searchBehavior: "Searches 'automated onboarding SaaS' or 'self-serve activation'", emotionalState: "Growing pains — what worked at 50 users doesn't work at 500" },
    ],
    decisionJourney: {
      totalDays: 30,
      touchpointsNeeded: 10,
      stakeholders: 3,
      stages: [
        { name: "Metric alarm", durationDays: 0, primaryAction: "Notices metric decline in dashboard, discusses with team", contentNeeded: "Data-driven blog post with benchmarks they can compare against", dropOffRisk: "Content is too high-level or doesn't show benchmarks" },
        { name: "Solution mapping", durationDays: 7, primaryAction: "Builds shortlist of 3-5 tools, reads G2/Capterra reviews", contentNeeded: "Comparison pages, G2/Capterra presence, technical documentation", dropOffRisk: "Not on G2/Capterra or no technical docs" },
        { name: "Technical evaluation", durationDays: 10, primaryAction: "Engineering team evaluates API, integrations, data model", contentNeeded: "API docs, integration guides, data architecture overview", dropOffRisk: "No API docs or poor integration with their stack" },
        { name: "Business case", durationDays: 7, primaryAction: "VP presents ROI case to CEO/CFO", contentNeeded: "ROI calculator, business case template, case study with ARR impact", dropOffRisk: "Can't quantify ROI or no case study from similar-stage company" },
        { name: "Procurement", durationDays: 6, primaryAction: "Security review, contract negotiation", contentNeeded: "SOC 2 report, security questionnaire, flexible contract terms", dropOffRisk: "No SOC 2 or rigid contract terms" },
      ],
    },
    objections: [
      { objection: "We already have HubSpot/Salesforce for this", underlyingFear: "Don't want to rip and replace a system the team knows", evidenceBasedResponse: "We complement your CRM, not replace it. We handle the scoring and nurture layer that CRMs aren't built for. Integration is bidirectional.", proofType: "demo" },
      { objection: "Our engineering team can build this", underlyingFear: "Build vs buy — engineers want to build everything", evidenceBasedResponse: "Your engineering team's time is worth $150-250/hr. Building this in-house takes 6-12 months. We deploy in days. Focus your engineers on your product, not your pipeline.", proofType: "statistic" },
      { objection: "We need to see the API documentation first", underlyingFear: "Worried about integration complexity", evidenceBasedResponse: "Full OpenAPI 3.1 spec at /api/docs/openapi.json. 295+ endpoints. Webhook support. We integrate with everything in your stack.", proofType: "demo" },
    ],
    trustSignals: {
      primary: ["SOC 2 documentation", "OpenAPI spec", "G2/Capterra reviews", "ARR impact case studies"],
      secondary: ["Integration with their stack", "Technical blog content", "Developer documentation", "Sandbox/trial environment"],
      dealbreakers: ["No API documentation", "No SOC 2", "No trial available", "Vendor lock-in"],
      certificationsThatMatter: ["SOC 2 Type II", "GDPR compliant", "ISO 27001"],
      socialProofPreference: "metrics",
    },
    conversionPsychology: {
      primaryMotivation: "competitive-pressure",
      riskTolerance: "medium",
      decisionStyle: "analytical",
      priceAnchor: "Compare to the cost of 1% churn improvement at their ARR. If they're at $5M ARR with 5% monthly churn, reducing to 4% saves $600K/year.",
      guaranteePreference: "trial-period",
      ctaPreference: "start-trial",
    },
    competitors: {
      alternatives: ["HubSpot Marketing Hub", "Intercom", "Pendo + Amplitude", "ChurnZero", "Totango", "Gainsight"],
      switchingCosts: "High — data migration, team retraining, integration rewiring",
      differentiators: ["White-label capability (none of the above offer this)", "Lead marketplace (unique to LeadOS)", "Multi-tenant (can serve multiple products from one instance)", "Niche auto-config (deploy for any vertical instantly)"],
      weaknesses: ["HubSpot has bigger ecosystem", "Gainsight has deeper CS features", "Intercom has better in-app messaging"],
    },
    contentMap: [
      { stage: "Awareness", contentType: "Benchmark report", topic: "SaaS Trial Conversion Benchmarks 2026: Where Does Your Product Stand?", conversionGoal: "Email capture", expectedCvr: "8-15%" },
      { stage: "Consideration", contentType: "Interactive tool", topic: "SaaS Growth Assessment: Score Your PLG Readiness", conversionGoal: "Assessment → demo request", expectedCvr: "30-45%" },
      { stage: "Consideration", contentType: "Technical guide", topic: "How to Build a Customer Health Score That Actually Predicts Churn", conversionGoal: "Email capture → nurture", expectedCvr: "10-20%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Company] Cut Churn 40% and Grew ARR $2M in 6 Months", conversionGoal: "Demo request", expectedCvr: "15-25%" },
      { stage: "Decision", contentType: "ROI calculator", topic: "Calculate Your Churn Reduction Revenue Impact", conversionGoal: "Business case PDF → procurement", expectedCvr: "20-35%" },
    ],
  },

  construction: {
    niche: "construction",
    nicheLabel: "Construction & Contracting",
    lastUpdated: "2026-03-30",
    icp: { title: "Owner or operations manager", role: "Manages bids, crews, and client relationships", companySize: "5-100 employees", revenueRange: "$500K-$20M annual", techStack: ["QuickBooks", "Excel spreadsheets", "Email", "Paper daily reports"], buyingAuthority: "sole-decider", budgetCycle: "Project-based — cash flow follows project milestones", decisionTimeline: "1-2 weeks", industries: ["General Contracting", "Specialty Trades", "Commercial Build-Out", "Renovation", "Roofing", "Concrete", "Electrical"] },
    buyingTriggers: [
      { event: "Lost a bid because follow-up was too slow", urgency: "immediate", searchBehavior: "Searches 'contractor CRM' or 'bid management software'", emotionalState: "Angry — the job was theirs to lose" },
      { event: "Change order dispute cost money on a project", urgency: "immediate", searchBehavior: "Searches 'change order tracking' or 'construction project management'", emotionalState: "Burned — vows to never let it happen again" },
      { event: "Safety incident or near-miss triggered documentation review", urgency: "immediate", searchBehavior: "Searches 'construction safety compliance software'", emotionalState: "Fear — OSHA fines and liability exposure" },
      { event: "Crew scheduling conflict caused project delay", urgency: "this-quarter", searchBehavior: "Searches 'crew scheduling app' or 'construction scheduling software'", emotionalState: "Embarrassed — client saw the disorganization" },
    ],
    decisionJourney: { totalDays: 10, touchpointsNeeded: 5, stakeholders: 1, stages: [
      { name: "Pain event", durationDays: 0, primaryAction: "Searches for solution to the specific problem", contentNeeded: "Ad or blog addressing the exact pain", dropOffRisk: "Too generic — not construction-specific" },
      { name: "Quick research", durationDays: 3, primaryAction: "Checks 2-3 options, asks a peer", contentNeeded: "Contractor-specific landing page with trade language", dropOffRisk: "Looks like software for offices, not job sites" },
      { name: "Demo or trial", durationDays: 4, primaryAction: "Wants to see it work for their type of project", contentNeeded: "Demo showing their trade's workflow", dropOffRisk: "Demo doesn't show field-relevant features" },
      { name: "Decision", durationDays: 3, primaryAction: "Checks price, asks if it works on mobile", contentNeeded: "Clear pricing, mobile app confirmation", dropOffRisk: "Complex pricing or no mobile support" },
    ] },
    objections: [
      { objection: "My guys won't use software on the job site", underlyingFear: "Crew resistance to technology", evidenceBasedResponse: "The mobile interface is designed for work gloves. Tap-based, not typing. Crews adopt it in 1-2 days.", proofType: "demo" },
      { objection: "We're too small to need project management software", underlyingFear: "Complexity for a simple operation", evidenceBasedResponse: "If you manage more than 3 projects at once, the spreadsheet is already failing you. We've had 3-person crews cut admin time by 10 hours/week.", proofType: "case-study" },
    ],
    trustSignals: { primary: ["Case studies from same trade", "Mobile-friendly demo", "Simple pricing", "Real contractor testimonials"], secondary: ["Integration with QuickBooks", "Safety compliance features", "Number of contractors served"], dealbreakers: ["No mobile support", "Complex setup", "No construction industry experience"], certificationsThatMatter: ["BBB", "ABC member", "OSHA compliance tools"], socialProofPreference: "testimonials" },
    conversionPsychology: { primaryMotivation: "fear-of-loss", riskTolerance: "low", decisionStyle: "impulsive", priceAnchor: "One recovered bid pays for a year of the platform", guaranteePreference: "results-based", ctaPreference: "get-assessment" },
    competitors: { alternatives: ["Procore", "Buildertrend", "CoConstruct", "Jobber", "GoHighLevel via agency"], switchingCosts: "Low — most use spreadsheets", differentiators: ["Lead scoring for construction (unique)", "Bid follow-up automation", "Multi-trade support", "Marketplace for subcontractor leads"], weaknesses: ["Procore has deeper PM features", "Buildertrend has better homeowner portal"] },
    contentMap: [
      { stage: "Awareness", contentType: "Blog", topic: "Why the fastest contractor always wins the bid", conversionGoal: "Assessment", expectedCvr: "3-6%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Construction Operations Assessment", conversionGoal: "Email → demo", expectedCvr: "35-50%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Contractor] won 35% more bids with automated follow-up", conversionGoal: "Book call", expectedCvr: "15-25%" },
    ],
  },

  "real-estate": {
    niche: "real-estate",
    nicheLabel: "Real Estate Agents & Teams",
    lastUpdated: "2026-03-30",
    icp: { title: "Team lead, broker, or solo agent doing $3M+ volume", role: "Manages lead pipeline and client relationships", companySize: "Solo to 20-agent team", revenueRange: "$100K-$5M GCI", techStack: ["Zillow/Realtor.com for leads", "Basic CRM (Follow Up Boss, kvCORE)", "MLS access", "Social media"], buyingAuthority: "sole-decider", budgetCycle: "Monthly — commission-based cash flow", decisionTimeline: "1-7 days", industries: ["Residential", "Commercial", "Luxury", "Investment", "New Construction", "Property Management"] },
    buyingTriggers: [
      { event: "Paying $1K+/mo for Zillow leads that don't convert", urgency: "immediate", searchBehavior: "Searches 'alternative to Zillow leads' or 'real estate lead scoring'", emotionalState: "Frustrated — spending a lot, closing very few" },
      { event: "Lost a deal because they forgot to follow up", urgency: "immediate", searchBehavior: "Searches 'real estate follow-up automation' or 'agent CRM'", emotionalState: "Regret — the deal was winnable" },
      { event: "Hired a new agent who needs leads immediately", urgency: "immediate", searchBehavior: "Searches 'real estate lead generation system'", emotionalState: "Pressure — new agent is a cost until producing" },
      { event: "Market shift (rates changed, inventory shifted)", urgency: "this-quarter", searchBehavior: "Searches 'real estate marketing in [market condition]'", emotionalState: "Uncertain — old strategies may not work" },
    ],
    decisionJourney: { totalDays: 5, touchpointsNeeded: 4, stakeholders: 1, stages: [
      { name: "Pain", durationDays: 0, primaryAction: "Searches for lead gen or CRM solution", contentNeeded: "Targeted landing page for their market", dropOffRisk: "Doesn't feel real-estate-specific" },
      { name: "Compare", durationDays: 2, primaryAction: "Checks 2-3 options, reads agent reviews", contentNeeded: "Agent-specific testimonials, pricing comparison", dropOffRisk: "No agent testimonials or unclear pricing" },
      { name: "Try", durationDays: 2, primaryAction: "Starts trial or sees demo", contentNeeded: "Quick-start guide, first leads within 24 hours", dropOffRisk: "Slow onboarding or no immediate value" },
      { name: "Commit", durationDays: 1, primaryAction: "Sees first result, decides to stay", contentNeeded: "Early win — first lead or first automated follow-up", dropOffRisk: "No early win in first 48 hours" },
    ] },
    objections: [
      { objection: "I already get leads from Zillow/Realtor.com", underlyingFear: "Known quantity feels safer than unknown", evidenceBasedResponse: "We don't replace Zillow — we score and nurture the leads you already get. Agents using scoring close 2.3x more Zillow leads because they focus on the right ones.", proofType: "statistic" },
      { objection: "My team won't adopt another CRM", underlyingFear: "Previous CRM rollouts failed", evidenceBasedResponse: "This isn't a CRM — it's the layer that sits before your CRM and feeds it qualified, warm leads. Your team sees better leads, not another login.", proofType: "demo" },
    ],
    trustSignals: { primary: ["Agent testimonials with deal numbers", "First leads in 24 hours", "No long-term contract", "Works with their MLS"], secondary: ["Number of agents served", "Integration with Follow Up Boss/kvCORE", "NAR/local board relationships"], dealbreakers: ["Long contract", "No real estate proof", "Complex setup", "No mobile app"], certificationsThatMatter: ["NAR member", "MLS integration"], socialProofPreference: "testimonials" },
    conversionPsychology: { primaryMotivation: "fear-of-loss", riskTolerance: "medium", decisionStyle: "impulsive", priceAnchor: "One closed deal ($3K-$15K commission) pays for a year of the platform", guaranteePreference: "money-back", ctaPreference: "start-trial" },
    competitors: { alternatives: ["Zillow Premier Agent", "BoldTrails (kvCORE)", "Follow Up Boss", "Sierra Interactive", "Real Geeks"], switchingCosts: "Low — agents switch tools frequently", differentiators: ["AI scoring (not just CRM)", "Works across brokerages", "Marketplace for referral leads", "Multi-niche for agents who also do investment/commercial"], weaknesses: ["kvCORE has deeper IDX integration", "Follow Up Boss has more agent-specific features"] },
    contentMap: [
      { stage: "Awareness", contentType: "Social post", topic: "The 5-minute rule that closes 4x more real estate deals", conversionGoal: "Click to assessment", expectedCvr: "2-5%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Real Estate Lead Conversion Assessment", conversionGoal: "Email → trial", expectedCvr: "40-60%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Agent] closed 12 more deals in 6 months", conversionGoal: "Start trial", expectedCvr: "15-25%" },
    ],
  },

  education: {
    niche: "education", nicheLabel: "Education & Training Programs", lastUpdated: "2026-03-30",
    icp: { title: "Admissions director or program owner", role: "Owns enrollment pipeline and student acquisition", companySize: "5-200 staff", revenueRange: "$500K-$20M", techStack: ["LMS (Canvas, Moodle, Teachable)", "Email marketing", "Basic website", "Student information system"], buyingAuthority: "influences-decision", budgetCycle: "Semester-based — budgets set 6 months ahead", decisionTimeline: "3-6 weeks", industries: ["Online Courses", "Vocational Training", "Private Schools", "Tutoring", "Corporate Training", "Certification Programs"] },
    buyingTriggers: [
      { event: "Enrollment numbers declined for 2+ consecutive cycles", urgency: "this-quarter", searchBehavior: "Searches 'increase enrollment' or 'admissions automation'", emotionalState: "Worried — trend is unsustainable" },
      { event: "Competitor launched a similar program at lower price", urgency: "this-quarter", searchBehavior: "Researches differentiation, marketing strategies", emotionalState: "Competitive anxiety" },
      { event: "High inquiry volume but low conversion to enrollment", urgency: "immediate", searchBehavior: "Searches 'enrollment conversion' or 'admissions nurture'", emotionalState: "Frustrated — leads are there but not converting" },
    ],
    decisionJourney: { totalDays: 30, touchpointsNeeded: 8, stakeholders: 3, stages: [
      { name: "Trend noticed", durationDays: 0, primaryAction: "Reviews enrollment data, consults leadership", contentNeeded: "Benchmark report for their program type", dropOffRisk: "Data not relevant to their institution type" },
      { name: "Research", durationDays: 10, primaryAction: "Explores 3-5 solutions, reads case studies", contentNeeded: "Case study from similar institution", dropOffRisk: "No education-specific proof" },
      { name: "Committee review", durationDays: 10, primaryAction: "Presents to dean/board with ROI projection", contentNeeded: "ROI calculator, business case template", dropOffRisk: "Can't quantify enrollment lift" },
      { name: "Approval", durationDays: 10, primaryAction: "Budget approval, vendor selection", contentNeeded: "Flexible pricing, pilot program option", dropOffRisk: "Requires long commitment or large upfront" },
    ] },
    objections: [
      { objection: "Our students find us through word of mouth and reputation", underlyingFear: "Marketing feels beneath an academic institution", evidenceBasedResponse: "87% of prospective students research online before enrolling, even after a recommendation. We amplify your reputation where students are actually looking.", proofType: "statistic" },
      { objection: "We don't have budget until next semester", underlyingFear: "Budget cycles are rigid", evidenceBasedResponse: "We offer a pilot program that starts small. By next semester you'll have enrollment data that justifies the full budget.", proofType: "guarantee" },
    ],
    trustSignals: { primary: ["Case studies from similar programs", "Enrollment improvement metrics", "Integration with LMS", "Pilot program available"], secondary: ["Number of institutions served", "Accreditation body relationships", "Student satisfaction data"], dealbreakers: ["No education proof", "No LMS integration", "Requires large upfront commitment"], certificationsThatMatter: ["FERPA awareness", "Accreditation body partnerships"], socialProofPreference: "case-studies" },
    conversionPsychology: { primaryMotivation: "competitive-pressure", riskTolerance: "low", decisionStyle: "consensus", priceAnchor: "Cost per enrolled student vs current marketing spend per enrollment", guaranteePreference: "trial-period", ctaPreference: "get-assessment" },
    competitors: { alternatives: ["HubSpot for Education", "Slate (EAB)", "Element451", "Salesforce Education Cloud", "EnrollmentRx"], switchingCosts: "High — student data migration, staff training", differentiators: ["Multi-program support", "Niche auto-config for any program type", "Assessment-to-enrollment pipeline", "Alumni engagement built in"], weaknesses: ["Slate has deeper admissions features", "Salesforce has bigger ecosystem"] },
    contentMap: [
      { stage: "Awareness", contentType: "Report", topic: "Enrollment Trends 2026: What's Working for [Program Type]", conversionGoal: "Email capture", expectedCvr: "8-15%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Enrollment Growth Assessment", conversionGoal: "Demo request", expectedCvr: "30-45%" },
      { stage: "Decision", contentType: "ROI calculator", topic: "Calculate your enrollment marketing ROI", conversionGoal: "Book consultation", expectedCvr: "20-30%" },
    ],
  },

  finance: {
    niche: "finance", nicheLabel: "Financial Services & Accounting", lastUpdated: "2026-03-30",
    icp: { title: "Managing partner, practice owner, or marketing director", role: "Controls client acquisition and operations", companySize: "2-50 professionals", revenueRange: "$500K-$20M", techStack: ["Wealthbox or Redtail", "Tax software (Lacerte, Drake)", "Microsoft 365", "Basic website"], buyingAuthority: "sole-decider", budgetCycle: "Seasonal — tax season January-April, review season October-December", decisionTimeline: "2-4 weeks", industries: ["Financial Planning", "Accounting/CPA", "Tax Preparation", "Wealth Management", "Insurance", "Bookkeeping"] },
    buyingTriggers: [
      { event: "Client onboarding taking 3+ weeks due to manual KYC/document collection", urgency: "immediate", searchBehavior: "Searches 'financial advisor onboarding automation' or 'CPA client portal'", emotionalState: "Overwhelmed — compliance workload is crushing" },
      { event: "Tax season volume exceeded capacity", urgency: "this-quarter", searchBehavior: "Searches 'tax firm automation' or 'CPA practice management'", emotionalState: "Exhausted — just survived a brutal season" },
      { event: "Lost a client to a firm with a better digital experience", urgency: "this-quarter", searchBehavior: "Searches 'financial advisor client portal' or 'modern CPA tools'", emotionalState: "Embarrassed — their client experience is outdated" },
    ],
    decisionJourney: { totalDays: 21, touchpointsNeeded: 7, stakeholders: 2, stages: [
      { name: "Pain recognized", durationDays: 0, primaryAction: "Searches or asks peer group", contentNeeded: "Authority content for their specific practice type", dropOffRisk: "Not specific to their practice type" },
      { name: "Research", durationDays: 7, primaryAction: "Evaluates 3-4 solutions, checks compliance", contentNeeded: "Compliance documentation, practice-specific demo", dropOffRisk: "No compliance focus or generic demo" },
      { name: "Partner discussion", durationDays: 7, primaryAction: "Discusses with business partner, checks references", contentNeeded: "ROI projection, peer references", dropOffRisk: "Can't show ROI or no peer references" },
      { name: "Decision", durationDays: 7, primaryAction: "Starts implementation, ideally before next busy season", contentNeeded: "Quick implementation guarantee, training plan", dropOffRisk: "Implementation timeline threatens busy season" },
    ] },
    objections: [
      { objection: "Is this compliant with SEC/FINRA regulations?", underlyingFear: "Regulatory violation could end their practice", evidenceBasedResponse: "We don't handle client funds or provide financial advice. We automate your marketing and client communication — fully within compliance boundaries. SOC 2 controls documented.", proofType: "demo" },
      { objection: "We only grow through referrals", underlyingFear: "Marketing feels inappropriate for a trust-based profession", evidenceBasedResponse: "We automate your referral program — making it easier for happy clients to refer. Plus, we add proactive touchpoints between review meetings that deepen relationships.", proofType: "case-study" },
    ],
    trustSignals: { primary: ["Compliance documentation", "CPA/advisor case studies", "Integration with their practice management", "SOC 2 controls"], secondary: ["Number of firms served", "AUM growth metrics", "CFP/CPA professional endorsements"], dealbreakers: ["No compliance documentation", "No financial services experience", "Requires client data access"], certificationsThatMatter: ["SOC 2", "FINRA-compatible", "CFP Board partnerships"], socialProofPreference: "case-studies" },
    conversionPsychology: { primaryMotivation: "compliance", riskTolerance: "low", decisionStyle: "analytical", priceAnchor: "Cost of losing one high-net-worth client ($10K-$50K annual fees) vs platform cost", guaranteePreference: "satisfaction", ctaPreference: "get-assessment" },
    competitors: { alternatives: ["Wealthbox", "Redtail", "Orion", "Riskalyze", "SmartAsset for lead gen"], switchingCosts: "Medium — client data in existing tools", differentiators: ["Multi-practice type support", "Automated client review scheduling", "Referral automation", "Compliance-aware marketing"], weaknesses: ["Wealthbox has deeper AUM tracking", "Orion has better portfolio analytics"] },
    contentMap: [
      { stage: "Awareness", contentType: "Guide", topic: "How Top Financial Practices Onboard Clients in Under 1 Week", conversionGoal: "Email capture", expectedCvr: "6-12%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Financial Practice Efficiency Assessment", conversionGoal: "Demo request", expectedCvr: "35-50%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Firm] Cut Onboarding Time 60% and Grew AUM 30%", conversionGoal: "Book consultation", expectedCvr: "15-25%" },
    ],
  },

  franchise: {
    niche: "franchise", nicheLabel: "Franchise Systems & Multi-Location", lastUpdated: "2026-03-30",
    icp: { title: "VP Franchise Development, COO, or Director of Operations", role: "Manages franchise growth and franchisee performance", companySize: "20-500+ locations", revenueRange: "$5M-$500M system-wide", techStack: ["FranConnect or Franchise Soft", "Salesforce", "Custom internal tools", "Multiple local marketing tools"], buyingAuthority: "committee", budgetCycle: "Annual — tied to franchise development goals", decisionTimeline: "4-8 weeks", industries: ["QSR/Food", "Fitness", "Home Services", "Senior Care", "Automotive", "Retail", "Professional Services"] },
    buyingTriggers: [
      { event: "Franchisee lead follow-up varies wildly across locations", urgency: "this-quarter", searchBehavior: "Searches 'franchise lead management' or 'multi-location CRM'", emotionalState: "Frustrated — brand promise undermined by inconsistency" },
      { event: "Discovery Day conversion dropped below 30%", urgency: "immediate", searchBehavior: "Searches 'franchise candidate nurture' or 'franchise sales funnel'", emotionalState: "Pressure from CEO/board on unit growth" },
      { event: "Brand compliance violations increasing across locations", urgency: "this-quarter", searchBehavior: "Searches 'franchise brand compliance software' or 'multi-location marketing'", emotionalState: "Legal/brand risk anxiety" },
    ],
    decisionJourney: { totalDays: 45, touchpointsNeeded: 12, stakeholders: 4, stages: [
      { name: "Need identified", durationDays: 0, primaryAction: "Internal discussion, RFP drafted", contentNeeded: "Franchise-specific whitepaper or benchmark report", dropOffRisk: "Not franchise-specific enough" },
      { name: "RFP/shortlist", durationDays: 14, primaryAction: "Evaluates 3-5 vendors, checks IFA directory", contentNeeded: "Detailed capabilities document, IFA membership, case studies", dropOffRisk: "Not in IFA or no franchise case studies" },
      { name: "Demo + pilot", durationDays: 14, primaryAction: "Demo for 3-4 stakeholders, pilot with 5 locations", contentNeeded: "Multi-location demo, pilot proposal, location-level analytics", dropOffRisk: "Demo doesn't show multi-location view" },
      { name: "Committee approval", durationDays: 10, primaryAction: "VP presents to leadership with pilot results", contentNeeded: "Pilot results dashboard, full rollout ROI projection", dropOffRisk: "Pilot didn't show clear improvement" },
      { name: "Procurement", durationDays: 7, primaryAction: "Legal review, contract negotiation", contentNeeded: "Enterprise contract, SLA, security documentation", dropOffRisk: "No enterprise SLA or inflexible terms" },
    ] },
    objections: [
      { objection: "We need this to work across 200+ locations", underlyingFear: "Technology that works for 5 locations may not scale", evidenceBasedResponse: "Multi-tenant architecture designed for 500+ locations. Each location gets its own dashboard while HQ sees everything. We auto-scale on Kubernetes.", proofType: "demo" },
      { objection: "Our franchisees won't adopt another system", underlyingFear: "Previous tech rollouts had low adoption", evidenceBasedResponse: "Franchisees see their leads, their metrics, their brand — not a corporate tool. Adoption averages 85% within 30 days because it directly makes them money.", proofType: "case-study" },
    ],
    trustSignals: { primary: ["IFA membership", "Multi-location case studies", "Pilot program available", "SLA with 99.9% uptime"], secondary: ["Enterprise security documentation", "Scalability proof points", "Franchisee adoption metrics"], dealbreakers: ["No multi-location support", "No SLA", "No pilot program", "Single-tenant only"], certificationsThatMatter: ["SOC 2", "IFA membership", "Enterprise SLA"], socialProofPreference: "case-studies" },
    conversionPsychology: { primaryMotivation: "efficiency", riskTolerance: "low", decisionStyle: "consensus", priceAnchor: "Cost per location vs revenue impact per location. If each location gains 10 extra leads/month at $150 avg, $1,500/mo revenue vs $400/mo platform fee = 3.75x ROI.", guaranteePreference: "results-based", ctaPreference: "see-demo" },
    competitors: { alternatives: ["FranConnect", "Scorpion for franchise", "SOCi", "Reputation.com", "BrandMuscle"], switchingCosts: "Very high — multi-year contracts, deep integrations, staff training", differentiators: ["Lead scoring per location (nobody else does this)", "Marketplace for cross-territory lead sharing", "Niche auto-config for any franchise vertical", "One platform for development + operations"], weaknesses: ["FranConnect has deeper franchise development features", "SOCi has more social media management"] },
    contentMap: [
      { stage: "Awareness", contentType: "Whitepaper", topic: "2026 Franchise Operations Benchmark: Lead Performance Across 500+ Locations", conversionGoal: "Email capture", expectedCvr: "5-10%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Franchise Operations Assessment", conversionGoal: "Demo request", expectedCvr: "25-40%" },
      { stage: "Decision", contentType: "Pilot proposal", topic: "5-Location Pilot: See Results in 30 Days", conversionGoal: "Pilot agreement", expectedCvr: "30-50% of demo-to-pilot" },
    ],
  },

  staffing: {
    niche: "staffing", nicheLabel: "Staffing & Recruiting Agencies", lastUpdated: "2026-03-30",
    icp: { title: "Agency owner, VP Sales, or Director of Recruiting", role: "Manages both candidate pipeline and client relationships", companySize: "5-100 recruiters", revenueRange: "$1M-$50M annual", techStack: ["Bullhorn or JobAdder", "LinkedIn Recruiter", "Email", "Job boards"], buyingAuthority: "sole-decider", budgetCycle: "Monthly — tied to placement fees", decisionTimeline: "1-3 weeks", industries: ["IT Staffing", "Healthcare Staffing", "Industrial/Light Industrial", "Executive Search", "Contract Staffing", "RPO"] },
    buyingTriggers: [
      { event: "Time-to-fill exceeding client SLAs", urgency: "immediate", searchBehavior: "Searches 'speed up recruiting' or 'staffing agency automation'", emotionalState: "At risk of losing the client" },
      { event: "Recruiter quit and their candidate relationships walked out", urgency: "immediate", searchBehavior: "Searches 'staffing CRM' or 'candidate database management'", emotionalState: "Panicked — revenue tied to individual recruiters" },
      { event: "Client asked for reporting they can't produce", urgency: "this-quarter", searchBehavior: "Searches 'staffing analytics' or 'recruitment dashboard'", emotionalState: "Embarrassed — can't demonstrate value to client" },
    ],
    decisionJourney: { totalDays: 14, touchpointsNeeded: 6, stakeholders: 2, stages: [
      { name: "Pain event", durationDays: 0, primaryAction: "Searches for solution", contentNeeded: "Staffing-specific landing page", dropOffRisk: "Doesn't look staffing-specific" },
      { name: "Research", durationDays: 5, primaryAction: "Compares 3 options, checks Bullhorn integration", contentNeeded: "Integration docs, staffing case study", dropOffRisk: "No ATS integration" },
      { name: "Demo", durationDays: 5, primaryAction: "Sees demo with staffing workflow", contentNeeded: "Live demo showing their vertical", dropOffRisk: "Generic demo not showing staffing flows" },
      { name: "Decision", durationDays: 4, primaryAction: "Checks pricing against placement margins", contentNeeded: "Clear ROI: X placements/month covers the cost", dropOffRisk: "Can't justify against thin margins" },
    ] },
    objections: [
      { objection: "We already have Bullhorn", underlyingFear: "Don't want to replace their ATS", evidenceBasedResponse: "We don't replace Bullhorn — we feed it better candidates faster. Think of us as the pipeline that fills your ATS with pre-qualified, engaged candidates.", proofType: "demo" },
      { objection: "Our recruiters are our competitive advantage, not software", underlyingFear: "Technology might commoditize their service", evidenceBasedResponse: "Great recruiters deserve great tools. We automate the sourcing grind so your recruiters spend time on relationship-building — the part humans do better.", proofType: "case-study" },
    ],
    trustSignals: { primary: ["Staffing agency case studies with fill rate improvements", "Bullhorn/JobAdder integration", "Recruiter productivity metrics", "No long contract"], secondary: ["Number of agencies served", "Placements facilitated", "Candidate experience scores"], dealbreakers: ["No ATS integration", "No staffing industry proof", "Complex pricing"], certificationsThatMatter: ["ASA membership", "SIA recognition"], socialProofPreference: "metrics" },
    conversionPsychology: { primaryMotivation: "efficiency", riskTolerance: "medium", decisionStyle: "analytical", priceAnchor: "One additional placement/month ($3K-$15K fee) pays for the platform for a year", guaranteePreference: "results-based", ctaPreference: "get-assessment" },
    competitors: { alternatives: ["Bullhorn Automation", "Loxo", "hireEZ", "Crelate", "Vincere"], switchingCosts: "Medium — candidate data in existing ATS", differentiators: ["Multi-vertical support", "Client AND candidate portals", "Marketplace for candidate sharing across non-competing agencies", "AI scoring for candidate-job fit"], weaknesses: ["Bullhorn has deeper ATS features", "Loxo has AI sourcing built in"] },
    contentMap: [
      { stage: "Awareness", contentType: "Blog", topic: "Why the Fastest Staffing Agencies Win Every Placement", conversionGoal: "Assessment", expectedCvr: "3-6%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Staffing Pipeline Efficiency Assessment", conversionGoal: "Demo request", expectedCvr: "35-50%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Agency] Doubled Placements per Recruiter", conversionGoal: "Start trial", expectedCvr: "15-25%" },
    ],
  },

  faith: {
    niche: "faith", nicheLabel: "Churches & Ministries", lastUpdated: "2026-03-30",
    icp: { title: "Senior pastor, executive pastor, or church administrator", role: "Oversees operations, communications, and congregation engagement", companySize: "100-5,000 members", revenueRange: "$200K-$10M annual (tithes + offerings)", techStack: ["Church Management System (Planning Center, Breeze)", "Email newsletter", "Facebook page", "Basic website"], buyingAuthority: "committee", budgetCycle: "Annual — tied to church fiscal year and giving patterns", decisionTimeline: "4-8 weeks (elder/board approval needed)", industries: ["Protestant Churches", "Catholic Parishes", "Non-Denominational", "Megachurches", "Ministries", "Faith-Based Nonprofits"] },
    buyingTriggers: [
      { event: "Online giving is only 10% of total giving (should be 40%+)", urgency: "this-quarter", searchBehavior: "Searches 'church online giving platform' or 'increase church giving'", emotionalState: "Concerned — generational shift in how people give" },
      { event: "Attendance declining while community population grows", urgency: "this-year", searchBehavior: "Searches 'church growth strategies' or 'church engagement tools'", emotionalState: "Soul-searching — what are we doing wrong?" },
      { event: "Volunteer coordination is chaos every Sunday", urgency: "immediate", searchBehavior: "Searches 'church volunteer scheduling' or 'ministry management software'", emotionalState: "Overwhelmed — admin is stealing time from ministry" },
    ],
    decisionJourney: { totalDays: 45, touchpointsNeeded: 8, stakeholders: 4, stages: [
      { name: "Need identified", durationDays: 0, primaryAction: "Pastor or admin discusses with leadership", contentNeeded: "Case study from similar-sized church", dropOffRisk: "Content feels corporate, not ministry-focused" },
      { name: "Research", durationDays: 14, primaryAction: "Evaluates 2-3 options, asks other pastors", contentNeeded: "Pastor-to-pastor testimonials, church-specific demo", dropOffRisk: "No church testimonials or too secular feeling" },
      { name: "Board presentation", durationDays: 14, primaryAction: "Presents to elders/board with budget request", contentNeeded: "Ministry impact projection (not just ROI)", dropOffRisk: "Framed as business tool, not ministry tool" },
      { name: "Approval + launch", durationDays: 14, primaryAction: "Board approves, announces to congregation", contentNeeded: "Congregation launch plan, training materials", dropOffRisk: "Congregation resistance to change" },
    ] },
    objections: [
      { objection: "Our congregation is older and won't use technology", underlyingFear: "Change will alienate the core members", evidenceBasedResponse: "The interface is simpler than Facebook. We've seen 70+ year-old members embrace online giving within 2 weeks when the pastor champions it. And it doesn't replace personal connection — it amplifies it.", proofType: "testimonial" },
      { objection: "We're a church, not a business — we don't need marketing automation", underlyingFear: "Marketing feels wrong for a house of worship", evidenceBasedResponse: "We don't call it marketing. We call it communication. Automated welcome messages for visitors, birthday greetings, prayer request follow-ups — these are acts of care at scale.", proofType: "testimonial" },
    ],
    trustSignals: { primary: ["Pastor testimonials", "Church-specific language throughout", "Ministry impact stories (not just metrics)", "Affordable for churches"], secondary: ["Integration with Planning Center/Breeze", "Data security for member info", "Denomination-friendly"], dealbreakers: ["Secular/corporate tone", "Expensive for church budgets", "No church references", "Requires member data sharing"], certificationsThatMatter: ["ECFA membership", "Church-specific data privacy"], socialProofPreference: "testimonials" },
    conversionPsychology: { primaryMotivation: "aspiration", riskTolerance: "low", decisionStyle: "consensus", priceAnchor: "Less than one Sunday's offering plate. If online giving increases 10%, it pays for itself many times over.", guaranteePreference: "trial-period", ctaPreference: "see-demo" },
    competitors: { alternatives: ["Planning Center", "Pushpay", "Tithe.ly", "Breeze ChMS", "Church Center"], switchingCosts: "Medium — member data in existing ChMS", differentiators: ["Integrated giving + communications + volunteer scheduling (others are point solutions)", "Multi-campus support", "Community engagement beyond Sunday"], weaknesses: ["Planning Center has deeper worship planning", "Pushpay has more giving-specific features", "Tithe.ly is cheaper for small churches"] },
    contentMap: [
      { stage: "Awareness", contentType: "Story", topic: "How [Church] Grew Online Giving from 10% to 45% in 6 Months", conversionGoal: "Email capture", expectedCvr: "5-10%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Ministry Technology Assessment", conversionGoal: "Demo request", expectedCvr: "25-40%" },
      { stage: "Decision", contentType: "Pastor testimonial video", topic: "Pastor [Name] Shares How Technology Strengthened Their Ministry", conversionGoal: "Board presentation", expectedCvr: "15-25% demo-to-pilot" },
    ],
  },

  creative: {
    niche: "creative", nicheLabel: "Creative Agencies & Studios", lastUpdated: "2026-03-30",
    icp: { title: "Agency owner, creative director, or studio principal", role: "Manages client relationships, creative output, and business development", companySize: "2-50 creatives", revenueRange: "$200K-$10M annual", techStack: ["Project management (Asana, Monday, Basecamp)", "Adobe Creative Suite", "Proposal tools (Proposify, HoneyBook)", "Social media"], buyingAuthority: "sole-decider", budgetCycle: "Project-based — feast or famine cash flow", decisionTimeline: "1-2 weeks", industries: ["Design Studios", "Branding Agencies", "Video Production", "Photography", "Web Design", "Advertising", "Content Creation"] },
    buyingTriggers: [
      { event: "Spent 40 hours on a pitch that didn't win", urgency: "immediate", searchBehavior: "Searches 'qualify creative clients' or 'agency lead scoring'", emotionalState: "Burned out — unpaid pitch work is soul-crushing" },
      { event: "Client scope-crept a project into unprofitability", urgency: "immediate", searchBehavior: "Searches 'creative project management' or 'scope management for agencies'", emotionalState: "Resentful — great work, terrible business outcome" },
      { event: "No new inquiries for 3+ weeks", urgency: "immediate", searchBehavior: "Searches 'agency lead generation' or 'get more design clients'", emotionalState: "Panicking — pipeline is empty and rent is due" },
    ],
    decisionJourney: { totalDays: 7, touchpointsNeeded: 4, stakeholders: 1, stages: [
      { name: "Panic or frustration", durationDays: 0, primaryAction: "Searches for immediate help", contentNeeded: "Empathetic landing page that shows they understand creative businesses", dropOffRisk: "Feels like a generic business tool, not creative-specific" },
      { name: "Quick research", durationDays: 3, primaryAction: "Checks 2-3 options, reads agency owner reviews", contentNeeded: "Agency-specific case study with portfolio-to-lead metrics", dropOffRisk: "No creative industry proof" },
      { name: "Try it", durationDays: 3, primaryAction: "Signs up or books demo", contentNeeded: "Quick win within first 48 hours", dropOffRisk: "Slow setup or no immediate value" },
      { name: "Commit", durationDays: 1, primaryAction: "Sees first qualified inquiry come through", contentNeeded: "The lead itself is the proof", dropOffRisk: "No leads in first week" },
    ] },
    objections: [
      { objection: "We get our best clients through referrals and portfolios", underlyingFear: "Lead gen feels beneath a creative studio", evidenceBasedResponse: "We don't replace your portfolio — we make sure more of the right people see it. Qualified creative brief intake + automated follow-up means you only talk to prospects who have budget and fit.", proofType: "demo" },
      { objection: "Automation feels impersonal for creative work", underlyingFear: "Clients expect artisanal, high-touch experience", evidenceBasedResponse: "The automation handles admin — intake forms, follow-ups, scheduling. Your creative team stays fully human in every client interaction. You just stop losing inquiries.", proofType: "case-study" },
    ],
    trustSignals: { primary: ["Case studies from creative agencies", "Portfolio-to-lead conversion metrics", "Scope management features", "Beautiful interface (creatives judge this)"], secondary: ["Integration with Asana/Monday", "Proposal automation", "Number of agencies served"], dealbreakers: ["Ugly interface", "No creative industry proof", "Complex setup", "Aggressive sales tactics"], certificationsThatMatter: ["None required — quality of work speaks"], socialProofPreference: "case-studies" },
    conversionPsychology: { primaryMotivation: "fear-of-loss", riskTolerance: "medium", decisionStyle: "emotional", priceAnchor: "One qualified project ($5K-$50K) pays for a year of the platform", guaranteePreference: "money-back", ctaPreference: "start-trial" },
    competitors: { alternatives: ["HoneyBook", "Dubsado", "Moxie", "Studio Ninja", "GoHighLevel via agency"], switchingCosts: "Low — most use scattered tools", differentiators: ["Lead scoring for creative briefs (nobody else does this)", "Scope guardian that detects overruns", "Multi-discipline support (design + video + photo in one)", "Marketplace for overflow referrals"], weaknesses: ["HoneyBook has better proposal/contract features", "Dubsado has more beautiful templates"] },
    contentMap: [
      { stage: "Awareness", contentType: "Blog", topic: "How to Stop Doing Free Pitches That Never Convert", conversionGoal: "Email capture", expectedCvr: "4-8%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Creative Agency Workflow Assessment", conversionGoal: "Demo or trial", expectedCvr: "35-50%" },
      { stage: "Decision", contentType: "Case study", topic: "How [Studio] Increased Project Margins 35% with Intake Automation", conversionGoal: "Start trial", expectedCvr: "15-25%" },
    ],
  },

  general: {
    niche: "general", nicheLabel: "General Business", lastUpdated: "2026-03-30",
    icp: { title: "Business owner or general manager", role: "Wears multiple hats — sales, operations, customer service", companySize: "1-50 employees", revenueRange: "$100K-$5M annual", techStack: ["Google Workspace or Microsoft 365", "Basic website", "Social media", "Maybe a CRM they barely use"], buyingAuthority: "sole-decider", budgetCycle: "No formal budget cycle — buys when the pain is acute enough", decisionTimeline: "1-7 days", industries: ["Any service business not in a specialized category"] },
    buyingTriggers: [
      { event: "Realized they're leaving money on the table from unresponded leads", urgency: "immediate", searchBehavior: "Searches 'how to get more customers' or 'lead management software'", emotionalState: "Frustrated — working hard but not growing" },
      { event: "Competitor started showing up everywhere online", urgency: "this-quarter", searchBehavior: "Searches 'small business marketing' or 'how to compete with larger companies'", emotionalState: "Threatened — feels like falling behind" },
      { event: "Burned out from doing everything manually", urgency: "this-year", searchBehavior: "Searches 'business automation' or 'save time in my business'", emotionalState: "Exhausted — wants their life back" },
    ],
    decisionJourney: { totalDays: 5, touchpointsNeeded: 3, stakeholders: 1, stages: [
      { name: "Problem", durationDays: 0, primaryAction: "Searches for help", contentNeeded: "Simple, empathetic landing page", dropOffRisk: "Too complex or jargon-heavy" },
      { name: "Explore", durationDays: 2, primaryAction: "Reads reviews, checks pricing", contentNeeded: "Clear pricing, simple testimonials", dropOffRisk: "Hidden pricing or enterprise-only positioning" },
      { name: "Decide", durationDays: 3, primaryAction: "Signs up or calls", contentNeeded: "Easy start, immediate value", dropOffRisk: "Complex onboarding" },
    ] },
    objections: [
      { objection: "I'm not tech-savvy", underlyingFear: "Will waste money on something they can't use", evidenceBasedResponse: "We set it up for you. Average setup is 48 hours. Then it runs on autopilot. If you can check email, you can use this.", proofType: "demo" },
      { objection: "I can't afford another monthly expense", underlyingFear: "Every dollar matters when margins are thin", evidenceBasedResponse: "If it brings you one extra customer per month, does it pay for itself? For most of our users, it pays for itself in week one.", proofType: "guarantee" },
    ],
    trustSignals: { primary: ["Simple language", "Clear pricing", "Phone number visible", "Real people testimonials"], secondary: ["Number of businesses served", "Money-back guarantee", "No contract"], dealbreakers: ["Enterprise-only", "Complex pricing", "No phone support", "Long onboarding"], certificationsThatMatter: ["BBB", "Local Chamber"], socialProofPreference: "testimonials" },
    conversionPsychology: { primaryMotivation: "fear-of-loss", riskTolerance: "low", decisionStyle: "impulsive", priceAnchor: "One new customer pays for the platform", guaranteePreference: "money-back", ctaPreference: "get-assessment" },
    competitors: { alternatives: ["Mailchimp", "HubSpot Free", "GoHighLevel", "Constant Contact", "DIY social media"], switchingCosts: "Very low", differentiators: ["All-in-one (replaces 8 tools)", "Niche-specific from day one", "AI scoring", "Setup done for you"], weaknesses: ["HubSpot has bigger brand", "Mailchimp is more widely known"] },
    contentMap: [
      { stage: "Awareness", contentType: "Ad/Blog", topic: "Stop Losing Customers to Businesses That Respond Faster", conversionGoal: "Assessment", expectedCvr: "3-5%" },
      { stage: "Consideration", contentType: "Assessment", topic: "Business Growth Assessment (2 min)", conversionGoal: "Email → trial", expectedCvr: "40-60%" },
      { stage: "Decision", contentType: "Offer", topic: "Start getting leads this week — money-back guarantee", conversionGoal: "Purchase", expectedCvr: "8-15%" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

export function getCustomerIntelligence(niche: string): CustomerIntelligenceProfile | undefined {
  return CUSTOMER_INTELLIGENCE[niche];
}

export function getCustomerIntelligenceOrDefault(niche: string): CustomerIntelligenceProfile {
  return CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general;
}

export function getAllIntelligenceNiches(): string[] {
  return Object.keys(CUSTOMER_INTELLIGENCE);
}

export function getBuyingTriggers(niche: string): BuyingTrigger[] {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).buyingTriggers;
}

export function getObjections(niche: string): ObjectionEntry[] {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).objections;
}

export function getTrustSignals(niche: string): TrustSignalProfile {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).trustSignals;
}

export function getConversionPsychology(niche: string): ConversionPsychology {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).conversionPsychology;
}

export function getContentMap(niche: string): ContentConversionMap[] {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).contentMap;
}

export function getDecisionJourney(niche: string): DecisionJourney {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).decisionJourney;
}

export function getCompetitors(niche: string): CompetitorAwareness {
  return (CUSTOMER_INTELLIGENCE[niche] ?? CUSTOMER_INTELLIGENCE.general).competitors;
}
