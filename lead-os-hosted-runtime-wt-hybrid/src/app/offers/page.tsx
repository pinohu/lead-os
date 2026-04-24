import type { Metadata } from "next";
import Link from "next/link";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offer paths by vertical",
  description: "High-intent offer flows for each configured industry — CX React / Lead OS.",
};

export default function OffersIndexPage() {
  const niches = Object.values(nicheCatalog).filter((n) => n.slug !== "general");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Offers</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Offer paths by industry</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Each path is a tuned landing experience plus capture. Pair with{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/industries">
            Industries
          </Link>{" "}
          for positioning, or start onboarding for your own tenant at{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/onboard">
            Get started
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {niches.map((niche) => (
          <Card key={niche.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{niche.label}</CardTitle>
              <CardDescription>{niche.summary}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/offers/${niche.slug}`}>Offer path</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/industries/${niche.slug}`}>Industry page</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/assess/${niche.slug}`}>Assessment</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General / multi-vertical</CardTitle>
          <CardDescription>{nicheCatalog.general.summary}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/offers/general">Offer path</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/industries/general">Industry page</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Brand: {tenantConfig.brandName} · Questions:{" "}
        <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${tenantConfig.supportEmail}`}>
          {tenantConfig.supportEmail}
        </a>
      </p>
    </div>
  );
}
