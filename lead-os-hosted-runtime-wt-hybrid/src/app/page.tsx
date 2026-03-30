import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { EXPERIENCE_HEURISTICS, resolveExperienceProfile } from "@/lib/experience";
import { getNiche } from "@/lib/catalog";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { buildDefaultFunnelGraphs } from "@/lib/funnel-library";
import { getAutomationHealth } from "@/lib/providers";
import { INDUSTRY_TEMPLATES } from "@/lib/niche-templates";
import { VALID_REVENUE_MODELS } from "@/lib/constants";
import type { FunnelFamily } from "@/lib/runtime-schema";
import { getCanonicalEvents, getLeadRecords } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";

export const metadata: Metadata = {
  title: `${tenantConfig.brandName} | Autonomous Lead Acquisition & Conversion`,
  description: "Replace 15+ SaaS tools with one lead operating system. AI-powered scoring, multi-channel nurture, and a marketplace — for every industry.",
  openGraph: {
    title: `${tenantConfig.brandName} | Lead OS`,
    description: "Replace 15+ SaaS tools with one lead operating system.",
    images: [{ url: buildOgImageUrl(tenantConfig.brandName, "Autonomous lead acquisition & conversion"), width: 1200, height: 630 }],
  },
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function asIntent(value: string | string[] | undefined): "discover" | "compare" | "solve-now" | undefined {
  const normalized = asString(value);
  return normalized === "discover" || normalized === "compare" || normalized === "solve-now"
    ? normalized
    : undefined;
}

function asFamily(value: string | string[] | undefined): FunnelFamily | undefined {
  const normalized = asString(value);
  const valid: FunnelFamily[] = [
    "lead-magnet",
    "qualification",
    "chat",
    "webinar",
    "authority",
    "checkout",
    "retention",
    "rescue",
    "referral",
    "continuity",
  ];
  return normalized && valid.includes(normalized as FunnelFamily) ? (normalized as FunnelFamily) : undefined;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const niche = getNiche(asString(params.niche) ?? tenantConfig.defaultNiche);
  const headerStore = await headers();
  const graphs = buildDefaultFunnelGraphs(tenantConfig.tenantId);
  const health = getAutomationHealth();
  const snapshot = buildDashboardSnapshot(await getLeadRecords(), await getCanonicalEvents());
  const profile = resolveExperienceProfile({
    family: asFamily(params.family),
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(params.source),
    intent: asIntent(params.intent),
    returning: asBoolean(params.returning),
    milestone: asString(params.milestone),
    preferredMode: asString(params.mode),
    score: Number(asString(params.score) ?? 0) || undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  return (
    <ExperienceScaffold
      eyebrow={`${tenantConfig.brandName}`}
      title="Turn every visitor into a qualified lead — automatically"
      summary={`Capture leads, score them in real time, and nurture them across ${Object.keys(graphs).length} proven funnel types — all on autopilot. ${profile.heroSummary}`}
      profile={profile}
      metrics={[
        {
          label: "Engaged leads",
          value: `${snapshot.milestones.lead.returnEngaged}`,
          detail: "Leads who returned and engaged with your content.",
        },
        {
          label: "Qualified leads",
          value: `${snapshot.milestones.lead.bookedOrOffered}`,
          detail: "Leads who completed a booking or accepted an offer.",
        },
        {
          label: "System status",
          value: health.liveMode ? "Live" : "Demo mode",
          detail: "All channels and automations are active and ready.",
        },
      ]}
    >
      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Built for conversion</p>
          <h2>Every touchpoint designed to move leads forward</h2>
          <ul className="check-list">
            {EXPERIENCE_HEURISTICS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">Proven funnels</p>
          <h2>Pre-built journeys that adapt to each visitor</h2>
          <ul className="check-list">
            {Object.values(graphs).slice(0, 5).map((graph) => (
              <li key={graph.id}>
                <strong>{graph.name}</strong>: {graph.nodes.length} steps designed to {graph.goal}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* ── Social Proof Bar ──────────────────────────────────────────────── */}
      <section
        aria-label="Platform stats"
        className="panel"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0",
          padding: "0",
          overflow: "hidden",
        }}
      >
        {[
          { stat: "110+", label: "integrations" },
          { stat: `${Object.keys(INDUSTRY_TEMPLATES).length}`, label: "industry templates" },
          { stat: `${VALID_REVENUE_MODELS.length}`, label: "revenue models" },
          { stat: "27", label: "dashboard pages" },
        ].map(({ stat, label }, index, arr) => (
          <div
            key={label}
            style={{
              flex: "1 1 160px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "22px 24px",
              borderRight: index < arr.length - 1 ? "1px solid var(--surface-border)" : "none",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
                fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--accent)",
              }}
            >
              {stat}
            </span>
            <span className="muted" style={{ fontSize: "0.88rem", fontWeight: 600 }}>
              {label}
            </span>
          </div>
        ))}
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="panel" aria-labelledby="how-it-works-heading">
        <p className="eyebrow">How it works</p>
        <h2 id="how-it-works-heading">Four steps from zero to automated pipeline</h2>
        <ol
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            paddingLeft: 0,
            listStyle: "none",
            marginTop: "24px",
          }}
        >
          {[
            {
              number: "1",
              title: "Deploy",
              description:
                "Pick your niche. The system auto-generates scoring, content, and funnels.",
            },
            {
              number: "2",
              title: "Capture",
              description:
                "Embed one script tag. Leads flow in from forms, chat, assessments, and calculators.",
            },
            {
              number: "3",
              title: "Score & Nurture",
              description:
                "4D scoring classifies leads by temperature. Multi-channel nurture runs on autopilot.",
            },
            {
              number: "4",
              title: "Convert & Scale",
              description:
                "Hot leads get human handoff. A/B testing optimizes continuously. Data compounds.",
            },
          ].map(({ number, title, description }) => (
            <li
              key={number}
              style={{
                display: "grid",
                gap: "12px",
                padding: "22px",
                borderRadius: "var(--radius-md)",
                background: "rgba(34, 95, 84, 0.06)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "999px",
                  background: "var(--accent)",
                  color: "#fff9f2",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                {number}
              </div>
              <div>
                <h3 style={{ marginBottom: "6px" }}>{title}</h3>
                <p className="muted" style={{ fontSize: "0.95rem" }}>
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Who It's For ──────────────────────────────────────────────────── */}
      <section aria-labelledby="who-its-for-heading">
        <p className="eyebrow">Who it&apos;s for</p>
        <h2 id="who-its-for-heading">Built for teams that sell leads, run pipelines, or build products</h2>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            marginTop: "20px",
          }}
        >
          {[
            {
              title: "Marketing Agencies",
              description:
                "Run lead gen as a managed service for your clients. White-label the platform, own the relationship.",
              pricing: "$200–1K/mo per client",
            },
            {
              title: "SaaS Entrepreneurs",
              description:
                "Launch a white-label lead gen SaaS on top of the platform. Brand it, price it, and keep the margin.",
              pricing: "$99–499/mo per seat",
            },
            {
              title: "Lead Gen Companies",
              description:
                "Capture high-intent leads through the system and sell them through the marketplace or direct.",
              pricing: "$25–500 per lead",
            },
          ].map(({ title, description, pricing }) => (
            <article
              key={title}
              className="panel"
              style={{ display: "grid", gap: "12px", alignContent: "start" }}
            >
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p className="muted" style={{ fontSize: "0.95rem" }}>
                {description}
              </p>
              <p
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "var(--secondary-soft)",
                  display: "inline-block",
                  width: "fit-content",
                }}
              >
                {pricing}
              </p>
              <Link
                href="/onboard"
                className="secondary"
                style={{ marginTop: "4px", width: "fit-content", minHeight: "40px", padding: "8px 16px" }}
              >
                Get started
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Replace Replaces ──────────────────────────────────────────────── */}
      <section className="panel" aria-labelledby="replaces-heading">
        <p className="eyebrow">One platform</p>
        <h2 id="replaces-heading">Lead OS replaces your entire growth stack</h2>
        <p className="muted" style={{ marginBottom: "20px", maxWidth: "56ch" }}>
          Stop paying for twelve tools that don&apos;t talk to each other. Everything below is
          included.
        </p>
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            paddingLeft: 0,
            listStyle: "none",
            marginBottom: "24px",
          }}
        >
          {[
            "CRM",
            "Email Marketing",
            "SMS",
            "Landing Pages",
            "A/B Testing",
            "Analytics",
            "Workflow Automation",
            "Content AI",
            "Lead Scoring",
            "Booking",
            "Chat",
            "Billing",
          ].map((tool) => (
            <li
              key={tool}
              style={{
                padding: "7px 14px",
                borderRadius: "999px",
                background: "rgba(161, 39, 47, 0.07)",
                border: "1px solid rgba(161, 39, 47, 0.14)",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text-soft)",
                textDecoration: "line-through",
                textDecorationColor: "rgba(161, 39, 47, 0.4)",
              }}
            >
              {tool}
            </li>
          ))}
        </ul>
        <div
          style={{
            padding: "18px 22px",
            borderRadius: "var(--radius-md)",
            background: "var(--success-soft)",
            border: "1px solid rgba(29, 111, 81, 0.22)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--success)" }}>
            Total saved:
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
            $630–4,550/month per client
          </span>
        </div>
      </section>

      <AdaptiveLeadCaptureForm
        source="manual"
        family={profile.family}
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath="/"
        returning={asBoolean(params.returning)}
        profile={profile}
      />

      <section className="panel" style={{ textAlign: "center", marginTop: 32 }}>
        <p className="eyebrow">Ready to automate your pipeline?</p>
        <h2>Start capturing leads in minutes</h2>
        <p className="muted" style={{ maxWidth: 480, margin: "8px auto 20px" }}>
          Choose a plan that fits your business. Set up your first funnel in under 10 minutes.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <Link href="/pricing" className="secondary">View pricing</Link>
          <Link href="/onboard" className="primary">Get started free</Link>
        </div>
      </section>
    </ExperienceScaffold>
  );
}
