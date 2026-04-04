"use client";

import { useEffect, useMemo, useState } from "react";
import { buildHeroExperience } from "@/lib/experience-engine";
import {
  ensureVisitorId,
  getStoredProfile,
  trackBrowserEvent,
  updateStoredProfile,
} from "@/lib/trace";

export default function Hero() {
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => setProfileVersion((value) => value + 1);
    window.addEventListener("nc-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("nc-profile-updated", handleProfileUpdate);
  }, []);

  const experience = useMemo(() => {
    void profileVersion;
    const profile = getStoredProfile();
    return buildHeroExperience({
      visitorId: ensureVisitorId(),
      scores: profile.scores ?? { engagement: 0, intent: 0, composite: 0 },
      capturedEmail: typeof profile.email === "string" ? profile.email : undefined,
      capturedPhone: typeof profile.phone === "string" ? profile.phone : undefined,
      assessmentCompleted: Boolean(profile.assessmentCompleted),
      roiCalculatorUsed: Boolean(profile.roiCalculatorUsed),
      chatEngaged: Boolean(profile.chatEngaged),
      whatsappOptIn: Boolean(profile.whatsappOptIn),
      sessions:
        typeof window !== "undefined"
          ? parseInt(localStorage.getItem("nc_sessions") ?? "1", 10)
          : 1,
      pagesViewed: Array.isArray(profile.pagesViewed) ? (profile.pagesViewed as string[]) : [],
      nicheInterest: typeof profile.nicheInterest === "string" ? profile.nicheInterest : undefined,
      funnelStage: typeof profile.funnelStage === "string" ? profile.funnelStage : undefined,
      referralSource: typeof profile.referralSource === "string" ? profile.referralSource : undefined,
      utmSource: typeof profile.utmSource === "string" ? profile.utmSource : undefined,
      utmMedium: typeof profile.utmMedium === "string" ? profile.utmMedium : undefined,
    });
  }, [profileVersion]);

  useEffect(() => {
    updateStoredProfile({
      currentExperimentId: experience.experimentId,
      currentVariantId: experience.variantId,
    });
    trackBrowserEvent({
      type: "hero_impression",
      experimentId: experience.experimentId,
      variantId: experience.variantId,
      data: {
        primaryCta: experience.primaryCta.href,
        secondaryCta: experience.secondaryCta.href,
        headline: experience.headline,
      },
    });
  }, [experience]);

  const trackClick = (slot: "primary" | "secondary") => {
    trackBrowserEvent({
      type: "hero_cta",
      experimentId: experience.experimentId,
      variantId: experience.variantId,
      data: {
        slot,
        href: slot === "primary" ? experience.primaryCta.href : experience.secondaryCta.href,
      },
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-dark via-navy to-navy-light pb-20 pt-28 sm:pb-28 sm:pt-36">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2">
          <svg className="h-4 w-4 text-cyan" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-white/90">{experience.eyebrow}</span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          {experience.headline}
          <br />
          <span className="text-cyan">{experience.highlight}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
          {experience.subheadline}
        </p>

        <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={experience.primaryCta.href}
            onClick={() => trackClick("primary")}
            className="w-full rounded-lg bg-cyan px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-cyan-dark sm:w-auto"
          >
            {experience.primaryCta.label}
          </a>
          <a
            href={experience.secondaryCta.href}
            onClick={() => trackClick("secondary")}
            className="w-full rounded-lg border border-white/30 px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:border-white/60 sm:w-auto"
          >
            {experience.secondaryCta.label}
          </a>
        </div>
        <p className="mb-16 text-sm text-slate-400">{experience.urgencyNote}</p>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {experience.trustBar.map((stat) => (
            <div
              key={stat}
              className="rounded-xl border border-white/15 bg-white/10 px-6 py-5 backdrop-blur-sm"
            >
              <div className="mb-1 text-2xl font-bold text-cyan">AI</div>
              <div className="text-sm text-slate-300">{stat}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
