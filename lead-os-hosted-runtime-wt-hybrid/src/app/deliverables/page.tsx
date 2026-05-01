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
  description: "Working examples of the customer-ready pieces included inside Lead OS solutions.",
};

export default function DeliverablesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <Badge variant="secondary" className="mb-4">Solution building blocks</Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground">
          See the usable pieces inside every solution.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          These pages show the individual pieces customers receive inside larger solutions. For a real customer
          launch, start from Solutions and submit the intake form for the outcome they bought.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/packages">Launch complete solutions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/production">Check production status</Link>
          </Button>
        </div>
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
