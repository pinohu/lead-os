import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleDashed, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicProductionStatus } from "@/lib/public-production-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Production Readiness | Lead OS",
  description: "Public readiness page showing which solution fulfillment actions are deployed and which external integrations need approved account access.",
};

function statusVariant(status: "live" | "gated" | "not_configured") {
  if (status === "live") return "default" as const;
  if (status === "gated") return "secondary" as const;
  return "outline" as const;
}

function StatusIcon({ status }: { status: "live" | "gated" | "not_configured" }) {
  if (status === "live") return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  if (status === "gated") return <CircleDashed className="h-4 w-4 text-amber-600" aria-hidden="true" />;
  return <CircleAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

export default function ProductionStatusPage() {
  const status = getPublicProductionStatus();
  const runtimeRows = [
    ["API runtime", status.runtime.api],
    ["Public health", status.runtime.publicHealth],
    ["Operator dashboard", status.runtime.operatorDashboard],
    ["Database", status.runtime.database],
    ["Redis queues", status.runtime.redisQueues],
    ["Stripe billing", status.runtime.stripeBilling],
    ["Live sends", status.runtime.liveSends],
    ["Billing enforcement", status.runtime.billingEnforcement],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary">Production readiness</Badge>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Which solution actions are ready, and which need account access
            </h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Use this page to see the Vercel production runtime clearly. Lead OS can create solution outputs; external
              actions such as durable storage, queues, billing, and live sends activate when the required account access
              is connected.
            </p>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deployment</CardTitle>
              <CardDescription>Public URL and environment context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                URL:{" "}
                <a className="text-primary underline-offset-4 hover:underline" href={status.deployment.appUrl}>
                  {status.deployment.appUrl}
                </a>
              </p>
              <p>Environment: <span className="font-mono">{status.deployment.environment}</span></p>
              <p>Vercel: <span className="font-mono">{String(status.deployment.vercel)}</span></p>
              <p>Checked: <span className="font-mono text-xs">{status.deployment.checkedAt}</span></p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/api/production-readiness">Open readiness JSON</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api/health">Open health JSON</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/control-plane">Open control plane</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Runtime summary">
        {runtimeRows.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={String(value).includes("not_configured") || value === "disabled" ? "outline" : "default"}>
                {value}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Delivered surfaces</h2>
          <p className="text-muted-foreground">
            These are the public or operator-facing pieces deployed in the current production build.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {status.delivered.map((item) => (
            <Card key={item.area}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={item.status} />
                    <CardTitle className="text-base">{item.area}</CardTitle>
                  </div>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
              {item.publicUrl ? (
                <CardContent>
                  <a
                    className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                    href={item.publicUrl}
                  >
                    Open surface <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Can be used publicly now</CardTitle>
            <CardDescription>Assessment based on the production runtime, not local assumptions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>View public site: <strong>{String(status.assessment.canViewPublicSite)}</strong></p>
            <p>Assess public health: <strong>{String(status.assessment.canAssessPublicHealth)}</strong></p>
            <p>Open operator dashboard route: <strong>{String(status.assessment.canUseOperatorDashboard)}</strong></p>
            <p>Production persistence ready: <strong>{String(status.assessment.productionPersistenceReady)}</strong></p>
            <p>Monetization ready: <strong>{String(status.assessment.monetizationReady)}</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account access required for external actions</CardTitle>
            <CardDescription>These items turn on provider-backed storage, queues, billing, live sends, and enforcement.</CardDescription>
          </CardHeader>
          <CardContent>
            {status.activationRequired.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {status.activationRequired.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No activation gaps detected by the public readiness check.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
