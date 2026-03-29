"use client";

// SSE alternative: import { onLeadCaptured, onLeadScored } from "@/lib/realtime-hooks";
// The realtime-hooks module exports event publishers (onLeadCaptured, onLeadScored,
// onExperimentConversion, onMarketplaceLeadClaimed, onProvisioningStep) that publish
// events via the realtime SSE system. To replace the polling fetch below with SSE:
//
//   import { onLeadCaptured, onLeadScored } from "@/lib/realtime-hooks";
//
//   // Inside useEffect, instead of setInterval polling:
//   // const eventSource = new EventSource(`/api/realtime?tenantId=${tenantId}`);
//   // eventSource.addEventListener("lead.captured", (e) => {
//   //   const payload = JSON.parse(e.data);
//   //   setData((prev) => prev ? { ...prev, hotLeads: [payload, ...prev.hotLeads] } : prev);
//   // });
//   // eventSource.addEventListener("lead.scored", (e) => {
//   //   const payload = JSON.parse(e.data);
//   //   // Update lead scores in real time
//   // });
//   // return () => eventSource.close();

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface HotLead {
  leadKey: string;
  firstName: string;
  lastName: string;
  email?: string;
  niche: string;
  source: string;
  family: string;
  stage: string;
  score: number;
  reasons: string[];
  lastActivity: string;
  lastEventType: string | null;
}

interface HighIntentEvent {
  id: string;
  eventType: string;
  leadKey: string;
  timestamp: string;
  channel: string;
  niche: string;
  metadata: Record<string, unknown>;
}

interface ActivityFeedItem {
  id: string;
  eventType: string;
  leadKey: string;
  timestamp: string;
  channel: string;
  niche: string;
  source: string;
}

interface RadarData {
  hotLeads: HotLead[];
  recentHighIntentEvents: HighIntentEvent[];
  activityFeed: ActivityFeedItem[];
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90
    ? "var(--danger)"
    : score >= 75
      ? "var(--accent)"
      : "var(--secondary)";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 48,
      height: 48,
      borderRadius: "50%",
      border: `3px solid ${color}`,
      fontWeight: 800,
      fontSize: "1rem",
      color,
      flexShrink: 0,
    }}>
      {score}
    </span>
  );
}

