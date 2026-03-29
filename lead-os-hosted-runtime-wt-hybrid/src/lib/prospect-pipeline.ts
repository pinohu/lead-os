import { scoutNiche, type ScoutConfig, type ScoutResult, type ScoredBusiness } from "./discovery-scout.ts";
import { classifyAll, type ClassificationResult } from "./opportunity-classifier.ts";
import {
  addProspect,
  createProspectFromClassification,
  type Prospect,
} from "./prospect-store.ts";
import { processLeadIntake, type HostedLeadPayload } from "./intake.ts";

export interface PipelineConfig {
  tenantId: string;
  niche: string;
  geo: string;
  autoIngestToLeadPipeline: boolean;
  minConfidence: number;
  analyzeWebsites: boolean;
  maxResults: number;
}

export interface PipelineResult {
  scoutResult: ScoutResult;
  classifications: ClassificationResult[];
  prospectsCreated: Prospect[];
  leadsIngested: number;
  errors: string[];
  summary: {
    businessesFound: number;
    businessesScored: number;
    prospectsCreated: number;
    hotProspects: number;
    warmProspects: number;
    totalEstimatedValue: number;
    leadsIngested: number;
  };
}

function mapPriorityToTemperature(priority: string): "hot" | "warm" | "cool" {
  if (priority === "hot") return "hot";
  if (priority === "warm") return "warm";
  return "cool";
}

function buildLeadPayloadFromProspect(prospect: Prospect): HostedLeadPayload {
  return {
    source: "discovery-scout" as HostedLeadPayload["source"],
    email: prospect.email,
    phone: prospect.phone,
    company: prospect.businessName,
    niche: prospect.niche,
    service: prospect.opportunityType,
    message: `Auto-discovered prospect: ${prospect.suggestedAction}`,
    metadata: {
      prospectId: prospect.id,
      opportunityType: prospect.opportunityType,
      priority: prospect.priority,
      confidence: prospect.confidence,
      opportunityScore: prospect.opportunityScore,
      digitalGapScore: prospect.digitalGapScore,
      estimatedMonthlyValue: prospect.estimatedMonthlyValue,
      reasoning: prospect.reasoning,
      geo: prospect.geo,
      website: prospect.website,
    },
  };
}

export async function runProspectPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const errors: string[] = [];

  const scoutResult = await scoutNiche({
    niche: config.niche,
    geo: config.geo,
    tenantId: config.tenantId,
    maxResults: config.maxResults,
    analyzeWebsites: config.analyzeWebsites,
  });

  const classifications = classifyAll(scoutResult.businesses);

  const qualifiedClassifications = classifications.filter(
    (c) => c.primaryOpportunity.confidence >= config.minConfidence,
  );

  const prospectsCreated: Prospect[] = [];
  let leadsIngested = 0;

  for (const classification of qualifiedClassifications) {
    try {
      const prospect = createProspectFromClassification(config.tenantId, classification);
      await addProspect(prospect);
      prospectsCreated.push(prospect);

      if (config.autoIngestToLeadPipeline && (prospect.phone || prospect.email)) {
        try {
          const leadPayload = buildLeadPayloadFromProspect(prospect);
          await processLeadIntake(leadPayload);
          prospect.pipelineLeadKey = prospect.email
            ? `email:${prospect.email.toLowerCase()}`
            : prospect.phone
              ? `phone:${prospect.phone.replace(/[^0-9+]/g, "")}`
              : undefined;
          leadsIngested++;
        } catch (err) {
          errors.push(`Failed to ingest lead for ${prospect.businessName}: ${err instanceof Error ? err.message : "unknown error"}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to create prospect for ${classification.business.name}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const hotCount = prospectsCreated.filter((p) => p.priority === "hot").length;
  const warmCount = prospectsCreated.filter((p) => p.priority === "warm").length;
  const totalEstimatedValue = prospectsCreated.reduce((sum, p) => sum + p.estimatedMonthlyValue, 0);

  return {
    scoutResult,
    classifications,
    prospectsCreated,
    leadsIngested,
    errors,
    summary: {
      businessesFound: scoutResult.businessesFound,
      businessesScored: scoutResult.businessesScored,
      prospectsCreated: prospectsCreated.length,
      hotProspects: hotCount,
      warmProspects: warmCount,
      totalEstimatedValue,
      leadsIngested,
    },
  };
}

export async function runMultiNichePipeline(
  tenantId: string,
  niches: Array<{ niche: string; geo: string }>,
  options?: Partial<Omit<PipelineConfig, "tenantId" | "niche" | "geo">>,
): Promise<{
  results: PipelineResult[];
  totalProspects: number;
  totalLeads: number;
  totalEstimatedValue: number;
  totalErrors: number;
}> {
  const results: PipelineResult[] = [];
  let totalProspects = 0;
  let totalLeads = 0;
  let totalEstimatedValue = 0;
  let totalErrors = 0;

  for (const { niche, geo } of niches) {
    const result = await runProspectPipeline({
      tenantId,
      niche,
      geo,
      autoIngestToLeadPipeline: options?.autoIngestToLeadPipeline ?? false,
      minConfidence: options?.minConfidence ?? 30,
      analyzeWebsites: options?.analyzeWebsites ?? false,
      maxResults: options?.maxResults ?? 10,
    });

    results.push(result);
    totalProspects += result.summary.prospectsCreated;
    totalLeads += result.summary.leadsIngested;
    totalEstimatedValue += result.summary.totalEstimatedValue;
    totalErrors += result.errors.length;
  }

  return { results, totalProspects, totalLeads, totalEstimatedValue, totalErrors };
}
