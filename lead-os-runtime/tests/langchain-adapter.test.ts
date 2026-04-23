import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateColdEmail,
  generateFollowUpEmail,
  generateLinkedInMessage,
  generateLandingPageCopy,
  generateAdCopy,
  generateBlogOutline,
  analyzeCompanyFromWebsite,
  qualifyLeadFromConversation,
  generatePersonalizedPitch,
  createChatSession,
  sendChatMessage,
  getChatHistory,
  extractLeadInfoFromChat,
  resetLangchainStore,
  type LeadContext,
  type ChatMessage,
  type CompanyAnalysis,
} from "../src/lib/integrations/langchain-adapter.ts";

const baseLead: LeadContext = {
  name: "Jane Smith",
  company: "Acme Corp",
  title: "VP of Marketing",
  industry: "SaaS",
  painPoints: ["low conversion rates", "manual outreach"],
  score: 75,
};

beforeEach(() => {
  resetLangchainStore();
});

// ---------------------------------------------------------------------------
// generateColdEmail
// ---------------------------------------------------------------------------

test("generateColdEmail returns a valid email structure in dry-run mode", async () => {
  const email = await generateColdEmail(baseLead);
  assert.ok(email.subject.length > 0);
  assert.ok(email.body.includes(baseLead.name));
  assert.ok(email.body.includes(baseLead.company));
  assert.ok(email.preheader.length > 0);
  assert.ok(email.personalizedElements.length > 0);
  assert.ok(email.estimatedOpenRate > 0);
  assert.ok(email.estimatedOpenRate <= 1);
});

test("generateColdEmail includes pain points when provided", async () => {
  const email = await generateColdEmail(baseLead);
  assert.ok(email.body.includes("low conversion rates"));
});

// ---------------------------------------------------------------------------
// generateFollowUpEmail
// ---------------------------------------------------------------------------

test("generateFollowUpEmail returns a follow-up email with decreasing open rate", async () => {
  const stage1 = await generateFollowUpEmail(baseLead, ["initial email"], 1);
  const stage3 = await generateFollowUpEmail(baseLead, ["initial email", "follow-up 1", "follow-up 2"], 3);
  assert.ok(stage1.subject.length > 0);
  assert.ok(stage3.subject.length > 0);
  assert.ok(stage1.estimatedOpenRate > stage3.estimatedOpenRate);
});

// ---------------------------------------------------------------------------
// generateLinkedInMessage
// ---------------------------------------------------------------------------

test("generateLinkedInMessage returns different hook types per connection status", async () => {
  const none = await generateLinkedInMessage(baseLead, "none");
  const connected = await generateLinkedInMessage(baseLead, "connected");
  assert.equal(none.hookType, "cold-intro");
  assert.equal(connected.hookType, "connected-engage");
  assert.ok(none.characterCount > 0);
  assert.equal(none.characterCount, none.message.length);
});

// ---------------------------------------------------------------------------
// generateLandingPageCopy
// ---------------------------------------------------------------------------

test("generateLandingPageCopy returns all required fields", async () => {
  const copy = await generateLandingPageCopy("pest-control", "Lead Generation", "small business owners");
  assert.ok(copy.headline.includes("pest-control"));
  assert.ok(copy.subheadline.length > 0);
  assert.ok(copy.bullets.length >= 3);
  assert.ok(copy.socialProof.length > 0);
  assert.ok(copy.ctaText.length > 0);
  assert.ok(copy.urgencyElement.length > 0);
});

// ---------------------------------------------------------------------------
// generateAdCopy
// ---------------------------------------------------------------------------

test("generateAdCopy returns multiple ad variations", async () => {
  const ads = await generateAdCopy("dental", "google", "increase new patients");
  assert.ok(ads.length >= 2);
  for (const ad of ads) {
    assert.ok(ad.headline.length > 0);
    assert.ok(ad.description.length > 0);
    assert.ok(ad.callToAction.length > 0);
    assert.ok(ad.targetKeywords.length > 0);
  }
});

// ---------------------------------------------------------------------------
// generateBlogOutline
// ---------------------------------------------------------------------------

test("generateBlogOutline returns structured outline with sections", async () => {
  const outline = await generateBlogOutline("Lead Scoring", "SaaS", ["lead scoring", "B2B sales"]);
  assert.ok(outline.title.length > 0);
  assert.ok(outline.sections.length >= 3);
  assert.ok(outline.estimatedWordCount > 0);
  assert.ok(outline.targetKeywords.length > 0);
  for (const section of outline.sections) {
    assert.ok(section.heading.length > 0);
    assert.ok(section.keyPoints.length > 0);
  }
});

// ---------------------------------------------------------------------------
// analyzeCompanyFromWebsite
// ---------------------------------------------------------------------------

