import Link from "next/link";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import {
  getLeadRecord,
  getWorkflowRegistryRecords,
  getWorkflowRuns,
  type WorkflowRunRecord,
} from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export default async function WorkflowRunsPage() {
  await requireOperatorPageSession("/dashboard/workflows");
  const runs = (await getWorkflowRuns()) as WorkflowRunRecord[];
  const registry = await getWorkflowRegistryRecords();
  const runsWithLead = await Promise.all(
    runs.map(async (run) => ({
      run,
      lead: run.leadKey ? await getLeadRecord(run.leadKey) : undefined,
    })),
  );

  return (
    <div className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workflow history</p>
          <h1 className="text-foreground">{tenantConfig.brandName} workflow runs</h1>
          <p className="text-lg text-foreground">
            This view shows which runtime emissions reached n8n or related workflow providers and
            where operators may need to inspect downstream automations.
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Queue summary</p>
          <ul className="space-y-3 mt-4">
            <li>
              <strong>Total runs</strong>
              <span>{runs.length}</span>
            </li>
            <li>
              <strong>Live</strong>
              <span>{runs.filter((run) => run.mode === "live").length}</span>
            </li>
            <li>
              <strong>Failed</strong>
              <span>{runs.filter((run) => !run.ok).length}</span>
            </li>
            <li>
              <strong>Provisioned starters</strong>
              <span>{registry.length}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="stack-grid">
        {registry.length === 0 ? null : registry.map((workflow) => (
          <article key={workflow.slug} className="stack-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Starter workflow</p>
            <h2 className="text-foreground">{workflow.workflowName}</h2>
            <p className="text-muted-foreground">
              Status: {workflow.status} | Active: {workflow.active ? "yes" : "no"}
            </p>
            <p className="text-muted-foreground">
              Manifest: {workflow.manifestVersion.slice(0, 12)} | Hash: {workflow.manifestHash.slice(0, 12)}
            </p>
            <p className="text-muted-foreground">
              Last provisioned: {workflow.lastProvisionedAt}
            </p>
            {workflow.detail ? <p className="text-muted-foreground">{workflow.detail}</p> : null}
          </article>
        ))}
      </section>

      <section className="stack-grid">
        {runsWithLead.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No workflow runs have been recorded yet.</p>
          </article>
        ) : (
          runsWithLead.map(({ run, lead }) => (
            <article key={run.id} className="stack-card">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{run.provider}</p>
              <h2 className="text-foreground">{run.eventName}</h2>
              <p className="text-muted-foreground">{run.detail}</p>
              <p className="text-muted-foreground">
                Mode: {run.mode} | Success: {run.ok ? "yes" : "no"}
              </p>
              <p className="text-muted-foreground">
                Lead: {run.leadKey ?? "not tied to a lead"}
                {lead ? ` | Family: ${lead.family}` : ""}
              </p>
              <p className="text-muted-foreground">Created: {run.createdAt}</p>
              {run.leadKey ? (
                <div className="flex flex-wrap gap-3">
                  <Link href={`/dashboard/leads/${encodeURIComponent(run.leadKey)}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Open lead detail
                  </Link>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
