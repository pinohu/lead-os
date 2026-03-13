"use client";

import { useState, useEffect, useCallback } from "react";
import {
  recommendBlueprintForVisitor,
  getNextFunnelStep,
  interpolateStep,
  detectNicheFromPath,
} from "@/lib/funnel-blueprints";
import type { FunnelStep, FunnelState } from "@/lib/funnel-blueprints";
import { getStoredProfile, trackBrowserEvent, updateStoredProfile } from "@/lib/trace";

function getFunnelState(): FunnelState | null {
  try {
    const raw = localStorage.getItem("nc_funnel_state");
    return raw ? (JSON.parse(raw) as FunnelState) : null;
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

    const profile = getStoredProfile();
    const path = window.location.pathname;
    const detectedNiche = (profile.nicheInterest as string | undefined) ?? detectNicheFromPath(path);
    setNiche(detectedNiche);

    if (path.startsWith("/assess") || path.startsWith("/calculator")) return;

    const pages = ((profile.pagesViewed ?? []) as string[]).length;
    const timeOnSite = (profile.totalTimeOnSite as number | undefined) ?? 0;
    if (pages < 1 && timeOnSite < 15) return;

    const recommendation = recommendBlueprintForVisitor({
      scores: profile.scores ?? { engagement: 0, intent: 0, composite: 0 },
      capturedEmail: profile.email as string | undefined,
      capturedPhone: profile.phone as string | undefined,
      assessmentCompleted: Boolean(profile.assessmentCompleted),
      roiCalculatorUsed: Boolean(profile.roiCalculatorUsed),
      chatEngaged: Boolean(profile.chatEngaged),
      whatsappOptIn: Boolean(profile.whatsappOptIn),
      sessions: parseInt(localStorage.getItem("nc_sessions") ?? "1", 10),
      pagesViewed: (profile.pagesViewed ?? []) as string[],
      nicheInterest: detectedNiche !== "general" ? detectedNiche : undefined,
      funnelStage: profile.funnelStage as string | undefined,
      referralSource: profile.referralSource as string | undefined,
      utmSource: profile.utmSource as string | undefined,
      utmMedium: profile.utmMedium as string | undefined,
    });
    const blueprint = recommendation.blueprint;

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

    const next = getNextFunnelStep(blueprint, state.completedSteps);
    if (!next) return;

    const interpolated = interpolateStep(next, detectedNiche);
    setCurrentStep(interpolated);
    setCtaVisible(true);
    updateStoredProfile({
      activeBlueprint: blueprint.id,
      currentStepId: interpolated.id,
      nicheInterest: detectedNiche,
    });

    trackBrowserEvent({
      type: "decision_generated",
      blueprintId: blueprint.id,
      stepId: next.id,
      niche: detectedNiche,
      data: {
        blueprintName: blueprint.name,
        nextStepId: next.id,
        reason: recommendation.reason,
        temperature: recommendation.temperature,
        objection: recommendation.objection,
        channel: recommendation.channel,
      },
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(evaluateFunnel, 3000);
    return () => clearTimeout(timer);
  }, [evaluateFunnel]);

  useEffect(() => {
    const handleProfileUpdate = () => evaluateFunnel();
    window.addEventListener("nc-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("nc-profile-updated", handleProfileUpdate);
  }, [evaluateFunnel]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") evaluateFunnel();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [evaluateFunnel]);

  const handleCtaClick = () => {
    if (!currentStep) return;

    const state = getFunnelState();
    if (state && !state.completedSteps.includes(currentStep.id)) {
      state.completedSteps.push(currentStep.id);
      state.lastStepAt = new Date().toISOString();
      saveFunnelState(state);
    }

    updateStoredProfile({
      currentStepId: currentStep.id,
      activeBlueprint: state?.activeBlueprint,
    });

    trackBrowserEvent({
      type: "funnel_step_view",
      stepId: currentStep.id,
      niche,
      data: {
        stepType: currentStep.type,
        ctaUrl: currentStep.ctaUrl,
      },
    });
    trackBrowserEvent({
      type: "cta_click",
      stepId: currentStep.id,
      niche,
      data: {
        stepType: currentStep.type,
        ctaUrl: currentStep.ctaUrl,
      },
    });

    if (currentStep.ctaUrl.startsWith("#")) {
      if (currentStep.ctaUrl === "#chat-widget") {
        window.dispatchEvent(new Event("nc-open-chat"));
      }
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

    if (currentStep) {
      const state = getFunnelState();
      if (state) {
        state.abandonedSteps.push(currentStep.id);
        saveFunnelState(state);
      }
    }
  };

  if (!ctaVisible || dismissed || !currentStep) return null;

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
