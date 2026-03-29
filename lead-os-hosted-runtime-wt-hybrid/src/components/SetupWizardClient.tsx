"use client";

import { useState, useCallback, useId, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";

// ---------------------------------------------------------------------------
// Design tokens — dark theme matching spec
// ---------------------------------------------------------------------------

const PAGE_BG = "#0a0f1a";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "rgba(255,255,255,0.92)";
const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
const ACCENT = "#14b8a6";
const ACCENT_SOFT = "rgba(20,184,166,0.12)";
const ACCENT_STRONG = "#0d9488";
const SUCCESS_COLOR = "#34d399";
const SUCCESS_SOFT = "rgba(52,211,153,0.12)";
const WARNING_COLOR = "#fbbf24";
const WARNING_SOFT = "rgba(251,191,36,0.12)";
const ERROR_COLOR = "#f87171";
const ERROR_SOFT = "rgba(248,113,113,0.12)";
const BORDER_FOCUS = "#14b8a6";
const RADIUS_LG = "16px";
const RADIUS_MD = "12px";
const RADIUS_SM = "8px";
const RADIUS_PILL = "999px";

// ---------------------------------------------------------------------------
// Prop types
// ---------------------------------------------------------------------------

export interface EnvCheck {
  key: string;
  label: string;
  description: string;
  present: boolean;
  optional: boolean;
}

export interface NicheOption {
  slug: string;
  label: string;
  summary: string;
}

export interface InitialConfig {
  brandName: string;
  supportEmail: string;
  defaultNiche: string;
  accent: string;
  siteUrl: string;
  tenantId: string;
}

export interface SetupStatus {
  database: boolean;
  tenant: boolean;
  brand: boolean;
  configured: boolean;
}

export interface SetupWizardClientProps {
  envChecks: EnvCheck[];
  niches: NicheOption[];
  initialConfig: InitialConfig;
  setupStatus: SetupStatus;
}

// ---------------------------------------------------------------------------
// Step identifiers
// ---------------------------------------------------------------------------

type WizardStep = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS: Record<WizardStep, string> = {
  0: "Welcome",
  1: "Environment",
  2: "Configure",
  3: "Test Drive",
  4: "All Done",
};

const TOTAL_STEPS = 5;

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

const s = {
  page: (): CSSProperties => ({
    minHeight: "100vh",
    background: PAGE_BG,
    padding: "48px 24px 96px",
    color: TEXT_PRIMARY,
    fontFamily: '"Trebuchet MS", "Gill Sans", "Helvetica Neue", sans-serif',
  }),
  container: (): CSSProperties => ({
    maxWidth: "680px",
    margin: "0 auto",
    display: "grid",
    gap: "32px",
  }),
  card: (extra?: CSSProperties): CSSProperties => ({
    background: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: RADIUS_LG,
    padding: "28px",
    ...extra,
  }),
  eyebrow: (): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: ACCENT,
    fontSize: "0.74rem",
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  }),
  h1: (): CSSProperties => ({
    margin: "0 0 16px",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
    color: TEXT_PRIMARY,
  }),
  h2: (): CSSProperties => ({
    margin: "0 0 12px",
    fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
    fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    color: TEXT_PRIMARY,
  }),
  h3: (): CSSProperties => ({
    margin: "0 0 8px",
    fontSize: "1.05rem",
    fontFamily: '"Trebuchet MS", "Gill Sans", "Helvetica Neue", sans-serif',
    fontWeight: 700,
    color: TEXT_PRIMARY,
  }),
  body: (): CSSProperties => ({
    margin: 0,
    fontSize: "1rem",
    lineHeight: 1.6,
    color: TEXT_SECONDARY,
  }),
  label: (): CSSProperties => ({
    display: "block",
    marginBottom: "6px",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: TEXT_PRIMARY,
    letterSpacing: "0.04em",
  }),
  input: (extra?: CSSProperties): CSSProperties => ({
    display: "block",
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: RADIUS_SM,
    color: TEXT_PRIMARY,
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 140ms ease",
    boxSizing: "border-box",
    ...extra,
  }),
  select: (): CSSProperties => ({
    display: "block",
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: RADIUS_SM,
    color: TEXT_PRIMARY,
    fontSize: "0.95rem",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  }),
  btnPrimary: (): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "14px 28px",
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: RADIUS_PILL,
    fontFamily: '"Trebuchet MS", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 140ms ease, transform 140ms ease",
    textDecoration: "none",
  }),
  btnSecondary: (): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "14px 24px",
    background: "rgba(255,255,255,0.06)",
    color: TEXT_PRIMARY,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: RADIUS_PILL,
    fontFamily: '"Trebuchet MS", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 140ms ease, background-color 140ms ease",
    textDecoration: "none",
  }),
  ctaRow: (): CSSProperties => ({
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "center",
    marginTop: "24px",
  }),
  badge: (variant: "success" | "warning" | "error" | "neutral" | "optional"): CSSProperties => {
    const map = {
      success: { bg: SUCCESS_SOFT, color: SUCCESS_COLOR },
      warning: { bg: WARNING_SOFT, color: WARNING_COLOR },
      error: { bg: ERROR_SOFT, color: ERROR_COLOR },
      neutral: { bg: "rgba(255,255,255,0.06)", color: TEXT_SECONDARY },
      optional: { bg: "rgba(255,255,255,0.06)", color: TEXT_SECONDARY },
    };
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: RADIUS_PILL,
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: map[variant].bg,
      color: map[variant].color,
      flexShrink: 0,
    };
  },
  statusIcon: (passed: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: RADIUS_PILL,
    flexShrink: 0,
    fontSize: "0.85rem",
    fontWeight: 800,
    background: passed ? SUCCESS_SOFT : WARNING_SOFT,
    color: passed ? SUCCESS_COLOR : WARNING_COLOR,
  }),
  divider: (): CSSProperties => ({
    border: "none",
    borderTop: `1px solid ${CARD_BORDER}`,
    margin: "20px 0",
  }),
  code: (): CSSProperties => ({
    display: "block",
    padding: "16px",
    background: "rgba(0,0,0,0.4)",
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: RADIUS_MD,
    fontSize: "0.8rem",
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    color: "#a5f3fc",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: 1.6,
    margin: "12px 0",
  }),
};

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------