export default function RadarPage() {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hot" | "events" | "feed">("hot");
  const [alertThreshold, setAlertThreshold] = useState(75);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  const handleAction = useCallback(async (leadKey: string, action: "schedule" | "email" | "assign", label: string) => {
    const statusKey = `${leadKey}:${action}`;
    setActionStatus((prev) => ({ ...prev, [statusKey]: "pending" }));
    try {
      const res = await fetch("/api/workflows/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          leadKey,
          trigger: `radar.${action}`,
          metadata: { action, source: "radar-dashboard" },
        }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setActionStatus((prev) => ({ ...prev, [statusKey]: "done" }));
      setTimeout(() => setActionStatus((prev) => { const next = { ...prev }; delete next[statusKey]; return next; }), 3000);
    } catch {
      setActionStatus((prev) => ({ ...prev, [statusKey]: "error" }));
      setTimeout(() => setActionStatus((prev) => { const next = { ...prev }; delete next[statusKey]; return next; }), 5000);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetch("/api/dashboard/radar", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load radar data: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading radar data...</p>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="eyebrow">Error</p>
          <h2>Failed to load radar</h2>
          <p className="muted">{error}</p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  const filteredHotLeads = data.hotLeads.filter((lead) => lead.score >= alertThreshold);

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Hot lead radar</p>
          <h1>Real-time monitoring</h1>
          <p className="lede">
            Live view of hot leads, high-intent events, and the full activity feed.
            Data refreshes every 30 seconds.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
            <Link href="/dashboard/scoring" className="secondary">Scoring dashboard</Link>
            <button
              type="button"
              className="secondary"
              onClick={fetchData}
              style={{ minHeight: 36 }}
            >
              Refresh now
            </button>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Radar status</p>
          <ul className="journey-rail">
            <li>
              <strong>Hot leads</strong>
              <span>{data.hotLeads.length}</span>
            </li>
            <li>
              <strong>High-intent events (24h)</strong>
              <span>{data.recentHighIntentEvents.length}</span>
            </li>
            <li>
              <strong>Activity feed</strong>
              <span>{data.activityFeed.length} events</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Alert configuration</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}>
            Score threshold
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              aria-label="Alert score threshold"
              style={{ width: 140 }}
            />
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 36,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              fontWeight: 800,
              fontSize: "0.82rem",
            }}>
              {alertThreshold}
            </span>
          </label>
          <span style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>
            {filteredHotLeads.length} leads above threshold
          </span>
        </div>
      </section>

      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div
          role="tablist"
          aria-label="Radar views"
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(20, 33, 29, 0.08)",
          }}
        >
          {([
            { id: "hot" as const, label: `Hot Leads (${filteredHotLeads.length})` },
            { id: "events" as const, label: `High-Intent (${data.recentHighIntentEvents.length})` },
            { id: "feed" as const, label: `Activity Feed (${data.activityFeed.length})` },
          ]).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid var(--accent)" : "3px solid transparent",
                background: activeTab === tab.id ? "rgba(196, 99, 45, 0.04)" : "transparent",
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                color: activeTab === tab.id ? "var(--accent-strong)" : "var(--text-soft)",
                transition: "all 140ms ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>
          {activeTab === "hot" && (
            <div role="tabpanel" id="panel-hot" aria-label="Hot leads panel">
              {filteredHotLeads.length === 0 ? (
                <p className="muted">No leads above the current threshold ({alertThreshold}).</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {filteredHotLeads.map((lead) => (
                    <article
                      key={lead.leadKey}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: 16,
                        alignItems: "center",
                        padding: "16px 20px",
                        borderRadius: 14,
                        background: lead.score >= 90
                          ? "rgba(161, 39, 47, 0.04)"
                          : "rgba(196, 99, 45, 0.04)",
                        border: `1px solid ${lead.score >= 90 ? "rgba(161, 39, 47, 0.12)" : "rgba(196, 99, 45, 0.12)"}`,
                      }}
                    >
                      <ScoreRing score={lead.score} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>
                          <Link href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}>
                            {lead.firstName} {lead.lastName}
                          </Link>
                        </h3>
                        <p className="muted" style={{ fontSize: "0.82rem", margin: "2px 0 0" }}>
                          {lead.email ?? lead.leadKey} | {lead.niche} | {lead.source}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          {lead.reasons.map((reason, i) => (
                            <span key={i} style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "var(--accent-soft)",
                              color: "var(--accent-strong)",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}>
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="secondary"
                          style={{ minHeight: 32, padding: "4px 10px", fontSize: "0.76rem" }}
                          aria-label={`Schedule call with ${lead.firstName} ${lead.lastName}`}
                          disabled={actionStatus[`${lead.leadKey}:schedule`] === "pending"}
                          onClick={() => handleAction(lead.leadKey, "schedule", `${lead.firstName} ${lead.lastName}`)}
                        >
                          {actionStatus[`${lead.leadKey}:schedule`] === "pending" ? "Scheduling..." : actionStatus[`${lead.leadKey}:schedule`] === "done" ? "Scheduled" : actionStatus[`${lead.leadKey}:schedule`] === "error" ? "Failed" : "Schedule call"}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          style={{ minHeight: 32, padding: "4px 10px", fontSize: "0.76rem" }}
                          aria-label={`Send email to ${lead.firstName} ${lead.lastName}`}
                          disabled={actionStatus[`${lead.leadKey}:email`] === "pending"}
                          onClick={() => handleAction(lead.leadKey, "email", `${lead.firstName} ${lead.lastName}`)}
                        >
                          {actionStatus[`${lead.leadKey}:email`] === "pending" ? "Sending..." : actionStatus[`${lead.leadKey}:email`] === "done" ? "Sent" : actionStatus[`${lead.leadKey}:email`] === "error" ? "Failed" : "Send email"}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          style={{ minHeight: 32, padding: "4px 10px", fontSize: "0.76rem" }}
                          aria-label={`Assign ${lead.firstName} ${lead.lastName} to sales`}
                          disabled={actionStatus[`${lead.leadKey}:assign`] === "pending"}
                          onClick={() => handleAction(lead.leadKey, "assign", `${lead.firstName} ${lead.lastName}`)}
                        >
                          {actionStatus[`${lead.leadKey}:assign`] === "pending" ? "Assigning..." : actionStatus[`${lead.leadKey}:assign`] === "done" ? "Assigned" : actionStatus[`${lead.leadKey}:assign`] === "error" ? "Failed" : "Assign"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div role="tabpanel" id="panel-events" aria-label="High-intent events panel">
              {data.recentHighIntentEvents.length === 0 ? (
                <p className="muted">No high-intent events in the last 24 hours.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {data.recentHighIntentEvents.map((event) => (
                    <article
                      key={event.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 12,
                        alignItems: "center",
                        padding: "12px 16px",
                        borderRadius: 14,
                        background: "rgba(34, 95, 84, 0.04)",
                        border: "1px solid rgba(34, 95, 84, 0.08)",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--accent-soft)",
                            color: "var(--accent-strong)",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            marginRight: 8,
                          }}>
                            {event.eventType.replace(/_/g, " ")}
                          </span>
                          <Link href={`/dashboard/leads/${encodeURIComponent(event.leadKey)}`}>
                            {event.leadKey}
                          </Link>
                        </p>
                        <p className="muted" style={{ fontSize: "0.78rem", margin: "2px 0 0" }}>
                          {event.channel} | {event.niche}
                        </p>
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "feed" && (
            <div role="tabpanel" id="panel-feed" aria-label="Activity feed panel">
              {data.activityFeed.length === 0 ? (
                <p className="muted">No activity recorded yet.</p>
              ) : (
                <div style={{ display: "grid", gap: 4 }}>
                  {data.activityFeed.map((event) => (
                    <article
                      key={event.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 8,
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: 8,
                        borderBottom: "1px solid rgba(20, 33, 29, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(34, 95, 84, 0.08)",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {event.eventType.replace(/_/g, " ")}
                        </span>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(event.leadKey)}`}
                          style={{ fontSize: "0.82rem" }}
                        >
                          {event.leadKey}
                        </Link>
                        <span className="muted" style={{ fontSize: "0.76rem" }}>
                          {event.channel} | {event.source}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
