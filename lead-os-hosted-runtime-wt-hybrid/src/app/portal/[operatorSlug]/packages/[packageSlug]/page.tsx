import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPackageAudienceContract, getPackageAutomationContract, getPackageNicheExamples } from "@/lib/package-catalog";
import { getOperatorPortal, getPortalHomePath, getPortalPackage } from "@/lib/operator-portals";

type Props = {
  params: Promise<{ operatorSlug: string; packageSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { operatorSlug, packageSlug } = await params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) return {};
  const pkg = getPortalPackage(portal, packageSlug);
  if (!pkg) return {};
  return {
    title: {
      absolute: `${pkg.title} | ${portal.brandName}`,
    },
    description: pkg.customerOutcome,
    openGraph: {
      title: `${pkg.title} | ${portal.brandName}`,
      description: pkg.customerOutcome,
      siteName: portal.brandName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${pkg.title} | ${portal.brandName}`,
      description: pkg.customerOutcome,
    },
  };
}

export default async function OperatorPackagePage({ params }: Props) {
  const { operatorSlug, packageSlug } = await params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) notFound();
  const pkg = getPortalPackage(portal, packageSlug);
  if (!pkg) notFound();

  const audience = getPackageAudienceContract(pkg);
  const automation = getPackageAutomationContract(pkg);
  const niches = getPackageNicheExamples(pkg.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link href={getPortalHomePath(portal)} className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {portal.brandName}
        </Link>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div>
          <Badge variant="secondary" className="mb-4">Standalone client service</Badge>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground">{pkg.title}</h1>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{pkg.customerOutcome}</p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{pkg.launchPromise}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`${getPortalHomePath(portal)}#launch`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground">
              Launch this service <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={`${getPortalHomePath(portal)}#services`} className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-semibold text-foreground">
              Compare services
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Who this is for</CardTitle>
            <CardDescription>{audience.buyer}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Sale motion:</span> {audience.model}</p>
            <p><span className="font-semibold text-foreground">Recipient:</span> {audience.recipient}</p>
            <p><span className="font-semibold text-foreground">Downstream experience:</span> {audience.downstreamExperience}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Messaging</CardTitle>
            <CardDescription>Lead with the result, not the machinery.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {`"${portal.brandName} installs ${pkg.title.toLowerCase()} so ${audience.buyer.toLowerCase()} can ${pkg.customerOutcome.toLowerCase()}"`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pain points</CardTitle>
            <CardDescription>What the buyer already feels.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            {[
              "They want the outcome without learning another dashboard.",
              "Their current process is slow, manual, scattered, or hard to prove.",
              "They need a customer-ready result with guides, ownership, and failure handling.",
            ].map((point) => (
              <p key={point}>{point}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expected outcome</CardTitle>
            <CardDescription>What is delivered after intake.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">{pkg.launchPromise}</CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>What gets delivered</CardTitle>
            <CardDescription>Each output is created with directions, workflow, acceptance checks, and next actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {pkg.deliverables.map((deliverable) => (
              <div key={deliverable.id} className="rounded-md border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">{deliverable.title}</h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{deliverable.createdArtifact}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">{deliverable.launchSurface}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provisioning readiness</CardTitle>
            <CardDescription>Prepared for autonomous launch from the portal intake.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>Modular standalone service: {automation.modular ? "Yes" : "No"}</p>
            <p>Automated delivery contract: {automation.fullyAutomated ? "Ready" : "Needs review"}</p>
            <p>Additional configuration after intake: {automation.requiresAdditionalConfiguration ? "Required" : "Not required for delivery"}</p>
            <p>Delivery mode: {automation.deliveryMode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reusable niches</CardTitle>
            <CardDescription>This service can be sold across multiple markets.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {niches.map((niche) => (
              <span key={niche} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">{niche}</span>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
