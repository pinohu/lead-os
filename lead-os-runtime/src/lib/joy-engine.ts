/* ------------------------------------------------------------------ */
/*  Joy Engine – milestone detection, time-saved calc, morning brief  */
/* ------------------------------------------------------------------ */

// --------------- types ---------------

export interface JoyMilestone {
  id: string;
  tenantId: string;
  type:
    | "revenue"
    | "leads"
    | "conversion"
    | "time-saved"
    | "streak"
    | "first"
    | "growth";
  title: string;
  message: string;
  metric: string;
  value: number;
  previousValue: number;
  celebrationLevel: "small" | "medium" | "big" | "epic";
  detectedAt: string;
  acknowledged: boolean;
}

export interface TimeSavedReport {
  tenantId: string;
  periodLabel: string;
  totalHoursSaved: number;
  breakdown: Array<{
    category: string;
    hoursSaved: number;
    automationsRun: number;
    description: string;
  }>;
  equivalentValue: number; // at $150/hr
  personalMessage: string;
}

export interface MorningBriefing {
  tenantId: string;
  generatedAt: string;
  greeting: string;
  summary: string;
  wins: string[];
  attentionItems: Array<{
    priority: "low" | "medium" | "high";
    message: string;
    actionUrl: string;
  }>;
  timeSaved: TimeSavedReport;
  milestones: JoyMilestone[];
  recommendation: string;
}

export interface TenantMetrics {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsOvernight: number;
  mrr: number;
  conversionRate: number;
  previousConversionRate: number;
  consecutiveLeadDays: number;
  totalHoursSaved: number;
  consecutiveGrowthMonths: number;
  overnightConversions: number;
  overnightRevenue: number;
  overnightBookings: number;
  warmLeadsNoFollowUp: number;
  hotLeadsNoBooking: number;
  pipelineCount: number;
  emailFollowUpsSent: number;
  leadsScored: number;
  reportsGenerated: number;
  intakesProcessed: number;
  nurtureSequencesActive: number;
  bookingsScheduled: number;
  daysSinceLastLogin: number;
  leadVelocityTrend: number; // negative = declining
}

// --------------- in-memory stores (swap for DB in prod) ---------------

const milestoneStore: Map<string, JoyMilestone[]> = new Map();

function storeMilestone(m: JoyMilestone) {
  const list = milestoneStore.get(m.tenantId) ?? [];
  list.push(m);
  milestoneStore.set(m.tenantId, list);
}

export function getMilestones(tenantId: string): JoyMilestone[] {
  return milestoneStore.get(tenantId) ?? [];
}

export function acknowledgeMilestone(
  tenantId: string,
  milestoneId: string,
): boolean {
  const list = milestoneStore.get(tenantId);
  if (!list) return false;
  const m = list.find((x) => x.id === milestoneId);
  if (!m) return false;
  m.acknowledged = true;
  return true;
}

// --------------- helpers ---------------

