"use client";

import { useEffect, useState, useCallback } from "react";

interface AgentStep {
  name: string;
  engine: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

interface AgentTask {
  id: string;
  agentType: string;
  tenantId: string;
  nicheSlug: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  input: Record<string, unknown>;
  steps: AgentStep[];
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

type AgentTypeOption = {
  value: string;
  label: string;
  description: string;
};

const AGENT_TYPES: AgentTypeOption[] = [
  { value: "funnel-agent", label: "Funnel Agent", description: "Builds a complete funnel from scratch" },
  { value: "creative-agent", label: "Creative Agent", description: "Generates creative assets across platforms" },
  { value: "optimization-agent", label: "Optimization Agent", description: "Improves the system based on data" },
  { value: "analytics-agent", label: "Analytics Agent", description: "Generates comprehensive analytics" },
  { value: "onboarding-agent", label: "Onboarding Agent", description: "Fully provisions a new tenant" },
];

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  pending: { background: "rgba(234, 179, 8, 0.15)", color: "#ca8a04" },
  running: { background: "rgba(59, 130, 246, 0.15)", color: "#2563eb" },
  completed: { background: "rgba(20, 184, 166, 0.15)", color: "#14b8a6" },
  failed: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  cancelled: { background: "rgba(20, 33, 29, 0.08)", color: "#9ca3af" },
  skipped: { background: "rgba(20, 33, 29, 0.08)", color: "#9ca3af" },
};

const AUTO_REFRESH_MS = 10_000;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 700,
        background: style.background,
        color: style.color,
        minHeight: 24,
      }}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

function StepRow({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid rgba(20, 33, 29, 0.06)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: "0.82rem",
          color: "var(--text, #14211d)",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={step.status} />
          <span style={{ fontWeight: 600 }}>{step.name}</span>
          <span style={{ color: "var(--text-soft, #9ca3af)", fontSize: "0.75rem" }}>
            ({step.engine})
          </span>
        </span>
        <span style={{ color: "var(--text-soft, #9ca3af)", fontSize: "0.75rem" }}>
          {formatDuration(step.durationMs)}
        </span>
      </button>
      {expanded && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(20, 33, 29, 0.03)",
            borderRadius: 6,
            fontSize: "0.75rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {step.error && (
            <p style={{ color: "#ef4444", margin: "0 0 4px" }}>Error: {step.error}</p>
          )}
          {step.output && (
            <p style={{ margin: 0, color: "var(--text, #14211d)" }}>
              {JSON.stringify(step.output, null, 2)}
            </p>
          )}
          {!step.error && !step.output && (
            <p style={{ margin: 0, color: "var(--text-soft, #9ca3af)" }}>No output yet</p>
          )}
        </div>
      )}
    </li>
  );
}

