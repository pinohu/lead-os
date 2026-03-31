"use client";

import { useState, useCallback, useEffect } from "react";

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

const INDUSTRIES = [
  "service", "legal", "health", "tech", "construction",
  "real-estate", "education", "finance", "franchise",
  "staffing", "faith", "creative",
] as const;

const PLANS: PlanOption[] = [
  {
    id: "whitelabel-starter",
    name: "Starter",
    price: "$299/mo",
    priceValue: 29900,
    features: ["Lead capture", "4D scoring", "Email nurture", "3 niches", "10 integrations"],
    limits: "250 leads/mo, 2,500 emails",
    recommended: false,
  },
  {
    id: "whitelabel-growth",
    name: "Growth",
    price: "$599/mo",
    priceValue: 59900,
    features: ["Everything in Starter", "A/B testing", "AI content", "Prospect scout", "25 integrations"],
    limits: "1,500 leads/mo, 15,000 emails",
    recommended: true,
  },
  {
    id: "whitelabel-enterprise",
    name: "Enterprise",
    price: "$1,299/mo",
    priceValue: 129900,
    features: ["Everything in Growth", "Unlimited funnels", "Marketplace", "All 137+ integrations", "Joy Layer"],
    limits: "10,000 leads/mo, 100,000 emails",
    recommended: false,
  },
];

