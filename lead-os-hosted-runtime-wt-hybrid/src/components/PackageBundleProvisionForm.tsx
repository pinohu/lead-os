"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { PackageCredentialField, PackageSlug } from "@/lib/package-catalog";

type Status = "idle" | "loading" | "success" | "error";

interface BundlePackageOption {
  slug: PackageSlug;
  title: string;
  customerOutcome: string;
}

interface ProvisionedBundleResult {
  bundleId: string;
  status: string;
  packageTitles: string[];
  totalArtifacts: number;
  urls: {
    workspaces: string[];
  };
  acceptanceTests: Array<{ test: string; status: string; evidence: string }>;
  valueCase?: {
    executiveSummary: string;
    sixFigureValueDrivers: string[];
    renewalReasons: string[];
    expansionPaths: string[];
    delightChecks: string[];
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
    operatingWorkflow: string[];
    ambiguityKillers: string[];
  };
}

interface PackageBundleProvisionFormProps {
  packages: BundlePackageOption[];
  fields: PackageCredentialField[];
  defaultSelectedSlugs?: PackageSlug[];
  title?: string;
  description?: string;
}

const topLevelKeys = new Set(["brandName", "operatorEmail", "primaryDomain", "targetMarket", "primaryOffer"]);
const coreCredentialKeys = new Set([
  "idealCustomerProfile",
  "successMetric",
  "currentProcess",
  "fulfillmentConstraints",
  "brandVoice",
  "avatarVoiceConsent",
]);

export function PackageBundleProvisionForm({
  packages,
  fields,
  defaultSelectedSlugs,
  title = "Launch one, a few, or all solutions",
  description = "One universal onboarding form collects the outcome, customer, current problem, success measure, constraints, access details, and voice needed to provision any selected package combination. Optional account connections use managed handoffs, so delivery is not blocked by missing CRM, calendar, phone, social, billing, or webhook access.",
}: PackageBundleProvisionFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionedBundleResult | null>(null);
  const defaultSelected = useMemo(
    () => new Set(defaultSelectedSlugs?.length ? defaultSelectedSlugs : packages.slice(0, 3).map((pkg) => pkg.slug)),
    [defaultSelectedSlugs, packages],
  );
  const supplementalFields = useMemo(
    () => fields.filter((field) => !topLevelKeys.has(field.key) && !coreCredentialKeys.has(field.key)),
    [fields],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const packageSlugs = form.getAll("packageSlugs").map(String) as PackageSlug[];
    if (packageSlugs.length === 0) {
      setStatus("error");
      setError("Choose at least one solution to launch.");
      return;
    }

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
        packageSlugs,
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
      setError("Network error while launching the solution bundle.");
      return;
    }

    const payload = await response.json();
    if (!response.ok || payload.error) {
      setStatus("error");
      setResult(payload.data ?? null);
      setError(payload.error?.message ?? "Solution bundle launch failed.");
      return;
    }

    setResult(payload.data);
    setStatus("success");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <form className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]" onSubmit={submit}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="brandName" label="Client brand" defaultValue="Acme Growth Solution" />
            <Input name="operatorEmail" label="Delivery contact email" type="email" defaultValue="delivery@example.com" />
            <Input name="primaryDomain" label="Client domain" type="url" defaultValue="https://example.com" />
            <Input name="targetMarket" label="Target niche" defaultValue="med spas, home services, and B2B experts" />
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Primary outcome</span>
            <textarea
              name="primaryOffer"
              required
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
              defaultValue="Launch an AI-operated growth system that captures demand, produces assets, routes opportunities, and reports outcomes."
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Who the solution is for</span>
            <textarea
              name="idealCustomerProfile"
              required
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
              defaultValue="Busy local business owners, ecommerce teams, and expert-led companies that want outcomes without learning new software."
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="successMetric" label="Success measure" defaultValue="booked appointments, recovered revenue, hours saved, and outputs delivered" />
            <Input name="brandVoice" label="Customer experience style" defaultValue="clear, helpful, premium, and outcome-focused" />
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Current problem and process</span>
            <textarea
              name="currentProcess"
              required
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
              defaultValue="The customer currently handles follow-up, content, lead capture, and reporting manually with inconsistent execution."
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Rules and limits</span>
              <textarea
                name="fulfillmentConstraints"
                required
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                defaultValue="Use human approval for regulated claims. Avoid guarantees, medical claims, and unsupported testimonials."
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Avatar or voice consent</span>
              <select name="avatarVoiceConsent" className="min-h-11 rounded-md border border-input bg-background px-3" defaultValue="not-applicable">
                <option value="not-applicable">not-applicable</option>
                <option value="approved">approved</option>
              </select>
            </label>
          </div>
          {supplementalFields.length ? (
            <details className="rounded-md border border-border bg-muted/25 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Optional universal launch context
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Add account details, source assets, approval rules, or handoff destinations once. Selected packages
                consume only the fields they need; unneeded fields are ignored. Leave optional fields blank to use
                managed handoffs.
              </p>
              <div className="mt-3 grid gap-3">
                {supplementalFields.map((field) => (
                  <FieldControl key={field.key} field={field} />
                ))}
              </div>
            </details>
          ) : null}
          <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
            {status === "loading" ? "Launching solutions..." : "Launch selected solutions"}
          </button>
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-3">
          <div className="grid max-h-[520px] gap-2 overflow-y-auto rounded-md border border-border bg-background p-3">
            {packages.map((pkg) => (
              <label key={pkg.slug} className="flex gap-3 rounded-md border border-border p-3 text-sm">
                <input name="packageSlugs" type="checkbox" value={pkg.slug} defaultChecked={defaultSelected.has(pkg.slug)} className="mt-1" />
                <span>
                  <span className="block font-semibold">{pkg.title}</span>
                  <span className="mt-1 block leading-relaxed text-muted-foreground">{pkg.customerOutcome}</span>
                </span>
              </label>
            ))}
          </div>
          <BundleResult status={status} result={result} />
        </div>
      </form>
    </section>
  );
}

