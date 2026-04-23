import Link from "next/link";
import { RuntimeConfigForm } from "@/components/RuntimeConfigForm";
import { discoverDocumenteroTemplates, discoverTrafftTenant } from "@/lib/provider-discovery";
import {
  buildRuntimeConfigSummary,
  getOperationalRuntimeConfig,
} from "@/lib/runtime-config";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import { tenantConfig } from "@/lib/tenant";

export default async function RuntimeSettingsPage() {
  await requireOperatorPageSession("/dashboard/settings");
  const [config, templateCatalog, trafftTenant] = await Promise.all([
    getOperationalRuntimeConfig(),
    discoverDocumenteroTemplates(),
    discoverTrafftTenant(),
  ]);
  const summary = buildRuntimeConfigSummary(config);

  return (
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Runtime settings</p>
          <h1 className="text-foreground">{tenantConfig.brandName} executable provider mappings</h1>
          <p className="text-lg text-foreground">
            This is the operator-facing layer for non-secret provider configuration. Template IDs,
            service IDs, and fallback URLs live here so the runtime can become more executable
            without another code deploy.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Back to dashboard
            </Link>
            <Link href="/dashboard/providers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Provider health
            </Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Coverage summary</p>
          <ul className="space-y-3 mt-4">
            <li>
              <strong>Trafft mappings</strong>
              <span>{summary.trafft.mappedServices}</span>
            </li>
            <li>
              <strong>Doc templates</strong>
              <span>
                {Number(summary.documentero.hasProposalTemplate) +
                  Number(summary.documentero.hasAgreementTemplate) +
                  Number(summary.documentero.hasOnboardingTemplate)}
              </span>
            </li>
            <li>
              <strong>Crove fallback</strong>
              <span>{summary.crove.hasWebhookUrl ? "Webhook ready" : "Needs webhook"}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documentero discovery</p>
          <h2 className="text-foreground">Available templates detected from the account API</h2>
          {templateCatalog.length === 0 ? (
            <p className="text-muted-foreground">No account templates were discovered yet. If you only see the sample template in Documentero, create your real proposal/agreement/onboarding templates there first.</p>
          ) : (
            <ul className="space-y-2">
              {templateCatalog.map((template) => (
                <li key={template.value}>
                  {template.label}: {template.value}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trafft discovery</p>
          <h2 className="text-foreground">Booking tenant visibility</h2>
          {trafftTenant ? (
            <ul className="space-y-2">
              <li>Tenant name: {trafftTenant.tenantName ?? "Unknown"}</li>
              <li>Tenant id: {trafftTenant.tenantId ?? "Unknown"}</li>
              <li>Note: service IDs still need to be mapped before CX React can auto-resolve public slot lookups consistently.</li>
            </ul>
          ) : (
            <p className="text-muted-foreground">Trafft tenant data could not be read from the runtime right now.</p>
          )}
        </article>
      </section>

      <RuntimeConfigForm initialConfig={config} />
    </main>
  );
}
