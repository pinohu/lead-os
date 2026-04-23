export type PsychologyTriggerType =
  | "countdown"
  | "limited-slots"
  | "price-increase"
  | "seasonal"
  | "social-proof-velocity"
  | "testimonial"
  | "guarantee"
  | "certification"
  | "case-study"
  | "authority-badge"
  | "quiz-step"
  | "calculator-input"
  | "checklist-item"
  | "preference-select"
  | "progress-bar";

export interface PsychologyTrigger {
  id: string;
  type: PsychologyTriggerType;
  category: "urgency" | "trust" | "micro-commitment" | "social-proof";
  message: string;
  html?: string;
  priority: number;
  conditions: {
    minScore?: number;
    maxScore?: number;
    minTrustScore?: number;
    maxTrustScore?: number;
    stages?: string[];
    returning?: boolean;
    device?: string;
  };
}

export interface PsychologyProfile {
  leadScore: number;
  trustScore: number;
  urgencyScore: number;
  stage: string;
  returning: boolean;
  device: string;
  objections: string[];
  timeOnSite: number;
  pagesViewed: number;
}

export interface PsychologyDirective {
  triggers: PsychologyTrigger[];
  urgencyLevel: "none" | "low" | "medium" | "high" | "critical";
  trustLevel: "unknown" | "skeptical" | "neutral" | "warm" | "trusting";
  recommendedMicroCommitment: string | null;
  objectionResponses: { objection: string; response: string }[];
  socialProofType: string;
}

const URGENCY_TRIGGERS: PsychologyTrigger[] = [
  {
    id: "urg-countdown-24h",
    type: "countdown",
    category: "urgency",
    message: "This offer expires in less than 24 hours",
    html: `<div style="background:#fef3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;font-size:14px;font-weight:600;color:#856404;display:flex;align-items:center;gap:8px"><span style="font-size:18px">&#9201;</span> Offer expires in <span style="color:#d63384;font-weight:700">23:59:47</span></div>`,
    priority: 10,
    conditions: { minScore: 60 },
  },
  {
    id: "urg-limited-slots-3",
    type: "limited-slots",
    category: "urgency",
    message: "Only 3 consultation slots remain this week",
    html: `<div style="background:#f8d7da;border:1px solid #f5c6cb;border-radius:8px;padding:12px 16px;font-size:14px;font-weight:600;color:#721c24;display:flex;align-items:center;gap:8px"><span style="font-size:18px">&#128293;</span> Only <strong>3 slots</strong> left this week</div>`,
    priority: 9,
    conditions: { minScore: 50 },
  },
  {
    id: "urg-limited-slots-7",
    type: "limited-slots",
    category: "urgency",
    message: "7 spots remaining for this month",
    html: `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:10px 14px;font-size:13px;color:#856404"><strong>7 spots</strong> remaining for new clients this month</div>`,
    priority: 7,
    conditions: { minScore: 30, maxScore: 59 },
  },
  {
    id: "urg-price-increase",
    type: "price-increase",
    category: "urgency",
    message: "Pricing goes up next month. Lock in current rates today.",
    html: `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;padding:14px 18px;font-size:14px;font-weight:600;color:#fff">Lock in current pricing before rates increase next month</div>`,
    priority: 8,
    conditions: { minScore: 40 },
  },
  {
    id: "urg-seasonal-q4",
    type: "seasonal",
    category: "urgency",
    message: "Start before the new year to see results by Q1",
    html: `<div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:12px 16px;font-size:14px;color:#2e7d32"><strong>Start now</strong> to see measurable results by Q1</div>`,
    priority: 6,
    conditions: { minScore: 20 },
  },
  {
    id: "urg-social-velocity",
    type: "social-proof-velocity",
    category: "urgency",
    message: "12 businesses signed up in the last 48 hours",
    html: `<div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:12px 16px;font-size:14px;color:#1565c0;font-weight:600"><span style="font-size:16px">&#128200;</span> 12 businesses signed up in the last 48 hours</div>`,
    priority: 7,
    conditions: { minScore: 25 },
  },
];