function getDefaultValue(name: string): string {
  switch (name) {
    case "bookingUrl":
      return "https://cal.com/acme/qualified-call";
    case "webhookUrl":
      return "https://example.com/webhooks/lead-os";
    case "brandAssetsUrl":
      return "https://example.com/brand-assets";
    case "sourceAssetUrl":
      return "https://example.com/source-material";
    case "crmExportUrl":
      return "https://example.com/crm-export.csv";
    case "complianceRules":
      return "Use human approval for regulated claims. Avoid unsupported guarantees and unverified testimonials.";
    default:
      return "";
  }
}

function FieldControl({ field }: { field: PackageCredentialField }) {
  const label = (
    <span className="font-medium">
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
      {field.sensitive ? <span className="text-muted-foreground"> (secure reference)</span> : null}
    </span>
  );
  const commonClass = "min-h-11 rounded-md border border-input bg-background px-3";

  if (field.type === "textarea" || field.type === "password") {
    return (
      <label className="grid gap-1.5 text-sm">
        {label}
        <textarea
          name={field.key}
          required={field.required}
          className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
          defaultValue={getDefaultValue(field.key)}
        />
        <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-1.5 text-sm">
        {label}
        <select name={field.key} required={field.required} className={commonClass} defaultValue={field.options?.[0] ?? ""}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
      </label>
    );
  }

  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input
        name={field.key}
        type={field.type}
        required={field.required}
        className={commonClass}
        defaultValue={getDefaultValue(field.key)}
      />
      <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
    </label>
  );
}

function Input({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} type={type} required className="min-h-11 rounded-md border border-input bg-background px-3" defaultValue={defaultValue} />
    </label>
  );
}

