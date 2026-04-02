import Link from "next/link";
import { notFound } from "next/navigation";
import { summarizeMilestoneProgress } from "@/lib/automation";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import {
  type BookingJobRecord,
  type DocumentJobRecord,
  getBookingJobs,
  getCanonicalEvents,
  getDocumentJobs,
  getLeadRecord,
  getProviderExecutions,
  type ProviderExecutionRecord,
  type WorkflowRunRecord,
  getWorkflowRuns,
} from "@/lib/runtime-store";
import type { CanonicalEvent } from "@/lib/trace";
import {
  classifyLeadTemperature,
  computeEngagementScore,
  computeFitScore,
  computeIntentScore,
  computeUrgencyScore,
  type ScoringContext,
} from "@/lib/scoring-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadDetailPageProps = {
  params: Promise<{ leadKey: string }>;
};

// ---------------------------------------------------------------------------
// Color constants (used dynamically in JSX)
// ---------------------------------------------------------------------------

const TEMP_COLORS: Record<string, string> = {
  cold: "#3b82f6",
  warm: "#f59e0b",
  hot: "#f97316",
  burning: "#ef4444",
};

const EVENT_DOT_COLORS: Record<string, string> = {
  intake: "#22c55e",
  email: "#3b82f6",
  sms: "#a855f7",
  booking: "#14b8a6",
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 35) return "#f59e0b";
  return "#3b82f6";
}