function StepProgress({ current }: { current: WizardStep }) {
  return (
    <nav aria-label="Setup wizard progress" style={{ marginBottom: "8px" }}>
      <ol
        role="list"
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          listStyle: "none",
          padding: 0,
          margin: 0,
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(STEP_LABELS) as unknown as WizardStep[]).map((step) => {
          const stepNum = Number(step) as WizardStep;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          return (
            <li
              key={step}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span
                aria-current={isCurrent ? "step" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: RADIUS_PILL,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  background: isCompleted
                    ? SUCCESS_SOFT
                    : isCurrent
                    ? ACCENT_SOFT
                    : "rgba(255,255,255,0.04)",
                  color: isCompleted
                    ? SUCCESS_COLOR
                    : isCurrent
                    ? ACCENT
                    : TEXT_SECONDARY,
                  border: `1px solid ${
                    isCompleted
                      ? "rgba(52,211,153,0.2)"
                      : isCurrent
                      ? "rgba(20,184,166,0.3)"
                      : CARD_BORDER
                  }`,
                  transition: "background 200ms ease, color 200ms ease",
                }}
              >
                {isCompleted ? "✓ " : `${stepNum + 1}. `}
                {STEP_LABELS[stepNum]}
              </span>
              {stepNum < TOTAL_STEPS - 1 && (
                <span aria-hidden="true" style={{ color: TEXT_SECONDARY, fontSize: "0.7rem" }}>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step 0 — Welcome
// ---------------------------------------------------------------------------

interface WelcomeStepProps {
  setupStatus: SetupStatus;
  brandName: string;
  onNext: () => void;
}

function WelcomeStep({ setupStatus, brandName, onNext }: WelcomeStepProps) {
  const systemItems: Array<{ label: string; ok: boolean; note: string }> = [
    {
      label: "Database",
      ok: setupStatus.database,
      note: setupStatus.database
        ? "PostgreSQL connection is healthy."
        : "No database connection. Data will not persist.",
    },
    {
      label: "Tenant identity",
      ok: setupStatus.tenant,
      note: setupStatus.tenant
        ? "Tenant ID is configured."
        : "Using default tenant. Set LEAD_OS_TENANT_ID.",
    },
    {
      label: "Brand name",
      ok: setupStatus.brand,
      note: setupStatus.brand
        ? `Brand is set to "${brandName}".`
        : "Brand name is using a placeholder. Set NEXT_PUBLIC_BRAND_NAME.",
    },
  ];

  return (
    <section aria-labelledby="welcome-heading">
      <p style={s.eyebrow()}>First-run setup</p>
      <h1 id="welcome-heading" style={s.h1()}>
        Welcome to {brandName}
      </h1>
      <p style={s.body()}>
        This wizard walks you through the five steps needed to go from a fresh
        deployment to a live lead-capture system. It takes about three minutes.
        You can always come back and change any of these settings.
      </p>

      <div style={{ ...s.card(), marginTop: "24px" }}>
        <p style={s.eyebrow()}>System status</p>
        <ul
          role="list"
          aria-label="Core system checks"
          style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "14px" }}
        >
          {systemItems.map((item) => (
            <li
              key={item.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
              aria-label={`${item.label}: ${item.ok ? "ready" : "needs attention"}`}
            >
              <span aria-hidden="true" style={s.statusIcon(item.ok)}>
                {item.ok ? "✓" : "!"}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY, fontSize: "0.9rem" }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                  {item.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={s.ctaRow()}>
        <button style={s.btnPrimary()} onClick={onNext} type="button">
          Let&rsquo;s get started →
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Environment check
// ---------------------------------------------------------------------------

interface EnvironmentStepProps {
  envChecks: EnvCheck[];
  onNext: () => void;
  onBack: () => void;
}

function EnvironmentStep({ envChecks, onNext, onBack }: EnvironmentStepProps) {
  const required = envChecks.filter((c) => !c.optional);
  const optional = envChecks.filter((c) => c.optional);
  const allRequiredPassed = required.every((c) => c.present);

  return (
    <section aria-labelledby="env-heading">
      <p style={s.eyebrow()}>Step 2 of {TOTAL_STEPS}</p>
      <h2 id="env-heading" style={s.h2()}>
        Environment check
      </h2>
      <p style={s.body()}>
        Lead OS reads configuration from environment variables. Required
        variables must be set before the platform functions. Optional services
        run in dry-run mode when missing — no errors, no real side effects.
      </p>

      {required.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: TEXT_SECONDARY,
            }}
          >
            Required
          </p>
          <ul
            role="list"
            aria-label="Required environment variables"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}
          >
            {required.map((check) => (
              <EnvCheckCard key={check.key} check={check} />
            ))}
          </ul>
        </div>
      )}

      {optional.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: TEXT_SECONDARY,
            }}
          >
            Optional integrations
          </p>
          <ul
            role="list"
            aria-label="Optional environment variables"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}
          >
            {optional.map((check) => (
              <EnvCheckCard key={check.key} check={check} />
            ))}
          </ul>
        </div>
      )}

      {!allRequiredPassed && (
        <div
          role="alert"
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            background: WARNING_SOFT,
            border: `1px solid rgba(251,191,36,0.2)`,
            borderRadius: RADIUS_MD,
            fontSize: "0.88rem",
            color: WARNING_COLOR,
            lineHeight: 1.5,
          }}
        >
          One or more required variables are missing. You can continue to review
          the remaining steps, but the platform will not be fully operational
          until these are set.
        </div>
      )}

      <div style={s.ctaRow()}>
        <button style={s.btnPrimary()} onClick={onNext} type="button">
          Continue →
        </button>
        <button style={s.btnSecondary()} onClick={onBack} type="button">
          ← Back
        </button>
      </div>
    </section>
  );
}

