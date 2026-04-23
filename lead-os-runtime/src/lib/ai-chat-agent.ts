import { callLLM, isAIEnabled, type LLMMessage } from "./ai-client.ts";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  tenantId: string;
  visitorId: string;
  messages: ChatMessage[];
  extractedData: {
    email?: string;
    phone?: string;
    name?: string;
    company?: string;
    niche?: string;
    intent?: string;
    urgency?: string;
    budget?: string;
    objections?: string[];
  };
  leadCaptured: boolean;
  score: number;
  createdAt: string;
  updatedAt: string;
}

const sessions = new Map<string, ChatSession>();

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;

const URGENCY_KEYWORDS = ["asap", "urgent", "immediately", "right away", "this week", "deadline", "rush"];
const BUDGET_KEYWORDS = ["budget", "afford", "cost", "price", "invest", "spend", "pay"];
const OBJECTION_PATTERNS = [
  { pattern: /too expensive|can't afford|out of.*budget/i, objection: "price-concern" },
  { pattern: /not sure|need to think|maybe later/i, objection: "indecision" },
  { pattern: /already have|currently using|happy with/i, objection: "incumbent-solution" },
  { pattern: /don't have time|too busy|not now/i, objection: "timing" },
  { pattern: /need to ask|check with|approval/i, objection: "authority" },
  { pattern: /how do I know|is it worth|prove/i, objection: "trust" },
];

const RULE_BASED_RESPONSES: Record<string, string> = {
  greeting: "Hello! I am here to help you explore how we can grow your business. What are the biggest challenges you are facing right now?",
  general: "That is a great point. Could you tell me a bit more about your business? Understanding your situation helps me give you the most relevant advice.",
  email_ask: "I would love to send you some tailored resources. What is the best email address to reach you?",
  name_ask: "By the way, I did not catch your name. Who am I speaking with today?",
  company_ask: "And what is the name of your company or business?",
  budget_response: "I understand budget is important. Our solutions are designed to pay for themselves through increased lead conversion. Most clients see positive ROI within the first 30 days.",
  objection_response: "I completely understand your concern. Many of our most successful clients had similar reservations initially. Would it help if I shared some specific results from businesses in your industry?",
  booking_prompt: "Based on what you have shared, I think a quick strategy session would be really valuable. We can map out exactly how to address these challenges. Would you like to schedule a 15-minute call?",
  fallback: "Thank you for sharing that. Let me think about the best way to help you with this. In the meantime, could you tell me a bit more about your goals for the next quarter?",
};

function generateSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildSystemPrompt(tenantId: string, niche?: string, brandName?: string): string {
  const brand = brandName ?? "our team";
  const nicheContext = niche ? ` specializing in ${niche}` : "";

  return `You are a helpful and knowledgeable business growth consultant for ${brand}${nicheContext}. Your goal is to understand the visitor's business challenges and guide them toward the right solution.

Key behaviors:
- Be warm, professional, and conversational. Never be pushy or salesy.
- Provide genuine value and insights before asking for anything.
- Naturally gather information throughout the conversation: name, email, company, budget range, timeline, and pain points.
- Ask one question at a time. Do not overwhelm with multiple questions.
- When you detect strong buying signals (specific pain, budget mentioned, timeline urgency), gently suggest booking a strategy session.
- Handle objections with empathy and evidence-based responses.
- Keep every response under 150 words.
- If someone shares contact information, acknowledge it naturally without making it feel transactional.
- Reference the visitor's specific situation and industry when possible.

Tenant: ${tenantId}
${niche ? `Industry/Niche: ${niche}` : ""}`;
}

export function startChatSession(
  tenantId: string,
  visitorId: string,
  niche?: string,
  brandName?: string,
): ChatSession {
  const id = generateSessionId();
  const systemPrompt = buildSystemPrompt(tenantId, niche, brandName);
  const now = new Date().toISOString();

  const session: ChatSession = {
    id,
    tenantId,
    visitorId,
    messages: [
      {
        role: "system",
        content: systemPrompt,
        timestamp: now,
      },
    ],
    extractedData: {
      niche: niche ?? undefined,
    },
    leadCaptured: false,
    score: 0,
    createdAt: now,
    updatedAt: now,
  };

  sessions.set(id, session);
  return session;
}

export async function processMessage(
  sessionId: string,
  userMessage: string,
): Promise<{ session: ChatSession; response: string }> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const now = new Date().toISOString();

  session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: now,
  });

  updateExtractedDataFromMessage(session, userMessage);

  let response: string;

  if (isAIEnabled()) {
    response = await getAIResponse(session);
  } else {
    response = getRuleBasedResponse(session, userMessage);
  }

  session.messages.push({
    role: "assistant",
    content: response,
    timestamp: new Date().toISOString(),
  });

  session.score = computeSessionScore(session);
  session.leadCaptured = Boolean(session.extractedData.email || session.extractedData.phone);
  session.updatedAt = new Date().toISOString();

  return { session, response };
}

