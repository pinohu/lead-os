import { randomUUID } from "crypto";
import { runRevenuePipeline, type PipelineResult } from "./revenue-pipeline.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyntheticLead {
  leadKey: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  company?: string;
  companySize?: string;
  source: string;
  niche: string;
  service?: string;
  pagesViewed: number;
  timeOnSite: number;
  formCompletions: number;
  chatMessages: number;
  returnVisits: number;
  assessmentCompleted: boolean;
  calculatorUsed: boolean;
  urgencyIndicators: string[];
  budget?: string;
  timeline?: string;
  estimatedDealValue?: number;
  returning: boolean;
  device: string;
}

export interface CalibrationReport {
  id: string;
  nicheSlug: string;
  sampleSize: number;
  routeDistribution: Record<string, number>;
  routePercentages: Record<string, number>;
  averageScores: {
    intent: number;
    fit: number;
    engagement: number;
    urgency: number;
    composite: number;
  };
  stageFailureRates: Record<string, number>;
  avgPipelineDurationMs: number;
  offerCount: number;
  uniqueOfferHeadlines: string[];
  psychologyTriggerDistribution: Record<string, number>;
  escalationRate: number;
  estimatedRevenuePotential: number;
  recommendations: string[];
  generatedAt: string;
  results: PipelineResult[];
}

// ---------------------------------------------------------------------------
// Source options
// ---------------------------------------------------------------------------

const SOURCES = ["google-ads", "referral", "organic", "facebook"];
const DEVICES = ["desktop", "mobile", "tablet"];
const TIMELINES = ["immediate", "this-week", "this-month", "this-quarter", "exploring"];

// ---------------------------------------------------------------------------
// Niche-specific lead templates
// ---------------------------------------------------------------------------

interface LeadTemplate {
  firstNames: string[];
  lastNames: string[];
  companies: string[];
  services: string[];
  painPoints: string[];
  budgetRange: { min: number; max: number };
  companySizes: string[];
}

const NICHE_TEMPLATES: Record<string, LeadTemplate> = {
  "pest-control": {
    firstNames: ["Mike", "Jennifer", "Carlos", "Sarah", "David", "Lisa"],
    lastNames: ["Thompson", "Rodriguez", "Kim", "Patel", "Anderson", "Nguyen"],
    companies: ["ClearHome Pest Solutions", "GreenGuard Exterminating", "SafeNest Pest Control", "BugFree Homes", "Premier Pest Management"],
    services: ["Residential Pest Treatment", "Commercial Pest Management", "Termite Inspection", "Wildlife Removal", "Mosquito Control"],
    painPoints: ["struggling to get new customers", "losing jobs to competitors", "seasonal revenue drops", "need more recurring contracts", "want to expand territory"],
    budgetRange: { min: 500, max: 5000 },
    companySizes: ["solo", "small", "small", "mid-market"],
  },
  "immigration-law": {
    firstNames: ["Maria", "Ahmed", "Wei", "Fatima", "Dmitri", "Ana"],
    lastNames: ["Garcia", "Hassan", "Chen", "Al-Rashid", "Petrov", "Santos"],
    companies: ["Garcia Immigration Law", "Global Visa Partners", "Freedom Path Legal", "New Horizons Immigration", "Liberty Legal Group"],
    services: ["Family Visa Petition", "Employment-Based Green Card", "Asylum Application", "Citizenship Application", "DACA Renewal"],
    painPoints: ["intake process losing qualified cases", "too many unqualified consultations", "need more high-value cases", "struggling with client communication", "want to automate follow-up"],
    budgetRange: { min: 2000, max: 15000 },
    companySizes: ["solo", "small", "small", "mid-market", "mid-market"],
  },
  "roofing": {
    firstNames: ["James", "Robert", "Tony", "Michelle", "Brandon", "Kevin"],
    lastNames: ["Williams", "Martinez", "Johnson", "Baker", "Davis", "Clark"],
    companies: ["Summit Roofing Co", "AllWeather Roofing", "ProTop Roofing Solutions", "Guardian Roof Systems", "Elite Roof Contractors"],
    services: ["Roof Replacement", "Storm Damage Repair", "Commercial Roofing", "Roof Inspection", "Gutter Installation"],
    painPoints: ["losing bids to cheaper competitors", "inconsistent lead flow", "wasting time on tire kickers", "need to fill crew schedule", "want bigger commercial jobs"],
    budgetRange: { min: 3000, max: 25000 },
    companySizes: ["small", "small", "mid-market", "mid-market"],
  },
  "real-estate-syndication": {
    firstNames: ["Jonathan", "Victoria", "Marcus", "Elizabeth", "Alexander", "Sophia"],
    lastNames: ["Sterling", "Blackwell", "Rothschild", "Crawford", "Ashworth", "Bennett"],
    companies: ["Sterling Capital Partners", "Apex Real Estate Fund", "Meridian Investment Group", "Cornerstone Syndication", "Vanguard RE Holdings"],
    services: ["Multifamily Syndication", "Commercial Real Estate Fund", "1031 Exchange Syndication", "Investor Relations Portal", "Capital Raise Campaign"],
    painPoints: ["need accredited investors", "struggling to fill capital raise", "want better investor communication", "need to scale deal flow", "compliance and reporting overhead"],
    budgetRange: { min: 10000, max: 100000 },
    companySizes: ["small", "mid-market", "mid-market", "enterprise"],
  },
  "staffing-agency": {
    firstNames: ["Rachel", "Thomas", "Diana", "Brian", "Natalie", "Chris"],
    lastNames: ["Foster", "Hernandez", "Walsh", "Cooper", "Reed", "Simmons"],
    companies: ["TalentBridge Staffing", "NextLevel Workforce", "ProStaff Solutions", "Catalyst Recruiting", "PeakHire Agency"],
    services: ["Temporary Staffing", "Direct Hire Placement", "Executive Search", "Contract-to-Hire", "RPO Services"],
    painPoints: ["not enough client accounts", "losing placements to competition", "need to reduce time-to-fill", "want higher-margin clients", "struggling with candidate pipeline"],
    budgetRange: { min: 2000, max: 20000 },
    companySizes: ["small", "small", "mid-market", "mid-market", "enterprise"],
  },
};

