"use client";

/**
 * DynastyLandingPage
 *
 * Renders a full conversion landing page from a DynastyLandingConfig object.
 * All sections are self-contained sub-components defined in this file.
 *
 * Usage:
 *   import { DynastyLandingPage } from "@/components/DynastyLandingPage";
 *   import type { DynastyLandingConfig } from "@/lib/dynasty-landing-engine";
 *
 *   const config: DynastyLandingConfig = { ... };
 *   <DynastyLandingPage config={config} />
 */

import { useEffect, useRef, useState } from "react";
import type {
  DynastyLandingConfig,
  Feature,
  FaqItem,
  FinalCtaSection,
  FooterSection,
  HeroSection,
  HowItWorksSection,
  ObjectionsSection,
  ProblemSection,
  SocialProofSection,
  SolutionSection,
  Testimonial,
  Theme,
} from "../lib/dynasty-landing-engine.ts";

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

interface ThemeColors {
  bg: string;
  surface: string;
  surfaceLight: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
}

function buildThemeColors(theme: Theme): ThemeColors {
  const base =
    theme.variant === "dark"
      ? {
          bg: "#0a0f1a",
          surface: "#111827",
          surfaceLight: "#1a2332",
          text: "#f1f5f9",
          textMuted: "#94a3b8",
          textDim: "#64748b",
          border: "#1e293b",
        }
      : {
          bg: "#ffffff",
          surface: "#f8fafc",
          surfaceLight: "#f1f5f9",
          text: "#0f172a",
          textMuted: "#475569",
          textDim: "#94a3b8",
          border: "#e2e8f0",
        };

  // Convert hex accent to rgba for the glow. Handles 6-digit hex only.
  const hexToRgba = (hex: string, alpha: number): string => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return {
    ...base,
    accent: theme.accent,
    accentHover: theme.accentHover,
    accentGlow: hexToRgba(theme.accent, 0.25),
  };
}

// ---------------------------------------------------------------------------
// Scroll-reveal hook
// ---------------------------------------------------------------------------

function useScrollReveal(prefersReducedMotion: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return { ref, isVisible };
}

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

function revealStyle(
  isVisible: boolean,
  prefersReducedMotion: boolean,
): React.CSSProperties {
  if (prefersReducedMotion) return {};
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.55s ease, transform 0.55s ease",
  };
}

const FONT_STACK = "'Outfit', system-ui, -apple-system, sans-serif";

// ---------------------------------------------------------------------------
// SkipToContent
// ---------------------------------------------------------------------------

function SkipToContent({ colors }: { colors: ThemeColors }) {
  return (
    <a
      href="#main-content"
      className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden z-[9999] text-white py-3 px-6 font-bold text-base no-underline rounded-br-lg focus:left-0 focus:w-auto focus:h-auto"
      style={{ background: colors.accent, fontFamily: FONT_STACK }}
    >
      Skip to main content
    </a>
  );
}

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------

interface HeroSectionProps {
  hero: HeroSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function HeroSection({ hero, colors, prefersReducedMotion }: HeroSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <header
      id="hero"
      aria-labelledby="hero-headline"
      className="relative overflow-hidden text-center"
      style={{
        background: colors.bg,
        padding: "clamp(64px, 10vw, 120px) clamp(16px, 5vw, 80px)",
      }}
    >
      {/* Decorative gradient orb */}
      <div
        aria-hidden="true"
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none z-0"
        style={{
          width: "clamp(400px, 70vw, 900px)",
          height: "clamp(400px, 70vw, 900px)",
          background: `radial-gradient(circle, ${colors.accentGlow} 0%, transparent 70%)`,
        }}
      />

      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative z-[1] max-w-[860px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        {hero.eyebrow && (
          <p
            className="inline-block mb-5 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-[0.06em] uppercase"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.surfaceLight,
              color: colors.accent,
              fontFamily: FONT_STACK,
            }}
          >
            {hero.eyebrow}
          </p>
        )}

