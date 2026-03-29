import { headers } from "next/headers";
import Link from "next/link";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { EXPERIENCE_HEURISTICS, resolveExperienceProfile } from "@/lib/experience";
import { getNiche } from "@/lib/catalog";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { buildDefaultFunnelGraphs } from "@/lib/funnel-library";
import { getAutomationHealth } from "@/lib/providers";
import type { FunnelFamily } from "@/lib/runtime-schema";
import { getCanonicalEvents, getLeadRecords } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

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