export function getChatSession(sessionId: string): ChatSession | undefined {
  return sessions.get(sessionId);
}

export async function extractLeadData(
  messages: ChatMessage[],
): Promise<ChatSession["extractedData"]> {
  const conversationText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const extracted: ChatSession["extractedData"] = {};

  const emailMatch = conversationText.match(EMAIL_REGEX);
  if (emailMatch) extracted.email = emailMatch[0];

  const phoneMatch = conversationText.match(PHONE_REGEX);
  if (phoneMatch) extracted.phone = phoneMatch[0].trim();

  if (isAIEnabled()) {
    const llmMessages: LLMMessage[] = [
      {
        role: "system",
        content: `Extract structured lead data from the following conversation messages. Return ONLY a JSON object with these fields (omit fields you cannot determine):
- name: the person's full name
- company: company or business name
- intent: one of "browsing", "researching", "evaluating", "ready-to-buy"
- urgency: one of "none", "low", "medium", "high"
- budget: any budget information mentioned
- objections: array of concerns raised

Respond with ONLY the JSON object, no additional text.`,
      },
      {
        role: "user",
        content: conversationText,
      },
    ];

    try {
      const result = await callLLM(llmMessages, { maxTokens: 512, temperature: 0.3 });
      if (result.model !== "dry-run") {
        const parsed = JSON.parse(result.content) as Record<string, unknown>;
        if (typeof parsed.name === "string") extracted.name = parsed.name;
        if (typeof parsed.company === "string") extracted.company = parsed.company;
        if (typeof parsed.intent === "string") extracted.intent = parsed.intent;
        if (typeof parsed.urgency === "string") extracted.urgency = parsed.urgency;
        if (typeof parsed.budget === "string") extracted.budget = parsed.budget;
        if (Array.isArray(parsed.objections)) {
          extracted.objections = parsed.objections.filter(
            (o): o is string => typeof o === "string",
          );
        }
      }
    } catch {
      // Fall through to rule-based extraction
    }
  }

  if (!extracted.name) {
    extracted.name = extractNameFromText(conversationText);
  }
  if (!extracted.company) {
    extracted.company = extractCompanyFromText(conversationText);
  }

  return extracted;
}

function updateExtractedDataFromMessage(session: ChatSession, message: string): void {
  const emailMatch = message.match(EMAIL_REGEX);
  if (emailMatch) session.extractedData.email = emailMatch[0];

  const phoneMatch = message.match(PHONE_REGEX);
  if (phoneMatch) session.extractedData.phone = phoneMatch[0].trim();

  if (!session.extractedData.name) {
    const name = extractNameFromText(message);
    if (name) session.extractedData.name = name;
  }

  if (!session.extractedData.company) {
    const company = extractCompanyFromText(message);
    if (company) session.extractedData.company = company;
  }

  const lowerMessage = message.toLowerCase();

  if (!session.extractedData.urgency) {
    for (const keyword of URGENCY_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        session.extractedData.urgency = "high";
        break;
      }
    }
  }

  if (!session.extractedData.budget) {
    for (const keyword of BUDGET_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        session.extractedData.budget = extractBudgetFromText(message);
        break;
      }
    }
  }

  const newObjections: string[] = [];
  for (const { pattern, objection } of OBJECTION_PATTERNS) {
    if (pattern.test(message)) {
      newObjections.push(objection);
    }
  }
  if (newObjections.length > 0) {
    const existing = session.extractedData.objections ?? [];
    session.extractedData.objections = [...new Set([...existing, ...newObjections])];
  }
}