function TaskCard({ task, onCancel }: { task: AgentTask; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const agentLabel = AGENT_TYPES.find((a) => a.value === task.agentType)?.label ?? task.agentType;

  return (
    <article
      style={{
        border: "1px solid rgba(20, 33, 29, 0.1)",
        borderRadius: 10,
        background: "rgba(255, 255, 255, 0.7)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`task-detail-${task.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontSize: "0.85rem",
          color: "var(--text, #14211d)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={task.status} />
          <span style={{ fontWeight: 700 }}>{agentLabel}</span>
          <span style={{ color: "var(--text-soft, #9ca3af)", fontSize: "0.75rem" }}>
            {task.nicheSlug} / {task.tenantId.slice(0, 8)}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.75rem", color: "var(--text-soft, #9ca3af)" }}>
          <span>{formatDate(task.createdAt)}</span>
          <span>
            {task.steps.filter((s) => s.status === "completed").length}/{task.steps.length} steps
          </span>
        </span>
      </button>

      {expanded && (
        <div
          id={`task-detail-${task.id}`}
          style={{ padding: "0 16px 12px", borderTop: "1px solid rgba(20, 33, 29, 0.06)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              fontSize: "0.78rem",
              color: "var(--text-soft, #9ca3af)",
            }}
          >
            <span>ID: {task.id}</span>
            {(task.status === "pending" || task.status === "running") && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(task.id);
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {task.error && (
            <p
              style={{
                margin: "0 0 8px",
                padding: "6px 10px",
                background: "rgba(239, 68, 68, 0.08)",
                borderRadius: 6,
                color: "#ef4444",
                fontSize: "0.78rem",
              }}
            >
              {task.error}
            </p>
          )}
          <ul
            style={{ listStyle: "none", padding: 0, margin: 0 }}
            aria-label="Agent steps"
          >
            {task.steps.map((step, idx) => (
              <StepRow key={`${task.id}-step-${idx}`} step={step} />
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function AgentsPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("funnel-agent");
  const [nicheSlug, setNicheSlug] = useState("construction");
  const [submitting, setSubmitting] = useState(false);

  const tenantId = "default";

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        setTasks(json.data ?? []);
        setError(null);
      }
    } catch {
      setError("Failed to load agent tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function handleRunAgent() {
    if (!nicheSlug.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: selectedType,
          tenantId,
          nicheSlug: nicheSlug.trim(),
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        await fetchTasks();
      }
    } catch {
      setError("Failed to start agent");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(taskId: string) {
    try {
      await fetch(`/api/agents/${taskId}`, { method: "DELETE" });
      await fetchTasks();
    } catch {
      setError("Failed to cancel task");
    }
  }

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "24px 24px 48px",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
          Agent Orchestrator
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            color: "var(--text-soft, #9ca3af)",
            fontSize: "0.88rem",
          }}
        >
          Autonomous agents that chain multiple engines together
        </p>
      </header>

      {/* Launch controls */}
      <section
        aria-label="Launch agent"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "flex-end",
          marginBottom: 24,
          padding: 16,
          borderRadius: 10,
          border: "1px solid rgba(20, 33, 29, 0.1)",
          background: "rgba(255, 255, 255, 0.7)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="agent-type-select"
            style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)" }}
          >
            Agent Type
          </label>
          <select
            id="agent-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(20, 33, 29, 0.15)",
              background: "#fff",
              fontSize: "0.82rem",
              fontWeight: 600,
              minWidth: 200,
              minHeight: 44,
            }}
          >
            {AGENT_TYPES.map((at) => (
              <option key={at.value} value={at.value}>
                {at.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="niche-slug-input"
            style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)" }}
          >
            Niche Slug
          </label>
          <input
            id="niche-slug-input"
            type="text"
            value={nicheSlug}
            onChange={(e) => setNicheSlug(e.target.value)}
            placeholder="e.g. construction"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(20, 33, 29, 0.15)",
              fontSize: "0.82rem",
              minWidth: 200,
              minHeight: 44,
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleRunAgent}
          disabled={submitting || !nicheSlug.trim()}
          aria-busy={submitting}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            border: "none",
            background: submitting ? "rgba(20, 33, 29, 0.1)" : "var(--accent-strong, #14b8a6)",
            color: submitting ? "var(--text-soft, #9ca3af)" : "#fff",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            minHeight: 44,
          }}
        >
          {submitting ? "Starting..." : "Run Agent"}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            color: "var(--text-soft, #9ca3af)",
            flex: "1 0 100%",
          }}
        >
          {AGENT_TYPES.find((a) => a.value === selectedType)?.description}
        </p>
      </section>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            fontSize: "0.82rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p
          aria-live="polite"
          style={{ textAlign: "center", color: "var(--text-soft, #9ca3af)", fontSize: "0.88rem" }}
        >
          Loading tasks...
        </p>
      )}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: "var(--text-soft, #9ca3af)",
            fontSize: "0.88rem",
            padding: "48px 0",
          }}
        >
          No agent tasks yet. Select an agent type and run one above.
        </p>
      )}

      {/* Task list */}
      {!loading && tasks.length > 0 && (
        <section aria-label="Agent tasks">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onCancel={handleCancel} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