function BundleResult({ status, result }: { status: Status; result: ProvisionedBundleResult | null }) {
  if (status === "idle" || !result) {
    return (
      <div className="rounded-md border border-border bg-muted/35 p-3 text-sm text-muted-foreground">
        Solution output will show delivery links, solution count, finished output count, and acceptance checks.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3 text-sm">
      <p className="font-semibold text-primary">Solution bundle launched: {result.bundleId}</p>
      <p className="mt-1 text-muted-foreground">
        {result.packageTitles.length} offers, {result.totalArtifacts} customer-ready outputs.
      </p>
      {result.valueCase ? (
        <div className="mt-3 rounded-md border border-primary/20 bg-background p-3">
          <p className="font-semibold text-foreground">Value case</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.valueCase.executiveSummary}</p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <ValueList title="Why it can be worth six figures" items={result.valueCase.sixFigureValueDrivers} />
            <ValueList title="Why they renew" items={result.valueCase.renewalReasons} />
          </div>
        </div>
      ) : null}
      {result.serviceReplacementStrategy ? (
        <div className="mt-3 rounded-md border border-primary/20 bg-background p-3">
          <p className="font-semibold text-foreground">Service-replacement strategy</p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <ValueList
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
            <ValueList
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
            <ValueList
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
            <ValueList
              title="Easy replacement wedges"
              items={[
                `Industries: ${result.serviceReplacementStrategy.easiestServiceReplacementIndustries.join(", ")}`,
                result.serviceReplacementStrategy.easiestServiceReplacementRationale,
                result.serviceReplacementStrategy.outsourcedOutcomeBudgetSignal,
                result.serviceReplacementStrategy.boringSchlepServiceOpportunity,
              ]}
            />
            <ValueList
              title="Easy replacement details"
              items={[
                result.serviceReplacementStrategy.fragmentedNonTechnicalReplacementPath,
                result.serviceReplacementStrategy.legalApplicationLayerReplacement,
                result.serviceReplacementStrategy.multilingualSupportReplacementAdvantage,
              ]}
            />
            <ValueList
              title="Business process automation"
              items={[
                result.serviceReplacementStrategy.businessProcessAutomationShift,
                result.serviceReplacementStrategy.servicePerformingAutomation,
                result.serviceReplacementStrategy.selfRegulatingAutomationLoop,
                result.serviceReplacementStrategy.processAutomationMoat,
                result.serviceReplacementStrategy.pilotToCoreInfrastructure,
              ]}
            />
            <ValueList
              title="Wallet, incentives, moat"
              items={[
                result.serviceReplacementStrategy.walletShareExpansion,
                result.serviceReplacementStrategy.alignedIncentives,
                result.serviceReplacementStrategy.intelligenceOperatingSystem,
                result.serviceReplacementStrategy.closedLoopSystem,
                result.serviceReplacementStrategy.openLoopReplacement,
                result.serviceReplacementStrategy.legibleOrganization,
                result.serviceReplacementStrategy.processPowerMoat,
              ]}
            />
            <ValueList
              title="Closed-loop operating system"
              items={[
                result.serviceReplacementStrategy.artifactGenerationPolicy,
                result.serviceReplacementStrategy.comprehensiveContextLayer,
                result.serviceReplacementStrategy.autonomousSprintPlanning,
                result.serviceReplacementStrategy.humanMiddlewareRemoval,
                result.serviceReplacementStrategy.closedLoopVelocityGain,
              ]}
            />
            <ValueList
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
            <ValueList
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
            <ValueList
              title="Speed moat"
              items={[
                result.serviceReplacementStrategy.speedMoatThesis,
                result.serviceReplacementStrategy.speedMoatAgainstLabs,
                result.serviceReplacementStrategy.humanMiddlewareSpeedGain,
                result.serviceReplacementStrategy.queryableSprintCompression,
              ]}
            />
            <ValueList
              title="Speed moat mechanics"
              items={[
                result.serviceReplacementStrategy.oneDaySprintCadence,
                result.serviceReplacementStrategy.forwardDeployedSpeedLoop,
                result.serviceReplacementStrategy.specializedEvalMinting,
                result.serviceReplacementStrategy.treasureBeforeLabs,
              ]}
            />
            <ValueList
              title="Moat powers"
              items={[
                result.serviceReplacementStrategy.moatPowerFrameworkSummary,
                result.serviceReplacementStrategy.speedAsPrimaryMoat,
                result.serviceReplacementStrategy.processPowerLastTenPercentMoat,
                result.serviceReplacementStrategy.counterpositioningWorkBasedPricingMoat,
                result.serviceReplacementStrategy.switchingCostsDeepIntegrationMoat,
                result.serviceReplacementStrategy.networkEconomyEvalFlywheel,
                result.serviceReplacementStrategy.corneredResourceDataEvalMoat,
                result.serviceReplacementStrategy.scaleEconomiesInfrastructureMoat,
                result.serviceReplacementStrategy.brandingTrustMoat,
                result.serviceReplacementStrategy.schlepBlindnessBoringSpaceMoat,
                result.serviceReplacementStrategy.systemOfRecordDataLockIn,
                ...result.serviceReplacementStrategy.aiSevenPowersFramework,
              ]}
            />
            <ValueList
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
            <ValueList
              title="Drudgery discovery"
              items={[
                result.serviceReplacementStrategy.drudgeryDiscoveryThesis,
                result.serviceReplacementStrategy.forwardDeployedTimeInMotion,
                result.serviceReplacementStrategy.nittyGrittyWorkflowMap,
                result.serviceReplacementStrategy.hiddenLogicDiscovery,
              ]}
            />
            <ValueList
              title="Field research filters"
              items={[
                result.serviceReplacementStrategy.attritionDiscoverySignal,
                result.serviceReplacementStrategy.boringWorkflowSchlepMap,
                result.serviceReplacementStrategy.lossyMiddlewareDiscovery,
                result.serviceReplacementStrategy.fieldResearchTruckStopMethod,
              ]}
            />
            <ValueList
              title="Reliability pain filters"
              items={[
                result.serviceReplacementStrategy.missionCriticalWorkflowFilter,
                result.serviceReplacementStrategy.hackathonReliabilityGap,
                result.serviceReplacementStrategy.existentialPainWorkflowFilter,
              ]}
            />
            <ValueList
              title="Incumbent speed gap"
              items={[
                result.serviceReplacementStrategy.incumbentCraftOverhead,
                result.serviceReplacementStrategy.legacyOperatingConstraint,
                result.serviceReplacementStrategy.aiNativeFromDayOneAdvantage,
              ]}
            />
            <ValueList
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
            <ValueList
              title="Process power moat"
              items={[
                result.serviceReplacementStrategy.wrapperCloneMisconception,
                result.serviceReplacementStrategy.accuracyHurdleMoat,
                result.serviceReplacementStrategy.bigLabDrudgeryDefense,
                result.serviceReplacementStrategy.deepBackendLogicMoat,
              ]}
            />
            <ValueList
              title="Reliability factory"
              items={[
                result.serviceReplacementStrategy.softwareFactorySpecContract,
                result.serviceReplacementStrategy.agentIterationLoop,
                result.serviceReplacementStrategy.lastTenPercentReliability,
                result.serviceReplacementStrategy.tddSoftwareFactoryLoop,
              ]}
            />
            <ValueList
              title="Scenario and eval loop"
              items={[
                result.serviceReplacementStrategy.scenarioValidationThreshold,
                result.serviceReplacementStrategy.probabilisticReviewGate,
                result.serviceReplacementStrategy.validationDrivenReviewReplacement,
                result.serviceReplacementStrategy.thresholdEvidencePolicy,
              ]}
            />
            <ValueList
              title="Specs-only posture"
              items={[
                result.serviceReplacementStrategy.evalFlywheel,
                result.serviceReplacementStrategy.zeroHandwrittenCodePosture,
                result.serviceReplacementStrategy.specsOnlyRepositoryGoal,
                result.serviceReplacementStrategy.contextEngineeringShift,
              ]}
            />
            <ValueList
              title="Edge-case moat"
              items={[
                result.serviceReplacementStrategy.domainEdgeCaseDrudgery,
                result.serviceReplacementStrategy.missionCriticalProcessPower,
                result.serviceReplacementStrategy.integrationSurfaceAreaMoat,
                result.serviceReplacementStrategy.customerMintedWorkflow,
              ]}
            />
            <ValueList
              title="Switching cost"
              items={[
                result.serviceReplacementStrategy.thousandXEngineerModel,
                result.serviceReplacementStrategy.incumbentCultureReset,
              ]}
            />
            <ValueList
              title="Process power"
              items={[
                result.serviceReplacementStrategy.processPowerMoat,
                result.serviceReplacementStrategy.humanWranglingModel,
              ]}
            />
            <ValueList title="Org archetypes" items={result.serviceReplacementStrategy.organizationalArchetypes} />
          </div>
        </div>
      ) : null}
      {result.customerGuide ? (
        <div className="mt-3 rounded-md border border-primary/20 bg-background p-3">
          <p className="font-semibold text-foreground">{result.customerGuide.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.customerGuide.executiveOverview}</p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <ValueList title="Start here" items={result.customerGuide.startHere} />
            <ValueList title="How to operate it" items={result.customerGuide.operatingWorkflow} />
          </div>
        </div>
      ) : null}
      {result.ideaEvaluationGuardrails ? (
        <div className="mt-3 rounded-md border border-primary/20 bg-background p-3">
          <p className="font-semibold text-foreground">Startup idea guardrails</p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <ValueList
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
            <ValueList
              title="Fit, hard part, pricing"
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
            <ValueList title="High-value needs" items={result.ideaEvaluationGuardrails.highValueNeedCategories} />
            <ValueList title="Tar-pit category warnings" items={result.ideaEvaluationGuardrails.tarPitCategoryWarnings} />
            <ValueList title="Tar-pit research protocol" items={result.ideaEvaluationGuardrails.tarPitResearchProtocol} />
            <ValueList title="Tar-pit avoidance checklist" items={result.ideaEvaluationGuardrails.tarPitAvoidanceChecklist} />
          </div>
        </div>
      ) : null}
      <div className="mt-3 max-h-40 overflow-y-auto rounded border border-border bg-background">
        {result.urls.workspaces.map((url) => (
          <a key={url} href={url} className="block border-b border-border p-2 last:border-b-0">
            {url}
          </a>
        ))}
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
        {result.acceptanceTests.map((test) => (
          <li key={test.test}>{test.test}: {test.status}</li>
        ))}
      </ul>
    </div>
  );
}

function ValueList({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.slice(0, 4);
  const remainingItems = items.slice(4);

  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <ul className="mt-1 grid gap-1 text-muted-foreground">
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
      {remainingItems.length > 0 ? (
        <details className="mt-2 rounded border border-border bg-muted/25 p-2 text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Show {remainingItems.length} more
          </summary>
          <ul className="mt-2 grid gap-1">
            {remainingItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