// ---------------------------------------------------------------------------
// Synthetic lead generation
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSyntheticLeads(nicheSlug: string, count: number = 20): SyntheticLead[] {
  const template = NICHE_TEMPLATES[nicheSlug];
  if (!template) {
    return generateGenericLeads(nicheSlug, count);
  }

  const leads: SyntheticLead[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pickRandom(template.firstNames);
    const lastName = pickRandom(template.lastNames);
    const intentLevel = pickRandom(["low", "medium", "high"]);
    const source = pickRandom(SOURCES);

    const lead: SyntheticLead = {
      leadKey: randomUUID(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pickRandom(["gmail.com", "outlook.com", "company.com"])}`,
      firstName,
      lastName,
      company: Math.random() > 0.3 ? pickRandom(template.companies) : undefined,
      companySize: pickRandom(template.companySizes),
      source: mapSourceToScoring(source),
      niche: nicheSlug,
      service: pickRandom(template.services),
      pagesViewed: intentLevel === "high" ? randomBetween(8, 20) : intentLevel === "medium" ? randomBetween(3, 8) : randomBetween(1, 3),
      timeOnSite: intentLevel === "high" ? randomBetween(300, 900) : intentLevel === "medium" ? randomBetween(60, 300) : randomBetween(10, 60),
      formCompletions: intentLevel === "high" ? randomBetween(1, 3) : intentLevel === "medium" ? randomBetween(0, 1) : 0,
      chatMessages: intentLevel === "high" ? randomBetween(2, 8) : intentLevel === "medium" ? randomBetween(0, 3) : 0,
      returnVisits: intentLevel === "high" ? randomBetween(2, 5) : intentLevel === "medium" ? randomBetween(0, 2) : 0,
      assessmentCompleted: intentLevel === "high" ? Math.random() > 0.3 : false,
      calculatorUsed: intentLevel === "high" ? Math.random() > 0.4 : intentLevel === "medium" ? Math.random() > 0.7 : false,
      urgencyIndicators: intentLevel === "high"
        ? [pickRandom(template.painPoints), pickRandom(["urgent", "asap", "need now"])]
        : intentLevel === "medium"
          ? [pickRandom(template.painPoints)]
          : [],
      budget: intentLevel === "high"
        ? `$${randomBetween(template.budgetRange.min, template.budgetRange.max)}`
        : undefined,
      timeline: intentLevel === "high"
        ? pickRandom(["immediate", "this-week"])
        : intentLevel === "medium"
          ? pickRandom(["this-month", "this-quarter"])
          : pickRandom(["exploring", "this-quarter"]),
      estimatedDealValue: randomBetween(template.budgetRange.min, template.budgetRange.max),
      returning: intentLevel === "high" ? Math.random() > 0.3 : Math.random() > 0.7,
      device: pickRandom(DEVICES),
      phone: intentLevel === "high" ? `+1${randomBetween(200, 999)}${randomBetween(1000000, 9999999)}` : undefined,
    };

    leads.push(lead);
  }

  return leads;
}

function mapSourceToScoring(source: string): string {
  const mapping: Record<string, string> = {
    "google-ads": "paid",
    "facebook": "social",
    "referral": "referral",
    "organic": "organic",
  };
  return mapping[source] ?? source;
}

function generateGenericLeads(nicheSlug: string, count: number): SyntheticLead[] {
  const leads: SyntheticLead[] = [];
  const genericNames = ["Alex", "Jordan", "Sam", "Taylor", "Casey", "Morgan"];
  const genericLastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Lee"];

  for (let i = 0; i < count; i++) {
    const firstName = pickRandom(genericNames);
    const lastName = pickRandom(genericLastNames);
    const intentLevel = pickRandom(["low", "medium", "high"]);

    leads.push({
      leadKey: randomUUID(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@test.com`,
      firstName,
      lastName,
      company: Math.random() > 0.5 ? `${firstName}'s Business` : undefined,
      companySize: pickRandom(["solo", "small", "mid-market"]),
      source: mapSourceToScoring(pickRandom(SOURCES)),
      niche: nicheSlug,
      pagesViewed: randomBetween(1, 15),
      timeOnSite: randomBetween(10, 600),
      formCompletions: intentLevel === "high" ? 1 : 0,
      chatMessages: randomBetween(0, 5),
      returnVisits: randomBetween(0, 3),
      assessmentCompleted: intentLevel === "high",
      calculatorUsed: Math.random() > 0.6,
      urgencyIndicators: intentLevel === "high" ? ["need help urgently"] : [],
      budget: intentLevel !== "low" ? `$${randomBetween(1000, 10000)}` : undefined,
      timeline: pickRandom(TIMELINES),
      estimatedDealValue: randomBetween(1000, 10000),
      returning: Math.random() > 0.5,
      device: pickRandom(DEVICES),
    });
  }

  return leads;
}

