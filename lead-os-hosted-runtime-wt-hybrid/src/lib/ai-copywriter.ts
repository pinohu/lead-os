import { callLLM, isAIEnabled, type LLMMessage } from "./ai-client.ts";
import type { AssessmentQuestion, NurtureStageContent } from "./niche-generator.ts";
import {
  generateAssessmentQuestions as templateAssessmentQuestions,
  generateNurtureContent,
  detectIndustryCategory,
} from "./niche-generator.ts";

export interface CopyRequest {
  type:
    | "email-subject"
    | "email-body"
    | "landing-headline"
    | "cta"
    | "assessment-question"
    | "nurture-sequence"
    | "social-proof"
    | "ad-copy";
  niche: string;
  brandName: string;
  context: Record<string, unknown>;
  tone?: "professional" | "friendly" | "urgent" | "educational";
  maxLength?: number;
}

export interface CopyResult {
  content: string;
  alternatives: string[];
  model: string;
  confidence: number;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Use a polished, authoritative tone. Avoid slang. Sound trustworthy and expert.",
  friendly: "Use a warm, conversational tone. Be approachable and relatable. Use contractions naturally.",
  urgent: "Create urgency without being manipulative. Emphasize time-sensitivity and the cost of inaction.",
  educational: "Be informative and helpful. Lead with insights. Position the reader as capable of learning and growing.",
};

const FALLBACK_COPY: Record<CopyRequest["type"], (req: CopyRequest) => CopyResult> = {
  "email-subject": (req) => ({
    content: `How ${req.niche} businesses are growing faster in 2025`,
    alternatives: [
      `The #1 growth strategy for ${req.niche} businesses`,
      `${req.brandName}: Your ${req.niche} growth roadmap is ready`,
    ],
    model: "template",
    confidence: 0.4,
  }),
  "email-body": (req) => ({
    content: `<p>Hi {{firstName}},</p><p>Growing a ${req.niche} business is challenging, but it does not have to be. At ${req.brandName}, we have helped dozens of businesses like yours streamline their lead generation and follow-up.</p><p>Ready to see how? Reply to this email or book a quick call.</p><p>Best,<br/>The ${req.brandName} Team</p>`,
    alternatives: [],
    model: "template",
    confidence: 0.4,
  }),
  "landing-headline": (req) => ({
    content: `Grow your ${req.niche} business with automated lead capture`,
    alternatives: [
      `Stop losing leads. Start growing your ${req.niche} business.`,
      `The growth system built for ${req.niche} professionals`,
    ],
    model: "template",
    confidence: 0.4,
  }),
  cta: (req) => ({
    content: "Get your free growth assessment",
    alternatives: [
      `Start growing your ${req.niche} business`,
      "Book a free strategy session",
    ],
    model: "template",
    confidence: 0.4,
  }),
  "assessment-question": (req) => ({
    content: `What is the biggest challenge facing your ${req.niche} business right now?`,
    alternatives: [
      `How would you rate your current lead generation for your ${req.niche} business?`,
      `What is your primary goal for the next 90 days?`,
    ],
    model: "template",
    confidence: 0.4,
  }),
  "nurture-sequence": (req) => ({
    content: `7-stage nurture sequence for ${req.niche} leads`,
    alternatives: [],
    model: "template",
    confidence: 0.4,
  }),
  "social-proof": (req) => ({
    content: `Trusted by ${req.niche} businesses to automate their lead pipeline and close more deals.`,
    alternatives: [
      `Join hundreds of ${req.niche} professionals who have transformed their growth.`,
      `${req.niche} businesses see results within the first 30 days.`,
    ],
    model: "template",
    confidence: 0.4,
  }),
  "ad-copy": (req) => ({
    content: `Struggling with lead generation for your ${req.niche} business? Discover the automated system that captures, nurtures, and converts leads while you focus on what you do best.`,
    alternatives: [
      `${req.niche} business owners: stop losing leads to slow follow-up. Get the growth system that works 24/7.`,
      `Your ${req.niche} competitors are automating their lead pipeline. Are you?`,
    ],
    model: "template",
    confidence: 0.4,
  }),
};

