import type { Metadata } from "next";
import Link from "next/link";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { resolveExperienceProfile } from "@/lib/experience";
import { getNiche } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";
import { headers } from "next/headers";
import type { FunnelFamily } from "@/lib/runtime-schema";

const brandName = tenantConfig.brandName || "Lead OS";

export const metadata: Metadata = {
  title: `${brandName} | Replace 15 Tools With One Lead Generation Platform`,
  description: "Stop paying for 8+ SaaS tools that don't talk to each other. One platform for lead capture, AI scoring, multi-channel nurture, and marketplace — for agencies, SaaS builders, and lead gen companies.",
  openGraph: {
    title: `${brandName} — The Lead Generation Operating System`,
    description: "One platform replaces your CRM, email marketing, landing pages, A/B testing, analytics, and 7 more tools.",
    images: [{ url: buildOgImageUrl(brandName, "Replace 15 tools with one lead generation platform"), width: 1200, height: 630 }],
  },
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const niche = getNiche(asString(params.niche) ?? tenantConfig.defaultNiche);
  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(params.source),
    returning: asBoolean(params.returning),
    preferredMode: asString(params.mode),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  return (
    <main className="experience-page" data-theme="light" style={{ colorScheme: "light" }}>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        textAlign: "center",
        padding: "100px 24px 80px",
        background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(79, 70, 229, 0.08) 0%, transparent 70%)",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px 5px 6px", borderRadius: 999,
            background: "var(--accent-soft)", border: "1px solid var(--accent-glow)",
            fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)",
            marginBottom: 28,
          }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
            Now with AI-powered customer intelligence
          </div>
          <h1 style={{ color: "var(--text)" }}>
            Your lead pipeline,<br />
            on autopilot.
          </h1>
          <p style={{ fontSize: "1.12rem", color: "var(--text-soft)", maxWidth: 520, margin: "16px auto 0", lineHeight: 1.7 }}>
            Replace 8+ tools with one platform. AI scoring, multi-channel nurture,
            and a lead marketplace — for agencies, SaaS builders, and lead gen teams.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36 }}>
            <Link href="/onboard" className="primary" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>Get started free</Link>
            <Link href="/pricing" className="secondary" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>See pricing</Link>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", marginTop: 14, letterSpacing: "0.01em" }}>
            No credit card required &middot; Set up in under 10 minutes &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Trusted Numbers ─────────────────────────────────────────── */}
      <section style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center",
        gap: "48px", padding: "40px 24px",
        borderBottom: "1px solid var(--surface-border)",
      }}>
        {[
          { stat: "16", label: "Industries" },
          { stat: "110+", label: "Integrations" },
          { stat: "5", label: "Revenue models" },
          { stat: "84", label: "AI personas" },
        ].map(({ stat, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)" }}>{stat}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-soft)", fontWeight: 500, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── What You Replace ────────────────────────────────────────── */}
      <section className="panel" aria-labelledby="replaces-heading">
        <p className="eyebrow">One platform replaces your entire stack</p>
        <h2 id="replaces-heading" style={{ maxWidth: 500 }}>
          Stop paying for twelve tools that don&apos;t talk to each other
        </h2>
        <ul style={{
          display: "flex", flexWrap: "wrap", gap: 10, paddingLeft: 0, listStyle: "none", marginTop: 20, marginBottom: 24,
        }}>
          {["CRM", "Email Marketing", "SMS", "Landing Pages", "A/B Testing", "Analytics",
            "Workflow Automation", "Content AI", "Lead Scoring", "Booking", "Chat", "Billing",
          ].map((tool) => (
            <li key={tool} style={{
              padding: "7px 14px", borderRadius: 999,
              background: "rgba(161, 39, 47, 0.07)", border: "1px solid rgba(161, 39, 47, 0.14)",
              fontSize: "0.88rem", fontWeight: 600, color: "var(--text-soft)",
              textDecoration: "line-through", textDecorationColor: "rgba(161, 39, 47, 0.4)",
            }}>{tool}</li>
          ))}
        </ul>
        <div style={{
          padding: "18px 22px", borderRadius: "var(--radius-md)",
          background: "var(--success-soft)", border: "1px solid rgba(29, 111, 81, 0.22)",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--success)" }}>Total saved:</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>$630–4,550/month per client</span>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="panel">
        <p className="eyebrow">How it works</p>
        <h2>Four steps from zero to automated pipeline</h2>
        <ol style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, paddingLeft: 0, listStyle: "none", marginTop: 24,
        }}>
          {[
            { n: "1", title: "Pick your niche", desc: "Type any industry. The system auto-generates scoring weights, assessment questions, nurture sequences, and landing pages." },
            { n: "2", title: "Capture leads", desc: "Embed one script tag or use our pages. Leads flow in from forms, chat, assessments, calculators, and WhatsApp." },
            { n: "3", title: "Score and nurture", desc: "4D scoring (intent + fit + engagement + urgency) classifies every lead. Intelligence-driven emails send on autopilot." },
            { n: "4", title: "Convert and scale", desc: "Hot leads get routed to booking. A/B testing optimizes continuously. The Joy Dashboard shows your time saved." },
          ].map(({ n, title, desc }) => (
            <li key={n} style={{
              display: "grid", gap: 12, padding: 22, borderRadius: "var(--radius-md)",
              background: "rgba(34, 95, 84, 0.06)", border: "1px solid var(--surface-border)",
            }}>
              <div aria-hidden="true" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 999, background: "var(--accent)", color: "#fff9f2",
                fontWeight: 800, fontSize: "0.95rem", flexShrink: 0,
              }}>{n}</div>
              <div>
                <h3 style={{ marginBottom: 6 }}>{title}</h3>
                <p className="muted" style={{ fontSize: "0.95rem" }}>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Who It's For ────────────────────────────────────────────── */}
      <section>
        <p className="eyebrow">Built for operators who deliver results</p>
        <h2>Choose your path</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 20 }}>
          {[
            { title: "Marketing Agencies", href: "/for/agencies",
              desc: "Run lead gen as a managed service for your clients. White-label the platform, own the relationship, charge $200–2,000/mo per client.",
              cta: "Built for agencies" },
            { title: "SaaS Entrepreneurs", href: "/for/saas-founders",
              desc: "Launch your own white-label lead generation SaaS. Custom branding, Stripe billing built in. Deploy in hours, not months.",
              cta: "Built for SaaS" },
            { title: "Lead Gen Companies", href: "/for/lead-gen",
              desc: "Capture high-intent leads, score them with AI, and sell through the marketplace. Temperature-based pricing: $25–500 per lead.",
              cta: "Built for lead gen" },
            { title: "Consultants", href: "/for/consultants",
              desc: "Implement the system for clients and charge $5K–25K setup + monthly retainer. Your clients get a portal; you get recurring revenue.",
              cta: "Built for consultants" },
            { title: "Franchise Operators", href: "/for/franchises",
              desc: "One dashboard for every location. Centralized lead routing, brand compliance, and performance benchmarking across 50+ territories.",
              cta: "Built for franchises" },
          ].map(({ title, href, desc, cta }) => (
            <article key={title} className="panel" style={{ display: "grid", gap: 12, alignContent: "start" }}>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p className="muted" style={{ fontSize: "0.92rem" }}>{desc}</p>
              <Link href={href} className="secondary" style={{ width: "fit-content", minHeight: 40, padding: "8px 16px" }}>
                {cta} &rarr;
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Industries ──────────────────────────────────────────────── */}
      <section className="panel" style={{ textAlign: "center" }}>
        <p className="eyebrow">Works for any niche</p>
        <h2>16 industries pre-configured. Any niche auto-generated.</h2>
        <p className="muted" style={{ maxWidth: 520, margin: "8px auto 20px" }}>
          Type &ldquo;plumbing&rdquo; or &ldquo;immigration law&rdquo; or &ldquo;mobile dog grooming&rdquo; — the system
          generates scoring, assessments, nurture emails, and landing pages automatically.
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20,
        }}>
          {["Legal", "Healthcare", "Construction", "Real Estate", "Technology", "Education",
            "Finance", "Franchise", "Staffing", "Home Services", "Creative", "Church",
          ].map((ind) => (
            <span key={ind} style={{
              padding: "6px 14px", borderRadius: 999, background: "var(--secondary-soft)",
              fontSize: "0.84rem", fontWeight: 600, color: "var(--secondary)",
            }}>{ind}</span>
          ))}
          <span style={{
            padding: "6px 14px", borderRadius: 999, background: "var(--accent-soft)",
            fontSize: "0.84rem", fontWeight: 700, color: "var(--accent)",
          }}>+ any custom niche</span>
        </div>
        <Link href="/industries" className="secondary">Browse all industries &rarr;</Link>
      </section>

      {/* ── Enterprise Grade ────────────────────────────────────────── */}
      <section>
        <p className="eyebrow">Enterprise-grade from day one</p>
        <h2>Security, compliance, and reliability you can sell to any client</h2>
        <div className="grid three" style={{ marginTop: 16 }}>
          {[
            { title: "SOC 2 Controls", desc: "Persistent audit trail, access reviews, encryption verification, data retention policies." },
            { title: "2FA + SSO", desc: "TOTP authentication, SAML/OIDC single sign-on, IP allowlisting, backup codes." },
            { title: "99.9% SLA", desc: "Deep health checks, status page, incident response runbook, Kubernetes-ready deployment." },
            { title: "5 RBAC Roles", desc: "Owner, admin, operator, viewer, billing-admin — each with granular permissions." },
            { title: "OpenAPI 3.1", desc: "Full API documentation at /api/docs/openapi.json. 315+ endpoints." },
            { title: "4,151 Tests", desc: "Zero failures. Multi-tenant stress test with 50 concurrent tenants. E2E pipeline verified." },
          ].map(({ title, desc }) => (
            <article key={title} className="panel" style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.94rem" }}>{title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.84rem" }}>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Joy Layer ───────────────────────────────────────────────── */}
      <section className="panel" style={{ borderLeft: "4px solid var(--accent)", background: "var(--accent-soft)" }}>
        <p className="eyebrow">The Joy Layer</p>
        <h2>The system works while you sleep</h2>
        <p className="muted" style={{ maxWidth: 560, marginBottom: 16 }}>
          Morning briefings, autonomous lead recovery, milestone celebrations, and a dashboard
          that tells you exactly how many hours you got back this week.
        </p>
        <div className="grid two">
          <div>
            <h3 style={{ fontSize: "0.94rem", margin: "0 0 8px" }}>What happens overnight</h3>
            <ul className="check-list" style={{ fontSize: "0.88rem" }}>
              <li>Churn prevention — disengaged leads auto re-engaged</li>
              <li>Warm leads going cold — next nurture step sent</li>
              <li>Pipeline thin — prospecting activated</li>
              <li>Scope overrun detected — change order drafted</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "0.94rem", margin: "0 0 8px" }}>What you see in the morning</h3>
            <ul className="check-list" style={{ fontSize: "0.88rem" }}>
              <li>&ldquo;3 new leads came in while you slept&rdquo;</li>
              <li>&ldquo;23.4 hours saved this month — worth $3,510&rdquo;</li>
              <li>&ldquo;Nothing needs your attention. Go enjoy your coffee.&rdquo;</li>
              <li>One recommended action for the day</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Lead Capture ────────────────────────────────────────────── */}
      <AdaptiveLeadCaptureForm
        source="contact_form"
        family={profile.family}
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath="/"
        returning={asBoolean(params.returning)}
        profile={profile}
      />

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="panel" style={{ textAlign: "center", marginTop: 32 }}>
        <p className="eyebrow">Ready to replace your tool stack?</p>
        <h2>Start capturing leads in minutes</h2>
        <p className="muted" style={{ maxWidth: 480, margin: "8px auto 20px" }}>
          No credit card. No sales call. Pick a plan that fits your business and
          set up your first funnel in under 10 minutes.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <Link href="/onboard" className="primary">Get started free</Link>
          <Link href="/pricing" className="secondary">View pricing</Link>
        </div>
      </section>
    </main>
  );
}
