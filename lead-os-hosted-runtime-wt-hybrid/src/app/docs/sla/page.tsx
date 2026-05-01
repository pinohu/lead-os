import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SLA_SOURCE =
  "https://github.com/pinohu/lead-os/blob/HEAD/lead-os-hosted-runtime-wt-hybrid/docs/SLA.md";

export const metadata: Metadata = {
  title: "Service Level Agreement",
  description:
    "SLA template and commercial targets — replace placeholders and legal review before customer commitments. Full Markdown in docs/SLA.md.",
};

export default function DocsSlaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentation</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Service Level Agreement</h1>
        <p className="text-muted-foreground mt-2">
          The linked <code className="text-xs">docs/SLA.md</code> file is a <strong>template</strong>: replace{" "}
          <code className="text-xs">YOUR_*</code> URLs and emails, wire real monitoring and backups, and have counsel
          approve text before you attach it to contracts. The bullets below are not a substitute for that process.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>From docs/SLA.md — confirm version date and placeholders before any customer signature.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li>Targets for core API and dashboard uptime apply only when you operate the monitoring described in the SLA and measure live package traffic.</li>
            <li>Webhook and background-job targets are lower than core API — see the table in the source file.</li>
            <li>Maintenance windows, exclusions, credits, and backup/RPO language are all in the Markdown — nothing here is binding until your legal process says so.</li>
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
    </div>
  );
}
