"use client";

import { useState, useEffect, useCallback } from "react";

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}");
  } catch {
    return {};
  }
}

function updateProfile(updates: Record<string, unknown>) {
  const current = getProfile();
  localStorage.setItem("nc_profile", JSON.stringify({ ...current, ...updates }));
  window.dispatchEvent(new Event("nc-profile-updated"));
}

// Per-page offers based on URL
function getOffer(path: string): { headline: string; subtext: string; cta: string; niche?: string } {
  if (path.includes("re-syndication"))
    return { headline: "Before you go — free Investor Portal Assessment", subtext: "See how your investor experience compares to top syndicators", cta: "Get My Score", niche: "re-syndication" };
  if (path.includes("immigration"))
    return { headline: "Wait — free Case Management Audit", subtext: "Discover how much time your firm is losing to manual processes", cta: "Start My Audit", niche: "immigration-law" };
  if (path.includes("construction"))
    return { headline: "Before you go — free Construction Portal Assessment", subtext: "See how your client communication compares to top contractors", cta: "Get My Score", niche: "construction" };
  if (path.includes("franchise"))
    return { headline: "Wait — free Franchise Operations Audit", subtext: "See how your multi-location management stacks up", cta: "Start My Audit", niche: "franchise" };
  if (path.includes("pricing") || path.includes("services"))
    return { headline: "Not sure which plan fits?", subtext: "Get a free personalized recommendation in 2 minutes", cta: "Get My Recommendation" };
  // Default
  return { headline: "Before you go — free Business Automation Assessment", subtext: "Discover how much time and money you could save with automation", cta: "Get My Free Assessment" };
}

export default function ExitIntent() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY > 10) return; // Only trigger when cursor goes toward top
    const profile = getProfile();
    if (profile.exitIntentShown || profile.email) return; // Don't show if already shown or captured
    const dismissed = sessionStorage.getItem("nc_exit_dismissed");
    if (dismissed) return;

    setVisible(true);
    updateProfile({ exitIntentShown: true });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        type: "exit_intent",
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Don't show on mobile (no mouse leave event)
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;

    // Delay 5 seconds before enabling
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    updateProfile({ email, exitIntentConverted: true });

    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "exit_intent",
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        firstName: email.split("@")[0],
        lastName: ".",
        email,
        company: company || undefined,
        service: offer.niche ?? "general",
        niche: offer.niche ?? "general",
        page: window.location.pathname,
        message: `Exit-intent capture on ${window.location.pathname}. Offer: ${offer.headline}`,
      }),
    }).catch(() => {});

    setSubmitted(true);
    setLoading(false);
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("nc_exit_dismissed", "true");
  };

  const offer = typeof window !== "undefined" ? getOffer(window.location.pathname) : getOffer("");

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button onClick={dismiss}
          className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
          aria-label="Close">
          &times;
        </button>

        {!submitted ? (
          <>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">
              Free Assessment
            </div>
            <h3 className="mb-2 text-2xl font-bold text-navy">{offer.headline}</h3>
            <p className="mb-6 text-gray-600">{offer.subtext}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20" />
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Company name (optional)"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20" />
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-cyan px-6 py-3 font-semibold text-white transition hover:bg-cyan-dark disabled:opacity-50">
                {loading ? "Processing..." : offer.cta}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-400">
              No spam. Unsubscribe anytime.
            </p>
          </>
        ) : (
          <div className="py-4 text-center">
            <div className="mb-4 text-5xl">&#10003;</div>
            <h3 className="mb-2 text-2xl font-bold text-navy">Check your inbox!</h3>
            <p className="text-gray-600">
              Your personalized assessment is on its way. We&apos;ll also send you actionable insights
              specific to your business.
            </p>
            {offer.niche && (
              <a href={`/assess/${offer.niche}`}
                className="mt-4 inline-block rounded-lg bg-cyan px-6 py-3 font-semibold text-white hover:bg-cyan-dark">
                Start Interactive Assessment Now
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
