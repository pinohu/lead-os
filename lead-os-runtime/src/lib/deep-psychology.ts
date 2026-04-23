// ---------------------------------------------------------------------------
// Deep Psychology Engine
// Layers fear, desire, identity, objection depth, and emotional sequencing
// on top of the surface-level psychology-engine triggers.
// ---------------------------------------------------------------------------

export type Niche =
  | "construction"
  | "legal"
  | "healthcare"
  | "real-estate"
  | "home-services"
  | "franchise"
  | "staffing"
  | "technology"
  | "professional-services"
  | "education"
  | "immigration"
  | "financial";

export type PersonaType =
  | "decision-maker"
  | "implementer"
  | "researcher"
  | "budget-holder"
  | "innovator"
  | "pragmatist";

export type DesireTheme =
  | "freedom"
  | "status"
  | "security"
  | "growth"
  | "simplicity"
  | "belonging";

export type FunnelStage = "top" | "middle" | "bottom";

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface FearTrigger {
  niche: string;
  painPoint: string;
  message: string;
  intensity: "low" | "medium" | "high";
}

export interface DesireTrigger {
  niche: string;
  aspiration: string;
  theme: DesireTheme;
  message: string;
}

export interface IdentityMessage {
  persona: PersonaType;
  role: string;
  message: string;
  reinforcement: string;
}

export interface ObjectionResponse {
  objection: string;
  surfaceResponse: string;
  rootCause: string;
  deepResponse: string;
  reframe: string;
}

export interface EmotionalSequence {
  stage: FunnelStage;
  niche: string;
  steps: { emotion: string; trigger: string; message: string }[];
}

// ---------------------------------------------------------------------------
// Niche fear map — pre-built fear triggers for 12 niches
// ---------------------------------------------------------------------------