const TRUST_TRIGGERS: PsychologyTrigger[] = [
  {
    id: "trust-testimonial-generic",
    type: "testimonial",
    category: "trust",
    message: "We doubled our qualified leads in 60 days. The ROI speaks for itself.",
    html: `<div style="background:#f5f5f5;border-left:4px solid #14b8a6;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#333"><p style="margin:0 0 8px;font-style:italic">&ldquo;We doubled our qualified leads in 60 days. The ROI speaks for itself.&rdquo;</p><p style="margin:0;font-size:12px;color:#666;font-weight:600">&mdash; Sarah M., Marketing Director</p></div>`,
    priority: 8,
    conditions: { maxTrustScore: 40 },
  },
  {
    id: "trust-testimonial-results",
    type: "testimonial",
    category: "trust",
    message: "47% increase in conversions within 30 days of implementation",
    html: `<div style="background:#fafafa;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#333"><p style="margin:0 0 8px;font-style:italic">&ldquo;47% increase in conversions within 30 days. Best investment we made this year.&rdquo;</p><p style="margin:0;font-size:12px;color:#666;font-weight:600">&mdash; James T., CEO</p></div>`,
    priority: 7,
    conditions: { maxTrustScore: 50 },
  },
  {
    id: "trust-guarantee-money-back",
    type: "guarantee",
    category: "trust",
    message: "30-day money-back guarantee. No questions asked.",
    html: `<div style="background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;padding:14px 18px;font-size:14px;color:#2e7d32;display:flex;align-items:center;gap:10px"><span style="font-size:24px">&#9989;</span><div><strong>30-Day Money-Back Guarantee</strong><br/><span style="font-size:12px">No questions asked. Zero risk to get started.</span></div></div>`,
    priority: 9,
    conditions: { maxTrustScore: 35 },
  },
  {
    id: "trust-guarantee-results",
    type: "guarantee",
    category: "trust",
    message: "Results guaranteed or we work for free until you see ROI",
    html: `<div style="background:#fff8e1;border:2px solid #ff9800;border-radius:8px;padding:14px 18px;font-size:14px;color:#e65100;display:flex;align-items:center;gap:10px"><span style="font-size:24px">&#127942;</span><div><strong>Results Guarantee</strong><br/><span style="font-size:12px">We work for free until you see positive ROI</span></div></div>`,
    priority: 8,
    conditions: { maxTrustScore: 30 },
  },
  {
    id: "trust-certification",
    type: "certification",
    category: "trust",
    message: "Certified partner with 500+ successful implementations",
    html: `<div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:12px 16px;font-size:13px;color:#6a1b9a;display:flex;align-items:center;gap:8px"><span style="font-size:18px">&#127941;</span> Certified partner &middot; 500+ successful implementations</div>`,
    priority: 6,
    conditions: { maxTrustScore: 60 },
  },
  {
    id: "trust-case-study",
    type: "case-study",
    category: "trust",
    message: "See how a business like yours grew 3x in 90 days",
    html: `<div style="background:#e0f2f1;border:1px solid #80cbc4;border-radius:8px;padding:14px 18px;font-size:14px;color:#004d40"><strong>Case Study:</strong> How a similar business grew leads by 3x in 90 days <a href="#" style="color:#00695c;font-weight:600;text-decoration:underline">Read more &rarr;</a></div>`,
    priority: 7,
    conditions: { maxTrustScore: 50 },
  },
  {
    id: "trust-authority-badge",
    type: "authority-badge",
    category: "trust",
    message: "Trusted by 200+ businesses across 15 industries",
    html: `<div style="display:flex;align-items:center;gap:12px;padding:10px 0"><div style="display:flex;gap:6px"><span style="background:#f0f0f0;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;color:#555">SOC 2</span><span style="background:#f0f0f0;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;color:#555">GDPR</span><span style="background:#f0f0f0;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;color:#555">ISO 27001</span></div><span style="font-size:12px;color:#888">Trusted by 200+ businesses</span></div>`,
    priority: 5,
    conditions: {},
  },
];