export async function generateCopy(request: CopyRequest): Promise<CopyResult> {
  if (!isAIEnabled()) {
    const fallback = FALLBACK_COPY[request.type];
    return fallback(request);
  }

  const toneInstruction = TONE_INSTRUCTIONS[request.tone ?? "professional"];
  const maxLength = request.maxLength ?? 200;

  const contextStr = Object.entries(request.context)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an expert marketing copywriter. Generate copy for a ${request.niche} business called "${request.brandName}".

Type of copy needed: ${request.type}
${toneInstruction}
Maximum length: ${maxLength} characters for the main copy.

Return ONLY a JSON object:
- content: the main copy (string)
- alternatives: array of 2-3 alternative versions (strings)
- confidence: number 0-1 indicating how well this fits the request

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: contextStr.length > 0
        ? `Context:\n${contextStr}`
        : `Generate ${request.type} copy for a ${request.niche} business.`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 512, temperature: 0.8 });
    if (result.model === "dry-run") {
      return FALLBACK_COPY[request.type](request);
    }

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      content: typeof parsed.content === "string" ? parsed.content : FALLBACK_COPY[request.type](request).content,
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives.filter((a): a is string => typeof a === "string").slice(0, 3)
        : [],
      model: result.model,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7,
    };
  } catch {
    return FALLBACK_COPY[request.type](request);
  }
}

export async function generateNurtureSequence(
  niche: string,
  brandName: string,
  productDescription?: string,
): Promise<NurtureStageContent[]> {
  const industry = detectIndustryCategory(niche);

  if (!isAIEnabled()) {
    return generateNurtureContent(niche, industry, brandName);
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an email marketing strategist. Generate a 7-stage nurture email sequence for a ${niche} business called "${brandName}".
${productDescription ? `Product/Service: ${productDescription}` : ""}

Each stage should follow this progression:
1. Day 0: Immediate value delivery (welcome + resource)
2. Day 2: Quick win (actionable tip)
3. Day 5: Proof and positioning (case study or testimonial)
4. Day 10: Authority follow-up (industry insights)
5. Day 14: Consultation offer (soft ask)
6. Day 21: Reactivation (re-engage cold leads)
7. Day 30: Long-term nurture (relationship maintenance)

Return ONLY a JSON array of 7 objects, each with:
- stageId: string (e.g., "day-0")
- dayOffset: number
- subject: string (email subject line)
- previewText: string (email preview text)
- bodyTemplate: string (HTML email body, use {{firstName}} and {{brandName}} placeholders)

Respond with ONLY the JSON array.`,
    },
    {
      role: "user",
      content: `Generate the nurture sequence for ${niche} / ${brandName}.`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 4096, temperature: 0.7 });
    if (result.model === "dry-run") {
      return generateNurtureContent(niche, industry, brandName);
    }

    const parsed = JSON.parse(result.content) as unknown[];
    if (!Array.isArray(parsed) || parsed.length < 7) {
      return generateNurtureContent(niche, industry, brandName);
    }

    return parsed.slice(0, 7).map((item, index) => {
      const stage = item as Record<string, unknown>;
      const dayOffsets = [0, 2, 5, 10, 14, 21, 30];
      return {
        stageId: typeof stage.stageId === "string" ? stage.stageId : `day-${dayOffsets[index]}`,
        dayOffset: typeof stage.dayOffset === "number" ? stage.dayOffset : dayOffsets[index],
        subject: typeof stage.subject === "string" ? stage.subject : `Day ${dayOffsets[index]} - ${niche} growth tips`,
        previewText: typeof stage.previewText === "string" ? stage.previewText : `Helping your ${niche} business grow`,
        bodyTemplate: typeof stage.bodyTemplate === "string" ? stage.bodyTemplate : `<p>Hi {{firstName}},</p><p>Here is your ${niche} growth tip for today.</p><p>Best,<br/>The {{brandName}} Team</p>`,
      };
    });
  } catch {
    return generateNurtureContent(niche, industry, brandName);
  }
}

export async function generateAssessmentQuestions(
  niche: string,
  industry?: string,
): Promise<AssessmentQuestion[]> {
  const detectedIndustry = industry
    ? detectIndustryCategory(industry)
    : detectIndustryCategory(niche);

  if (!isAIEnabled()) {
    return templateAssessmentQuestions(niche, detectedIndustry);
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Generate 7 assessment questions for a ${niche} business. These questions qualify leads and help determine their readiness to buy.

Return ONLY a JSON array of objects, each with:
- id: string (e.g., "q-1")
- question: string
- type: "single-choice" | "multi-choice" | "scale"
- options: array of { label: string, value: string, scoreImpact: number (0-10) }
- weight: number (1.0 or 1.5 for important questions)

Focus on: current challenges, budget readiness, decision timeline, team size, and goals.
Respond with ONLY the JSON array.`,
    },
    {
      role: "user",
      content: `Generate assessment questions for ${niche} businesses.`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 2048, temperature: 0.6 });
    if (result.model === "dry-run") {
      return templateAssessmentQuestions(niche, detectedIndustry);
    }

    const parsed = JSON.parse(result.content) as unknown[];
    if (!Array.isArray(parsed) || parsed.length < 5) {
      return templateAssessmentQuestions(niche, detectedIndustry);
    }

    return parsed.slice(0, 7).map((item, index) => {
      const q = item as Record<string, unknown>;
      return {
        id: typeof q.id === "string" ? q.id : `q-${index + 1}`,
        question: typeof q.question === "string" ? q.question : `Question ${index + 1} about your ${niche} business`,
        type: validateQuestionType(q.type),
        options: validateOptions(q.options, index),
        weight: typeof q.weight === "number" ? Math.max(0.5, Math.min(2.0, q.weight)) : 1.0,
      };
    });
  } catch {
    return templateAssessmentQuestions(niche, detectedIndustry);
  }
}

