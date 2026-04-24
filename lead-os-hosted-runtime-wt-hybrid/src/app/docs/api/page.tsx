import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "API reference",
  description: "OpenAPI specification and entry points for the Lead OS hosted runtime API.",
};

export default function DocsApiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentation</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">API reference</h1>
        <p className="text-muted-foreground mt-2">
          This deployment exposes a machine-readable OpenAPI document. Import it into Postman, Insomnia, or any
          OpenAPI-aware client. Most routes require authentication, tenant headers, or cron secrets — see each
          operation&apos;s summary in the spec.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenAPI JSON</CardTitle>
          <CardDescription>Canonical path served by the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/api/docs/openapi.json" target="_blank" rel="noreferrer">
              Download /api/docs/openapi.json
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs">Back to docs hub</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Health checks suitable for uptime monitors: <Link className="text-primary underline" href="/api/health">/api/health</Link>
        ,{" "}
        <Link className="text-primary underline" href="/api/health/deep">
          /api/health/deep
        </Link>
        .
      </p>
    </div>
  );
}
