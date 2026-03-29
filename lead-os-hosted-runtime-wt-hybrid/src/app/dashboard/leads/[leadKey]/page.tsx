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
// Style constants
// ---------------------------------------------------------------------------

const PAGE_BG = "#0a0f1a";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "rgba(255,255,255,0.92)";
const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
const TEXT_MUTED = "rgba(255,255,255,0.35)";
const ACCENT = "#3b82f6";

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
// Pure helpers (no JSX — safe in server components)
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
  return ACCENT;
}

function statusDot(ok: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: ok ? "#22c55e" : "#ef4444",
    marginRight: 6,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Score bar sub-component (plain function — no hooks, valid in server component)
// ---------------------------------------------------------------------------

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score !== null ? Math.min(100, Math.max(0, score)) : 0;
  const color = score !== null ? scoreBarColor(score) : TEXT_MUTED;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const trackStyle: React.CSSProperties = {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  };

  const fillStyle: React.CSSProperties = {
    height: "100%",
    width: score !== null ? `${pct}%` : "0%",
    borderRadius: 3,
    backgroundColor: color,
    transition: "width 0.3s ease",
  };

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: score !== null ? color : TEXT_MUTED }}>
          {score !== null ? score : "—"}
        </span>
      </div>
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag chip
// ---------------------------------------------------------------------------

function Tag({ label, color }: { label: string; color: string }) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    color,
    backgroundColor: `${color}1f`,
    border: `1px solid ${color}40`,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
  };
  return <span style={style}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    backgroundColor: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 12,
    padding: "24px 28px",
    ...style,
  };
  return <div style={base}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const style: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    marginBottom: 12,
  };
  return <p style={style}>{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const style: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: TEXT_PRIMARY,
    margin: "0 0 20px",
  };
  return <h2 style={style}>{children}</h2>;
}