test("analyzeCompanyFromWebsite extracts company analysis from scraped content", async () => {
  const content = "# TechStart Inc\n\nWe build innovative SaaS solutions for enterprise customers. Our team of 150 engineers uses React and Node.js.";
  const analysis = await analyzeCompanyFromWebsite(content);
  assert.ok(analysis.name.length > 0);
  assert.ok(analysis.industry.length > 0);
  assert.ok(analysis.painPoints.length > 0);
  assert.ok(analysis.opportunities.length > 0);
  assert.ok(analysis.competitivePosition.length > 0);
});

// ---------------------------------------------------------------------------
// qualifyLeadFromConversation
// ---------------------------------------------------------------------------

test("qualifyLeadFromConversation returns higher score for budget/need signals", async () => {
  const lowSignalMessages: ChatMessage[] = [
    { role: "user", content: "Hello, just browsing", timestamp: new Date().toISOString() },
  ];
  const highSignalMessages: ChatMessage[] = [
    { role: "user", content: "We need a solution for lead generation ASAP", timestamp: new Date().toISOString() },
    { role: "user", content: "Our budget is around $5000/month", timestamp: new Date().toISOString() },
    { role: "user", content: "I'm the director and make the decision", timestamp: new Date().toISOString() },
  ];

  const low = await qualifyLeadFromConversation(lowSignalMessages);
  const high = await qualifyLeadFromConversation(highSignalMessages);

  assert.ok(high.score > low.score);
  assert.equal(high.need, true);
  assert.ok(high.budget !== "unknown");
  assert.equal(high.authority, true);
});

// ---------------------------------------------------------------------------
// Chat session
// ---------------------------------------------------------------------------

test("createChatSession and sendChatMessage round-trip", async () => {
  const tenantId = `test-${Date.now()}`;
  const session = await createChatSession(tenantId, "visitor-1");
  assert.ok(session.id.startsWith("chat-"));
  assert.equal(session.tenantId, tenantId);
  assert.equal(session.visitorId, "visitor-1");

  const response = await sendChatMessage(session.id, "What services do you offer?");
  assert.ok(response.message.length > 0);
  assert.ok(Array.isArray(response.suggestedActions));
});

test("getChatHistory returns user and assistant messages without system", async () => {
  const tenantId = `test-${Date.now()}`;
  const session = await createChatSession(tenantId, "visitor-2");
  await sendChatMessage(session.id, "Hello");
  await sendChatMessage(session.id, "Tell me about pricing");

  const history = await getChatHistory(session.id);
  assert.ok(history.length >= 4);
  assert.ok(history.every((m) => m.role !== "system"));
});

test("extractLeadInfoFromChat extracts signals from conversation", async () => {
  const tenantId = `test-${Date.now()}`;
  const session = await createChatSession(tenantId, "visitor-3");
  await sendChatMessage(session.id, "Hi, I'm looking for lead generation automation");
  await sendChatMessage(session.id, "The manual process is too slow and expensive");

  const info = await extractLeadInfoFromChat(session.id);
  assert.ok(Array.isArray(info.interests));
  assert.ok(Array.isArray(info.painPoints));
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

test("sendChatMessage throws for unknown session", async () => {
  await assert.rejects(
    () => sendChatMessage("nonexistent-session", "hello"),
    { message: "Chat session not found: nonexistent-session" },
  );
});

test("getChatHistory throws for unknown session", async () => {
  await assert.rejects(
    () => getChatHistory("nonexistent-session"),
    { message: "Chat session not found: nonexistent-session" },
  );
});

test("extractLeadInfoFromChat throws for unknown session", async () => {
  await assert.rejects(
    () => extractLeadInfoFromChat("nonexistent-session"),
    { message: "Chat session not found: nonexistent-session" },
  );
});

// ---------------------------------------------------------------------------
// generatePersonalizedPitch
// ---------------------------------------------------------------------------

test("generatePersonalizedPitch returns a complete pitch structure", async () => {
  const company: CompanyAnalysis = {
    name: "Acme Corp",
    industry: "SaaS",
    size: "51-200",
    techStack: ["React", "Node.js"],
    painPoints: ["low conversion rates"],
    opportunities: ["AI automation"],
    competitivePosition: "Mid-market challenger",
  };

  const pitch = await generatePersonalizedPitch(baseLead, company);
  assert.ok(pitch.openingLine.includes(baseLead.name));
  assert.ok(pitch.painPointAddress.length > 0);
  assert.ok(pitch.valueProposition.length > 0);
  assert.ok(pitch.proofPoint.length > 0);
  assert.ok(pitch.callToAction.length > 0);
  assert.ok(pitch.objectionHandlers.length >= 2);
});
