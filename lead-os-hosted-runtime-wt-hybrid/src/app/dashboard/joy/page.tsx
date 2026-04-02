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
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Preparing your briefing...</p>
        </section>
      </main>
    );

  if (!briefing)
    return (
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p>Could not load your briefing. Try refreshing.</p>
        </section>
      </main>
    );

  return (
    <main className="min-h-screen">
      {/* -- Greeting ------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto max-w-[700px]">
          <h1 className="text-[clamp(1.6rem,4vw,2.4rem)]">
            {briefing.greeting}
          </h1>
          <p className="text-lg text-foreground">{briefing.summary}</p>
        </div>
      </section>

      {/* -- Time Saved -- hero metric -------------------------------- */}
      <section className="rounded-xl border border-border bg-card p-6 text-center border-2 border-[var(--accent)] bg-[var(--accent-soft)]">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time you got back</p>
        <h2 className="my-2 text-[clamp(2rem,5vw,3.5rem)] text-[var(--accent)]">
          {briefing.timeSaved.totalHoursSaved.toFixed(1)} hours
        </h2>
        <p className="text-muted-foreground">{briefing.timeSaved.personalMessage}</p>
        <p className="mt-2 text-sm font-bold">
          Worth ${briefing.timeSaved.equivalentValue.toLocaleString()} at
          $150/hr
        </p>
      </section>

      {/* -- Wins ----------------------------------------------------- */}
      {briefing.wins.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your wins</p>
          <div className="grid md:grid-cols-2 gap-6">
            {briefing.wins.map((win, i) => (
              <article
                key={i}
                className="rounded-xl border border-border bg-card p-6 border-l-4 border-l-[var(--success)]"
              >
                <p className="m-0 text-sm">{win}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* -- Milestones ----------------------------------------------- */}
      {briefing.milestones.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones reached</p>
          <div className="grid md:grid-cols-3 gap-6">
            {briefing.milestones.map((m) => (
              <article
                key={m.id}
                className="rounded-xl border border-border bg-card p-6 text-center border-t-4 border-t-[var(--accent)]"
              >
                <h3 className="mb-1 text-base">{m.title}</h3>
                <p className="text-muted-foreground text-sm">{m.message}</p>
                <span className="mt-2 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent-strong)]">
                  {m.metric}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* -- Attention Items ------------------------------------------ */}
      {briefing.attentionItems.length > 0 ? (
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Needs your attention</p>
          <div className="flex flex-col gap-2">
            {briefing.attentionItems.map((item, i) => (
              <Link
                key={i}
                href={item.actionUrl}
                className={`rounded-xl border border-border bg-card p-6 flex items-center gap-3 no-underline border-l-4 ${
                  item.priority === "high"
                    ? "border-l-[var(--danger)]"
                    : item.priority === "medium"
                      ? "border-l-[var(--accent)]"
                      : "border-l-[var(--secondary)]"
                }`}
              >
                <span className="flex-1 text-sm">{item.message}</span>
                <span className="whitespace-nowrap text-xs text-[var(--accent)]">
                  View &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="mb-2">
            Nothing needs your attention right now
          </h2>
          <p className="text-muted-foreground">
            Seriously. Go enjoy your coffee. The system is handling it.
          </p>
        </section>
      )}

      {/* -- Today's Recommendation ----------------------------------- */}
      <section className="rounded-xl border border-border bg-card p-6 border-l-4 border-l-[var(--secondary)] bg-[var(--secondary-soft)]">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your one thing for today</p>
        <p className="m-0 text-base font-semibold">
          {briefing.recommendation}
        </p>
      </section>

      {/* -- Time Saved Breakdown ------------------------------------- */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Where your time was saved</p>
        <div className="grid md:grid-cols-2 gap-6">
          {briefing.timeSaved.breakdown.map((item) => (
            <article key={item.category} className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-1 text-sm">{item.category}</h3>
              <p className="m-0 text-xl font-extrabold text-[var(--accent)]">
                {item.hoursSaved.toFixed(1)} hrs
              </p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* -- Footer --------------------------------------------------- */}
      <section className="py-10 text-center">
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
