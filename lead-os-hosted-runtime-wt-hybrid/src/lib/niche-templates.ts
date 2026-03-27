export type IndustryCategory =
  | "service"
  | "legal"
  | "health"
  | "tech"
  | "construction"
  | "real-estate"
  | "education"
  | "finance"
  | "franchise"
  | "staffing"
  | "faith"
  | "creative"
  | "general";

export interface AssessmentStem {
  questionTemplate: string;
  type: "single-choice" | "scale";
  optionTemplates: { label: string; scoreImpact: number }[];
}

export interface IndustryTemplateBank {
  painPoints: string[];
  urgencySignals: string[];
  offers: string[];
  assessmentStems: AssessmentStem[];
  headlineTemplates: Record<
    "cold" | "warm" | "hot" | "burning",
    {
      headline: string;
      subheadline: string;
      ctaText: string;
      socialProof: string;
    }
  >;
  funnelPreferences: string[];
  scoringBias: {
    intentWeight: number;
    fitWeight: number;
    engagementWeight: number;
    urgencyWeight: number;
  };
  nurtureSubjects: string[];
}

export const INDUSTRY_TEMPLATES: Record<IndustryCategory, IndustryTemplateBank> = {
  service: {
    painPoints: [
      "Missed calls and slow follow-up are costing {{niche}} businesses revenue every week",
      "Manual scheduling and dispatching wastes hours that {{niche}} teams could spend on billable work",
      "No consistent process to turn one-time {{niche}} customers into repeat clients",
      "Relying on word-of-mouth alone leaves {{niche}} businesses vulnerable to seasonal dips",
      "Disorganized quoting means {{niche}} providers lose jobs to faster competitors",
      "{{niche}} owners are stuck in the business instead of working on growth",
    ],
    urgencySignals: [
      "seasonal rush",
      "booked out",
      "losing customers",
      "competitor opened nearby",
      "need help now",
      "can not keep up",
      "hiring",
      "expanding",
    ],
    offers: [
      "Done-for-you lead capture and follow-up system",
      "Automated booking and dispatch setup",
      "Review generation and reputation engine",
      "Customer win-back and retention campaigns",
      "Local SEO and Google Business optimization",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} business respond to new inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Within 5 minutes", scoreImpact: 10 },
          { label: "Within an hour", scoreImpact: 20 },
          { label: "Same day", scoreImpact: 35 },
          { label: "Next day or longer", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many new {{niche}} leads do you get per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "Fewer than 10", scoreImpact: 15 },
          { label: "10-30", scoreImpact: 25 },
          { label: "31-75", scoreImpact: 40 },
          { label: "More than 75", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you have an automated follow-up sequence for {{niche}} leads?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, fully automated", scoreImpact: 10 },
          { label: "Partially automated", scoreImpact: 25 },
          { label: "Manual follow-up only", scoreImpact: 40 },
          { label: "No follow-up process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What percentage of your {{niche}} revenue comes from repeat customers?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 60%", scoreImpact: 10 },
          { label: "30-60%", scoreImpact: 20 },
          { label: "10-30%", scoreImpact: 35 },
          { label: "Under 10%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How do you currently collect reviews from {{niche}} customers?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated review requests", scoreImpact: 10 },
          { label: "Manually ask sometimes", scoreImpact: 30 },
          { label: "We do not ask for reviews", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your current online visibility for {{niche}} services",
        type: "scale",
        optionTemplates: [
          { label: "1 - Invisible", scoreImpact: 50 },
          { label: "2 - Minimal", scoreImpact: 40 },
          { label: "3 - Average", scoreImpact: 25 },
          { label: "4 - Strong", scoreImpact: 15 },
          { label: "5 - Dominant", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth bottleneck in {{niche}} right now?",
        type: "single-choice",
        optionTemplates: [
          { label: "Not enough leads", scoreImpact: 45 },
          { label: "Leads but poor conversion", scoreImpact: 50 },
          { label: "Capacity and hiring", scoreImpact: 30 },
          { label: "Retention and repeat business", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "Stop losing {{niche}} jobs to competitors who respond faster",
        subheadline: "See how {{niche}} businesses capture and convert more leads without adding staff.",
        ctaText: "Get Your Free Assessment",
        socialProof: "Trusted by 200+ {{niche}} businesses across the country",
      },
      warm: {
        headline: "You are researching how to grow your {{niche}} business. Here is the fastest path.",
        subheadline: "Based on what you have explored, a quick diagnostic will pinpoint your biggest opportunity.",
        ctaText: "Take the 2-Minute Assessment",
        socialProof: "Most {{niche}} businesses see results within the first 30 days",
      },
      hot: {
        headline: "Ready to fill your {{niche}} schedule? Let us build your system this week.",
        subheadline: "Book a strategy session and get a concrete plan tailored to your {{niche}} business.",
        ctaText: "Book Your Strategy Session",
        socialProof: "93% of {{niche}} strategy session attendees move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} growth engine is ready. Let us launch it today.",
        subheadline: "We have everything configured for your {{niche}} business. Pick a time to go live.",
        ctaText: "Start Now",
        socialProof: "Average 47% increase in qualified {{niche}} leads within 60 days",
      },
    },
    funnelPreferences: ["lead-magnet", "qualification", "chat", "retention"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.25,
      engagementWeight: 0.25,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} growth roadmap is inside",
      "The #1 mistake {{niche}} businesses make with leads",
      "How [Company] doubled their {{niche}} bookings in 30 days",
      "3 automations every {{niche}} business should run",
      "We saved a spot for your {{niche}} strategy session",
      "Last chance: your {{niche}} assessment results expire soon",
      "What top {{niche}} businesses do differently",
    ],
  },

  legal: {
    painPoints: [
      "{{niche}} firms lose potential clients because intake forms take days to process",
      "Manual conflict checks and document gathering slow {{niche}} case onboarding",
      "{{niche}} attorneys spend more time on admin than on billable casework",
      "No structured follow-up means {{niche}} consultations that do not convert go cold",
      "{{niche}} firms struggle to demonstrate ROI on marketing spend",
      "Client communication gaps create malpractice exposure for {{niche}} practices",
      "Compliance tracking across {{niche}} matters is fragmented and error-prone",
    ],
    urgencySignals: [
      "statute of limitations",
      "court deadline",
      "regulatory change",
      "compliance audit",
      "opposing counsel filed",
      "client retention risk",
      "bar complaint",
      "insurance renewal",
    ],
    offers: [
      "Automated client intake and conflict check system",
      "Case status portal with real-time client access",
      "Compliance tracking and deadline management platform",
      "Referral network and reputation engine for {{niche}} attorneys",
    ],
    assessmentStems: [
      {
        questionTemplate: "How long does your {{niche}} firm take to respond to new client inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 1 hour", scoreImpact: 10 },
          { label: "Same business day", scoreImpact: 25 },
          { label: "Next business day", scoreImpact: 40 },
          { label: "2+ days", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many new {{niche}} consultations does your firm handle per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "Fewer than 10", scoreImpact: 15 },
          { label: "10-25", scoreImpact: 25 },
          { label: "26-50", scoreImpact: 40 },
          { label: "More than 50", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} practice use automated intake workflows?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, fully digital", scoreImpact: 10 },
          { label: "Partially digital", scoreImpact: 25 },
          { label: "Paper and email only", scoreImpact: 45 },
          { label: "No formal process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} firm track deadlines and compliance dates?",
        type: "single-choice",
        optionTemplates: [
          { label: "Practice management software", scoreImpact: 10 },
          { label: "Calendar reminders", scoreImpact: 30 },
          { label: "Spreadsheets", scoreImpact: 40 },
          { label: "Manual tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What is your consultation-to-retention conversion rate for {{niche}} cases?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 60%", scoreImpact: 10 },
          { label: "40-60%", scoreImpact: 20 },
          { label: "20-40%", scoreImpact: 35 },
          { label: "Under 20%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} firm's client communication process",
        type: "scale",
        optionTemplates: [
          { label: "1 - Reactive and inconsistent", scoreImpact: 50 },
          { label: "2 - Mostly manual", scoreImpact: 40 },
          { label: "3 - Structured but slow", scoreImpact: 25 },
          { label: "4 - Proactive with some automation", scoreImpact: 15 },
          { label: "5 - Fully automated and proactive", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is the biggest operational challenge in your {{niche}} practice?",
        type: "single-choice",
        optionTemplates: [
          { label: "Client intake bottleneck", scoreImpact: 50 },
          { label: "Deadline and compliance tracking", scoreImpact: 45 },
          { label: "Staff utilization and billing", scoreImpact: 35 },
          { label: "Marketing and lead generation", scoreImpact: 40 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} firms that automate intake convert 3x more consultations",
        subheadline: "Discover how modern {{niche}} practices eliminate intake bottlenecks and reduce admin overhead.",
        ctaText: "Get Your Intake Assessment",
        socialProof: "Used by 150+ {{niche}} firms to streamline operations",
      },
      warm: {
        headline: "Your {{niche}} practice deserves a better intake process. See what is possible.",
        subheadline: "You have been exploring solutions. Let us show you the fastest path to operational efficiency.",
        ctaText: "See the Intake Blueprint",
        socialProof: "Average 40% reduction in intake processing time",
      },
      hot: {
        headline: "Let us build your {{niche}} firm's automated intake system this week",
        subheadline: "Book a strategy session and walk away with a blueprint tailored to your {{niche}} practice.",
        ctaText: "Book Your Strategy Session",
        socialProof: "92% of {{niche}} firms that book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} intake system is configured. Let us go live.",
        subheadline: "Everything is ready for your practice. Pick a launch date.",
        ctaText: "Launch Now",
        socialProof: "Firms report 50% faster client onboarding after launch",
      },
    },
    funnelPreferences: ["qualification", "authority", "webinar", "retention"],
    scoringBias: {
      intentWeight: 0.25,
      fitWeight: 0.30,
      engagementWeight: 0.20,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} intake efficiency report is ready",
      "Why top {{niche}} firms never miss a follow-up",
      "Case study: how [Firm] cut intake time by 60%",
      "3 compliance risks hiding in your {{niche}} workflow",
      "Your strategy session slot is reserved",
      "Final reminder: your {{niche}} assessment expires tomorrow",
      "What elite {{niche}} practices do that average ones do not",
    ],
  },

  health: {
    painPoints: [
      "{{niche}} practices lose patients to competitors with faster online scheduling",
      "Insurance verification delays cause {{niche}} appointment cancellations and no-shows",
      "Staff turnover in {{niche}} clinics means institutional knowledge walks out the door",
      "{{niche}} providers spend hours on documentation that could be automated",
      "Patient follow-up gaps in {{niche}} practices lead to poor outcomes and lost revenue",
      "{{niche}} practices have no system to re-engage dormant patients",
      "Accreditation and compliance tracking is manual and error-prone for {{niche}} providers",
    ],
    urgencySignals: [
      "accreditation deadline",
      "patient safety concern",
      "staff shortage",
      "insurance panel change",
      "HIPAA audit",
      "EHR migration",
      "patient complaints rising",
      "revenue declining",
    ],
    offers: [
      "Automated patient scheduling and reminder system",
      "Patient reactivation and recall campaigns",
      "Online intake and insurance pre-verification",
      "Review and reputation management for {{niche}} practices",
      "Staff onboarding and training automation",
    ],
    assessmentStems: [
      {
        questionTemplate: "What is your {{niche}} practice's no-show rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 5%", scoreImpact: 10 },
          { label: "5-15%", scoreImpact: 25 },
          { label: "15-25%", scoreImpact: 40 },
          { label: "Over 25%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} practice handle patient scheduling?",
        type: "single-choice",
        optionTemplates: [
          { label: "Online self-scheduling with automation", scoreImpact: 10 },
          { label: "Online scheduling, manual confirmation", scoreImpact: 25 },
          { label: "Phone-only scheduling", scoreImpact: 40 },
          { label: "Walk-ins and callbacks", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} practice send automated appointment reminders?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, multi-channel (text, email, call)", scoreImpact: 10 },
          { label: "Yes, single channel", scoreImpact: 20 },
          { label: "Manual reminders only", scoreImpact: 40 },
          { label: "No reminders", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many active patients does your {{niche}} practice manage?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 500", scoreImpact: 15 },
          { label: "500-2,000", scoreImpact: 25 },
          { label: "2,000-5,000", scoreImpact: 40 },
          { label: "Over 5,000", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How do you re-engage inactive {{niche}} patients?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated recall campaigns", scoreImpact: 10 },
          { label: "Periodic manual outreach", scoreImpact: 30 },
          { label: "Only when they call back", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} practice's digital patient experience",
        type: "scale",
        optionTemplates: [
          { label: "1 - No digital touchpoints", scoreImpact: 50 },
          { label: "2 - Basic website only", scoreImpact: 40 },
          { label: "3 - Online forms and scheduling", scoreImpact: 25 },
          { label: "4 - Portal with messaging", scoreImpact: 15 },
          { label: "5 - Fully integrated digital experience", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your top operational priority for your {{niche}} practice?",
        type: "single-choice",
        optionTemplates: [
          { label: "Reduce no-shows and cancellations", scoreImpact: 45 },
          { label: "Improve patient acquisition", scoreImpact: 50 },
          { label: "Streamline documentation and compliance", scoreImpact: 35 },
          { label: "Boost patient retention and reactivation", scoreImpact: 40 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} practices that automate scheduling cut no-shows by 40%",
        subheadline: "See how leading {{niche}} providers fill their schedule and reduce admin burden.",
        ctaText: "Get Your Practice Assessment",
        socialProof: "Trusted by 300+ {{niche}} practices nationwide",
      },
      warm: {
        headline: "You are looking for ways to grow your {{niche}} practice. Start here.",
        subheadline: "A quick diagnostic will reveal your biggest opportunities for patient growth and retention.",
        ctaText: "Take the Practice Assessment",
        socialProof: "Practices see 25% more appointments within 60 days",
      },
      hot: {
        headline: "Let us build your {{niche}} patient growth engine this week",
        subheadline: "Book a strategy call and get a plan designed for your specific {{niche}} practice.",
        ctaText: "Book Your Strategy Call",
        socialProof: "91% of practices that book a call move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} patient system is ready. Let us turn it on.",
        subheadline: "Everything is configured. Choose your launch date and start filling your schedule.",
        ctaText: "Go Live Now",
        socialProof: "Average 35% increase in new patient volume within 90 days",
      },
    },
    funnelPreferences: ["qualification", "lead-magnet", "chat", "retention"],
    scoringBias: {
      intentWeight: 0.25,
      fitWeight: 0.30,
      engagementWeight: 0.20,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} practice growth report is ready",
      "The hidden cost of no-shows in {{niche}} practices",
      "How [Practice] added 50 patients per month with automation",
      "3 patient experience gaps most {{niche}} practices miss",
      "Your strategy call is waiting",
      "Last chance: your {{niche}} assessment results expire soon",
      "What high-growth {{niche}} practices do differently",
    ],
  },

  tech: {
    painPoints: [
      "{{niche}} companies lose trial users because onboarding is too complex",
      "High churn in {{niche}} products signals poor activation and engagement loops",
      "{{niche}} sales teams waste time on unqualified demos that never close",
      "No product-led growth motion means {{niche}} companies over-rely on expensive sales teams",
      "{{niche}} businesses lack visibility into which features drive conversion",
      "Support ticket volume overwhelms {{niche}} teams that have not invested in self-service",
    ],
    urgencySignals: [
      "funding round closing",
      "board meeting",
      "competitor launched",
      "churn spike",
      "scaling challenges",
      "hiring freeze",
      "product launch",
      "renewal season",
    ],
    offers: [
      "Product-led onboarding audit and optimization",
      "Automated trial-to-paid conversion sequences",
      "Customer health scoring and churn prediction",
      "Self-service knowledge base and support automation",
      "Usage-based lead scoring and sales routing",
    ],
    assessmentStems: [
      {
        questionTemplate: "What is your {{niche}} product's trial-to-paid conversion rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 25%", scoreImpact: 10 },
          { label: "15-25%", scoreImpact: 20 },
          { label: "5-15%", scoreImpact: 35 },
          { label: "Under 5%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} company handle user onboarding?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated in-app with milestones", scoreImpact: 10 },
          { label: "Email drip sequence", scoreImpact: 25 },
          { label: "Manual onboarding calls", scoreImpact: 40 },
          { label: "No structured onboarding", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you track product usage to identify at-risk {{niche}} accounts?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, automated health scores", scoreImpact: 10 },
          { label: "Basic usage dashboards", scoreImpact: 25 },
          { label: "Manual check-ins only", scoreImpact: 40 },
          { label: "No usage tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many monthly active users does your {{niche}} product have?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 500", scoreImpact: 15 },
          { label: "500-5,000", scoreImpact: 25 },
          { label: "5,000-50,000", scoreImpact: 40 },
          { label: "Over 50,000", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What is your {{niche}} company's monthly churn rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 2%", scoreImpact: 10 },
          { label: "2-5%", scoreImpact: 25 },
          { label: "5-10%", scoreImpact: 40 },
          { label: "Over 10%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} product's self-service support capabilities",
        type: "scale",
        optionTemplates: [
          { label: "1 - No self-service", scoreImpact: 50 },
          { label: "2 - Basic FAQ page", scoreImpact: 40 },
          { label: "3 - Knowledge base", scoreImpact: 25 },
          { label: "4 - In-app help and chatbot", scoreImpact: 15 },
          { label: "5 - Full self-service with AI support", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "User acquisition and activation", scoreImpact: 50 },
          { label: "Trial conversion and monetization", scoreImpact: 45 },
          { label: "Retention and reducing churn", scoreImpact: 40 },
          { label: "Expansion and upsell revenue", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} companies that automate onboarding convert 2x more trial users",
        subheadline: "See how leading {{niche}} products turn signups into paying customers without manual hand-holding.",
        ctaText: "Get Your Growth Assessment",
        socialProof: "Used by 100+ {{niche}} companies to optimize their growth engine",
      },
      warm: {
        headline: "Looking to grow your {{niche}} product? Start with this diagnostic.",
        subheadline: "A quick assessment reveals the biggest leaks in your conversion funnel.",
        ctaText: "Run the Diagnostic",
        socialProof: "Average 30% improvement in trial conversion within 90 days",
      },
      hot: {
        headline: "Let us architect your {{niche}} growth system this week",
        subheadline: "Book a strategy session and get a blueprint for automated user activation and conversion.",
        ctaText: "Book Your Strategy Session",
        socialProof: "90% of {{niche}} teams that book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} growth engine is staged. Let us deploy it.",
        subheadline: "Your onboarding and conversion sequences are ready. Pick a launch date.",
        ctaText: "Deploy Now",
        socialProof: "Average 45% reduction in time-to-value after deployment",
      },
    },
    funnelPreferences: ["lead-magnet", "webinar", "qualification", "continuity"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.20,
      engagementWeight: 0.30,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} growth audit results are inside",
      "Why 80% of {{niche}} trial users never activate",
      "How [Company] cut churn 40% with automated onboarding",
      "3 product-led growth plays for {{niche}} companies",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} growth report expires soon",
      "The playbook top {{niche}} products use to scale",
    ],
  },

  construction: {
    painPoints: [
      "Slow bid responses cost {{niche}} contractors the most profitable projects",
      "{{niche}} project delays from poor subcontractor coordination eat into margins",
      "Change order tracking in {{niche}} projects is manual, causing disputes and revenue leakage",
      "{{niche}} companies lose repeat business because they do not follow up after project completion",
      "Safety compliance documentation for {{niche}} projects is scattered and audit-risky",
      "{{niche}} estimators spend days on proposals that could be templatized and accelerated",
      "Crew scheduling conflicts cause {{niche}} project overruns and unhappy clients",
    ],
    urgencySignals: [
      "permit deadline",
      "weather window closing",
      "project start date",
      "inspection scheduled",
      "bonding renewal",
      "material price increase",
      "subcontractor availability",
      "safety incident",
    ],
    offers: [
      "Automated bid follow-up and proposal tracking",
      "Project milestone and change order management system",
      "Crew scheduling and dispatch automation",
      "Safety compliance and documentation platform",
      "Post-project review and referral engine",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} company respond to bid requests?",
        type: "single-choice",
        optionTemplates: [
          { label: "Within 24 hours", scoreImpact: 10 },
          { label: "2-3 days", scoreImpact: 25 },
          { label: "4-7 days", scoreImpact: 40 },
          { label: "Over a week", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many active {{niche}} projects does your company manage simultaneously?",
        type: "single-choice",
        optionTemplates: [
          { label: "1-3", scoreImpact: 15 },
          { label: "4-10", scoreImpact: 25 },
          { label: "11-25", scoreImpact: 40 },
          { label: "More than 25", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} company track change orders?",
        type: "single-choice",
        optionTemplates: [
          { label: "Project management software", scoreImpact: 10 },
          { label: "Spreadsheets", scoreImpact: 30 },
          { label: "Paper or email", scoreImpact: 45 },
          { label: "No formal tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many crew members does your {{niche}} company employ?",
        type: "single-choice",
        optionTemplates: [
          { label: "1-5", scoreImpact: 15 },
          { label: "6-20", scoreImpact: 25 },
          { label: "21-50", scoreImpact: 40 },
          { label: "Over 50", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you have a system to follow up with past {{niche}} clients for repeat work?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated campaigns", scoreImpact: 10 },
          { label: "Occasional manual outreach", scoreImpact: 30 },
          { label: "Only when they call us", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} company's safety documentation process",
        type: "scale",
        optionTemplates: [
          { label: "1 - Mostly paper-based", scoreImpact: 50 },
          { label: "2 - Spreadsheets and forms", scoreImpact: 40 },
          { label: "3 - Digital but manual entry", scoreImpact: 25 },
          { label: "4 - Automated with alerts", scoreImpact: 15 },
          { label: "5 - Fully integrated compliance platform", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is the biggest operational challenge in your {{niche}} business?",
        type: "single-choice",
        optionTemplates: [
          { label: "Winning more bids", scoreImpact: 50 },
          { label: "Project scheduling and delays", scoreImpact: 45 },
          { label: "Subcontractor coordination", scoreImpact: 40 },
          { label: "Cash flow and change orders", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} contractors who automate bid follow-up win 35% more projects",
        subheadline: "See how {{niche}} companies streamline operations from bid to project closeout.",
        ctaText: "Get Your Operations Assessment",
        socialProof: "Trusted by 100+ {{niche}} contractors and builders",
      },
      warm: {
        headline: "Looking to win more {{niche}} projects? This diagnostic shows you how.",
        subheadline: "Find out where your bid-to-build process is leaving money on the table.",
        ctaText: "Take the Operations Assessment",
        socialProof: "Contractors report 25% faster project turnaround after implementation",
      },
      hot: {
        headline: "Let us build your {{niche}} project automation system this week",
        subheadline: "Book a strategy session and get a plan to streamline bids, scheduling, and communication.",
        ctaText: "Book Your Strategy Session",
        socialProof: "94% of {{niche}} contractors who book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} operations system is ready. Let us deploy it.",
        subheadline: "Everything is configured for your business. Pick your launch date.",
        ctaText: "Deploy Now",
        socialProof: "Average 30% reduction in project admin time after deployment",
      },
    },
    funnelPreferences: ["qualification", "chat", "checkout", "retention"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.30,
      engagementWeight: 0.15,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} operations report is ready",
      "Why the fastest {{niche}} contractors always win the bid",
      "How [Company] eliminated scheduling conflicts across 15 crews",
      "3 automations every {{niche}} business needs today",
      "Your strategy session slot is reserved",
      "Last chance: your {{niche}} operations assessment expires tomorrow",
      "What top {{niche}} contractors do that average ones do not",
    ],
  },

  "real-estate": {
    painPoints: [
      "{{niche}} agents lose deals because they respond to inquiries too slowly",
      "Manual listing management wastes hours that {{niche}} professionals could spend closing",
      "{{niche}} teams have no system to nurture leads who are not ready to buy or sell today",
      "Poor CRM adoption means {{niche}} agents lose track of their pipeline",
      "{{niche}} brokerages struggle to attribute closings to specific marketing channels",
      "Open house follow-up in {{niche}} is inconsistent and most contacts go cold",
      "{{niche}} agents spend too much time on paperwork instead of relationship building",
    ],
    urgencySignals: [
      "interest rate change",
      "inventory shortage",
      "listing expiring",
      "relocation deadline",
      "market shift",
      "new construction phase",
      "contract deadline",
      "inspection contingency",
    ],
    offers: [
      "Automated lead follow-up and nurture system for {{niche}} agents",
      "Listing marketing and syndication automation",
      "Open house capture and follow-up sequences",
      "Market report and home valuation lead magnets",
      "Transaction coordination and closing automation",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} team respond to new property inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 5 minutes", scoreImpact: 10 },
          { label: "Within 1 hour", scoreImpact: 20 },
          { label: "Same day", scoreImpact: 35 },
          { label: "Next day or longer", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many active leads is your {{niche}} team managing?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 50", scoreImpact: 15 },
          { label: "50-200", scoreImpact: 25 },
          { label: "200-500", scoreImpact: 40 },
          { label: "Over 500", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you have automated drip campaigns for {{niche}} leads not ready to transact?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, segmented by timeline", scoreImpact: 10 },
          { label: "Yes, one generic sequence", scoreImpact: 25 },
          { label: "Manual follow-up only", scoreImpact: 40 },
          { label: "No long-term nurture", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} team capture open house leads?",
        type: "single-choice",
        optionTemplates: [
          { label: "Digital sign-in with auto follow-up", scoreImpact: 10 },
          { label: "Digital sign-in, manual follow-up", scoreImpact: 25 },
          { label: "Paper sign-in sheet", scoreImpact: 40 },
          { label: "No structured capture", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What is your {{niche}} lead-to-close conversion rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 5%", scoreImpact: 10 },
          { label: "2-5%", scoreImpact: 25 },
          { label: "1-2%", scoreImpact: 40 },
          { label: "Under 1%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} team's marketing attribution",
        type: "scale",
        optionTemplates: [
          { label: "1 - No tracking", scoreImpact: 50 },
          { label: "2 - Basic source tracking", scoreImpact: 40 },
          { label: "3 - Multi-touch attribution", scoreImpact: 25 },
          { label: "4 - Full ROI by channel", scoreImpact: 15 },
          { label: "5 - Predictive analytics", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Not enough quality leads", scoreImpact: 50 },
          { label: "Slow response and follow-up", scoreImpact: 45 },
          { label: "Poor conversion rates", scoreImpact: 40 },
          { label: "Agent retention and productivity", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} teams that respond in under 5 minutes close 4x more deals",
        subheadline: "Discover how top {{niche}} professionals automate follow-up and never lose a lead.",
        ctaText: "Get Your Lead Response Assessment",
        socialProof: "Used by 250+ {{niche}} agents and teams",
      },
      warm: {
        headline: "You are looking for an edge in {{niche}}. Here is where to start.",
        subheadline: "A quick diagnostic reveals the biggest gaps in your lead conversion process.",
        ctaText: "Take the Assessment",
        socialProof: "Agents report 50% more showings within 30 days",
      },
      hot: {
        headline: "Let us build your {{niche}} lead engine this week",
        subheadline: "Book a strategy session and get a plan to automate your entire lead-to-close pipeline.",
        ctaText: "Book Your Strategy Session",
        socialProof: "95% of {{niche}} professionals who book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} lead system is ready. Let us activate it.",
        subheadline: "Everything is configured for your market. Pick a start date.",
        ctaText: "Activate Now",
        socialProof: "Average 3x increase in lead-to-showing rate within 60 days",
      },
    },
    funnelPreferences: ["lead-magnet", "chat", "qualification", "retention"],
    scoringBias: {
      intentWeight: 0.35,
      fitWeight: 0.20,
      engagementWeight: 0.20,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} lead conversion report is inside",
      "The 5-minute rule that top {{niche}} agents swear by",
      "How [Agent] closed 12 more deals in 6 months with automation",
      "3 follow-up sequences every {{niche}} team should run",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} assessment results expire tomorrow",
      "What top-producing {{niche}} teams do differently",
    ],
  },

  education: {
    painPoints: [
      "{{niche}} institutions lose prospective students because enrollment follow-up is too slow",
      "Manual admissions processing at {{niche}} programs creates bottlenecks during peak season",
      "{{niche}} providers struggle to demonstrate outcomes and ROI to prospective students",
      "Student engagement drops in {{niche}} programs that lack automated touchpoints",
      "{{niche}} organizations have no system to turn alumni into referral sources",
      "Course completion rates in {{niche}} programs suffer from poor onboarding and check-ins",
    ],
    urgencySignals: [
      "enrollment deadline",
      "semester start",
      "accreditation review",
      "financial aid deadline",
      "waitlist opening",
      "early bird pricing",
      "cohort filling up",
      "program launch",
    ],
    offers: [
      "Automated enrollment nurture and admissions pipeline",
      "Student onboarding and engagement sequence builder",
      "Alumni engagement and referral campaigns",
      "Course completion tracking and intervention system",
      "Outcome reporting and testimonial collection",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} program respond to enrollment inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Within 1 hour", scoreImpact: 10 },
          { label: "Same day", scoreImpact: 25 },
          { label: "Next business day", scoreImpact: 40 },
          { label: "2+ days", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many enrollment leads does your {{niche}} program receive per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 25", scoreImpact: 15 },
          { label: "25-100", scoreImpact: 25 },
          { label: "100-500", scoreImpact: 40 },
          { label: "Over 500", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} program have an automated admissions nurture sequence?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, fully automated", scoreImpact: 10 },
          { label: "Partially automated", scoreImpact: 25 },
          { label: "Manual outreach only", scoreImpact: 40 },
          { label: "No structured follow-up", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What is your {{niche}} program's inquiry-to-enrollment conversion rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 20%", scoreImpact: 10 },
          { label: "10-20%", scoreImpact: 25 },
          { label: "5-10%", scoreImpact: 40 },
          { label: "Under 5%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} program track student progress and completion?",
        type: "single-choice",
        optionTemplates: [
          { label: "LMS with automated milestones", scoreImpact: 10 },
          { label: "Manual grade tracking", scoreImpact: 30 },
          { label: "Spreadsheets", scoreImpact: 45 },
          { label: "No formal tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} program's alumni engagement",
        type: "scale",
        optionTemplates: [
          { label: "1 - No alumni program", scoreImpact: 50 },
          { label: "2 - Annual newsletter only", scoreImpact: 40 },
          { label: "3 - Regular communication", scoreImpact: 25 },
          { label: "4 - Active referral program", scoreImpact: 15 },
          { label: "5 - Thriving alumni community", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest enrollment challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Not enough qualified inquiries", scoreImpact: 50 },
          { label: "Slow admissions process", scoreImpact: 45 },
          { label: "High drop-off before enrollment", scoreImpact: 40 },
          { label: "Low completion and retention", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} programs that automate admissions enroll 40% more students",
        subheadline: "See how leading {{niche}} institutions streamline the inquiry-to-enrollment journey.",
        ctaText: "Get Your Enrollment Assessment",
        socialProof: "Trusted by 75+ {{niche}} programs and institutions",
      },
      warm: {
        headline: "Looking to fill your {{niche}} program? This diagnostic shows you how.",
        subheadline: "Discover the gaps in your enrollment pipeline and how to close them fast.",
        ctaText: "Take the Enrollment Assessment",
        socialProof: "Programs see 30% higher enrollment within one admissions cycle",
      },
      hot: {
        headline: "Let us build your {{niche}} enrollment engine this week",
        subheadline: "Book a session and get a plan to automate your admissions pipeline end to end.",
        ctaText: "Book Your Strategy Session",
        socialProof: "90% of {{niche}} programs that book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} enrollment system is configured. Let us launch it.",
        subheadline: "Everything is ready for your next admissions cycle. Choose your start date.",
        ctaText: "Launch Now",
        socialProof: "Average 35% improvement in inquiry-to-enrollment rate after launch",
      },
    },
    funnelPreferences: ["lead-magnet", "webinar", "authority", "retention"],
    scoringBias: {
      intentWeight: 0.25,
      fitWeight: 0.25,
      engagementWeight: 0.30,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} enrollment growth report is inside",
      "Why top {{niche}} programs never lose a prospective student",
      "How [Institution] boosted enrollment 35% with automation",
      "3 admissions automations every {{niche}} program needs",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} enrollment report expires soon",
      "What high-enrollment {{niche}} programs do differently",
    ],
  },

  finance: {
    painPoints: [
      "{{niche}} firms lose prospects because compliance-heavy onboarding takes weeks",
      "Manual KYC and document collection slow {{niche}} client acquisition",
      "{{niche}} advisors spend more time on paperwork than on client relationships",
      "No automated follow-up means {{niche}} prospects go to competitors who respond faster",
      "{{niche}} firms struggle to demonstrate value to clients between review meetings",
      "Regulatory compliance tracking is fragmented and audit-risky for {{niche}} practices",
    ],
    urgencySignals: [
      "tax deadline",
      "regulatory change",
      "audit notification",
      "market volatility",
      "client review season",
      "license renewal",
      "compliance deadline",
      "fiscal year end",
    ],
    offers: [
      "Automated client onboarding and KYC workflow",
      "Compliance tracking and audit preparation system",
      "Client review scheduling and preparation automation",
      "Prospect nurture and financial planning lead magnets",
      "Referral program and client appreciation engine",
    ],
    assessmentStems: [
      {
        questionTemplate: "How long does your {{niche}} firm take to onboard a new client?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 1 week", scoreImpact: 10 },
          { label: "1-2 weeks", scoreImpact: 25 },
          { label: "2-4 weeks", scoreImpact: 40 },
          { label: "Over 4 weeks", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many prospective {{niche}} clients does your firm engage per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 10", scoreImpact: 15 },
          { label: "10-30", scoreImpact: 25 },
          { label: "31-75", scoreImpact: 40 },
          { label: "Over 75", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} firm use automated compliance workflows?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, fully automated", scoreImpact: 10 },
          { label: "Partially automated", scoreImpact: 25 },
          { label: "Checklist-based, manual", scoreImpact: 40 },
          { label: "No formal compliance process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} practice maintain ongoing client engagement?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated touchpoints and reviews", scoreImpact: 10 },
          { label: "Quarterly manual outreach", scoreImpact: 25 },
          { label: "Annual review meetings only", scoreImpact: 40 },
          { label: "Client-initiated contact only", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What percentage of new {{niche}} clients come from referrals?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 50%", scoreImpact: 10 },
          { label: "25-50%", scoreImpact: 20 },
          { label: "10-25%", scoreImpact: 35 },
          { label: "Under 10%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} firm's digital client experience",
        type: "scale",
        optionTemplates: [
          { label: "1 - Paper and in-person only", scoreImpact: 50 },
          { label: "2 - Email and phone", scoreImpact: 40 },
          { label: "3 - Basic portal", scoreImpact: 25 },
          { label: "4 - Interactive portal with reporting", scoreImpact: 15 },
          { label: "5 - Full digital experience with automation", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest operational challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Client acquisition and conversion", scoreImpact: 50 },
          { label: "Onboarding and compliance", scoreImpact: 45 },
          { label: "Client retention and engagement", scoreImpact: 40 },
          { label: "Operational efficiency and scalability", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} firms that automate onboarding grow AUM 30% faster",
        subheadline: "See how leading {{niche}} practices eliminate compliance bottlenecks and win more clients.",
        ctaText: "Get Your Practice Assessment",
        socialProof: "Trusted by 120+ {{niche}} firms and advisory practices",
      },
      warm: {
        headline: "Looking to streamline your {{niche}} practice? Start with this diagnostic.",
        subheadline: "A quick assessment reveals your biggest operational opportunities.",
        ctaText: "Take the Practice Assessment",
        socialProof: "Firms report 40% faster onboarding within 60 days",
      },
      hot: {
        headline: "Let us build your {{niche}} client automation system this week",
        subheadline: "Book a strategy session and get a plan tailored to your {{niche}} practice.",
        ctaText: "Book Your Strategy Session",
        socialProof: "93% of {{niche}} firms that book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} automation platform is ready. Let us go live.",
        subheadline: "Everything is configured. Pick your launch date.",
        ctaText: "Go Live",
        socialProof: "Average 45% reduction in onboarding time after launch",
      },
    },
    funnelPreferences: ["authority", "qualification", "webinar", "continuity"],
    scoringBias: {
      intentWeight: 0.25,
      fitWeight: 0.30,
      engagementWeight: 0.20,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} practice efficiency report is inside",
      "Why compliant {{niche}} firms grow faster",
      "How [Firm] onboards clients 60% faster with automation",
      "3 compliance risks hiding in your {{niche}} workflow",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} assessment expires tomorrow",
      "What elite {{niche}} practices do that average ones do not",
    ],
  },

  franchise: {
    painPoints: [
      "{{niche}} franchise owners struggle to maintain brand consistency across locations",
      "Franchisee lead follow-up varies wildly across {{niche}} units, costing system-wide revenue",
      "{{niche}} franchisor HQ has no visibility into individual location marketing performance",
      "Onboarding new {{niche}} franchisees takes months and lacks automation",
      "{{niche}} franchise systems lose candidates because discovery day follow-up is manual",
      "Local marketing compliance is hard to enforce across {{niche}} franchise territories",
    ],
    urgencySignals: [
      "franchise disclosure deadline",
      "territory opening",
      "grand opening",
      "franchise renewal",
      "compliance audit",
      "expansion target",
      "competitor franchise",
      "multi-unit deal",
    ],
    offers: [
      "Franchise discovery and candidate nurture automation",
      "Multi-location marketing compliance and brand toolkit",
      "Franchisee onboarding and training automation",
      "Centralized lead routing and performance dashboards",
      "Local marketing campaign templates for franchise locations",
    ],
    assessmentStems: [
      {
        questionTemplate: "How many {{niche}} franchise locations do you operate or plan to open?",
        type: "single-choice",
        optionTemplates: [
          { label: "1-5 locations", scoreImpact: 15 },
          { label: "6-20 locations", scoreImpact: 25 },
          { label: "21-50 locations", scoreImpact: 40 },
          { label: "Over 50 locations", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} franchise handle lead distribution to locations?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated routing by territory", scoreImpact: 10 },
          { label: "Manual assignment by HQ", scoreImpact: 30 },
          { label: "Each location manages their own", scoreImpact: 40 },
          { label: "No structured process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} franchise have standardized marketing templates?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, with compliance controls", scoreImpact: 10 },
          { label: "Brand guidelines only", scoreImpact: 25 },
          { label: "Informal guidance", scoreImpact: 40 },
          { label: "No standards", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How long does it take to onboard a new {{niche}} franchisee?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 30 days", scoreImpact: 10 },
          { label: "30-60 days", scoreImpact: 25 },
          { label: "60-90 days", scoreImpact: 40 },
          { label: "Over 90 days", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How do you track performance across {{niche}} franchise locations?",
        type: "single-choice",
        optionTemplates: [
          { label: "Real-time dashboard with KPIs", scoreImpact: 10 },
          { label: "Monthly reports from locations", scoreImpact: 25 },
          { label: "Quarterly reviews", scoreImpact: 40 },
          { label: "No standardized tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} franchise's technology consistency across locations",
        type: "scale",
        optionTemplates: [
          { label: "1 - Every location uses different tools", scoreImpact: 50 },
          { label: "2 - Some shared systems", scoreImpact: 40 },
          { label: "3 - Core systems shared, peripherals vary", scoreImpact: 25 },
          { label: "4 - Mostly unified stack", scoreImpact: 15 },
          { label: "5 - Fully integrated platform", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest challenge in {{niche}} franchise operations?",
        type: "single-choice",
        optionTemplates: [
          { label: "Franchise candidate recruitment", scoreImpact: 50 },
          { label: "Brand consistency and compliance", scoreImpact: 45 },
          { label: "Franchisee performance and support", scoreImpact: 40 },
          { label: "Technology and systems unification", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} franchise systems that centralize lead management grow 2x faster",
        subheadline: "See how multi-location {{niche}} brands automate from HQ to every franchisee.",
        ctaText: "Get Your Franchise Assessment",
        socialProof: "Used by 50+ {{niche}} franchise systems",
      },
      warm: {
        headline: "Scaling your {{niche}} franchise? This diagnostic finds your biggest bottleneck.",
        subheadline: "Identify the gaps in your franchise operations and marketing infrastructure.",
        ctaText: "Take the Franchise Assessment",
        socialProof: "Franchise systems report 35% faster franchisee ramp-up",
      },
      hot: {
        headline: "Let us build your {{niche}} franchise automation platform this week",
        subheadline: "Book a strategy session and get a plan to unify marketing and operations across all locations.",
        ctaText: "Book Your Strategy Session",
        socialProof: "92% of {{niche}} franchisors who book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} franchise platform is ready. Let us roll it out.",
        subheadline: "Everything is configured. Choose your rollout schedule.",
        ctaText: "Start Rollout",
        socialProof: "Average 40% improvement in location-level lead conversion",
      },
    },
    funnelPreferences: ["qualification", "authority", "webinar", "checkout"],
    scoringBias: {
      intentWeight: 0.25,
      fitWeight: 0.35,
      engagementWeight: 0.20,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} franchise growth report is inside",
      "The #1 mistake {{niche}} franchise systems make with leads",
      "How [Brand] unified marketing across 30 locations",
      "3 franchise automations that pay for themselves in 30 days",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} franchise assessment expires tomorrow",
      "What top-performing {{niche}} franchise systems do differently",
    ],
  },

  staffing: {
    painPoints: [
      "{{niche}} agencies lose placements because candidate response time is too slow",
      "Manual candidate matching wastes hours that {{niche}} recruiters could spend on client relationships",
      "{{niche}} firms have no system to re-engage past candidates for new openings",
      "Job order follow-up at {{niche}} agencies is inconsistent and deals fall through",
      "{{niche}} firms struggle to track candidate pipeline and placement metrics accurately",
      "Client retention at {{niche}} agencies suffers from lack of proactive communication",
    ],
    urgencySignals: [
      "urgent hire",
      "backfill needed",
      "contract starting",
      "seasonal ramp",
      "client deadline",
      "candidate competing offer",
      "layoff redeployment",
      "expansion hiring",
    ],
    offers: [
      "Automated candidate sourcing and screening pipeline",
      "Job order tracking and client communication automation",
      "Candidate reactivation and talent pool nurture campaigns",
      "Placement tracking and billing automation",
      "Client satisfaction and retention program",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} agency respond to new job orders?",
        type: "single-choice",
        optionTemplates: [
          { label: "Within 2 hours", scoreImpact: 10 },
          { label: "Same business day", scoreImpact: 25 },
          { label: "Next business day", scoreImpact: 40 },
          { label: "2+ days", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many open positions does your {{niche}} agency manage at once?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 20", scoreImpact: 15 },
          { label: "20-50", scoreImpact: 25 },
          { label: "51-150", scoreImpact: 40 },
          { label: "Over 150", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} agency have automated candidate screening?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, AI-powered matching", scoreImpact: 10 },
          { label: "Keyword-based filtering", scoreImpact: 25 },
          { label: "Manual resume review", scoreImpact: 40 },
          { label: "No structured screening", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} agency re-engage past candidates?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated campaigns by skill set", scoreImpact: 10 },
          { label: "Occasional email blasts", scoreImpact: 30 },
          { label: "Only when actively searching", scoreImpact: 45 },
          { label: "We do not re-engage", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What is your {{niche}} agency's fill rate?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 80%", scoreImpact: 10 },
          { label: "60-80%", scoreImpact: 20 },
          { label: "40-60%", scoreImpact: 35 },
          { label: "Under 40%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} agency's client communication process",
        type: "scale",
        optionTemplates: [
          { label: "1 - Reactive only", scoreImpact: 50 },
          { label: "2 - Weekly manual updates", scoreImpact: 40 },
          { label: "3 - Structured check-ins", scoreImpact: 25 },
          { label: "4 - Proactive with some automation", scoreImpact: 15 },
          { label: "5 - Fully automated status updates", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Finding qualified candidates", scoreImpact: 50 },
          { label: "Winning new client accounts", scoreImpact: 45 },
          { label: "Filling orders faster", scoreImpact: 40 },
          { label: "Retaining clients and candidates", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} agencies that automate sourcing fill 40% more positions",
        subheadline: "See how top {{niche}} firms streamline from job order to placement without manual bottlenecks.",
        ctaText: "Get Your Agency Assessment",
        socialProof: "Used by 80+ {{niche}} agencies to accelerate placements",
      },
      warm: {
        headline: "Looking to fill more {{niche}} positions faster? Start here.",
        subheadline: "A quick diagnostic reveals the biggest gaps in your recruitment pipeline.",
        ctaText: "Take the Agency Assessment",
        socialProof: "Agencies report 30% faster time-to-fill within 60 days",
      },
      hot: {
        headline: "Let us build your {{niche}} recruitment automation this week",
        subheadline: "Book a strategy session and get a plan to automate your sourcing-to-placement pipeline.",
        ctaText: "Book Your Strategy Session",
        socialProof: "91% of {{niche}} agencies that book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} recruitment engine is ready. Let us turn it on.",
        subheadline: "Everything is configured. Pick your launch date.",
        ctaText: "Launch Now",
        socialProof: "Average 35% improvement in fill rate within 90 days",
      },
    },
    funnelPreferences: ["qualification", "chat", "lead-magnet", "retention"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.25,
      engagementWeight: 0.20,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} agency performance report is inside",
      "Why the fastest {{niche}} agencies always win the placement",
      "How [Agency] doubled fill rate with automated sourcing",
      "3 recruitment automations every {{niche}} agency needs",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} assessment expires tomorrow",
      "What top {{niche}} agencies do that average ones do not",
    ],
  },

  faith: {
    painPoints: [
      "{{niche}} organizations lose first-time visitors because follow-up is inconsistent",
      "Volunteer coordination at {{niche}} communities is manual and error-prone",
      "{{niche}} leaders spend too much time on admin instead of ministry and community building",
      "Donation and giving campaigns at {{niche}} organizations lack automation and tracking",
      "{{niche}} communities struggle to engage members between weekly gatherings",
      "Event registration and attendance tracking at {{niche}} organizations is fragmented",
    ],
    urgencySignals: [
      "seasonal campaign",
      "capital campaign",
      "volunteer shortage",
      "membership decline",
      "facility expansion",
      "leadership transition",
      "community crisis",
      "annual giving season",
    ],
    offers: [
      "First-time visitor follow-up and connection automation",
      "Volunteer scheduling and communication platform",
      "Giving campaign automation and donor engagement",
      "Event registration and attendance management",
      "Community engagement and small group coordination",
    ],
    assessmentStems: [
      {
        questionTemplate: "How does your {{niche}} organization follow up with first-time visitors?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated welcome sequence", scoreImpact: 10 },
          { label: "Manual outreach within a week", scoreImpact: 25 },
          { label: "Occasional follow-up", scoreImpact: 40 },
          { label: "No structured follow-up", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many active members does your {{niche}} community serve?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 100", scoreImpact: 15 },
          { label: "100-500", scoreImpact: 25 },
          { label: "500-2,000", scoreImpact: 40 },
          { label: "Over 2,000", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} organization manage volunteer scheduling?",
        type: "single-choice",
        optionTemplates: [
          { label: "Automated scheduling platform", scoreImpact: 10 },
          { label: "Sign-up sheets and reminders", scoreImpact: 25 },
          { label: "Email or phone coordination", scoreImpact: 40 },
          { label: "Ad hoc and informal", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Does your {{niche}} organization have automated giving and donation tracking?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, with recurring giving and reporting", scoreImpact: 10 },
          { label: "Online giving, manual reporting", scoreImpact: 25 },
          { label: "Cash and check only", scoreImpact: 45 },
          { label: "No structured giving system", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How do you engage {{niche}} community members between gatherings?",
        type: "single-choice",
        optionTemplates: [
          { label: "App, email, and small groups", scoreImpact: 10 },
          { label: "Email newsletter", scoreImpact: 25 },
          { label: "Social media only", scoreImpact: 40 },
          { label: "No mid-week engagement", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} organization's digital communication",
        type: "scale",
        optionTemplates: [
          { label: "1 - Bulletin board and announcements only", scoreImpact: 50 },
          { label: "2 - Email and social media", scoreImpact: 40 },
          { label: "3 - Website with event calendar", scoreImpact: 25 },
          { label: "4 - App and automated communications", scoreImpact: 15 },
          { label: "5 - Fully integrated engagement platform", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Attracting and retaining new members", scoreImpact: 50 },
          { label: "Volunteer recruitment and coordination", scoreImpact: 45 },
          { label: "Giving and financial sustainability", scoreImpact: 40 },
          { label: "Member engagement and community building", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} communities that automate follow-up retain 60% more visitors",
        subheadline: "See how growing {{niche}} organizations turn first-time guests into engaged members.",
        ctaText: "Get Your Community Assessment",
        socialProof: "Used by 100+ {{niche}} communities and organizations",
      },
      warm: {
        headline: "Looking to grow your {{niche}} community? Start with this diagnostic.",
        subheadline: "A quick assessment reveals your biggest opportunities for engagement and growth.",
        ctaText: "Take the Community Assessment",
        socialProof: "Communities see 30% higher visitor retention within 90 days",
      },
      hot: {
        headline: "Let us build your {{niche}} engagement system this week",
        subheadline: "Book a strategy session and get a plan to automate follow-up, volunteering, and giving.",
        ctaText: "Book Your Strategy Session",
        socialProof: "89% of {{niche}} leaders who book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} engagement platform is ready. Let us activate it.",
        subheadline: "Everything is configured. Choose your launch date.",
        ctaText: "Activate Now",
        socialProof: "Average 40% increase in member engagement after activation",
      },
    },
    funnelPreferences: ["lead-magnet", "chat", "retention", "referral"],
    scoringBias: {
      intentWeight: 0.20,
      fitWeight: 0.20,
      engagementWeight: 0.35,
      urgencyWeight: 0.25,
    },
    nurtureSubjects: [
      "Your {{niche}} community growth report is inside",
      "Why growing {{niche}} communities never miss a visitor follow-up",
      "How [Organization] doubled visitor retention with automation",
      "3 engagement automations every {{niche}} community needs",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} assessment expires soon",
      "What thriving {{niche}} communities do differently",
    ],
  },

  creative: {
    painPoints: [
      "{{niche}} professionals lose projects because proposals take too long to send",
      "{{niche}} freelancers and agencies have feast-or-famine revenue cycles",
      "No automated follow-up means {{niche}} prospects ghost after the initial inquiry",
      "{{niche}} businesses spend more time on client management than on creative work",
      "Portfolio presentation and case study delivery is manual for {{niche}} professionals",
      "{{niche}} agencies struggle to upsell existing clients into additional services",
    ],
    urgencySignals: [
      "campaign deadline",
      "product launch",
      "event date",
      "budget expiring",
      "rebrand timeline",
      "seasonal campaign",
      "competitor creative",
      "pitch deadline",
    ],
    offers: [
      "Automated proposal and contract workflow",
      "Client onboarding and creative brief automation",
      "Portfolio showcase and case study delivery system",
      "Project milestone tracking and client communication",
      "Upsell and retainer nurture campaigns",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} business send proposals after inquiry?",
        type: "single-choice",
        optionTemplates: [
          { label: "Within 24 hours", scoreImpact: 10 },
          { label: "2-3 days", scoreImpact: 25 },
          { label: "4-7 days", scoreImpact: 40 },
          { label: "Over a week", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many {{niche}} projects does your business handle per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "1-3", scoreImpact: 15 },
          { label: "4-10", scoreImpact: 25 },
          { label: "11-25", scoreImpact: 40 },
          { label: "Over 25", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you have automated follow-up for {{niche}} inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, full nurture sequence", scoreImpact: 10 },
          { label: "Automated first response only", scoreImpact: 25 },
          { label: "Manual follow-up", scoreImpact: 40 },
          { label: "No follow-up process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What percentage of your {{niche}} revenue comes from repeat clients?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 50%", scoreImpact: 10 },
          { label: "25-50%", scoreImpact: 20 },
          { label: "10-25%", scoreImpact: 35 },
          { label: "Under 10%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} business showcase work to prospects?",
        type: "single-choice",
        optionTemplates: [
          { label: "Interactive portfolio with case studies", scoreImpact: 10 },
          { label: "Static website gallery", scoreImpact: 25 },
          { label: "PDF portfolio sent on request", scoreImpact: 40 },
          { label: "No structured portfolio", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} client onboarding experience",
        type: "scale",
        optionTemplates: [
          { label: "1 - No structured onboarding", scoreImpact: 50 },
          { label: "2 - Basic email welcome", scoreImpact: 40 },
          { label: "3 - Questionnaire and kickoff call", scoreImpact: 25 },
          { label: "4 - Automated brief and timeline", scoreImpact: 15 },
          { label: "5 - Full portal with milestones", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest business challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Inconsistent lead flow", scoreImpact: 50 },
          { label: "Slow proposal and closing process", scoreImpact: 45 },
          { label: "Scope creep and project management", scoreImpact: 35 },
          { label: "Client retention and upselling", scoreImpact: 40 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "{{niche}} professionals who automate proposals close 50% faster",
        subheadline: "See how top {{niche}} businesses eliminate feast-or-famine cycles with automated lead nurture.",
        ctaText: "Get Your Business Assessment",
        socialProof: "Used by 150+ {{niche}} professionals and agencies",
      },
      warm: {
        headline: "Looking to stabilize your {{niche}} revenue? Start with this diagnostic.",
        subheadline: "Identify the biggest gaps in your inquiry-to-project pipeline.",
        ctaText: "Take the Assessment",
        socialProof: "Professionals report 40% more consistent pipeline within 60 days",
      },
      hot: {
        headline: "Let us build your {{niche}} client acquisition engine this week",
        subheadline: "Book a strategy session and get a plan to automate from inquiry to signed contract.",
        ctaText: "Book Your Strategy Session",
        socialProof: "90% of {{niche}} professionals who book move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} business automation is ready. Let us launch it.",
        subheadline: "Everything is configured. Pick your start date.",
        ctaText: "Launch Now",
        socialProof: "Average 35% increase in project bookings within 90 days",
      },
    },
    funnelPreferences: ["authority", "lead-magnet", "qualification", "continuity"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.20,
      engagementWeight: 0.30,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} business growth report is inside",
      "Why the best {{niche}} professionals never chase clients",
      "How [Studio] eliminated feast-or-famine cycles with automation",
      "3 client acquisition plays for {{niche}} businesses",
      "Your strategy session is reserved",
      "Final reminder: your {{niche}} assessment expires tomorrow",
      "What top-earning {{niche}} professionals do differently",
    ],
  },

  general: {
    painPoints: [
      "{{niche}} businesses lose revenue from slow lead follow-up",
      "Manual processes in {{niche}} operations waste hours of productive time every week",
      "No automated nurture means {{niche}} leads go cold before they are ready to buy",
      "{{niche}} businesses lack visibility into which marketing channels drive real revenue",
      "Customer retention in {{niche}} suffers from inconsistent post-sale communication",
      "{{niche}} teams are stretched thin managing tasks that should be automated",
    ],
    urgencySignals: [
      "budget deadline",
      "fiscal year end",
      "growth target",
      "competitive pressure",
      "team scaling",
      "market shift",
      "process breaking down",
      "leadership mandate",
    ],
    offers: [
      "Done-for-you lead capture and follow-up automation",
      "Customer journey mapping and automation blueprint",
      "Revenue attribution and marketing ROI dashboard",
      "Client retention and upsell campaigns",
      "Operational workflow automation audit",
    ],
    assessmentStems: [
      {
        questionTemplate: "How quickly does your {{niche}} business respond to new inquiries?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 5 minutes", scoreImpact: 10 },
          { label: "Within 1 hour", scoreImpact: 20 },
          { label: "Same day", scoreImpact: 35 },
          { label: "Next day or longer", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How many leads does your {{niche}} business generate per month?",
        type: "single-choice",
        optionTemplates: [
          { label: "Under 20", scoreImpact: 15 },
          { label: "20-50", scoreImpact: 25 },
          { label: "51-200", scoreImpact: 40 },
          { label: "Over 200", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Do you have automated follow-up sequences for {{niche}} leads?",
        type: "single-choice",
        optionTemplates: [
          { label: "Yes, fully automated", scoreImpact: 10 },
          { label: "Partially automated", scoreImpact: 25 },
          { label: "Manual only", scoreImpact: 40 },
          { label: "No follow-up process", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "How does your {{niche}} business track marketing performance?",
        type: "single-choice",
        optionTemplates: [
          { label: "Full attribution dashboard", scoreImpact: 10 },
          { label: "Basic analytics", scoreImpact: 25 },
          { label: "Spreadsheet tracking", scoreImpact: 40 },
          { label: "No tracking", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "What percentage of {{niche}} revenue comes from repeat customers?",
        type: "single-choice",
        optionTemplates: [
          { label: "Over 50%", scoreImpact: 10 },
          { label: "25-50%", scoreImpact: 20 },
          { label: "10-25%", scoreImpact: 35 },
          { label: "Under 10%", scoreImpact: 50 },
        ],
      },
      {
        questionTemplate: "Rate your {{niche}} business's automation maturity",
        type: "scale",
        optionTemplates: [
          { label: "1 - Everything is manual", scoreImpact: 50 },
          { label: "2 - A few automated emails", scoreImpact: 40 },
          { label: "3 - Core workflows automated", scoreImpact: 25 },
          { label: "4 - Most processes automated", scoreImpact: 15 },
          { label: "5 - Fully automated operations", scoreImpact: 5 },
        ],
      },
      {
        questionTemplate: "What is your biggest growth challenge in {{niche}}?",
        type: "single-choice",
        optionTemplates: [
          { label: "Lead generation and acquisition", scoreImpact: 50 },
          { label: "Lead conversion and sales", scoreImpact: 45 },
          { label: "Customer retention", scoreImpact: 40 },
          { label: "Operational efficiency", scoreImpact: 35 },
        ],
      },
    ],
    headlineTemplates: {
      cold: {
        headline: "Automate the busywork so your {{niche}} business can focus on growth",
        subheadline: "See how businesses like yours eliminate manual follow-up and capture more leads without hiring.",
        ctaText: "Get Your Free Assessment",
        socialProof: "Trusted by 500+ businesses to automate their growth pipeline",
      },
      warm: {
        headline: "You have been exploring your options. Here is the fastest path forward for {{niche}}.",
        subheadline: "Based on what you have looked at, we recommend starting with a focused diagnostic.",
        ctaText: "Take the 2-Minute Assessment",
        socialProof: "Most businesses see results within the first 30 days",
      },
      hot: {
        headline: "Ready to stop losing {{niche}} leads? Let us build your system this week.",
        subheadline: "Book a strategy session and walk away with a concrete plan tailored to your business.",
        ctaText: "Book Your Strategy Session",
        socialProof: "93% of strategy session attendees move forward within 2 weeks",
      },
      burning: {
        headline: "Your {{niche}} growth system is ready. Let us get you started today.",
        subheadline: "We have everything we need to begin. Pick a time that works for you.",
        ctaText: "Start Now",
        socialProof: "Avg. 47% increase in qualified leads within 60 days",
      },
    },
    funnelPreferences: ["lead-magnet", "qualification", "chat", "webinar"],
    scoringBias: {
      intentWeight: 0.30,
      fitWeight: 0.25,
      engagementWeight: 0.25,
      urgencyWeight: 0.20,
    },
    nurtureSubjects: [
      "Your {{niche}} growth roadmap is inside",
      "The #1 mistake most {{niche}} businesses make with leads",
      "How [Company] doubled conversions in 30 days with automation",
      "3 automations every {{niche}} business should be running",
      "We saved a spot for your strategy session",
      "Last chance: your {{niche}} assessment results expire soon",
      "What top-performing {{niche}} businesses do differently",
    ],
  },
};
