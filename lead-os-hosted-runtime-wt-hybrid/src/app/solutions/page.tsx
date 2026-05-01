import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { microscopicOfferLandings, type MicroscopicOfferCategory } from "@/lib/microscopic-offer-landings";

export const metadata: Metadata = {
  title: "Standalone Offer Websites | Lead OS",
  description:
    "Every standalone offer, module, funnel, vertical wrapper, GTM play, and plan has its own persona-specific landing page and price.",
};

const categoryOrder: MicroscopicOfferCategory[] = [
  "Primary package",
  "Deliverable module",
  "Vertical wrapper",
  "Funnel blueprint",
  "GTM play",
  "Commercial plan",
];

export default function SolutionsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10">
        <Badge variant="secondary" className="mb-4">Canonical landing pages</Badge>
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Every offer has its own standalone landing page and price.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          This is the complete landing-page inventory for every microscopic sellable unit in the codebase:
          package products, live modules, vertical wrappers, funnel blueprints, GTM plays, and commercial plans.
          Each page is written as if that offer has its own website under its own name.
        </p>
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        {categoryOrder.map((category) => {
          const count = microscopicOfferLandings.filter((offer) => offer.category === category).length;
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{count}</CardTitle>
                <CardDescription>{category} landing pages</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      {categoryOrder.map((category) => {
        const offers = microscopicOfferLandings.filter((offer) => offer.category === category);
        return (
          <section key={category} className="mb-12">
            <div className="mb-4">
              <Badge variant="outline">{category}</Badge>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{category} offers</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.slug} className="flex flex-col">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">{offer.eyebrow}</Badge>
                    <CardTitle>{offer.title}</CardTitle>
                    <CardDescription>{offer.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <p className="mb-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">For:</span> {offer.persona}
                    </p>
                    <p className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                      <span className="font-semibold text-foreground">Standalone price:</span>{" "}
                      <span className="text-muted-foreground">{offer.pricing.headline}</span>
                    </p>
                    <Button asChild size="sm">
                      <Link href={`/solutions/${offer.slug}`}>
                        Open landing page <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
