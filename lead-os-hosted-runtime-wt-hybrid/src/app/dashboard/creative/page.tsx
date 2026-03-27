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

function getStatusBadgeStyle(status: "active" | "paused"): { background: string; color: string } {
  return status === "active"
    ? { background: "var(--accent-soft, rgba(20, 184, 166, 0.15))", color: "var(--accent-strong, #14b8a6)" }
    : { background: "rgba(20, 33, 29, 0.08)", color: "var(--text-soft, #9ca3af)" };
}

function getScheduleBadgeStyle(): { background: string; color: string } {
  return { background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" };
}

export default function CreativePipelinePage() {
  const [jobs, setJobs] = useState<CreativeJob[]>([]);
  const [recentOutputs, setRecentOutputs] = useState<Map<string, CreativeOutput>>(new Map());
  const [loading, setLoading] = useState(true);
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
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        setJobs(json.data ?? []);
      }
    } catch {
      setError("Failed to load creative jobs");
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

  const cardStyle: React.CSSProperties = {
    background: "var(--surface, #111827)",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    marginBottom: 16,
  };

  const btnStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
  };

  const primaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "var(--accent, #14b8a6)",
    color: "#fff",
  };

  const ghostBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "transparent",
    color: "var(--text-soft, #9ca3af)",
    border: "1px solid var(--text-soft, #374151)",
  };

  const destructiveBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ color: "var(--text-soft, #9ca3af)" }}>Loading creative pipelines...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Creative Pipelines</h1>
          <p style={{ color: "var(--text-soft, #9ca3af)", marginTop: 4, fontSize: "0.875rem" }}>
            Scheduled automation jobs that generate creative assets on a cadence.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/dashboard" style={ghostBtnStyle}>
            Back to Dashboard
          </Link>
          <button type="button" style={primaryBtnStyle} onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "New Job"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{ ...cardStyle, background: "rgba(239, 68, 68, 0.1)", borderLeft: "3px solid #ef4444", marginBottom: 24 }}
        >
          <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
          <button type="button" style={{ ...ghostBtnStyle, marginTop: 8 }} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showCreateForm && (
        <section aria-label="Create new creative job" style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>Create New Job</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {JOB_TYPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleCreateJob(option.type, option.defaultSchedule)}
                style={{
                  ...cardStyle,
                  cursor: "pointer",
                  border: "1px solid var(--text-soft, #374151)",
                  textAlign: "left",
                  marginBottom: 0,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{option.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-soft, #9ca3af)", marginBottom: 8 }}>
                  {option.description}
                </div>
                <span style={{
                  ...getScheduleBadgeStyle(),
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}>
                  {option.defaultSchedule}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {jobs.length === 0 && !showCreateForm && (
        <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--text-soft, #9ca3af)", marginBottom: 16 }}>
            No creative jobs yet. Create one to start generating assets automatically.
          </p>
          <button type="button" style={primaryBtnStyle} onClick={() => setShowCreateForm(true)}>
            Create Your First Job
          </button>
        </div>
      )}

      <section aria-label="Active creative jobs">
        {jobs.map((job) => {
          const isRunning = runningJobs.has(job.id);
          const output = recentOutputs.get(job.id);
          const statusStyle = getStatusBadgeStyle(job.status);

          return (
            <article key={job.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                      {JOB_TYPE_OPTIONS.find((o) => o.type === job.type)?.name ?? job.type}
                    </h3>
                    <span style={{
                      ...statusStyle,
                      padding: "2px 10px",
                      borderRadius: 9999,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}>
                      {job.status}
                    </span>
                    <span style={{
                      ...getScheduleBadgeStyle(),
                      padding: "2px 10px",
                      borderRadius: 9999,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}>
                      {job.schedule}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-soft, #9ca3af)", fontSize: "0.8rem", margin: 0 }}>
                    Last run: {formatDate(job.lastRunAt)} | Next run: {formatDate(job.nextRunAt)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    style={primaryBtnStyle}
                    disabled={isRunning}
                    onClick={() => handleRunJob(job.id)}
                    aria-label={`Run ${job.type} now`}
                  >
                    {isRunning ? "Running..." : "Run Now"}
                  </button>
                  <button
                    type="button"
                    style={ghostBtnStyle}
                    onClick={() => handleToggleStatus(job)}
                    aria-label={`${job.status === "active" ? "Pause" : "Resume"} ${job.type}`}
                  >
                    {job.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    style={destructiveBtnStyle}
                    onClick={() => handleDeleteJob(job.id)}
                    aria-label={`Delete ${job.type}`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {output && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--text-soft, #374151)", paddingTop: 16 }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 8 }}>
                    Latest Output ({output.artifacts.length} artifact{output.artifacts.length !== 1 ? "s" : ""})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {output.artifacts.map((artifact, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{artifact.name}</span>
                          <span style={{ color: "var(--text-soft, #9ca3af)", fontSize: "0.75rem", marginLeft: 8 }}>
                            {artifact.type} ({artifact.format})
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            style={{ ...ghostBtnStyle, padding: "4px 12px", fontSize: "0.75rem" }}
                            onClick={() => setPreviewArtifact(artifact)}
                            aria-label={`Preview ${artifact.name}`}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            style={{ ...ghostBtnStyle, padding: "4px 12px", fontSize: "0.75rem" }}
                            onClick={() => copyArtifactContent(artifact.content)}
                            aria-label={`Copy ${artifact.name}`}
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            style={{ ...ghostBtnStyle, padding: "4px 12px", fontSize: "0.75rem" }}
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setPreviewArtifact(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setPreviewArtifact(null); }}
        >
          <div
            style={{
              background: "var(--surface, #111827)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 900,
              maxHeight: "80vh",
              width: "100%",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>{previewArtifact.name}</h2>
              <button
                type="button"
                style={ghostBtnStyle}
                onClick={() => setPreviewArtifact(null)}
                aria-label="Close preview"
              >
                Close
              </button>
            </div>
            <pre style={{
              background: "rgba(0,0,0,0.3)",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: "0.8rem",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {previewArtifact.content}
            </pre>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                style={primaryBtnStyle}
                onClick={() => copyArtifactContent(previewArtifact.content)}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                style={ghostBtnStyle}
                onClick={() => downloadArtifact(previewArtifact)}
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
