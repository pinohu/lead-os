import Link from "next/link";
import type { Metadata } from "next";
import { nicheCatalog } from "@/lib/catalog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Industries | Lead OS",
  description:
    "Explore growth systems, lead capture funnels, and automation infrastructure purpose-built for your industry.",
};

export default function IndustriesPage() {
  const niches = Object.values(nicheCatalog);

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Industries we serve</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Growth systems built for your industry
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every industry has different lead sources, sales cycles, and compliance
          requirements. Lead OS ships pre-configured funnels, scoring rules, and
          automation playbooks tuned to the way your market actually buys.
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
                <Link href={`/assess/${niche.slug}`}>Take Assessment</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
