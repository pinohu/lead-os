import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PackageProvisionForm } from "@/components/PackageProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPackageAudienceContract,
  getPackageAutomationContract,
  getPackagePlanNames,
  getProvisionablePackage,
  provisionablePackages,
} from "@/lib/package-catalog";

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
            <CardDescription>These business-ready assets, handoffs, reports, and any customer-facing pieces are created when the form is submitted.</CardDescription>
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

      <PackageProvisionForm packageSlug={pkg.slug} fields={pkg.credentialFields} />
    </main>
  );
}