export async function improveHeadline(
  current: string,
  niche: string,
): Promise<CopyResult> {
  if (!isAIEnabled()) {
    return {
      content: current,
      alternatives: [
        `Discover how ${niche} businesses are scaling faster`,
        `The proven growth system for ${niche} professionals`,
      ],
      model: "template",
      confidence: 0.3,
    };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an A/B testing specialist. Improve the following headline for a ${niche} business landing page. Generate 3 alternatives that might outperform the original.

Return ONLY a JSON object:
- content: your best alternative (string)
- alternatives: array of 2 more alternatives (strings)
- confidence: number 0-1

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: `Current headline: "${current}"`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 256, temperature: 0.9 });
    if (result.model === "dry-run") {
      return { content: current, alternatives: [], model: "template", confidence: 0.3 };
    }

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      content: typeof parsed.content === "string" ? parsed.content : current,
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives.filter((a): a is string => typeof a === "string").slice(0, 3)
        : [],
      model: result.model,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7,
    };
  } catch {
    return { content: current, alternatives: [], model: "template", confidence: 0.3 };
  }
}

export async function generateSocialProof(
  niche: string,
  customerType?: string,
): Promise<string> {
  if (!isAIEnabled()) {
    const type = customerType ?? "business";
    return `Trusted by ${niche} ${type}s to automate their lead pipeline and close more deals.`;
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Generate a single, compelling social proof statement for a ${niche} business. ${customerType ? `Target customer type: ${customerType}.` : ""} The statement should sound authentic and specific. Keep it under 100 characters. Return ONLY the text, no JSON.`,
    },
    {
      role: "user",
      content: `Generate social proof for ${niche}.`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 100, temperature: 0.8 });
    if (result.model === "dry-run") {
      return `Trusted by ${niche} businesses to automate their lead pipeline.`;
    }
    return result.content.replace(/^["']|["']$/g, "").trim();
  } catch {
    return `Trusted by ${niche} businesses to automate their lead pipeline.`;
  }
}

function validateQuestionType(value: unknown): "single-choice" | "multi-choice" | "scale" {
  if (value === "single-choice" || value === "multi-choice" || value === "scale") return value;
  return "single-choice";
}

function validateOptions(
  value: unknown,
  questionIndex: number,
): Array<{ label: string; value: string; scoreImpact: number }> {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      { label: "Yes", value: `q${questionIndex + 1}-opt1`, scoreImpact: 8 },
      { label: "Somewhat", value: `q${questionIndex + 1}-opt2`, scoreImpact: 5 },
      { label: "No", value: `q${questionIndex + 1}-opt3`, scoreImpact: 2 },
    ];
  }

  return value.map((opt, optIndex) => {
    const o = opt as Record<string, unknown>;
    return {
      label: typeof o.label === "string" ? o.label : `Option ${optIndex + 1}`,
      value: typeof o.value === "string" ? o.value : `q${questionIndex + 1}-opt${optIndex + 1}`,
      scoreImpact: typeof o.scoreImpact === "number" ? Math.max(0, Math.min(10, o.scoreImpact)) : 5,
    };
  });
}
