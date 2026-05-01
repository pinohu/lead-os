import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { OperatorPortalProvisionForm } from "@/components/OperatorPortalProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniversalPackageCredentialFields } from "@/lib/package-catalog";
import { getOperatorPortal, getPortalPackagePath, getPortalPackages } from "@/lib/operator-portals";

type Props = {
  params: Promise<{ operatorSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { operatorSlug } = await params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) return {};
  return {
    title: {
      absolute: `${portal.brandName} private service portal`,
    },
    description: portal.promise,
    openGraph: {
      title: `${portal.brandName} private service portal`,
      description: portal.promise,
      siteName: portal.brandName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${portal.brandName} private service portal`,
      description: portal.promise,
    },
  };
}

export default async function OperatorPortalPage({ params }: Props) {
  const { operatorSlug } = await params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) notFound();

  const packages = getPortalPackages(portal);
  const fields = getUniversalPackageCredentialFields();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4">Private service portal</Badge>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-foreground">{portal.brandName}</h1>
          <p className="mt-4 max-w-3xl text-xl leading-relaxed text-muted-foreground">{portal.tagline}</p>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">{portal.promise}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#launch" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground">
              Launch client service <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a href="#services" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-semibold text-foreground">
              View services
            </a>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>What clients experience</CardTitle>
            <CardDescription>{portal.primaryAudience}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {portal.proofPoints.map((point) => (
              <div key={point} className="flex gap-3 rounded-md border border-border p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="services" className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Subscribed services</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Sell one, several, or the full catalog</h2>
          </div>
          <div className="hidden rounded-md border border-border px-3 py-2 text-sm text-muted-foreground sm:block">
            {packages.length} services active
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <Link key={pkg.slug} href={getPortalPackagePath(portal, pkg.slug)} className="group rounded-lg border border-border bg-card p-5 transition hover:border-primary/50">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Layers3 className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Standalone service</span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary">{pkg.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.customerOutcome}</p>
              <p className="mt-4 text-sm font-semibold text-primary">Open service page</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="launch" className="mt-12">
        <OperatorPortalProvisionForm
          operatorSlug={portal.slug}
          operatorBrandName={portal.brandName}
          packages={packages.map((pkg) => ({
            slug: pkg.slug,
            title: pkg.title,
            customerOutcome: pkg.customerOutcome,
          }))}
          fields={fields}
          defaultSelectedSlugs={portal.defaultSelectedSlugs}
        />
      </section>
    </main>
  );
}