const MICRO_COMMITMENT_TRIGGERS: PsychologyTrigger[] = [
  {
    id: "mc-quiz-step",
    type: "quiz-step",
    category: "micro-commitment",
    message: "Answer 3 quick questions to get your personalized recommendation",
    html: `<div style="background:linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%);border-radius:12px;padding:20px;text-align:center"><p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#00695c">Get Your Free Assessment</p><p style="margin:0 0 16px;font-size:13px;color:#00897b">Answer 3 quick questions for a personalized recommendation</p><div style="display:flex;justify-content:center;gap:8px"><span style="width:32px;height:4px;border-radius:2px;background:#00897b"></span><span style="width:32px;height:4px;border-radius:2px;background:#b2dfdb"></span><span style="width:32px;height:4px;border-radius:2px;background:#b2dfdb"></span></div></div>`,
    priority: 8,
    conditions: { maxScore: 40 },
  },
  {
    id: "mc-calculator-input",
    type: "calculator-input",
    category: "micro-commitment",
    message: "Calculate your potential ROI in 30 seconds",
    html: `<div style="background:#fff;border:2px solid #14b8a6;border-radius:12px;padding:20px;text-align:center"><p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f766e">ROI Calculator</p><p style="margin:0 0 14px;font-size:13px;color:#666">See your potential return in 30 seconds</p><button style="background:#14b8a6;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer">Calculate My ROI</button></div>`,
    priority: 7,
    conditions: { maxScore: 50 },
  },
  {
    id: "mc-checklist-item",
    type: "checklist-item",
    category: "micro-commitment",
    message: "Download our free growth checklist",
    html: `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;font-size:14px;color:#166534;display:flex;align-items:center;gap:10px"><span style="font-size:18px">&#9745;</span><div><strong>Free Growth Checklist</strong><br/><span style="font-size:12px">7 steps to optimize your lead pipeline</span></div></div>`,
    priority: 6,
    conditions: { maxScore: 35 },
  },
  {
    id: "mc-preference-select",
    type: "preference-select",
    category: "micro-commitment",
    message: "Tell us what matters most to you",
    html: `<div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;padding:16px"><p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#333">What is your biggest challenge?</p><div style="display:flex;flex-wrap:wrap;gap:8px"><button style="background:#fff;border:1px solid #ccc;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer">Getting more leads</button><button style="background:#fff;border:1px solid #ccc;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer">Converting leads</button><button style="background:#fff;border:1px solid #ccc;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer">Follow-up automation</button></div></div>`,
    priority: 5,
    conditions: { maxScore: 30 },
  },
  {
    id: "mc-progress-bar-start",
    type: "progress-bar",
    category: "micro-commitment",
    message: "You are 25% of the way to your personalized growth plan",
    html: `<div style="padding:8px 0"><div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:4px"><span>Your Growth Plan</span><span>25% complete</span></div><div style="background:#e0e0e0;border-radius:4px;height:6px;overflow:hidden"><div style="background:linear-gradient(90deg,#14b8a6,#06b6d4);width:25%;height:100%;border-radius:4px"></div></div></div>`,
    priority: 4,
    conditions: { maxScore: 45 },
  },
  {
    id: "mc-progress-bar-mid",
    type: "progress-bar",
    category: "micro-commitment",
    message: "You are 60% of the way to your personalized growth plan",
    html: `<div style="padding:8px 0"><div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:4px"><span>Your Growth Plan</span><span>60% complete</span></div><div style="background:#e0e0e0;border-radius:4px;height:6px;overflow:hidden"><div style="background:linear-gradient(90deg,#14b8a6,#06b6d4);width:60%;height:100%;border-radius:4px"></div></div></div>`,
    priority: 4,
    conditions: { minScore: 45, maxScore: 70 },
  },
];

const SOCIAL_PROOF_TRIGGERS: PsychologyTrigger[] = [
  {
    id: "sp-velocity-recent",
    type: "social-proof-velocity",
    category: "social-proof",
    message: "8 people are viewing this page right now",
    html: `<div style="background:#e8eaf6;border:1px solid #c5cae9;border-radius:8px;padding:10px 14px;font-size:13px;color:#283593;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4caf50;animation:pulse 2s infinite"></span> 8 people viewing this right now</div>`,
    priority: 6,
    conditions: { returning: true },
  },
  {
    id: "sp-testimonial-niche",
    type: "testimonial",
    category: "social-proof",
    message: "Join hundreds of businesses already growing with us",
    html: `<div style="background:#f5f5f5;border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px"><div style="display:flex"><span style="width:32px;height:32px;border-radius:50%;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-left:-8px;border:2px solid #fff">S</span><span style="width:32px;height:32px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-left:-8px;border:2px solid #fff">J</span><span style="width:32px;height:32px;border-radius:50%;background:#8b5cf6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-left:-8px;border:2px solid #fff">M</span></div><span style="font-size:13px;color:#555">Join <strong>200+</strong> businesses already growing</span></div>`,
    priority: 5,
    conditions: {},
  },
  {
    id: "sp-case-study-link",
    type: "case-study",
    category: "social-proof",
    message: "Read how similar businesses achieved 3x growth",
    html: `<a href="#case-studies" style="display:block;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:14px 18px;font-size:14px;color:#495057;text-decoration:none"><strong style="color:#212529">Success Stories</strong><br/><span style="font-size:12px">See how businesses like yours achieved 3x growth &rarr;</span></a>`,
    priority: 6,
    conditions: { stages: ["awareness", "consideration"] },
  },
];

