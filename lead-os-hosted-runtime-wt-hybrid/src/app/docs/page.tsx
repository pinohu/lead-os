import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** GitHub `HEAD` tracks the repository default branch. Paths are from monorepo root. */
const REPO_DOCS_BASE =
  "https://github.com/pinohu/lead-os/blob/HEAD/lead-os-hosted-runtime-wt-hybrid/docs";
const REPO_ROOT_DOCS_BASE = "https://github.com/pinohu/lead-os/blob/HEAD/docs";

export const metadata: Metadata = {
  title: "Documentation hub",
  description: "API reference, SLA, and operator documentation links for Lead OS / CX React.",
};

export default function DocsHubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentation</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Product &amp; operator docs</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          In-app entry points for APIs and commitments. Deep runbooks and deployment guides live in the repository
          under <code className="text-xs">docs/</code> — linked below for each topic.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/30 bg-primary/[0.04] sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">New here — read this first</CardTitle>
            <CardDescription>One page: clone, run the kernel, Postgres + migrations, operator login, production checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={`${REPO_ROOT_DOCS_BASE}/START-HERE.md`} target="_blank" rel="noreferrer">
                START-HERE.md (novice path)
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API reference</CardTitle>
            <CardDescription>OpenAPI 3 description of HTTP routes exposed by this runtime.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/docs/api">Open API docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service level (SLA)</CardTitle>
            <CardDescription>Template Markdown — customize placeholders, monitoring, and legal review before customer contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/docs/sla">View SLA summary</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operator runbook</CardTitle>
            <CardDescription>Control plane, queues, cron auth, GTM execution.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={`${REPO_DOCS_BASE}/OPERATOR_RUNBOOK.md`} target="_blank" rel="noreferrer">
                OPERATOR_RUNBOOK.md
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deployment</CardTitle>
            <CardDescription>Migrations, workers, Vercel/Railway notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={`${REPO_DOCS_BASE}/DEPLOYMENT.md`} target="_blank" rel="noreferrer">
                DEPLOYMENT.md
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Public surface map</CardTitle>
            <CardDescription>Which URLs are marketing vs operator vs API-only.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={`${REPO_DOCS_BASE}/PRODUCT-SURFACES.md`} target="_blank" rel="noreferrer">
                PRODUCT-SURFACES.md
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Support:{" "}
        <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${tenantConfig.supportEmail}`}>
          {tenantConfig.supportEmail}
        </a>
      </p>
    </div>
  );
}
