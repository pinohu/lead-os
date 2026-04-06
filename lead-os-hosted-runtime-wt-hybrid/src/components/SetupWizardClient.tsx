"use client";

import { useState, useCallback, useId, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";

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
// Step progress indicator
// ---------------------------------------------------------------------------

function StepProgress({ current }: { current: WizardStep }) {
  return (
    <nav aria-label="Setup wizard progress" className="mb-2">
      <ol
        role="list"
        className="flex list-none flex-wrap items-center gap-2 p-0"
      >
        {(Object.keys(STEP_LABELS) as unknown as WizardStep[]).map((step) => {
          const stepNum = Number(step) as WizardStep;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          return (
            <li
              key={step}
              className="flex items-center gap-2"
            >
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-bold tracking-wide transition-colors duration-200 ${
                  isCompleted
                    ? "border-green-400/20 bg-green-400/10 text-green-400"
                    : isCurrent
                    ? "border-teal-500/30 bg-teal-500/10 text-teal-500"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? "✓ " : `${stepNum + 1}. `}
                {STEP_LABELS[stepNum]}
              </span>
              {stepNum < TOTAL_STEPS - 1 && (
                <span aria-hidden="true" className="text-[0.7rem] text-muted-foreground">
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
      <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">First-run setup</p>
      <h1 id="welcome-heading" className="mb-4 font-serif text-[clamp(2rem,4vw,3rem)] leading-none tracking-tight text-foreground">
        Welcome to {brandName}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        This wizard walks you through the five steps needed to go from a fresh
        deployment to a live lead-capture system. It takes about three minutes.
        You can always come back and change any of these settings.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-muted p-7">
        <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">System status</p>
        <ul
          role="list"
          aria-label="Core system checks"
          className="grid list-none gap-3.5 p-0"
        >
          {systemItems.map((item) => (
            <li
              key={item.label}
              className="flex items-start gap-3"
              aria-label={`${item.label}: ${item.ok ? "ready" : "needs attention"}`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-extrabold ${
                  item.ok ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
                }`}
              >
                {item.ok ? "✓" : "!"}
              </span>
              <div>
                <p className="text-[0.9rem] font-bold text-foreground">
                  {item.label}
                </p>
                <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
                  {item.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 text-[0.95rem] font-bold text-white transition-opacity duration-150" onClick={onNext} type="button">
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
      <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">Step 2 of {TOTAL_STEPS}</p>
      <h2 id="env-heading" className="mb-3 font-serif text-[clamp(1.4rem,2.5vw,1.9rem)] leading-none tracking-tight text-foreground">
        Environment check
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        Lead OS reads configuration from environment variables. Required
        variables must be set before the platform functions. Optional services
        run in dry-run mode when missing — no errors, no real side effects.
      </p>

      {required.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            Required
          </p>
          <ul
            role="list"
            aria-label="Required environment variables"
            className="grid list-none gap-3 p-0"
          >
            {required.map((check) => (
              <EnvCheckCard key={check.key} check={check} />
            ))}
          </ul>
        </div>
      )}

      {optional.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            Optional integrations
          </p>
          <ul
            role="list"
            aria-label="Optional environment variables"
            className="grid list-none gap-3 p-0"
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
          className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3.5 text-[0.88rem] leading-relaxed text-yellow-400"
        >
          One or more required variables are missing. You can continue to review
          the remaining steps, but the platform will not be fully operational
          until these are set.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 text-[0.95rem] font-bold text-white transition-opacity duration-150" onClick={onNext} type="button">
          Continue →
        </button>
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-muted px-6 py-3.5 text-[0.95rem] font-semibold text-foreground transition-opacity duration-150" onClick={onBack} type="button">
          ← Back
        </button>
      </div>
    </section>
  );
}

function EnvCheckCard({ check }: { check: EnvCheck }) {
  return (
    <li
      className="grid gap-2 rounded-2xl border border-border bg-muted p-7"
      aria-label={`${check.label}: ${check.present ? "configured" : check.optional ? "optional, not set" : "missing"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.9rem] font-bold text-foreground">
            {check.label}
          </p>
          <p className="mt-0.5 font-mono text-[0.75rem] text-muted-foreground">
            {check.key}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-extrabold ${
            check.present ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
          }`}
        >
          {check.present ? "✓" : check.optional ? "–" : "!"}
        </span>
      </div>
      <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
        {check.description}
      </p>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-wider ${
          check.present
            ? "bg-green-400/10 text-green-400"
            : "bg-muted text-muted-foreground"
        }`}
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

  return (
    <section aria-labelledby="config-heading">
      <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">Step 3 of {TOTAL_STEPS}</p>
      <h2 id="config-heading" className="mb-3 font-serif text-[clamp(1.4rem,2.5vw,1.9rem)] leading-none tracking-tight text-foreground">
        Quick configuration
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        Set your brand identity and default niche. These values control how the
        platform presents itself to leads and which funnel templates it
        prioritises.
        {!databaseConnected && (
          <span className="mt-2.5 block rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-3.5 py-2.5 text-[0.85rem] text-yellow-400">
            No database connection — changes will be applied to the running
            process only and will not persist across restarts.
          </span>
        )}
      </p>

      <form
        id={`${formId}-form`}
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid gap-5"
        aria-label="Quick configuration form"
      >
        <div>
          <label htmlFor={`${formId}-brand`} className="mb-1.5 block text-[0.85rem] font-bold tracking-wide text-foreground">
            Brand name
          </label>
          <input
            id={`${formId}-brand`}
            type="text"
            value={formData.brandName}
            onChange={(e) => handleChange("brandName", e.target.value)}
            onFocus={() => setFocusedField("brand")}
            onBlur={() => setFocusedField(null)}
            className={`block w-full rounded-lg border bg-muted px-3.5 py-3 text-[0.95rem] text-foreground outline-none transition-colors duration-150 ${focusedField === "brand" ? "border-teal-500" : "border-border"}`}
            placeholder="e.g. Acme Growth"
            required
            aria-required="true"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-email`} className="mb-1.5 block text-[0.85rem] font-bold tracking-wide text-foreground">
            Support email
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            value={formData.supportEmail}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            className={`block w-full rounded-lg border bg-muted px-3.5 py-3 text-[0.95rem] text-foreground outline-none transition-colors duration-150 ${focusedField === "email" ? "border-teal-500" : "border-border"}`}
            placeholder="support@yourdomain.com"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-niche`} className="mb-1.5 block text-[0.85rem] font-bold tracking-wide text-foreground">
            Default niche
          </label>
          <select
            id={`${formId}-niche`}
            value={formData.defaultNiche}
            onChange={(e) => handleChange("defaultNiche", e.target.value)}
            className="block w-full cursor-pointer rounded-lg border border-border bg-muted px-3.5 py-3 text-[0.95rem] text-foreground outline-none"
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
            className="mt-1.5 text-[0.8rem] text-muted-foreground"
          >
            {niches.find((n) => n.slug === formData.defaultNiche)?.summary ?? ""}
          </p>
        </div>

        <div>
          <label htmlFor={`${formId}-accent`} className="mb-1.5 block text-[0.85rem] font-bold tracking-wide text-foreground">
            Accent colour
          </label>
          <div className="flex items-center gap-3">
            <input
              id={`${formId}-accent`}
              type="color"
              value={formData.accent}
              onChange={(e) => handleChange("accent", e.target.value)}
              className="h-11 w-[52px] cursor-pointer rounded-lg border border-border bg-muted p-1"
              aria-describedby={`${formId}-accent-value`}
            />
            <span
              id={`${formId}-accent-value`}
              className="font-mono text-[0.85rem] text-muted-foreground"
            >
              {formData.accent}
            </span>
            <span
              aria-hidden="true"
              className="h-7 w-7 shrink-0 rounded-full"
              style={{ background: formData.accent }}
            />
          </div>
        </div>

        {saveStatus === "error" && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-3 text-[0.88rem] text-red-400"
          >
            {errorMessage}
          </div>
        )}

        {saveStatus === "saved" && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-green-400/20 bg-green-400/10 px-3.5 py-3 text-[0.88rem] text-green-400"
          >
            Configuration saved successfully.
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 text-[0.95rem] font-bold text-white transition-opacity duration-150"
            disabled={isSaving}
            aria-busy={isSaving}
            style={{ opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? "Saving…" : "Save and continue →"}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-muted px-6 py-3.5 text-[0.95rem] font-semibold text-foreground transition-opacity duration-150"
            onClick={onNext}
            aria-label="Skip configuration and continue to next step"
          >
            Skip for now
          </button>
          <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-muted px-6 py-3.5 text-[0.95rem] font-semibold text-foreground transition-opacity duration-150" onClick={onBack} type="button">
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
      <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">Step 4 of {TOTAL_STEPS}</p>
      <h2 id="testdrive-heading" className="mb-3 font-serif text-[clamp(1.4rem,2.5vw,1.9rem)] leading-none tracking-tight text-foreground">
        Take it for a spin
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        Your instance is configured. Try these three actions to verify
        everything is wired up correctly before going live.
      </p>

      <ul
        role="list"
        aria-label="Quick actions"
        className="mt-6 grid list-none gap-3.5 p-0"
      >
        {cards.map((card) => (
          <li key={card.href}>
            <a
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="grid gap-2.5 rounded-2xl border border-border bg-muted p-7 no-underline transition-colors duration-150 hover:border-teal-500 focus:border-teal-500"
              aria-label={`${card.title} — opens in new tab`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-[1.2rem] text-teal-500"
                >
                  {card.icon}
                </span>
                <div className="flex-1">
                  <p className="mb-1 text-[0.95rem] font-bold text-foreground">
                    {card.title}
                  </p>
                  <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
              <span className="ml-[54px] text-[0.82rem] font-bold text-teal-500">
                {card.cta}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 text-[0.95rem] font-bold text-white transition-opacity duration-150" onClick={onNext} type="button">
          Continue to finish →
        </button>
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-muted px-6 py-3.5 text-[0.95rem] font-semibold text-foreground transition-opacity duration-150" onClick={onBack} type="button">
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
      <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">Setup complete</p>
      <h2 id="done-heading" className="mb-3 font-serif text-[clamp(1.4rem,2.5vw,1.9rem)] leading-none tracking-tight text-foreground">
        You&rsquo;re all set
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        {brandName} is live and ready to capture leads. Paste the embed snippet
        below onto any website to activate the capture widget on external pages.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-muted p-7">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">Embed snippet</p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            onKeyDown={handleKeyDown}
            aria-label={copied ? "Snippet copied to clipboard" : "Copy embed snippet to clipboard"}
            aria-pressed={copied}
            className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-border bg-muted px-3.5 py-2 text-[0.8rem] font-semibold text-foreground transition-opacity duration-150"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p className="mb-2 text-[0.85rem] text-muted-foreground">
          Add this to your website&rsquo;s{" "}
          <code className="rounded bg-muted px-1 py-px font-mono text-[0.82em]">
            {"<head>"}
          </code>{" "}
          or just before the closing{" "}
          <code className="rounded bg-muted px-1 py-px font-mono text-[0.82em]">
            {"</body>"}
          </code>{" "}
          tag.
        </p>
        <pre className="my-3 block overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-black/40 p-4 font-mono text-[0.8rem] leading-relaxed text-cyan-200" aria-label="HTML embed snippet">
          <code>{embedScript}</code>
        </pre>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted p-7">
        <p className="mb-3 inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-teal-500">What&rsquo;s next</p>
        <ul
          role="list"
          className="grid list-none gap-3 p-0"
        >
          {[
            { label: "Operator dashboard", href: "/dashboard", desc: "Monitor leads, automation, and pipeline health." },
            { label: "Add integrations", href: "/dashboard/credentials", desc: "Connect email, CRM, billing, and AI providers." },
            { label: "Configure funnels", href: "/dashboard/settings", desc: "Map your services to funnel templates." },
            { label: "Help center", href: "/help", desc: "Guides, API reference, and deployment notes." },
          ].map((item) => (
            <li key={item.href} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-teal-500">→</span>
              <div>
                <a
                  href={item.href}
                  className="text-[0.9rem] font-bold text-teal-500 no-underline hover:underline"
                >
                  {item.label}
                </a>
                <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 text-[0.95rem] font-bold text-white no-underline transition-opacity duration-150">
          Go to dashboard →
        </Link>
        <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-muted px-6 py-3.5 text-[0.95rem] font-semibold text-foreground transition-opacity duration-150" onClick={onBack} type="button">
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
    <div className="min-h-screen bg-background px-6 pb-24 pt-12 text-foreground">
      <div className="mx-auto grid max-w-[680px] gap-8">
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
