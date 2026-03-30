import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";

const brandName = tenantConfig.brandName || "Lead OS";

export const metadata: Metadata = {
  title: `${brandName} | Run All Your Clients From One Dashboard`,
  description: "White-label lead capture, AI scoring, and multi-channel nurture for every client. One platform, one login, one bill. Built for digital marketing agencies.",
  openGraph: {
    title: `${brandName} — Built for Agencies Managing Multiple Clients`,
    description: "Replace 8+ SaaS tools per client. White-label lead capture, AI scoring, and multi-channel nurture from one dashboard.",
    images: [{ url: buildOgImageUrl(brandName, "Run all your clients from one dashboard"), width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return (
    <main className="experience-page" data-theme="light" style={{ colorScheme: "light" }}>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        textAlign: "center",
        padding: "100px 24px 80px",
        background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(79, 70, 229, 0.08) 0%, transparent 70%)",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px 5px 6px", borderRadius: 999,
            background: "var(--accent-soft)", border: "1px solid var(--accent-glow)",
            fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)",
            marginBottom: 28,
          }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
            Built for agencies managing multiple clients
          </div>
          <h1 style={{ color: "var(--text)" }}>
            Run all your clients from one dashboard.<br />
            Cancel the other 8 tools.
          </h1>
          <p style={{ fontSize: "1.12rem", color: "var(--text-soft)", maxWidth: 580, margin: "16px auto 0", lineHeight: 1.7 }}>
            White-label lead capture, AI scoring, and multi-channel nurture for every client.
            One platform, one login, one bill.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36 }}>
            <Link href="/onboard" className="primary" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>Start your free agency account</Link>
            <Link href="#how-it-works" className="secondary" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>See how it works</Link>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", marginTop: 14, letterSpacing: "0.01em" }}>
            No credit card &middot; 15-minute setup &middot; White-label ready
          </p>
        </div>
      </section>

      {/* ── The Agency Problem ──────────────────────────────────────── */}
      <section className="panel" aria-labelledby="problem-heading">
        <p className="eyebrow">The agency problem</p>
        <h2 id="problem-heading" style={{ maxWidth: 600 }}>
          You&apos;re paying $630&ndash;$4,550/month in SaaS fees per client
        </h2>
        <p className="muted" style={{ maxWidth: 600, marginBottom: 20, fontSize: "0.95rem", lineHeight: 1.7 }}>
          You&apos;re spending 20+ hours a week on manual reporting. And your clients
          are still asking &ldquo;what are we getting for this?&rdquo;
        </p>
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
          <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>$630&ndash;4,550/month per client</span>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="panel" id="how-it-works">
        <p className="eyebrow">How it works</p>
        <h2>Four steps from zero to automated agency</h2>
        <ol style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, paddingLeft: 0, listStyle: "none", marginTop: 24,
        }}>
          {[
            { n: "1", title: "Add a client", desc: "Type their niche. The system generates scoring weights, assessment questions, nurture sequences, and landing pages automatically." },
            { n: "2", title: "Launch their funnel", desc: "Embed one script tag or use our white-label landing pages. Leads flow in from forms, chat, assessments, and calculators." },
            { n: "3", title: "Leads score automatically", desc: "4D scoring (intent + fit + engagement + urgency) classifies every lead. You focus on client calls, not spreadsheets." },
            { n: "4", title: "Report and scale", desc: "Automated client reports prove your value. Add niches. Grow your book of business without adding headcount." },
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

      {/* ── Social Proof (Agency-Focused) ──────────────────────────── */}
      <section style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center",
        gap: "48px", padding: "40px 24px",
        borderBottom: "1px solid var(--surface-border)",
      }}>
        {[
          { stat: "16", label: "Niches pre-configured", detail: "Deploy for plumbers, lawyers, dentists — any niche" },
          { stat: "84", label: "AI personas", detail: "Every client gets a unique brand voice" },
          { stat: "91", label: "Nurture emails", detail: "7-stage sequences for every industry, written and ready" },
          { stat: "4", label: "Revenue models", detail: "Managed, white-label, marketplace, or retainer" },
        ].map(({ stat, label, detail }) => (
          <div key={label} style={{ textAlign: "center", maxWidth: 200 }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)" }}>{stat}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-soft)", fontWeight: 500, marginTop: 2 }}>{label}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-soft)", marginTop: 4, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
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
        <h2>Your morning briefing tells you which clients need attention</h2>
        <p className="muted" style={{ maxWidth: 560, marginBottom: 16 }}>
          Wake up to a dashboard that shows which clients are on autopilot
          and which need a nudge. No more logging into 8 tools to figure out
          what happened overnight.
        </p>
        <div className="grid two">
          <div>
            <h3 style={{ fontSize: "0.94rem", margin: "0 0 8px" }}>What happens overnight</h3>
            <ul className="check-list" style={{ fontSize: "0.88rem" }}>
              <li>Churn prevention — disengaged leads auto re-engaged across all clients</li>
              <li>Warm leads going cold — next nurture step sent per client playbook</li>
              <li>Pipeline thin for a client — prospecting activated</li>
              <li>Client report auto-generated with key metrics</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "0.94rem", margin: "0 0 8px" }}>What you see in the morning</h3>
            <ul className="check-list" style={{ fontSize: "0.88rem" }}>
              <li>&ldquo;12 new leads came in across 6 clients while you slept&rdquo;</li>
              <li>&ldquo;23.4 hours saved this month — worth $3,510&rdquo;</li>
              <li>&ldquo;2 clients need attention. 13 are on autopilot.&rdquo;</li>
              <li>One recommended action per client for the day</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Simple Email Capture ─────────────────────────────────────── */}
      <section className="panel" style={{ textAlign: "center", padding: "40px 28px" }}>
        <p className="eyebrow">Get early access</p>
        <h2>See it in action with your first client</h2>
        <p className="muted" style={{ maxWidth: 480, margin: "8px auto 24px" }}>
          Enter your email and we&apos;ll set up a demo workspace
          pre-loaded with your niche.
        </p>
        <form
          action="/api/capture"
          method="POST"
          style={{
            display: "flex", gap: 10, justifyContent: "center",
            flexWrap: "wrap", maxWidth: 480, margin: "0 auto",
          }}
        >
          <input type="hidden" name="source" value="homepage" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@agency.com"
            aria-label="Email address"
            style={{
              flex: "1 1 240px", minHeight: 48, padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
              fontSize: "0.95rem",
            }}
          />
          <button type="submit" className="primary" style={{ minHeight: 48, padding: "12px 24px" }}>
            Start free
          </button>
        </form>
      </section>

      {/* ── Not an Agency? ──────────────────────────────────────────── */}
      <section style={{ padding: "32px 0" }}>
        <p className="muted" style={{ textAlign: "center", marginBottom: 16, fontSize: "0.88rem" }}>Not an agency?</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {[
            { label: "SaaS Founders", href: "/for/saas-founders" },
            { label: "Lead Gen Companies", href: "/for/lead-gen" },
            { label: "Consultants", href: "/for/consultants" },
            { label: "Franchise Operators", href: "/for/franchises" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--surface-border)", fontSize: "0.88rem",
              fontWeight: 600, color: "var(--text)",
            }}>
              {label} <span style={{ color: "var(--accent)" }}>&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="panel" style={{ textAlign: "center", marginTop: 32 }}>
        <h2>Start your free agency account</h2>
        <p className="muted" style={{ maxWidth: 480, margin: "8px auto 20px" }}>
          No credit card. No sales call. Add your first client in 15 minutes
          and see why agencies are consolidating their entire stack into one platform.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <Link href="/onboard" className="primary">Start your free agency account</Link>
          <Link href="/pricing" className="secondary">View pricing</Link>
        </div>
      </section>
    </main>
  );
}