function extractNameFromText(text: string): string | undefined {
  const namePatterns = [
    /(?:my name is|I'm|I am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractCompanyFromText(text: string): string | undefined {
  const companyPatterns = [
    /(?:(?:work|working)\s+(?:at|for|with)|company\s+(?:is|called)|from|at)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\.|,|$|\s+and\s)/i,
    /(?:run|own|manage|founded)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\.|,|$|\s+and\s)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const company = match[1].trim();
      if (company.length >= 2 && company.length <= 100) return company;
    }
  }
  return undefined;
}

function extractBudgetFromText(text: string): string | undefined {
  const budgetPatterns = [
    /\$[\d,]+(?:\s*[-to]+\s*\$?[\d,]+)?/i,
    /(\d+(?:,\d+)?)\s*(?:k|thousand|K)/i,
    /budget\s+(?:is\s+)?(?:around\s+)?\$?(\d[\d,]*)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return undefined;
}

async function getAIResponse(session: ChatSession): Promise<string> {
  const llmMessages: LLMMessage[] = session.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const contextNote = buildContextNote(session);
  if (contextNote) {
    llmMessages.push({
      role: "system",
      content: contextNote,
    });
  }

  try {
    const result = await callLLM(llmMessages, { maxTokens: 300, temperature: 0.7 });
    return result.content;
  } catch {
    return getRuleBasedResponse(
      session,
      session.messages[session.messages.length - 1]?.content ?? "",
    );
  }
}

function buildContextNote(session: ChatSession): string | null {
  const extracted = session.extractedData;
  const parts: string[] = [];

  if (extracted.email) parts.push(`Visitor email: ${extracted.email}`);
  if (extracted.name) parts.push(`Visitor name: ${extracted.name}`);
  if (extracted.company) parts.push(`Company: ${extracted.company}`);
  if (extracted.urgency) parts.push(`Urgency level: ${extracted.urgency}`);
  if (extracted.objections?.length) parts.push(`Objections raised: ${extracted.objections.join(", ")}`);

  const messageCount = session.messages.filter((m) => m.role === "user").length;
  if (messageCount >= 3 && !extracted.email) {
    parts.push("Hint: This is a good time to naturally ask for contact information or suggest booking a call.");
  }

  return parts.length > 0
    ? `[Context for this response - do not repeat these verbatim]\n${parts.join("\n")}`
    : null;
}

function getRuleBasedResponse(session: ChatSession, userMessage: string): string {
  const userMessageCount = session.messages.filter((m) => m.role === "user").length;
  const lowerMessage = userMessage.toLowerCase();
  const extracted = session.extractedData;

  if (userMessageCount <= 1) {
    return RULE_BASED_RESPONSES.greeting;
  }

  for (const { pattern } of OBJECTION_PATTERNS) {
    if (pattern.test(userMessage)) {
      return RULE_BASED_RESPONSES.objection_response;
    }
  }

  for (const keyword of BUDGET_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return RULE_BASED_RESPONSES.budget_response;
    }
  }

  if (userMessageCount >= 4 && !extracted.email) {
    return RULE_BASED_RESPONSES.email_ask;
  }

  if (userMessageCount >= 3 && !extracted.name) {
    return RULE_BASED_RESPONSES.name_ask;
  }

  if (userMessageCount >= 5 && !extracted.company) {
    return RULE_BASED_RESPONSES.company_ask;
  }

  if (
    userMessageCount >= 5 &&
    (extracted.email || extracted.phone) &&
    (extracted.urgency === "high" || session.score >= 60)
  ) {
    return RULE_BASED_RESPONSES.booking_prompt;
  }

  if (userMessageCount >= 3) {
    return RULE_BASED_RESPONSES.general;
  }

  return RULE_BASED_RESPONSES.fallback;
}

function computeSessionScore(session: ChatSession): number {
  let score = 0;
  const extracted = session.extractedData;
  const messageCount = session.messages.filter((m) => m.role === "user").length;

  score += Math.min(messageCount * 5, 25);

  if (extracted.email) score += 20;
  if (extracted.phone) score += 15;
  if (extracted.name) score += 10;
  if (extracted.company) score += 10;
  if (extracted.budget) score += 10;
  if (extracted.urgency === "high") score += 15;
  if (extracted.intent === "ready-to-buy") score += 20;
  else if (extracted.intent === "evaluating") score += 10;

  if (extracted.objections && extracted.objections.length > 0) {
    score += 5;
  }

  return Math.min(score, 100);
}
