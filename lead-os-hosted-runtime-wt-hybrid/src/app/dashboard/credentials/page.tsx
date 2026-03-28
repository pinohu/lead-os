import Link from "next/link";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import {
  getAvailableProviders,
  listCredentials,
  getEnabledCapabilities,
  type ProviderDefinition,
  type CredentialPublic,
} from "@/lib/credentials-vault";
import { tenantConfig } from "@/lib/tenant";

function groupByCategory(providers: ProviderDefinition[]): Record<string, ProviderDefinition[]> {
  const grouped: Record<string, ProviderDefinition[]> = {};
  for (const p of providers) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }
  return grouped;
}

function isConnected(provider: string, credentials: CredentialPublic[]): CredentialPublic | undefined {
  return credentials.find((c) => c.provider === provider && c.status === "active");
}

const CATEGORY_LABELS: Record<string, string> = {
  deployment: "Deployment",
  communication: "Communication",
  billing: "Billing",
  ai: "AI & Intelligence",
  crm: "CRM",
  scheduling: "Scheduling",
  documents: "Documents",
  growth: "Growth",
  alerts: "Alerts & Notifications",
  data: "Data & Storage",
  automation: "Automation",
  analytics: "Analytics",
  content: "Content & Media",
  marketing: "Marketing",
};

export default async function CredentialsPage() {
  await requireOperatorPageSession("/dashboard/credentials");
  const providers = getAvailableProviders();
  const credentials = listCredentials(tenantConfig.tenantId || "default");
  const capabilities = getEnabledCapabilities(tenantConfig.tenantId || "default");
  const grouped = groupByCategory(providers);

  const connectedCount = credentials.filter((c) => c.status === "active").length;

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Credentials vault</p>
          <h1>{tenantConfig.brandName} integrations</h1>
          <p className="lede">
            Connect your tools to unlock capabilities. Each provider enables specific
            features across the platform. Credentials are encrypted at rest with AES-256-GCM.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">
              Back to dashboard
            </Link>
            <Link href="/dashboard/providers" className="secondary">
              Provider health
            </Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Integration summary</p>
          <ul className="journey-rail">
            <li>
              <strong>Connected</strong>
              <span>{connectedCount} / {providers.length}</span>
            </li>
            <li>
              <strong>Capabilities</strong>
              <span>{capabilities.length} active</span>
            </li>
          </ul>
        </aside>
      </section>

      {capabilities.length > 0 ? (
        <section className="panel">
          <p className="eyebrow">Active capabilities</p>
          <h2>What is enabled</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {capabilities.map((cap) => (
              <span
                key={cap}
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(20, 184, 166, 0.12)",
                  color: "#0d9488",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryProviders]) => (
        <section key={category} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, paddingLeft: 24 }}>
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="stack-grid">
            {categoryProviders.map((provider) => {
              const cred = isConnected(provider.provider, credentials);
              return (
                <article key={provider.provider} className="stack-card">
                  <p className="eyebrow">{provider.provider.replace(/_/g, " ")}</p>
                  <h2 style={{ fontSize: "1rem" }}>
                    {cred ? (
                      <span style={{ color: "#059669" }}>Connected</span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>Not connected</span>
                    )}
                  </h2>
                  <p className="muted">
                    Enables: {provider.enables.join(", ")}
                  </p>
                  <p className="muted">
                    Required: {provider.fields.join(", ")}
                  </p>
                  {cred?.lastVerified ? (
                    <p className="muted">
                      Last verified: {new Date(cred.lastVerified).toLocaleDateString()}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
