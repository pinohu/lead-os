import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SLA_SOURCE =
  "https://github.com/pinohu/lead-os/blob/main/lead-os/lead-os-hosted-runtime-wt-hybrid/docs/SLA.md";

export const metadata: Metadata = {
  title: "Service Level Agreement",
  description: "Lead OS uptime and service commitments — full text in repository docs/SLA.md.",
};

export default function DocsSlaPage() {
  return (
    <main id="main-content" className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentation</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Service Level Agreement</h1>
        <p className="text-muted-foreground mt-2">
          Commercial uptime and maintenance rules are defined in version-controlled Markdown so legal and engineering
          stay aligned. The summary below is informational only; the binding text is in the linked document.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>From docs/SLA.md — verify dates in source before contracts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li>Production targets include monthly uptime commitments for core APIs and the dashboard.</li>
            <li>Outbound webhooks and background agent execution carry slightly lower targets than core API.</li>
            <li>Scheduled maintenance windows and exclusions are spelled out in the full SLA.</li>
          </ul>
          <Button asChild className="mt-4">
            <a href={SLA_SOURCE} target="_blank" rel="noreferrer">
              Read full SLA on GitHub
            </a>
          </Button>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href="/docs">Back to docs hub</Link>
      </Button>
    </main>
  );
}
