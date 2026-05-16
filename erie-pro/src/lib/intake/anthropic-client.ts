// ── Anthropic API Client + Intake LLM Helpers ────────────────────────
// Minimal fetch-based wrapper around the Anthropic Messages API. No SDK
// dependency. Used by the intake widget for two narrow tasks:
//   1. Niche classification from a free-text problem description
//   2. Composing an empathetic 1-2 sentence reply per step
//
// Both calls have hard timeouts and fall back to deterministic content on
// any failure. The widget must remain usable when the API is slow or down.

import { logger } from "@/lib/logger";
import { niches } from "@/lib/niches";

// ── Configuration ───────────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 4000; // Hard ceiling per call; UI degrades after this.

interface AnthropicCallOptions {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  /** Override default model — typically Haiku for cost. */
  model?: string;
}

/** Single call to the Anthropic Messages API. Returns text or null on failure. */
async function callAnthropic(opts: AnthropicCallOptions): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("ANTHROPIC_API_KEY not set; intake LLM features disabled");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        max_tokens: opts.maxTokens,
        system: opts.systemPrompt,
        messages: opts.messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn("Anthropic API non-2xx", { status: res.status, body: errText.slice(0, 300) });
      return null;
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const text = (data.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("\n")
      .trim();

    return text || null;
  } catch (err) {
    clearTimeout(timer);
    const code =
      err instanceof Error && err.name === "AbortError"
        ? "timeout"
        : "error";
    logger.warn("Anthropic API call failed", {
      code,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── Niche Classification ──────────────────────────────────────────────

export interface ClassifyResult {
  /** Best-guess niche slug; null when nothing meets the confidence floor */
  primary: string | null;
  /** Top candidates with confidence scores, sorted descending */
  candidates: Array<{ slug: string; confidence: number; reason: string }>;
  /** Whether this came from the LLM or the keyword fallback */
  source: "llm" | "keyword-fallback";
}

const NICHE_CATALOG_TEXT = niches
  .map((n) => `- ${n.slug}: ${n.label} — ${n.description}`)
  .join("\n");

const CLASSIFY_SYSTEM_PROMPT = `You are a routing assistant for a local-services directory. Given a customer's free-text problem description, identify the best matching service niche from this catalog:

${NICHE_CATALOG_TEXT}

Respond with a single JSON object on one line, no markdown fences:
{"candidates":[{"slug":"<niche-slug>","confidence":<0-1 float>,"reason":"<short reason>"}]}

Rules:
- Return up to 3 candidates, sorted by confidence descending.
- "confidence" reflects how well the niche actually matches the problem (not popularity).
- Only return slugs from the catalog above. Never invent a slug.
- If nothing matches, return {"candidates":[]}.
- Keep "reason" under 12 words. No emojis, no markdown.`;

/**
 * Classify a free-text problem into the most likely niche.
 * Falls back to keyword search against niches.ts searchTerms on LLM failure.
 */
export async function classifyNiche(
  problemText: string,
  hintedNicheSlug?: string | null
): Promise<ClassifyResult> {
  const trimmed = problemText.trim();
  if (!trimmed) {
    return { primary: hintedNicheSlug ?? null, candidates: [], source: "keyword-fallback" };
  }

  // ── Try LLM first ───────────────────────────────────────────────
  const userMsg = hintedNicheSlug
    ? `Problem: ${trimmed}\n\n(Context: customer started on the "${hintedNicheSlug}" page, but classify based on the problem text itself.)`
    : `Problem: ${trimmed}`;

  const raw = await callAnthropic({
    systemPrompt: CLASSIFY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 300,
  });

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        candidates: Array<{ slug: string; confidence: number; reason: string }>;
      };
      const validSlugs = new Set(niches.map((n) => n.slug));
      const filtered = (parsed.candidates ?? [])
        .filter((c) => c.slug && validSlugs.has(c.slug))
        .map((c) => ({
          slug: c.slug,
          confidence: Math.max(0, Math.min(1, c.confidence ?? 0)),
          reason: (c.reason ?? "").slice(0, 100),
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      if (filtered.length > 0) {
        return {
          primary: filtered[0].confidence >= 0.4 ? filtered[0].slug : null,
          candidates: filtered,
          source: "llm",
        };
      }
    } catch (parseErr) {
      logger.warn("classifyNiche LLM JSON parse failed", {
        rawSnippet: raw.slice(0, 200),
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
      });
    }
  }

  // ── Keyword fallback ─────────────────────────────────────────────
  const lower = trimmed.toLowerCase();
  const scored = niches.map((n) => {
    const allTerms = [n.label.toLowerCase(), ...n.searchTerms.map((t) => t.toLowerCase())];
    const hits = allTerms.filter((t) => lower.includes(t)).length;
    // Normalize so confidence is bounded; hits ≥ 2 → high confidence
    const confidence = hits === 0 ? 0 : Math.min(1, 0.4 + hits * 0.2);
    return { slug: n.slug, confidence, reason: hits ? `matched ${hits} keyword(s)` : "" };
  });
  const ranked = scored
    .filter((s) => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  if (ranked.length > 0) {
    return {
      primary: ranked[0].confidence >= 0.4 ? ranked[0].slug : null,
      candidates: ranked,
      source: "keyword-fallback",
    };
  }

  // ── Last resort: honor the hinted niche if we have one ──────────
  if (hintedNicheSlug) {
    return {
      primary: hintedNicheSlug,
      candidates: [{ slug: hintedNicheSlug, confidence: 0.3, reason: "page context" }],
      source: "keyword-fallback",
    };
  }
  return { primary: null, candidates: [], source: "keyword-fallback" };
}

// ── Empathetic Acknowledgment ─────────────────────────────────────────

const ACK_SYSTEM_PROMPT = `You are a calm, helpful intake assistant for a local-services directory in Erie, PA. Your only job is to acknowledge the customer's problem in 1 to 2 short sentences, then say you'll ask 2 quick questions to route them. Be warm and matter-of-fact. Never give advice. Never name a specific contractor. Never quote prices. Never speculate. No emojis. No exclamation marks. Plain prose only.

Examples of correct length and tone:
- "That sounds stressful — water issues compound fast. Let me ask two quick questions so I can route you to the right plumber."
- "Got it — no heat in this weather is a real problem. Two quick questions and I'll connect you with someone."`;

/**
 * Compose an empathetic 1-2 sentence acknowledgment of the customer's problem.
 * Falls back to a templated reply on LLM failure.
 */
export async function composeProblemAck(
  problemText: string,
  nicheLabel: string
): Promise<string> {
  const llmReply = await callAnthropic({
    systemPrompt: ACK_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Customer problem (niche: ${nicheLabel}): ${problemText.trim()}`,
      },
    ],
    maxTokens: 120,
  });

  if (llmReply) return sanitizeReply(llmReply);

  // Deterministic fallback
  return `Thanks — I'll route this to a ${nicheLabel.toLowerCase()} contractor. Two quick questions first.`;
}

/** Strip any markdown / emojis / overly long replies. */
function sanitizeReply(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emojis
    .replace(/[*_`#]/g, "") // markdown markers
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

export { callAnthropic }; // exported for testing only