const NICHE_FEAR_MAP: Record<string, Record<string, { message: string; intensity: FearTrigger["intensity"] }[]>> = {
  construction: {
    "missed bids": [
      { message: "Every unanswered bid request is revenue walking straight to your competitor", intensity: "high" },
      { message: "Contractors who respond within the hour win 78% more contracts", intensity: "medium" },
    ],
    "project delays": [
      { message: "One delay cascades into penalty clauses, lost bonding capacity, and referral damage", intensity: "high" },
      { message: "Stop the bleeding before change orders eat your margin", intensity: "medium" },
    ],
    "safety compliance": [
      { message: "A single OSHA violation can shut down your job site and cost you tens of thousands", intensity: "high" },
      { message: "Your competitors already have compliance systems in place", intensity: "medium" },
    ],
  },
  legal: {
    "client intake": [
      { message: "Every hour your intake form sits unanswered, that prospect calls the next firm on Google", intensity: "high" },
      { message: "Lost intake means lost retainers you will never recover", intensity: "medium" },
    ],
    "missed deadlines": [
      { message: "A missed statute of limitations does not just lose a case, it triggers a malpractice claim", intensity: "high" },
      { message: "Manual deadline tracking is a liability your firm cannot afford", intensity: "medium" },
    ],
    "billing leakage": [
      { message: "Unbilled hours are invisible losses that compound every single month", intensity: "medium" },
      { message: "Firms lose an average of 10% of revenue to untracked time", intensity: "low" },
    ],
  },
  healthcare: {
    "patient no-shows": [
      { message: "Every no-show costs your practice $200 or more in lost revenue and idle staff time", intensity: "high" },
      { message: "Automated reminders reduce no-shows by 40%, and your competitors already use them", intensity: "medium" },
    ],
    "compliance risk": [
      { message: "A single HIPAA violation can cost up to $1.5 million in penalties", intensity: "high" },
      { message: "Manual compliance tracking leaves gaps that auditors find every time", intensity: "medium" },
    ],
    "patient acquisition": [
      { message: "Every day without an online booking system sends patients to the practice down the street", intensity: "medium" },
      { message: "Patients expect to book online; if you are not there, you are invisible", intensity: "low" },
    ],
  },
  "real-estate": {
    "slow follow-up": [
      { message: "Leads go cold in 5 minutes. By the time you call back, they have already scheduled with another agent", intensity: "high" },
      { message: "In real estate, speed to lead is the difference between a commission and a lost deal", intensity: "medium" },
    ],
    "market timing": [
      { message: "Every week you wait to list costs your seller money as the market shifts", intensity: "medium" },
      { message: "Buyers who do not hear back within an hour move to the next listing", intensity: "high" },
    ],
    "reputation damage": [
      { message: "One bad review from a dropped follow-up can cost you dozens of referrals", intensity: "medium" },
      { message: "Your online reputation is your listing pipeline; neglect it at your own risk", intensity: "low" },
    ],
  },
  "home-services": {
    "emergency calls": [
      { message: "Stop the damage before it costs you thousands tonight", intensity: "high" },
      { message: "Every minute of delay during a water leak multiplies the repair bill", intensity: "high" },
    ],
    "seasonal demand": [
      { message: "Peak season waits for nobody. Unfilled slots in July are revenue you will never recover", intensity: "medium" },
      { message: "Your competitors book up fast; empty calendar days do not pay the bills", intensity: "medium" },
    ],
    "reviews and trust": [
      { message: "Homeowners check reviews before they call. No reviews means no calls", intensity: "medium" },
      { message: "One negative review without a response drives away 30 potential customers", intensity: "low" },
    ],
  },
  franchise: {
    "territory saturation": [
      { message: "Open territories are being evaluated by other candidates right now", intensity: "high" },
      { message: "Every month you wait, the best markets get claimed by faster-moving operators", intensity: "medium" },
    ],
    "unit economics": [
      { message: "Without a proven lead system, your franchisees burn cash trying to figure it out alone", intensity: "high" },
      { message: "Inconsistent lead generation across units erodes your brand and your royalty stream", intensity: "medium" },
    ],
    "franchisee churn": [
      { message: "Franchisees who struggle to get leads churn first, and they tell other candidates why", intensity: "high" },
      { message: "Churn is contagious; losing one vocal franchisee can stall your entire development pipeline", intensity: "medium" },
    ],
  },
  staffing: {
    "slow submittals": [
      { message: "The first agency to submit a qualified candidate wins the placement 80% of the time", intensity: "high" },
      { message: "Every hour of delay costs you placements to faster competitors", intensity: "medium" },
    ],
    "candidate ghosting": [
      { message: "Candidates who do not hear back within 24 hours accept other offers", intensity: "high" },
      { message: "Ghosted candidates do not come back, and they tell other candidates about the experience", intensity: "medium" },
    ],
    "client churn": [
      { message: "One missed fill can lose an entire client contract worth six figures annually", intensity: "high" },
      { message: "Clients track your fill rate. Fall below 85% and they start shopping alternatives", intensity: "medium" },
    ],
  },
  technology: {
    "competitor adoption": [
      { message: "Your competitors are already using this. Every month you wait, the gap widens", intensity: "high" },
      { message: "Technical debt compounds silently until it blocks your next product launch", intensity: "medium" },
    ],
    "talent attrition": [
      { message: "Engineers leave companies with outdated tooling. The cost of one senior hire is $50K minimum", intensity: "high" },
      { message: "Your best developers are evaluating your stack against your competitors right now", intensity: "medium" },
    ],
    "security breach": [
      { message: "One breach costs an average of $4.45 million and takes 277 days to identify and contain", intensity: "high" },
      { message: "Every unpatched vulnerability is a ticking clock your competitors do not have", intensity: "medium" },
    ],
  },
  "professional-services": {
    "utilization rate": [
      { message: "Every percentage point drop in utilization costs your firm tens of thousands in lost revenue", intensity: "high" },
      { message: "Low utilization is a silent profit killer that compounds quarter over quarter", intensity: "medium" },
    ],
    "proposal win rate": [
      { message: "Firms that respond to RFPs within 24 hours win 3x more engagements", intensity: "medium" },
      { message: "Every lost proposal is a six-month relationship that went to your competitor", intensity: "medium" },
    ],
    "client concentration": [
      { message: "If your top 3 clients represent more than 40% of revenue, you are one phone call from a crisis", intensity: "high" },
      { message: "Revenue concentration risk is the number one firm killer that nobody talks about until it hits", intensity: "medium" },
    ],
  },
  education: {
    "enrollment decline": [
      { message: "Empty seats do not just lose tuition; they trigger a downward spiral in rankings and funding", intensity: "high" },
      { message: "Every prospective student you lose to a faster-responding institution is years of lifetime value gone", intensity: "medium" },
    ],
    "student retention": [
      { message: "Losing a student after the first semester costs $50K in lifetime revenue and damages completion metrics", intensity: "high" },
      { message: "At-risk students who do not hear from you within 48 hours are twice as likely to drop", intensity: "medium" },
    ],
    "accreditation risk": [
      { message: "Falling below retention thresholds puts your accreditation at risk, and that threatens everything", intensity: "high" },
      { message: "Accreditation reviewers look at engagement metrics first", intensity: "medium" },
    ],
  },
  immigration: {
    "case deadlines": [
      { message: "Every day without protection puts your family at risk of deportation proceedings", intensity: "high" },
      { message: "Missing a filing deadline does not just delay a case; it can result in denial with no appeal", intensity: "high" },
    ],
    "client anxiety": [
      { message: "Your clients are making the most stressful decision of their lives. Silence from your firm amplifies their fear", intensity: "medium" },
      { message: "Clients who feel abandoned during processing leave negative reviews and file bar complaints", intensity: "medium" },
    ],
    "regulatory changes": [
      { message: "Policy changes can eliminate visa categories overnight. Delayed filing means missed windows", intensity: "high" },
      { message: "Every week of inaction narrows your clients options as regulations tighten", intensity: "medium" },
    ],
  },
  financial: {
    "market timing": [
      { message: "Every day you delay costs your clients money as markets move without them", intensity: "high" },
      { message: "Missed rebalancing windows compound into significant underperformance over time", intensity: "medium" },
    ],
    "compliance exposure": [
      { message: "One compliance violation can trigger an SEC investigation that costs millions to resolve", intensity: "high" },
      { message: "Manual compliance tracking leaves audit gaps that regulators are trained to find", intensity: "medium" },
    ],
    "client trust erosion": [
      { message: "Clients who do not hear from their advisor during market volatility move their assets", intensity: "high" },
      { message: "A single missed communication during a downturn can cost you a $2M AUM relationship", intensity: "medium" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Desire theme templates
// ---------------------------------------------------------------------------

const DESIRE_TEMPLATES: Record<DesireTheme, string[]> = {
  freedom: [
    "Imagine never worrying about {pain} again",
    "Take back your evenings and weekends while your system works for you",
    "What would you do with 15 extra hours a week?",
  ],
  status: [
    "Join 500+ {niche} owners who {achieved outcome}",
    "Be the firm everyone in your market talks about",
    "Position yourself as the undisputed leader in {niche}",
  ],
  security: [
    "Build a pipeline that never runs dry, regardless of market conditions",
    "Know exactly where your next 90 days of revenue is coming from",
    "Protect your business from the feast-and-famine cycle for good",
  ],
  growth: [
    "Scale from {current} to {target} without adding headcount",
    "Double your qualified leads without doubling your ad spend",
    "Unlock the growth ceiling your current systems are creating",
  ],
  simplicity: [
    "One dashboard. Every lead. Zero guesswork.",
    "Replace 7 disconnected tools with one system that actually works",
    "Stop managing your tools and start managing your business",
  ],
  belonging: [
    "Join the community of {niche} leaders who refuse to settle",
    "You are not alone. Hundreds of {niche} owners made this exact move",
    "Become part of the fastest-growing network of {niche} professionals",
  ],
};

// ---------------------------------------------------------------------------
// Niche-to-desire mapping by segment
// ---------------------------------------------------------------------------

const NICHE_DESIRE_MAP: Record<string, Record<string, DesireTheme[]>> = {
  construction: { owner: ["freedom", "growth", "status"], manager: ["simplicity", "security"] },
  legal: { partner: ["status", "growth", "security"], associate: ["simplicity", "belonging"] },
  healthcare: { practitioner: ["freedom", "simplicity"], administrator: ["security", "growth"] },
  "real-estate": { agent: ["status", "freedom", "growth"], broker: ["growth", "security"] },
  "home-services": { owner: ["freedom", "growth"], technician: ["simplicity", "belonging"] },
  franchise: { franchisor: ["growth", "status", "security"], franchisee: ["freedom", "simplicity", "belonging"] },
  staffing: { owner: ["growth", "status"], recruiter: ["simplicity", "freedom"] },
  technology: { founder: ["growth", "status"], engineer: ["simplicity", "belonging"] },
  "professional-services": { partner: ["status", "growth"], consultant: ["freedom", "simplicity"] },
  education: { administrator: ["security", "growth"], faculty: ["simplicity", "belonging"] },
  immigration: { attorney: ["freedom", "growth", "status"], paralegal: ["simplicity", "security"] },
  financial: { advisor: ["status", "security", "growth"], analyst: ["simplicity", "belonging"] },
};

// ---------------------------------------------------------------------------
// Identity templates by persona
// ---------------------------------------------------------------------------

const IDENTITY_TEMPLATES: Record<PersonaType, { trait: string; reinforcement: string }[]> = {
  "decision-maker": [
    { trait: "makes bold moves that transform their business", reinforcement: "Decisive leaders see results 3x faster than those who wait" },
    { trait: "sees opportunities others miss", reinforcement: "Your ability to act on insight is what sets your business apart" },
  ],
  implementer: [
    { trait: "gets things done while others are still planning", reinforcement: "Execution is the only strategy that matters, and you know it" },
    { trait: "turns ideas into systems that scale", reinforcement: "Your implementation speed is your competitive advantage" },
  ],
  researcher: [
    { trait: "does their homework before making a move", reinforcement: "The most informed decisions produce the best outcomes, and you have the data" },
    { trait: "evaluates thoroughly and chooses wisely", reinforcement: "Your due diligence is about to pay off" },
  ],
  "budget-holder": [
    { trait: "invests where the ROI is clear and measurable", reinforcement: "Smart capital allocation separates growing firms from stagnant ones" },
    { trait: "protects the bottom line while investing in growth", reinforcement: "Every dollar you allocate here returns multiples within 90 days" },
  ],
  innovator: [
    { trait: "adopts proven systems before their competitors even hear about them", reinforcement: "Early adopters in your industry are already pulling ahead" },
    { trait: "builds the future while others maintain the status quo", reinforcement: "Innovation is not optional in your market anymore, and you know it" },
  ],
  pragmatist: [
    { trait: "demands practical solutions that work on day one", reinforcement: "No theory, no fluff. This is built for operators like you" },
    { trait: "values results over promises", reinforcement: "We measure success the same way you do: in revenue and time saved" },
  ],
};

// ---------------------------------------------------------------------------
// Identity-to-offer matching
// ---------------------------------------------------------------------------

const PERSONA_OFFER_AFFINITY: Record<PersonaType, string[]> = {
  "decision-maker": ["strategy-session", "executive-briefing", "roi-analysis"],
  implementer: ["free-trial", "setup-walkthrough", "integration-demo"],
  researcher: ["case-study", "comparison-guide", "white-paper"],
  "budget-holder": ["roi-calculator", "pricing-breakdown", "cost-comparison"],
  innovator: ["beta-access", "roadmap-preview", "innovation-workshop"],
  pragmatist: ["live-demo", "pilot-program", "results-guarantee"],
};

// ---------------------------------------------------------------------------
// Deep objection responses
// ---------------------------------------------------------------------------

interface DeepObjectionEntry {
  rootCause: string;
  deepResponse: string;
  reframe: string;
}

const DEEP_OBJECTIONS: Record<string, Record<string, DeepObjectionEntry>> = {
  "too expensive": {
    _default: {
      rootCause: "Fear of wasting money on something that might not work",
      deepResponse: "The real cost is not the investment. It is the revenue you lose every month without a system. Our clients recoup their investment in 3 weeks on average.",
      reframe: "This is not an expense. It is the difference between growing and staying stuck.",
    },
    construction: {
      rootCause: "Tight margins and fear of overhead that does not produce jobs",
      deepResponse: "One recovered bid pays for a full year. Contractors who automate follow-up see 28% more bid-to-contract conversions.",
      reframe: "Every dollar spent on follow-up automation returns $8 in won contracts.",
    },
    healthcare: {
      rootCause: "Already stretched budgets with insurance reimbursement pressures",
      deepResponse: "A 40% reduction in no-shows alone covers the cost within the first month. This pays for itself before your next billing cycle.",
      reframe: "You are already paying for empty appointment slots. This fills them.",
    },
    legal: {
      rootCause: "Uncertainty about ROI when billable hours are the priority",
      deepResponse: "Firms that automate intake see 2x more qualified consultations. That is 2x more retainers from the same marketing spend.",
      reframe: "Your marketing is already working. This ensures you capture every lead it generates.",
    },
  },
  "not the right time": {
    _default: {
      rootCause: "Overwhelmed by current workload and fear of adding complexity",
      deepResponse: "We handle 100% of the setup. Your team invests zero hours. Most clients are live in 5 business days without lifting a finger.",
      reframe: "The best time to plant a tree was 20 years ago. The second best time is today.",
    },
    staffing: {
      rootCause: "Peak hiring season leaves no bandwidth for new tools",
      deepResponse: "This is designed to work hardest during your busiest periods. Setup takes one hour of your time, and we handle the rest.",
      reframe: "Peak season is exactly when you need automation most. Every delayed submittal costs you a placement.",
    },
  },
  "need to think about it": {
    _default: {
      rootCause: "Unspoken concern they have not articulated, often comparison shopping or internal misalignment",
      deepResponse: "Totally fair. What specific question would help you feel confident? We can address it right now so you have everything you need to decide.",
      reframe: "The most successful clients started with a single question. What is yours?",
    },
  },
  "already have a solution": {
    _default: {
      rootCause: "Switching cost anxiety and sunk cost attachment to current tools",
      deepResponse: "We integrate with your existing tools. This fills the gaps, not replaces everything. Clients who add us to their stack see a 47% improvement in lead quality.",
      reframe: "Your current tools built the foundation. This is the layer that turns leads into revenue.",
    },
  },
  "need to talk to my partner": {
    _default: {
      rootCause: "Lack of confidence to champion the decision internally",
      deepResponse: "We provide a ready-to-share business case with projected ROI specific to your business. Makes the conversation easy.",
      reframe: "The best partners appreciate when someone brings a solution with the numbers already done.",
    },
  },
  "how do I know it works": {
    _default: {
      rootCause: "Past bad experiences with vendors who overpromised",
      deepResponse: "We publish verified case studies with real metrics. You can speak directly with current clients in your industry. And our results guarantee means we work for free until you see ROI.",
      reframe: "You do not have to trust our words. Trust our clients results and our guarantee.",
    },
    "real-estate": {
      rootCause: "Seen too many tech tools that do not translate to closed deals",
      deepResponse: "Agents using our system book 35% more showing appointments from the same lead volume. We track from first touch to close.",
      reframe: "We measure success the way you do: in closings, not clicks.",
    },
  },
  "I need to see a demo first": {
    _default: {
      rootCause: "Need to validate the product matches their mental model before committing",
      deepResponse: "Absolutely. Our demo is tailored to your specific use case. You will see your industry, your workflow, and your numbers.",
      reframe: "Smart move. The demo is where most clients go from interested to convinced.",
    },
  },
  "we tried something like this before": {
    _default: {
      rootCause: "Burned by a previous vendor, now risk-averse",
      deepResponse: "We hear that a lot. The difference is we are purpose-built for your industry, not a generic tool adapted for it. And our guarantee removes the risk entirely.",
      reframe: "The fact that you tried before means you know the problem is real. Now you need the right solution.",
    },
  },
  "not sure my team will use it": {
    _default: {
      rootCause: "Fear of adoption failure and wasted investment",
      deepResponse: "Our onboarding includes team training, and the system is designed to reduce work, not add it. Teams adopt it because it makes their job easier, not harder.",
      reframe: "Your team will use it because it saves them time. That is the only adoption strategy that works.",
    },
  },
  "let me do more research": {
    _default: {
      rootCause: "Information gathering as a delay tactic, or genuinely comparison shopping",
      deepResponse: "We encourage that. Here is our comparison guide against the top alternatives, our published case studies, and a direct line to a client in your industry.",
      reframe: "The research will confirm what you are already sensing. We will be here when you are ready.",
    },
  },
  "send me some information": {
    _default: {
      rootCause: "Polite way to end the conversation without committing",
      deepResponse: "Happy to. What specific aspect would be most useful? ROI projections, case studies, or a technical overview? I want to send you exactly what moves the needle.",
      reframe: "The most useful information is a 15-minute conversation tailored to your business. But I will send whatever helps most.",
    },
  },
  "I am not the decision maker": {
    _default: {
      rootCause: "Either genuinely not authorized, or using it as a shield",
      deepResponse: "Understood. We have a ready-made business case with ROI projections designed to make the internal pitch easy. Can I send that to you?",
      reframe: "Being the person who brings the solution is how decision-makers get noticed.",
    },
  },
  "the contract is too long": {
    _default: {
      rootCause: "Fear of being locked into something that does not deliver",
      deepResponse: "We offer month-to-month options because we believe the results keep you, not the contract. No lock-in required.",
      reframe: "If we do not earn your business every month, we do not deserve it.",
    },
  },
  "I do not see how this applies to my industry": {
    _default: {
      rootCause: "Skepticism that a general solution understands their niche",
      deepResponse: "We have templates, workflows, and case studies built specifically for your industry. Let me show you what other {niche} businesses achieved.",
      reframe: "We are not general purpose. We are built for businesses exactly like yours.",
    },
  },
  "what if it does not work for us": {
    _default: {
      rootCause: "Risk aversion and fear of being the exception",
      deepResponse: "Our guarantee means if it does not work, you pay nothing. We have a 93% success rate across all industries, and we will show you why.",
      reframe: "The only way to find out is to try, and we have removed all the risk.",
    },
  },
  "we do not have the budget right now": {
    _default: {
      rootCause: "Genuine cash flow constraints or prioritization issue",
      deepResponse: "We offer flexible payment options, and most clients see positive ROI within 3 weeks. The system pays for itself before the second invoice.",
      reframe: "The question is not whether you can afford to start. It is whether you can afford to wait another month.",
    },
  },
  "I need to see ROI first": {
    _default: {
      rootCause: "Needs quantifiable proof before committing resources",
      deepResponse: "Our ROI calculator uses your actual numbers. Most clients see a projected 340% return. And our guarantee backs it up.",
      reframe: "We will show you the ROI before you spend a dollar. That is what the assessment is for.",
    },
  },
  "it seems too good to be true": {
    _default: {
      rootCause: "Healthy skepticism, often from experienced buyers",
      deepResponse: "We get that. That is why we offer a results guarantee, publish verified case studies, and connect you with clients in your industry. The proof is in the numbers.",
      reframe: "Skepticism is healthy. We built our entire sales process around proving it, not just claiming it.",
    },
  },
  "we are happy with what we have": {
    _default: {
      rootCause: "Status quo bias and fear of disruption",
      deepResponse: "Most of our best clients said the same thing before they saw the gap. Our free assessment shows you exactly what you are leaving on the table, with zero obligation.",
      reframe: "Happy is good. But what if there is a version of your business that is dramatically better?",
    },
  },
  "can you just send me pricing": {
    _default: {
      rootCause: "Price anchoring before understanding value",
      deepResponse: "Absolutely. But pricing depends on your specific needs, and I do not want to over- or under-quote you. A 5-minute conversation gets you an accurate number tailored to your business.",
      reframe: "The right price depends on the right solution. Let us make sure you get both.",
    },
  },
};

// ---------------------------------------------------------------------------
// Hidden objection detection signals
// ---------------------------------------------------------------------------

interface BehaviorSignal {
  type: string;
  value?: string;
}

const HIDDEN_OBJECTION_PATTERNS: { signals: string[]; messagePatterns: RegExp[]; objection: string }[] = [
  {
    signals: ["pricing_page_view", "pricing_engagement"],
    messagePatterns: [/how much/i, /price/i, /cost/i, /afford/i],
    objection: "too expensive",
  },
  {
    signals: ["comparison_page_view"],
    messagePatterns: [/vs/i, /compare/i, /alternative/i, /competitor/i],
    objection: "already have a solution",
  },
  {
    signals: [],
    messagePatterns: [/team/i, /boss/i, /partner/i, /stakeholder/i, /manager/i],
    objection: "need to talk to my partner",
  },
  {
    signals: [],
    messagePatterns: [/tried before/i, /used to use/i, /did not work/i, /burned/i],
    objection: "we tried something like this before",
  },
  {
    signals: ["case_study_engagement", "social_proof_engagement"],
    messagePatterns: [/proof/i, /evidence/i, /guarantee/i, /review/i],
    objection: "how do I know it works",
  },
  {
    signals: [],
    messagePatterns: [/busy/i, /swamped/i, /right now/i, /maybe later/i, /next quarter/i],
    objection: "not the right time",
  },
];

// ---------------------------------------------------------------------------
// Emotional sequencing by funnel stage
// ---------------------------------------------------------------------------

const EMOTIONAL_SEQUENCES: Record<FunnelStage, { emotion: string; triggerType: string }[]> = {
  top: [
    { emotion: "curiosity", triggerType: "pattern-interrupt" },
    { emotion: "interest", triggerType: "relevance-hook" },
    { emotion: "awareness", triggerType: "problem-agitation" },
  ],
  middle: [
    { emotion: "trust", triggerType: "social-proof" },
    { emotion: "desire", triggerType: "outcome-visualization" },
    { emotion: "urgency", triggerType: "scarcity-signal" },
  ],
  bottom: [
    { emotion: "fear-of-missing-out", triggerType: "loss-aversion" },
    { emotion: "identity", triggerType: "self-concept-alignment" },
    { emotion: "commitment", triggerType: "micro-agreement" },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateFearTrigger(niche: string, painPoint: string): FearTrigger {
  const nicheMap = NICHE_FEAR_MAP[niche];
  if (nicheMap) {
    const painKey = Object.keys(nicheMap).find(
      (k) => k.toLowerCase() === painPoint.toLowerCase(),
    );
    if (painKey && nicheMap[painKey].length > 0) {
      const entry = nicheMap[painKey][0];
      return {
        niche,
        painPoint,
        message: entry.message,
        intensity: entry.intensity,
      };
    }
  }

  return {
    niche,
    painPoint,
    message: `Every day without addressing ${painPoint} puts your ${niche} business further behind`,
    intensity: "medium",
  };
}

export function mapPainToFear(niche: string, painPoints: string[]): FearTrigger[] {
  return painPoints.map((pain) => generateFearTrigger(niche, pain));
}

export function generateDesireTrigger(niche: string, aspirations: string[]): DesireTrigger[] {
  return aspirations.map((aspiration) => {
    const theme = resolveDesireTheme(aspiration);
    const templates = DESIRE_TEMPLATES[theme];
    const template = templates[0];
    const message = template
      .replace("{pain}", aspiration)
      .replace("{niche}", niche)
      .replace("{achieved outcome}", `transformed their ${aspiration}`)
      .replace("{current}", "where you are")
      .replace("{target}", "where you want to be");

    return { niche, aspiration, theme, message };
  });
}

export function mapAspirationToDesire(niche: string, segment: string): DesireTheme[] {
  const nicheMap = NICHE_DESIRE_MAP[niche];
  if (!nicheMap) return ["growth", "simplicity"];
  return nicheMap[segment] ?? ["growth", "simplicity"];
}

export function generateIdentityMessage(niche: string, persona: PersonaType): IdentityMessage {
  const templates = IDENTITY_TEMPLATES[persona];
  const selected = templates[0];
  const role = nicheToRole(niche);

  return {
    persona,
    role,
    message: `You are the kind of ${role} who ${selected.trait}`,
    reinforcement: selected.reinforcement,
  };
}

export function matchIdentityToOffer(persona: PersonaType, offers: string[]): string[] {
  const affinities = PERSONA_OFFER_AFFINITY[persona] ?? [];
  const matched = offers.filter((o) => affinities.includes(o));
  if (matched.length > 0) return matched;
  return offers.slice(0, 1);
}

export function generateDeepObjectionResponse(objection: string, niche: string): ObjectionResponse {
  const key = objection.toLowerCase().trim();
  const entry = DEEP_OBJECTIONS[key];

  if (!entry) {
    return {
      objection,
      surfaceResponse: `We understand your concern about "${objection}". Let us address that directly.`,
      rootCause: "Unidentified underlying concern",
      deepResponse: `Our team specializes in resolving exactly this type of concern for ${niche} businesses. Let us walk through it together.`,
      reframe: "Every concern is valid. The question is whether the cost of inaction outweighs the cost of action.",
    };
  }

  const nicheEntry = entry[niche] ?? entry["_default"];
  if (!nicheEntry) {
    return {
      objection,
      surfaceResponse: `We hear that often. Let us dig into what is really behind that.`,
      rootCause: "Unidentified underlying concern",
      deepResponse: `We can address this specifically for your ${niche} business.`,
      reframe: "The best decisions come from addressing concerns head-on.",
    };
  }

  return {
    objection,
    surfaceResponse: `We hear "${objection}" frequently from ${niche} businesses.`,
    rootCause: nicheEntry.rootCause,
    deepResponse: nicheEntry.deepResponse,
    reframe: nicheEntry.reframe,
  };
}

export function detectHiddenObjection(messages: string[], signals: BehaviorSignal[]): string[] {
  const detected = new Set<string>();
  const signalTypes = new Set(signals.map((s) => s.type));

  for (const pattern of HIDDEN_OBJECTION_PATTERNS) {
    const hasSignal = pattern.signals.length === 0 || pattern.signals.some((s) => signalTypes.has(s));
    const hasMessageMatch = messages.some((msg) =>
      pattern.messagePatterns.some((re) => re.test(msg)),
    );

    if (hasSignal && hasMessageMatch) {
      detected.add(pattern.objection);
    }
  }

  return [...detected];
}

export function generateEmotionalSequence(niche: string, funnelStage: FunnelStage): EmotionalSequence {
  const template = EMOTIONAL_SEQUENCES[funnelStage];
  const role = nicheToRole(niche);

  const steps = template.map((step) => ({
    emotion: step.emotion,
    trigger: step.triggerType,
    message: buildEmotionalMessage(step.emotion, step.triggerType, niche, role),
  }));

  return { stage: funnelStage, niche, steps };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveDesireTheme(aspiration: string): DesireTheme {
  const lower = aspiration.toLowerCase();
  if (lower.includes("free") || lower.includes("time") || lower.includes("automat")) return "freedom";
  if (lower.includes("lead") || lower.includes("reput") || lower.includes("brand")) return "status";
  if (lower.includes("safe") || lower.includes("protect") || lower.includes("secure") || lower.includes("stable")) return "security";
  if (lower.includes("grow") || lower.includes("scale") || lower.includes("revenue") || lower.includes("expan")) return "growth";
  if (lower.includes("simple") || lower.includes("easy") || lower.includes("streamline") || lower.includes("efficient")) return "simplicity";
  if (lower.includes("community") || lower.includes("network") || lower.includes("team") || lower.includes("together")) return "belonging";
  return "growth";
}

function nicheToRole(niche: string): string {
  const roleMap: Record<string, string> = {
    construction: "contractor",
    legal: "attorney",
    healthcare: "practitioner",
    "real-estate": "agent",
    "home-services": "business owner",
    franchise: "franchise operator",
    staffing: "staffing professional",
    technology: "tech leader",
    "professional-services": "consultant",
    education: "educator",
    immigration: "immigration attorney",
    financial: "financial advisor",
  };
  return roleMap[niche] ?? "business owner";
}

function buildEmotionalMessage(
  emotion: string,
  triggerType: string,
  niche: string,
  role: string,
): string {
  const messages: Record<string, Record<string, string>> = {
    curiosity: {
      "pattern-interrupt": `What if everything you know about growing your ${niche} business is holding you back?`,
    },
    interest: {
      "relevance-hook": `Here is what the top-performing ${role}s are doing differently right now`,
    },
    awareness: {
      "problem-agitation": `The average ${niche} business loses 23% of qualified leads to slow follow-up. Where do yours go?`,
    },
    trust: {
      "social-proof": `Hundreds of ${role}s trust this system to run their pipeline. Here is why.`,
    },
    desire: {
      "outcome-visualization": `Imagine opening your dashboard tomorrow and seeing a full pipeline of qualified, ready-to-buy leads`,
    },
    urgency: {
      "scarcity-signal": `Availability for onboarding this month is limited. ${role}s in your market are moving fast.`,
    },
    "fear-of-missing-out": {
      "loss-aversion": `Every day without this system, your competitors capture leads that should have been yours`,
    },
    identity: {
      "self-concept-alignment": `You are the kind of ${role} who acts on opportunity, not the kind who watches it pass by`,
    },
    commitment: {
      "micro-agreement": `Start with one small step: a free assessment. No commitment, just clarity.`,
    },
  };

  return messages[emotion]?.[triggerType] ?? `Discover what leading ${role}s in ${niche} already know`;
}
