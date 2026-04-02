import Link from "next/link";
import { getConfigStatusSummary } from "@/lib/config-status";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import { getAutomationHealth } from "@/lib/providers";
import { getRuntimePersistenceMode } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export default async function ProviderHealthPage() {
  await requireOperatorPageSession("/dashboard/providers");
  const health = getAutomationHealth();
  const persistenceMode = getRuntimePersistenceMode();
  const configSummary = getConfigStatusSummary();
  const providerEntries = Object.entries(health.providers)
    .sort(([left], [right]) => left.localeCompare(right));

  return (
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Provider health</p>
          <h1 className="text-foreground">{tenantConfig.brandName} integration readiness</h1>
          <p className="text-lg text-foreground">
            This view shows which providers are configured, which channels are live, and where the
            runtime can act without human cleanup.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Back to dashboard
            </Link>
            <Link href="/dashboard/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Runtime settings
            </Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Channel readiness</p>
          <p className="text-muted-foreground">Persistence: {persistenceMode}</p>
          <ul className="journey-rail">
            {Object.entries(health.channels).map(([channel, ready]) => (
              <li key={channel}>
                <strong>{channel}</strong>
                <span>{ready ? "Live" : "Unavailable"}</span>
              </li>
            ))}
            <li>
              <strong>Env-only ready</strong>
              <span>{configSummary.envOnlyReady ? "yes" : "no"}</span>
            </li>
            <li>
              <strong>Embedded secrets</strong>
              <span>{configSummary.embeddedSecretsEnabled ? "enabled" : "disabled"}</span>
            </li>
          </ul>
        </aside>
      </section>

      {!configSummary.envOnlyReady ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Config hardening</p>
          <h2 className="text-foreground">Embedded fallback still in use</h2>
          <p className="text-muted-foreground">
            The runtime is still depending on embedded fallback credentials for some providers.
            Production will be fully hardened only after those values are moved into Railway env
            vars and the embedded fallbacks are removed.
          </p>
          <ul className="space-y-2">
            {configSummary.embeddedFallbacks.map((provider) => (
              <li key={provider}>{provider}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="stack-grid">
        {providerEntries.map(([provider, status]) => (
          <article key={provider} className="stack-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{provider}</p>
            <h2 className="text-foreground">
              {status.status === "configured"
                ? "Configured"
                : status.status === "dry-run"
                ? "Configured / dry-run"
                : "Missing"}
            </h2>
            <p className="text-muted-foreground">{status.live ? "Live" : "Prepared"}</p>
            <p className="text-muted-foreground">{status.owner}</p>
            {(() => {
              const config = configSummary.providers.find((entry) => entry.key === provider);
              if (!config) return null;
              return (
                <>
                  <p className="text-muted-foreground">Credential source: {config.source}</p>
                  {config.notes ? <p className="text-muted-foreground">{config.notes}</p> : null}
                </>
              );
            })()}
          </article>
        ))}
      </section>
    </main>
  );
}