// ---------------------------------------------------------------------------
// Testbed runner
// ---------------------------------------------------------------------------

const reportStore = new Map<string, CalibrationReport>();

export async function runTestbed(
  nicheSlug: string,
  sampleSize: number = 20,
): Promise<CalibrationReport> {
  const leads = generateSyntheticLeads(nicheSlug, sampleSize);
  const tenantId = `testbed-${nicheSlug}`;
  const results: PipelineResult[] = [];

  for (const lead of leads) {
    const result = await runRevenuePipeline(
      lead as unknown as Record<string, unknown>,
      tenantId,
      nicheSlug,
    );
    results.push(result);
  }

  const report = generateCalibrationReport(nicheSlug, results);
  reportStore.set(report.id, report);
  return report;
}

// ---------------------------------------------------------------------------
// Calibration report generation
// ---------------------------------------------------------------------------

export function generateCalibrationReport(
  nicheSlug: string,
  results: PipelineResult[],
): CalibrationReport {
  const id = randomUUID();

  const routeDistribution: Record<string, number> = {};
  for (const r of results) {
    routeDistribution[r.route] = (routeDistribution[r.route] ?? 0) + 1;
  }

  const routePercentages: Record<string, number> = {};
  for (const [route, count] of Object.entries(routeDistribution)) {
    routePercentages[route] = Math.round((count / results.length) * 100);
  }

  const scoreAcc = { intent: 0, fit: 0, engagement: 0, urgency: 0, composite: 0 };
  let scoredCount = 0;
  for (const r of results) {
    const scoringStage = r.stages.find((s) => s.name === "scoring");
    if (scoringStage?.status === "completed" && scoringStage.output) {
      scoreAcc.intent += (scoringStage.output.intentScore as number) ?? 0;
      scoreAcc.fit += (scoringStage.output.fitScore as number) ?? 0;
      scoreAcc.engagement += (scoringStage.output.engagementScore as number) ?? 0;
      scoreAcc.urgency += (scoringStage.output.urgencyScore as number) ?? 0;
      scoreAcc.composite += (scoringStage.output.compositeScore as number) ?? 0;
      scoredCount++;
    }
  }

  const divisor = scoredCount || 1;
  const averageScores = {
    intent: Math.round(scoreAcc.intent / divisor),
    fit: Math.round(scoreAcc.fit / divisor),
    engagement: Math.round(scoreAcc.engagement / divisor),
    urgency: Math.round(scoreAcc.urgency / divisor),
    composite: Math.round(scoreAcc.composite / divisor),
  };

  const stageCounts: Record<string, { total: number; failed: number }> = {};
  for (const r of results) {
    for (const stage of r.stages) {
      if (!stageCounts[stage.name]) {
        stageCounts[stage.name] = { total: 0, failed: 0 };
      }
      stageCounts[stage.name].total += 1;
      if (stage.status === "failed") {
        stageCounts[stage.name].failed += 1;
      }
    }
  }
  const stageFailureRates: Record<string, number> = {};
  for (const [name, counts] of Object.entries(stageCounts)) {
    stageFailureRates[name] = counts.total > 0
      ? Math.round((counts.failed / counts.total) * 100) / 100
      : 0;
  }

  const avgPipelineDurationMs = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.totalDurationMs, 0) / results.length)
    : 0;

  const offerHeadlines = new Set<string>();
  let offerCount = 0;
  for (const r of results) {
    if (r.offer) {
      offerCount++;
      const headline = (r.offer as Record<string, unknown>).headline;
      if (typeof headline === "string") {
        offerHeadlines.add(headline);
      }
    }
  }

  const triggerDistribution: Record<string, number> = {};
  for (const r of results) {
    if (r.psychologyDirectives) {
      const triggers = (r.psychologyDirectives as Record<string, unknown>).triggers;
      if (Array.isArray(triggers)) {
        for (const t of triggers) {
          const category = (t as Record<string, unknown>).category as string;
          if (category) {
            triggerDistribution[category] = (triggerDistribution[category] ?? 0) + 1;
          }
        }
      }
    }
  }

  const escalations = results.filter((r) => r.escalation?.shouldEscalate).length;
  const escalationRate = results.length > 0
    ? Math.round((escalations / results.length) * 100) / 100
    : 0;

  const estimatedRevenuePotential = results.reduce((sum, r) => {
    const monetizationStage = r.stages.find((s) => s.name === "monetization");
    if (monetizationStage?.status === "completed" && monetizationStage.output) {
      return sum + ((monetizationStage.output.finalPrice as number) ?? (monetizationStage.output.adjustedPrice as number) ?? 0);
    }
    return sum;
  }, 0);

  const recommendations = generateRecommendations(
    routePercentages,
    averageScores,
    stageFailureRates,
    escalationRate,
    avgPipelineDurationMs,
  );

  return {
    id,
    nicheSlug,
    sampleSize: results.length,
    routeDistribution,
    routePercentages,
    averageScores,
    stageFailureRates,
    avgPipelineDurationMs,
    offerCount,
    uniqueOfferHeadlines: [...offerHeadlines],
    psychologyTriggerDistribution: triggerDistribution,
    escalationRate,
    estimatedRevenuePotential: Math.round(estimatedRevenuePotential * 100) / 100,
    recommendations,
    generatedAt: new Date().toISOString(),
    results,
  };
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

