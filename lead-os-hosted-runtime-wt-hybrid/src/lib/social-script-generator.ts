import crypto from "crypto";
import type { ContentAngle } from "./social-angle-generator.ts";
import type { Hook } from "./social-hook-generator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScriptFormat = "short-video" | "carousel" | "thread" | "article-outline";

export interface ScriptSection {
  label: string;
  content: string;
  durationSeconds: number;
}

export interface VideoScript {
  id: string;
  format: "short-video";
  sections: ScriptSection[];
  totalDurationSeconds: number;
  hookText: string;
  ctaText: string;
  generatedAt: string;
}

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  body: string;
  visualNote: string;
}

export interface CarouselScript {
  id: string;
  format: "carousel";
  slides: CarouselSlide[];
  slideCount: number;
  hookText: string;
  ctaText: string;
  generatedAt: string;
}

export interface ThreadPost {
  postNumber: number;
  content: string;
  characterCount: number;
}

export interface ThreadScript {
  id: string;
  format: "thread";
  posts: ThreadPost[];
  postCount: number;
  hookText: string;
  ctaText: string;
  generatedAt: string;
}

export interface ArticleSection {
  heading: string;
  bulletPoints: string[];
  estimatedWordCount: number;
}

export interface ArticleOutlineScript {
  id: string;
  format: "article-outline";
  title: string;
  sections: ArticleSection[];
  totalEstimatedWordCount: number;
  hookText: string;
  ctaText: string;
  generatedAt: string;
}

export type Script = VideoScript | CarouselScript | ThreadScript | ArticleOutlineScript;

export interface ScriptGeneratorConfig {
  angle: ContentAngle;
  hook: Hook;
  format: ScriptFormat;
}

// ---------------------------------------------------------------------------
// Video script generation (PAS: hook 3s, problem 10s, agitation 10s,
// solution 15s, proof 10s, CTA 5s)
// ---------------------------------------------------------------------------