const INTEGRATIONS: IntegrationOption[] = [
  { key: "email", label: "Email", description: "Automated email nurture sequences", defaultOn: true },
  { key: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging for lead follow-up", defaultOn: false },
  { key: "sms", label: "SMS", description: "Text message outreach and alerts", defaultOn: false },
  { key: "chat", label: "Chat Bot", description: "Live chat widget on your site", defaultOn: false },
  { key: "voice", label: "Voice AI", description: "AI-powered voice calls and qualification", defaultOn: false },
  { key: "booking", label: "Booking System", description: "Calendar scheduling and appointment booking", defaultOn: false },
  { key: "crm", label: "CRM", description: "Sync leads with your CRM platform", defaultOn: false },
  { key: "documents", label: "Document Generation", description: "Auto-generate proposals and contracts", defaultOn: false },
];

const STEP_LABELS: Record<WizardStep, string> = {
  email: "Start",
  niche: "Niche",
  plan: "Plan",
  branding: "Branding",
  integrations: "Integrations",
  review: "Review",
  complete: "Complete",
};

const WIZARD_STEPS: WizardStep[] = ["niche", "plan", "branding", "integrations", "review"];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e2e8f0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 24px",
  } as React.CSSProperties,
  header: {
    textAlign: "center" as const,
    marginBottom: 48,
  } as React.CSSProperties,
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 8px",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "1rem",
    color: "#94a3b8",
    margin: 0,
  } as React.CSSProperties,
  stepIndicator: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginBottom: 40,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  stepDot: (active: boolean, completed: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: "0.8rem",
    fontWeight: 600,
    border: `1px solid ${active ? "#14b8a6" : completed ? "rgba(20, 184, 166, 0.4)" : "rgba(148, 163, 184, 0.2)"}`,
    background: active ? "rgba(20, 184, 166, 0.15)" : completed ? "rgba(20, 184, 166, 0.05)" : "rgba(255, 255, 255, 0.03)",
    color: active ? "#14b8a6" : completed ? "#5eead4" : "#64748b",
    transition: "all 200ms ease",
  }) as React.CSSProperties,
  card: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  fieldGroup: {
    marginBottom: 20,
  } as React.CSSProperties,
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 32,
  } as React.CSSProperties,
  primaryButton: {
    padding: "12px 28px",
    borderRadius: 8,
    border: "none",
    background: "#14b8a6",
    color: "#0a0f1a",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 200ms ease",
    minWidth: 120,
    minHeight: 44,
  } as React.CSSProperties,
  secondaryButton: {
    padding: "12px 28px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 200ms ease",
    minWidth: 120,
    minHeight: 44,
  } as React.CSSProperties,
  error: {
    color: "#f87171",
    fontSize: "0.82rem",
    marginTop: 6,
  } as React.CSSProperties,
  hint: {
    color: "#5eead4",
    fontSize: "0.85rem",
    marginTop: 12,
    padding: "10px 14px",
    background: "rgba(20, 184, 166, 0.08)",
    borderRadius: 8,
    border: "1px solid rgba(20, 184, 166, 0.2)",
  } as React.CSSProperties,
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  } as React.CSSProperties,
  planCard: (selected: boolean, recommended: boolean) => ({
    background: selected ? "rgba(20, 184, 166, 0.1)" : "rgba(255, 255, 255, 0.03)",
    border: `2px solid ${selected ? "#14b8a6" : recommended ? "rgba(20, 184, 166, 0.3)" : "rgba(148, 163, 184, 0.1)"}`,
    borderRadius: 12,
    padding: 24,
    cursor: "pointer",
    transition: "all 200ms ease",
    position: "relative" as const,
  }) as React.CSSProperties,
  planName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 4px",
  } as React.CSSProperties,
  planPrice: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#14b8a6",
    margin: "0 0 16px",
  } as React.CSSProperties,
  planFeatureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 12px",
  } as React.CSSProperties,
  planFeature: {
    fontSize: "0.82rem",
    color: "#cbd5e1",
    padding: "3px 0",
  } as React.CSSProperties,
  planLimits: {
    fontSize: "0.78rem",
    color: "#64748b",
    borderTop: "1px solid rgba(148, 163, 184, 0.1)",
    paddingTop: 12,
    marginTop: 8,
  } as React.CSSProperties,
  badge: {
    position: "absolute" as const,
    top: -10,
    right: 16,
    background: "#14b8a6",
    color: "#0a0f1a",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
  } as React.CSSProperties,
  toggleLabel: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#f1f5f9",
  } as React.CSSProperties,
  toggleDesc: {
    fontSize: "0.78rem",
    color: "#64748b",
    marginTop: 2,
  } as React.CSSProperties,
  toggle: (active: boolean) => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: active ? "#14b8a6" : "rgba(148, 163, 184, 0.2)",
    border: "none",
    cursor: "pointer",
    position: "relative" as const,
    transition: "background 200ms ease",
    flexShrink: 0,
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    padding: "0 2px",
  }) as React.CSSProperties,
  toggleKnob: (active: boolean) => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 200ms ease",
    transform: active ? "translateX(20px)" : "translateX(0)",
  }) as React.CSSProperties,
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: "0.85rem",
    color: "#94a3b8",
  } as React.CSSProperties,
  summaryValue: {
    fontSize: "0.85rem",
    color: "#f1f5f9",
    fontWeight: 600,
  } as React.CSSProperties,
  codeBlock: {
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: 8,
    padding: 16,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    fontSize: "0.82rem",
    color: "#5eead4",
    overflowX: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    marginBottom: 16,
  } as React.CSSProperties,
  successCard: {
    background: "rgba(20, 184, 166, 0.08)",
    border: "1px solid rgba(20, 184, 166, 0.3)",
    borderRadius: 12,
    padding: 32,
    textAlign: "center" as const,
    marginBottom: 24,
  } as React.CSSProperties,
};

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const stepParam = params.get("step");
    const onboardingId = params.get("onboarding_id");

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

    const planParam = params.get("plan");
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
        setError(json.error?.message ?? "Failed to start checkout");
        setPaymentPending(false);
        return;
      }

      if (json.data.free) {
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

  const handleAdvanceStep = useCallback(async (stepData: Record<string, unknown>) => {
    if (!session) return;
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
        setError(json.error?.message ?? "Failed to advance step");
        return;
      }
      setSession(json.data);

      if (json.data.currentStep === "complete") {
        const currentPlan = PLANS.find((p) => p.id === selectedPlan);
        const isPaidPlan = currentPlan && currentPlan.priceValue > 0;

        if (isPaidPlan) {
          await redirectToStripeCheckout(session.id);
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
  }, [session, selectedPlan, redirectToStripeCheckout]);

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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Launch Your Lead System</h1>
          <p style={styles.subtitle}>Set up your white-label lead generation platform in minutes</p>
        </header>

        {step !== "email" && step !== "complete" && (
          <nav aria-label="Onboarding progress" aria-live="polite" style={styles.stepIndicator}>
            {WIZARD_STEPS.map((s, i) => (
              <span
                key={s}
                style={styles.stepDot(step === s, i < completedStepIndex)}
                aria-current={step === s ? "step" : undefined}
              >
                {i < completedStepIndex ? "\u2713 " : `${i + 1}. `}
                {STEP_LABELS[s]}
              </span>
            ))}
          </nav>
        )}

        {error && (
          <div role="alert" style={{ ...styles.card, borderColor: "rgba(248, 113, 113, 0.3)", background: "rgba(248, 113, 113, 0.08)" }}>
            <p style={{ color: "#f87171", margin: 0, fontSize: "0.9rem" }}>{error}</p>
          </div>
        )}

        {step === "email" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px" }}>
                Get Started
              </h2>
              <div style={styles.fieldGroup}>
                <label htmlFor="email-input" style={styles.label}>Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartOnboarding()}
                  placeholder="you@company.com"
                  style={styles.input}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              <div style={styles.buttonRow}>
                <span />
                <button
                  type="button"
                  onClick={handleStartOnboarding}
                  disabled={loading}
                  style={{ ...styles.primaryButton, opacity: loading ? 0.6 : 1 }}
                  aria-busy={loading}
                >
                  {loading ? "Starting..." : "Start Setup"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "niche" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px" }}>
                Define Your Niche
              </h2>
              <div style={styles.fieldGroup}>
                <label htmlFor="niche-name" style={styles.label}>Niche Name</label>
                <input
                  id="niche-name"
                  type="text"
                  value={niche.name}
                  onChange={(e) => setNiche((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Plumbing Services, Personal Injury Law"
                  style={styles.input}
                  aria-required="true"
                  maxLength={100}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="niche-industry" style={styles.label}>Industry (optional)</label>
                <select
                  id="niche-industry"
                  value={niche.industry}
                  onChange={(e) => setNiche((prev) => ({ ...prev, industry: e.target.value }))}
                  style={styles.select}
                >
                  <option value="">Select an industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1).replace(/-/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="keyword-input" style={styles.label}>Keywords (optional)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="keyword-input"
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Add a keyword"
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button type="button" onClick={addKeyword} style={{ ...styles.secondaryButton, minWidth: 60, padding: "10px 14px" }}>
                    Add
                  </button>
                </div>
                {niche.keywords.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {niche.keywords.map((kw) => (
                      <span key={kw} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 999, fontSize: "0.78rem",
                        background: "rgba(20, 184, 166, 0.15)", color: "#5eead4",
                        border: "1px solid rgba(20, 184, 166, 0.3)",
                      }}>
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          style={{
                            background: "none", border: "none", color: "#5eead4",
                            cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0,
                            minWidth: 20, minHeight: 20,
                          }}
                          aria-label={`Remove keyword ${kw}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.hint} role="status">
                We will auto-generate your lead capture system based on your niche.
              </div>
              <div style={styles.buttonRow}>
                <button type="button" onClick={handleBack} style={styles.secondaryButton} aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({
                    name: niche.name,
                    industry: niche.industry || undefined,
                    keywords: niche.keywords.length > 0 ? niche.keywords : undefined,
                  })}
                  disabled={loading || niche.name.trim().length < 2}
                  style={{ ...styles.primaryButton, opacity: loading || niche.name.trim().length < 2 ? 0.6 : 1 }}
                  aria-busy={loading}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "plan" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px" }}>
                Choose Your Plan
              </h2>
              <div style={styles.planGrid} role="radiogroup" aria-label="Plan selection">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    role="radio"
                    aria-checked={selectedPlan === plan.id}
                    tabIndex={0}
                    onClick={() => setSelectedPlan(plan.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedPlan(plan.id)}
                    style={styles.planCard(selectedPlan === plan.id, plan.recommended)}
                  >
                    {plan.recommended && <span style={styles.badge}>Recommended</span>}
                    <h3 style={styles.planName}>{plan.name}</h3>
                    <p style={styles.planPrice}>{plan.price}</p>
                    <ul style={styles.planFeatureList}>
                      {plan.features.map((f) => (
                        <li key={f} style={styles.planFeature}>{f}</li>
                      ))}
                    </ul>
                    <p style={styles.planLimits}>{plan.limits}</p>
                  </div>
                ))}
              </div>
              <div style={styles.buttonRow}>
                <button type="button" onClick={handleBack} style={styles.secondaryButton} aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({ planId: selectedPlan })}
                  disabled={loading}
                  style={{ ...styles.primaryButton, opacity: loading ? 0.6 : 1 }}
                  aria-busy={loading}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "branding" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px" }}>
                Brand Your Platform
              </h2>
              <div style={styles.fieldGroup}>
                <label htmlFor="brand-name" style={styles.label}>Brand Name</label>
                <input
                  id="brand-name"
                  type="text"
                  value={branding.name}
                  onChange={(e) => setBranding((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Company Name"
                  style={styles.input}
                  aria-required="true"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="brand-accent" style={styles.label}>Accent Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={branding.accent}
                    onChange={(e) => setBranding((prev) => ({ ...prev, accent: e.target.value }))}
                    style={{ width: 44, height: 44, padding: 2, border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 8, background: "transparent", cursor: "pointer" }}
                    aria-label="Accent color picker"
                  />
                  <input
                    id="brand-accent"
                    type="text"
                    value={branding.accent}
                    onChange={(e) => setBranding((prev) => ({ ...prev, accent: e.target.value }))}
                    placeholder="#14b8a6"
                    style={{ ...styles.input, flex: 1 }}
                    maxLength={7}
                  />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="brand-logo" style={styles.label}>Logo URL (optional)</label>
                <input
                  id="brand-logo"
                  type="url"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://yoursite.com/logo.png"
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="brand-site" style={styles.label}>Website URL (optional)</label>
                <input
                  id="brand-site"
                  type="url"
                  value={branding.siteUrl}
                  onChange={(e) => setBranding((prev) => ({ ...prev, siteUrl: e.target.value }))}
                  placeholder="https://yoursite.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="brand-support-email" style={styles.label}>Support Email (optional)</label>
                <input
                  id="brand-support-email"
                  type="email"
                  value={branding.supportEmail}
                  onChange={(e) => setBranding((prev) => ({ ...prev, supportEmail: e.target.value }))}
                  placeholder="support@yoursite.com"
                  style={styles.input}
                  autoComplete="email"
                />
              </div>
              <div style={styles.buttonRow}>
                <button type="button" onClick={handleBack} style={styles.secondaryButton} aria-label="Go back to previous step">Back</button>
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
                  style={{ ...styles.primaryButton, opacity: loading || !branding.name.trim() ? 0.6 : 1 }}
                  aria-busy={loading}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "integrations" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px" }}>
                Enable Integrations
              </h2>
              <div role="group" aria-label="Available integrations">
                {INTEGRATIONS.map((integration) => (
                  <div key={integration.key} style={styles.toggleRow}>
                    <div>
                      <div style={styles.toggleLabel}>{integration.label}</div>
                      <div style={styles.toggleDesc}>{integration.description}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabledProviders.has(integration.key)}
                      aria-label={`Toggle ${integration.label}`}
                      onClick={() => toggleProvider(integration.key)}
                      style={styles.toggle(enabledProviders.has(integration.key))}
                    >
                      <div style={styles.toggleKnob(enabledProviders.has(integration.key))} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={styles.buttonRow}>
                <button type="button" onClick={handleBack} style={styles.secondaryButton} aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({ enabledProviders: [...enabledProviders] })}
                  disabled={loading}
                  style={{ ...styles.primaryButton, opacity: loading ? 0.6 : 1 }}
                  aria-busy={loading}
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "review" && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 24px" }}>
                Review and Launch
              </h2>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Niche</span>
                <span style={styles.summaryValue}>{niche.name}{niche.industry ? ` (${niche.industry})` : ""}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Plan</span>
                <span style={styles.summaryValue}>{PLANS.find((p) => p.id === selectedPlan)?.name ?? selectedPlan} - {PLANS.find((p) => p.id === selectedPlan)?.price ?? ""}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Brand Name</span>
                <span style={styles.summaryValue}>{branding.name}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Accent Color</span>
                <span style={styles.summaryValue}>
                  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: branding.accent, marginRight: 6, verticalAlign: "middle" }} />
                  {branding.accent}
                </span>
              </div>
              {branding.siteUrl && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Website</span>
                  <span style={styles.summaryValue}>{branding.siteUrl}</span>
                </div>
              )}
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Integrations</span>
                <span style={styles.summaryValue}>{[...enabledProviders].join(", ")}</span>
              </div>
              {(() => {
                const currentPlan = PLANS.find((p) => p.id === selectedPlan);
                const isPaidPlan = currentPlan && currentPlan.priceValue > 0;
                return isPaidPlan ? (
                  <div style={styles.hint} role="status">
                    You will be redirected to Stripe to complete payment for the {currentPlan.name} plan ({currentPlan.price}).
                  </div>
                ) : null;
              })()}
              <div style={styles.buttonRow}>
                <button type="button" onClick={handleBack} style={styles.secondaryButton} aria-label="Go back to previous step">Back</button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStep({})}
                  disabled={loading || paymentPending}
                  style={{
                    ...styles.primaryButton,
                    opacity: loading || paymentPending ? 0.6 : 1,
                    padding: "14px 36px",
                    fontSize: "1rem",
                  }}
                  aria-busy={loading || paymentPending}
                >
                  {loading ? "Launching..." : paymentPending ? "Redirecting to payment..." : (() => {
                    const currentPlan = PLANS.find((p) => p.id === selectedPlan);
                    return currentPlan && currentPlan.priceValue > 0 ? "Continue to Payment" : "Launch My Lead System";
                  })()}
                </button>
              </div>
            </div>
          </main>
        )}

        {step === "complete" && loading && (
          <main>
            <div style={styles.successCard}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#14b8a6", margin: "0 0 8px" }}>
                Verifying Payment
              </h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>
                Please wait while we confirm your subscription...
              </p>
            </div>
          </main>
        )}

        {step === "complete" && !loading && session?.provisioningResult && (
          <main>
            <div style={styles.successCard}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#14b8a6", margin: "0 0 8px" }}>
                Your Lead System is Live
              </h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>
                {stripeSessionId
                  ? "Payment confirmed. Your platform has been provisioned and is ready to capture leads."
                  : "Your platform has been provisioned and is ready to capture leads."}
              </p>
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 12px" }}>
                Embed Script
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 12px" }}>
                Add this script to your website to activate lead capture:
              </p>
              <code style={styles.codeBlock}>
                {session.provisioningResult.embedScript}
              </code>
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 12px" }}>
                Dashboard
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 12px" }}>
                Access your operator dashboard to manage leads and settings:
              </p>
              <a
                href={session.provisioningResult.dashboardUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "rgba(20, 184, 166, 0.12)",
                  border: "1px solid rgba(20, 184, 166, 0.3)",
                  color: "#14b8a6",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  minHeight: 44,
                }}
              >
                Open Dashboard
              </a>
            </div>

            <div style={styles.card}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" }}>
                Check Your Email
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
                We sent a login link to <strong style={{ color: "#f1f5f9" }}>{session.email}</strong>. Use it to access your dashboard.
              </p>
            </div>
          </main>
        )}

        {step === "complete" && !loading && session && !session.provisioningResult && !stripeSessionId && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 16px" }}>
                Complete Payment
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 24px" }}>
                Your system is ready to launch. Complete payment to activate your subscription.
              </p>
              <button
                type="button"
                onClick={() => session.id && redirectToStripeCheckout(session.id)}
                disabled={paymentPending}
                style={{ ...styles.primaryButton, opacity: paymentPending ? 0.6 : 1, padding: "14px 36px", fontSize: "1rem" }}
                aria-busy={paymentPending}
              >
                {paymentPending ? "Redirecting to payment..." : "Complete Payment"}
              </button>
            </div>
          </main>
        )}

        {step === "complete" && !loading && !session && (
          <main>
            <div style={styles.card}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 16px" }}>
                Session Expired
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 24px" }}>
                Your onboarding session could not be found. This may happen if the session expired. Please start a new onboarding session or contact support if you already completed payment.
              </p>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); }}
                style={styles.primaryButton}
              >
                Start Over
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
