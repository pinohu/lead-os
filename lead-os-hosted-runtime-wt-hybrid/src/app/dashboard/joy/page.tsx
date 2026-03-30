"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// --------------- types ---------------

interface Milestone {
  id: string;
  title: string;
  message: string;
  metric: string;
  celebrationLevel: string;
  detectedAt: string;
  acknowledged: boolean;
}

interface TimeSaved {
  totalHoursSaved: number;
  equivalentValue: number;
  personalMessage: string;
  breakdown: Array<{
    category: string;
    hoursSaved: number;
    description: string;
  }>;
}

interface Briefing {
  greeting: string;
  summary: string;
  wins: string[];
  attentionItems: Array<{
    priority: string;
    message: string;
    actionUrl: string;
  }>;
  timeSaved: TimeSaved;
  milestones: Milestone[];
  recommendation: string;
}

// --------------- page ---------------

export default function JoyDashboard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/joy/briefing", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        setBriefing(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Preparing your briefing...</p>
        </section>
      </main>
    );

  if (!briefing)
    return (
      <main className="experience-page">
        <section className="panel">
          <p>Could not load your briefing. Try refreshing.</p>
        </section>
      </main>
    );

  return (
    <main className="experience-page">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <section className="experience-hero" style={{ textAlign: "center" }}>
        <div
          className="hero-copy"
          style={{ maxWidth: 700, margin: "0 auto" }}
        >
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
            {briefing.greeting}
          </h1>
          <p className="lede">{briefing.summary}</p>
        </div>
      </section>

      {/* ── Time Saved — hero metric ─────────────────────────── */}
      <section
        className="panel"
        style={{
          textAlign: "center",
          background: "var(--accent-soft)",
          border: "2px solid var(--accent)",
        }}
      >
        <p className="eyebrow">Time you got back</p>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            margin: "8px 0",
          }}
        >
          {briefing.timeSaved.totalHoursSaved.toFixed(1)} hours
        </h2>
        <p className="muted">{briefing.timeSaved.personalMessage}</p>
        <p style={{ fontSize: "0.88rem", fontWeight: 700, marginTop: 8 }}>
          Worth ${briefing.timeSaved.equivalentValue.toLocaleString()} at
          $150/hr
        </p>
      </section>

      {/* ── Wins ─────────────────────────────────────────────── */}
      {briefing.wins.length > 0 && (
        <section>
          <p className="eyebrow">Your wins</p>
          <div className="grid two">
            {briefing.wins.map((win, i) => (
              <article
                key={i}
                className="panel"
                style={{ borderLeft: "4px solid var(--success)" }}
              >
                <p style={{ margin: 0, fontSize: "0.92rem" }}>{win}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Milestones ───────────────────────────────────────── */}
      {briefing.milestones.length > 0 && (
        <section>
          <p className="eyebrow">Milestones reached</p>
          <div className="grid three">
            {briefing.milestones.map((m) => (
              <article
                key={m.id}
                className="panel"
                style={{
                  textAlign: "center",
                  borderTop: "4px solid var(--accent)",
                }}
              >
                <h3 style={{ fontSize: "1rem", margin: "0 0 4px" }}>
                  {m.title}
                </h3>
                <p className="muted" style={{ fontSize: "0.84rem" }}>
                  {m.message}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent-strong)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  {m.metric}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Attention Items ──────────────────────────────────── */}
      {briefing.attentionItems.length > 0 ? (
        <section>
          <p className="eyebrow">Needs your attention</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {briefing.attentionItems.map((item, i) => (
              <Link
                key={i}
                href={item.actionUrl}
                className="panel"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                  borderLeft:
                    item.priority === "high"
                      ? "4px solid var(--danger)"
                      : item.priority === "medium"
                        ? "4px solid var(--accent)"
                        : "4px solid var(--secondary)",
                }}
              >
                <span style={{ fontSize: "0.88rem", flex: 1 }}>
                  {item.message}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--accent)",
                    whiteSpace: "nowrap",
                  }}
                >
                  View &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel" style={{ textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px" }}>
            Nothing needs your attention right now
          </h2>
          <p className="muted">
            Seriously. Go enjoy your coffee. The system is handling it.
          </p>
        </section>
      )}

      {/* ── Today's Recommendation ───────────────────────────── */}
      <section
        className="panel"
        style={{
          background: "var(--secondary-soft)",
          borderLeft: "4px solid var(--secondary)",
        }}
      >
        <p className="eyebrow">Your one thing for today</p>
        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
          {briefing.recommendation}
        </p>
      </section>

      {/* ── Time Saved Breakdown ─────────────────────────────── */}
      <section>
        <p className="eyebrow">Where your time was saved</p>
        <div className="grid two">
          {briefing.timeSaved.breakdown.map((item) => (
            <article key={item.category} className="panel">
              <h3 style={{ margin: "0 0 4px", fontSize: "0.92rem" }}>
                {item.category}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "var(--accent)",
                }}
              >
                {item.hoursSaved.toFixed(1)} hrs
              </p>
              <p className="muted" style={{ fontSize: "0.78rem" }}>
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "40px 0" }}>
        <Link href="/dashboard" className="secondary">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
