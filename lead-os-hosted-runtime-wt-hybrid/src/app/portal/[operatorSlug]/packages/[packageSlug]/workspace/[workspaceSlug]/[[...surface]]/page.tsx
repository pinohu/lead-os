import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDeliverableGuide, buildPackageCustomerGuide } from "@/lib/package-guidance";
import { getOperatorPortal, getPortalHomePath, getPortalPackage, getPortalPackagePath } from "@/lib/operator-portals";

type Props = {
  params: Promise<{ operatorSlug: string; packageSlug: string; workspaceSlug: string; surface?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { operatorSlug, packageSlug, workspaceSlug } = await params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) return {};
  const pkg = getPortalPackage(portal, packageSlug);
  if (!pkg) return {};
  return {
    title: {
      absolute: `${pkg.title} client delivery hub | ${portal.brandName}`,
    },
    description: `${portal.brandName} client delivery workspace ${workspaceSlug}`,
    openGraph: {
      title: `${pkg.title} client delivery hub | ${portal.brandName}`,
      description: `${portal.brandName} client delivery workspace ${workspaceSlug}`,
      siteName: portal.brandName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${pkg.title} client delivery hub | ${portal.brandName}`,
      description: `${portal.brandName} client delivery workspace ${workspaceSlug}`,
    },
  };
}

export default async function OperatorPackageWorkspacePage({ params, searchParams }: Props) {
  const { operatorSlug, packageSlug, workspaceSlug, surface } = await params;
  const query = await searchParams;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) notFound();
  const pkg = getPortalPackage(portal, packageSlug);
  if (!pkg) notFound();

  const activeSurface = surface?.[0] ?? "workspace";
  const brand = value(query.brand) || workspaceSlug;
  const market = value(query.market) || "the selected customer market";
  const offer = value(query.offer) || pkg.customerOutcome;
  const success = value(query.success) || "the client-defined success metric";
  const guideBrief = {
    desiredOutcome: offer,
    intendedBeneficiary: market,
    successMetric: success,
  };
  const visibleOutputs = activeSurface === "workspace"
    ? pkg.deliverables
    : pkg.deliverables.filter((deliverable) => deliverable.launchSurface === activeSurface || (activeSurface === "operator" && deliverable.launchSurface === "automation"));
  const packageGuide = buildPackageCustomerGuide(pkg, guideBrief, undefined, {
    engineRoleName: `${portal.brandName} service engine`,
    managedHandoffLabel: "service handoff",
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={getPortalPackagePath(portal, pkg.slug)}>Back to service</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={getPortalHomePath(portal)}>All services</Link>
        </Button>
      </div>

      <section className="mb-8">
        <Badge variant="secondary" className="mb-4">{portal.brandName} client delivery hub</Badge>
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground">{brand}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {pkg.title} delivered for {market}. Primary outcome: {offer}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Measured by</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{success}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Delivery proof</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Finished outputs, URLs, service handoffs, and acceptance checks are visible inside this hub.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Next expansion</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Add client-owned account access, optimize from usage data, or bundle another {portal.brandName} service.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-3 md:grid-cols-5">
        {["workspace", "capture", "operator", "reporting", "billing"].map((item) => (
          <Link
            key={item}
            href={surfaceHref(portal.slug, pkg.slug, workspaceSlug, item, query)}
            className={`rounded-md border p-3 text-sm capitalize underline-offset-4 hover:underline ${
              activeSurface === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
            }`}
          >
            {surfaceLabel(item)}
          </Link>
        ))}
      </section>

      {activeSurface === "capture" ? <CaptureSurface brand={brand} offer={offer} market={market} /> : null}
      {activeSurface === "operator" ? <OperatorSurface packageTitle={pkg.title} outputCount={pkg.deliverables.length} operatorBrandName={portal.brandName} /> : null}
      {activeSurface === "reporting" ? <ReportingSurface success={success} /> : null}
      {activeSurface === "billing" ? <BillingSurface /> : null}

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{packageGuide.title}</CardTitle>
            <CardDescription>{packageGuide.executiveOverview}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <GuideList title="Start here" items={packageGuide.startHere} />
            <GuideList title="Operating workflow" items={packageGuide.operatingWorkflow} />
            <div className="rounded-md border border-border p-4 lg:col-span-2">
              <h2 className="mb-3 font-semibold">Implementation roadmap</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {packageGuide.implementationRoadmap.map((phase) => (
                  <div key={phase.phase} className="rounded-md border border-border bg-muted/25 p-3">
                    <p className="text-sm font-semibold">{phase.phase}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-primary">{phase.timing}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      {phase.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <GuideList title="Measurement plan" items={packageGuide.measurementPlan} />
            <GuideList title="No ambiguity rules" items={packageGuide.ambiguityKillers} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{activeSurface === "workspace" ? "Delivered outputs" : `${surfaceLabel(activeSurface)} outputs`}</CardTitle>
            <CardDescription>Each item includes directions, workflow, handoff instructions, acceptance checks, and failure handling.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleOutputs.map((output) => {
                const guide = buildDeliverableGuide(pkg, output, guideBrief);
                return (
                  <div key={output.id} id={output.id} className="rounded-md border border-border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <h2 className="font-semibold">{output.title}</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{output.createdArtifact}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-primary">{output.launchSurface}</p>
                    <div className="mt-4 grid gap-3">
                      <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
                        {guide.summary}
                      </p>
                      <GuideList title="How to use it" items={guide.implementationSteps} compact />
                      <GuideList title="Workflow" items={guide.operatingWorkflow} compact />
                      <GuideList title="Acceptance checks" items={guide.acceptanceChecklist} compact />
                      <GuideList title="If something is unclear or blocked" items={guide.failureStates} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function GuideList({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className="rounded-md border border-border p-3">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <ul className={`grid gap-1 text-sm leading-relaxed text-muted-foreground ${compact ? "" : "md:grid-cols-1"}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function value(input: string | string[] | undefined): string {
  if (Array.isArray(input)) return input[0] ?? "";
  return input ?? "";
}

function surfaceHref(
  operatorSlug: string,
  packageSlug: string,
  workspaceSlug: string,
  surface: string,
  query: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const key of ["brand", "market", "offer", "success"]) {
    const current = value(query[key]);
    if (current) params.set(key, current);
  }
  const path = surface === "workspace"
    ? `/portal/${operatorSlug}/packages/${packageSlug}/workspace/${workspaceSlug}`
    : `/portal/${operatorSlug}/packages/${packageSlug}/workspace/${workspaceSlug}/${surface}`;
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function capitalize(valueToFormat: string): string {
  return valueToFormat.slice(0, 1).toUpperCase() + valueToFormat.slice(1);
}

function surfaceLabel(surface: string): string {
  switch (surface) {
    case "workspace":
      return "Delivery hub";
    case "operator":
      return "Operations";
    case "capture":
      return "Capture";
    case "reporting":
      return "Reporting";
    case "billing":
      return "Billing";
    default:
      return capitalize(surface);
  }
}

function CaptureSurface({ brand, offer, market }: { brand: string; offer: string; market: string }) {
  return (
    <section className="rounded-lg border border-primary/25 bg-primary/5 p-5">
      <h2 className="text-2xl font-bold">{offer}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Built for {brand}, serving {market}.</p>
      <form className="mt-5 grid gap-3 md:grid-cols-2">
        <FormField label="First name" name="firstName" />
        <FormField label="Last name" name="lastName" />
        <FormField label="Email" name="email" type="email" />
        <FormField label="Phone" name="phone" type="tel" />
        <label className="grid gap-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">What outcome do you want?</span>
          <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2" name="desiredOutcome" />
        </label>
        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground md:col-span-2" type="button">
          Submit request
        </button>
      </form>
    </section>
  );
}

function FormField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input className="min-h-11 rounded-md border border-input bg-background px-3" name={name} type={type} />
    </label>
  );
}

function OperatorSurface({ packageTitle, outputCount, operatorBrandName }: { packageTitle: string; outputCount: number; operatorBrandName: string }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        ["Service", packageTitle],
        ["Outputs delivered", String(outputCount)],
        ["Routing state", "Ready"],
        ["Account access state", "Optional integrations use service handoffs until connected"],
        ["Live outbound actions", "Controlled by approved account access"],
        ["Provider", operatorBrandName],
      ].map(([label, valueText]) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
            <CardDescription>{valueText}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

function ReportingSurface({ success }: { success: string }) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h2 className="mb-4 text-xl font-bold">Reporting view</h2>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        The reporting surface is ready to measure {success}. Live numbers populate from connected client-owned sources;
        until then, the hub shows the exact metrics to track.
      </p>
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Raw demand", "Ready"],
          ["Qualified intent", "Ready"],
          ["Booked or accepted", "Ready"],
          ["Pipeline or value", "Ready"],
        ].map(([label, valueText]) => (
          <div key={label} className="rounded-md border border-border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{valueText}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BillingSurface() {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h2 className="text-xl font-bold">Billing and monetization surface</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Quotes, invoices, subscriptions, buyer claims, commissions, and revenue events are represented here when the
        selected service includes billing outputs. Live money movement requires approved payment account access.
      </p>
    </section>
  );
}
