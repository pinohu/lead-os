import Link from "next/link";
import type { Metadata } from "next";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Industry templates | Lead OS",
  description:
  "Choose an industry template to shape the solution intake questions, scoring, routing, and follow-up for a customer's lead system.",
};

export default function IndustriesPage() {
  const niches = Object.values(nicheCatalog);
  const baseUrl = tenantConfig.siteUrl.replace(/\/$/, "");

  const industriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/industries#industries`,
    name: "Industry templates | Lead OS",
  description: "Industry templates for solution intake, capture, scoring, routing, and follow-up.",
    numberOfItems: niches.length,
    itemListElement: niches.map((niche, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: niche.label,
      description: niche.summary,
      url: `${baseUrl}/industries/${niche.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(industriesJsonLd) }} />
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Industry templates</Badge>
        <h1 className="text-foreground text-4xl font-extrabold tracking-tight mb-4">
          Start with the customer's industry, then launch the right package.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Industry templates shape the questions, scoring, routing, and follow-up so the customer receives a lead
          system that matches how they sell.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {niches.map((niche) => (
          <Card key={niche.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{niche.label}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {niche.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex gap-3">
              <Button asChild size="sm">
                <Link href={`/industries/${niche.slug}`}>Explore {niche.label}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/assess/${niche.slug}`}>Check Fit</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}
