import type { Metadata } from "next";
import Link from "next/link";
import { THREE_VISIT_FRAMEWORK } from "@/lib/automation";
import { GettingStartedChecklist } from "@/components/getting-started-checklist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard — CX React Operator Command Center",
  description: "KPI overview, three-visit milestone framework, and automation health for your CX React instance.",
};
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { getOperatorSession } from "@/lib/operator-auth";
import { getAutomationHealth } from "@/lib/providers";
import { getBookingJobs, getCanonicalEvents, getDocumentJobs, getLeadRecords, getWorkflowRuns } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export default async function DashboardPage() {
  const session = (await getOperatorSession()) ?? { email: "demo@localhost" };
  const [leads, events, bookingJobs, documentJobs, workflowRuns] = await Promise.all([
    getLeadRecords(),
    getCanonicalEvents(),
    getBookingJobs(),
    getDocumentJobs(),
    getWorkflowRuns(),
  ]);
  const snapshot = buildDashboardSnapshot(leads, events);
  const health = getAutomationHealth();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <GettingStartedChecklist />

      {/* Hero section */}
      <section className="grid gap-8 lg:grid-cols-3" aria-labelledby="dashboard-heading">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operator command center</p>
          <h1 id="dashboard-heading" className="text-foreground text-2xl font-bold tracking-tight">{tenantConfig.brandName} milestone dashboard</h1>
          <p className="text-lg text-muted-foreground">
            CX React is optimizing for milestone two and milestone three, not just the first capture
            event. This console shows what is moving, what is leaking, and where the next operator
            intervention belongs.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm">
              <Link href="/dashboard/providers">Provider health</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Runtime settings</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/bookings">Booking jobs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/documents">Document jobs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/workflows">Workflow runs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/experiments">Experiments</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/analytics">Analytics</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/scoring">Scoring</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/attribution">Attribution</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/lead-magnets">Lead magnets</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/radar">Hot lead radar</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/auth/sign-out">Sign out</a>
            </Button>
          </div>
        </div>
        <aside className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operator session</p>
          <h2 className="text-foreground text-lg font-semibold">{session.email}</h2>
          <p className="text-sm text-muted-foreground">
            Live mode: {health.liveMode ? "enabled" : "dry run"} | Total leads: {snapshot.totals.leads} | Hot leads: {snapshot.totals.hotLeads}
          </p>
          <ul className="space-y-3 pt-2">
            {THREE_VISIT_FRAMEWORK.lead.map((milestone) => (
              <li key={milestone.id} className="space-y-0.5">
                <strong className="text-sm font-semibold">M{milestone.ordinal}: {milestone.label}</strong>
                <span className="block text-xs text-muted-foreground">{milestone.description}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Conversion metrics">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead M1 to M2</p>
            <h2 className="text-foreground text-2xl font-bold mt-1">{snapshot.conversionRates.leadM1ToM2}%</h2>
            <p className="text-sm text-muted-foreground mt-1">Returning-engaged rate from captured leads.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead M2 to M3</p>
            <h2 className="text-foreground text-2xl font-bold mt-1">{snapshot.conversionRates.leadM2ToM3}%</h2>
            <p className="text-sm text-muted-foreground mt-1">Booked or offered rate from returning leads.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer M1 to M2</p>
            <h2 className="text-foreground text-2xl font-bold mt-1">{snapshot.conversionRates.customerM1ToM2}%</h2>
            <p className="text-sm text-muted-foreground mt-1">Activation rate from onboarded customers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer M2 to M3</p>
            <h2 className="text-foreground text-2xl font-bold mt-1">{snapshot.conversionRates.customerM2ToM3}%</h2>
            <p className="text-sm text-muted-foreground mt-1">Value-realized rate from activated customers.</p>
          </CardContent>
        </Card>
      </section>

      {/* Execution queues + Operator focus */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Execution queues</p>
            <h2 className="text-foreground text-lg font-semibold">What operators can act on right now</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bookings</p>
                  <h3 className="text-foreground text-xl font-bold">{bookingJobs.length}</h3>
                  <p className="text-sm text-muted-foreground">Scheduling jobs recorded in the runtime.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/dashboard/bookings">Open booking queue</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</p>
                  <h3 className="text-foreground text-xl font-bold">{documentJobs.length}</h3>
                  <p className="text-sm text-muted-foreground">Proposal, agreement, and onboarding document jobs.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/dashboard/documents">Open document queue</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workflow runs</p>
                  <h3 className="text-foreground text-xl font-bold">{workflowRuns.length}</h3>
                  <p className="text-sm text-muted-foreground">n8n and internal workflow emissions logged by CX React.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/dashboard/workflows">Open workflow history</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Experiments</p>
                  <h3 className="text-foreground text-xl font-bold">{snapshot.experimentPerformance.length}</h3>
                  <p className="text-sm text-muted-foreground">Active experiment buckets currently represented in lead traffic.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/dashboard/experiments">Open experiment view</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operator focus</p>
            <h2 className="text-foreground text-lg font-semibold">Fast links for intervention</h2>
            <ul className="space-y-2">
              <li><Link href="/dashboard/providers" className="text-sm text-primary hover:underline">Provider health and channel readiness</Link></li>
              <li><Link href="/dashboard/settings" className="text-sm text-primary hover:underline">Runtime settings for provider mappings and template IDs</Link></li>
              <li><Link href="/dashboard/bookings" className="text-sm text-primary hover:underline">Scheduling requests and availability lookups</Link></li>
              <li><Link href="/dashboard/documents" className="text-sm text-primary hover:underline">Proposal, agreement, and onboarding document jobs</Link></li>
              <li><Link href="/dashboard/workflows" className="text-sm text-primary hover:underline">Workflow emissions and execution outcomes</Link></li>
              <li><Link href="/dashboard/experiments" className="text-sm text-primary hover:underline">Variant and milestone performance by experiment</Link></li>
              <li><Link href="/dashboard/analytics" className="text-sm text-primary hover:underline">Full analytics with funnel, scores, and channel data</Link></li>
              <li><Link href="/dashboard/scoring" className="text-sm text-primary hover:underline">Lead scoring with breakdown and recommendations</Link></li>
              <li><Link href="/dashboard/attribution" className="text-sm text-primary hover:underline">Channel attribution with model comparison</Link></li>
              <li><Link href="/dashboard/lead-magnets" className="text-sm text-primary hover:underline">Lead magnet delivery and performance tracking</Link></li>
              <li><Link href="/dashboard/radar" className="text-sm text-primary hover:underline">Hot lead radar with real-time monitoring</Link></li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Segment view + Funnel mix */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Segment view</p>
            <h2 className="text-foreground text-lg font-semibold">Where momentum is coming from</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <h3 className="text-foreground text-base font-semibold mb-2">Top sources</h3>
                  <ul className="space-y-1">
                    {snapshot.topSources.length === 0 ? (
                      <li className="text-sm text-muted-foreground">No traffic yet</li>
                    ) : (
                      snapshot.topSources.map((entry) => (
                        <li key={entry.label} className="text-sm">
                          {entry.label}: {entry.count}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <h3 className="text-foreground text-base font-semibold mb-2">Top niches</h3>
                  <ul className="space-y-1">
                    {snapshot.topNiches.length === 0 ? (
                      <li className="text-sm text-muted-foreground">No traffic yet</li>
                    ) : (
                      snapshot.topNiches.map((entry) => (
                        <li key={entry.label} className="text-sm">
                          {entry.label}: {entry.count}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Funnel mix</p>
            <h2 className="text-foreground text-lg font-semibold">Families attracting the most movement</h2>
            <ul className="space-y-1">
              {snapshot.topFamilies.length === 0 ? (
                <li className="text-sm text-muted-foreground">No funnel traffic yet</li>
              ) : (
                snapshot.topFamilies.map((entry) => (
                  <li key={entry.family} className="text-sm">
                    {entry.family}: {entry.count}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Recent leads + Recent milestone events */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent leads</p>
            <h2 className="text-foreground text-lg font-semibold">Lead detail drill-down</h2>
            {snapshot.leadTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads have been captured in this runtime yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {snapshot.leadTimeline.map((lead) => (
                  <Card key={lead.leadKey} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{lead.family}</p>
                      <h3 className="text-foreground text-sm font-semibold">{lead.leadKey}</h3>
                      <p className="text-xs text-muted-foreground">Stage: {lead.stage} | Visits: {lead.visitCount}</p>
                      <p className="text-xs text-muted-foreground">Next lead milestone: {lead.nextLeadMilestone ?? "Complete"}</p>
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}>
                          Open lead detail
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent milestone events</p>
            <h2 className="text-foreground text-lg font-semibold">Latest trust and conversion signals</h2>
            {snapshot.recentMilestoneEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Milestone events will appear here as the runtime captures activity.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {snapshot.recentMilestoneEvents.map((event) => (
                  <Card key={event.id} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{event.type}</p>
                      <h3 className="text-foreground text-sm font-semibold">{event.milestoneId}</h3>
                      <p className="text-xs text-muted-foreground">{event.leadKey}</p>
                      <p className="text-xs text-muted-foreground">Visit count: {event.visitCount} | Stage: {event.stage}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
