// ── Admin Feature Flags Dashboard ─────────────────────────────────────
// Shows all feature flags and their current states.
// Flags are controlled via environment variables (FEATURE_<NAME>=true).

import { getAllFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default function FlagsPage() {
  const flags = getAllFlags();

  const grouped = {
    "Core Infrastructure": [] as [string, typeof flags[keyof typeof flags]][],
    "A/B Tests": [] as [string, typeof flags[keyof typeof flags]][],
    "Growth Features": [] as [string, typeof flags[keyof typeof flags]][],
  };

  for (const [key, value] of Object.entries(flags)) {
    if (key.startsWith("ab_")) {
      grouped["A/B Tests"].push([key, value]);
    } else if (value.phase >= 5) {
      grouped["Growth Features"].push([key, value]);
    } else {
      grouped["Core Infrastructure"].push([key, value]);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control via environment variables: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">FEATURE_FLAG_NAME=true</code>
        </p>
      </div>

      {Object.entries(grouped).map(([groupName, groupFlags]) => (
        <section key={groupName}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{groupName}</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Flag</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Phase</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {groupFlags.map(([key, value]) => (
                  <tr key={key}>
                    <td className="py-2 px-4 font-mono text-xs text-gray-900 dark:text-white">{key}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          value.enabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {value.enabled ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-500 dark:text-gray-400">P{value.phase}</td>
                    <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{value.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