const ALL_TRIGGERS: PsychologyTrigger[] = [
  ...URGENCY_TRIGGERS,
  ...TRUST_TRIGGERS,
  ...MICRO_COMMITMENT_TRIGGERS,
  ...SOCIAL_PROOF_TRIGGERS,
];

const OBJECTION_RESPONSES: Record<string, { objection: string; response: string }> = {
  price: {
    objection: "price",
    response: "Our clients see an average 340% ROI within 90 days. The system pays for itself in the first month through automated lead capture and conversion. Plus, our 30-day money-back guarantee means zero financial risk.",
  },
  cost: {
    objection: "cost",
    response: "Consider the cost of not acting: every month without a system, you lose leads to competitors. Our ROI calculator shows most businesses recoup their investment within 3 weeks.",
  },
  trust: {
    objection: "trust",
    response: "We are trusted by 200+ businesses with a 97% client retention rate. Every engagement comes with a written guarantee, and we are certified and independently audited.",
  },
  timing: {
    objection: "timing",
    response: "The best time to start was yesterday. We handle 100% of the setup, so your team invests zero hours. Most clients are fully live within 5 business days.",
  },
  complexity: {
    objection: "complexity",
    response: "Our system is designed to be hands-off. Start with a simple 3-question assessment, and we build your entire pipeline from there. No technical skills required.",
  },
  "already-have": {
    objection: "already-have",
    response: "Our platform integrates with your existing tools and fills the gaps. Most clients who switch see a 47% improvement in lead quality within the first month.",
  },
  competitor: {
    objection: "competitor",
    response: "Unlike generic CRMs, our system is purpose-built for lead conversion with AI-driven routing. Clients who switch from competitors see 2.3x more qualified meetings booked.",
  },
  "need-approval": {
    objection: "need-approval",
    response: "We provide a ready-to-share business case with projected ROI. Our free assessment gives you the data points your team needs to make a confident decision.",
  },
  results: {
    objection: "results",
    response: "Our results guarantee means we work for free until you see positive ROI. We publish case studies with verifiable metrics, and you can speak directly with current clients.",
  },
  time: {
    objection: "time",
    response: "Setup takes less than 1 hour of your time. We handle everything else. Our onboarding team walks you through each step so nothing falls through the cracks.",
  },
};

function matchesTriggerConditions(trigger: PsychologyTrigger, profile: PsychologyProfile): boolean {
  const c = trigger.conditions;

  if (c.minScore !== undefined && profile.leadScore < c.minScore) return false;
  if (c.maxScore !== undefined && profile.leadScore > c.maxScore) return false;
  if (c.minTrustScore !== undefined && profile.trustScore < c.minTrustScore) return false;
  if (c.maxTrustScore !== undefined && profile.trustScore > c.maxTrustScore) return false;
  if (c.stages && c.stages.length > 0 && !c.stages.includes(profile.stage)) return false;
  if (c.returning !== undefined && c.returning !== profile.returning) return false;
  if (c.device && c.device !== profile.device) return false;

  return true;
}

function resolveUrgencyLevel(urgencyScore: number): PsychologyDirective["urgencyLevel"] {
  if (urgencyScore >= 80) return "critical";
  if (urgencyScore >= 60) return "high";
  if (urgencyScore >= 40) return "medium";
  if (urgencyScore >= 20) return "low";
  return "none";
}

function resolveTrustLevel(trustScore: number): PsychologyDirective["trustLevel"] {
  if (trustScore >= 80) return "trusting";
  if (trustScore >= 60) return "warm";
  if (trustScore >= 40) return "neutral";
  if (trustScore >= 20) return "skeptical";
  return "unknown";
}

function selectMicroCommitment(score: number, pagesViewed: number): string | null {
  if (score < 20 && pagesViewed < 2) return "preference-select";
  if (score < 30) return "checklist-item";
  if (score < 45) return "quiz-step";
  if (score < 60) return "calculator-input";
  return null;
}

