import { siteConfig, serverSiteConfig } from "@/lib/site-config";
import { getBlueOceanServices, getCoreServices } from "@/lib/services";
import { FUNNEL_BLUEPRINTS } from "@/lib/funnel-blueprints";
import { clientPresets } from "@/lib/client-presets";
import { tenantPresets } from "@/lib/tenant-presets";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 text-sm text-slate-300">{children}</div>
    </section>
  );
}

export default function ControlCenterPage() {
  const coreServices = getCoreServices();
  const blueOceanServices = getBlueOceanServices();
  const blueprintNames = Object.keys(FUNNEL_BLUEPRINTS).sort();

  return (
    <main className="min-h-screen bg-navy px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan">Lead OS Control Center</p>
          <h1 className="mt-4 text-5xl font-bold">Operator view of the current platform state</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            This page is the admin and productization surface for the current repo. It shows the active tenant preset,
            the service catalog, and the blueprint families the orchestrator can route into.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Active Tenant">
            <div className="space-y-2">
              <div><strong>Preset ID:</strong> {siteConfig.presetId}</div>
              <div><strong>Brand:</strong> {siteConfig.brandName}</div>
              <div><strong>Legal Name:</strong> {siteConfig.legalName}</div>
              <div><strong>Tenant Tag:</strong> {serverSiteConfig.tenantSlug}</div>
              <div><strong>Site URL:</strong> {siteConfig.siteUrl}</div>
              <div><strong>Support Email:</strong> {siteConfig.supportEmail}</div>
              <div><strong>Portal URL:</strong> {siteConfig.portalUrl}</div>
            </div>
          </Panel>

          <Panel title="Preset Library">
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4 text-sm">
                <div className="font-semibold text-white">Push-button bootstrap</div>
                <div className="mt-2 font-mono text-xs text-cyan">
                  npm run bootstrap-client -- --preset professional-services --tenant acme
                </div>
              </div>
              {Object.values(clientPresets).map((preset) => (
                <div key={preset.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="font-semibold text-white">{preset.brandName}</div>
                  <div className="mt-2 text-xs uppercase tracking-wider text-slate-400">{preset.id}</div>
                  <div className="mt-2"><strong>Enabled services:</strong> {preset.enabledServices.length}</div>
                </div>
              ))}
              {tenantPresets.map((preset) => (
                <div key={preset.key} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="font-semibold text-white">{preset.brandName}</div>
                  <div className="mt-2">{preset.primaryUseCase}</div>
                  <div className="mt-2"><strong>Intake bias:</strong> {preset.intakeBias.join(", ")}</div>
                  <div className="mt-1"><strong>Best-fit funnels:</strong> {preset.bestFitFunnels.join(", ")}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Service Catalog">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 font-semibold text-white">Core Services ({coreServices.length})</div>
                <ul className="space-y-1">
                  {coreServices.map((service) => (
                    <li key={service.slug}>{service.title}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 font-semibold text-white">Blue Ocean Services ({blueOceanServices.length})</div>
                <ul className="space-y-1">
                  {blueOceanServices.map((service) => (
                    <li key={service.slug}>{service.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel title="Blueprint Families">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {blueprintNames.map((name) => (
                <div key={name} className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                  {name}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
