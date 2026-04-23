import Link from "next/link";
import { buildOperatorControlPlaneSnapshot } from "@/lib/operator-control-plane";
import { tenantConfig } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ControlPlaneActions } from "./ControlPlaneActions";

export default async function ControlPlanePage() {
  const snap = await buildOperatorControlPlaneSnapshot(tenantConfig.tenantId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operations</p>
          <h1 className="text-2xl font-bold tracking-tight">Control plane</h1>
          <p className="text-muted-foreground max-w-3xl mt-2">
            Live snapshot of runtime mode, queues, persisted dead letters, pricing recommendations, node scans,
            billing gates, and outcome backlog. Sensitive mutations use confirmed operator actions below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/api/health/deep" target="_blank" rel="noreferrer">
              Open deep health
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/system" target="_blank" rel="noreferrer">
              Open system JSON
            </Link>
          </Button>
        </div>
      </div>

      <ControlPlaneActions
        deadLetters={snap.deadLetter.recent}
        nodes={snap.nodes}
        recommendations={snap.recommendations.recent}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">SYSTEM_ENABLED</span>
              <Badge variant={snap.flags.systemEnabled ? "default" : "destructive"}>
                {String(snap.flags.systemEnabled)}
              </Badge>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">ENABLE_LIVE_PRICING</span>
              <Badge variant={snap.flags.livePricingEnabled ? "default" : "secondary"}>
                {String(snap.flags.livePricingEnabled)}
              </Badge>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">REDIS_URL</span>
              <Badge variant={snap.flags.redisConfigured ? "default" : "outline"}>
                {snap.flags.redisConfigured ? "set" : "unset"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Billing &amp; entitlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Enforcement</span>
              <Badge variant={snap.billing.enforcement ? "default" : "outline"}>
                {snap.billing.enforcement ? "LEAD_OS_BILLING_ENFORCE=true" : "off"}
              </Badge>
            </div>
            <p>
              Plan: <span className="font-mono">{snap.billing.planKey ?? "—"}</span>
            </p>
            <p>
              Subscription:{" "}
              <span className="font-mono">{snap.billing.subscriptionActive ? "active" : "inactive"}</span>
            </p>
            <p>
              Pricing execution:{" "}
              <span className="font-mono">{snap.billing.pricingExecutionAllowed ? "allowed" : "blocked"}</span>
            </p>
            <p>
              Nodes:{" "}
              <span className="font-mono">
                {snap.billing.nodeCount} / {snap.billing.maxNodes}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">API tier: {snap.billing.apiAccessTier ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pricing runtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Workers:{" "}
              <span className="font-mono">{snap.pricingRuntime.workersStarted ? "bullmq" : "off"}</span>
            </p>
            <p>
              Scheduler:{" "}
              <span className="font-mono">{snap.pricingRuntime.schedulerStarted ? "on" : "off"}</span>
            </p>
            <p>
              Memory fallback:{" "}
              <span className="font-mono">{snap.pricingRuntime.memorySchedulerStarted ? "on" : "off"}</span>
            </p>
            <p>
              Ticks processed:{" "}
              <span className="font-mono">{snap.pricingRuntime.ticksProcessed}</span>
            </p>
            {snap.pricingRuntime.lastTickError ? (
              <p className="text-destructive text-xs break-all">
                Last error: {snap.pricingRuntime.lastTickError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queues (BullMQ)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono whitespace-pre-wrap">
            {snap.queues
              ? JSON.stringify(snap.queues, null, 2)
              : "Redis not configured or queue stats unavailable."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dead letters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Persisted rows:{" "}
              <span className="font-mono font-semibold">{snap.deadLetter.persistedCount}</span>
            </p>
            <p className="text-muted-foreground text-xs">
              Latest failures (trimmed). Full payload in Postgres <code>dead_letter_jobs</code>.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nodes ({snap.nodes.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-2">Node</th>
                  <th className="py-2 pr-2">SKU</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Last scan</th>
                  <th className="py-2">Bias</th>
                </tr>
              </thead>
              <tbody>
                {snap.nodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-muted-foreground">
                      No nodes yet (run migrations 005–006 and a pricing tick).
                    </td>
                  </tr>
                ) : (
                  snap.nodes.map((n) => (
                    <tr key={`${n.nodeKey}-${n.skuKey}`} className="border-b border-border/60">
                      <td className="py-2 pr-2 font-mono text-xs">{n.nodeKey}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{n.skuKey}</td>
                      <td className="py-2 pr-2">{n.status}</td>
                      <td className="py-2 pr-2 text-xs">{n.lastScanAt ?? "—"}</td>
                      <td className="py-2 font-mono text-xs">{n.learningBias}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {Object.entries(snap.recommendations.byStatus).length === 0 ? (
                <span className="text-muted-foreground">No rows yet.</span>
              ) : (
                Object.entries(snap.recommendations.byStatus).map(([k, v]) => (
                  <Badge key={k} variant="outline">
                    {k}: {v}
                  </Badge>
                ))
              )}
            </div>
            <div className="max-h-72 overflow-auto space-y-2">
              {snap.recommendations.recent.map((r) => (
                <div
                  key={r.id}
                  className="rounded-md border border-border/70 px-3 py-2 text-xs flex justify-between gap-2"
                >
                  <span className="font-mono">{r.skuKey}</span>
                  <span>{r.status}</span>
                  <span className="font-mono">{r.recommendedPriceCents}c</span>
                  <span className="text-muted-foreground">{r.createdAt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outcomes backlog</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Badge variant="outline">pending: {snap.outcomes.pending}</Badge>
          <Badge variant="outline">measured: {snap.outcomes.measured}</Badge>
          <Badge variant="outline">failed: {snap.outcomes.failed}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent dead-letter jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-auto">
          {snap.deadLetter.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dead-letter rows.</p>
          ) : (
            snap.deadLetter.recent.map((j) => (
              <div key={j.id} className="rounded-md border border-border/70 p-3 text-xs space-y-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono">{j.sourceQueue}</span>
                  <span className="text-muted-foreground">{j.createdAt}</span>
                </div>
                <div className="font-medium">{j.jobName}</div>
                <div className="text-muted-foreground break-all">{j.errorPreview}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Generated {snap.generatedAt} for tenant <span className="font-mono">{snap.tenantId}</span>. Postgres:{" "}
        {snap.integrations.postgres ? "yes" : "no"} · Supabase client: {snap.integrations.supabase ? "yes" : "no"}
      </p>
    </div>
  );
}
