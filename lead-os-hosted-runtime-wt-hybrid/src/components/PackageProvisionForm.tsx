"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { PackageCredentialField, PackageSlug } from "@/lib/package-catalog";

type Status = "idle" | "loading" | "success" | "error";

interface ProvisionedArtifact {
  id: string;
  title: string;
  status: string;
  surface: string;
  url: string;
  createdArtifact: string;
  guide?: {
    summary: string;
    implementationSteps: string[];
    acceptanceChecklist: string[];
    nextMilestones: string[];
  };
}

interface ProvisionedPackageResult {
  packageTitle: string;
  launchId: string;
  status: string;
  urls: Record<string, string>;
  embed: { script: string; iframe: string };
  artifacts: ProvisionedArtifact[];
  automationRuns: Array<{ step: string; status: string; detail: string }>;
  acceptanceTests: Array<{ test: string; status: string; evidence: string }>;
  credentials: {
    accepted: Array<{ key: string; label: string; mode: string }>;
    managedDefaults: Array<{ key: string; label: string; detail: string }>;
    missingRequired: Array<{ key: string; label: string }>;
    missingOptional: Array<{ key: string; label: string }>;
  };
  automationContract: {
    nicheExamples: string[];
    requiresAdditionalConfiguration: boolean;
  };
  serviceReplacementStrategy?: {
    servicesBudgetTarget: string;
    targetServiceIndustries: string[];
    serviceReplacementIndustryThesis: string;
    financialAdminServiceMarkets: string[];
    bankingOperationsUseCases: string[];
    healthcareLegalServiceMarkets: string[];
    specializedVerticalMarkets: string[];
    customerSupportLanguageMarkets: string[];
    easiestServiceReplacementIndustries: string[];
    easiestServiceReplacementRationale: string;
    outsourcedOutcomeBudgetSignal: string;
    boringSchlepServiceOpportunity: string;
    fragmentedNonTechnicalReplacementPath: string;
    legalApplicationLayerReplacement: string;
    multilingualSupportReplacementAdvantage: string;
    outsourcedServiceReadiness: string;
    fragmentedNonTechBudgetOpportunity: string;
    highAttritionLaborWedge: string;
    pricingTradeoffSummary: string;
    perSeatCannibalizationTrap: string;
    perSeatLimitedWalletShare: string;
    incumbentPricingCultureResistance: string;
    workBasedPricingOpportunity: string;
    servicesBudgetPricingUpside: string;
    outcomeDrivenLaborAttritionValue: string;
    superhumanCapabilityPricing: string;
    workBasedPricingPilotRisk: string;
    pricingTradeoffMatrix: string[];
    pricingSurvivalRule: string;
    perSeatRisk: string;
    outcomePricing: string;
    walletShareExpansion: string;
    alignedIncentives: string;
    pricingUnits: string[];
    businessProcessAutomationShift: string;
    servicePerformingAutomation: string;
    selfRegulatingAutomationLoop: string;
    taskPricedAutomation: string;
    intelligenceOperatingSystem: string;
    queryableOrganizationModel: string;
    queryableOperatingSystemView: string;
    artifactRichLegibilitySources: string[];
    legibleByDefaultPolicy: string;
    queryableHumanMiddlewareReplacement: string;
    queryableAutonomousCoordination: string;
    queryableHumansAtEdgeRole: string;
    queryableTokenMaxingRule: string;
    artifactRichEnvironment: string;
    transparentCommunicationPolicy: string;
    contextualParityRule: string;
    intelligenceLayerCoordination: string;
    humansAtTheEdgeModel: string;
    sprintPlanningIntelligenceLoop: string;
    closedLoopSystem: string;
    openLoopReplacement: string;
    legibleOrganization: string;
    artifactGenerationPolicy: string;
    comprehensiveContextLayer: string;
    autonomousSprintPlanning: string;
    humanMiddlewareRemoval: string;
    closedLoopVelocityGain: string;
    moatPowerFrameworkSummary: string;
    speedAsPrimaryMoat: string;
    aiSevenPowersFramework: string[];
    processPowerLastTenPercentMoat: string;
    counterpositioningWorkBasedPricingMoat: string;
    switchingCostsDeepIntegrationMoat: string;
    networkEconomyEvalFlywheel: string;
    corneredResourceDataEvalMoat: string;
    scaleEconomiesInfrastructureMoat: string;
    brandingTrustMoat: string;
    schlepBlindnessBoringSpaceMoat: string;
    systemOfRecordDataLockIn: string;
    outcomeGraphMoat: string;
    outcomeGraphEventSchema: string[];
    outcomeGraphDataAssets: string[];
    borrowedToolStrengths: string[];
    agencyResalePattern: string;
    systemOfRecordTrustPattern: string;
    connectorReadinessPattern: string;
    gtmDataExecutionPattern: string;
    brandGovernancePattern: string;
    agentOpsObservabilityPattern: string;
    ontologyForwardDeployedPattern: string;
    competitorRepresentationGuardrail: string;
    verticalEvalFlywheel: string;
    certifiedOutcomeStandard: string;
    switchingCostMemory: string;
    packageMarketplaceLoop: string;
    outcomeBillingMoat: string;
    forwardDeployedLearningLoop: string;
    moatProofChecklist: string[];
    moatOperatingRule: string;
    processPowerMoat: string;
    wrapperCloneMisconception: string;
    accuracyHurdleMoat: string;
    bigLabDrudgeryDefense: string;
    deepBackendLogicMoat: string;
    integrationSurfaceAreaMoat: string;
    customerMintedWorkflow: string;
    processAutomationMoat: string;
    pilotToCoreInfrastructure: string;
    forwardDeployedPosture: string;
    tokenMaxingRule: string;
    tokenMaxingCostShift: string;
    tokenUsageOrgDesign: string;
    managementHierarchyReplacement: string;
    icBuilderOperatorModel: string;
    prototypeFirstMeetingCulture: string;
    driOutcomeOwnershipModel: string;
    onePersonOneOutcomeRule: string;
    driStrategyOutcomeFocus: string;
    driSpecificResultContract: string;
    driNoHierarchyHidingRule: string;
    driMiddleManagementReplacement: string;
    driIntelligenceLayerGuidance: string;
    driEdgeGuidanceRole: string;
    driTokenMaxingLeverage: string;
    driInformationVelocityGuardrail: string;
    aiFounderLeadershipModel: string;
    aiStrategyOwnershipRule: string;
    tokenUsageArchetypeOperatingModel: string;
    humanMiddlewareVelocityGain: string;
    singlePersonAgentLeverage: string;
    leanDepartmentOperatingModel: string;
    organizationalArchetypes: string[];
    aiSoftwareFactory: string;
    softwareFactorySpecContract: string;
    agentIterationLoop: string;
    lastTenPercentReliability: string;
    tddSoftwareFactoryLoop: string;
    scenarioValidationThreshold: string;
    probabilisticReviewGate: string;
    validationDrivenReviewReplacement: string;
    thresholdEvidencePolicy: string;
    zeroHandwrittenCodePosture: string;
    specsOnlyRepositoryGoal: string;
    thousandXEngineerModel: string;
    softwareFactorySpeedMoat: string;
    speedMoatThesis: string;
    speedMoatAgainstLabs: string;
    humanMiddlewareSpeedGain: string;
    queryableSprintCompression: string;
    oneDaySprintCadence: string;
    incumbentCraftOverhead: string;
    legacyOperatingConstraint: string;
    aiNativeFromDayOneAdvantage: string;
    forwardDeployedSpeedLoop: string;
    drudgeryDiscoveryThesis: string;
    forwardDeployedTimeInMotion: string;
    nittyGrittyWorkflowMap: string;
    hiddenLogicDiscovery: string;
    attritionDiscoverySignal: string;
    boringWorkflowSchlepMap: string;
    lossyMiddlewareDiscovery: string;
    fieldResearchTruckStopMethod: string;
    missionCriticalWorkflowFilter: string;
    hackathonReliabilityGap: string;
    existentialPainWorkflowFilter: string;
    specializedEvalMinting: string;
    treasureBeforeLabs: string;
    incumbentCultureReset: string;
    contextEngineeringShift: string;
    evalFlywheel: string;
    domainEdgeCaseDrudgery: string;
    missionCriticalProcessPower: string;
    humanWranglingModel: string;
  };
  ideaEvaluationGuardrails?: {
    problemRealityCheck: string;
    superficialPlausibilityCheck: string;
    technologyFirstTrapWarning: string;
    tarPitRiskCheck: string;
    tarPitResearchProtocol: string[];
    tarPitCategoryWarnings: string[];
    socialCoordinationTarPitWarning: string;
    funDiscoveryTarPitWarning: string;
    abstractSocietalProblemWarning: string;
    lowHitRateIdeaSpaceWarning: string;
    tarPitAvoidanceChecklist: string[];
    hardPartHypothesis: string;
    founderMarketFitCheck: string;
    boringHardCompetitiveAdvantage: string;
    boringSpaceValidationThesis: string;
    physicalObservationSchlepProtocol: string;
    invisiblePainDiscoverySignal: string;
    forwardDeployedWorkflowValidation: string;
    lastTenPercentEdgeCaseValidation: string;
    acutePainCheck: string;
    topThreePriorityTest: string;
    existentialPainTest: string;
    fireOrPromotionAcutenessTest: string;
    fireRiskSignal: string;
    promotionUpsideSignal: string;
    topThreeProblemRequirement: string;
    willingnessToPayAcutenessSignal: string;
    plainSightOpportunitySignal: string;
    pricingBinaryValidationSignal: string;
    pricingBinaryTestDefinition: string;
    openWalletValueSignal: string;
    binaryTestCustomerSegmentSignal: string;
    premiumPriceLearningSignal: string;
    complainButPayValidationSignal: string;
    highAttritionValidationSignal: string;
    alternativeIsNothingTest: string;
    chargeValidationTest: string;
    highValueNeedCategories: string[];
    moatTiming: string;
    pricingDiscipline: string;
  };
  customerGuide?: {
    title: string;
    executiveOverview: string;
    startHere: string[];
    implementationRoadmap: Array<{ phase: string; timing: string; actions: string[] }>;
    ambiguityKillers: string[];
  };
}