// ---------------------------------------------------------------------------
// Activity record card
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
  const style: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };

  return (
    <div style={style}>
      <div style={headerRow}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {eyebrow}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {ok !== undefined && <span style={statusDot(ok)} />}
          {mode && (
            <span style={{ fontSize: 11, color: TEXT_MUTED, backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 7px", borderRadius: 4 }}>
              {mode}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{title}</span>
      {detail && <span style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{detail}</span>}
      <span style={{ fontSize: 11, color: TEXT_MUTED }}>{formatShortDate(date)}</span>
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

  // Build scoring context from available lead data
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

  // ---------------------------------------------------------------------------
  // Layout styles
  // ---------------------------------------------------------------------------

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: PAGE_BG,
    padding: "32px 24px 64px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const maxWidthStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  };

  const twoColStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  };

  const dividerStyle: React.CSSProperties = {
    border: "none",
    borderTop: `1px solid ${CARD_BORDER}`,
    margin: "20px 0",
  };

  const metaRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    alignItems: "center",
  };

  const metaItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: TEXT_SECONDARY,
  };

  const metaLabelStyle: React.CSSProperties = {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  };

  const separatorDotStyle: React.CSSProperties = {
    color: TEXT_MUTED,
    fontSize: 14,
  };

  return (
    <main style={pageStyle}>
      <div style={maxWidthStyle}>

        {/* Back nav */}
        <div>
          <Link
            href="/dashboard/leads"
            style={{ fontSize: 13, color: TEXT_MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            ← All leads
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 1. Lead Identity Header                                             */}
        {/* ------------------------------------------------------------------ */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                  {fullName}
                </h1>
                <Tag label={temperature} color={tempColor} />
                <Tag label={lead.source} color={ACCENT} />
                <Tag label={lead.niche} color="#a855f7" />
              </div>

              <div style={metaRowStyle}>
                {lead.email && (
                  <>
                    <span style={metaItemStyle}>
                      <span style={metaLabelStyle}>Email</span>
                      <a href={`mailto:${lead.email}`} style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
                        {lead.email}
                      </a>
                    </span>
                    <span style={separatorDotStyle}>·</span>
                  </>
                )}
                {lead.phone && (
                  <>
                    <span style={metaItemStyle}>
                      <span style={metaLabelStyle}>Phone</span>
                      <a href={`tel:${lead.phone}`} style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
                        {lead.phone}
                      </a>
                    </span>
                    <span style={separatorDotStyle}>·</span>
                  </>
                )}
                {lead.company && (
                  <>
                    <span style={metaItemStyle}>
                      <span style={metaLabelStyle}>Company</span>
                      <span>{lead.company}</span>
                    </span>
                    <span style={separatorDotStyle}>·</span>
                  </>
                )}
                <span style={metaItemStyle}>
                  <span style={metaLabelStyle}>Service</span>
                  <span>{lead.service}</span>
                </span>
              </div>

              <div style={metaRowStyle}>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                  Created {formatShortDate(lead.createdAt)}
                </span>
                <span style={separatorDotStyle}>·</span>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                  Updated {formatShortDate(lead.updatedAt)}
                </span>
                <span style={separatorDotStyle}>·</span>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                  Status: <span style={{ color: lead.status === "active" ? "#22c55e" : TEXT_SECONDARY }}>{lead.status}</span>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  Composite score
                </div>
                <div style={{ fontSize: 48, fontWeight: 900, color: tempColor, lineHeight: 1 }}>
                  {compositeFromLead}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href="/dashboard"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: TEXT_SECONDARY,
                    border: `1px solid ${CARD_BORDER}`,
                    textDecoration: "none",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  Dashboard
                </Link>
                <a
                  href={lead.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: ACCENT,
                    textDecoration: "none",
                    border: "none",
                  }}
                >
                  {lead.ctaLabel || "Open destination"}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* 2 + 3. Score Breakdown + Nurture Status (side by side)              */}
        {/* ------------------------------------------------------------------ */}
        <div style={twoColStyle}>

          {/* Score Breakdown Panel */}
          <Card>
            <SectionLabel>Intelligence</SectionLabel>
            <SectionTitle>Score breakdown</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ScoreBar label="Composite" score={compositeFromLead} />
              <hr style={dividerStyle} />
              <ScoreBar label="Intent" score={intentScore.score} />
              <ScoreBar label="Fit" score={fitScore.score} />
              <ScoreBar label="Engagement" score={engagementScore.score} />
              <ScoreBar label="Urgency" score={urgencyScore.score} />
            </div>
            <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 8, backgroundColor: `${tempColor}14`, border: `1px solid ${tempColor}33` }}>
              <div style={{ fontSize: 11, color: tempColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Temperature
              </div>
              <div style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: 600, textTransform: "capitalize" }}>
                {temperature}
                <span style={{ fontWeight: 400, color: TEXT_SECONDARY, marginLeft: 8 }}>
                  {temperature === "burning" && "Ready to close — reach out immediately"}
                  {temperature === "hot" && "High interest — prioritize outreach"}
                  {temperature === "warm" && "Engaged — nurture and qualify"}
                  {temperature === "cold" && "Early stage — awareness campaign"}
                </span>
              </div>
            </div>
          </Card>

          {/* Nurture Status Panel */}
          <Card>
            <SectionLabel>Funnel</SectionLabel>
            <SectionTitle>Nurture status</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Family</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{lead.family}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Stage</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{lead.stage}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Next lead milestone</div>
                  <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>{progress.nextLeadMilestone?.label ?? "Complete"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Next customer milestone</div>
                  <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>{progress.nextCustomerMilestone?.label ?? "Not started"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Visits</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{progress.visitCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Nurture stages sent</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{lead.sentNurtureStages.length}</div>
                </div>
              </div>

              <hr style={dividerStyle} />

              <div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  CTA
                </div>
                <a
                  href={lead.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: ACCENT, textDecoration: "none", fontWeight: 600 }}
                >
                  {lead.ctaLabel || "View destination"} →
                </a>
              </div>

              {lead.sentNurtureStages.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Stages delivered
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {lead.sentNurtureStages.map((stage) => (
                      <span
                        key={stage}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: "rgba(59,130,246,0.12)",
                          border: `1px solid rgba(59,130,246,0.25)`,
                          color: ACCENT,
                        }}
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(lead.milestones.leadMilestones.length > 0 || lead.milestones.customerMilestones.length > 0) && (
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Milestones achieved
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {lead.milestones.leadMilestones.map((m) => (
                      <span key={m} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                        {m}
                      </span>
                    ))}
                    {lead.milestones.customerMilestones.map((m) => (
                      <span key={m} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, backgroundColor: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 4. Journey Timeline                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Card>
          <SectionLabel>History</SectionLabel>
          <SectionTitle>Journey timeline</SectionTitle>
          {filteredEvents.length === 0 ? (
            <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>No events recorded for this lead yet.</p>
          ) : (
            <div style={{ position: "relative", paddingLeft: 32 }}>
              {/* Vertical connector line */}
              <div
                style={{
                  position: "absolute",
                  left: 7,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderRadius: 1,
                }}
                aria-hidden="true"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {filteredEvents.map((event, index) => {
                  const dotColor = eventDotColor(event.eventType);
                  const isLast = index === filteredEvents.length - 1;
                  return (
                    <div
                      key={event.id}
                      style={{
                        display: "flex",
                        gap: 20,
                        paddingBottom: isLast ? 0 : 20,
                        position: "relative",
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: -32,
                          top: 4,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          border: `2px solid ${PAGE_BG}`,
                          boxShadow: `0 0 0 2px ${dotColor}40`,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      {/* Timestamp */}
                      <div style={{ width: 130, flexShrink: 0, paddingTop: 1 }}>
                        <span style={{ fontSize: 12, color: TEXT_MUTED, whiteSpace: "nowrap" as const }}>
                          {formatEventDate(event.timestamp)}
                        </span>
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                            {event.eventType}
                          </span>
                          <span style={{
                            fontSize: 11,
                            padding: "2px 7px",
                            borderRadius: 4,
                            backgroundColor: `${dotColor}1a`,
                            border: `1px solid ${dotColor}33`,
                            color: dotColor,
                            fontWeight: 600,
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.06em",
                          }}>
                            {event.channel}
                          </span>
                          <span style={{
                            fontSize: 11,
                            padding: "2px 7px",
                            borderRadius: 4,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: TEXT_MUTED,
                          }}>
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

        {/* ------------------------------------------------------------------ */}
        {/* 5. Activity Grid                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div style={twoColStyle}>
          <Card>
            <SectionLabel>Automation</SectionLabel>
            <SectionTitle>Workflow runs</SectionTitle>
            {workflowItems.length === 0 ? (
              <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>No workflow runs recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {workflowItems.map((workflow) => (
                  <ActivityCard
                    key={workflow.id}
                    eyebrow={workflow.provider}
                    title={workflow.eventName}
                    detail={workflow.detail}
                    date={workflow.createdAt}
                    ok={workflow.ok}
                    mode={workflow.mode}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Channels</SectionLabel>
            <SectionTitle>Provider executions</SectionTitle>
            {providerItems.length === 0 ? (
              <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>No provider executions recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {providerItems.map((execution) => (
                  <ActivityCard
                    key={execution.id}
                    eyebrow={execution.provider}
                    title={execution.kind}
                    detail={execution.detail}
                    date={execution.createdAt}
                    ok={execution.ok}
                    mode={execution.mode}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 6. Jobs Grid                                                        */}
        {/* ------------------------------------------------------------------ */}
        <div style={twoColStyle}>
          <Card>
            <SectionLabel>Scheduling</SectionLabel>
            <SectionTitle>Booking jobs</SectionTitle>
            {bookingItems.length === 0 ? (
              <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>No booking jobs recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bookingItems.map((job) => (
                  <ActivityCard
                    key={job.id}
                    eyebrow={job.provider}
                    title={job.status}
                    detail={job.detail}
                    date={job.updatedAt}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Documents</SectionLabel>
            <SectionTitle>Document jobs</SectionTitle>
            {documentItems.length === 0 ? (
              <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>No document jobs recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {documentItems.map((job) => (
                  <ActivityCard
                    key={job.id}
                    eyebrow={job.provider}
                    title={job.status}
                    detail={job.detail}
                    date={job.updatedAt}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Runtime trace (collapsed detail)                                   */}
        {/* ------------------------------------------------------------------ */}
        <Card>
          <SectionLabel>Debug</SectionLabel>
          <SectionTitle>Runtime trace</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Visitor ID", value: lead.trace.visitorId },
              { label: "Session ID", value: lead.trace.sessionId },
              { label: "Blueprint ID", value: lead.trace.blueprintId },
              { label: "Step ID", value: lead.trace.stepId },
              { label: "Tenant", value: lead.trace.tenant },
              { label: "Experiment", value: lead.trace.experimentId ?? "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "monospace", wordBreak: "break-all" as const }}>
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
