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

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  running: "bg-blue-500/15 text-blue-600",
  completed: "bg-teal-500/15 text-teal-500",
  failed: "bg-red-500/15 text-red-500",
  cancelled: "bg-muted text-muted-foreground",
  skipped: "bg-muted text-muted-foreground",
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
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold min-h-[24px] ${cls}`}
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
    <li className="px-3 py-2 border-b border-border/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0 text-sm text-foreground text-left"
      >
        <span className="flex items-center gap-2">
          <StatusBadge status={step.status} />
          <span className="font-semibold">{step.name}</span>
          <span className="text-muted-foreground text-xs">
            ({step.engine})
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {formatDuration(step.durationMs)}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 px-3 py-2 bg-muted/30 rounded-md text-xs font-mono whitespace-pre-wrap break-words">
          {step.error && (
            <p className="text-red-500 mb-1">Error: {step.error}</p>
          )}
          {step.output && (
            <p className="text-foreground">
              {JSON.stringify(step.output, null, 2)}
            </p>
          )}
          {!step.error && !step.output && (
            <p className="text-muted-foreground">No output yet</p>
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
    <article className="border border-border/50 rounded-[10px] bg-card/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`task-detail-${task.id}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left text-sm text-foreground"
      >
        <span className="flex items-center gap-2.5">
          <StatusBadge status={task.status} />
          <span className="font-bold">{agentLabel}</span>
          <span className="text-muted-foreground text-xs">
            {task.nicheSlug} / {task.tenantId.slice(0, 8)}
          </span>
        </span>
        <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span>{formatDate(task.createdAt)}</span>
          <span>
            {task.steps.filter((s) => s.status === "completed").length}/{task.steps.length} steps
          </span>
        </span>
      </button>

      {expanded && (
        <div
          id={`task-detail-${task.id}`}
          className="px-4 pb-3 border-t border-border/30"
        >
          <div className="flex justify-between items-center py-2 text-xs text-muted-foreground">
            <span>ID: {task.id}</span>
            {(task.status === "pending" || task.status === "running") && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(task.id);
                }}
                className="px-3 py-1 rounded-md border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          {task.error && (
            <p className="mb-2 px-2.5 py-1.5 bg-red-500/10 rounded-md text-red-500 text-xs">
              {task.error}
            </p>
          )}
          <ul
            className="list-none p-0 m-0"
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
    <main className="max-w-[1180px] mx-auto px-6 pt-6 pb-12">
      <header className="mb-6">
        <h1 className="text-foreground text-2xl font-extrabold">
          Agent Orchestrator
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm">
          Autonomous agents that chain multiple engines together
        </p>
      </header>

      {/* Launch controls */}
      <section
        aria-label="Launch agent"
        className="flex flex-wrap gap-2.5 items-end mb-6 p-4 rounded-[10px] border border-border/50 bg-card/70"
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="agent-type-select"
            className="text-xs font-semibold text-muted-foreground"
          >
            Agent Type
          </label>
          <select
            id="agent-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-md border border-border/60 bg-background text-sm font-semibold min-w-[200px] min-h-[44px]"
          >
            {AGENT_TYPES.map((at) => (
              <option key={at.value} value={at.value}>
                {at.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="niche-slug-input"
            className="text-xs font-semibold text-muted-foreground"
          >
            Niche Slug
          </label>
          <input
            id="niche-slug-input"
            type="text"
            value={nicheSlug}
            onChange={(e) => setNicheSlug(e.target.value)}
            placeholder="e.g. construction"
            className="px-3 py-2 rounded-md border border-border/60 text-sm min-w-[200px] min-h-[44px]"
          />
        </div>

        <button
          type="button"
          onClick={handleRunAgent}
          disabled={submitting || !nicheSlug.trim()}
          aria-busy={submitting}
          className={`px-5 py-2 rounded-md border-none text-sm font-bold min-h-[44px] ${
            submitting
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-teal-700 text-white cursor-pointer"
          }`}
        >
          {submitting ? "Starting..." : "Run Agent"}
        </button>

        <p className="text-xs text-muted-foreground basis-full">
          {AGENT_TYPES.find((a) => a.value === selectedType)?.description}
        </p>
      </section>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="px-4 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p
          aria-live="polite"
          className="text-center text-muted-foreground text-sm"
        >
          Loading tasks...
        </p>
      )}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">
          No agent tasks yet. Select an agent type and run one above.
        </p>
      )}

      {/* Task list */}
      {!loading && tasks.length > 0 && (
        <section aria-label="Agent tasks">
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onCancel={handleCancel} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
