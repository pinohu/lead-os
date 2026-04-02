import Link from "next/link";
import { requireOperatorPageSession } from "@/lib/operator-auth";
import { getBookingJobs, getLeadRecord, type BookingJobRecord } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export default async function BookingJobsPage() {
  await requireOperatorPageSession("/dashboard/bookings");
  const jobs = (await getBookingJobs()) as BookingJobRecord[];
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Booking queue</p>
          <h1>{tenantConfig.brandName} scheduling jobs</h1>
          <p className="text-lg text-foreground">
            Use this queue to monitor live Trafft availability lookups, booking handoffs, and the
            leads that are closest to a calendar commitment.
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
              <strong>Availability found</strong>
              <span>{jobs.filter((job) => job.status === "availability-found").length}</span>
            </li>
            <li>
              <strong>Ready for handoff</strong>
              <span>{jobs.filter((job) => job.status === "handoff-ready").length}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="stack-grid">
        {jobsWithLead.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No booking jobs have been recorded yet.</p>
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
