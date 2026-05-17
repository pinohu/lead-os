// ── Admin Cities Dashboard ────────────────────────────────────────────
// Shows all cities in the registry, their validation status, ZIP
// overlaps, and expansion readiness.

import { getAllCities, type CityConfig } from "@/lib/city-registry";
import { cityConfig } from "@/lib/city-config";
import { niches } from "@/lib/niches";
import {
  evaluateRegistryHealth,
  type CityValidationResult,
  type ZipOverlap,
} from "@/lib/city-helpers";

export const dynamic = "force-dynamic";

export default function CitiesPage() {
  const cities = getAllCities();
  const totalNiches = niches.length;
  const health = evaluateRegistryHealth(cities);
  const resultsBySlug = new Map(health.perCity.map((r) => [r.city, r]));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">City Network</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {cities.length} city(ies) registered &middot; {totalNiches} niches &times; 15 page types ={" "}
          {totalNiches * 15} pages per city
        </p>
      </div>

      {/* Registry-wide health */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Registry Health
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Cities" value={health.totalCities} tone="neutral" />
          <Stat
            label="With errors"
            value={health.citiesWithErrors}
            tone={health.citiesWithErrors === 0 ? "success" : "danger"}
          />
          <Stat
            label="With warnings"
            value={health.citiesWithWarnings}
            tone={health.citiesWithWarnings === 0 ? "success" : "warning"}
          />
          <Stat
            label="Coverage overlaps"
            value={health.coverageOverlaps.length}
            tone={health.coverageOverlaps.length === 0 ? "success" : "warning"}
          />
        </div>

        {health.conflicts.length > 0 && (
          <div className="mt-4 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              🚨 Registry conflicts
            </p>
            <ul className="mt-1 text-sm text-red-800 dark:text-red-300 list-disc list-inside">
              {health.conflicts.map((c, i) => (
                <li key={i}>
                  {c.type === "duplicate_slug"
                    ? `Duplicate slug "${c.value}"`
                    : `Duplicate domain "${c.value}"`}{" "}
                  → {c.cities.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {health.coverageOverlaps.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              ZIP coverage overlaps ({health.coverageOverlaps.length}) — review intentionality
            </summary>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
              {health.coverageOverlaps.map((o: ZipOverlap) => (
                <li key={o.zip}>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{o.zip}</code>{" "}
                  → {o.cities.join(", ")}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* City cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <CityCard
            key={city.slug}
            city={city}
            isCurrent={city.slug === cityConfig.slug}
            nicheCount={totalNiches}
            validation={resultsBySlug.get(city.slug)}
          />
        ))}

        {/* Expansion placeholder */}
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-2xl mb-2">+</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Add New City</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Edit{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">city-registry.ts</code>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Expansion Checklist
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
          <li>
            Add city config to{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              src/lib/city-registry.ts
            </code>
          </li>
          <li>
            Run{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              npx tsx src/scripts/expansion-readiness.ts &lt;slug&gt;
            </code>{" "}
            to validate (uses the same checks shown above)
          </li>
          <li>Register domain and point DNS to Vercel</li>
          <li>
            Create new Vercel project with{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              CITY_SLUG=&lt;slug&gt;
            </code>
          </li>
          <li>
            Provision database and run{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              npx prisma migrate deploy
            </code>
          </li>
          <li>
            Run{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              npx tsx src/scripts/stripe-setup.ts
            </code>{" "}
            for Stripe products
          </li>
          <li>Deploy and verify all {totalNiches * 15} pages render correctly</li>
        </ol>
      </div>
    </div>
  );
}

function CityCard({
  city,
  isCurrent,
  nicheCount,
  validation,
}: {
  city: CityConfig;
  isCurrent: boolean;
  nicheCount: number;
  validation: CityValidationResult | undefined;
}) {
  const errorCount = validation?.issues.filter((i) => i.severity === "error").length ?? 0;
  const warnCount = validation?.issues.filter((i) => i.severity === "warning").length ?? 0;

  return (
    <div
      className={`rounded-lg border p-6 ${
        isCurrent
          ? "border-blue-500 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {city.name}, {city.stateCode}
        </h3>
        <div className="flex items-center gap-1">
          {isCurrent && (
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400">
              Active
            </span>
          )}
          {errorCount > 0 ? (
            <span
              className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-400"
              title={validation!.issues
                .filter((i) => i.severity === "error")
                .map((i) => `${i.field}: ${i.message}`)
                .join("\n")}
            >
              {errorCount} error{errorCount === 1 ? "" : "s"}
            </span>
          ) : warnCount > 0 ? (
            <span
              className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-400"
              title={validation!.issues
                .filter((i) => i.severity === "warning")
                .map((i) => `${i.field}: ${i.message}`)
                .join("\n")}
            >
              {warnCount} warning{warnCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-400">
              ✓ Valid
            </span>
          )}
        </div>
      </div>

      <dl className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <dt>Domain</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{city.domain}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Population</dt>
          <dd>{city.population.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Service Areas</dt>
          <dd>{city.serviceArea.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Coverage ZIPs</dt>
          <dd>{(city.coverageZips ?? []).length}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Total Pages</dt>
          <dd>{nicheCount * 15}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Price Multiplier</dt>
          <dd>{city.pricingMultiplier}x</dd>
        </div>
      </dl>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
    success: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900",
    danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900",
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${toneClasses[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