function eventDotColor(eventType: string): string {
  const key = eventType.toLowerCase();
  for (const [prefix, color] of Object.entries(EVENT_DOT_COLORS)) {
    if (key.includes(prefix)) return color;
  }
  return "#3b82f6";
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score !== null ? Math.min(100, Math.max(0, score)) : 0;
  const color = score !== null ? scoreBarColor(score) : "rgba(255,255,255,0.35)";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/55">{label}</span>
        <span className="text-[13px] font-semibold" style={{ color: score !== null ? color : "rgba(255,255,255,0.35)" }}>
          {score !== null ? score : "\u2014"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-white/[0.08]">
        <div
          className="h-full rounded-sm transition-[width] duration-300 ease-out"
          style={{ width: score !== null ? `${pct}%` : "0%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag chip
// ---------------------------------------------------------------------------

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ color, backgroundColor: `${color}1f`, borderColor: `${color}40` }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card / Section helpers
// ---------------------------------------------------------------------------

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-muted px-7 py-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/35">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-base font-bold text-foreground">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Activity card
// ---------------------------------------------------------------------------

function ActivityCard({
  eyebrow,
  title,
  detail,
  date,
  ok,
  mode,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  date: string;
  ok?: boolean;
  mode?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
          {eyebrow}
        </span>
        <div className="flex items-center gap-1.5">
          {ok !== undefined && (
            <span
              className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ backgroundColor: ok ? "#22c55e" : "#ef4444" }}
            />
          )}
          {mode && (
            <span className="rounded bg-muted px-1.5 py-px text-[11px] text-white/35">
              {mode}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      {detail && <span className="text-xs leading-relaxed text-white/55">{detail}</span>}
      <span className="text-[11px] text-white/35">{formatShortDate(date)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  await requireOperatorPageSession("/dashboard");
  const { leadKey } = await params;
  const decodedLeadKey = decodeURIComponent(leadKey);
  const lead = await getLeadRecord(decodedLeadKey);

  if (!lead) {
    notFound();
  }

  const [events, workflows, providerExecutions, bookingJobs, documentJobs] = await Promise.all([
    getCanonicalEvents(),
    getWorkflowRuns(decodedLeadKey),
    getProviderExecutions(decodedLeadKey),
    getBookingJobs(decodedLeadKey),
    getDocumentJobs(decodedLeadKey),
  ]);

  const filteredEvents = (events as CanonicalEvent[])
    .filter((e) => e.leadKey === decodedLeadKey)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const workflowItems = workflows as WorkflowRunRecord[];
  const providerItems = providerExecutions as ProviderExecutionRecord[];
  const bookingItems = bookingJobs as BookingJobRecord[];
  const documentItems = documentJobs as DocumentJobRecord[];
  const progress = summarizeMilestoneProgress(lead);

  const scoringCtx: ScoringContext = {
    source: lead.source,
    niche: lead.niche,
    service: lead.service,
    hasEmail: !!lead.email,
    hasPhone: !!lead.phone,
    hasCompany: !!lead.company,
    lastActivityAt: lead.updatedAt,
  };

  const intentScore = computeIntentScore(scoringCtx);
  const fitScore = computeFitScore(scoringCtx);
  const engagementScore = computeEngagementScore(scoringCtx);
  const urgencyScore = computeUrgencyScore(scoringCtx);
  const compositeFromLead = lead.score;
  const temperature = classifyLeadTemperature(compositeFromLead);
  const tempColor = TEMP_COLORS[temperature];

  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || decodedLeadKey;

  return (
    <main className="min-h-screen bg-background px-6 py-8 pb-16 font-sans">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">

        {/* Back nav */}
        <div>
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/35 no-underline"
          >
            &larr; All leads
          </Link>
        </div>

        {/* 1. Lead Identity Header */}
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 text-[26px] font-extrabold text-foreground">
                  {fullName}
                </h1>
                <Tag label={temperature} color={tempColor} />
                <Tag label={lead.source} color="#3b82f6" />
                <Tag label={lead.niche} color="#a855f7" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {lead.email && (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-white/55">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/35">Email</span>
                      <a href={`mailto:${lead.email}`} className="text-white/55 no-underline">
                        {lead.email}
                      </a>
                    </span>
                    <span className="text-sm text-white/35">&middot;</span>
                  </>
                )}
                {lead.phone && (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-white/55">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/35">Phone</span>
                      <a href={`tel:${lead.phone}`} className="text-white/55 no-underline">
                        {lead.phone}
                      </a>
                    </span>
                    <span className="text-sm text-white/35">&middot;</span>
                  </>
                )}
                {lead.company && (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-white/55">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/35">Company</span>
                      <span>{lead.company}</span>
                    </span>
                    <span className="text-sm text-white/35">&middot;</span>
                  </>
                )}
                <span className="flex items-center gap-1.5 text-sm text-white/55">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/35">Service</span>
                  <span>{lead.service}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/35">Created {formatShortDate(lead.createdAt)}</span>
                <span className="text-sm text-white/35">&middot;</span>
                <span className="text-xs text-white/35">Updated {formatShortDate(lead.updatedAt)}</span>
                <span className="text-sm text-white/35">&middot;</span>
                <span className="text-xs text-white/35">
                  Status: <span className={lead.status === "active" ? "text-green-400" : "text-white/55"}>{lead.status}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2.5">
              <div className="text-right">
                <div className="mb-1 text-[11px] uppercase tracking-widest text-white/35">
                  Composite score
                </div>
                <div className="text-5xl font-black leading-none" style={{ color: tempColor }}>
                  {compositeFromLead}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-border bg-muted px-4 py-2 text-[13px] font-semibold text-white/55 no-underline"
                >
                  Dashboard
                </Link>
                <a
                  href={lead.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border-none bg-blue-500 px-4 py-2 text-[13px] font-semibold text-white no-underline"
                >
                  {lead.ctaLabel || "Open destination"}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* 2 + 3. Score Breakdown + Nurture Status */}
        <div className="grid grid-cols-2 gap-6">

          {/* Score Breakdown */}
          <Card>
            <SectionLabel>Intelligence</SectionLabel>
            <SectionTitle>Score breakdown</SectionTitle>
            <div className="flex flex-col gap-4">
              <ScoreBar label="Composite" score={compositeFromLead} />
              <hr className="my-5 border-t border-border" />
              <ScoreBar label="Intent" score={intentScore.score} />
              <ScoreBar label="Fit" score={fitScore.score} />
              <ScoreBar label="Engagement" score={engagementScore.score} />
              <ScoreBar label="Urgency" score={urgencyScore.score} />
            </div>
            <div
              className="mt-5 rounded-lg border p-3.5"
              style={{ backgroundColor: `${tempColor}14`, borderColor: `${tempColor}33` }}
            >
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: tempColor }}>
                Temperature
              </div>
              <div className="text-sm font-semibold capitalize text-foreground">
                {temperature}
                <span className="ml-2 font-normal text-white/55">
                  {temperature === "burning" && "Ready to close \u2014 reach out immediately"}
                  {temperature === "hot" && "High interest \u2014 prioritize outreach"}
                  {temperature === "warm" && "Engaged \u2014 nurture and qualify"}
                  {temperature === "cold" && "Early stage \u2014 awareness campaign"}
                </span>
              </div>
            </div>
          </Card>

          {/* Nurture Status */}
          <Card>
            <SectionLabel>Funnel</SectionLabel>
            <SectionTitle>Nurture status</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Family", value: lead.family, bold: true },
                  { label: "Stage", value: lead.stage, bold: true },
                  { label: "Next lead milestone", value: progress.nextLeadMilestone?.label ?? "Complete", bold: false },
                  { label: "Next customer milestone", value: progress.nextCustomerMilestone?.label ?? "Not started", bold: false },
                  { label: "Visits", value: String(progress.visitCount), bold: true },
                  { label: "Nurture stages sent", value: String(lead.sentNurtureStages.length), bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label}>
                    <div className="mb-1 text-[11px] uppercase tracking-wider text-white/35">{label}</div>
                    <div className={`text-sm ${bold ? "font-bold text-foreground" : "text-white/55"}`}>{value}</div>
                  </div>
                ))}
              </div>

              <hr className="my-5 border-t border-border" />

              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-white/35">CTA</div>
                <a
                  href={lead.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-500 no-underline"
                >
                  {lead.ctaLabel || "View destination"} &rarr;
                </a>
              </div>

              {lead.sentNurtureStages.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Stages delivered</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.sentNurtureStages.map((stage) => (
                      <span key={stage} className="rounded border border-blue-500/25 bg-blue-500/[0.12] px-2 py-0.5 text-[11px] text-blue-500">
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(lead.milestones.leadMilestones.length > 0 || lead.milestones.customerMilestones.length > 0) && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Milestones achieved</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.milestones.leadMilestones.map((m) => (
                      <span key={m} className="rounded border border-green-500/25 bg-green-500/[0.12] px-2 py-0.5 text-[11px] text-green-500">
                        {m}
                      </span>
                    ))}
                    {lead.milestones.customerMilestones.map((m) => (
                      <span key={m} className="rounded border border-teal-500/25 bg-teal-500/[0.12] px-2 py-0.5 text-[11px] text-teal-500">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 4. Journey Timeline */}
        <Card>
          <SectionLabel>History</SectionLabel>
          <SectionTitle>Journey timeline</SectionTitle>
          {filteredEvents.length === 0 ? (
            <p className="m-0 text-sm text-white/35">No events recorded for this lead yet.</p>
          ) : (
            <div className="relative pl-8">
              <div
                className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-sm bg-white/[0.07]"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                {filteredEvents.map((event, index) => {
                  const dotColor = eventDotColor(event.eventType);
                  const isLast = index === filteredEvents.length - 1;
                  return (
                    <div
                      key={event.id}
                      className="relative flex gap-5"
                      style={{ paddingBottom: isLast ? 0 : 20 }}
                    >
                      <div
                        className="absolute -left-8 top-1 h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: dotColor,
                          border: "2px solid #0a0f1a",
                          boxShadow: `0 0 0 2px ${dotColor}40`,
                        }}
                        aria-hidden="true"
                      />
                      <div className="w-[130px] shrink-0 pt-px">
                        <span className="whitespace-nowrap text-xs text-white/35">
                          {formatEventDate(event.timestamp)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {event.eventType}
                          </span>
                          <span
                            className="rounded border px-[7px] py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${dotColor}1a`,
                              borderColor: `${dotColor}33`,
                              color: dotColor,
                            }}
                          >
                            {event.channel}
                          </span>
                          <span className="rounded bg-white/[0.05] px-[7px] py-0.5 text-[11px] text-white/35">
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* 5. Activity Grid */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <SectionLabel>Automation</SectionLabel>
            <SectionTitle>Workflow runs</SectionTitle>
            {workflowItems.length === 0 ? (
              <p className="m-0 text-sm text-white/35">No workflow runs recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {workflowItems.map((workflow) => (
                  <ActivityCard key={workflow.id} eyebrow={workflow.provider} title={workflow.eventName} detail={workflow.detail} date={workflow.createdAt} ok={workflow.ok} mode={workflow.mode} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Channels</SectionLabel>
            <SectionTitle>Provider executions</SectionTitle>
            {providerItems.length === 0 ? (
              <p className="m-0 text-sm text-white/35">No provider executions recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {providerItems.map((execution) => (
                  <ActivityCard key={execution.id} eyebrow={execution.provider} title={execution.kind} detail={execution.detail} date={execution.createdAt} ok={execution.ok} mode={execution.mode} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 6. Jobs Grid */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <SectionLabel>Scheduling</SectionLabel>
            <SectionTitle>Booking jobs</SectionTitle>
            {bookingItems.length === 0 ? (
              <p className="m-0 text-sm text-white/35">No booking jobs recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {bookingItems.map((job) => (
                  <ActivityCard key={job.id} eyebrow={job.provider} title={job.status} detail={job.detail} date={job.updatedAt} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Documents</SectionLabel>
            <SectionTitle>Document jobs</SectionTitle>
            {documentItems.length === 0 ? (
              <p className="m-0 text-sm text-white/35">No document jobs recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {documentItems.map((job) => (
                  <ActivityCard key={job.id} eyebrow={job.provider} title={job.status} detail={job.detail} date={job.updatedAt} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Runtime trace */}
        <Card>
          <SectionLabel>Debug</SectionLabel>
          <SectionTitle>Runtime trace</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Visitor ID", value: lead.trace.visitorId },
              { label: "Session ID", value: lead.trace.sessionId },
              { label: "Blueprint ID", value: lead.trace.blueprintId },
              { label: "Step ID", value: lead.trace.stepId },
              { label: "Tenant", value: lead.trace.tenant },
              { label: "Experiment", value: lead.trace.experimentId ?? "\u2014" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/35">
                  {label}
                </div>
                <div className="break-all font-mono text-xs text-white/55">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </main>
  );
}
