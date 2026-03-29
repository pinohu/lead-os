"use client";

/**
 * Usage:
 *   import { GettingStartedChecklist } from "@/components/getting-started-checklist";
 *
 *   // In your dashboard page (must be a Client Component or nested inside one):
 *   <GettingStartedChecklist />
 *
 * The component fetches /api/dashboard/onboarding-status on mount and renders
 * nothing once all steps are complete or the operator has dismissed it.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingStatus {
  brandConfigured: boolean;
  emailConnected: boolean;
  widgetConfigured: boolean;
  firstLeadCaptured: boolean;
  scoringReviewed: boolean;
  goneLive: boolean;
}

interface ChecklistStep {
  id: keyof OnboardingStatus;
  title: string;
  description: string;
  href: string | null;
  linkLabel: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISSED_KEY = "leados_checklist_dismissed";

const STEPS: ChecklistStep[] = [
  {
    id: "brandConfigured",
    title: "Configure your brand",
    description: "Set your brand name, accent color, and support email so leads see your identity, not a default placeholder.",
    href: "/dashboard/settings",
    linkLabel: "Open settings",
  },
  {
    id: "emailConnected",
    title: "Connect email provider",
    description: "Add credentials for your email provider so LeadOS can send automated nurture sequences and notifications.",
    href: "/dashboard/credentials",
    linkLabel: "Add credentials",
  },
  {
    id: "widgetConfigured",
    title: "Set up your first widget",
    description: "Whitelist the origins where your capture widgets will run so the runtime accepts inbound submissions.",
    href: "/dashboard/settings",
    linkLabel: "Configure origins",
  },
  {
    id: "firstLeadCaptured",
    title: "Capture your first lead",
    description: "Submit a test lead through your widget or API to confirm the pipeline is running end-to-end.",
    href: null,
    linkLabel: null,
  },
  {
    id: "scoringReviewed",
    title: "Review your scoring rules",
    description: "Tune lead scoring weights and signal thresholds to match your qualification criteria.",
    href: "/dashboard/scoring",
    linkLabel: "Open scoring",
  },
  {
    id: "goneLive",
    title: "Go live",
    description: "Enable live mode to activate automated channel messaging, booking triggers, and workflow emissions.",
    href: "/dashboard/settings",
    linkLabel: "Enable live mode",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // localStorage unavailable in restricted environments — silent fail
  }
}

function countComplete(status: OnboardingStatus) {
  return STEPS.filter((s) => status[s.id]).length;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StepRowProps {
  step: ChecklistStep;
  complete: boolean;
  index: number;
}

function StepRow({ step, complete, index }: StepRowProps) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 0",
        borderBottom: "1px solid #f1f5f9",
        opacity: complete ? 0.6 : 1,
      }}
    >
      {/* Checkbox indicator */}
      <span
        role="img"
        aria-label={complete ? "Complete" : "Incomplete"}
        style={{
          flexShrink: 0,
          marginTop: "2px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: complete ? "none" : "2px solid #cbd5e1",
          background: complete ? "#4f46e5" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {complete && (
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Step body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 2px",
            fontWeight: 600,
            fontSize: "14px",
            color: "#0f172a",
            textDecoration: complete ? "line-through" : "none",
          }}
          id={`checklist-step-${index}`}
        >
          Step {index + 1}: {step.title}
        </p>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </p>
        {!complete && step.href && step.linkLabel && (
          <Link
            href={step.href}
            aria-label={`${step.linkLabel} — ${step.title}`}
            style={{
              display: "inline-block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#4f46e5",
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid #4f46e5",
              lineHeight: 1.4,
            }}
          >
            {step.linkLabel}
          </Link>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GettingStartedChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isDismissed()) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch("/api/dashboard/onboarding-status")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ data: OnboardingStatus }>;
      })
      .then(({ data }) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    saveDismissed();
    setDismissed(true);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // Keyboard handler: Escape collapses or dismisses
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        if (!collapsed) {
          setCollapsed(true);
        }
      }
    },
    [collapsed],
  );

  // Nothing to render while loading, dismissed, errored, or all steps done
  if (loading || dismissed || error) return null;
  if (!status) return null;

  const completedCount = countComplete(status);
  const totalCount = STEPS.length;
  const allComplete = completedCount === totalCount;

  // Hide once the operator has completed everything
  if (allComplete) return null;

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <section
      aria-labelledby="checklist-heading"
      onKeyDown={handleKeyDown}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: collapsed ? "16px 20px" : "20px",
        marginBottom: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        maxWidth: "720px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="eyebrow"
            style={{ margin: "0 0 2px", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}
          >
            Getting started
          </p>
          <h2
            id="checklist-heading"
            style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}
          >
            {completedCount} of {totalCount} steps complete
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls="checklist-body"
            aria-label={collapsed ? "Expand getting started checklist" : "Collapse getting started checklist"}
            style={{
              background: "none",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            {collapsed ? "Show" : "Hide"}
          </button>

          {/* Dismiss */}
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss getting started checklist"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              color: "#94a3b8",
              fontSize: "18px",
              lineHeight: 1,
              borderRadius: "4px",
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${completedCount} of ${totalCount} onboarding steps complete`}
        style={{ marginTop: "12px" }}
      >
        <div
          style={{
            height: "6px",
            borderRadius: "99px",
            background: "#f1f5f9",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "#4f46e5",
              borderRadius: "99px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Collapsible step list */}
      <div
        id="checklist-body"
        aria-live="polite"
        style={{ display: collapsed ? "none" : "block" }}
      >
        <ol
          aria-label="Onboarding steps"
          style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}
        >
          {STEPS.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              complete={status[step.id]}
              index={i}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