function generateVideoScript(angle: ContentAngle, hook: Hook): VideoScript {
  const sections: ScriptSection[] = [
    {
      label: "hook",
      content: hook.text,
      durationSeconds: 3,
    },
    {
      label: "problem",
      content: `Here's the real problem with ${angle.topic} in ${angle.niche}: ${angle.bodyOutline[0] ?? "most people don't even realize what's going wrong"}. This is costing you more than you think.`,
      durationSeconds: 10,
    },
    {
      label: "agitation",
      content: `And it gets worse. ${angle.bodyOutline[1] ?? "The longer you ignore this, the bigger the gap becomes"}. Every day you wait, your competitors are pulling ahead.`,
      durationSeconds: 10,
    },
    {
      label: "solution",
      content: `Here's what actually works: ${angle.bodyOutline[2] ?? "a proven framework that top performers use"}. ${angle.bodyOutline[3] ?? "Follow these steps and you'll see results within 30 days"}.`,
      durationSeconds: 15,
    },
    {
      label: "proof",
      content: `My clients who implemented this saw measurable results. ${angle.bodyOutline[3] ?? "We've tested this across dozens of " + angle.niche + " businesses"}.`,
      durationSeconds: 10,
    },
    {
      label: "cta",
      content: angle.cta,
      durationSeconds: 5,
    },
  ];

  const totalDuration = sections.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    id: crypto.randomUUID(),
    format: "short-video",
    sections,
    totalDurationSeconds: totalDuration,
    hookText: hook.text,
    ctaText: angle.cta,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Carousel generation
// ---------------------------------------------------------------------------

function generateCarouselScript(angle: ContentAngle, hook: Hook): CarouselScript {
  const slides: CarouselSlide[] = [
    {
      slideNumber: 1,
      headline: hook.text,
      body: "Swipe to learn the truth...",
      visualNote: "Bold text on branded background, attention-grabbing colors",
    },
    {
      slideNumber: 2,
      headline: "The Problem",
      body: `Most ${angle.niche} businesses get ${angle.topic} completely wrong. ${angle.bodyOutline[0] ?? "Here's what nobody tells you."}`,
      visualNote: "Problem visualization with pain point icons",
    },
  ];

  for (let i = 0; i < angle.bodyOutline.length; i++) {
    slides.push({
      slideNumber: slides.length + 1,
      headline: `Step ${i + 1}`,
      body: angle.bodyOutline[i],
      visualNote: `Supporting graphic for: ${angle.bodyOutline[i]}`,
    });
  }

  slides.push({
    slideNumber: slides.length + 1,
    headline: "Results",
    body: `Businesses that follow this approach see measurable improvement in their ${angle.topic} outcomes.`,
    visualNote: "Before/after comparison or results chart",
  });

  slides.push({
    slideNumber: slides.length + 1,
    headline: "Want This For Your Business?",
    body: angle.cta,
    visualNote: "CTA slide with clear action step and branding",
  });

  return {
    id: crypto.randomUUID(),
    format: "carousel",
    slides,
    slideCount: slides.length,
    hookText: hook.text,
    ctaText: angle.cta,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Thread generation
// ---------------------------------------------------------------------------

function generateThreadScript(angle: ContentAngle, hook: Hook): ThreadScript {
  const posts: ThreadPost[] = [];

  const hookPost = `${hook.text}\n\nA thread on ${angle.topic} for ${angle.niche} businesses:`;
  posts.push({ postNumber: 1, content: hookPost, characterCount: hookPost.length });

  const problemPost = `The problem: ${angle.bodyOutline[0] ?? "Most people approach " + angle.topic + " completely wrong."}`;
  posts.push({ postNumber: 2, content: problemPost, characterCount: problemPost.length });

  for (let i = 1; i < angle.bodyOutline.length; i++) {
    const content = angle.bodyOutline[i];
    posts.push({ postNumber: posts.length + 1, content, characterCount: content.length });
  }

  const summaryPost = `The bottom line: mastering ${angle.topic} in ${angle.niche} comes down to these principles. Apply them consistently and results will follow.`;
  posts.push({ postNumber: posts.length + 1, content: summaryPost, characterCount: summaryPost.length });

  const ctaPost = angle.cta;
  posts.push({ postNumber: posts.length + 1, content: ctaPost, characterCount: ctaPost.length });

  return {
    id: crypto.randomUUID(),
    format: "thread",
    posts,
    postCount: posts.length,
    hookText: hook.text,
    ctaText: angle.cta,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Article outline generation
// ---------------------------------------------------------------------------

function generateArticleOutline(angle: ContentAngle, hook: Hook): ArticleOutlineScript {
  const sections: ArticleSection[] = [
    {
      heading: "Introduction",
      bulletPoints: [hook.text, `Why ${angle.topic} matters for ${angle.niche} businesses`, "What you'll learn in this article"],
      estimatedWordCount: 200,
    },
    {
      heading: `The Current State of ${angle.topic}`,
      bulletPoints: [angle.bodyOutline[0] ?? "Industry overview", "Common misconceptions", "Why most approaches fail"],
      estimatedWordCount: 400,
    },
  ];

  for (let i = 1; i < angle.bodyOutline.length; i++) {
    sections.push({
      heading: angle.bodyOutline[i],
      bulletPoints: ["Detailed explanation", "Real-world example", `Application for ${angle.niche}`],
      estimatedWordCount: 350,
    });
  }

  sections.push({
    heading: "Implementation Guide",
    bulletPoints: ["Step-by-step action plan", "Tools and resources needed", "Timeline for expected results"],
    estimatedWordCount: 500,
  });

  sections.push({
    heading: "Conclusion",
    bulletPoints: ["Key takeaways", angle.cta, "Next steps for the reader"],
    estimatedWordCount: 150,
  });

  const totalWords = sections.reduce((sum, s) => sum + s.estimatedWordCount, 0);

  return {
    id: crypto.randomUUID(),
    format: "article-outline",
    title: `The Complete Guide to ${angle.topic} for ${angle.niche} Businesses`,
    sections,
    totalEstimatedWordCount: totalWords,
    hookText: hook.text,
    ctaText: angle.cta,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateScript(config: ScriptGeneratorConfig): Script {
  const { angle, hook, format } = config;

  switch (format) {
    case "short-video":
      return generateVideoScript(angle, hook);
    case "carousel":
      return generateCarouselScript(angle, hook);
    case "thread":
      return generateThreadScript(angle, hook);
    case "article-outline":
      return generateArticleOutline(angle, hook);
  }
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const scriptStore = new Map<string, Script[]>();

export function storeScript(tenantId: string, script: Script): void {
  const existing = scriptStore.get(tenantId) ?? [];
  existing.push(script);
  scriptStore.set(tenantId, existing);
}

export function getStoredScripts(tenantId: string): Script[] {
  return scriptStore.get(tenantId) ?? [];
}

export function _resetStores(): void {
  scriptStore.clear();
}