function uid(): string {
  return `joy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeMilestone(
  tenantId: string,
  partial: Omit<JoyMilestone, "id" | "tenantId" | "detectedAt" | "acknowledged">,
): JoyMilestone {
  return {
    id: uid(),
    tenantId,
    detectedAt: new Date().toISOString(),
    acknowledged: false,
    ...partial,
  };
}

// --------------- detectMilestones ---------------

export async function detectMilestones(
  tenantId: string,
  current: TenantMetrics,
  previous: TenantMetrics,
): Promise<JoyMilestone[]> {
  const found: JoyMilestone[] = [];

  // -- lead milestones --
  const leadThresholds: Array<{
    n: number;
    level: JoyMilestone["celebrationLevel"];
    title: string;
  }> = [
    { n: 1, level: "medium", title: "Your very first lead!" },
    { n: 10, level: "small", title: "Double digits!" },
    { n: 50, level: "medium", title: "50 leads captured" },
    { n: 100, level: "big", title: "Triple digits!" },
    { n: 500, level: "big", title: "500 leads - you're a magnet" },
    { n: 1000, level: "epic", title: "1,000 leads. Legendary." },
  ];
  for (const t of leadThresholds) {
    if (current.totalLeads >= t.n && previous.totalLeads < t.n) {
      const m = makeMilestone(tenantId, {
        type: t.n === 1 ? "first" : "leads",
        title: t.title,
        message:
          t.n === 1
            ? "Your first lead just came in! The system is working for you."
            : `You've captured ${t.n.toLocaleString()} leads. Every single one is a person who raised their hand.`,
        metric: `${t.n.toLocaleString()} leads`,
        value: current.totalLeads,
        previousValue: previous.totalLeads,
        celebrationLevel: t.level,
      });
      found.push(m);
      storeMilestone(m);
    }
  }

  // -- MRR milestones --
  const mrrThresholds: Array<{
    amount: number;
    level: JoyMilestone["celebrationLevel"];
  }> = [
    { amount: 1_000, level: "medium" },
    { amount: 5_000, level: "big" },
    { amount: 10_000, level: "big" },
    { amount: 25_000, level: "epic" },
    { amount: 50_000, level: "epic" },
    { amount: 100_000, level: "epic" },
  ];
  for (const t of mrrThresholds) {
    if (current.mrr >= t.amount && previous.mrr < t.amount) {
      const label = `$${(t.amount / 1_000).toFixed(0)}K MRR`;
      const m = makeMilestone(tenantId, {
        type: "revenue",
        title: `${label} reached!`,
        message: `You just crossed ${label}. This is real, recurring revenue you built.`,
        metric: label,
        value: current.mrr,
        previousValue: previous.mrr,
        celebrationLevel: t.level,
      });
      found.push(m);
      storeMilestone(m);
    }
  }

  // -- conversion rate improvement --
  if (
    previous.conversionRate > 0 &&
    current.conversionRate > previous.conversionRate
  ) {
    const pctChange =
      ((current.conversionRate - previous.conversionRate) /
        previous.conversionRate) *
      100;
    if (pctChange >= 5) {
      const m = makeMilestone(tenantId, {
        type: "conversion",
        title: "Conversion rate is climbing",
        message: `Your conversion rate improved ${pctChange.toFixed(1)}% week-over-week. The funnel is getting tighter.`,
        metric: `+${pctChange.toFixed(1)}% conversion`,
        value: current.conversionRate,
        previousValue: previous.conversionRate,
        celebrationLevel: pctChange >= 20 ? "big" : "medium",
      });
      found.push(m);
      storeMilestone(m);
    }
  }

  // -- streak: 7 consecutive days --
  if (current.consecutiveLeadDays >= 7 && previous.consecutiveLeadDays < 7) {
    const m = makeMilestone(tenantId, {
      type: "streak",
      title: "7-day lead streak!",
      message:
        "Leads every single day for a week straight. Your pipeline never sleeps.",
      metric: "7-day streak",
      value: 7,
      previousValue: previous.consecutiveLeadDays,
      celebrationLevel: "medium",
    });
    found.push(m);
    storeMilestone(m);
  }

  // -- time saved milestones --
  const timeThresholds: Array<{
    hrs: number;
    level: JoyMilestone["celebrationLevel"];
    msg: string;
  }> = [
    { hrs: 10, level: "small", msg: "That's more than a full workday you got back." },
    { hrs: 50, level: "medium", msg: "That's an entire work week. Reclaimed." },
    { hrs: 100, level: "big", msg: "100 hours. Two and a half work weeks. All yours." },
    { hrs: 500, level: "epic", msg: "500 hours saved. That's 12 full work weeks. You built a machine." },
  ];
  for (const t of timeThresholds) {
    if (current.totalHoursSaved >= t.hrs && previous.totalHoursSaved < t.hrs) {
      const m = makeMilestone(tenantId, {
        type: "time-saved",
        title: `${t.hrs} hours saved`,
        message: t.msg,
        metric: `${t.hrs}+ hours`,
        value: current.totalHoursSaved,
        previousValue: previous.totalHoursSaved,
        celebrationLevel: t.level,
      });
      found.push(m);
      storeMilestone(m);
    }
  }

  // -- growth: 3 consecutive months --
  if (
    current.consecutiveGrowthMonths >= 3 &&
    previous.consecutiveGrowthMonths < 3
  ) {
    const m = makeMilestone(tenantId, {
      type: "growth",
      title: "3 months of growth",
      message:
        "Three consecutive months of growth. That's not luck — that's a system.",
      metric: "3-month growth streak",
      value: 3,
      previousValue: previous.consecutiveGrowthMonths,
      celebrationLevel: "big",
    });
    found.push(m);
    storeMilestone(m);
  }

  return found;
}

// --------------- calculateTimeSaved ---------------

