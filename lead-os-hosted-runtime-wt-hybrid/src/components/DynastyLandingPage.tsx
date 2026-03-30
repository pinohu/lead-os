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

import { useCallback, useEffect, useRef, useState } from "react";
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
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        zIndex: 9999,
        background: colors.accent,
        color: "#fff",
        padding: "12px 24px",
        fontFamily: FONT_STACK,
        fontWeight: 700,
        fontSize: "16px",
        textDecoration: "none",
        borderRadius: "0 0 8px 0",
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.left = "0";
        el.style.width = "auto";
        el.style.height = "auto";
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.left = "-9999px";
        el.style.width = "1px";
        el.style.height = "1px";
      }}
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
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.bg,
        padding: "clamp(64px, 10vw, 120px) clamp(16px, 5vw, 80px)",
        textAlign: "center",
      }}
    >
      {/* Decorative gradient orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(400px, 70vw, 900px)",
          height: "clamp(400px, 70vw, 900px)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accentGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "860px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        {hero.eyebrow && (
          <p
            style={{
              display: "inline-block",
              margin: "0 0 20px",
              padding: "6px 16px",
              borderRadius: "99px",
              border: `1px solid ${colors.border}`,
              background: colors.surfaceLight,
              color: colors.accent,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: FONT_STACK,
            }}
          >
            {hero.eyebrow}
          </p>
        )}

        <h1
          id="hero-headline"
          style={{
            margin: "0 0 24px",
            fontSize: "clamp(36px, 5.5vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {hero.headline}
        </h1>

        <p
          style={{
            margin: "0 0 40px",
            fontSize: "clamp(17px, 2.2vw, 22px)",
            lineHeight: 1.6,
            color: colors.textMuted,
            fontFamily: FONT_STACK,
            maxWidth: "680px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {hero.subheadline}
        </p>

        {/* CTA row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "48px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <a
              href={hero.primaryCta.url}
              style={{
                display: "inline-block",
                padding: "16px 40px",
                minHeight: "44px",
                minWidth: "44px",
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
                color: "#fff",
                borderRadius: "10px",
                fontFamily: FONT_STACK,
                fontSize: "18px",
                fontWeight: 700,
                textDecoration: "none",
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
                style={{
                  margin: "8px 0 0",
                  fontSize: "13px",
                  color: colors.textDim,
                  fontFamily: FONT_STACK,
                }}
              >
                {hero.primaryCta.subtext}
              </p>
            )}
          </div>

          {hero.secondaryCta && (
            <a
              href={hero.secondaryCta.url}
              style={{
                display: "inline-block",
                padding: "16px 40px",
                minHeight: "44px",
                minWidth: "44px",
                background: "transparent",
                color: colors.text,
                borderRadius: "10px",
                fontFamily: FONT_STACK,
                fontSize: "18px",
                fontWeight: 600,
                textDecoration: "none",
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
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "clamp(16px, 3vw, 40px)",
              justifyContent: "center",
              alignItems: "center",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {hero.trustBar.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 28px)",
                    fontWeight: 800,
                    color: colors.accent,
                    fontFamily: FONT_STACK,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: colors.textMuted,
                    fontFamily: FONT_STACK,
                  }}
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
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="problem-heading"
          style={{
            textAlign: "center",
            margin: "0 0 48px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {problem.headline}
        </h2>

        {/* Pain point cards */}
        <ul
          aria-label="Common pain points"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            listStyle: "none",
            margin: "0 0 40px",
            padding: 0,
          }}
        >
          {problem.painPoints.map((point, i) => (
            <li
              key={i}
              style={{
                background: colors.surfaceLight,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  display: "inline-block",
                  margin: "0 0 12px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: "rgba(239,68,68,0.12)",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: FONT_STACK,
                }}
              >
                {point.emotion}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  lineHeight: 1.6,
                  color: colors.textMuted,
                  fontFamily: FONT_STACK,
                }}
              >
                {point.scenario}
              </p>
            </li>
          ))}
        </ul>

        {/* Agitation callout */}
        <div
          role="note"
          style={{
            borderLeft: "4px solid #ef4444",
            background: "rgba(239,68,68,0.07)",
            borderRadius: "0 10px 10px 0",
            padding: "20px 24px",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "17px",
              lineHeight: 1.65,
              color: colors.text,
              fontFamily: FONT_STACK,
            }}
          >
            <span aria-hidden="true" style={{ marginRight: "8px" }}>
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
      style={{
        background: colors.bg,
        padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 80px)",
        textAlign: "center",
      }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="solution-heading"
          style={{
            margin: "0 0 24px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {solution.headline}
        </h2>

        <p
          style={{
            margin: "0 0 32px",
            fontSize: "clamp(16px, 1.8vw, 19px)",
            lineHeight: 1.7,
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
        >
          {solution.description}
        </p>

        <p
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: "99px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: FONT_STACK,
          }}
        >
          <span aria-hidden="true" style={{ marginRight: "8px" }}>
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
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="how-it-works-heading"
          style={{
            textAlign: "center",
            margin: "0 0 56px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {howItWorks.headline}
        </h2>

        <ol
          aria-label="How it works steps"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "32px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {howItWorks.steps.map((step, i) => (
            <li
              key={i}
              style={{
                background: colors.surfaceLight,
                border: `1px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Number badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  aria-label={`Step ${step.number}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: colors.accent,
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 800,
                    fontFamily: FONT_STACK,
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </span>
                <span
                  aria-hidden="true"
                  style={{ fontSize: "28px", lineHeight: 1 }}
                >
                  {step.icon}
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: colors.text,
                  fontFamily: FONT_STACK,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: 1.65,
                  color: colors.textMuted,
                  fontFamily: FONT_STACK,
                }}
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
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="features-heading"
          style={{
            textAlign: "center",
            margin: "0 0 56px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          Everything you need
        </h2>

        <ul
          aria-label="Features"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
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
      style={{
        background: colors.surface,
        border: `1px solid ${hovered ? colors.accent : colors.border}`,
        borderRadius: "14px",
        padding: "28px",
        transition: prefersReducedMotion ? "none" : "border-color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        aria-hidden="true"
        style={{
          display: "block",
          fontSize: "32px",
          marginBottom: "16px",
          lineHeight: 1,
        }}
      >
        {feature.icon}
      </span>
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: "18px",
          fontWeight: 700,
          color: colors.text,
          fontFamily: FONT_STACK,
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          lineHeight: 1.65,
          color: colors.textMuted,
          fontFamily: FONT_STACK,
        }}
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
          style={{ color: i < clamped ? "#fbbf24" : "#cbd5e1", fontSize: "16px" }}
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
      style={{
        background: colors.surfaceLight,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <StarRating rating={testimonial.rating} />
      <blockquote
        style={{
          margin: 0,
          padding: 0,
          position: "relative",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-8px",
            left: "-4px",
            fontSize: "48px",
            lineHeight: 1,
            color: colors.accent,
            opacity: 0.25,
            fontFamily: "Georgia, serif",
          }}
        >
          "
        </span>
        <p
          style={{
            margin: 0,
            paddingTop: "16px",
            fontSize: "15px",
            lineHeight: 1.7,
            color: colors.text,
            fontFamily: FONT_STACK,
            fontStyle: "italic",
          }}
        >
          {testimonial.quote}
        </p>
      </blockquote>
      <footer style={{ marginTop: "auto" }}>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "14px",
            color: colors.text,
            fontFamily: FONT_STACK,
          }}
        >
          {testimonial.name}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "13px",
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
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
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="social-proof-heading"
          style={{
            textAlign: "center",
            margin: "0 0 48px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {socialProof.headline}
        </h2>

        {/* Stats bar */}
        {socialProof.stats.length > 0 && (
          <ul
            aria-label="Key statistics"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "24px",
              listStyle: "none",
              margin: "0 0 56px",
              padding: "24px",
              background: colors.surfaceLight,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
            }}
          >
            {socialProof.stats.map((stat, i) => (
              <li
                key={i}
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 800,
                    color: colors.accent,
                    fontFamily: FONT_STACK,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: colors.textMuted,
                    fontFamily: FONT_STACK,
                  }}
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
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
      style={{
        background: colors.surfaceLight,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          cursor: "pointer",
          listStyle: "none",
          fontSize: "17px",
          fontWeight: 600,
          color: colors.text,
          fontFamily: FONT_STACK,
          minHeight: "44px",
          gap: "16px",
          userSelect: "none",
        }}
      >
        <span>{item.question}</span>
        {/* CSS-driven chevron via ::marker pseudo-element alternative */}
        <span
          aria-hidden="true"
          className="faq-chevron"
          style={{
            flexShrink: 0,
            display: "inline-block",
            width: "20px",
            height: "20px",
            borderRight: `2px solid ${colors.textMuted}`,
            borderBottom: `2px solid ${colors.textMuted}`,
            transform: "rotate(45deg)",
            transition: "transform 0.25s ease",
            marginBottom: "4px",
          }}
        />
      </summary>
      <div
        style={{
          padding: "0 24px 20px",
          fontSize: "15px",
          lineHeight: 1.7,
          color: colors.textMuted,
          fontFamily: FONT_STACK,
        }}
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
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="faq-heading"
          style={{
            textAlign: "center",
            margin: "0 0 48px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {objections.headline}
        </h2>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
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
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: colors.surfaceLight,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          padding: "clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)",
          textAlign: "center",
          boxShadow: `0 0 80px ${colors.accentGlow}`,
          ...revealStyle(isVisible, prefersReducedMotion),
        }}
      >
        <h2
          id="final-cta-heading"
          style={{
            margin: "0 0 20px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            color: colors.text,
            fontFamily: FONT_STACK,
            letterSpacing: "-0.02em",
          }}
        >
          {finalCta.headline}
        </h2>

        <p
          style={{
            margin: "0 0 32px",
            fontSize: "clamp(16px, 1.8vw, 19px)",
            lineHeight: 1.65,
            color: colors.textMuted,
            fontFamily: FONT_STACK,
          }}
        >
          {finalCta.subheadline}
        </p>

        {/* Urgency */}
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 32px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            color: "#fbbf24",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: FONT_STACK,
          }}
        >
          <span aria-hidden="true">🕐</span>
          {finalCta.urgency}
        </p>

        <div style={{ marginBottom: "24px" }}>
          <a
            href={finalCta.primaryCta.url}
            style={{
              display: "inline-block",
              padding: "18px 48px",
              minHeight: "44px",
              minWidth: "44px",
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
              color: "#fff",
              borderRadius: "10px",
              fontFamily: FONT_STACK,
              fontSize: "18px",
              fontWeight: 700,
              textDecoration: "none",
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
          style={{
            margin: 0,
            fontSize: "14px",
            color: colors.textDim,
            fontFamily: FONT_STACK,
          }}
        >
          <span aria-hidden="true" style={{ marginRight: "6px" }}>
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
      style={{
        background: colors.bg,
        borderTop: `1px solid ${colors.border}`,
        padding: "32px clamp(16px, 5vw, 80px)",
        textAlign: "center",
      }}
    >
      {footer.badges.length > 0 && (
        <ul
          aria-label="Trust badges"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
            listStyle: "none",
            margin: "0 0 20px",
            padding: 0,
          }}
        >
          {footer.badges.map((badge, i) => (
            <li
              key={i}
              style={{
                padding: "5px 14px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                fontSize: "12px",
                fontWeight: 600,
                color: colors.textMuted,
                fontFamily: FONT_STACK,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </li>
          ))}
        </ul>
      )}

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: colors.textDim,
          fontFamily: FONT_STACK,
        }}
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
        style={{
          background: colors.bg,
          color: colors.text,
          fontFamily: FONT_STACK,
          minHeight: "100vh",
        }}
      >
        <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
          <HeroSection hero={config.hero} {...sharedProps} />
          <ProblemSection problem={config.problem} {...sharedProps} />
          <SolutionSection solution={config.solution} {...sharedProps} />
          <HowItWorksSection howItWorks={config.howItWorks} {...sharedProps} />
          <FeaturesSection features={config.features} {...sharedProps} />
          <SocialProofSection socialProof={config.socialProof} {...sharedProps} />
          <ObjectionsSection objections={config.objections} {...sharedProps} />
          <FinalCtaSection finalCta={config.finalCta} {...sharedProps} />
        </main>

        <FooterSection footer={config.footer} colors={colors} />
      </div>
    </>
  );
}