function EnvCheckCard({ check }: { check: EnvCheck }) {
  return (
    <li
      style={s.card({ display: "grid", gap: "8px" })}
      aria-label={`${check.label}: ${check.present ? "configured" : check.optional ? "optional, not set" : "missing"}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: TEXT_PRIMARY, fontSize: "0.9rem" }}>
            {check.label}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.75rem",
              color: TEXT_SECONDARY,
              fontFamily: '"SFMono-Regular", Consolas, monospace',
            }}
          >
            {check.key}
          </p>
        </div>
        <span aria-hidden="true" style={s.statusIcon(check.present)}>
          {check.present ? "✓" : check.optional ? "–" : "!"}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "0.85rem", color: TEXT_SECONDARY, lineHeight: 1.5 }}>
        {check.description}
      </p>
      <span
        style={
          check.present
            ? s.badge("success")
            : check.optional
            ? s.badge("optional")
            : s.badge("warning")
        }
      >
        {check.present ? "Configured" : check.optional ? "Optional — dry-run mode" : "Missing"}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Quick configuration form
// ---------------------------------------------------------------------------

interface QuickConfigFormData {
  brandName: string;
  supportEmail: string;
  defaultNiche: string;
  accent: string;
}

interface QuickConfigStepProps {
  initialConfig: InitialConfig;
  niches: NicheOption[];
  databaseConnected: boolean;
  onNext: () => void;
  onBack: () => void;
}

function QuickConfigStep({
  initialConfig,
  niches,
  databaseConnected,
  onNext,
  onBack,
}: QuickConfigStepProps) {
  const formId = useId();
  const [formData, setFormData] = useState<QuickConfigFormData>({
    brandName: initialConfig.brandName,
    supportEmail: initialConfig.supportEmail,
    defaultNiche: initialConfig.defaultNiche,
    accent: initialConfig.accent,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof QuickConfigFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("idle");
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/setup/configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? `Server returned ${response.status}`);
        }

        setSaveStatus("saved");
        // Short delay so the user sees the success state, then advance
        setTimeout(onNext, 700);
      } catch (err) {
        setSaveStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to save configuration.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [formData, onNext],
  );

  const inputStyle = (field: string): CSSProperties => ({
    ...s.input(),
    borderColor: focusedField === field ? BORDER_FOCUS : CARD_BORDER,
  });

  return (
    <section aria-labelledby="config-heading">
      <p style={s.eyebrow()}>Step 3 of {TOTAL_STEPS}</p>
      <h2 id="config-heading" style={s.h2()}>
        Quick configuration
      </h2>
      <p style={s.body()}>
        Set your brand identity and default niche. These values control how the
        platform presents itself to leads and which funnel templates it
        prioritises.
        {!databaseConnected && (
          <span
            style={{
              display: "block",
              marginTop: "10px",
              padding: "10px 14px",
              background: WARNING_SOFT,
              border: `1px solid rgba(251,191,36,0.2)`,
              borderRadius: RADIUS_SM,
              color: WARNING_COLOR,
              fontSize: "0.85rem",
            }}
          >
            No database connection — changes will be applied to the running
            process only and will not persist across restarts.
          </span>
        )}
      </p>

      <form
        id={`${formId}-form`}
        onSubmit={handleSubmit}
        noValidate
        style={{ marginTop: "24px", display: "grid", gap: "20px" }}
        aria-label="Quick configuration form"
      >
        <div>
          <label htmlFor={`${formId}-brand`} style={s.label()}>
            Brand name
          </label>
          <input
            id={`${formId}-brand`}
            type="text"
            value={formData.brandName}
            onChange={(e) => handleChange("brandName", e.target.value)}
            onFocus={() => setFocusedField("brand")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("brand")}
            placeholder="e.g. Acme Growth"
            required
            aria-required="true"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-email`} style={s.label()}>
            Support email
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            value={formData.supportEmail}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("email")}
            placeholder="support@yourdomain.com"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-niche`} style={s.label()}>
            Default niche
          </label>
          <select
            id={`${formId}-niche`}
            value={formData.defaultNiche}
            onChange={(e) => handleChange("defaultNiche", e.target.value)}
            style={s.select()}
            aria-describedby={`${formId}-niche-hint`}
          >
            {niches.map((niche) => (
              <option key={niche.slug} value={niche.slug}>
                {niche.label}
              </option>
            ))}
          </select>
          <p
            id={`${formId}-niche-hint`}
            style={{ margin: "6px 0 0", fontSize: "0.8rem", color: TEXT_SECONDARY }}
          >
            {niches.find((n) => n.slug === formData.defaultNiche)?.summary ?? ""}
          </p>
        </div>

        <div>
          <label htmlFor={`${formId}-accent`} style={s.label()}>
            Accent colour
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              id={`${formId}-accent`}
              type="color"
              value={formData.accent}
              onChange={(e) => handleChange("accent", e.target.value)}
              style={{
                width: "52px",
                height: "44px",
                padding: "4px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: RADIUS_SM,
                cursor: "pointer",
              }}
              aria-describedby={`${formId}-accent-value`}
            />
            <span
              id={`${formId}-accent-value`}
              style={{
                fontSize: "0.85rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                color: TEXT_SECONDARY,
              }}
            >
              {formData.accent}
            </span>
            <span
              aria-hidden="true"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: RADIUS_PILL,
                background: formData.accent,
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {saveStatus === "error" && (
          <div
            role="alert"
            style={{
              padding: "12px 14px",
              background: ERROR_SOFT,
              border: `1px solid rgba(248,113,113,0.2)`,
              borderRadius: RADIUS_MD,
              color: ERROR_COLOR,
              fontSize: "0.88rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {saveStatus === "saved" && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              background: SUCCESS_SOFT,
              border: `1px solid rgba(52,211,153,0.2)`,
              borderRadius: RADIUS_MD,
              color: SUCCESS_COLOR,
              fontSize: "0.88rem",
            }}
          >
            Configuration saved successfully.
          </div>
        )}

        <div style={s.ctaRow()}>
          <button
            type="submit"
            style={{
              ...s.btnPrimary(),
              opacity: isSaving ? 0.7 : 1,
            }}
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? "Saving…" : "Save and continue →"}
          </button>
          <button
            type="button"
            style={s.btnSecondary()}
            onClick={onNext}
            aria-label="Skip configuration and continue to next step"
          >
            Skip for now
          </button>
          <button style={s.btnSecondary()} onClick={onBack} type="button">
            ← Back
          </button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Test drive
// ---------------------------------------------------------------------------

interface TestDriveStepProps {
  siteUrl: string;
  onNext: () => void;
  onBack: () => void;
}

interface ActionCard {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: string;
}

function TestDriveStep({ siteUrl, onNext, onBack }: TestDriveStepProps) {
  const cards: ActionCard[] = [
    {
      title: "Capture a test lead",
      description:
        "Open the home page lead capture form and submit a test entry to confirm the full ingest pipeline is working.",
      href: "/",
      cta: "Open lead form →",
      icon: "✦",
    },
    {
      title: "View your dashboard",
      description:
        "See captured leads, automation health, booking jobs, and document pipeline status in the operator console.",
      href: "/dashboard",
      cta: "Go to dashboard →",
      icon: "◈",
    },
    {
      title: "Set up your first client",
      description:
        "Run the onboarding wizard to provision a new client tenant with their own niche, branding, and integrations.",
      href: "/onboard",
      cta: "Start onboarding →",
      icon: "⬡",
    },
  ];

  return (
    <section aria-labelledby="testdrive-heading">
      <p style={s.eyebrow()}>Step 4 of {TOTAL_STEPS}</p>
      <h2 id="testdrive-heading" style={s.h2()}>
        Take it for a spin
      </h2>
      <p style={s.body()}>
        Your instance is configured. Try these three actions to verify
        everything is wired up correctly before going live.
      </p>

      <ul
        role="list"
        aria-label="Quick actions"
        style={{
          listStyle: "none",
          padding: 0,
          margin: "24px 0 0",
          display: "grid",
          gap: "14px",
        }}
      >
        {cards.map((card) => (
          <li key={card.href}>
            <a
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...s.card({ display: "grid", gap: "10px", textDecoration: "none" }),
                transition: "border-color 140ms ease",
              }}
              aria-label={`${card.title} — opens in new tab`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = CARD_BORDER;
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = BORDER_FOCUS;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = CARD_BORDER;
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: RADIUS_MD,
                    background: ACCENT_SOFT,
                    color: ACCENT,
                    fontSize: "1.2rem",
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: TEXT_PRIMARY, fontSize: "0.95rem" }}>
                    {card.title}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: ACCENT,
                  marginLeft: "54px",
                }}
              >
                {card.cta}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div style={s.ctaRow()}>
        <button style={s.btnPrimary()} onClick={onNext} type="button">
          Continue to finish →
        </button>
        <button style={s.btnSecondary()} onClick={onBack} type="button">
          ← Back
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — All done
// ---------------------------------------------------------------------------

interface AllDoneStepProps {
  siteUrl: string;
  tenantId: string;
  brandName: string;
  onBack: () => void;
}

function AllDoneStep({ siteUrl, tenantId, brandName, onBack }: AllDoneStepProps) {
  const [copied, setCopied] = useState(false);

  const embedScript = `<!-- ${brandName} Lead Capture Widget -->
<script
  src="${siteUrl}/widget.js"
  data-tenant="${tenantId}"
  async
></script>`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable — silently ignore, user can select manually
    }
  }, [embedScript]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void handleCopy();
      }
    },
    [handleCopy],
  );

  return (
    <section aria-labelledby="done-heading">
      <p style={s.eyebrow()}>Setup complete</p>
      <h2 id="done-heading" style={s.h2()}>
        You&rsquo;re all set
      </h2>
      <p style={s.body()}>
        {brandName} is live and ready to capture leads. Paste the embed snippet
        below onto any website to activate the capture widget on external pages.
      </p>

      <div style={{ ...s.card(), marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "4px",
          }}
        >
          <p style={s.eyebrow()}>Embed snippet</p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            onKeyDown={handleKeyDown}
            aria-label={copied ? "Snippet copied to clipboard" : "Copy embed snippet to clipboard"}
            aria-pressed={copied}
            style={{
              ...s.btnSecondary(),
              minHeight: "36px",
              padding: "8px 14px",
              fontSize: "0.8rem",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: TEXT_SECONDARY }}>
          Add this to your website&rsquo;s{" "}
          <code
            style={{
              padding: "1px 4px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.82em",
            }}
          >
            {"<head>"}
          </code>{" "}
          or just before the closing{" "}
          <code
            style={{
              padding: "1px 4px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.82em",
            }}
          >
            {"</body>"}
          </code>{" "}
          tag.
        </p>
        <pre style={s.code()} aria-label="HTML embed snippet">
          <code>{embedScript}</code>
        </pre>
      </div>

      <div style={{ ...s.card(), marginTop: "16px" }}>
        <p style={s.eyebrow()}>What&rsquo;s next</p>
        <ul
          role="list"
          style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}
        >
          {[
            { label: "Operator dashboard", href: "/dashboard", desc: "Monitor leads, automation, and pipeline health." },
            { label: "Add integrations", href: "/dashboard/credentials", desc: "Connect email, CRM, billing, and AI providers." },
            { label: "Configure funnels", href: "/dashboard/settings", desc: "Map your services to funnel templates." },
            { label: "Help center", href: "/help", desc: "Guides, API reference, and deployment notes." },
          ].map((item) => (
            <li key={item.href} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{ color: ACCENT, marginTop: "2px", flexShrink: 0 }}>→</span>
              <div>
                <a
                  href={item.href}
                  style={{ color: ACCENT, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                >
                  {item.label}
                </a>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: TEXT_SECONDARY }}>
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={s.ctaRow()}>
        <a href="/dashboard" style={s.btnPrimary()}>
          Go to dashboard →
        </a>
        <button style={s.btnSecondary()} onClick={onBack} type="button">
          ← Back
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root wizard component
// ---------------------------------------------------------------------------

export function SetupWizardClient({
  envChecks,
  niches,
  initialConfig,
  setupStatus,
}: SetupWizardClientProps) {
  const [step, setStep] = useState<WizardStep>(0);

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1) as WizardStep);
  }, []);

  const goBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as WizardStep);
  }, []);

  return (
    <div style={s.page()}>
      <div style={s.container()}>
        <StepProgress current={step} />

        {step === 0 && (
          <WelcomeStep
            setupStatus={setupStatus}
            brandName={initialConfig.brandName}
            onNext={goNext}
          />
        )}

        {step === 1 && (
          <EnvironmentStep
            envChecks={envChecks}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 2 && (
          <QuickConfigStep
            initialConfig={initialConfig}
            niches={niches}
            databaseConnected={setupStatus.database}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 3 && (
          <TestDriveStep
            siteUrl={initialConfig.siteUrl}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 4 && (
          <AllDoneStep
            siteUrl={initialConfig.siteUrl}
            tenantId={initialConfig.tenantId}
            brandName={initialConfig.brandName}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