interface PackageProvisionFormProps {
  packageSlug: PackageSlug;
  fields: PackageCredentialField[];
}

const topLevelKeys = new Set(["brandName", "operatorEmail", "primaryDomain", "targetMarket", "primaryOffer"]);

export function PackageProvisionForm({ packageSlug, fields }: PackageProvisionFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionedPackageResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const credentials: Record<string, string> = {};
    for (const field of fields) {
      if (!topLevelKeys.has(field.key)) {
        credentials[field.key] = String(form.get(field.key) ?? "");
      }
    }

    const response = await fetch("/api/package-provisioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageSlug,
        brandName: String(form.get("brandName") ?? ""),
        operatorEmail: String(form.get("operatorEmail") ?? ""),
        primaryDomain: String(form.get("primaryDomain") ?? ""),
        targetMarket: String(form.get("targetMarket") ?? ""),
        primaryOffer: String(form.get("primaryOffer") ?? ""),
        credentials,
      }),
    }).catch(() => null);

    if (!response) {
      setStatus("error");
      setError("Network error while launching the solution.");
      return;
    }

    const payload = await response.json();
    if (!response.ok || payload.error) {
      setStatus("error");
      setResult(payload.data ?? null);
      setError(payload.error?.message ?? "Solution launch failed.");
      return;
    }

    setResult(payload.data);
    setStatus("success");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="space-y-4 rounded-lg border border-border bg-background p-5" onSubmit={submit}>
        <div>
          <h2 className="text-xl font-bold">Client intake form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This is what your client fills out after they pay. It captures the outcome, customer, current problem,
            success measure, constraints, and voice needed to provision the complete solution. Optional account access
            improves live integrations, but delivery is not blocked by missing access.
          </p>
        </div>

        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-1.5 text-sm">
              <span className="font-medium">
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  name={field.key}
                  required={field.required}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={field.key === "primaryOffer" ? "Book a qualified consultation with a fast response promise." : ""}
                />
              ) : field.type === "select" ? (
                <select name={field.key} required={field.required} className="min-h-11 rounded-md border border-input bg-background px-3">
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.key}
                  type={field.type}
                  required={field.required}
                  className="min-h-11 rounded-md border border-input bg-background px-3"
                  defaultValue={defaultValue(field.key)}
                  autoComplete={field.sensitive ? "off" : undefined}
                />
              )}
              <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
            </label>
          ))}
        </div>

        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
          {status === "loading" ? "Launching..." : "Launch client solution"}
        </button>
        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </form>

      <PackageProvisionResult status={status} result={result} />
    </div>
  );
}

