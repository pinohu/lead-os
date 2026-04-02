// ── Admin Cities Dashboard ────────────────────────────────────────────
// Shows all cities in the registry, their status, and expansion readiness.

import { getAllCities, type CityConfig } from "@/lib/city-registry";
import { cityConfig } from "@/lib/city-config";
import { niches } from "@/lib/niches";

export const dynamic = "force-dynamic";

export default function CitiesPage() {
  const cities = getAllCities();
  const totalNiches = niches.length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">City Network</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {cities.length} city(ies) registered &middot; {totalNiches} niches &times; 15 page types = {totalNiches * 15} pages per city
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <CityCard
            key={city.slug}
            city={city}
            isCurrent={city.slug === cityConfig.slug}
            nicheCount={totalNiches}
          />
        ))}

        {/* Expansion placeholder */}
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-2xl mb-2">+</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Add New City</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Edit <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">city-registry.ts</code>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expansion Checklist</h2>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
          <li>Add city config to <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">src/lib/city-registry.ts</code></li>
          <li>Run <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">npx tsx src/scripts/expansion-readiness.ts &lt;slug&gt;</code> to validate</li>
          <li>Register domain and point DNS to Vercel</li>
          <li>Create new Vercel project with <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">CITY_SLUG=&lt;slug&gt;</code></li>
          <li>Provision database and run <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">npx prisma migrate deploy</code></li>
          <li>Run <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">npx tsx src/scripts/stripe-setup.ts</code> for Stripe products</li>
          <li>Deploy and verify all {totalNiches * 15} pages render correctly</li>
        </ol>
      </div>
    </div>
  );
}

function CityCard({ city, isCurrent, nicheCount }: { city: CityConfig; isCurrent: boolean; nicheCount: number }) {
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
        {isCurrent && (
          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400">
            Active
          </span>
        )}
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
