import type { Metadata } from "next";
import { GTM_USE_CASES } from "@/config/gtm-use-cases";
import { assertValidGtmConfig } from "@/lib/gtm/config-validation";
import { mergeGtmUseCasesWithStatus } from "@/lib/gtm/merge";
import { listGtmStatusRows } from "@/lib/gtm/store";
import { tenantConfig } from "@/lib/tenant";
import { GtmOperatorBoard } from "./GtmOperatorBoard";

export const metadata: Metadata = {
  title: "GTM execution — Lead OS",
  description: "Go-to-market use cases with persisted operator rollout status.",
};

export default async function GtmDashboardPage() {
  assertValidGtmConfig(GTM_USE_CASES);
  const rows = await listGtmStatusRows(tenantConfig.tenantId);
  const merged = mergeGtmUseCasesWithStatus(GTM_USE_CASES, rows);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operations</p>
        <h1 className="text-2xl font-bold tracking-tight">Go-to-market execution</h1>
        <p className="text-muted-foreground max-w-3xl mt-2">
          Canonical plays from <code className="text-xs">src/config/gtm-use-cases.ts</code> with operator
          status stored per tenant in Postgres. Update status as you move from planning to live rollout; audit
          entries are written on each save.
        </p>
      </div>

      <GtmOperatorBoard initialCases={merged} />
    </div>
  );
}