function resolveSocialProofType(profile: PsychologyProfile): string {
  if (profile.returning) return "social-proof-velocity";
  if (profile.trustScore < 30) return "testimonial";
  if (profile.stage === "awareness" || profile.stage === "consideration") return "case-study";
  return "testimonial";
}

export function getUrgencyTriggers(urgencyScore: number, stage: string): PsychologyTrigger[] {
  const profile: PsychologyProfile = {
    leadScore: urgencyScore,
    trustScore: 50,
    urgencyScore,
    stage,
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 0,
    pagesViewed: 0,
  };

  return URGENCY_TRIGGERS
    .filter((t) => matchesTriggerConditions(t, profile))
    .sort((a, b) => b.priority - a.priority);
}

export function getTrustTriggers(trustScore: number, stage: string): PsychologyTrigger[] {
  const profile: PsychologyProfile = {
    leadScore: 50,
    trustScore,
    urgencyScore: 0,
    stage,
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 0,
    pagesViewed: 0,
  };

  return TRUST_TRIGGERS
    .filter((t) => matchesTriggerConditions(t, profile))
    .sort((a, b) => b.priority - a.priority);
}

export function getMicroCommitments(score: number, pagesViewed: number): PsychologyTrigger[] {
  const profile: PsychologyProfile = {
    leadScore: score,
    trustScore: 50,
    urgencyScore: 0,
    stage: "awareness",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 0,
    pagesViewed,
  };

  return MICRO_COMMITMENT_TRIGGERS
    .filter((t) => matchesTriggerConditions(t, profile))
    .sort((a, b) => b.priority - a.priority);
}

export function resolveObjections(
  objections: string[],
): { objection: string; response: string }[] {
  return objections
    .map((o) => {
      const key = o.toLowerCase().trim();
      return OBJECTION_RESPONSES[key] ?? {
        objection: o,
        response: `We understand your concern about ${o}. Our team would be happy to address this directly. Book a quick 15-minute call to discuss how we handle this for clients in your situation.`,
      };
    });
}

export function generateSocialProof(
  niche: string,
  stats?: { customers?: number; conversions?: number },
): string {
  const customers = stats?.customers ?? 200;
  const conversions = stats?.conversions ?? 1500;

  const nicheLabel = niche === "general" ? "service businesses" : `${niche} businesses`;

  return `Trusted by ${customers}+ ${nicheLabel} with over ${conversions.toLocaleString()} successful conversions. Join the fastest-growing community of businesses automating their lead pipeline.`;
}

export function evaluatePsychology(profile: PsychologyProfile): PsychologyDirective {
  const matchingTriggers = ALL_TRIGGERS
    .filter((t) => matchesTriggerConditions(t, profile))
    .sort((a, b) => b.priority - a.priority);

  const urgencyTriggers = matchingTriggers.filter((t) => t.category === "urgency").slice(0, 2);
  const trustTriggers = matchingTriggers.filter((t) => t.category === "trust").slice(0, 3);
  const mcTriggers = matchingTriggers.filter((t) => t.category === "micro-commitment").slice(0, 2);
  const spTriggers = matchingTriggers.filter((t) => t.category === "social-proof").slice(0, 2);

  const selectedTriggers: PsychologyTrigger[] = [];

  if (profile.urgencyScore >= 40) {
    selectedTriggers.push(...urgencyTriggers);
  }

  if (profile.trustScore < 60) {
    selectedTriggers.push(...trustTriggers);
  }

  if (!profile.returning && profile.leadScore < 50) {
    selectedTriggers.push(...mcTriggers);
  }

  if (profile.returning || profile.trustScore >= 40) {
    selectedTriggers.push(...spTriggers);
  }

  if (selectedTriggers.length === 0) {
    selectedTriggers.push(...matchingTriggers.slice(0, 3));
  }

  const uniqueTriggers = selectedTriggers.filter(
    (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i,
  );

  return {
    triggers: uniqueTriggers.sort((a, b) => b.priority - a.priority),
    urgencyLevel: resolveUrgencyLevel(profile.urgencyScore),
    trustLevel: resolveTrustLevel(profile.trustScore),
    recommendedMicroCommitment: selectMicroCommitment(profile.leadScore, profile.pagesViewed),
    objectionResponses: resolveObjections(profile.objections),
    socialProofType: resolveSocialProofType(profile),
  };
}

export function listAllTriggers(): PsychologyTrigger[] {
  return [...ALL_TRIGGERS];
}
