import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Offer paths by industry | Lead OS",
  description: "Choose the business promise and downstream customer-facing path that power a solution's capture, routing, and follow-up.",
};

export default function OffersIndexPage() {
  const niches = Object.values(nicheCatalog).filter((n) => n.slug !== "general");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Offer paths</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Choose the promise a business wants its audience to act on.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each path can become the front door of a launched B2B or B2B2C solution: the capture page, qualification
          questions, routing rules, and follow-up all start with this promise. Use these paths to decide what the client
          business will offer its leads, customers, applicants, partners, or prospects, then
          continue to{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/industries">
            industry templates
          </Link>{" "}
          or create your operator account in{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/onboard">
            setup
          </Link>
          .
          External sending and monetization activate when the required account access is connected on the{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/production">
            production status page
          </Link>
          .
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
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
                <Link href={`/assess/${niche.slug}`}>Check fit</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

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
        Brand: {tenantConfig.brandName} &middot; Questions:{" "}
        <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${tenantConfig.supportEmail}`}>
          {tenantConfig.supportEmail}
        </a>
      </p>
    </main>
  );
}
