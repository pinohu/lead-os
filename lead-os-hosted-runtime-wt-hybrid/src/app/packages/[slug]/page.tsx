import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, PlayCircle } from "lucide-react";
import { PackageBundleProvisionForm } from "@/components/PackageBundleProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPackageAudienceContract,
  getPackageAutomationContract,
  getPackageIdeaEvaluationGuardrails,
  getPackagePlanNames,
  getPackageServiceReplacementStrategy,
  getProvisionablePackage,
  getUniversalPackageCredentialFields,
  provisionablePackages,
} from "@/lib/package-catalog";
import { getPackagePersonaBlueprint } from "@/lib/package-persona-blueprints";
import { getPackageClientExample } from "@/lib/package-client-examples";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return provisionablePackages.map((pkg) => ({ slug: pkg.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = getProvisionablePackage(slug);
  if (!pkg) return {};
  return {
    title: `${pkg.title} | Complete Solution`,
    description: pkg.customerOutcome,
  };
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const pkg = getProvisionablePackage(slug);
  if (!pkg) notFound();
  const automationContract = getPackageAutomationContract(pkg);
  const audience = getPackageAudienceContract(pkg);
  const serviceStrategy = getPackageServiceReplacementStrategy(pkg);
  const ideaGuardrails = getPackageIdeaEvaluationGuardrails(pkg);
  const personaBlueprint = getPackagePersonaBlueprint(pkg.slug);
  const clientExample = getPackageClientExample(pkg.slug);
  const launchReadinessCards = [
    {
      title: "Demand proof",
      body: ideaGuardrails.pricingBinaryValidationSignal,
    },
    {
      title: "Outcome pricing",
      body: serviceStrategy.outcomePricing,
    },
    {
      title: "Process moat",
      body: serviceStrategy.processPowerLastTenPercentMoat,
    },
    {
      title: "Reliability gate",
      body: serviceStrategy.lastTenPercentReliability,
    },
  ] as const;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/packages">All solutions</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboard">Start account setup</Link>
        </Button>
      </div>

      <section className="mb-8">
        <Badge variant="secondary" className="mb-4">Sell and launch this solution</Badge>
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground">{pkg.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{pkg.customerOutcome}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          What happens after your client buys: they complete the intake form below, and Lead OS creates the business-ready
          solution plus any downstream customer-facing surfaces this offer requires. Included in: {getPackagePlanNames(pkg)}
        </p>
        {clientExample ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/client-examples/${pkg.slug}`}>
                View example client website <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/client-examples/${pkg.slug}#tutorial`}>
                Step-by-step tutorial <PlayCircle className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : null}
        {pkg.pricingModel ? (
          <p className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            <span className="font-semibold">Suggested agency pricing:</span> {pkg.pricingModel}
          </p>
        ) : null}
      </section>

      <section className="mb-8" aria-labelledby="launch-readiness-heading">
        <Badge variant="outline" className="mb-3">
          Launch readiness
        </Badge>
        <h2 id="launch-readiness-heading" className="text-2xl font-bold text-foreground">
          Decide from proof first, then inspect the full operating thesis.
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {launchReadinessCards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <details className="rounded-lg border border-border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Full service-replacement strategy
            <span className="ml-2 font-normal text-muted-foreground">Expand for the complete operating thesis.</span>
          </summary>
          <Card className="mt-4 border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle>Service-replacement strategy</CardTitle>
            <CardDescription>
              This package is framed as work delivered, not a seat-based SaaS tool or co-pilot the buyer has to operate.
            </CardDescription>
          </CardHeader>
          <CardContent
            className="grid max-h-[720px] gap-3 overflow-y-auto pr-2 text-sm md:grid-cols-2"
            tabIndex={0}
            aria-label="Detailed service-replacement evidence"
          >
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Services budget</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.servicesBudgetTarget}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Service-heavy markets</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.targetServiceIndustries.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Industry replacement thesis</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.serviceReplacementIndustryThesis}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Financial/admin markets</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.financialAdminServiceMarkets.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Banking operations</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.bankingOperationsUseCases.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Healthcare and legal</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.healthcareLegalServiceMarkets.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Specialized verticals</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.specializedVerticalMarkets.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Support and language</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.customerSupportLanguageMarkets.join(", ")}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Easy replacement industries</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2">
                {serviceStrategy.easiestServiceReplacementIndustries.map((industry) => (
                  <li key={industry}>{industry}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Why easiest to replace</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.easiestServiceReplacementRationale}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Outsourced outcome budget</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outsourcedOutcomeBudgetSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Boring schlep</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.boringSchlepServiceOpportunity}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fragmented non-technical markets</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.fragmentedNonTechnicalReplacementPath}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Legal application layer</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.legalApplicationLayerReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Multilingual support advantage</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.multilingualSupportReplacementAdvantage}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Outsourced-service readiness</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outsourcedServiceReadiness}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fragmented non-tech wedge</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.fragmentedNonTechBudgetOpportunity}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">High-attrition labor wedge</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.highAttritionLaborWedge}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pricing trade-off</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.pricingTradeoffSummary}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Per-seat cannibalization trap</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.perSeatCannibalizationTrap}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Per-seat wallet limit</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.perSeatLimitedWalletShare}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Incumbent pricing resistance</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.incumbentPricingCultureResistance}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Work-based pricing opportunity</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.workBasedPricingOpportunity}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Services-budget upside</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.servicesBudgetPricingUpside}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Labor attrition value</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outcomeDrivenLaborAttritionValue}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Superhuman capability pricing</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.superhumanCapabilityPricing}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Work-based pilot risk</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.workBasedPricingPilotRisk}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pricing survival rule</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.pricingSurvivalRule}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Pricing trade-off matrix</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {serviceStrategy.pricingTradeoffMatrix.map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Per-seat risk</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.perSeatRisk}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Outcome pricing</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outcomePricing}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Business process automation</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.businessProcessAutomationShift}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Service-performing automation</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.servicePerformingAutomation}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Self-regulating loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.selfRegulatingAutomationLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Task-priced automation</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.taskPricedAutomation}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Wallet share</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.walletShareExpansion}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Aligned incentives</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.alignedIncentives}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Closed loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.closedLoopSystem}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Open-loop replacement</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.openLoopReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Legible organization</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.legibleOrganization}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Artifact generation</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.artifactGenerationPolicy}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Comprehensive context</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.comprehensiveContextLayer}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Autonomous sprint planning</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.autonomousSprintPlanning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Human middleware removal</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.humanMiddlewareRemoval}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Closed-loop velocity</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.closedLoopVelocityGain}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Intelligence OS</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.intelligenceOperatingSystem}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Queryable organization</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableOrganizationModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Operating system view</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableOperatingSystemView}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Artifact-rich legibility sources</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {serviceStrategy.artifactRichLegibilitySources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Legible by default</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.legibleByDefaultPolicy}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Queryable middleware replacement</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableHumanMiddlewareReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Autonomous coordination</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableAutonomousCoordination}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Queryable humans at the edge</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableHumansAtEdgeRole}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Queryable token maxing</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableTokenMaxingRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Artifact-rich environment</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.artifactRichEnvironment}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Transparent channels</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.transparentCommunicationPolicy}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Contextual parity</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.contextualParityRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Intelligence-layer coordination</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.intelligenceLayerCoordination}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Humans at the edge</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.humansAtTheEdgeModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Sprint intelligence loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.sprintPlanningIntelligenceLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Token-maxing cost shift</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.tokenMaxingCostShift}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Process power</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.processPowerMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Not a wrapper</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.wrapperCloneMisconception}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">99% accuracy hurdle</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.accuracyHurdleMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Big-lab defense</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.bigLabDrudgeryDefense}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Deep backend logic</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.deepBackendLogicMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Integration surface area</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.integrationSurfaceAreaMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Customer-minted workflow</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.customerMintedWorkflow}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Process automation moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.processAutomationMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pilot to core infrastructure</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.pilotToCoreInfrastructure}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">AI software factory</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.aiSoftwareFactory}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Software factory speed moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.softwareFactorySpeedMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Speed moat thesis</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.speedMoatThesis}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Speed moat against labs</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.speedMoatAgainstLabs}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Human-middleware speed gain</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.humanMiddlewareSpeedGain}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Queryable sprint compression</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.queryableSprintCompression}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">One-day sprint cadence</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.oneDaySprintCadence}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Incumbent craft overhead</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.incumbentCraftOverhead}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Legacy operating constraint</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.legacyOperatingConstraint}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">AI-native from day one</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.aiNativeFromDayOneAdvantage}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Forward-deployed speed loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.forwardDeployedSpeedLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Moat powers framework</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.moatPowerFrameworkSummary}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Speed as primary moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.speedAsPrimaryMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">AI Seven Powers framework</h2>
              <ul className="mt-2 grid gap-2 pl-0 md:grid-cols-2">
                {serviceStrategy.aiSevenPowersFramework.map((power) => (
                  <li key={power} className="rounded-md bg-muted/50 p-2 text-muted-foreground">
                    {power}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Process-power last 10%</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.processPowerLastTenPercentMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Counterpositioning moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.counterpositioningWorkBasedPricingMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Switching-costs moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.switchingCostsDeepIntegrationMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Eval network economy</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.networkEconomyEvalFlywheel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Cornered resource moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.corneredResourceDataEvalMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Scale economies moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.scaleEconomiesInfrastructureMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Branding trust moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.brandingTrustMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Schlep-blindness moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.schlepBlindnessBoringSpaceMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">System-of-record lock-in</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.systemOfRecordDataLockIn}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Outcome Graph moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outcomeGraphMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Outcome event schema</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {serviceStrategy.outcomeGraphEventSchema.map((event) => (
                  <li key={event}>{event}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Outcome data assets</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {serviceStrategy.outcomeGraphDataAssets.map((asset) => (
                  <li key={asset}>{asset}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Borrowed tool patterns</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground md:grid-cols-2">
                {serviceStrategy.borrowedToolStrengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Agency resale pattern</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.agencyResalePattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">System-of-record trust</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.systemOfRecordTrustPattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Connector readiness</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.connectorReadinessPattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">GTM data execution</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.gtmDataExecutionPattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Brand governance</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.brandGovernancePattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Agent operations</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.agentOpsObservabilityPattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Ontology depth</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.ontologyForwardDeployedPattern}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Borrowing guardrail</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.competitorRepresentationGuardrail}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Vertical eval flywheel</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.verticalEvalFlywheel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Certified Outcome standard</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.certifiedOutcomeStandard}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Switching-cost memory</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.switchingCostMemory}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Package marketplace loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.packageMarketplaceLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Outcome billing moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.outcomeBillingMoat}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Forward-deployed learning</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.forwardDeployedLearningLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Moat proof checklist</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground md:grid-cols-2">
                {serviceStrategy.moatProofChecklist.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
              <p className="mt-3 text-muted-foreground">{serviceStrategy.moatOperatingRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Drudgery discovery thesis</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.drudgeryDiscoveryThesis}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Forward-deployed time-in-motion</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.forwardDeployedTimeInMotion}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Nitty-gritty workflow map</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.nittyGrittyWorkflowMap}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Hidden logic discovery</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.hiddenLogicDiscovery}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Attrition discovery signal</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.attritionDiscoverySignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Boring workflow schlep map</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.boringWorkflowSchlepMap}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Lossy middleware discovery</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.lossyMiddlewareDiscovery}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Truck-stop field research</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.fieldResearchTruckStopMethod}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Mission-critical workflow filter</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.missionCriticalWorkflowFilter}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Hackathon reliability gap</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.hackathonReliabilityGap}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Existential pain workflow filter</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.existentialPainWorkflowFilter}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Specialized eval minting</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.specializedEvalMinting}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Treasure before labs</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.treasureBeforeLabs}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Spec and test harness</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.softwareFactorySpecContract}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Agent iteration loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.agentIterationLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Last 10% reliability</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.lastTenPercentReliability}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">TDD agent loop</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.tddSoftwareFactoryLoop}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Scenario threshold</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.scenarioValidationThreshold}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Probabilistic review gate</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.probabilisticReviewGate}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Validation as reviewer</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.validationDrivenReviewReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Threshold evidence</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.thresholdEvidencePolicy}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Zero handwritten code posture</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.zeroHandwrittenCodePosture}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Specs-only repository goal</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.specsOnlyRepositoryGoal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Thousandx engineer</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.thousandXEngineerModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Incumbent culture reset</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.incumbentCultureReset}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Context engineering shift</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.contextEngineeringShift}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Eval flywheel</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.evalFlywheel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Domain edge cases</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.domainEdgeCaseDrudgery}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Mission-critical moat</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.missionCriticalProcessPower}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Human wrangling model</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.humanWranglingModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Token-usage org design</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.tokenUsageOrgDesign}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Management hierarchy replacement</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.managementHierarchyReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">IC builder operator</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.icBuilderOperatorModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Prototype-first meetings</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.prototypeFirstMeetingCulture}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI outcome ownership</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driOutcomeOwnershipModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">One person, one outcome</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.onePersonOneOutcomeRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI strategy outcome focus</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driStrategyOutcomeFocus}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI specific result contract</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driSpecificResultContract}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI no hierarchy hiding</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driNoHierarchyHidingRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI middle management replacement</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driMiddleManagementReplacement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI intelligence layer guidance</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driIntelligenceLayerGuidance}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI edge guidance role</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driEdgeGuidanceRole}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI token-maxing leverage</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driTokenMaxingLeverage}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">DRI information velocity guardrail</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.driInformationVelocityGuardrail}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">AI founder leadership</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.aiFounderLeadershipModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">AI strategy ownership</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.aiStrategyOwnershipRule}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Token-usage archetypes</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.tokenUsageArchetypeOperatingModel}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Human-middleware velocity</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.humanMiddlewareVelocityGain}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Single-person agent leverage</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.singlePersonAgentLeverage}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Lean departments</h2>
              <p className="mt-1 text-muted-foreground">{serviceStrategy.leanDepartmentOperatingModel}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">AI-native org archetypes</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {serviceStrategy.organizationalArchetypes.map((archetype) => (
                  <li key={archetype}>{archetype}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          </Card>
        </details>
      </section>

      <section className="mb-8">
        <details className="rounded-lg border border-border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Startup idea guardrails
            <span className="ml-2 font-normal text-muted-foreground">Expand for tar-pit, pricing, and acute-pain checks.</span>
          </summary>
          <Card className="mt-4 border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle>Startup idea guardrails</CardTitle>
            <CardDescription>
              Before selling this package, confirm it is not a solution in search of a problem, superficially plausible tar pit, or low-pain offer.
            </CardDescription>
          </CardHeader>
          <CardContent
            className="grid max-h-[640px] gap-3 overflow-y-auto pr-2 text-sm md:grid-cols-2"
            tabIndex={0}
            aria-label="Detailed startup idea guardrails"
          >
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Real problem</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.problemRealityCheck}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Superficial plausibility</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.superficialPlausibilityCheck}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Technology-first trap</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.technologyFirstTrapWarning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Tar pit risk</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.tarPitRiskCheck}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Social-app warning</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.socialCoordinationTarPitWarning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fun discovery warning</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.funDiscoveryTarPitWarning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Abstract-problem warning</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.abstractSocietalProblemWarning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Low-hit-rate spaces</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.lowHitRateIdeaSpaceWarning}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Hard part</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.hardPartHypothesis}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Founder-market fit</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.founderMarketFitCheck}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Acute pain</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.acutePainCheck}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Top-three priority</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.topThreePriorityTest}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fire-or-promotion test</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.existentialPainTest}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fire-or-promotion acuteness gate</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.fireOrPromotionAcutenessTest}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Fire risk signal</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.fireRiskSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Promotion upside signal</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.promotionUpsideSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Top-three problem requirement</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.topThreeProblemRequirement}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Willingness-to-pay acuteness</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.willingnessToPayAcutenessSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Plain-sight opportunity</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.plainSightOpportunitySignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Boring-space validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.boringSpaceValidationThesis}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Physical-observation schlep</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.physicalObservationSchlepProtocol}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Invisible pain discovery</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.invisiblePainDiscoverySignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Forward-deployed workflow validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.forwardDeployedWorkflowValidation}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Last-10-percent validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.lastTenPercentEdgeCaseValidation}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pricing binary validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.pricingBinaryValidationSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Binary Test definition</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.pricingBinaryTestDefinition}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Open-wallet value signal</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.openWalletValueSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Customer segment signal</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.binaryTestCustomerSegmentSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Premium-price learning</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.premiumPriceLearningSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Complain-but-pay signal</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.complainButPayValidationSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">High-attrition validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.highAttritionValidationSignal}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Alternative is nothing</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.alternativeIsNothingTest}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Charge validation</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.chargeValidationTest}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Moat timing</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.moatTiming}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pricing discipline</h2>
              <p className="mt-1 text-muted-foreground">{ideaGuardrails.pricingDiscipline}</p>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Tar-pit category warnings</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {ideaGuardrails.tarPitCategoryWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Tar-pit research protocol</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {ideaGuardrails.tarPitResearchProtocol.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">Tar-pit avoidance checklist</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {ideaGuardrails.tarPitAvoidanceChecklist.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border p-3 md:col-span-2">
              <h2 className="font-semibold">High-value need categories</h2>
              <ul className="mt-2 grid gap-2 text-muted-foreground">
                {ideaGuardrails.highValueNeedCategories.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          </Card>
        </details>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Business buyer</CardTitle>
            <CardDescription>{pkg.buyerPersona}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client business receives</CardTitle>
            <CardDescription>{pkg.launchPromise}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audience model: {audience.model}</CardTitle>
            <CardDescription>{audience.summary}</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Downstream experience</CardTitle>
            <CardDescription>{audience.downstreamExperience}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Modular launch</CardTitle>
            <CardDescription>Can be delivered alone, in a selected bundle, or with the full solution catalog.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>No extra setup</CardTitle>
            <CardDescription>Optional account connections use managed handoffs, so delivery starts from the intake form.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Multi-niche ready</CardTitle>
            <CardDescription>{automationContract.nicheExamples.join(", ")}</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Who this offer is for</CardTitle>
            <CardDescription>{personaBlueprint.offerFor}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <h2 className="font-semibold">Decision maker</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{personaBlueprint.decisionMaker}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h2 className="font-semibold">Resident or end user served</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{personaBlueprint.residentPersona}</p>
            </div>
            <div className="rounded-md border border-border p-4 md:col-span-2">
              <h2 className="font-semibold">Messaging</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{personaBlueprint.messaging}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Specific pain points</CardTitle>
            <CardDescription>What the resident, end user, client, or internal operator is struggling with.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {personaBlueprint.residentPainPoints.map((pain) => (
                <li key={pain} className="rounded-md border border-border p-3">{pain}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expected result</CardTitle>
            <CardDescription>{personaBlueprint.expectedOutcome}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="mb-2 font-semibold">Delivery shape</h2>
            <div className="flex flex-wrap gap-2">
              {personaBlueprint.deliveryShape.map((item) => (
                <span key={item} className="rounded-md border border-border bg-muted/50 px-3 py-1 text-sm">{item}</span>
              ))}
            </div>
            <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              {personaBlueprint.verificationPosture}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User journey</CardTitle>
            <CardDescription>The experience path for the specific persona this offer serves.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {personaBlueprint.userJourney.map((step, index) => (
                <li key={`${step.stage}-${index}`} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-semibold">{step.stage}</span>
                  </div>
                  <p className="text-muted-foreground">{step.personaGoal}</p>
                  <p className="mt-2">{step.systemExperience}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Evidence: {step.evidence}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Service blueprint</CardTitle>
            <CardDescription>Frontstage experience, backstage provisioning, support system, and failure handling.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {personaBlueprint.serviceBlueprint.map((step) => (
                <div key={step.phase} className="rounded-md border border-border p-3">
                  <h2 className="font-semibold">{step.phase}</h2>
                  <p className="mt-2"><span className="font-medium">Frontstage:</span> {step.frontstage}</p>
                  <p className="mt-1"><span className="font-medium">Backstage:</span> {step.backstage}</p>
                  <p className="mt-1"><span className="font-medium">Support:</span> {step.support}</p>
                  <p className="mt-1 text-muted-foreground"><span className="font-medium">Failure state:</span> {step.failureState}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {pkg.autonomousWorkflow?.length ? (
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>How the solution is fulfilled</CardTitle>
              <CardDescription>
                The business buyer buys the outcome. These provisioning responsibilities turn the client's intake into the completed result.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 text-sm md:grid-cols-2">
                {pkg.autonomousWorkflow.map((step, index) => (
                  <li key={step} className="rounded-md border border-border p-3">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>What your client receives</CardTitle>
            <CardDescription>
              These business-ready assets, handoffs, reports, customer-facing pieces, and implementation guides are created when the form is submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm md:grid-cols-2">
              {pkg.deliverables.map((deliverable) => (
                <li key={deliverable.id} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium">{deliverable.title}:</span> {deliverable.createdArtifact}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {clientExample ? (
        <section className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Example client website</CardTitle>
              <CardDescription>
                A standalone example for {clientExample.clientName}. It shows this package as if it belongs to the
                client, not to Lead OS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={clientExample.photoUrl}
                alt={clientExample.photoAlt}
                className="mb-4 h-44 w-full rounded-lg object-cover"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">{clientExample.plainPromise}</p>
              <Button asChild className="mt-4" size="sm">
                <Link href={`/client-examples/${pkg.slug}`}>
                  Open the client site <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Simple steps the client follows</CardTitle>
              <CardDescription>
                These are written in plain language so the buyer knows what to do with the finished system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 text-sm">
                {clientExample.simpleSteps.map((step, index) => (
                  <li key={step} className="rounded-md border border-border p-3">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <PackageBundleProvisionForm
        packages={provisionablePackages.map((item) => ({
          slug: item.slug,
          title: item.title,
          customerOutcome: item.customerOutcome,
        }))}
        fields={getUniversalPackageCredentialFields()}
        defaultSelectedSlugs={[pkg.slug]}
        title={`Launch ${pkg.title} alone or merge it with other solutions`}
        description="This standalone offer uses the same universal intake as every bundle. Keep only this solution selected, or add any other packages before launch; the backend provisions the selected combination from this one submitted form."
      />
    </main>
  );
}
