// Funnel Intelligence Engine — Server-side scoring, attribution, and funnel state

import { siteConfig } from "@/lib/site-config";

export interface VisitorProfile {
  visitorId: string;
  sessions: number;
  firstSeen: string;
  lastSeen: string;
  pagesViewed: string[];
  maxScrollDepth: Record<string, number>;
  totalTimeOnSite: number;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  events: FunnelEvent[];
  scores: BehavioralScores;
  funnelStage: FunnelStage;
  capturedEmail?: string;
  capturedPhone?: string;
  nicheInterest?: string;
  whatsappOptIn?: boolean;
  assessmentCompleted?: boolean;
  assessmentScore?: number;
  chatEngaged?: boolean;
  exitIntentShown?: boolean;
  roiCalculatorUsed?: boolean;
  referralSource?: string;
}

export interface FunnelEvent {
  type: string;
  page: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface BehavioralScores {
  engagement: number;   // 0-100: scroll depth, time, pages viewed
  intent: number;       // 0-100: pricing views, assessment completion, chat
  fit: number;          // 0-100: niche match, company signals
  urgency: number;      // 0-100: return visits, phone provided, speed
  composite: number;    // weighted average
}

export type FunnelStage =
  | "anonymous"       // No interaction yet
  | "engaged"         // Scrolled, spent time
  | "interested"      // Viewed pricing/services, used calculator
  | "qualifying"      // Started assessment or chat
  | "captured"        // Email provided
  | "nurturing"       // In nurture sequence
  | "hot"             // Score >= 80
  | "consulting"      // Booked or offered consultation
  | "converting"      // In conversion process
  | "client";         // Converted

export function computeBehavioralScores(profile: VisitorProfile): BehavioralScores {
  let engagement = 0;
  let intent = 0;
  let fit = 0;
  let urgency = 0;

  // Engagement: pages, scroll depth, time
  const pageCount = profile.pagesViewed.length;
  engagement += Math.min(pageCount * 8, 30);

  const avgScroll = Object.values(profile.maxScrollDepth).reduce((a, b) => a + b, 0)
    / Math.max(Object.keys(profile.maxScrollDepth).length, 1);
  engagement += Math.min(avgScroll * 0.3, 25);

  const minutes = profile.totalTimeOnSite / 60;
  engagement += Math.min(minutes * 5, 25);

  if (profile.chatEngaged) engagement += 15;
  if (profile.assessmentCompleted) engagement += 20;

  engagement = Math.min(engagement, 100);

  // Intent: high-value page views, actions taken
  const highIntentPages = ["/services", "/pricing", "/assess", "/calculator"];
  const viewedHighIntent = profile.pagesViewed.filter(p =>
    highIntentPages.some(hip => p.startsWith(hip))
  ).length;
  intent += Math.min(viewedHighIntent * 15, 35);

  if (profile.assessmentCompleted) intent += 25;
  if (profile.roiCalculatorUsed) intent += 20;
  if (profile.capturedEmail) intent += 15;
  if (profile.capturedPhone) intent += 10;

  intent = Math.min(intent, 100);

  // Fit: niche interest detected
  if (profile.nicheInterest) fit += 30;
  if (profile.assessmentScore && profile.assessmentScore >= 70) fit += 30;
  if (profile.capturedPhone) fit += 15;

  // Company signals from events
  const companyEvents = profile.events.filter(e => e.type === "company_detected");
  if (companyEvents.length > 0) fit += 25;

  fit = Math.min(fit, 100);

  // Urgency: return visits, speed, phone
  if (profile.sessions >= 3) urgency += 30;
  else if (profile.sessions >= 2) urgency += 15;

  if (profile.capturedPhone) urgency += 20;

  // Time between first and last interaction
  const first = new Date(profile.firstSeen).getTime();
  const last = new Date(profile.lastSeen).getTime();
  const daysBetween = (last - first) / (1000 * 60 * 60 * 24);
  if (daysBetween < 1 && profile.sessions >= 2) urgency += 25;
  else if (daysBetween < 3 && profile.sessions >= 2) urgency += 15;

  if (profile.whatsappOptIn) urgency += 15;

  urgency = Math.min(urgency, 100);

  const composite = Math.round(
    intent * 0.35 + engagement * 0.25 + fit * 0.25 + urgency * 0.15
  );

  return { engagement, intent, fit, urgency, composite };
}

export function determineFunnelStage(profile: VisitorProfile): FunnelStage {
  if (profile.scores.composite >= 80) return "hot";
  if (profile.assessmentCompleted && profile.capturedEmail) return "qualifying";
  if (profile.capturedEmail) return "captured";
  if (profile.roiCalculatorUsed || profile.chatEngaged) return "interested";
  if (profile.pagesViewed.length >= 2 || profile.totalTimeOnSite > 60) return "engaged";
  return "anonymous";
}

// Determine which funnel blueprint to apply based on visitor behavior
export function selectFunnelBlueprint(profile: VisitorProfile): string {
  if (profile.assessmentCompleted && profile.scores.composite >= 70) {
    return "high-ticket-call"; // GERU High Ticket Call funnel
  }
  if (profile.chatEngaged && profile.capturedEmail) {
    return "chatbot-lead"; // GERU Chatbot Lead funnel
  }
  if (profile.roiCalculatorUsed) {
    return "agency-audit"; // GERU Agency Client-Audit funnel
  }
  if (profile.sessions >= 3 && !profile.capturedEmail) {
    return "exit-recovery"; // Cart Abandonment pattern
  }
  if (profile.nicheInterest) {
    return "value-ladder"; // GERU Agency Value Ladder
  }
  return "lead-gen"; // GERU Agency Lead Gen (default)
}

// Determine next best action for this visitor
export function getNextBestAction(profile: VisitorProfile): {
  action: string;
  channel: "popup" | "chat" | "inline" | "whatsapp" | "email";
  offer: string;
  urgency: "low" | "medium" | "high";
} {
  // Hot lead — immediate human contact
  if (profile.scores.composite >= 80) {
    return {
      action: "book_consultation",
      channel: "chat",
      offer: "Free 30-minute strategy session with a specialist",
      urgency: "high",
    };
  }

  // Has email but low engagement — nurture
  if (profile.capturedEmail && profile.scores.engagement < 40) {
    return {
      action: "send_value_content",
      channel: "email",
      offer: "Industry-specific case study",
      urgency: "medium",
    };
  }

  // High engagement, no email — capture
  if (profile.scores.engagement >= 50 && !profile.capturedEmail) {
    return {
      action: "show_assessment",
      channel: "popup",
      offer: "Free business readiness assessment",
      urgency: "high",
    };
  }

  // Viewed pricing — direct offer
  if (profile.pagesViewed.some(p => p.includes("pricing"))) {
    return {
      action: "show_roi_calculator",
      channel: "inline",
      offer: "Calculate your automation ROI",
      urgency: "high",
    };
  }

  // Return visitor — personalized
  if (profile.sessions >= 2) {
    return {
      action: "show_exit_popup",
      channel: "popup",
      offer: "Welcome back — free audit for your business",
      urgency: "medium",
    };
  }

  // Default — soft engagement
  return {
    action: "show_chat_greeting",
    channel: "chat",
    offer: `Hi! What brings you to ${siteConfig.brandName} today?`,
    urgency: "low",
  };
}

// Niche assessment question bank
export interface AssessmentQuestion {
  id: string;
  question: string;
  options: { label: string; score: number; insight: string }[];
}

export const NICHE_ASSESSMENTS: Record<string, {
  title: string;
  subtitle: string;
  questions: AssessmentQuestion[];
  resultTiers: { min: number; max: number; label: string; message: string; cta: string }[];
}> = {
  "client-portal": {
    title: "Client Portal Readiness Assessment",
    subtitle: "Discover how much time and revenue you're leaving on the table",
    questions: [
      {
        id: "cp1",
        question: "How do your clients currently access project updates?",
        options: [
          { label: "Email back-and-forth", score: 10, insight: "High friction, easy to lose threads" },
          { label: "Shared Google Drive/Dropbox", score: 20, insight: "Better, but no structure" },
          { label: "Basic project tool (Trello, Asana)", score: 30, insight: "Good start, not client-facing" },
          { label: "We have a branded portal", score: 5, insight: "You're ahead — let's optimize" },
        ],
      },
      {
        id: "cp2",
        question: "How many hours per week does your team spend on client status updates?",
        options: [
          { label: "10+ hours", score: 10, insight: "Critical time drain — automation saves $50K+/year" },
          { label: "5-10 hours", score: 8, insight: "Significant — portal cuts this by 80%" },
          { label: "2-5 hours", score: 6, insight: "Moderate — still worth automating" },
          { label: "Less than 2 hours", score: 3, insight: "Efficient, but scaling will break this" },
        ],
      },
      {
        id: "cp3",
        question: "How do you handle client invoicing and payments?",
        options: [
          { label: "Manual invoices via email", score: 10, insight: "30% of invoices are paid late with manual process" },
          { label: "QuickBooks/FreshBooks (separate)", score: 7, insight: "Works but clients juggle multiple logins" },
          { label: "Stripe/PayPal links", score: 5, insight: "Fast but no portal experience" },
          { label: "Integrated in our portal", score: 2, insight: "Best practice — you're already there" },
        ],
      },
      {
        id: "cp4",
        question: "How many active clients do you serve simultaneously?",
        options: [
          { label: "50+", score: 10, insight: "At this scale, a portal is essential" },
          { label: "20-50", score: 8, insight: "Perfect size for maximum ROI" },
          { label: "10-20", score: 6, insight: "Good time to implement before scaling" },
          { label: "Under 10", score: 4, insight: "Start early — it scales with you" },
        ],
      },
      {
        id: "cp5",
        question: "What's your biggest client management pain point?",
        options: [
          { label: "Clients can't find information", score: 10, insight: "Portal centralizes everything in one branded hub" },
          { label: "Too many tools and logins", score: 8, insight: "Portal consolidates 5-10 tools into one" },
          { label: "Onboarding takes too long", score: 9, insight: "Automated onboarding cuts time by 70%" },
          { label: "Churn from poor experience", score: 10, insight: "Portals reduce churn by 35% on average" },
        ],
      },
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Optimized", message: "Your client management is already strong. Let's explore advanced automation opportunities.", cta: "Explore Advanced Features" },
      { min: 21, max: 35, label: "Room to Grow", message: "You have a solid foundation but significant efficiency gains are available. A portal could save your team 15-20 hours/week.", cta: "See Your Custom Savings Report" },
      { min: 36, max: 50, label: "High Opportunity", message: "Your business is losing significant time and money on manual client management. A portal would transform your operations and client experience.", cta: "Book Your Free Strategy Session" },
    ],
  },
  "re-syndication": {
    title: "Investor Portal Readiness Score",
    subtitle: "See how your investor experience compares to top-performing syndicators",
    questions: [
      {
        id: "rs1",
        question: "How do investors currently access deal documents and K-1s?",
        options: [
          { label: "Email attachments", score: 10, insight: "SEC compliance risk — no audit trail" },
          { label: "Shared folder (Dropbox/Drive)", score: 7, insight: "Better, but no watermarking or access control" },
          { label: "Basic investor portal", score: 4, insight: "Good — let's make it institutional-grade" },
          { label: "Full portal with e-signatures", score: 2, insight: "You're ahead of 90% of syndicators" },
        ],
      },
      {
        id: "rs2",
        question: "How do you share performance reports with investors?",
        options: [
          { label: "Quarterly PDF via email", score: 9, insight: "Investors want real-time access" },
          { label: "Spreadsheet updates", score: 8, insight: "Error-prone and unprofessional at scale" },
          { label: "Dashboard (AppFolio/Juniper Square)", score: 4, insight: "Good tools, but expensive per-investor" },
          { label: "Branded real-time dashboard", score: 2, insight: "Best-in-class — investors love this" },
        ],
      },
      {
        id: "rs3",
        question: "What's your current or target raise size?",
        options: [
          { label: "$10M+", score: 10, insight: "At this level, institutional portal is table stakes" },
          { label: "$5M-$10M", score: 8, insight: "Sweet spot — portal professionalism wins allocations" },
          { label: "$1M-$5M", score: 6, insight: "Portal differentiates you from 95% of sponsors" },
          { label: "Under $1M", score: 4, insight: "Start building investor trust infrastructure now" },
        ],
      },
      {
        id: "rs4",
        question: "How many investors do you manage?",
        options: [
          { label: "100+", score: 10, insight: "Manual management is impossible at this scale" },
          { label: "50-100", score: 8, insight: "Portal ROI is massive here" },
          { label: "20-50", score: 6, insight: "Perfect time to systematize" },
          { label: "Under 20", score: 4, insight: "Build the infrastructure before the next raise" },
        ],
      },
      {
        id: "rs5",
        question: "What's your biggest investor management challenge?",
        options: [
          { label: "Investor communication takes too long", score: 10, insight: "Portal + automated reports cut this by 90%" },
          { label: "Document management is chaotic", score: 9, insight: "Centralized portal with version control solves this" },
          { label: "Can't scale — too many individual requests", score: 10, insight: "Self-service portal eliminates 80% of requests" },
          { label: "Losing deals to sponsors with better tech", score: 10, insight: "Portal is the #1 differentiator for capital raising" },
        ],
      },
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Institutional Grade", message: "Your investor infrastructure is strong. Let's explore advanced features like automated distributions and deal room creation.", cta: "Explore Advanced Features" },
      { min: 21, max: 35, label: "Growth Ready", message: "You're well-positioned but leaving efficiency and investor satisfaction on the table. An upgraded portal could increase your next raise by 20-40%.", cta: "See Your Portal Upgrade Plan" },
      { min: 36, max: 50, label: "Critical Gap", message: "Your investor experience is costing you capital. Top-performing syndicators with portals raise 3x more. Let's fix this.", cta: "Book Your Free Portal Strategy Call" },
    ],
  },
  "immigration-law": {
    title: "Digital Case Management Readiness",
    subtitle: "Is your firm ready for the demands of modern immigration practice?",
    questions: [
      {
        id: "il1",
        question: "How do clients track their case status?",
        options: [
          { label: "They call or email us", score: 10, insight: "80% of client calls are status checks — portal eliminates them" },
          { label: "We send periodic email updates", score: 7, insight: "Better, but clients want on-demand access" },
          { label: "Basic case tracking tool", score: 4, insight: "Good foundation — let's add client self-service" },
          { label: "Full client portal with timeline", score: 2, insight: "You're ahead — let's optimize workflows" },
        ],
      },
      {
        id: "il2",
        question: "How do you collect client documents?",
        options: [
          { label: "Email attachments", score: 10, insight: "Lost documents, no version control, security risk" },
          { label: "Secure upload form", score: 6, insight: "Functional but not organized per case" },
          { label: "Client portal with checklist", score: 3, insight: "Best practice — reduces missing docs by 90%" },
          { label: "Integrated with case management", score: 2, insight: "Excellent — full automation ready" },
        ],
      },
      {
        id: "il3",
        question: "How many active cases does your firm handle?",
        options: [
          { label: "200+", score: 10, insight: "Manual tracking is impossible — portal is critical" },
          { label: "100-200", score: 8, insight: "Sweet spot for maximum portal ROI" },
          { label: "50-100", score: 6, insight: "Great time to implement before scaling" },
          { label: "Under 50", score: 4, insight: "Build the system now for growth" },
        ],
      },
      {
        id: "il4",
        question: "Do you serve clients in multiple languages?",
        options: [
          { label: "Yes, 3+ languages", score: 10, insight: "Multilingual portal is a massive competitive advantage" },
          { label: "Yes, 2 languages", score: 7, insight: "Bilingual portal captures wider market" },
          { label: "English only", score: 4, insight: "Adding Spanish alone opens 40% more market" },
          { label: "We use interpreters as needed", score: 6, insight: "Portal with built-in translation saves interpreter costs" },
        ],
      },
      {
        id: "il5",
        question: "What's your biggest operational challenge?",
        options: [
          { label: "Deadline tracking across cases", score: 10, insight: "Automated deadline alerts prevent malpractice risk" },
          { label: "Client communication volume", score: 9, insight: "Self-service portal cuts inbound 70%" },
          { label: "Document organization", score: 8, insight: "Structured intake checklists solve this completely" },
          { label: "Scaling without more staff", score: 10, insight: "Portal automates 60% of paralegal tasks" },
        ],
      },
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Digitally Advanced", message: "Your firm is well-equipped. Let's explore AI-powered case analysis and automated USCIS tracking.", cta: "Explore AI Case Tools" },
      { min: 21, max: 35, label: "Modernization Ready", message: "Your firm has room for significant efficiency gains. A digital case management portal could save 25+ hours per week.", cta: "See Your Efficiency Report" },
      { min: 36, max: 50, label: "Urgent Need", message: "Your firm is spending too much time on manual processes. Modern immigration firms with portals handle 3x the caseload. Let's get you there.", cta: "Book Your Free Consultation" },
    ],
  },

  "construction": {
    title: "Construction Portal Readiness Assessment",
    subtitle: "See how your client communication compares to top contractors",
    questions: [
      { id: "co1", question: "How do clients currently view project progress?", options: [
        { label: "Phone calls and site visits", score: 10, insight: "Time-intensive — portal with photo updates saves 15h/week" },
        { label: "Weekly email reports", score: 7, insight: "Better, but clients want real-time access" },
        { label: "Project management tool (Procore, etc.)", score: 4, insight: "Good tools, but expensive per-project" },
        { label: "Client-facing portal with live updates", score: 2, insight: "You're ahead — let's optimize" },
      ]},
      { id: "co2", question: "How do you handle change orders?", options: [
        { label: "Paper forms on site", score: 10, insight: "Highest dispute risk — digital approval cuts disputes 80%" },
        { label: "Email back-and-forth", score: 8, insight: "No audit trail — portal creates legal protection" },
        { label: "Digital form (DocuSign, etc.)", score: 5, insight: "Functional but not integrated with project tracking" },
        { label: "Integrated in project portal", score: 2, insight: "Best practice — full traceability" },
      ]},
      { id: "co3", question: "How many active projects do you manage?", options: [
        { label: "20+", score: 10, insight: "At this scale, manual tracking is impossible" },
        { label: "10-20", score: 8, insight: "Sweet spot for maximum portal ROI" },
        { label: "5-10", score: 6, insight: "Good time to implement before scaling" },
        { label: "Under 5", score: 4, insight: "Start early — builds client confidence" },
      ]},
      { id: "co4", question: "What's your biggest client management challenge?", options: [
        { label: "Clients calling for status updates constantly", score: 10, insight: "Self-service portal eliminates 80% of status calls" },
        { label: "Document chaos (permits, plans, invoices)", score: 9, insight: "Centralized portal with folder structure solves this" },
        { label: "Payment collection delays", score: 8, insight: "Integrated invoicing with milestone triggers reduces AR 40%" },
        { label: "Subcontractor coordination", score: 7, insight: "Multi-role portal gives subs their own access" },
      ]},
      { id: "co5", question: "How do you share project photos and documentation?", options: [
        { label: "Text/WhatsApp groups", score: 10, insight: "Unprofessional, no organization, hard to find later" },
        { label: "Email with attachments", score: 8, insight: "File size limits and lost threads" },
        { label: "Shared folder (Dropbox/Drive)", score: 5, insight: "Better, but clients can't comment or approve" },
        { label: "Project portal with galleries", score: 2, insight: "Client-favorite feature — big differentiator" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Digitally Advanced", message: "Your construction management is well-equipped. Let's explore automated scheduling and predictive analytics.", cta: "Explore Advanced Features" },
      { min: 21, max: 35, label: "Room to Grow", message: "Your firm has significant efficiency gains available. A client portal could save 20+ hours/week and win 30% more bids.", cta: "See Your Savings Report" },
      { min: 36, max: 50, label: "High Opportunity", message: "Your business is losing time, money, and client trust. Contractors with portals win 40% more repeat business.", cta: "Book Your Free Strategy Session" },
    ],
  },
  "franchise": {
    title: "Franchise Operations Assessment",
    subtitle: "See how your multi-location management stacks up",
    questions: [
      { id: "fr1", question: "How do franchisees access brand resources and training?", options: [
        { label: "Email when they ask", score: 10, insight: "Inconsistent brand experience across locations" },
        { label: "Shared Drive with folders", score: 7, insight: "Better, but no version control or tracking" },
        { label: "Basic intranet", score: 4, insight: "Good foundation — let's make it intelligent" },
        { label: "Branded franchisee portal", score: 2, insight: "You're ahead — let's add analytics" },
      ]},
      { id: "fr2", question: "How do you track compliance across locations?", options: [
        { label: "Annual audits only", score: 10, insight: "Problems go undetected for months" },
        { label: "Quarterly spreadsheet reviews", score: 8, insight: "Reactive, not proactive" },
        { label: "Monthly automated checks", score: 4, insight: "Good cadence, let's add real-time alerts" },
        { label: "Real-time compliance dashboard", score: 2, insight: "Best-in-class — most franchisors don't have this" },
      ]},
      { id: "fr3", question: "How many franchise locations do you manage?", options: [
        { label: "50+", score: 10, insight: "At this scale, centralized management is critical" },
        { label: "20-50", score: 8, insight: "Perfect size for maximum system ROI" },
        { label: "10-20", score: 6, insight: "Ideal time to standardize before scaling" },
        { label: "Under 10", score: 4, insight: "Build the infrastructure for your growth plan" },
      ]},
      { id: "fr4", question: "How do franchisees report revenue and KPIs?", options: [
        { label: "They email spreadsheets monthly", score: 10, insight: "Data delays cost you 30 days of actionable insight" },
        { label: "Shared Google Sheets", score: 7, insight: "Real-time but no automation or alerts" },
        { label: "POS integration (partial)", score: 5, insight: "Good start — let's build a unified dashboard" },
        { label: "Automated dashboard from all locations", score: 2, insight: "Excellent — you have full visibility" },
      ]},
      { id: "fr5", question: "What's your biggest franchise management challenge?", options: [
        { label: "Brand consistency across locations", score: 10, insight: "Portal with brand guidelines + training solves this" },
        { label: "Slow communication with franchisees", score: 9, insight: "Centralized messaging cuts response time 70%" },
        { label: "Training new franchisees", score: 8, insight: "LMS with automated training tracks completion" },
        { label: "Revenue visibility and forecasting", score: 7, insight: "Automated reporting from all locations" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Well Systemized", message: "Your franchise operations are strong. Let's explore AI-powered predictive analytics and automated compliance monitoring.", cta: "Explore Advanced Features" },
      { min: 21, max: 35, label: "Scaling Ready", message: "Your franchise system has room for significant efficiency gains. A unified portal could save 25+ hours/week in management overhead.", cta: "See Your Efficiency Report" },
      { min: 36, max: 50, label: "Critical Need", message: "Your franchise operations are hemorrhaging efficiency. Top franchise systems with portals grow 3x faster. Let's fix this.", cta: "Book Your Free Strategy Session" },
    ],
  },
  "staffing": {
    title: "Staffing Portal Readiness Assessment",
    subtitle: "Discover how much time your agency wastes on manual processes",
    questions: [
      { id: "st1", question: "How do candidates submit applications?", options: [
        { label: "Email resume + phone screen", score: 10, insight: "Slowest method — lose top candidates to faster agencies" },
        { label: "Job board forms (Indeed, etc.)", score: 7, insight: "Good reach but no branded experience" },
        { label: "Website form → manual processing", score: 5, insight: "Better, but still manual sorting and follow-up" },
        { label: "Applicant portal with auto-screening", score: 2, insight: "Best practice — fastest time-to-placement" },
      ]},
      { id: "st2", question: "How do clients track placement progress?", options: [
        { label: "They call or email us", score: 10, insight: "Clients leave when communication is slow" },
        { label: "Weekly email updates", score: 7, insight: "Better, but clients want on-demand access" },
        { label: "Shared spreadsheet", score: 5, insight: "Functional but unprofessional at scale" },
        { label: "Client portal with real-time tracking", score: 2, insight: "Top differentiator — clients love this" },
      ]},
      { id: "st3", question: "How many placements do you make per month?", options: [
        { label: "50+", score: 10, insight: "Portal automation is essential at this volume" },
        { label: "20-50", score: 8, insight: "Sweet spot for maximum ROI" },
        { label: "10-20", score: 6, insight: "Perfect time to systematize" },
        { label: "Under 10", score: 4, insight: "Build the system before scaling" },
      ]},
      { id: "st4", question: "How do you manage timesheet approval?", options: [
        { label: "Paper timesheets", score: 10, insight: "Error-prone, slow payment, candidate frustration" },
        { label: "Email-based approval", score: 7, insight: "Slow turnaround, easy to miss" },
        { label: "Third-party app", score: 4, insight: "Works but another login for clients" },
        { label: "Integrated in client portal", score: 2, insight: "Fastest approval cycle — candidates love it" },
      ]},
      { id: "st5", question: "What's your biggest operational bottleneck?", options: [
        { label: "Candidate sourcing and screening", score: 8, insight: "Auto-screening portal filters 80% of unqualified applicants" },
        { label: "Client communication and reporting", score: 10, insight: "Self-service portal cuts admin 60%" },
        { label: "Compliance and documentation", score: 9, insight: "Automated document collection and verification" },
        { label: "Billing and invoicing", score: 7, insight: "Integrated billing from timesheet data" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Well Automated", message: "Your staffing operations are efficient. Let's explore AI matching and predictive placement analytics.", cta: "Explore AI Matching" },
      { min: 21, max: 35, label: "Growth Ready", message: "Your agency has significant efficiency gains available. A dual portal (candidate + client) could increase placements 30%.", cta: "See Your Efficiency Plan" },
      { min: 36, max: 50, label: "High Opportunity", message: "Your agency is losing candidates and clients to faster competitors. Modern staffing portals increase placement speed 50%.", cta: "Book Your Free Strategy Session" },
    ],
  },
  "church-management": {
    title: "Church Management Readiness Assessment",
    subtitle: "Is your church ready for modern digital ministry?",
    questions: [
      { id: "ch1", question: "How do members access church information and events?", options: [
        { label: "Sunday bulletin only", score: 10, insight: "Reaching only those who attend — missing 40% of congregation" },
        { label: "Website + email newsletter", score: 7, insight: "Good reach but one-directional" },
        { label: "Social media groups", score: 5, insight: "Engaging but chaotic, no structure" },
        { label: "Member portal with events and groups", score: 2, insight: "Best practice — full engagement" },
      ]},
      { id: "ch2", question: "How do you manage giving and donations?", options: [
        { label: "Offering plate + checks only", score: 10, insight: "Missing 60% of potential giving (mobile/online)" },
        { label: "Third-party giving app", score: 6, insight: "Works but another login, fees add up" },
        { label: "Website donation page", score: 5, insight: "Good but not integrated with member records" },
        { label: "Integrated giving portal with auto-receipts", score: 2, insight: "Maximizes giving — recurring donations 40% higher" },
      ]},
      { id: "ch3", question: "How many active members does your church have?", options: [
        { label: "1000+", score: 10, insight: "Manual management is impossible at this scale" },
        { label: "500-1000", score: 8, insight: "Perfect size for maximum portal impact" },
        { label: "200-500", score: 6, insight: "Great time to implement before growth" },
        { label: "Under 200", score: 4, insight: "Build engagement infrastructure early" },
      ]},
      { id: "ch4", question: "How do you manage small groups and ministries?", options: [
        { label: "Paper sign-up sheets", score: 10, insight: "Low engagement, no tracking, leaders overwhelmed" },
        { label: "Google Forms + Sheets", score: 7, insight: "Functional but fragmented" },
        { label: "Church management software", score: 4, insight: "Good foundation — let's add member self-service" },
        { label: "Portal with group management + messaging", score: 2, insight: "Full engagement ecosystem" },
      ]},
      { id: "ch5", question: "What's your biggest ministry challenge?", options: [
        { label: "Member engagement between Sundays", score: 10, insight: "Portal with groups, devotionals, and messaging bridges the gap" },
        { label: "Volunteer coordination", score: 9, insight: "Automated scheduling saves 10+ hours/week" },
        { label: "Communication reaching everyone", score: 8, insight: "Multi-channel portal (email, SMS, app) reaches 95%" },
        { label: "Financial transparency and reporting", score: 7, insight: "Automated reports build trust and increase giving" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Digitally Equipped", message: "Your church is well-equipped for digital ministry. Let's explore advanced engagement tools and AI-powered pastoral care.", cta: "Explore Advanced Tools" },
      { min: 21, max: 35, label: "Growth Ready", message: "Your church has significant opportunities to increase engagement. A member portal typically increases active participation by 35%.", cta: "See Your Engagement Plan" },
      { min: 36, max: 50, label: "Transformation Ready", message: "Your church is missing major engagement opportunities. Churches with portals see 50% higher between-Sunday engagement.", cta: "Book Your Free Consultation" },
    ],
  },
  "creator-management": {
    title: "Creator Management Assessment",
    subtitle: "Is your talent management keeping up with creator economy demands?",
    questions: [
      { id: "cr1", question: "How do creators access campaign briefs and deliverables?", options: [
        { label: "Email threads", score: 10, insight: "Missed deadlines and lost briefs are inevitable" },
        { label: "Shared Google Drive", score: 7, insight: "Better, but no workflow tracking" },
        { label: "Project management tool", score: 4, insight: "Good for internal — not client/creator facing" },
        { label: "Creator portal with campaign dashboard", score: 2, insight: "Best practice — creators love self-service" },
      ]},
      { id: "cr2", question: "How do you handle payments and revenue splits?", options: [
        { label: "Manual PayPal/bank transfers", score: 10, insight: "Time-consuming and error-prone at scale" },
        { label: "Spreadsheet tracking + batch payments", score: 7, insight: "Better, but creators want real-time visibility" },
        { label: "Payment platform (Stripe Connect, etc.)", score: 4, insight: "Good infrastructure — let's add portal visibility" },
        { label: "Portal with real-time earnings dashboard", score: 2, insight: "Creator-preferred — reduces payment inquiries 90%" },
      ]},
      { id: "cr3", question: "How many creators do you manage?", options: [
        { label: "100+", score: 10, insight: "Portal is essential for scaling management" },
        { label: "50-100", score: 8, insight: "Sweet spot for maximum ROI" },
        { label: "20-50", score: 6, insight: "Perfect time to systematize" },
        { label: "Under 20", score: 4, insight: "Build the system before signing more talent" },
      ]},
      { id: "cr4", question: "How do brands view campaign results?", options: [
        { label: "Manual report PDFs", score: 10, insight: "Slow turnaround loses repeat brand deals" },
        { label: "Spreadsheet dashboards", score: 7, insight: "Data-driven but not client-ready" },
        { label: "Third-party analytics tool", score: 4, insight: "Good data, but brands want branded reports" },
        { label: "Brand portal with real-time metrics", score: 2, insight: "Biggest differentiator for agency growth" },
      ]},
      { id: "cr5", question: "What's your biggest management challenge?", options: [
        { label: "Scaling without more staff", score: 10, insight: "Portal automates 70% of coordination tasks" },
        { label: "Creator communication and deadlines", score: 9, insight: "Automated reminders and milestone tracking" },
        { label: "Revenue tracking and transparency", score: 8, insight: "Real-time dashboards build creator trust" },
        { label: "Brand relationship management", score: 7, insight: "CRM with campaign history wins repeat deals" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Well Systemized", message: "Your management is well-equipped. Let's explore AI-powered creator matching and predictive campaign analytics.", cta: "Explore AI Tools" },
      { min: 21, max: 35, label: "Scaling Ready", message: "Your agency can significantly reduce overhead. A dual portal (creator + brand) could double your roster without adding staff.", cta: "See Your Scaling Plan" },
      { min: 36, max: 50, label: "Critical Need", message: "Your management processes are holding you back. Top agencies with portals manage 3x more creators per manager.", cta: "Book Your Free Strategy Session" },
    ],
  },
  "compliance-training": {
    title: "Compliance Training Platform Assessment",
    subtitle: "Is your training delivery ready for regulatory demands?",
    questions: [
      { id: "ct1", question: "How do you deliver compliance training?", options: [
        { label: "In-person only", score: 10, insight: "Most expensive, least scalable, no audit trail" },
        { label: "PDF/video via email", score: 8, insight: "No tracking, no completion verification" },
        { label: "Third-party LMS", score: 4, insight: "Works but expensive per-seat pricing" },
        { label: "Integrated LMS with auto-assignment", score: 2, insight: "Best practice — full automation" },
      ]},
      { id: "ct2", question: "How do you track training completion and certifications?", options: [
        { label: "Spreadsheet manually updated", score: 10, insight: "Compliance risk — auditors require real-time tracking" },
        { label: "Email confirmations", score: 7, insight: "No centralized view, easy to miss expirations" },
        { label: "LMS with basic reporting", score: 4, insight: "Good — let's add automated renewal alerts" },
        { label: "Automated tracking with expiration alerts", score: 2, insight: "Audit-ready — zero compliance risk" },
      ]},
      { id: "ct3", question: "How many employees/students need training?", options: [
        { label: "500+", score: 10, insight: "Automation is mandatory at this scale" },
        { label: "200-500", score: 8, insight: "Perfect size for maximum platform ROI" },
        { label: "50-200", score: 6, insight: "Great time to implement before growth" },
        { label: "Under 50", score: 4, insight: "Start with core compliance courses" },
      ]},
      { id: "ct4", question: "What industries do you serve?", options: [
        { label: "Healthcare (HIPAA, OSHA)", score: 10, insight: "Highest compliance penalties — automation is critical" },
        { label: "Financial (SOX, AML)", score: 9, insight: "Strict audit requirements need automated tracking" },
        { label: "Manufacturing (OSHA, EPA)", score: 8, insight: "Safety training with completion verification" },
        { label: "General business (HR, Ethics)", score: 5, insight: "Broader market — standardized content works well" },
      ]},
      { id: "ct5", question: "What's your biggest training challenge?", options: [
        { label: "Getting people to complete courses", score: 10, insight: "Auto-reminders + gamification increase completion 60%" },
        { label: "Tracking who's compliant and who isn't", score: 9, insight: "Real-time dashboard with red/yellow/green status" },
        { label: "Creating and updating course content", score: 8, insight: "AI-assisted content creation cuts development 70%" },
        { label: "Proving compliance during audits", score: 10, insight: "Automated audit reports generated in seconds" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Audit Ready", message: "Your training platform is strong. Let's explore AI-powered content creation and predictive compliance analytics.", cta: "Explore AI Training Tools" },
      { min: 21, max: 35, label: "Upgrade Ready", message: "Your training delivery has significant room for improvement. An automated LMS could reduce compliance risk 80% and save 15+ hours/week.", cta: "See Your Compliance Plan" },
      { min: 36, max: 50, label: "Compliance Risk", message: "Your training processes expose you to serious compliance risk. Companies with automated training platforms pass 95% of audits. Let's fix this.", cta: "Book Your Free Compliance Review" },
    ],
  },
  "managed-services": {
    title: "Managed Services Readiness Assessment",
    subtitle: "How efficient is your service delivery model?",
    questions: [
      { id: "ms1", question: "How do clients submit support requests?", options: [
        { label: "Email or phone calls", score: 10, insight: "No prioritization, SLA tracking impossible" },
        { label: "Shared inbox with manual routing", score: 7, insight: "Better, but no client visibility" },
        { label: "Third-party ticketing system", score: 4, insight: "Functional but clients have another login" },
        { label: "Integrated client portal with ticket tracking", score: 2, insight: "Best practice — clients see status in real-time" },
      ]},
      { id: "ms2", question: "How do you track SLA compliance?", options: [
        { label: "We don't formally track SLAs", score: 10, insight: "Biggest risk to client retention" },
        { label: "Spreadsheet tracking", score: 7, insight: "Reactive — violations discovered after the fact" },
        { label: "Monitoring tool with basic alerts", score: 4, insight: "Good — let's add client-facing SLA dashboards" },
        { label: "Real-time SLA dashboard with auto-escalation", score: 2, insight: "Enterprise-grade — clients love transparency" },
      ]},
      { id: "ms3", question: "How many clients do you serve?", options: [
        { label: "50+", score: 10, insight: "Portal automation is essential at this scale" },
        { label: "20-50", score: 8, insight: "Sweet spot for maximum ROI" },
        { label: "10-20", score: 6, insight: "Perfect time to systematize" },
        { label: "Under 10", score: 4, insight: "Build the system before scaling" },
      ]},
      { id: "ms4", question: "How do clients view their service reports?", options: [
        { label: "Monthly PDF via email", score: 10, insight: "Clients want on-demand access to their data" },
        { label: "Scheduled email reports", score: 7, insight: "Better, but no interactivity" },
        { label: "Third-party dashboard", score: 4, insight: "Good data, but not branded to your MSP" },
        { label: "Branded portal with real-time dashboards", score: 2, insight: "Top differentiator for MSP retention" },
      ]},
      { id: "ms5", question: "What's your biggest service delivery challenge?", options: [
        { label: "Too many manual processes", score: 10, insight: "Automation reduces service delivery cost 40%" },
        { label: "Client churn from poor visibility", score: 9, insight: "Portal transparency reduces churn 35%" },
        { label: "Scaling without proportional staff increase", score: 10, insight: "Portal self-service handles 60% of tier-1 requests" },
        { label: "Profitability per client", score: 8, insight: "Automated reporting and billing improve margins 20%" },
      ]},
    ],
    resultTiers: [
      { min: 0, max: 20, label: "Well Optimized", message: "Your MSP operations are efficient. Let's explore AI-powered incident prediction and automated remediation.", cta: "Explore AI Operations" },
      { min: 21, max: 35, label: "Growth Ready", message: "Your MSP has significant efficiency gains available. A client portal could improve retention 35% and reduce support tickets 50%.", cta: "See Your Efficiency Plan" },
      { min: 36, max: 50, label: "Critical Gap", message: "Your service delivery is leaving money on the table. Top MSPs with portals serve 3x more clients per engineer.", cta: "Book Your Free Strategy Session" },
    ],
  },
};

// Default assessment for niches without a custom one
export const DEFAULT_ASSESSMENT = {
  title: "Business Automation Readiness Assessment",
  subtitle: "Discover how much time and money automation can save your business",
  questions: [
    {
      id: "d1",
      question: "How much of your team's time is spent on repetitive manual tasks?",
      options: [
        { label: "Over 50%", score: 10, insight: "Major automation opportunity — typical savings of $100K+/year" },
        { label: "25-50%", score: 8, insight: "Significant room for improvement" },
        { label: "10-25%", score: 5, insight: "Good efficiency, targeted automation adds value" },
        { label: "Under 10%", score: 2, insight: "Well-optimized — let's find advanced opportunities" },
      ],
    },
    {
      id: "d2",
      question: "How many different software tools does your team use daily?",
      options: [
        { label: "10+", score: 10, insight: "Tool sprawl costs $10K+/year in redundant licenses alone" },
        { label: "6-10", score: 7, insight: "Integration can consolidate to 2-3 core platforms" },
        { label: "3-5", score: 4, insight: "Reasonable stack, let's optimize workflows between them" },
        { label: "1-2", score: 2, insight: "Lean setup — let's add strategic automation" },
      ],
    },
    {
      id: "d3",
      question: "How do you currently handle client onboarding?",
      options: [
        { label: "Mostly manual emails and calls", score: 10, insight: "Automated onboarding reduces time-to-value by 70%" },
        { label: "Templated emails + manual steps", score: 7, insight: "Good starting point for full automation" },
        { label: "Partially automated workflow", score: 4, insight: "Let's close the remaining gaps" },
        { label: "Fully automated with portal", score: 1, insight: "Excellent — ready for advanced features" },
      ],
    },
    {
      id: "d4",
      question: "What's your annual revenue?",
      options: [
        { label: "$1M+", score: 10, insight: "At this scale, automation ROI is typically 5-10x" },
        { label: "$500K-$1M", score: 8, insight: "Sweet spot for maximum automation impact" },
        { label: "$100K-$500K", score: 5, insight: "Automation helps you scale without hiring" },
        { label: "Under $100K", score: 3, insight: "Start with high-impact automations first" },
      ],
    },
    {
      id: "d5",
      question: "What's your biggest growth bottleneck?",
      options: [
        { label: "Can't scale without more staff", score: 10, insight: "Automation handles 60-80% of scaling tasks" },
        { label: "Client experience is inconsistent", score: 9, insight: "Portals + automation standardize everything" },
        { label: "Too many tools, nothing talks to each other", score: 8, insight: "Integration is the #1 quick win" },
        { label: "Lead generation and sales", score: 7, insight: "Automated funnels + CRM solve this" },
      ],
    },
  ] as AssessmentQuestion[],
  resultTiers: [
    { min: 0, max: 15, label: "Well Optimized", message: "Your business is already efficient. Let's explore advanced AI and automation opportunities.", cta: "Explore Advanced Solutions" },
    { min: 16, max: 30, label: "Growth Ready", message: "You have solid foundations but significant automation gains available. We can typically save businesses like yours 20-30 hours per week.", cta: "See Your Custom Automation Plan" },
    { min: 31, max: 50, label: "High Opportunity", message: "Your business is leaving major efficiency gains on the table. Companies at your stage typically see 3-5x ROI from automation within 90 days.", cta: "Book Your Free Strategy Session" },
  ],
};
