import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProvisionablePackage } from "@/lib/package-catalog";

type Props = {
  params: Promise<{ slug: string; workspaceSlug: string; surface?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, workspaceSlug } = await params;
  const pkg = getProvisionablePackage(slug);
  if (!pkg) return {};
  return {
    title: `${pkg.title} delivery hub | ${workspaceSlug}`,
    description: pkg.launchPromise,
  };
}

export default async function PackageWorkspacePage({ params, searchParams }: Props) {
  const { slug, workspaceSlug, surface } = await params;
  const query = await searchParams;
  const pkg = getProvisionablePackage(slug);
  if (!pkg) notFound();

  const activeSurface = surface?.[0] ?? "workspace";
  const brand = value(query.brand) || workspaceSlug;
  const market = value(query.market) || "the selected customer market";
  const offer = value(query.offer) || pkg.customerOutcome;
  const success = value(query.success) || "the client-defined success metric";
  const visibleOutputs = activeSurface === "workspace"
    ? pkg.deliverables
    : pkg.deliverables.filter((deliverable) => deliverable.launchSurface === activeSurface || (activeSurface === "operator" && deliverable.launchSurface === "automation"));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/packages/${pkg.slug}`}>Back to solution</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/packages">All solutions</Link>
        </Button>
      </div>

      <section className="mb-8">
        <Badge variant="secondary" className="mb-4">Delivered solution hub</Badge>
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
            <p className="text-sm font-semibold text-foreground">Value evidence</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Outputs, URLs, managed handoffs, and acceptance checks are visible inside this hub.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Renewal path</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Connect client-owned accounts, optimize from usage data, or add adjacent packages.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-3 md:grid-cols-5">
        {["workspace", "capture", "operator", "reporting", "billing"].map((item) => (
          <Link
            key={item}
            href={surfaceHref(pkg.slug, workspaceSlug, item, query)}
            className={`rounded-md border p-3 text-sm capitalize underline-offset-4 hover:underline ${
              activeSurface === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
            }`}
          >
            {surfaceLabel(item)}
          </Link>
        ))}
      </section>

      {activeSurface === "capture" ? <CaptureSurface brand={brand} offer={offer} market={market} /> : null}
      {activeSurface === "operator" ? <OperatorSurface packageTitle={pkg.title} outputCount={pkg.deliverables.length} /> : null}
      {activeSurface === "reporting" ? <ReportingSurface success={success} /> : null}
      {activeSurface === "billing" ? <BillingSurface /> : null}

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{activeSurface === "workspace" ? "Delivered outputs" : `${surfaceLabel(activeSurface)} outputs`}</CardTitle>
            <CardDescription>Each item below is part of the completed solution the customer receives.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleOutputs.map((output) => (
                <div key={output.id} id={output.id} className="rounded-md border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">{output.title}</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{output.createdArtifact}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-primary">{output.launchSurface}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function value(input: string | string[] | undefined): string {
  if (Array.isArray(input)) return input[0] ?? "";
  return input ?? "";
}

function surfaceHref(slug: string, workspaceSlug: string, surface: string, query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const key of ["brand", "market", "offer", "success"]) {
    const current = value(query[key]);
    if (current) params.set(key, current);
  }
  const path = surface === "workspace"
    ? `/packages/${slug}/workspace/${workspaceSlug}`
    : `/packages/${slug}/workspace/${workspaceSlug}/${surface}`;
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
          Submit qualified lead
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

function OperatorSurface({ packageTitle, outputCount }: { packageTitle: string; outputCount: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        ["Solution", packageTitle],
        ["Outputs delivered", String(outputCount)],
        ["Routing state", "Ready"],
        ["Account access state", "Optional integrations use managed handoffs until connected"],
        ["Live outbound actions", "Controlled by approved account access"],
        ["Next action", "Add client-owned account access for CRM, billing, live sends, or webhooks"],
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
        until then, the hub shows the exact metrics the operator should track.
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
        selected solution includes billing outputs. Live money movement requires approved payment account access.
      </p>
    </section>
  );
}
