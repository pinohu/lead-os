import Link from "next/link";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import { getDocumentJobs, getLeadRecord, type DocumentJobRecord } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export default async function DocumentJobsPage() {
  await requireOperatorPageSession("/dashboard/documents");
  const jobs = (await getDocumentJobs()) as DocumentJobRecord[];
  const jobsWithLead = await Promise.all(
    jobs.map(async (job) => ({
      job,
      lead: await getLeadRecord(job.leadKey),
    })),
  );

  return (
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document queue</p>
          <h1>{tenantConfig.brandName} document jobs</h1>
          <p className="text-lg text-foreground">
            Monitor proposal, agreement, and onboarding document generation so operators can spot
            template gaps before they cost momentum.
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
          <ul className="journey-rail">
            <li>
              <strong>Total jobs</strong>
              <span>{jobs.length}</span>
            </li>
            <li>
              <strong>Generated</strong>
              <span>{jobs.filter((job) => job.status === "generated").length}</span>
            </li>
            <li>
              <strong>Prepared</strong>
              <span>{jobs.filter((job) => job.status === "prepared").length}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="stack-grid">
        {jobsWithLead.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No document jobs have been recorded yet.</p>
          </article>
        ) : (
          jobsWithLead.map(({ job, lead }) => (
            <article key={job.id} className="stack-card">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{job.provider}</p>
              <h2>{job.status}</h2>
              <p className="text-muted-foreground">{job.detail}</p>
              <p className="text-muted-foreground">
                Lead: {job.leadKey}
                {lead ? ` | Family: ${lead.family} | Stage: ${lead.stage}` : ""}
              </p>
              <p className="text-muted-foreground">Updated: {job.updatedAt}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/dashboard/leads/${encodeURIComponent(job.leadKey)}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Open lead detail
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
