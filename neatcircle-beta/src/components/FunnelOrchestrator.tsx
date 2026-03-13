"use client";

import { useState, useEffect, useCallback } from "react";
import {
  recommendBlueprintForVisitor,
  getNextFunnelStep,
  interpolateStep,
  detectNicheFromPath,
} from "@/lib/funnel-blueprints";
import type { FunnelStep, FunnelState } from "@/lib/funnel-blueprints";

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}");
  } catch {
    return {};
  }
}

function getFunnelState(): FunnelState | null {
  try {
    const raw = localStorage.getItem("nc_funnel_state");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFunnelState(state: FunnelState) {
  localStorage.setItem("nc_funnel_state", JSON.stringify(state));
}

export default function FunnelOrchestrator() {
  const [ctaVisible, setCtaVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<FunnelStep | null>(null);
  const [niche, setNiche] = useState("general");
  const [dismissed, setDismissed] = useState(false);

  const evaluateFunnel = useCallback(() => {
    if (typeof window === "undefined") return;

    const profile = getProfile();
    const path = window.location.pathname;
    const detectedNiche = profile.nicheInterest ?? detectNicheFromPath(path);
    setNiche(detectedNiche);

    // Don't show funnel CTA on assessment or calculator pages (they ARE the funnel)
    if (path.startsWith("/assess") || path.startsWith("/calculator")) return;

    // Don't show if just arrived (wait for some engagement)
    const pages = profile.pagesViewed?.length ?? 0;
    const timeOnSite = profile.totalTimeOnSite ?? 0;
    if (pages < 1 && timeOnSite < 15) return;

    // Select blueprint based on visitor profile
    const recommendation = recommendBlueprintForVisitor({
      scores: profile.scores ?? { engagement: 0, intent: 0, composite: 0 },
      capturedEmail: profile.email,
      capturedPhone: profile.phone,
      assessmentCompleted: profile.assessmentCompleted,
      roiCalculatorUsed: profile.roiCalculatorUsed,
      chatEngaged: profile.chatEngaged,
      whatsappOptIn: profile.whatsappOptIn,
      sessions: parseInt(localStorage.getItem("nc_sessions") ?? "1", 10),
      pagesViewed: profile.pagesViewed ?? [],
      nicheInterest: detectedNiche !== "general" ? detectedNiche : undefined,
      funnelStage: profile.funnelStage,
      referralSource: profile.referralSource,
      utmSource: profile.utmSource,
      utmMedium: profile.utmMedium,
    });
    const blueprint = recommendation.blueprint;

    // Get or create funnel state
    let state = getFunnelState();
    if (!state || state.activeBlueprint !== blueprint.id) {
      state = {
        activeBlueprint: blueprint.id,
        currentStepIndex: 0,
        completedSteps: [],
        abandonedSteps: [],
        startedAt: new Date().toISOString(),
        lastStepAt: new Date().toISOString(),
      };
      saveFunnelState(state);
    }

    // Mark completed steps based on profile state
    if (profile.assessmentCompleted && !state.completedSteps.includes("audit-quiz")) {
      state.completedSteps.push("audit-quiz", "audit-capture", "audit-results");
    }
    if (profile.roiCalculatorUsed && !state.completedSteps.includes("audit-upsell")) {
      state.completedSteps.push("audit-upsell");
    }
    if (profile.email && !state.completedSteps.includes("lg-capture")) {
      state.completedSteps.push("lg-capture", "bb-capture", "cb-capture");
    }
    saveFunnelState(state);

    // Find next step
    const next = getNextFunnelStep(blueprint, state.completedSteps);
    if (next) {
      const interpolated = interpolateStep(next, detectedNiche);
      setCurrentStep(interpolated);
      setCtaVisible(true);
    }

    // Track blueprint selection
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        type: "cta_click",
        page: path,
        data: {
          blueprintId: blueprint.id,
          blueprintName: blueprint.name,
          nextStepId: next?.id,
          niche: detectedNiche,
          reason: recommendation.reason,
          temperature: recommendation.temperature,
          objection: recommendation.objection,
          channel: recommendation.channel,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Evaluate after a short delay to let BehavioralTracker set profile
    const timer = setTimeout(evaluateFunnel, 3000);
    return () => clearTimeout(timer);
  }, [evaluateFunnel]);

  useEffect(() => {
    const handleProfileUpdate = () => evaluateFunnel();
    window.addEventListener("nc-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("nc-profile-updated", handleProfileUpdate);
  }, [evaluateFunnel]);

  // Re-evaluate when page visibility changes (tab switch back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        evaluateFunnel();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [evaluateFunnel]);

  const handleCtaClick = () => {
    if (!currentStep) return;

    // Mark step as completed
    const state = getFunnelState();
    if (state && !state.completedSteps.includes(currentStep.id)) {
      state.completedSteps.push(currentStep.id);
      state.lastStepAt = new Date().toISOString();
      saveFunnelState(state);
    }

    // Track the CTA click
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        type: "cta_click",
        page: window.location.pathname,
        data: {
          stepId: currentStep.id,
          stepType: currentStep.type,
          ctaUrl: currentStep.ctaUrl,
          niche,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    // Navigate
    if (currentStep.ctaUrl.startsWith("#")) {
      const el = document.querySelector(currentStep.ctaUrl);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      setCtaVisible(false);
    } else {
      window.location.href = currentStep.ctaUrl;
    }
  };

  const dismiss = () => {
    setDismissed(true);
    setCtaVisible(false);

    // Track abandonment
    if (currentStep) {
      const state = getFunnelState();
      if (state) {
        state.abandonedSteps.push(currentStep.id);
        saveFunnelState(state);
      }
    }
  };

  if (!ctaVisible || dismissed || !currentStep) return null;

  // Determine CTA style based on step type
  const isHighUrgency = currentStep.type === "booking" || currentStep.type === "offer";
  const bgColor = isHighUrgency ? "bg-cyan" : "bg-navy";
  const position = currentStep.type === "upsell" ? "top-20" : "bottom-24";

  return (
    <div className={`fixed ${position} left-1/2 z-[9996] w-full max-w-md -translate-x-1/2 px-4`}>
      <div className={`${bgColor} relative rounded-xl p-4 shadow-2xl`}>
        <button
          onClick={dismiss}
          className="absolute right-2 top-2 text-white/60 hover:text-white"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              {currentStep.type === "assessment" ? "Recommended for You" : "Next Step"}
            </p>
            <p className="text-sm font-semibold text-white">{currentStep.headline}</p>
            <p className="text-xs text-white/80">{currentStep.subtext}</p>
          </div>
          <button
            onClick={handleCtaClick}
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-bold text-navy transition hover:bg-gray-100"
          >
            {currentStep.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