        <h1
          id="hero-headline"
          className="mb-6 font-extrabold leading-[1.1] -tracking-[0.02em]"
          style={{
            fontSize: "clamp(36px, 5.5vw, 64px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {hero.headline}
        </h1>

        <p
          className="mb-10 leading-relaxed max-w-[680px] mx-auto"
          style={{
            fontSize: "clamp(17px, 2.2vw, 22px)",
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
        >
          {hero.subheadline}
        </p>

        {/* CTA row */}
        <div className="flex flex-wrap gap-4 justify-center items-center mb-12">
          <div className="text-center">
            <a
              href={hero.primaryCta.url}
              className="inline-block py-4 px-10 min-h-[44px] min-w-[44px] text-white rounded-[10px] text-lg font-bold no-underline"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
                fontFamily: FONT_STACK,
                boxShadow: `0 4px 24px ${colors.accentGlow}`,
                transition: prefersReducedMotion
                  ? "none"
                  : "transform 0.18s ease, box-shadow 0.18s ease",
              }}
              onMouseEnter={(e) => {
                if (prefersReducedMotion) return;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 32px ${colors.accentGlow}`;
              }}
              onMouseLeave={(e) => {
                if (prefersReducedMotion) return;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 24px ${colors.accentGlow}`;
              }}
            >
              {hero.primaryCta.text}
            </a>
            {hero.primaryCta.subtext && (
              <p
                className="mt-2 text-[13px]"
                style={{ color: colors.textDim, fontFamily: FONT_STACK }}
              >
                {hero.primaryCta.subtext}
              </p>
            )}
          </div>

          {hero.secondaryCta && (
            <a
              href={hero.secondaryCta.url}
              className="inline-block py-4 px-10 min-h-[44px] min-w-[44px] bg-transparent rounded-[10px] text-lg font-semibold no-underline"
              style={{
                color: colors.text,
                fontFamily: FONT_STACK,
                border: `2px solid ${colors.border}`,
                transition: prefersReducedMotion
                  ? "none"
                  : "border-color 0.18s ease, color 0.18s ease",
              }}
              onMouseEnter={(e) => {
                if (prefersReducedMotion) return;
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.color = colors.accent;
              }}
              onMouseLeave={(e) => {
                if (prefersReducedMotion) return;
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.text;
              }}
            >
              {hero.secondaryCta.text}
            </a>
          )}
        </div>

        {/* Trust bar */}
        {hero.trustBar.length > 0 && (
          <ul
            aria-label="Trust indicators"
            className="flex flex-wrap justify-center items-center list-none m-0 p-0"
            style={{ gap: "clamp(16px, 3vw, 40px)" }}
          >
            {hero.trustBar.map((item, i) => (
              <li key={i} className="flex flex-col items-center gap-1">
                <span
                  className="font-extrabold leading-none"
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 28px)",
                    color: colors.accent,
                    fontFamily: FONT_STACK,
                  }}
                >
                  {item.value}
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// ProblemSection
// ---------------------------------------------------------------------------

interface ProblemSectionProps {
  problem: ProblemSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function ProblemSection({
  problem,
  colors,
  prefersReducedMotion,
}: ProblemSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      style={{ background: colors.surface, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[1100px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="problem-heading"
          className="text-center mb-12 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {problem.headline}
        </h2>

        {/* Pain point cards */}
        <ul
          aria-label="Common pain points"
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 list-none mb-10 p-0"
        >
          {problem.painPoints.map((point, i) => (
            <li
              key={i}
              className="rounded-xl p-6"
              style={{
                background: colors.surfaceLight,
                border: `1px solid ${colors.border}`,
              }}
            >
              <p
                className="inline-block mb-3 px-2.5 py-0.5 rounded-md bg-red-500/[0.12] text-destructive text-xs font-bold tracking-[0.05em] uppercase"
                style={{ fontFamily: FONT_STACK }}
              >
                {point.emotion}
              </p>
              <p
                className="m-0 text-base leading-relaxed"
                style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
              >
                {point.scenario}
              </p>
            </li>
          ))}
        </ul>

        {/* Agitation callout */}
        <div
          role="note"
          className="border-l-4 border-destructive bg-red-500/[0.07] rounded-r-[10px] py-5 px-6 max-w-[760px] mx-auto"
        >
          <p
            className="m-0 text-[17px] leading-[1.65]"
            style={{ color: colors.text, fontFamily: FONT_STACK }}
          >
            <span aria-hidden="true" className="mr-2">
              ⚠️
            </span>
            {problem.agitation}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SolutionSection
// ---------------------------------------------------------------------------

interface SolutionSectionProps {
  solution: SolutionSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function SolutionSection({
  solution,
  colors,
  prefersReducedMotion,
}: SolutionSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="solution"
      aria-labelledby="solution-heading"
      className="text-center"
      style={{
        background: colors.bg,
        padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)",
      }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[760px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="solution-heading"
          className="mb-6 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {solution.headline}
        </h2>

        <p
          className="mb-8 leading-[1.7]"
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
        >
          {solution.description}
        </p>

        <p
          className="inline-block py-2.5 px-6 rounded-full bg-green-500/[0.12] border border-green-500/30 text-green-500 text-base font-bold"
          style={{ fontFamily: FONT_STACK }}
        >
          <span aria-hidden="true" className="mr-2">
            ✓
          </span>
          {solution.transformation}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HowItWorksSection
// ---------------------------------------------------------------------------

interface HowItWorksSectionProps {
  howItWorks: HowItWorksSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function HowItWorksSection({
  howItWorks,
  colors,
  prefersReducedMotion,
}: HowItWorksSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      style={{ background: colors.surface, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[1100px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="how-it-works-heading"
          className="text-center mb-14 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {howItWorks.headline}
        </h2>

        <ol
          aria-label="How it works steps"
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 list-none m-0 p-0"
        >
          {howItWorks.steps.map((step, i) => (
            <li
              key={i}
              className="rounded-2xl py-8 px-7 flex flex-col gap-4"
              style={{
                background: colors.surfaceLight,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Number badge */}
              <div className="flex items-center gap-3">
                <span
                  aria-label={`Step ${step.number}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-[15px] font-extrabold shrink-0"
                  style={{ background: colors.accent, fontFamily: FONT_STACK }}
                >
                  {step.number}
                </span>
                <span aria-hidden="true" className="text-[28px] leading-none">
                  {step.icon}
                </span>
              </div>
              <h3
                className="m-0 text-xl font-bold"
                style={{ color: colors.text, fontFamily: FONT_STACK }}
              >
                {step.title}
              </h3>
              <p
                className="m-0 text-[15px] leading-[1.65]"
                style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
              >
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FeaturesSection
// ---------------------------------------------------------------------------

interface FeaturesSectionProps {
  features: Feature[];
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function FeaturesSection({
  features,
  colors,
  prefersReducedMotion,
}: FeaturesSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      style={{ background: colors.bg, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[1100px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="features-heading"
          className="text-center mb-14 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          Everything you need
        </h2>

        <ul
          aria-label="Features"
          className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 list-none m-0 p-0"
        >
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              feature={feature}
              colors={colors}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function FeatureCard({ feature, colors, prefersReducedMotion }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      className="rounded-[14px] p-7"
      style={{
        background: colors.surface,
        border: `1px solid ${hovered ? colors.accent : colors.border}`,
        transition: prefersReducedMotion ? "none" : "border-color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span aria-hidden="true" className="block text-[32px] mb-4 leading-none">
        {feature.icon}
      </span>
      <h3
        className="mb-2.5 text-lg font-bold"
        style={{ color: colors.text, fontFamily: FONT_STACK }}
      >
        {feature.title}
      </h3>
      <p
        className="m-0 text-[15px] leading-[1.65]"
        style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
      >
        {feature.benefit}
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// SocialProofSection
// ---------------------------------------------------------------------------

interface SocialProofSectionProps {
  socialProof: SocialProofSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span aria-label={`${clamped} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`text-base ${i < clamped ? "text-yellow-400" : "text-slate-300"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function TestimonialCard({
  testimonial,
  colors,
}: {
  testimonial: Testimonial;
  colors: ThemeColors;
}) {
  return (
    <li
      className="rounded-[14px] p-7 flex flex-col gap-4"
      style={{
        background: colors.surfaceLight,
        border: `1px solid ${colors.border}`,
      }}
    >
      <StarRating rating={testimonial.rating} />
      <blockquote className="m-0 p-0 relative">
        <span
          aria-hidden="true"
          className="absolute -top-2 -left-1 text-5xl leading-none opacity-25 font-serif"
          style={{ color: colors.accent }}
        >
          &ldquo;
        </span>
        <p
          className="m-0 pt-4 text-[15px] leading-[1.7] italic"
          style={{ color: colors.text, fontFamily: FONT_STACK }}
        >
          {testimonial.quote}
        </p>
      </blockquote>
      <footer className="mt-auto">
        <p
          className="m-0 font-bold text-sm"
          style={{ color: colors.text, fontFamily: FONT_STACK }}
        >
          {testimonial.name}
        </p>
        <p
          className="mt-0.5 text-[13px]"
          style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
        >
          {testimonial.title}
        </p>
      </footer>
    </li>
  );
}

function SocialProofSection({
  socialProof,
  colors,
  prefersReducedMotion,
}: SocialProofSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="social-proof"
      aria-labelledby="social-proof-heading"
      style={{ background: colors.surface, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[1100px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="social-proof-heading"
          className="text-center mb-12 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {socialProof.headline}
        </h2>

        {/* Stats bar */}
        {socialProof.stats.length > 0 && (
          <ul
            aria-label="Key statistics"
            className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 list-none mb-14 p-6 rounded-2xl"
            style={{
              background: colors.surfaceLight,
              border: `1px solid ${colors.border}`,
            }}
          >
            {socialProof.stats.map((stat, i) => (
              <li key={i} className="text-center py-2">
                <p
                  className="mb-1 font-extrabold leading-none"
                  style={{
                    fontSize: "clamp(24px, 3vw, 36px)",
                    color: colors.accent,
                    fontFamily: FONT_STACK,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="m-0 text-sm"
                  style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
                >
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Testimonials */}
        <ul
          aria-label="Customer testimonials"
          className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 list-none m-0 p-0"
        >
          {socialProof.testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} colors={colors} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ObjectionsSection (native details/summary — no JS accordion)
// ---------------------------------------------------------------------------

interface ObjectionsSectionProps {
  objections: ObjectionsSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function FaqItemRow({
  item,
  colors,
}: {
  item: FaqItem;
  colors: ThemeColors;
}) {
  return (
    <details
      className="rounded-xl overflow-hidden"
      style={{
        background: colors.surfaceLight,
        border: `1px solid ${colors.border}`,
      }}
    >
      <summary
        className="flex justify-between items-center py-5 px-6 cursor-pointer list-none text-[17px] font-semibold min-h-[44px] gap-4 select-none"
        style={{ color: colors.text, fontFamily: FONT_STACK }}
      >
        <span>{item.question}</span>
        <span
          aria-hidden="true"
          className="faq-chevron shrink-0 inline-block w-5 h-5 rotate-45 transition-transform duration-[250ms] ease-in-out mb-1"
          style={{
            borderRight: `2px solid ${colors.textMuted}`,
            borderBottom: `2px solid ${colors.textMuted}`,
          }}
        />
      </summary>
      <div
        className="px-6 pb-5 text-[15px] leading-[1.7]"
        style={{ color: colors.textMuted, fontFamily: FONT_STACK }}
      >
        {item.answer}
      </div>
    </details>
  );
}

function ObjectionsSection({
  objections,
  colors,
  prefersReducedMotion,
}: ObjectionsSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      style={{ background: colors.bg, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[760px] mx-auto"
        style={revealStyle(isVisible, prefersReducedMotion)}
      >
        <h2
          id="faq-heading"
          className="text-center mb-12 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {objections.headline}
        </h2>

        <div
          className="flex flex-col gap-3"
          role="list"
          aria-label="Frequently asked questions"
        >
          {objections.faq.map((item, i) => (
            <div key={i} role="listitem">
              <FaqItemRow item={item} colors={colors} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FinalCtaSection
// ---------------------------------------------------------------------------

interface FinalCtaSectionProps {
  finalCta: FinalCtaSection;
  colors: ThemeColors;
  prefersReducedMotion: boolean;
}

function FinalCtaSection({
  finalCta,
  colors,
  prefersReducedMotion,
}: FinalCtaSectionProps) {
  const { ref, isVisible } = useScrollReveal(prefersReducedMotion);

  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      style={{ background: colors.surface, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)" }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="max-w-[760px] mx-auto rounded-[20px] text-center"
        style={{
          background: colors.surfaceLight,
          border: `1px solid ${colors.border}`,
          padding: "clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)",
          boxShadow: `0 0 80px ${colors.accentGlow}`,
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="final-cta-heading"
          className="mb-5 font-extrabold -tracking-[0.02em]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {finalCta.headline}
        </h2>

        <p
          className="mb-8 leading-[1.65]"
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
        >
          {finalCta.subheadline}
        </p>

        {/* Urgency */}
        <p
          className="inline-flex items-center gap-2 mb-8 py-2 px-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-semibold"
          style={{ fontFamily: FONT_STACK }}
        >
          <span aria-hidden="true">🕐</span>
          {finalCta.urgency}
        </p>

        <div className="mb-6">
          <a
            href={finalCta.primaryCta.url}
            className="inline-block py-[18px] px-12 min-h-[44px] min-w-[44px] text-white rounded-[10px] text-lg font-bold no-underline"
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
              fontFamily: FONT_STACK,
              boxShadow: `0 4px 24px ${colors.accentGlow}`,
              transition: prefersReducedMotion
                ? "none"
                : "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              if (prefersReducedMotion) return;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 32px ${colors.accentGlow}`;
            }}
            onMouseLeave={(e) => {
              if (prefersReducedMotion) return;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 24px ${colors.accentGlow}`;
            }}
          >
            {finalCta.primaryCta.text}
          </a>
        </div>

        <p
          className="m-0 text-sm"
          style={{ color: colors.textDim, fontFamily: FONT_STACK }}
        >
          <span aria-hidden="true" className="mr-1.5">
            🛡️
          </span>
          {finalCta.guarantee}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FooterSection
// ---------------------------------------------------------------------------

interface FooterSectionProps {
  footer: FooterSection;
  colors: ThemeColors;
}

function FooterSection({ footer, colors }: FooterSectionProps) {
  return (
    <footer
      aria-label={`${footer.brandName} site footer`}
      className="text-center"
      style={{
        background: colors.bg,
        borderTop: `1px solid ${colors.border}`,
        padding: "32px clamp(16px, 5vw, 80px)",
      }}
    >
      {footer.badges.length > 0 && (
        <ul
          aria-label="Trust badges"
          className="flex flex-wrap gap-3 justify-center list-none mb-5 p-0"
        >
          {footer.badges.map((badge, i) => (
            <li
              key={i}
              className="py-1 px-3.5 rounded-md text-xs font-semibold tracking-[0.04em] uppercase"
              style={{
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
                fontFamily: FONT_STACK,
              }}
            >
              {badge}
            </li>
          ))}
        </ul>
      )}

      <p
        className="m-0 text-[13px]"
        style={{ color: colors.textDim, fontFamily: FONT_STACK }}
      >
        {footer.copyright}
      </p>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Focus-visible global style injection
// ---------------------------------------------------------------------------

const FOCUS_VISIBLE_CSS = `
  *:focus-visible {
    outline: 3px solid var(--dynasty-accent);
    outline-offset: 3px;
    border-radius: 4px;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }
  details[open] .faq-chevron {
    transform: rotate(225deg);
    margin-bottom: 0;
    margin-top: 4px;
  }
`;

function GlobalStyles({ accent }: { accent: string }) {
  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled static CSS only
      dangerouslySetInnerHTML={{
        __html: FOCUS_VISIBLE_CSS.replace(
          "var(--dynasty-accent)",
          accent,
        ),
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

interface DynastyLandingPageProps {
  config: DynastyLandingConfig;
}

export function DynastyLandingPage({ config }: DynastyLandingPageProps) {
  const colors = buildThemeColors(config.theme);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Load Outfit font and detect prefers-reduced-motion on mount
  useEffect(() => {
    // Reduced motion detection
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handleChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handleChange);

    // Font injection — only inject once
    const FONT_ID = "dynasty-outfit-font";
    if (!document.getElementById(FONT_ID)) {
      const link = document.createElement("link");
      link.id = FONT_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }

    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const sharedProps = { colors, prefersReducedMotion };

  return (
    <>
      <GlobalStyles accent={colors.accent} />
      <SkipToContent colors={colors} />

      <div
        className="min-h-screen"
        style={{
          background: colors.bg,
          color: colors.text,
          fontFamily: FONT_STACK,
        }}
      >
        <div tabIndex={-1} className="outline-none">
          <HeroSection hero={config.hero} {...sharedProps} />
          <ProblemSection problem={config.problem} {...sharedProps} />
          <SolutionSection solution={config.solution} {...sharedProps} />
          <HowItWorksSection howItWorks={config.howItWorks} {...sharedProps} />
          <FeaturesSection features={config.features} {...sharedProps} />
          <SocialProofSection socialProof={config.socialProof} {...sharedProps} />
          <ObjectionsSection objections={config.objections} {...sharedProps} />
          <FinalCtaSection finalCta={config.finalCta} {...sharedProps} />
        </div>

        <FooterSection footer={config.footer} colors={colors} />
      </div>
    </>
  );
}