function defaultValue(key: string): string {
  switch (key) {
    case "brandName":
      return "Acme Growth Solution";
    case "operatorEmail":
      return "operator@example.com";
    case "primaryDomain":
      return "https://example.com";
    case "targetMarket":
      return "local service buyers in Erie, PA";
    case "idealCustomerProfile":
      return "Homeowners who need fast help after storm damage and want a trustworthy quote without waiting for a callback.";
    case "successMetric":
      return "qualified booked appointments and recovered missed-call revenue";
    case "currentProcess":
      return "The business currently misses calls after hours and follows up manually when someone has time.";
    case "fulfillmentConstraints":
      return "Do not promise insurance approval. Route emergencies and angry callers to a human.";
    case "brandVoice":
      return "Helpful, calm, direct, and locally trustworthy.";
    case "bookingUrl":
      return "https://cal.com/acme/qualified-call";
    case "webhookUrl":
      return "https://example.com/webhooks/lead-os";
    default:
      return "";
  }
}

function PackageProvisionResult({
  status,
  result,
}: {
  status: Status;
  result: ProvisionedPackageResult | null;
}) {
  if (status === "idle") {
    return (
      <section className="rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="text-xl font-bold">What gets created after this form</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The launch output includes customer-ready solution links, lead capture, delivery and reporting surfaces, embed code,
          finished outputs, completed provisioning runs, and acceptance checks.
          Every output also receives a usage guide, implementation steps, workflow directions, failure handling, and next milestones.
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="text-xl font-bold">Waiting for launch output</h2>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-lg border border-primary/25 bg-primary/5 p-5">
      <div>
        <p className="text-sm font-semibold text-primary">Solution launched</p>
        <h2 className="text-2xl font-bold">{result.packageTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Launch ID: {result.launchId}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(result.urls).map(([label, url]) => (
          <a key={label} href={url} className="rounded-md border border-border bg-background p-3 text-sm underline-offset-4 hover:underline">
            <span className="block font-semibold capitalize">{label}</span>
            <span className="break-all text-muted-foreground">{url}</span>
          </a>
        ))}
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Embed code</h3>
        <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs">{result.embed.script}</pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Customer-ready outputs</h3>
        <div className="max-h-[420px] overflow-y-auto rounded-md border border-border bg-background">
          {result.artifacts.map((artifact) => (
            <a key={artifact.id} href={artifact.url} className="block border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-semibold">{artifact.title}</span>
              <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{artifact.status}</span>
              <span className="mt-1 block text-muted-foreground">{artifact.createdArtifact}</span>
            </a>
          ))}
        </div>
      </div>

      {result.customerGuide ? (
        <div className="rounded-md border border-border bg-background p-3 text-sm">
          <h3 className="font-semibold">{result.customerGuide.title}</h3>
          <p className="mt-1 text-muted-foreground">{result.customerGuide.executiveOverview}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SummaryList title="Start here" items={result.customerGuide.startHere} />
            <SummaryList title="No ambiguity rules" items={result.customerGuide.ambiguityKillers} />
          </div>
        </div>
      ) : null}

      {result.serviceReplacementStrategy ? (
        <div className="rounded-md border border-border bg-background p-3 text-sm">
          <h3 className="font-semibold">Service-replacement strategy</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SummaryList
              title="Budget and pricing"
              items={[
                result.serviceReplacementStrategy.servicesBudgetTarget,
                `Target service-heavy markets: ${result.serviceReplacementStrategy.targetServiceIndustries.join(", ")}`,
                result.serviceReplacementStrategy.serviceReplacementIndustryThesis,
                result.serviceReplacementStrategy.perSeatRisk,
                result.serviceReplacementStrategy.outcomePricing,
                result.serviceReplacementStrategy.taskPricedAutomation,
              ]}
            />
            <SummaryList
              title="Pricing trade-off"
              items={[
                result.serviceReplacementStrategy.pricingTradeoffSummary,
                result.serviceReplacementStrategy.perSeatCannibalizationTrap,
                result.serviceReplacementStrategy.workBasedPricingOpportunity,
                result.serviceReplacementStrategy.servicesBudgetPricingUpside,
                result.serviceReplacementStrategy.perSeatLimitedWalletShare,
                result.serviceReplacementStrategy.incumbentPricingCultureResistance,
                result.serviceReplacementStrategy.outcomeDrivenLaborAttritionValue,
                result.serviceReplacementStrategy.superhumanCapabilityPricing,
                result.serviceReplacementStrategy.workBasedPricingPilotRisk,
                ...result.serviceReplacementStrategy.pricingTradeoffMatrix,
                result.serviceReplacementStrategy.pricingSurvivalRule,
              ]}
            />
            <SummaryList
              title="Industry wedges"
              items={[
                `Financial/admin: ${result.serviceReplacementStrategy.financialAdminServiceMarkets.join(", ")}`,
                `Banking operations: ${result.serviceReplacementStrategy.bankingOperationsUseCases.join(", ")}`,
                `Healthcare/legal: ${result.serviceReplacementStrategy.healthcareLegalServiceMarkets.join(", ")}`,
                `Specialized verticals: ${result.serviceReplacementStrategy.specializedVerticalMarkets.join(", ")}`,
                `Support/language: ${result.serviceReplacementStrategy.customerSupportLanguageMarkets.join(", ")}`,
                result.serviceReplacementStrategy.outsourcedServiceReadiness,
                result.serviceReplacementStrategy.fragmentedNonTechBudgetOpportunity,
                result.serviceReplacementStrategy.highAttritionLaborWedge,
              ]}
            />
            <SummaryList
              title="Easy replacement wedges"
              items={[
                `Industries: ${result.serviceReplacementStrategy.easiestServiceReplacementIndustries.join(", ")}`,
                result.serviceReplacementStrategy.easiestServiceReplacementRationale,
                result.serviceReplacementStrategy.outsourcedOutcomeBudgetSignal,
                result.serviceReplacementStrategy.boringSchlepServiceOpportunity,
                result.serviceReplacementStrategy.fragmentedNonTechnicalReplacementPath,
                result.serviceReplacementStrategy.legalApplicationLayerReplacement,
                result.serviceReplacementStrategy.multilingualSupportReplacementAdvantage,
              ]}
            />
            <SummaryList
              title="Business process automation"
              items={[
                result.serviceReplacementStrategy.businessProcessAutomationShift,
                result.serviceReplacementStrategy.servicePerformingAutomation,
                result.serviceReplacementStrategy.selfRegulatingAutomationLoop,
                result.serviceReplacementStrategy.processAutomationMoat,
                result.serviceReplacementStrategy.pilotToCoreInfrastructure,
              ]}
            />
            <SummaryList
              title="Wallet, incentives, moat"
              items={[
                result.serviceReplacementStrategy.walletShareExpansion,
                result.serviceReplacementStrategy.alignedIncentives,
                result.serviceReplacementStrategy.intelligenceOperatingSystem,
                result.serviceReplacementStrategy.closedLoopSystem,
                result.serviceReplacementStrategy.openLoopReplacement,
                result.serviceReplacementStrategy.legibleOrganization,
                result.serviceReplacementStrategy.processPowerMoat,
                result.serviceReplacementStrategy.customerMintedWorkflow,
              ]}
            />
            <SummaryList
              title="Closed-loop operating system"
              items={[
                result.serviceReplacementStrategy.artifactGenerationPolicy,
                result.serviceReplacementStrategy.comprehensiveContextLayer,
                result.serviceReplacementStrategy.autonomousSprintPlanning,
                result.serviceReplacementStrategy.humanMiddlewareRemoval,
                result.serviceReplacementStrategy.closedLoopVelocityGain,
              ]}
            />
            <SummaryList
              title="Queryable organization"
              items={[
                result.serviceReplacementStrategy.queryableOrganizationModel,
                result.serviceReplacementStrategy.queryableOperatingSystemView,
                ...result.serviceReplacementStrategy.artifactRichLegibilitySources,
                result.serviceReplacementStrategy.legibleByDefaultPolicy,
                result.serviceReplacementStrategy.queryableHumanMiddlewareReplacement,
                result.serviceReplacementStrategy.queryableAutonomousCoordination,
                result.serviceReplacementStrategy.queryableHumansAtEdgeRole,
                result.serviceReplacementStrategy.queryableTokenMaxingRule,
                result.serviceReplacementStrategy.artifactRichEnvironment,
                result.serviceReplacementStrategy.transparentCommunicationPolicy,
                result.serviceReplacementStrategy.contextualParityRule,
                result.serviceReplacementStrategy.intelligenceLayerCoordination,
                result.serviceReplacementStrategy.humansAtTheEdgeModel,
                result.serviceReplacementStrategy.sprintPlanningIntelligenceLoop,
                result.serviceReplacementStrategy.tokenMaxingCostShift,
              ]}
            />
            <SummaryList
              title="Process power moat"
              items={[
                result.serviceReplacementStrategy.wrapperCloneMisconception,
                result.serviceReplacementStrategy.accuracyHurdleMoat,
                result.serviceReplacementStrategy.bigLabDrudgeryDefense,
                result.serviceReplacementStrategy.deepBackendLogicMoat,
                result.serviceReplacementStrategy.integrationSurfaceAreaMoat,
                result.serviceReplacementStrategy.customerMintedWorkflow,
              ]}
            />
            <SummaryList
              title="AI-native operating model"
              items={[
                result.serviceReplacementStrategy.tokenMaxingRule,
                result.serviceReplacementStrategy.tokenMaxingCostShift,
                result.serviceReplacementStrategy.tokenUsageOrgDesign,
                result.serviceReplacementStrategy.tokenUsageArchetypeOperatingModel,
                result.serviceReplacementStrategy.aiSoftwareFactory,
                result.serviceReplacementStrategy.softwareFactorySpeedMoat,
                result.serviceReplacementStrategy.humanWranglingModel,
              ]}
            />
            <SummaryList
              title="Speed moat"
              items={[
                result.serviceReplacementStrategy.speedMoatThesis,
                result.serviceReplacementStrategy.speedMoatAgainstLabs,
                result.serviceReplacementStrategy.humanMiddlewareSpeedGain,
                result.serviceReplacementStrategy.queryableSprintCompression,
                result.serviceReplacementStrategy.oneDaySprintCadence,
                result.serviceReplacementStrategy.forwardDeployedSpeedLoop,
              ]}
            />
            <SummaryList
              title="Moat powers"
              items={[
                result.serviceReplacementStrategy.moatPowerFrameworkSummary,
                result.serviceReplacementStrategy.speedAsPrimaryMoat,
                ...result.serviceReplacementStrategy.aiSevenPowersFramework,
                result.serviceReplacementStrategy.processPowerLastTenPercentMoat,
                result.serviceReplacementStrategy.counterpositioningWorkBasedPricingMoat,
                result.serviceReplacementStrategy.switchingCostsDeepIntegrationMoat,
                result.serviceReplacementStrategy.networkEconomyEvalFlywheel,
                result.serviceReplacementStrategy.corneredResourceDataEvalMoat,
                result.serviceReplacementStrategy.scaleEconomiesInfrastructureMoat,
                result.serviceReplacementStrategy.brandingTrustMoat,
                result.serviceReplacementStrategy.schlepBlindnessBoringSpaceMoat,
                result.serviceReplacementStrategy.systemOfRecordDataLockIn,
              ]}
            />
            <SummaryList
              title="Outcome Graph moat"
              items={[
                result.serviceReplacementStrategy.outcomeGraphMoat,
                ...result.serviceReplacementStrategy.outcomeGraphEventSchema,
                ...result.serviceReplacementStrategy.outcomeGraphDataAssets,
                result.serviceReplacementStrategy.verticalEvalFlywheel,
                result.serviceReplacementStrategy.certifiedOutcomeStandard,
                result.serviceReplacementStrategy.switchingCostMemory,
                result.serviceReplacementStrategy.packageMarketplaceLoop,
                result.serviceReplacementStrategy.outcomeBillingMoat,
                result.serviceReplacementStrategy.forwardDeployedLearningLoop,
                ...result.serviceReplacementStrategy.moatProofChecklist,
                result.serviceReplacementStrategy.moatOperatingRule,
              ]}
            />
            <SummaryList
              title="Borrowed tool patterns"
              items={[
                ...result.serviceReplacementStrategy.borrowedToolStrengths,
                result.serviceReplacementStrategy.agencyResalePattern,
                result.serviceReplacementStrategy.systemOfRecordTrustPattern,
                result.serviceReplacementStrategy.connectorReadinessPattern,
                result.serviceReplacementStrategy.gtmDataExecutionPattern,
                result.serviceReplacementStrategy.brandGovernancePattern,
                result.serviceReplacementStrategy.agentOpsObservabilityPattern,
                result.serviceReplacementStrategy.ontologyForwardDeployedPattern,
                result.serviceReplacementStrategy.competitorRepresentationGuardrail,
              ]}
            />
            <SummaryList
              title="Drudgery discovery"
              items={[
                result.serviceReplacementStrategy.drudgeryDiscoveryThesis,
                result.serviceReplacementStrategy.forwardDeployedTimeInMotion,
                result.serviceReplacementStrategy.nittyGrittyWorkflowMap,
                result.serviceReplacementStrategy.hiddenLogicDiscovery,
                result.serviceReplacementStrategy.attritionDiscoverySignal,
                result.serviceReplacementStrategy.boringWorkflowSchlepMap,
              ]}
            />
            <SummaryList
              title="Field research filters"
              items={[
                result.serviceReplacementStrategy.lossyMiddlewareDiscovery,
                result.serviceReplacementStrategy.fieldResearchTruckStopMethod,
                result.serviceReplacementStrategy.missionCriticalWorkflowFilter,
                result.serviceReplacementStrategy.hackathonReliabilityGap,
                result.serviceReplacementStrategy.existentialPainWorkflowFilter,
              ]}
            />
            <SummaryList
              title="Incumbent speed gap"
              items={[
                result.serviceReplacementStrategy.incumbentCraftOverhead,
                result.serviceReplacementStrategy.legacyOperatingConstraint,
                result.serviceReplacementStrategy.aiNativeFromDayOneAdvantage,
                result.serviceReplacementStrategy.specializedEvalMinting,
                result.serviceReplacementStrategy.treasureBeforeLabs,
              ]}
            />
            <SummaryList
              title="Management archetypes"
              items={[
                result.serviceReplacementStrategy.managementHierarchyReplacement,
                result.serviceReplacementStrategy.icBuilderOperatorModel,
                result.serviceReplacementStrategy.prototypeFirstMeetingCulture,
                result.serviceReplacementStrategy.driOutcomeOwnershipModel,
                result.serviceReplacementStrategy.onePersonOneOutcomeRule,
                result.serviceReplacementStrategy.driStrategyOutcomeFocus,
                result.serviceReplacementStrategy.driSpecificResultContract,
                result.serviceReplacementStrategy.driNoHierarchyHidingRule,
                result.serviceReplacementStrategy.driMiddleManagementReplacement,
                result.serviceReplacementStrategy.driIntelligenceLayerGuidance,
                result.serviceReplacementStrategy.driEdgeGuidanceRole,
                result.serviceReplacementStrategy.driTokenMaxingLeverage,
                result.serviceReplacementStrategy.driInformationVelocityGuardrail,
                result.serviceReplacementStrategy.aiFounderLeadershipModel,
                result.serviceReplacementStrategy.aiStrategyOwnershipRule,
                result.serviceReplacementStrategy.humanMiddlewareVelocityGain,
                result.serviceReplacementStrategy.singlePersonAgentLeverage,
                result.serviceReplacementStrategy.leanDepartmentOperatingModel,
              ]}
            />
            <SummaryList
              title="Reliability factory"
              items={[
                result.serviceReplacementStrategy.softwareFactorySpecContract,
                result.serviceReplacementStrategy.agentIterationLoop,
                result.serviceReplacementStrategy.lastTenPercentReliability,
                result.serviceReplacementStrategy.tddSoftwareFactoryLoop,
                result.serviceReplacementStrategy.scenarioValidationThreshold,
                result.serviceReplacementStrategy.probabilisticReviewGate,
                result.serviceReplacementStrategy.validationDrivenReviewReplacement,
                result.serviceReplacementStrategy.thresholdEvidencePolicy,
                result.serviceReplacementStrategy.evalFlywheel,
                result.serviceReplacementStrategy.domainEdgeCaseDrudgery,
                result.serviceReplacementStrategy.missionCriticalProcessPower,
              ]}
            />
            <SummaryList
              title="Factory leverage"
              items={[
                result.serviceReplacementStrategy.zeroHandwrittenCodePosture,
                result.serviceReplacementStrategy.specsOnlyRepositoryGoal,
                result.serviceReplacementStrategy.thousandXEngineerModel,
                result.serviceReplacementStrategy.incumbentCultureReset,
                result.serviceReplacementStrategy.contextEngineeringShift,
              ]}
            />
            <SummaryList title="Org archetypes" items={result.serviceReplacementStrategy.organizationalArchetypes} />
          </div>
        </div>
      ) : null}

      {result.ideaEvaluationGuardrails ? (
        <div className="rounded-md border border-border bg-background p-3 text-sm">
          <h3 className="font-semibold">Startup idea guardrails</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SummaryList
              title="Problem and pain"
              items={[
                result.ideaEvaluationGuardrails.problemRealityCheck,
                result.ideaEvaluationGuardrails.superficialPlausibilityCheck,
                result.ideaEvaluationGuardrails.acutePainCheck,
                result.ideaEvaluationGuardrails.topThreePriorityTest,
                result.ideaEvaluationGuardrails.existentialPainTest,
                result.ideaEvaluationGuardrails.fireOrPromotionAcutenessTest,
                result.ideaEvaluationGuardrails.fireRiskSignal,
                result.ideaEvaluationGuardrails.promotionUpsideSignal,
                result.ideaEvaluationGuardrails.topThreeProblemRequirement,
                result.ideaEvaluationGuardrails.willingnessToPayAcutenessSignal,
                result.ideaEvaluationGuardrails.plainSightOpportunitySignal,
                result.ideaEvaluationGuardrails.boringSpaceValidationThesis,
                result.ideaEvaluationGuardrails.physicalObservationSchlepProtocol,
                result.ideaEvaluationGuardrails.invisiblePainDiscoverySignal,
                result.ideaEvaluationGuardrails.highAttritionValidationSignal,
                result.ideaEvaluationGuardrails.tarPitRiskCheck,
                result.ideaEvaluationGuardrails.socialCoordinationTarPitWarning,
                result.ideaEvaluationGuardrails.funDiscoveryTarPitWarning,
                result.ideaEvaluationGuardrails.abstractSocietalProblemWarning,
                result.ideaEvaluationGuardrails.lowHitRateIdeaSpaceWarning,
              ]}
            />
            <SummaryList
              title="Fit and pricing"
              items={[
                result.ideaEvaluationGuardrails.technologyFirstTrapWarning,
                result.ideaEvaluationGuardrails.hardPartHypothesis,
                result.ideaEvaluationGuardrails.founderMarketFitCheck,
                result.ideaEvaluationGuardrails.forwardDeployedWorkflowValidation,
                result.ideaEvaluationGuardrails.lastTenPercentEdgeCaseValidation,
                result.ideaEvaluationGuardrails.alternativeIsNothingTest,
                result.ideaEvaluationGuardrails.chargeValidationTest,
                result.ideaEvaluationGuardrails.pricingBinaryValidationSignal,
                result.ideaEvaluationGuardrails.pricingBinaryTestDefinition,
                result.ideaEvaluationGuardrails.openWalletValueSignal,
                result.ideaEvaluationGuardrails.binaryTestCustomerSegmentSignal,
                result.ideaEvaluationGuardrails.premiumPriceLearningSignal,
                result.ideaEvaluationGuardrails.complainButPayValidationSignal,
                result.ideaEvaluationGuardrails.moatTiming,
                result.ideaEvaluationGuardrails.pricingDiscipline,
              ]}
            />
            <SummaryList title="High-value need categories" items={result.ideaEvaluationGuardrails.highValueNeedCategories} />
            <SummaryList title="Tar-pit category warnings" items={result.ideaEvaluationGuardrails.tarPitCategoryWarnings} />
            <SummaryList title="Tar-pit research protocol" items={result.ideaEvaluationGuardrails.tarPitResearchProtocol} />
            <SummaryList title="Tar-pit avoidance checklist" items={result.ideaEvaluationGuardrails.tarPitAvoidanceChecklist} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryList title="Provisioning completed" items={result.automationRuns.map((run) => `${run.step}: ${run.detail}`)} />
        <SummaryList title="Acceptance tests" items={result.acceptanceTests.map((test) => `${test.test}: ${test.status}`)} />
      </div>

      {result.credentials.managedDefaults.length > 0 ? (
        <div className="rounded-md border border-primary/25 bg-background p-3 text-sm text-muted-foreground">
          Managed handoffs applied: {result.credentials.managedDefaults.map((item) => item.label).join(", ")}.
          The complete solution is provisioned and delivered now; client-owned account access can replace managed handoffs later.
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
        Multi-niche ready: {result.automationContract.nicheExamples.join(", ")}.
      </div>
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.slice(0, 4);
  const remainingItems = items.slice(4);

  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`} className="rounded-md border border-border bg-background p-2">{item}</li>
        ))}
      </ul>
      {remainingItems.length > 0 ? (
        <details className="mt-2 rounded-md border border-border bg-muted/25 p-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            Show {remainingItems.length} more {title.toLowerCase()} checks
          </summary>
          <ul className="mt-2 space-y-2">
            {remainingItems.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-md border border-border bg-background p-2">
                {item}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