function generateRecommendations(
  routePercentages: Record<string, number>,
  averageScores: CalibrationReport["averageScores"],
  stageFailureRates: Record<string, number>,
  escalationRate: number,
  avgDurationMs: number,
): string[] {
  const recs: string[] = [];

  const dripPct = routePercentages["drip"] ?? 0;
  if (dripPct > 50) {
    recs.push("Over 50% of leads are routing to drip. Consider lowering score thresholds or improving lead quality at the source.");
  }

  const fastTrackPct = routePercentages["fast-track"] ?? 0;
  if (fastTrackPct > 40) {
    recs.push("High fast-track rate suggests scoring may be too generous. Review weight calibration to avoid overwhelming sales.");
  }

  if (averageScores.composite < 30) {
    recs.push("Average composite score is very low. Review lead sources and engagement strategies to improve quality.");
  }

  if (averageScores.fit < 20) {
    recs.push("Fit scores are extremely low. Ensure leads provide company info and niche alignment signals.");
  }

  if (averageScores.engagement < 15) {
    recs.push("Engagement scores are very low. Consider adding more interactive elements (assessments, calculators) to the funnel.");
  }

  const failedStages = Object.entries(stageFailureRates).filter(([, rate]) => rate > 0.2);
  for (const [stage, rate] of failedStages) {
    recs.push(`Stage "${stage}" has a ${Math.round(rate * 100)}% failure rate. Investigate and fix reliability.`);
  }

  if (escalationRate > 0.5) {
    recs.push("Escalation rate exceeds 50%. Consider tightening escalation criteria to avoid overwhelming the sales team.");
  }

  if (escalationRate < 0.05 && fastTrackPct > 10) {
    recs.push("Escalation rate is very low despite fast-track leads. Review escalation signals to capture high-value opportunities.");
  }

  if (avgDurationMs > 5000) {
    recs.push("Average pipeline duration exceeds 5 seconds. Profile slow stages and optimize or parallelize.");
  }

  if (recs.length === 0) {
    recs.push("Pipeline calibration looks healthy. Continue monitoring as lead volume scales.");
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Report retrieval
// ---------------------------------------------------------------------------

export function getTestbedReport(id: string): CalibrationReport | null {
  return reportStore.get(id) ?? null;
}

export function listTestbedReports(): CalibrationReport[] {
  return [...reportStore.values()];
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetTestbedStore(): void {
  reportStore.clear();
}
