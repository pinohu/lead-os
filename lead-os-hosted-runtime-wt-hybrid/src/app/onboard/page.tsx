"use client";

import { useState, useCallback, useEffect } from "react";
import { publicPlans } from "@/lib/public-offer";

type WizardStep = "email" | "niche" | "plan" | "branding" | "integrations" | "review" | "complete";

interface OnboardingSession {
  id: string;
  email: string;
  currentStep: string;
  provisioningResult?: {
    tenantId: string;
    embedScript: string;
    dashboardUrl: string;
  };
}

interface NicheData {
  name: string;
  industry: string;
  keywords: string[];
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  features: string[];
  limits: string;
  recommended: boolean;
}

interface BrandingData {
  name: string;
  accent: string;
  logoUrl: string;
  siteUrl: string;
  supportEmail: string;
}

interface IntegrationOption {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

interface OnboardingDraft {
  email: string;
  session: OnboardingSession | null;
  step: WizardStep;
  niche: NicheData;
  selectedPlan: string;
  branding: BrandingData;
  enabledProviders: string[];
  updatedAt: string;
}

const INDUSTRIES = [
  "service", "legal", "health", "tech", "construction",
  "real-estate", "education", "finance", "franchise",
  "staffing", "faith", "creative",
] as const;

const PLANS: PlanOption[] = [
  ...publicPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    priceValue: plan.priceValue,
    features: plan.features,
    limits: plan.limits,
    recommended: plan.recommended,
  })),
];

const INTEGRATIONS: IntegrationOption[] = [
  { key: "email", label: "Email", description: "Automated email nurture sequences", defaultOn: true },
  { key: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging for lead follow-up", defaultOn: false },
  { key: "sms", label: "SMS", description: "Text message outreach and alerts", defaultOn: false },
  { key: "chat", label: "Chat Bot", description: "Live chat widget on your site", defaultOn: false },
  { key: "voice", label: "Voice AI", description: "AI-powered voice calls and qualification", defaultOn: false },
  { key: "booking", label: "Booking System", description: "Calendar scheduling and appointment booking", defaultOn: false },
  { key: "crm", label: "CRM", description: "Sync leads with your CRM after account access is added", defaultOn: false },
  { key: "documents", label: "Document Generation", description: "Auto-generate proposals and contracts", defaultOn: false },
];

const STEP_LABELS: Record<WizardStep, string> = {
  email: "Start",
  niche: "Client market",
  plan: "Plan",
  branding: "Business identity",
  integrations: "Account access",
  review: "Review",
  complete: "Complete",
};

const WIZARD_STEPS: WizardStep[] = ["niche", "plan", "branding", "integrations", "review"];
const DRAFT_STORAGE_KEY = "lead-os:onboarding-draft";
const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function isRecoverableCheckoutConfigError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("no such price") ||
    normalized.includes("stripe is not configured") ||
    normalized.includes("checkout cannot run");
}

function isSessionNotFoundError(message: string): boolean {
  return message.toLowerCase().includes("onboarding session not found");
}

function isWizardStep(value: string): value is WizardStep {
  return ["email", "niche", "plan", "branding", "integrations", "review", "complete"].includes(value);
}

function safeJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function recoveryTargetForStep(step: WizardStep): "niche" | "plan" | "branding" | "integrations" | "review" {
  if (step === "niche") return "niche";
  if (step === "plan") return "plan";
  if (step === "branding") return "branding";
  if (step === "integrations") return "integrations";
  return "review";
}

