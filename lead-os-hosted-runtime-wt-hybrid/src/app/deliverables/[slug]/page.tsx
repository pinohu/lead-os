import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveDeliverableAction } from "@/components/LiveDeliverableAction";
import {
  getLiveDeliverable,
  getPublicPlanName,
  liveDeliverables,
  type DeliverableSlug,
} from "@/lib/live-deliverables";
import { getPublicProductionStatus } from "@/lib/public-production-status";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return liveDeliverables.map((deliverable) => ({ slug: deliverable.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const deliverable = getLiveDeliverable(slug);
  if (!deliverable) return {};
  return {
    title: `${deliverable.title} | Solution Building Block`,
    description: deliverable.buyerOutcome,
  };
}

export default async function DeliverablePage({ params }: Props) {
  const { slug } = await params;
  const deliverable = getLiveDeliverable(slug);
  if (!deliverable) notFound();

  const production = getPublicProductionStatus();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/deliverables">All deliverables</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboard">Start setup</Link>
        </Button>
      </div>

      <section className="mb-8">
        <Badge variant="secondary" className="mb-4">Solution building block</Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground">{deliverable.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{deliverable.buyerOutcome}</p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Included in: {deliverable.planIds.map(getPublicPlanName).join(", ")}
        </p>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What the customer uses</CardTitle>
            <CardDescription>A usable piece inside a launched package.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{deliverable.deliveredArtifact}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How it is produced</CardTitle>
            <CardDescription>What powers it in the deployed product.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{deliverable.backendReality}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Done when</CardTitle>
            <CardDescription>This is how you know the deliverable is complete.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm md:grid-cols-3">
              {deliverable.acceptanceCriteria.map((criterion) => (
                <li key={criterion} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <DeliverableExample slug={deliverable.slug} production={production} />
    </main>
  );
}

function DeliverableExample({
  slug,
  production,
}: {
  slug: DeliverableSlug;
  production: ReturnType<typeof getPublicProductionStatus>;
}) {
  if (slug === "lead-capture-workspace" || slug === "lead-scoring-routing" || slug === "embed-capture-script" || slug === "support-lane") {
    return (
      <section className="mb-8">
        <LiveDeliverableAction slug={slug} />
      </section>
    );
  }

  if (slug === "email-nurture-workflow") {
    const sequence = [
      ["Now", "We received your request", "Confirm capture and set expectations."],
      ["1 day", "Here is the next best step", "Send the booking or qualification action."],
      ["3 days", "Still comparing options?", "Re-engage a warm lead with proof and clarity."],
      ["5 days", "What would make this easier?", "Ask for the blocker and route to human follow-up."],
      ["7 days", "Last check before we close the loop", "Create a final response opportunity."],
    ];
  return <TableExample headers={["Timing", "Subject", "Purpose"]} rows={sequence} note="Live sends remain disabled until approved provider account access is configured." />;
  }

  if (slug === "operator-dashboard") {
    const rows = [
      ["API", production.runtime.api, "Public runtime is responding."],
      ["Dashboard route", production.runtime.operatorDashboard, "/dashboard/control-plane is deployed."],
      ["Database", production.runtime.database, "Durable data requires DATABASE_URL."],
    ["Billing", production.runtime.stripeBilling, "Stripe account access is required for live checkout."],
    ["Live sends", production.runtime.liveSends, "Provider account access and LEAD_OS_ENABLE_LIVE_SENDS=true required."],
    ];
    return <TableExample headers={["Surface", "State", "Operator meaning"]} rows={rows} note="This mirrors the operator health snapshot customers should see before launch." />;
  }

  if (slug === "ab-testing-surface") {
    return <TableExample headers={["Variant", "Traffic", "Conversions", "Current read"]} rows={[
      ["A: Free roof inspection", "51%", "18 / 220", "8.18% conversion"],
      ["B: Storm damage quote", "49%", "24 / 211", "11.37% conversion"],
      ["Winner candidate", "B", "+39% relative lift", "Keep running until sample threshold is met"],
    ]} note="The deliverable is the comparison surface and decision math, not a vague promise of optimization." />;
  }

  if (slug === "attribution-view") {
    return <TableExample headers={["Source", "Leads", "Qualified", "Pipeline", "ROI read"]} rows={[
      ["google/cpc", "42", "19", "$38,000", "Scale if close rate holds"],
      ["facebook/paid", "31", "9", "$14,500", "Improve qualification"],
      ["referral/partner", "12", "8", "$22,000", "Highest quality source"],
    ]} note="This is the exact kind of source-level receipt a customer can show downstream." />;
  }

  if (slug === "channel-readiness") {
    return <TableExample headers={["Channel", "Configured now", "Required to go live"]} rows={[
    ["Email", "Selected in onboarding", "Verified email provider account access"],
    ["SMS", "Toggle available", "SMS provider account access and consent policy"],
    ["WhatsApp", "Toggle available", "WhatsApp provider account access and approved templates"],
    ["CRM", "Toggle available", "CRM API key saved in account access"],
      ["Documents", "Toggle available", "Document provider or internal generation config"],
  ]} note="Channels are never represented as live until approved account access exists." />;
  }

  if (slug === "marketplace-surface") {
    return <TableExample headers={["Lead", "Score", "Price", "Buyer action"]} rows={[
      ["Roof replacement, Erie PA", "93 / burning", "$75.00", "Claim lead"],
      ["Emergency plumbing, Erie PA", "87 / hot", "$45.00", "Claim lead"],
      ["Commercial HVAC maintenance", "72 / warm", "$32.00", "Claim lead"],
    ]} note="This is the customer-facing inventory artifact. Production inventory requires database-backed leads." />;
  }

  if (slug === "funnel-library") {
    return <TableExample headers={["Stage", "Trigger", "Next action"]} rows={[
      ["Capture", "Form, widget, assessment, or API intake", "Create lead record"],
      ["Score", "Lead saved", "Compute score and temperature"],
      ["Route", "Score and intent available", "Assign funnel family and destination"],
      ["Nurture", "Lead not booked", "Prepare follow-up sequence"],
      ["Outcome", "Buyer/customer action reported", "Update attribution and ROI"],
    ]} note="The funnel definition is concrete enough for a customer to operate or clone." />;
  }

  return <TableExample headers={["Dependency", "Current state", "Launch action"]} rows={production.activationRequired.map((item) => [item.split(" for ")[0], "Required", item])} note="This checklist is generated from the same public production readiness truth." />;
}

function TableExample({
  headers,
  rows,
  note,
}: {
  headers: string[];
  rows: Array<Array<string>>;
  note: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.join("-")}-${index}`} className="border-b border-border/60">
                {row.map((cell) => (
                  <td key={cell} className="px-3 py-3 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{note}</p>
    </section>
  );
}