export async function calculateTimeSaved(
  tenantId: string,
  periodDays: number = 30,
  metrics?: TenantMetrics,
): Promise<TimeSavedReport> {
  // In production, pull from activity logs. Here we use provided metrics or
  // sensible defaults so the system always has something to show.
  const m: TenantMetrics = metrics ?? {
    totalLeads: 0,
    newLeadsToday: 0,
    newLeadsOvernight: 0,
    mrr: 0,
    conversionRate: 0,
    previousConversionRate: 0,
    consecutiveLeadDays: 0,
    totalHoursSaved: 0,
    consecutiveGrowthMonths: 0,
    overnightConversions: 0,
    overnightRevenue: 0,
    overnightBookings: 0,
    warmLeadsNoFollowUp: 0,
    hotLeadsNoBooking: 0,
    pipelineCount: 0,
    emailFollowUpsSent: 42,
    leadsScored: 28,
    reportsGenerated: 4,
    intakesProcessed: 15,
    nurtureSequencesActive: 3,
    bookingsScheduled: 9,
    daysSinceLastLogin: 0,
    leadVelocityTrend: 0,
  };

  const breakdown: TimeSavedReport["breakdown"] = [
    {
      category: "Email follow-ups",
      hoursSaved: round((m.emailFollowUpsSent * 2) / 60),
      automationsRun: m.emailFollowUpsSent,
      description: `${m.emailFollowUpsSent} follow-ups sent automatically — no copy-paste required`,
    },
    {
      category: "Lead scoring",
      hoursSaved: round((m.leadsScored * 5) / 60),
      automationsRun: m.leadsScored,
      description: `${m.leadsScored} leads scored and prioritized while you focused on closing`,
    },
    {
      category: "Report generation",
      hoursSaved: round((m.reportsGenerated * 30) / 60),
      automationsRun: m.reportsGenerated,
      description: `${m.reportsGenerated} reports built and delivered without lifting a finger`,
    },
    {
      category: "Intake processing",
      hoursSaved: round((m.intakesProcessed * 3) / 60),
      automationsRun: m.intakesProcessed,
      description: `${m.intakesProcessed} new intakes processed, organized, and routed`,
    },
    {
      category: "Nurture sequences",
      hoursSaved: round((m.nurtureSequencesActive * 10) / 60),
      automationsRun: m.nurtureSequencesActive,
      description: `${m.nurtureSequencesActive} active nurture sequences running on autopilot`,
    },
    {
      category: "Booking & scheduling",
      hoursSaved: round((m.bookingsScheduled * 5) / 60),
      automationsRun: m.bookingsScheduled,
      description: `${m.bookingsScheduled} appointments booked without the back-and-forth`,
    },
  ];

  const totalHoursSaved = round(
    breakdown.reduce((sum, b) => sum + b.hoursSaved, 0),
  );
  const equivalentValue = Math.round(totalHoursSaved * 150);

  const personalMessage = buildTimeSavedMessage(totalHoursSaved, periodDays);

  return {
    tenantId,
    periodLabel: `Last ${periodDays} days`,
    totalHoursSaved,
    breakdown,
    equivalentValue,
    personalMessage,
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildTimeSavedMessage(hours: number, periodDays: number): string {
  if (hours <= 0) return "Your automations are warming up. The savings will start flowing soon.";
  const workdays = round(hours / 8);
  if (hours < 2) return `${hours} hours back in your pocket this period. It adds up fast.`;
  if (hours < 8) return `${hours} hours saved — almost a full workday you didn't have to spend.`;
  if (hours < 24)
    return `That's ${workdays} full workdays you got back in ${periodDays} days. Not bad at all.`;
  if (hours < 80)
    return `${hours} hours saved. That's ${workdays} workdays. Imagine what you'll do with all that time.`;
  return `${hours} hours saved — ${workdays} full workdays. You basically hired an employee and it never calls in sick.`;
}

// --------------- generateMorningBriefing ---------------

export async function generateMorningBriefing(
  tenantId: string,
  metrics?: TenantMetrics,
): Promise<MorningBriefing> {
  // In production these come from the database / analytics layer.
  const m: TenantMetrics = metrics ?? {
    totalLeads: 137,
    newLeadsToday: 3,
    newLeadsOvernight: 3,
    mrr: 4250,
    conversionRate: 14.2,
    previousConversionRate: 12.8,
    consecutiveLeadDays: 5,
    totalHoursSaved: 47,
    consecutiveGrowthMonths: 2,
    overnightConversions: 2,
    overnightRevenue: 850,
    overnightBookings: 2,
    warmLeadsNoFollowUp: 2,
    hotLeadsNoBooking: 1,
    pipelineCount: 6,
    emailFollowUpsSent: 42,
    leadsScored: 28,
    reportsGenerated: 4,
    intakesProcessed: 15,
    nurtureSequencesActive: 3,
    bookingsScheduled: 9,
    daysSinceLastLogin: 0,
    leadVelocityTrend: 5,
  };

  const now = new Date();
  const hour = now.getHours();

  // -- greeting --
  let timeGreeting: string;
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";
  else timeGreeting = "Good evening";

  const greeting =
    m.newLeadsOvernight > 0
      ? `${timeGreeting}! While you were away, ${m.newLeadsOvernight} new lead${m.newLeadsOvernight === 1 ? "" : "s"} came in${m.overnightBookings > 0 ? ` and ${m.overnightBookings} prospect${m.overnightBookings === 1 ? "" : "s"} booked consultations` : ""}.`
      : `${timeGreeting}! Everything is running smoothly. Your system is working for you.`;

  // -- summary --
  const summaryParts: string[] = [];
  if (m.newLeadsOvernight > 0)
    summaryParts.push(`${m.newLeadsOvernight} new lead${m.newLeadsOvernight === 1 ? "" : "s"}`);
  if (m.overnightConversions > 0)
    summaryParts.push(`${m.overnightConversions} conversion${m.overnightConversions === 1 ? "" : "s"}`);
  if (m.overnightRevenue > 0)
    summaryParts.push(`$${m.overnightRevenue.toLocaleString()} in new revenue`);

  const summary =
    summaryParts.length > 0
      ? `Overnight: ${summaryParts.join(", ")}. Your pipeline has ${m.pipelineCount} active opportunities.`
      : "A quiet night. Sometimes that's the best kind. Your automations are standing by.";

  // -- wins --
  const wins: string[] = [];
  if (m.newLeadsOvernight > 0)
    wins.push(`${m.newLeadsOvernight} new lead${m.newLeadsOvernight === 1 ? "" : "s"} captured while you slept`);
  if (m.overnightBookings > 0)
    wins.push(`${m.overnightBookings} consultation${m.overnightBookings === 1 ? "" : "s"} booked automatically`);
  if (m.conversionRate > m.previousConversionRate) {
    const improvement = round(
      ((m.conversionRate - m.previousConversionRate) / m.previousConversionRate) * 100,
    );
    wins.push(`Conversion rate up ${improvement}% week-over-week`);
  }
  if (m.consecutiveLeadDays >= 5)
    wins.push(`${m.consecutiveLeadDays}-day lead streak and counting`);
  if (m.emailFollowUpsSent > 10)
    wins.push(`${m.emailFollowUpsSent} follow-ups sent on autopilot this period`);

  // -- attention items --
  const attentionItems: MorningBriefing["attentionItems"] = [];
  if (m.hotLeadsNoBooking > 0) {
    attentionItems.push({
      priority: "high",
      message: `${m.hotLeadsNoBooking} hot lead${m.hotLeadsNoBooking === 1 ? " has" : "s have"} no booking yet — a quick follow-up could close the deal`,
      actionUrl: "/dashboard/leads?status=hot&noBooking=true",
    });
  }
  if (m.warmLeadsNoFollowUp > 0) {
    attentionItems.push({
      priority: "medium",
      message: `${m.warmLeadsNoFollowUp} warm lead${m.warmLeadsNoFollowUp === 1 ? "" : "s"} waiting for a follow-up`,
      actionUrl: "/dashboard/leads?status=warm&noFollowUp=true",
    });
  }
  if (m.pipelineCount < 3) {
    attentionItems.push({
      priority: "medium",
      message:
        "Your pipeline is thin — consider activating a new lead source or running a campaign",
      actionUrl: "/dashboard/leads",
    });
  }

  // -- time saved --
  const timeSaved = await calculateTimeSaved(tenantId, 30, m);

  // -- milestones (unacknowledged) --
  const milestones = getMilestones(tenantId).filter((x) => !x.acknowledged);

  // -- recommendation --
  let recommendation: string;
  if (m.hotLeadsNoBooking > 0)
    recommendation =
      "Reach out to your hot leads. They're interested — a personal touch today could turn interest into revenue.";
  else if (m.pipelineCount < 3)
    recommendation =
      "Your pipeline could use some love. Spend 20 minutes activating a new channel or re-engaging past prospects.";
  else if (m.conversionRate < m.previousConversionRate)
    recommendation =
      "Your conversion rate dipped. Review your last 5 lost deals and look for a pattern.";
  else if (m.warmLeadsNoFollowUp > 0)
    recommendation =
      "Follow up with your warm leads before they cool off. Timing is everything.";
  else
    recommendation =
      "You're in great shape. Use today to work ON the business, not in it. Update your offer, refine your messaging, or plan your next campaign.";

  return {
    tenantId,
    generatedAt: now.toISOString(),
    greeting,
    summary,
    wins,
    attentionItems,
    timeSaved,
    milestones,
    recommendation,
  };
}
