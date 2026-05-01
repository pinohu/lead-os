import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { docsCatalog } from "@/lib/docs-catalog";

export const metadata: Metadata = {
  title: "Documentation hub",
  description: "API reference, SLA, solution launch, and operations documentation links for Lead OS.",
};

export default function DocsHubPage() {
  const featuredDocs = docsCatalog.filter((doc) => doc.featured);
  const groupedDocs = docsCatalog.reduce<Record<string, typeof docsCatalog>>((groups, doc) => {
    groups[doc.category] = [...(groups[doc.category] ?? []), doc];
    return groups;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentation</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Product &amp; operator docs</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          In-app entry points for APIs, solution launch, operations commitments, runbooks, deployment guides, and trust
          documents. Visitors should not have to leave the website to read the core repo documentation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/30 bg-primary/[0.04] sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">New here - read this first</CardTitle>
            <CardDescription>One page: clone, run the kernel, Postgres + migrations, operator login, solution launch, production checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/docs/start-here">Open start-here guide</Link>
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
            <CardTitle className="text-lg">Production readiness</CardTitle>
            <CardDescription>Public page for solution actions that are ready and external integrations that need account access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/production">Open production status</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service level (SLA)</CardTitle>
            <CardDescription>Template Markdown - customize placeholders, monitoring, and legal review before customer contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/docs/sla">View SLA summary</Link>
            </Button>
          </CardContent>
        </Card>

        {featuredDocs
          .filter((doc) => doc.slug !== "start-here")
          .map((doc) => (
            <Card key={doc.slug}>
              <CardHeader>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/docs/${doc.slug}`}>Open on website</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      <section className="space-y-4" aria-labelledby="all-docs-heading">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">All exposed repo docs</p>
          <h2 id="all-docs-heading" className="text-2xl font-bold tracking-tight">
            Website pages for the repo knowledge base
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{docs.length} website-readable docs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 pl-0 text-sm">
                  {docs.map((doc) => (
                    <li key={doc.slug}>
                      <Link className="text-primary underline-offset-4 hover:underline" href={`/docs/${doc.slug}`}>
                        {doc.title}
                      </Link>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{doc.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Support:{" "}
        <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${tenantConfig.supportEmail}`}>
          {tenantConfig.supportEmail}
        </a>
      </p>
    </div>
  );
}
