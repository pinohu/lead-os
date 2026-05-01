import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlanDeliverables, getPublicPlanName, liveDeliverables } from "@/lib/live-deliverables";
import { publicPlans } from "@/lib/public-offer";

export const metadata: Metadata = {
  title: "Solution Building Blocks | Lead OS",
  description: "Working examples of the business-ready and downstream customer-facing pieces included inside Lead OS solutions.",
};

export default function DeliverablesPage() {
  const b2bCount = liveDeliverables.filter((deliverable) => deliverable.audienceModel === "B2B").length;
  const b2b2cCount = liveDeliverables.filter((deliverable) => deliverable.audienceModel === "B2B2C").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <Badge variant="secondary" className="mb-4">Solution building blocks</Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground">
          See the usable pieces inside every solution.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          These pages show the individual pieces client businesses receive inside larger solutions. For a real client
          launch, start from Solutions and submit the intake form for the outcome the business bought.
        </p>
        <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <strong className="block text-foreground">Primary audience: B2B</strong>
            Business owners, agencies, consultants, lead sellers, SaaS teams, franchises, and internal operators pay for the solution.
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <strong className="block text-foreground">Customer-facing: B2B2C</strong>
            Capture, nurture, routing, marketplace, and offer-testing pieces touch the client's downstream customers or leads.
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <strong className="block text-foreground">Not standalone B2C</strong>
            These are not consumer apps. B2C only appears downstream when a client's consumers interact with the launched system.
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/packages">Launch complete solutions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/production">Check production status</Link>
          </Button>
        </div>
      </section>

      <section className="mb-12 rounded-lg border border-border bg-muted/30 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">Audience model</Badge>
          <Badge variant="secondary">{b2bCount} B2B blocks</Badge>
          <Badge variant="secondary">{b2b2cCount} B2B2C blocks</Badge>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The deliverable catalog is a B2B fulfillment system with B2B2C surfaces where the client's customers,
          patients, shoppers, students, or prospects directly experience the outcome. The buyer is still the business.
        </p>
      </section>

      <section className="mb-12 grid gap-4 md:grid-cols-3">
        {publicPlans.map((plan) => {
          const count = getPlanDeliverables(plan.id).length;
          return (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price} - {count} deliverables</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {getPlanDeliverables(plan.id).map((deliverable) => (
                    <li key={deliverable.slug} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <Link className="underline-offset-4 hover:underline" href={deliverable.livePath}>
                        {deliverable.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {liveDeliverables.map((deliverable) => (
          <Card key={deliverable.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{deliverable.title}</CardTitle>
              <CardDescription>{deliverable.buyerOutcome}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant={deliverable.audienceModel === "B2B2C" ? "default" : "outline"}>
                  {deliverable.audienceModel}
                </Badge>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{deliverable.audienceSummary}</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Included in: {deliverable.planIds.map(getPublicPlanName).join(", ")}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={deliverable.livePath}>
                  View building block <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
