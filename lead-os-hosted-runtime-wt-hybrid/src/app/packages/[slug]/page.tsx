import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PackageBundleProvisionForm } from "@/components/PackageBundleProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPackageAudienceContract,
  getPackageAutomationContract,
  getPackagePlanNames,
  getProvisionablePackage,
  getUniversalPackageCredentialFields,
  provisionablePackages,
} from "@/lib/package-catalog";
import { getPackagePersonaBlueprint } from "@/lib/package-persona-blueprints";

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
  const personaBlueprint = getPackagePersonaBlueprint(pkg.slug);

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
        {pkg.pricingModel ? (
          <p className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            <span className="font-semibold">Suggested agency pricing:</span> {pkg.pricingModel}
          </p>
        ) : null}
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
