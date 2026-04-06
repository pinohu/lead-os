"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CreativeArtifact {
  type: string;
  name: string;
  content: string;
  format: string;
}

interface CreativeJob {
  id: string;
  tenantId: string;
  type: string;
  schedule: string;
  status: "active" | "paused";
  lastRunAt?: string;
  nextRunAt?: string;
  lastOutput?: { artifactCount: number; generatedAt: string };
  createdAt: string;
  updatedAt: string;
}

interface CreativeOutput {
  jobId: string;
  type: string;
  artifacts: CreativeArtifact[];
  generatedAt: string;
}

interface JobTypeOption {
  type: string;
  name: string;
  description: string;
  defaultSchedule: string;
}

const JOB_TYPE_OPTIONS: JobTypeOption[] = [
  { type: "weekly-video-recap", name: "Weekly Video Recap", description: "Generate weekly performance recap video script", defaultSchedule: "weekly" },
  { type: "daily-metrics-video", name: "Daily Metrics Video", description: "Generate daily metrics video with animated charts", defaultSchedule: "daily" },
  { type: "landing-page-refresh", name: "Landing Page Refresh", description: "Regenerate landing page blocks", defaultSchedule: "monthly" },
  { type: "email-sequence-update", name: "Email Sequence Update", description: "Analyze and improve nurture sequences", defaultSchedule: "weekly" },
  { type: "design-system-sync", name: "Design System Sync", description: "Export and sync design.md", defaultSchedule: "weekly" },
  { type: "marketing-gallery-update", name: "Marketing Gallery Update", description: "Generate fresh marketing assets", defaultSchedule: "monthly" },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(status: "active" | "paused"): string {
  return status === "active"
    ? "bg-teal-500/15 text-teal-500"
    : "bg-muted text-muted-foreground";
}

const DEMO_JOBS: CreativeJob[] = [
  { id: "job-demo-001", tenantId: "demo", type: "weekly-video-recap", schedule: "weekly", status: "active", lastRunAt: "2026-03-24T08:00:00Z", nextRunAt: "2026-03-31T08:00:00Z", lastOutput: { artifactCount: 3, generatedAt: "2026-03-24T08:05:00Z" }, createdAt: "2026-01-10T09:00:00Z", updatedAt: "2026-03-24T08:05:00Z" },
  { id: "job-demo-002", tenantId: "demo", type: "email-sequence-update", schedule: "weekly", status: "active", lastRunAt: "2026-03-25T10:00:00Z", nextRunAt: "2026-04-01T10:00:00Z", lastOutput: { artifactCount: 5, generatedAt: "2026-03-25T10:12:00Z" }, createdAt: "2026-01-15T09:00:00Z", updatedAt: "2026-03-25T10:12:00Z" },
  { id: "job-demo-003", tenantId: "demo", type: "landing-page-refresh", schedule: "monthly", status: "paused", lastRunAt: "2026-03-01T09:00:00Z", nextRunAt: undefined, lastOutput: { artifactCount: 4, generatedAt: "2026-03-01T09:08:00Z" }, createdAt: "2026-01-20T09:00:00Z", updatedAt: "2026-03-01T09:08:00Z" },
];

export default function CreativePipelinePageClient() {
  const [jobs, setJobs] = useState<CreativeJob[]>([]);
  const [recentOutputs, setRecentOutputs] = useState<Map<string, CreativeOutput>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<CreativeArtifact | null>(null);

  const tenantId = "default";

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch(`/api/creative/jobs?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("not-ok");
      const json = await res.json();
      if (json.error || !json.data?.length) {
        setJobs(DEMO_JOBS);
        setIsDemo(true);
      } else {
        setJobs(json.data);
      }
    } catch {
      setJobs(DEMO_JOBS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunJob(jobId: string) {
    setRunningJobs((prev) => new Set(prev).add(jobId));
    try {
      const res = await fetch(`/api/creative/jobs/${jobId}/run`, { method: "POST" });
      const json = await res.json();
      if (json.data) {
        setRecentOutputs((prev) => {
          const next = new Map(prev);
          next.set(jobId, json.data);
          return next;
        });
      }
      await fetchJobs();
    } catch {
      setError("Failed to run job");
    } finally {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  async function handleToggleStatus(job: CreativeJob) {
    const newStatus = job.status === "active" ? "paused" : "active";
    try {
      await fetch(`/api/creative/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchJobs();
    } catch {
      setError("Failed to update job status");
    }
  }

  async function handleDeleteJob(jobId: string) {
    try {
      await fetch(`/api/creative/jobs/${jobId}`, { method: "DELETE" });
      await fetchJobs();
    } catch {
      setError("Failed to delete job");
    }
  }

  async function handleCreateJob(type: string, schedule: string) {
    try {
      const res = await fetch("/api/creative/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, type, schedule }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        setShowCreateForm(false);
        await fetchJobs();
      }
    } catch {
      setError("Failed to create job");
    }
  }

  function copyArtifactContent(content: string) {
    navigator.clipboard.writeText(content).catch(() => {
      setError("Failed to copy to clipboard");
    });
  }

  function downloadArtifact(artifact: CreativeArtifact) {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="max-w-[1180px] mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading creative pipelines...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-6 py-8">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200 mb-6">
          Demo jobs — Connect your tenant to manage live creative pipeline schedules.
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold m-0">Creative Pipelines</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Scheduled automation jobs that generate creative assets on a cadence.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground no-underline inline-flex items-center">
            Back to Dashboard
          </Link>
          <button type="button" className="px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-semibold bg-teal-500 text-white" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "New Job"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 border-l-[3px] border-l-red-500 p-6 shadow-sm mb-6"
        >
          <p className="text-red-500 m-0">{error}</p>
          <button type="button" className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground mt-2" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showCreateForm && (
        <section aria-label="Create new creative job" className="rounded-xl bg-card p-6 shadow-sm mb-6">
          <h2 className="text-foreground text-lg font-semibold mb-4">Create New Job</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {JOB_TYPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleCreateJob(option.type, option.defaultSchedule)}
                className="rounded-xl bg-card p-6 shadow-sm cursor-pointer border border-muted-foreground/30 text-left"
              >
                <div className="font-semibold mb-1">{option.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {option.description}
                </div>
                <span className="bg-indigo-500/15 text-indigo-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {option.defaultSchedule}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {jobs.length === 0 && !showCreateForm && (
        <div className="rounded-xl bg-card p-12 shadow-sm text-center">
          <p className="text-muted-foreground mb-4">
            No creative jobs yet. Create one to start generating assets automatically.
          </p>
          <button type="button" className="px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-semibold bg-teal-500 text-white" onClick={() => setShowCreateForm(true)}>
            Create Your First Job
          </button>
        </div>
      )}

      <section aria-label="Active creative jobs">
        {jobs.map((job) => {
          const isRunning = runningJobs.has(job.id);
          const output = recentOutputs.get(job.id);

          return (
            <article key={job.id} className="rounded-xl bg-card p-6 shadow-sm mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-foreground text-base font-semibold m-0">
                      {JOB_TYPE_OPTIONS.find((o) => o.type === job.type)?.name ?? job.type}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium ${getStatusBadgeClass(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="bg-indigo-500/15 text-indigo-500 px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium">
                      {job.schedule}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs m-0">
                    Last run: {formatDate(job.lastRunAt)} | Next run: {formatDate(job.nextRunAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-semibold bg-teal-500 text-white"
                    disabled={isRunning}
                    onClick={() => handleRunJob(job.id)}
                    aria-label={`Run ${job.type} now`}
                  >
                    {isRunning ? "Running..." : "Run Now"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground"
                    onClick={() => handleToggleStatus(job)}
                    aria-label={`${job.status === "active" ? "Pause" : "Resume"} ${job.type}`}
                  >
                    {job.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-red-500 cursor-pointer text-sm font-semibold bg-transparent text-red-500"
                    onClick={() => handleDeleteJob(job.id)}
                    aria-label={`Delete ${job.type}`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {output && (
                <div className="mt-4 border-t border-muted-foreground/30 pt-4">
                  <h4 className="text-foreground text-sm font-semibold mb-2">
                    Latest Output ({output.artifacts.length} artifact{output.artifacts.length !== 1 ? "s" : ""})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {output.artifacts.map((artifact, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 bg-black/20 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-sm">{artifact.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {artifact.type} ({artifact.format})
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg border border-muted-foreground/30 cursor-pointer text-xs font-semibold bg-transparent text-muted-foreground"
                            onClick={() => setPreviewArtifact(artifact)}
                            aria-label={`Preview ${artifact.name}`}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg border border-muted-foreground/30 cursor-pointer text-xs font-semibold bg-transparent text-muted-foreground"
                            onClick={() => copyArtifactContent(artifact.content)}
                            aria-label={`Copy ${artifact.name}`}
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg border border-muted-foreground/30 cursor-pointer text-xs font-semibold bg-transparent text-muted-foreground"
                            onClick={() => downloadArtifact(artifact)}
                            aria-label={`Download ${artifact.name}`}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {previewArtifact && (
        <div
          role="dialog"
          aria-label="Artifact preview"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-6"
          onClick={() => setPreviewArtifact(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setPreviewArtifact(null); }}
        >
          <div
            className="bg-card rounded-xl p-6 max-w-[900px] max-h-[80vh] w-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-foreground text-lg font-semibold m-0">{previewArtifact.name}</h2>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground"
                onClick={() => setPreviewArtifact(null)}
                aria-label="Close preview"
              >
                Close
              </button>
            </div>
            <pre className="bg-black/30 p-4 rounded-lg overflow-auto text-xs leading-relaxed whitespace-pre-wrap break-words">
              {previewArtifact.content}
            </pre>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-semibold bg-teal-500 text-white"
                onClick={() => copyArtifactContent(previewArtifact.content)}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground"
                onClick={() => downloadArtifact(previewArtifact)}
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
