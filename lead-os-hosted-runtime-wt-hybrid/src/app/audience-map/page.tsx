import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVisibleAudienceRules } from "@/lib/page-audience";

export const metadata: Metadata = {
  title: "Audience Map | Lead OS",
  description: "A route-by-route map of who each Lead OS page serves, what it is for, and what outcome it should create.",
};

export default function AudienceMapPage() {
  const rules = getVisibleAudienceRules();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="max-w-3xl">
        <Badge variant="secondary" className="mb-4">Messaging audit surface</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Who every page is serving
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every route family has an audience contract: who the page serves, who the primary persona is,
          why the page exists, what outcome it should create, and what it is not for.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{rule.kind}</Badge>
                <span className="text-sm font-mono text-muted-foreground">{rule.routeLabel}</span>
              </div>
              <CardTitle className="text-xl">{rule.primaryPersona}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-foreground">Serves</p>
                <p className="text-muted-foreground">{rule.servedAudience}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Purpose</p>
                <p className="text-muted-foreground">{rule.pagePurpose}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Expected outcome</p>
                <p className="text-muted-foreground">{rule.expectedOutcome}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Not for</p>
                <p className="text-muted-foreground">{rule.notFor}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
