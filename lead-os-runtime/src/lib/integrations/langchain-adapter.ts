import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadContext {
  name: string;
  company: string;
  title: string;
  industry: string;
  painPoints?: string[];
  previousInteractions?: string[];
  score?: number;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  preheader: string;
  personalizedElements: string[];
  estimatedOpenRate: number;
}

export interface GeneratedMessage {
  message: string;
  hookType: string;
  callToAction: string;
  characterCount: number;
}

export interface LandingPageCopy {
  headline: string;
  subheadline: string;
  bullets: string[];
  socialProof: string;
  ctaText: string;
  urgencyElement: string;
}

export interface AdCopy {
  headline: string;
  description: string;
  callToAction: string;
  targetKeywords: string[];
}

export interface BlogOutline {
  title: string;
  sections: { heading: string; keyPoints: string[] }[];
  estimatedWordCount: number;
  targetKeywords: string[];
}

export interface CompanyAnalysis {
  name: string;
  industry: string;
  size: string;
  techStack: string[];
  painPoints: string[];
  opportunities: string[];
  competitivePosition: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface LeadQualification {
  score: number;
  budget: "unknown" | "low" | "medium" | "high";
  authority: boolean;
  need: boolean;
  timeline: string;
}

export interface PersonalizedPitch {
  openingLine: string;
  painPointAddress: string;
  valueProposition: string;
  proofPoint: string;
  callToAction: string;
  objectionHandlers: string[];
}

export interface ChatSession {
  id: string;
  tenantId: string;
  visitorId: string;
  messages: ChatMessage[];
  extractedInfo?: ExtractedLeadInfo;
  createdAt: string;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: string[];
  leadSignals?: string[];
}

export interface ExtractedLeadInfo {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  interests: string[];
  painPoints: string[];
  budget?: string;
  timeline?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const chatSessionStore = new Map<string, ChatSession>();

export function resetLangchainStore(): void {
  chatSessionStore.clear();
}

export function _getChatSessionStoreForTesting(): Map<string, ChatSession> {
  return chatSessionStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getLangchainConfig(): { apiKey: string; model: string; baseUrl?: string } | undefined {
  const apiKey = process.env["LANGCHAIN_API_KEY"] ?? process.env["OPENAI_API_KEY"];
  const model = process.env["LANGCHAIN_MODEL"] ?? "gpt-4o";
  const baseUrl = process.env["LANGCHAIN_BASE_URL"];

  if (typeof apiKey === "string" && apiKey.trim().length > 0) {
    return { apiKey: apiKey.trim(), model, baseUrl };
  }

  return undefined;
}

function isDryRun(): boolean {
  return !getLangchainConfig() || process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false";
}

// ---------------------------------------------------------------------------
// LLM call helper
// ---------------------------------------------------------------------------

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const config = getLangchainConfig();
  if (!config) {
    throw new Error("LangChain API key not configured");
  }

  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`LLM API returned ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Content generation - Cold email
// ---------------------------------------------------------------------------

export async function generateColdEmail(
  lead: LeadContext,
  template?: string,
): Promise<GeneratedEmail> {
  if (isDryRun()) {
    return buildDryRunEmail(lead, template);
  }

  const systemPrompt = "You are an expert B2B cold email copywriter. Generate a personalized cold email. Return JSON with keys: subject, body, preheader, personalizedElements (array), estimatedOpenRate (number 0-1).";
  const userPrompt = `Lead: ${lead.name} at ${lead.company} (${lead.title}, ${lead.industry}).${lead.painPoints?.length ? ` Pain points: ${lead.painPoints.join(", ")}.` : ""}${template ? ` Template style: ${template}` : ""}`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunEmail(lead, template));
}

export async function generateFollowUpEmail(
  lead: LeadContext,
  previousEmails: string[],
  stage: number,
): Promise<GeneratedEmail> {
  if (isDryRun()) {
    return buildDryRunFollowUp(lead, stage);
  }

  const systemPrompt = "You are an expert B2B email copywriter. Generate a follow-up email based on previous correspondence. Return JSON with keys: subject, body, preheader, personalizedElements (array), estimatedOpenRate (number 0-1).";
  const userPrompt = `Lead: ${lead.name} at ${lead.company}. Stage: ${stage}. Previous emails:\n${previousEmails.map((e, i) => `Email ${i + 1}: ${e}`).join("\n")}`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunFollowUp(lead, stage));
}

// ---------------------------------------------------------------------------
// Content generation - LinkedIn
// ---------------------------------------------------------------------------

export async function generateLinkedInMessage(
  lead: LeadContext,
  connectionStatus: "none" | "pending" | "connected",
): Promise<GeneratedMessage> {
  if (isDryRun()) {
    return buildDryRunLinkedInMessage(lead, connectionStatus);
  }

  const systemPrompt = "You are an expert LinkedIn outreach specialist. Generate a LinkedIn message. Return JSON with keys: message, hookType, callToAction, characterCount.";
  const userPrompt = `Lead: ${lead.name}, ${lead.title} at ${lead.company} (${lead.industry}). Connection status: ${connectionStatus}.`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunLinkedInMessage(lead, connectionStatus));
}

// ---------------------------------------------------------------------------
// Content generation - Landing page
// ---------------------------------------------------------------------------

export async function generateLandingPageCopy(
  niche: string,
  service: string,
  targetAudience: string,
): Promise<LandingPageCopy> {
  if (isDryRun()) {
    return buildDryRunLandingPage(niche, service, targetAudience);
  }

  const systemPrompt = "You are an expert landing page copywriter. Generate high-converting landing page copy. Return JSON with keys: headline, subheadline, bullets (array), socialProof, ctaText, urgencyElement.";
  const userPrompt = `Niche: ${niche}. Service: ${service}. Target audience: ${targetAudience}.`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunLandingPage(niche, service, targetAudience));
}

// ---------------------------------------------------------------------------
// Content generation - Ad copy
// ---------------------------------------------------------------------------

export async function generateAdCopy(
  niche: string,
  platform: "google" | "facebook" | "linkedin",
  objective: string,
): Promise<AdCopy[]> {
  if (isDryRun()) {
    return buildDryRunAdCopy(niche, platform, objective);
  }

  const systemPrompt = `You are an expert ${platform} ads copywriter. Generate 3 ad variations. Return a JSON array of objects with keys: headline, description, callToAction, targetKeywords (array).`;
  const userPrompt = `Niche: ${niche}. Platform: ${platform}. Objective: ${objective}.`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunAdCopy(niche, platform, objective));
}

// ---------------------------------------------------------------------------
// Content generation - Blog outline
// ---------------------------------------------------------------------------

export async function generateBlogOutline(
  topic: string,
  niche: string,
  keywords: string[],
): Promise<BlogOutline> {
  if (isDryRun()) {
    return buildDryRunBlogOutline(topic, niche, keywords);
  }

  const systemPrompt = "You are an expert content strategist. Generate a detailed blog outline. Return JSON with keys: title, sections (array of {heading, keyPoints}), estimatedWordCount, targetKeywords.";
  const userPrompt = `Topic: ${topic}. Niche: ${niche}. Target keywords: ${keywords.join(", ")}.`;

  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunBlogOutline(topic, niche, keywords));
}

// ---------------------------------------------------------------------------
// Lead intelligence
// ---------------------------------------------------------------------------

export async function analyzeCompanyFromWebsite(scrapedContent: string): Promise<CompanyAnalysis> {
  if (isDryRun()) {
    return buildDryRunCompanyAnalysis(scrapedContent);
  }

  const systemPrompt = "You are a business analyst. Analyze the company from the website content. Return JSON with keys: name, industry, size, techStack (array), painPoints (array), opportunities (array), competitivePosition.";
  const raw = await callLLM(systemPrompt, `Website content:\n${scrapedContent.slice(0, 4000)}`);
  return parseJsonOrFallback(raw, () => buildDryRunCompanyAnalysis(scrapedContent));
}

export async function qualifyLeadFromConversation(messages: ChatMessage[]): Promise<LeadQualification> {
  if (isDryRun()) {
    return buildDryRunQualification(messages);
  }

  const systemPrompt = "You are a lead qualification expert using the BANT framework. Analyze the conversation and qualify the lead. Return JSON with keys: score (0-100), budget (unknown|low|medium|high), authority (boolean), need (boolean), timeline (string).";
  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const raw = await callLLM(systemPrompt, transcript);
  return parseJsonOrFallback(raw, () => buildDryRunQualification(messages));
}

export async function generatePersonalizedPitch(
  lead: LeadContext,
  company: CompanyAnalysis,
): Promise<PersonalizedPitch> {
  if (isDryRun()) {
    return buildDryRunPitch(lead, company);
  }

  const systemPrompt = "You are a sales pitch expert. Generate a personalized pitch. Return JSON with keys: openingLine, painPointAddress, valueProposition, proofPoint, callToAction, objectionHandlers (array).";
  const userPrompt = `Lead: ${lead.name}, ${lead.title} at ${lead.company}. Company analysis: ${JSON.stringify(company)}`;
  const raw = await callLLM(systemPrompt, userPrompt);
  return parseJsonOrFallback(raw, () => buildDryRunPitch(lead, company));
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------

export async function createChatSession(
  tenantId: string,
  visitorId: string,
  knowledgeBase?: string,
): Promise<ChatSession> {
  const session: ChatSession = {
    id: `chat-${randomUUID()}`,
    tenantId,
    visitorId,
    messages: [
      {
        role: "system",
        content: knowledgeBase
          ? `You are a helpful sales assistant. Use this knowledge base: ${knowledgeBase}`
          : "You are a helpful sales assistant for our business. Help visitors with their questions and qualify them as leads.",
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  chatSessionStore.set(session.id, session);
  return session;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  const session = chatSessionStore.get(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const userMessage: ChatMessage = {
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(userMessage);

  if (isDryRun()) {
    const response = buildDryRunChatResponse(message);
    session.messages.push({
      role: "assistant",
      content: response.message,
      timestamp: new Date().toISOString(),
    });
    return response;
  }

  const systemPrompt = session.messages.find((m) => m.role === "system")?.content ?? "";
  const conversationHistory = session.messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const raw = await callLLM(
    systemPrompt + "\n\nReturn JSON with keys: message, suggestedActions (array, optional), leadSignals (array, optional).",
    conversationHistory,
  );

  const response = parseJsonOrFallback<ChatResponse>(raw, () => buildDryRunChatResponse(message));

  session.messages.push({
    role: "assistant",
    content: response.message,
    timestamp: new Date().toISOString(),
  });

  return response;
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const session = chatSessionStore.get(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }
  return session.messages.filter((m) => m.role !== "system");
}

export async function extractLeadInfoFromChat(sessionId: string): Promise<ExtractedLeadInfo> {
  const session = chatSessionStore.get(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  if (isDryRun()) {
    return buildDryRunExtractedInfo(session.messages);
  }

  const transcript = session.messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const raw = await callLLM(
    "Extract lead information from this chat conversation. Return JSON with keys: name, email, company, role, interests (array), painPoints (array), budget, timeline. Use null for unknown fields.",
    transcript,
  );

  const info = parseJsonOrFallback<ExtractedLeadInfo>(raw, () => buildDryRunExtractedInfo(session.messages));
  session.extractedInfo = info;
  return info;
}

// ---------------------------------------------------------------------------
// Dry-run builders
// ---------------------------------------------------------------------------

function buildDryRunEmail(lead: LeadContext, _template?: string): GeneratedEmail {
  return {
    subject: `${lead.name}, quick question about ${lead.company}'s ${lead.industry} strategy`,
    body: `Hi ${lead.name},\n\nI noticed ${lead.company} is making waves in the ${lead.industry} space. ${lead.painPoints?.length ? `I understand challenges like ${lead.painPoints[0]} can be tough.` : "I'd love to learn about your current challenges."}\n\nWould you be open to a quick 15-minute call this week?\n\nBest regards`,
    preheader: `A personalized message for ${lead.name} at ${lead.company}`,
    personalizedElements: [lead.name, lead.company, lead.industry, ...(lead.painPoints?.slice(0, 2) ?? [])],
    estimatedOpenRate: 0.35,
  };
}

function buildDryRunFollowUp(lead: LeadContext, stage: number): GeneratedEmail {
  const subjects: Record<number, string> = {
    1: `Following up - ${lead.company}`,
    2: `${lead.name}, one more thought`,
    3: `Last attempt - ${lead.company}`,
  };
  return {
    subject: subjects[stage] ?? `Checking in - ${lead.company}`,
    body: `Hi ${lead.name},\n\nI wanted to follow up on my previous email. I believe we could help ${lead.company} overcome some key challenges in ${lead.industry}.\n\nWould a brief call work for you?\n\nBest regards`,
    preheader: `Follow-up #${stage} for ${lead.name}`,
    personalizedElements: [lead.name, lead.company],
    estimatedOpenRate: Math.max(0.15, 0.35 - stage * 0.08),
  };
}

function buildDryRunLinkedInMessage(
  lead: LeadContext,
  connectionStatus: "none" | "pending" | "connected",
): GeneratedMessage {
  const hooks: Record<string, string> = {
    none: `Hi ${lead.name}, I came across your work at ${lead.company} and was impressed by what you're building in ${lead.industry}.`,
    pending: `Hi ${lead.name}, thanks for connecting! I noticed we share an interest in ${lead.industry}.`,
    connected: `Hi ${lead.name}, great to be connected! I've been following ${lead.company}'s progress in ${lead.industry}.`,
  };
  const msg = hooks[connectionStatus] + " Would love to exchange ideas sometime.";
  return {
    message: msg,
    hookType: connectionStatus === "none" ? "cold-intro" : connectionStatus === "pending" ? "warm-follow" : "connected-engage",
    callToAction: "Would love to exchange ideas sometime.",
    characterCount: msg.length,
  };
}

function buildDryRunLandingPage(niche: string, service: string, targetAudience: string): LandingPageCopy {
  return {
    headline: `Transform Your ${niche} Business with ${service}`,
    subheadline: `Purpose-built for ${targetAudience} who demand results`,
    bullets: [
      `Increase your ${niche} leads by up to 3x`,
      `Save 10+ hours per week on manual outreach`,
      `Join 500+ ${niche} businesses already growing`,
      `Get started in under 5 minutes`,
    ],
    socialProof: `"${service} helped us double our pipeline in 60 days." - Leading ${niche} company`,
    ctaText: `Start Growing Your ${niche} Business`,
    urgencyElement: "Limited spots available - only 20 new accounts this month",
  };
}

function buildDryRunAdCopy(niche: string, platform: string, objective: string): AdCopy[] {
  return [
    {
      headline: `${niche} Businesses: ${objective}`,
      description: `Discover how leading ${niche} companies achieve ${objective}. Purpose-built solution with proven results.`,
      callToAction: "Get Started Free",
      targetKeywords: [niche, objective, `${niche} ${platform} ads`],
    },
    {
      headline: `Stop Losing ${niche} Leads`,
      description: `AI-powered lead generation for ${niche}. Automate outreach and close more deals.`,
      callToAction: "See Demo",
      targetKeywords: [niche, "lead generation", `${niche} leads`],
    },
    {
      headline: `#1 ${niche} Growth Platform`,
      description: `Trusted by 500+ ${niche} businesses. ${objective} with our proven system.`,
      callToAction: "Start Free Trial",
      targetKeywords: [niche, "growth", `${niche} software`],
    },
  ];
}

function buildDryRunBlogOutline(topic: string, niche: string, keywords: string[]): BlogOutline {
  return {
    title: `The Complete Guide to ${topic} for ${niche} Businesses`,
    sections: [
      { heading: `Introduction to ${topic}`, keyPoints: [`Why ${topic} matters for ${niche}`, "Current market landscape"] },
      { heading: "Key Strategies", keyPoints: ["Strategy 1: Automation", "Strategy 2: Personalization", "Strategy 3: Data-driven decisions"] },
      { heading: "Implementation Guide", keyPoints: ["Step-by-step setup", "Common pitfalls to avoid", "Measuring success"] },
      { heading: "Case Studies", keyPoints: [`Real ${niche} success stories`, "ROI analysis", "Lessons learned"] },
      { heading: "Conclusion", keyPoints: ["Key takeaways", "Next steps", "Resources"] },
    ],
    estimatedWordCount: 2500,
    targetKeywords: keywords.length > 0 ? keywords : [topic, niche, `${niche} ${topic}`],
  };
}

function buildDryRunCompanyAnalysis(content: string): CompanyAnalysis {
  const firstLine = content.split("\n")[0] ?? "Unknown Company";
  const name = firstLine.replace(/^#+\s*/, "").trim().slice(0, 50) || "Unknown Company";
  return {
    name,
    industry: "Technology",
    size: "51-200",
    techStack: ["React", "Node.js", "PostgreSQL"],
    painPoints: ["Lead generation efficiency", "Sales pipeline visibility", "Customer retention"],
    opportunities: ["AI-powered automation", "Multi-channel outreach", "Data-driven scoring"],
    competitivePosition: "Mid-market challenger with growth potential",
  };
}

function buildDryRunQualification(messages: ChatMessage[]): LeadQualification {
  const userMessages = messages.filter((m) => m.role === "user");
  const text = userMessages.map((m) => m.content.toLowerCase()).join(" ");
  const hasBudgetSignal = text.includes("budget") || text.includes("price") || text.includes("cost");
  const hasNeedSignal = text.includes("need") || text.includes("looking for") || text.includes("problem");
  const hasTimelineSignal = text.includes("asap") || text.includes("this quarter") || text.includes("soon");

  return {
    score: Math.min(100, 30 + (hasBudgetSignal ? 20 : 0) + (hasNeedSignal ? 25 : 0) + (hasTimelineSignal ? 15 : 0) + userMessages.length * 2),
    budget: hasBudgetSignal ? "medium" : "unknown",
    authority: text.includes("decision") || text.includes("ceo") || text.includes("director"),
    need: hasNeedSignal,
    timeline: hasTimelineSignal ? "This quarter" : "Unknown",
  };
}

function buildDryRunPitch(lead: LeadContext, company: CompanyAnalysis): PersonalizedPitch {
  return {
    openingLine: `${lead.name}, I've been following ${lead.company}'s growth in ${company.industry} and noticed some exciting opportunities.`,
    painPointAddress: company.painPoints.length > 0
      ? `I understand ${lead.company} faces challenges with ${company.painPoints[0]}. Many ${company.industry} companies struggle with this.`
      : `Companies in ${company.industry} often face challenges with lead generation and pipeline management.`,
    valueProposition: `Our platform helps ${company.industry} companies like ${lead.company} increase qualified leads by 3x while reducing manual outreach time by 80%.`,
    proofPoint: `We've helped 200+ ${company.industry} companies achieve an average 40% increase in conversion rates.`,
    callToAction: `Would you be open to a 15-minute call this week to explore how we can help ${lead.company}?`,
    objectionHandlers: [
      "We offer a 30-day free trial with no commitment required.",
      "Our solution integrates with your existing tools in under an hour.",
      `We have specific case studies from ${company.industry} companies your size.`,
    ],
  };
}

function buildDryRunChatResponse(message: string): ChatResponse {
  const lowerMessage = message.toLowerCase();
  const suggestedActions: string[] = [];
  const leadSignals: string[] = [];

  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    leadSignals.push("budget-inquiry");
    suggestedActions.push("Share pricing page", "Offer demo");
  }
  if (lowerMessage.includes("demo") || lowerMessage.includes("trial")) {
    leadSignals.push("high-intent");
    suggestedActions.push("Schedule demo call", "Send trial link");
  }

  return {
    message: `Thank you for your message. I'd be happy to help you with that. Could you tell me a bit more about what you're looking for so I can provide the most relevant information?`,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : ["Ask qualifying question", "Share resources"],
    leadSignals: leadSignals.length > 0 ? leadSignals : undefined,
  };
}

function buildDryRunExtractedInfo(messages: ChatMessage[]): ExtractedLeadInfo {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const emailMatch = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(userText);
  const interests: string[] = [];
  const painPoints: string[] = [];

  if (userText.toLowerCase().includes("lead")) interests.push("lead generation");
  if (userText.toLowerCase().includes("automat")) interests.push("automation");
  if (userText.toLowerCase().includes("slow") || userText.toLowerCase().includes("manual")) painPoints.push("manual processes");
  if (userText.toLowerCase().includes("expensive") || userText.toLowerCase().includes("cost")) painPoints.push("cost concerns");

  return {
    email: emailMatch?.[0],
    interests: interests.length > 0 ? interests : ["general inquiry"],
    painPoints,
  };
}

// ---------------------------------------------------------------------------
// JSON parsing helper
// ---------------------------------------------------------------------------

function parseJsonOrFallback<T>(raw: string, fallback: () => T): T {
  try {
    const jsonMatch = /\{[\s\S]*\}|\[[\s\S]*\]/.exec(raw);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
  } catch {
    // fall through
  }
  return fallback();
}