export default function OnboardPage() {
  const [step, setStep] = useState<WizardStep>("email");
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState<NicheData>({ name: "", industry: "", keywords: [] });
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("whitelabel-growth");
  const [branding, setBranding] = useState<BrandingData>({ name: "", accent: "#14b8a6", logoUrl: "", siteUrl: "", supportEmail: "" });
  const [enabledProviders, setEnabledProviders] = useState<Set<string>>(new Set(["email"]));
  const [paymentPending, setPaymentPending] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  const recoverCompletedOnboarding = useCallback(async () => {
    if (!session?.id) {
      window.location.href = "/packages";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${encodeURIComponent(session.id)}/step`);
      const json = await res.json();
      if (res.ok && json.data) {
        setSession(json.data);
        setError(null);
        setStep("complete");
        return;
      }
      window.location.href = "/packages";
    } catch {
      window.location.href = "/packages";
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const stepParam = params.get("step");
    const onboardingId = params.get("onboarding_id");
    const planParam = params.get("plan");

    if (!sessionId && !onboardingId) {
      const draft = safeJson<OnboardingDraft>(window.localStorage.getItem(DRAFT_STORAGE_KEY));
      const draftAge = draft ? Date.now() - new Date(draft.updatedAt).getTime() : Number.POSITIVE_INFINITY;
      if (draft && draftAge < DRAFT_MAX_AGE_MS && isWizardStep(draft.step)) {
        const canRestoreDraft = draft.step !== "complete" || Boolean(draft.session?.provisioningResult);
        if (canRestoreDraft) {
          setEmail(draft.email ?? "");
          setSession(draft.session ?? null);
          setStep(draft.step);
          setNiche(draft.niche ?? { name: "", industry: "", keywords: [] });
          setSelectedPlan(draft.selectedPlan ?? "whitelabel-growth");
          setBranding(draft.branding ?? { name: "", accent: "#14b8a6", logoUrl: "", siteUrl: "", supportEmail: "" });
          setEnabledProviders(new Set(draft.enabledProviders?.length ? draft.enabledProviders : ["email"]));
        } else {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    }

    if (sessionId && stepParam === "complete" && onboardingId) {
      setStripeSessionId(sessionId);
      setStep("complete");
      setLoading(true);

      fetch(`/api/onboarding/${encodeURIComponent(onboardingId)}/step`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setSession(json.data);
          } else {
            setError("Could not load your onboarding session. Please contact support.");
          }
        })
        .catch(() => {
          setError("Failed to verify payment status. Please contact support.");
        })
        .finally(() => setLoading(false));

      window.history.replaceState({}, "", "/onboard");
    } else if (stepParam === "plan" && onboardingId) {
      setStep("plan");
      window.history.replaceState({}, "", "/onboard");
    }

    if (planParam) {
      const planMap: Record<string, string> = {
        starter: "whitelabel-starter",
        growth: "whitelabel-growth",
        professional: "whitelabel-enterprise",
        enterprise: "whitelabel-enterprise",
      };
      const mappedPlan = planMap[planParam] ?? planParam;
      if (PLANS.some((p) => p.id === mappedPlan)) {
        setSelectedPlan(mappedPlan);
      }
    }
  }, []);

  useEffect(() => {
    const hasDraftContent = Boolean(email.trim()) || Boolean(session) || step !== "email";
    if (!hasDraftContent) return;

    const draft: OnboardingDraft = {
      email,
      session,
      step,
      niche,
      selectedPlan,
      branding,
      enabledProviders: [...enabledProviders],
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [email, session, step, niche, selectedPlan, branding, enabledProviders]);

  const resetOnboardingDraft = useCallback(() => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setError(null);
    setSession(null);
    setStep("email");
    setEmail("");
    setNiche({ name: "", industry: "", keywords: [] });
    setKeywordInput("");
    setSelectedPlan("whitelabel-growth");
    setBranding({ name: "", accent: "#14b8a6", logoUrl: "", siteUrl: "", supportEmail: "" });
    setEnabledProviders(new Set(["email"]));
    setPaymentPending(false);
    setStripeSessionId(null);
  }, []);

  const returnToEmailRecovery = useCallback(() => {
    setError("Enter your email and Lead OS will recover any active setup, or recreate the server session from your saved choices.");
    setSession(null);
    setStep("email");
    setPaymentPending(false);
    setStripeSessionId(null);
  }, []);

  const handleStartOnboarding = useCallback(async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to start onboarding");
        return;
      }
      setSession(json.data);
      setStep("niche");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const redirectToStripeCheckout = useCallback(async (onboardingId: string) => {
    setPaymentPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json.error?.message ?? "Failed to start checkout";
        if (isRecoverableCheckoutConfigError(message)) {
          setError(null);
          setStep("complete");
          setPaymentPending(false);
          return;
        }
        if (isSessionNotFoundError(message)) {
          setError(message);
          setPaymentPending(false);
          return;
        }
        setError(message);
        setPaymentPending(false);
        return;
      }

      if (json.data.free || json.data.dryRun) {
        setStep("complete");
        setPaymentPending(false);
        return;
      }

      if (json.data.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setError("Could not generate checkout URL. Please try again.");
        setPaymentPending(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setPaymentPending(false);
    }
  }, []);

  const recoverLostOnboarding = useCallback(async (stepData: Record<string, unknown>) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStep("email");
      setError("Your onboarding session expired. Enter your email to restart setup.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const recoverRes = await fetch("/api/onboarding/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          completeThrough: recoveryTargetForStep(step),
          niche,
          planId: selectedPlan,
          branding,
          enabledProviders: Array.isArray(stepData.enabledProviders) ? stepData.enabledProviders : [...enabledProviders],
        }),
      });
      const recoverJson = await recoverRes.json();
      if (!recoverRes.ok || !recoverJson.data) {
        throw new Error(recoverJson.error?.message ?? "Failed to recover onboarding session");
      }

      const recovered = recoverJson.data as OnboardingSession;
      setSession(recovered);

      const stepMap: Record<string, WizardStep> = {
        niche: "niche",
        plan: "plan",
        branding: "branding",
        integrations: "integrations",
        review: "review",
        complete: "complete",
      };

      if (recovered.currentStep === "complete") {
        setStep("complete");
        setError(null);
        return;
      }

      setStep(stepMap[recovered.currentStep] ?? "review");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to recover onboarding progress";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, niche, selectedPlan, branding, enabledProviders, step]);

  const handleAdvanceStep = useCallback(async (stepData: Record<string, unknown>) => {
    if (!session) {
      await recoverLostOnboarding(stepData);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${session.id}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepData),
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json.error?.message ?? "Failed to advance step";
        if (message.toLowerCase().includes("already complete")) {
          await recoverCompletedOnboarding();
          return;
        }
        if (isSessionNotFoundError(message)) {
          await recoverLostOnboarding(stepData);
          return;
        }
        setError(json.error?.message ?? "Failed to advance step");
        return;
      }
      setSession(json.data);

      if (json.data.currentStep === "complete") {
        const currentPlan = PLANS.find((p) => p.id === selectedPlan);
        const isPaidPlan = currentPlan && currentPlan.priceValue > 0;

        if (isPaidPlan) {
          await redirectToStripeCheckout(json.data.id);
          return;
        }

        setStep("complete");
      } else {
        const stepMap: Record<string, WizardStep> = {
          niche: "niche",
          plan: "plan",
          branding: "branding",
          integrations: "integrations",
          review: "review",
          complete: "complete",
        };
        setStep(stepMap[json.data.currentStep] ?? "review");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session, selectedPlan, redirectToStripeCheckout, recoverCompletedOnboarding, recoverLostOnboarding]);

  const handleBack = useCallback(() => {
    setError(null);
    const stepIndex = WIZARD_STEPS.indexOf(step as typeof WIZARD_STEPS[number]);
    if (stepIndex > 0) {
      setStep(WIZARD_STEPS[stepIndex - 1]);
    } else if (step === WIZARD_STEPS[0]) {
      setStep("email");
    }
  }, [step]);

  const toggleProvider = useCallback((key: string) => {
    setEnabledProviders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (kw && !niche.keywords.includes(kw)) {
      setNiche((prev) => ({ ...prev, keywords: [...prev.keywords, kw] }));
      setKeywordInput("");
    }
  }, [keywordInput, niche.keywords]);

  const removeKeyword = useCallback((kw: string) => {
    setNiche((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw) }));
  }, []);

  const completedStepIndex = WIZARD_STEPS.indexOf(step as typeof WIZARD_STEPS[number]);
  const alreadyCompleteError = error?.toLowerCase().includes("already complete") ?? false;
  const checkoutConfigError = error ? isRecoverableCheckoutConfigError(error) : false;
  const sessionNotFoundError = error ? isSessionNotFoundError(error) : false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[960px] px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-[2rem] font-bold text-foreground">Create your operator account</h1>
          <p className="text-base text-muted-foreground">
            Use this account to sell and launch B2B/B2B2C outcome solutions for client businesses.
          </p>
        </header>

        {step !== "email" && step !== "complete" && (
          <nav aria-label="Onboarding progress" aria-live="polite" className="mb-10 flex flex-wrap justify-center gap-2">
            {WIZARD_STEPS.map((s, i) => (
              <span
                key={s}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition-all duration-200 ${
                  step === s
                    ? "border-teal-500 bg-teal-500/15 text-teal-500"
                    : i < completedStepIndex
                    ? "border-teal-500/40 bg-teal-500/5 text-teal-700 dark:text-teal-300"
                    : "border-slate-400/20 bg-white/[0.03] text-muted-foreground"
                }`}
                aria-current={step === s ? "step" : undefined}
              >
                {i < completedStepIndex ? "\u2713 " : `${i + 1}. `}
                {STEP_LABELS[s]}
              </span>
            ))}
          </nav>
        )}

        {alreadyCompleteError && (
          <div role="status" aria-live="polite" className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.08] p-8">
            <p className="mb-2 text-[0.95rem] font-bold text-teal-700 dark:text-teal-300">Account setup is complete.</p>
            <p className="mb-5 text-[0.9rem] leading-relaxed text-muted-foreground">
              You can keep moving from here. Open the solution launch center, go to the dashboard, or refresh the completed session state.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/packages"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500 px-5 py-2.5 text-[0.9rem] font-bold text-[#0a0f1a] no-underline"
              >
                Launch Solutions
              </a>
              <a
                href="/dashboard"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500/10 px-5 py-2.5 text-[0.9rem] font-semibold text-teal-500 no-underline"
              >
                Open Dashboard
              </a>
              <button
                type="button"
                onClick={() => void recoverCompletedOnboarding()}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-400/30 bg-transparent px-5 py-2.5 text-[0.9rem] font-semibold text-muted-foreground"
                aria-busy={loading}
              >
                {loading ? "Refreshing..." : "Refresh Status"}
              </button>
            </div>
          </div>
        )}

        {checkoutConfigError && (
          <div role="status" aria-live="polite" className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.08] p-8">
            <p className="mb-2 text-[0.95rem] font-bold text-teal-700 dark:text-teal-300">Checkout is not connected yet.</p>
            <p className="mb-5 text-[0.9rem] leading-relaxed text-muted-foreground">
              Stripe returned a setup issue for this plan, but the operator account can still move forward. Launch the solution now and connect live billing from credentials later.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep("complete"); }}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500 px-5 py-2.5 text-[0.9rem] font-bold text-[#0a0f1a]"
              >
                Continue Without Stripe
              </button>
              <a
                href="/packages"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500/10 px-5 py-2.5 text-[0.9rem] font-semibold text-teal-500 no-underline"
              >
                Launch Solutions
              </a>
              <a
                href="/dashboard/credentials"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-400/30 bg-transparent px-5 py-2.5 text-[0.9rem] font-semibold text-muted-foreground no-underline"
              >
                Connect Billing
              </a>
            </div>
          </div>
        )}

        {sessionNotFoundError && (
          <div role="status" aria-live="polite" className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.08] p-8">
            <p className="mb-2 text-[0.95rem] font-bold text-teal-700 dark:text-teal-300">Setup session needs to be refreshed.</p>
            <p className="mb-5 text-[0.9rem] leading-relaxed text-muted-foreground">
              Your choices are still on this screen. Refresh the server session and Lead OS will replay the completed steps so you can keep going.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void recoverLostOnboarding(step === "integrations" ? { enabledProviders: [...enabledProviders] } : {})}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500 px-5 py-2.5 text-[0.9rem] font-bold text-[#0a0f1a]"
                aria-busy={loading}
              >
                {loading ? "Recovering..." : "Recover Setup"}
              </button>
              <button
                type="button"
                onClick={resetOnboardingDraft}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-400/30 bg-transparent px-5 py-2.5 text-[0.9rem] font-semibold text-muted-foreground"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {error && !alreadyCompleteError && !checkoutConfigError && !sessionNotFoundError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-8">
            <p className="text-[0.9rem] text-red-400">{error}</p>
          </div>
        )}

        {step === "email" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-5 text-[1.25rem] font-bold text-foreground">Start with your email</h2>
              <p className="mb-5 text-[0.9rem] text-muted-foreground">
                This creates your operator setup session. After that, go to Solutions and launch the outcome your client business bought.
              </p>
              <div className="mb-5">
                <label htmlFor="email-input" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartOnboarding()}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <span />
                <button
                  type="button"
                  onClick={handleStartOnboarding}
                  disabled={loading}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Starting..." : "Start operator setup"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "niche" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-5 text-[1.25rem] font-bold text-foreground">
                Define the client market
              </h2>
              <div className="mb-5">
                <label htmlFor="niche-name" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Client market name</label>
                <input
                  id="niche-name"
                  type="text"
                  value={niche.name}
                  onChange={(e) => setNiche((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Erie roof repairs, B2B SaaS trials, med spa consultations"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                  aria-required="true"
                  maxLength={100}
                />
              </div>
              <div className="mb-5">
                <label htmlFor="niche-industry" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Industry (optional)</label>
                <select
                  id="niche-industry"
                  value={niche.industry}
                  onChange={(e) => setNiche((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                >
                  <option value="">Select an industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1).replace(/-/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <label htmlFor="keyword-input" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Keywords (optional)</label>
                <div className="flex gap-2">
                  <input
                    id="keyword-input"
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Add a keyword"
                    className="flex-1 rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                  />
                  <button type="button" onClick={addKeyword} className="min-h-[44px] min-w-[60px] rounded-lg border border-slate-400/30 bg-transparent px-3.5 py-2.5 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200">
                    Add
                  </button>
                </div>
                {niche.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {niche.keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/15 px-2.5 py-1 text-[0.78rem] text-teal-700 dark:text-teal-300">
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="min-h-[20px] min-w-[20px] border-none bg-transparent p-0 text-base leading-none text-teal-700 dark:text-teal-300"
                          aria-label={`Remove keyword ${kw}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.08] px-3.5 py-2.5 text-[0.85rem] text-teal-700 dark:text-teal-300" role="status">
                This tells Lead OS which client market, downstream audience, and lead flow the solution should capture, score, and route.
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <button type="button" onClick={handleBack} className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200" aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({
                    name: niche.name,
                    industry: niche.industry || undefined,
                    keywords: niche.keywords.length > 0 ? niche.keywords : undefined,
                  })}
                  disabled={loading || niche.name.trim().length < 2}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading}
                  style={{ opacity: loading || niche.name.trim().length < 2 ? 0.7 : 1 }}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "plan" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-2 text-[1.25rem] font-bold text-foreground">Choose solution capacity</h2>
              <p className="mb-5 text-[0.9rem] text-muted-foreground">
                These plan names, prices, and limits match the backend billing catalog and control how much client solution volume you can run.
              </p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4" role="radiogroup" aria-label="Plan selection">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    role="radio"
                    aria-checked={selectedPlan === plan.id}
                    tabIndex={0}
                    onClick={() => setSelectedPlan(plan.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedPlan(plan.id)}
                    className={`relative cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? "border-2 border-teal-500 bg-teal-500/10"
                        : plan.recommended
                        ? "border-2 border-teal-500/30 bg-white/[0.03]"
                        : "border-2 border-slate-400/10 bg-white/[0.03]"
                    }`}
                  >
                    {plan.recommended && <span className="absolute -top-2.5 right-4 rounded-full bg-teal-500 px-2.5 py-[3px] text-[0.7rem] font-bold uppercase tracking-wide text-[#0a0f1a]">Recommended</span>}
                    <h3 className="mb-1 text-[1.1rem] font-bold text-foreground">{plan.name}</h3>
                    <p className="mb-4 text-[1.5rem] font-extrabold text-teal-500">{plan.price}</p>
                    <ul className="mb-3 list-none p-0">
                      {plan.features.map((f) => (
                        <li key={f} className="py-[3px] text-[0.82rem] text-muted-foreground">{f}</li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-slate-400/10 pt-3 text-[0.78rem] text-muted-foreground">{plan.limits}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <button type="button" onClick={handleBack} className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200" aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({ planId: selectedPlan })}
                  disabled={loading}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "branding" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-5 text-[1.25rem] font-bold text-foreground">
                Name the operator account
              </h2>
              <div className="mb-5">
                <label htmlFor="brand-name" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Brand Name</label>
                <input
                  id="brand-name"
                  type="text"
                  value={branding.name}
                  onChange={(e) => setBranding((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Company Name"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                  aria-required="true"
                />
              </div>
              <div className="mb-5">
                <label htmlFor="brand-accent" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.accent}
                    onChange={(e) => setBranding((prev) => ({ ...prev, accent: e.target.value }))}
                    className="h-11 w-11 cursor-pointer rounded-lg border border-slate-400/20 bg-transparent p-0.5"
                    aria-label="Accent color picker"
                  />
                  <input
                    id="brand-accent"
                    type="text"
                    value={branding.accent}
                    onChange={(e) => setBranding((prev) => ({ ...prev, accent: e.target.value }))}
                    placeholder="#14b8a6"
                    className="flex-1 rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="mb-5">
                <label htmlFor="brand-logo" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Logo URL (optional)</label>
                <input
                  id="brand-logo"
                  type="url"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://yoursite.com/logo.png"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                />
              </div>
              <div className="mb-5">
                <label htmlFor="brand-site" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Website URL (optional)</label>
                <input
                  id="brand-site"
                  type="url"
                  value={branding.siteUrl}
                  onChange={(e) => setBranding((prev) => ({ ...prev, siteUrl: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                />
              </div>
              <div className="mb-5">
                <label htmlFor="brand-support-email" className="mb-1.5 block text-[0.85rem] font-semibold text-muted-foreground">Support Email (optional)</label>
                <input
                  id="brand-support-email"
                  type="email"
                  value={branding.supportEmail}
                  onChange={(e) => setBranding((prev) => ({ ...prev, supportEmail: e.target.value }))}
                  placeholder="support@yoursite.com"
                  className="w-full rounded-lg border border-slate-400/20 bg-muted px-3.5 py-2.5 text-[0.9rem] text-foreground outline-none"
                  autoComplete="email"
                />
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <button type="button" onClick={handleBack} className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200" aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({
                    name: branding.name,
                    accent: branding.accent,
                    logoUrl: branding.logoUrl || undefined,
                    siteUrl: branding.siteUrl || undefined,
                    supportEmail: branding.supportEmail || undefined,
                  })}
                  disabled={loading || !branding.name.trim()}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading}
                  style={{ opacity: loading || !branding.name.trim() ? 0.7 : 1 }}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "integrations" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-5 text-[1.25rem] font-bold text-foreground">
                Choose account-access-backed channels
              </h2>
              <div role="group" aria-label="Available integrations">
                {INTEGRATIONS.map((integration) => (
                  <div key={integration.key} className="flex items-center justify-between border-b border-slate-400/[0.08] py-3.5">
                    <div>
                      <div className="text-[0.9rem] font-semibold text-foreground">{integration.label}</div>
                      <div className="mt-0.5 text-[0.78rem] text-muted-foreground">{integration.description}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabledProviders.has(integration.key)}
                      aria-label={`Toggle ${integration.label}`}
                      onClick={() => toggleProvider(integration.key)}
                      className={`relative flex min-h-[44px] w-11 shrink-0 items-center rounded-xl border-none px-0.5 transition-colors duration-200 ${
                        enabledProviders.has(integration.key) ? "bg-teal-500" : "bg-slate-400/20"
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform duration-200 ${enabledProviders.has(integration.key) ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <button type="button" onClick={handleBack} className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200" aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({ enabledProviders: [...enabledProviders] })}
                  disabled={loading}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "review" && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-6 text-[1.25rem] font-bold text-foreground">
                Review account setup
              </h2>
              <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                <span className="text-[0.85rem] text-muted-foreground">Client market</span>
                <span className="text-[0.85rem] font-semibold text-foreground">{niche.name}{niche.industry ? ` (${niche.industry})` : ""}</span>
              </div>
              <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                <span className="text-[0.85rem] text-muted-foreground">Plan</span>
                <span className="text-[0.85rem] font-semibold text-foreground">{PLANS.find((p) => p.id === selectedPlan)?.name ?? selectedPlan} - {PLANS.find((p) => p.id === selectedPlan)?.price ?? ""}</span>
              </div>
              <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                <span className="text-[0.85rem] text-muted-foreground">Brand Name</span>
                <span className="text-[0.85rem] font-semibold text-foreground">{branding.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                <span className="text-[0.85rem] text-muted-foreground">Accent Color</span>
                <span className="text-[0.85rem] font-semibold text-foreground">
                  <span className="mr-1.5 inline-block h-3.5 w-3.5 rounded align-middle" style={{ background: branding.accent }} />
                  {branding.accent}
                </span>
              </div>
              {branding.siteUrl && (
                <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                  <span className="text-[0.85rem] text-muted-foreground">Website</span>
                  <span className="text-[0.85rem] font-semibold text-foreground">{branding.siteUrl}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-400/[0.08] py-2.5">
                <span className="text-[0.85rem] text-muted-foreground">Integrations</span>
                <span className="text-[0.85rem] font-semibold text-foreground">{[...enabledProviders].join(", ")}</span>
              </div>
              {(() => {
                const currentPlan = PLANS.find((p) => p.id === selectedPlan);
                const isPaidPlan = currentPlan && currentPlan.priceValue > 0;
                return isPaidPlan ? (
                  <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.08] px-3.5 py-2.5 text-[0.85rem] text-teal-700 dark:text-teal-300" role="status">
                If Stripe is configured, you will go to checkout for {currentPlan.name} ({currentPlan.price}). If Stripe is not configured, the account setup completes and solution launches can still show which account access can connect later.
                  </div>
                ) : null;
              })()}
              <div className="mt-8 flex justify-between gap-3">
                <button type="button" onClick={handleBack} className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200" aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({})}
                  disabled={loading || paymentPending}
                  className="min-h-[44px] rounded-lg border-none bg-teal-500 px-9 py-3.5 text-base font-bold text-[#0a0f1a] transition-opacity duration-200"
                  aria-busy={loading || paymentPending}
                  style={{ opacity: loading || paymentPending ? 0.7 : 1 }}
                >
                  {loading ? "Launching..." : paymentPending ? "Redirecting to payment..." : (() => {
                    const currentPlan = PLANS.find((p) => p.id === selectedPlan);
                    return currentPlan && currentPlan.priceValue > 0 ? "Continue to Payment" : "Finish operator setup";
                  })()}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "complete" && loading && (
          <main>
            <div className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.08] p-8 text-center">
              <h2 className="mb-2 text-[1.5rem] font-bold text-teal-500">
                Verifying Payment
              </h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your subscription...
              </p>
            </div>
          </main>
        )}

        {step === "complete" && !loading && session?.provisioningResult && (
          <main>
            <div className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.08] p-8 text-center">
              <h2 className="mb-2 text-[1.5rem] font-bold text-teal-500">
                Your Account Is Ready. Launch a Client Solution Next.
              </h2>
              <p className="text-muted-foreground">
                {stripeSessionId
                  ? "Checkout returned successfully. Go to Solutions, choose what your client bought, and submit their intake details."
                  : "Go to Solutions, choose what your client bought, and submit their intake details."}
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-slate-400/10 bg-muted p-8">
              <h3 className="mb-3 text-base font-bold text-foreground">
                Embed Script
              </h3>
              <p className="mb-3 text-[0.85rem] text-muted-foreground">
                Add this script to a page where you want an account-level lead capture widget for a client business to appear:
              </p>
              <code className="mb-4 block overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-[0.82rem] text-teal-100">
                {session.provisioningResult.embedScript}
              </code>
            </div>

            <div className="mb-6 rounded-xl border border-slate-400/10 bg-muted p-8">
              <h3 className="mb-3 text-base font-bold text-foreground">
                Dashboard
              </h3>
              <p className="mb-3 text-[0.85rem] text-muted-foreground">
                Open the dashboard to review leads, settings, solution activity, and launch readiness:
              </p>
              <a
                href={session.provisioningResult.dashboardUrl}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500/10 px-5 py-2.5 text-[0.9rem] font-semibold text-teal-500 no-underline"
              >
                Open Dashboard
              </a>
            </div>

            <div className="mb-6 rounded-xl border border-slate-400/10 bg-muted p-8">
              <h3 className="mb-3 text-base font-bold text-foreground">
                Complete Solution Launch
              </h3>
              <p className="mb-3 text-[0.85rem] text-muted-foreground">
                Choose the solution the client business paid for, collect the intake details it needs, and provision the full delivery hub.
              </p>
              <a
                href="/packages"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-teal-500/30 bg-teal-500/10 px-5 py-2.5 text-[0.9rem] font-semibold text-teal-500 no-underline"
              >
                Launch Solutions
              </a>
            </div>

            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h3 className="mb-2 text-base font-bold text-foreground">
                Check Your Email
              </h3>
              <p className="text-[0.85rem] text-muted-foreground">
                We use <strong className="text-foreground">{session.email}</strong> as the delivery contact for this account.
              </p>
            </div>
          </main>
        )}

        {step === "complete" && !loading && session && !session.provisioningResult && !stripeSessionId && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-4 text-[1.25rem] font-bold text-foreground">
                Complete Payment
              </h2>
              <p className="mb-6 text-[0.9rem] text-muted-foreground">
                Your system is ready to launch. Complete payment to activate your subscription.
              </p>
              <button
                type="button"
                onClick={() => session.id && redirectToStripeCheckout(session.id)}
                disabled={paymentPending}
                className="min-h-[44px] rounded-lg border-none bg-teal-500 px-9 py-3.5 text-base font-bold text-[#0a0f1a] transition-opacity duration-200"
                aria-busy={paymentPending}
                style={{ opacity: paymentPending ? 0.7 : 1 }}
              >
                {paymentPending ? "Redirecting to payment..." : "Complete Payment"}
              </button>
            </div>
          </main>
        )}

        {step === "complete" && !loading && !session && (
          <main>
            <div className="rounded-xl border border-slate-400/10 bg-muted p-8">
              <h2 className="mb-4 text-[1.25rem] font-bold text-foreground">
                Setup Needs Recovery
              </h2>
              <p className="mb-6 text-[0.9rem] text-muted-foreground">
                Your browser kept the setup screen, but the server session is no longer available. Recover from your email and saved choices, or clear the draft and start fresh.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={returnToEmailRecovery}
                  className="min-h-[44px] min-w-[120px] rounded-lg border-none bg-teal-500 px-7 py-3 text-[0.9rem] font-bold text-[#0a0f1a] transition-opacity duration-200"
                >
                  Recover with Email
                </button>
                <button
                  type="button"
                  onClick={resetOnboardingDraft}
                  className="min-h-[44px] min-w-[120px] rounded-lg border border-slate-400/30 bg-transparent px-7 py-3 text-[0.9rem] font-semibold text-muted-foreground transition-opacity duration-200"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
