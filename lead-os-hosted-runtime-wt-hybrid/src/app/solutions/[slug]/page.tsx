import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMicroscopicOfferLanding, microscopicOfferLandings } from "@/lib/microscopic-offer-landings";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return microscopicOfferLandings.map((offer) => ({ slug: offer.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = getMicroscopicOfferLanding(slug);
  if (!offer) return {};
  return {
    title: `${offer.title} | Standalone Offer`,
    description: offer.message,
  };
}

export default async function SolutionLandingPage({ params }: Props) {
  const { slug } = await params;
  const offer = getMicroscopicOfferLanding(slug);
  if (!offer) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/solutions">All solution landing pages</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={offer.sourcePath}>Launch surface</Link>
        </Button>
      </div>

      <section className="mb-8">
        <Badge variant="secondary" className="mb-4">{offer.category}</Badge>
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{offer.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{offer.message}</p>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
          This page treats {offer.title} as its own named offer with its own audience, promise, outcome,
          delivery shape, and price. A client who lands here should understand this offer without needing the rest
          of the catalog.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={offer.primaryCtaHref}>
              Start with this offer <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={offer.secondaryCtaHref}>Compare related offers</Link>
          </Button>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Who this is for</CardTitle>
            <CardDescription>{offer.persona}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Decision maker</CardTitle>
            <CardDescription>{offer.decisionMaker}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resident or end user</CardTitle>
            <CardDescription>{offer.endUser}</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-8">
        <Card className="border-primary/25">
          <CardHeader>
            <Badge variant="outline" className="mb-2 w-fit">Standalone pricing</Badge>
            <CardTitle className="text-3xl">{offer.pricing.headline}</CardTitle>
            <CardDescription>{offer.pricing.bestFor}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Setup</h2>
              <p className="mt-1 text-sm text-muted-foreground">{offer.pricing.setup}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Recurring</h2>
              <p className="mt-1 text-sm text-muted-foreground">{offer.pricing.recurring}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Performance upside</h2>
              <p className="mt-1 text-sm text-muted-foreground">{offer.pricing.performance}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h2 className="font-semibold">Pricing rationale</h2>
              <p className="mt-1 text-sm text-muted-foreground">{offer.pricing.rationale}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Specific pain points</CardTitle>
            <CardDescription>The page speaks to these pains directly.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {offer.painPoints.map((pain) => (
                <li key={pain} className="flex gap-2 rounded-md border border-border p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expected outcome</CardTitle>
            <CardDescription>{offer.expectedOutcome}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="mb-3 font-semibold">Delivered shape and form</h2>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              {offer.deliveryShape.map((item) => (
                <div key={item} className="rounded-md border border-border bg-muted/35 p-3">{item}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Why this landing page is not ambiguous</CardTitle>
            <CardDescription>
              Each microscopic offer page states the buyer, the end user, the pain, the message, the result, and the exact artifact shape.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              {offer.proof.map((proof) => (
                <div key={proof} className="rounded-md border border-border p-3">{proof}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
