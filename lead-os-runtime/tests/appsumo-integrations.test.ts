import test from "node:test";
import assert from "node:assert/strict";

import {
  createWidget,
  listWidgets,
  deleteWidget,
  recordCapturedLead,
  getCapturedLeads,
  createAbTest,
  getAbTestResults,
  generateEmbedScript as claspoEmbed,
  healthCheck as claspoHealth,
  resetClaspoStore,
} from "../src/lib/integrations/claspo-adapter.ts";

import {
  createChatbot,
  listChatbots,
  deleteChatbot,
  createKnowledgeBase,
  startSession,
  addMessage,
  captureLeadData,
  markQualified,
  getSession,
  generateEmbedScript as pickaxeEmbed,
  healthCheck as pickaxeHealth,
  resetPickaxeStore,
} from "../src/lib/integrations/pickaxe-adapter.ts";

import {
  generateVideo,
  listVideos as meiroListVideos,
  deleteVideo as meiroDeleteVideo,
  generateBatch,
  generatePersonalizedVideo,
  getAvatars,
  healthCheck as meiroHealth,
  resetMeiroStore,
} from "../src/lib/integrations/meiro-adapter.ts";

import {
  createContact,
  listContacts,
  updateContact,
  deleteContact,
  createPipeline,
  createDeal,
  listDeals,
  syncLeadsToSalesNexus,
  healthCheck as salesnexusHealth,
  resetSalesNexusStore,
} from "../src/lib/integrations/salesnexus-adapter.ts";

import {
  createAgent,
  listAgents,
  deleteAgent,
  triggerCall,
  listCalls,
  triggerBatchCalls,
  getCallSummary,
  healthCheck as thoughtlyHealth,
  resetThoughtlyStore,
} from "../src/lib/integrations/thoughtly-adapter.ts";

import {
  createPage,
  listPages,
  publishPage,
  deletePage,
  embedWidget,
  listWidgets as brizyListWidgets,
  getTemplates as brizyTemplates,
  healthCheck as brizyHealth,
  resetBrizyStore,
} from "../src/lib/integrations/brizy-adapter.ts";

import {
  createCampaign as sinoCreateCampaign,
  sendCampaign as sinoSendCampaign,
  listCampaigns as sinoListCampaigns,
  createSequence as sinoCreateSequence,
  enrollInSequence,
  listEnrollments,
  healthCheck as sinosendHealth,
  resetSinosendStore,
} from "../src/lib/integrations/sinosend-adapter.ts";

import {
  sendSms,
  listMessages,
  createCampaign as etCreateCampaign,
  sendCampaign as etSendCampaign,
  createSequence as etCreateSequence,
  listSequences as etListSequences,
  healthCheck as easyTextHealth,
  resetEasyTextStore,
} from "../src/lib/integrations/easy-text-adapter.ts";

import {
  createVideo as zcCreateVideo,
  listVideos as zcListVideos,
  deleteVideo as zcDeleteVideo,
  createFromTemplate as zcFromTemplate,
  createBatch as zcBatch,
  getTemplates as zcTemplates,
  healthCheck as zebracatHealth,
  resetZebracatStore,
} from "../src/lib/integrations/zebracat-adapter.ts";

import {
  uploadVideo,
  listVideos as gumletListVideos,
  deleteVideo as gumletDeleteVideo,
  getVideoAnalytics,
  recordView,
  generateEmbedCode,
  getProfiles,
  healthCheck as gumletHealth,
  resetGumletStore,
} from "../src/lib/integrations/gumlet-adapter.ts";

import { PROVIDER_CATALOG } from "../src/lib/credentials-vault.ts";

const T = "tenant-appsumo-test";

// ---------------------------------------------------------------------------
// Claspo
// ---------------------------------------------------------------------------

test.beforeEach(() => {
  resetClaspoStore();
  resetPickaxeStore();
  resetMeiroStore();
  resetSalesNexusStore();
  resetThoughtlyStore();
  resetBrizyStore();
  resetSinosendStore();
  resetEasyTextStore();
  resetZebracatStore();
  resetGumletStore();
});

test("Claspo: create widget and list by tenant", async () => {
  const widget = await createWidget(T, "Exit Popup", "popup", { exitIntent: true }, "<div>Popup</div>");
  assert.equal(widget.type, "popup");
  assert.equal(widget.targeting.exitIntent, true);

  const list = await listWidgets(T);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, widget.id);
});

test("Claspo: capture leads from widget", async () => {
  const widget = await createWidget(T, "Banner", "banner", {}, "<div>Banner</div>");
  await recordCapturedLead(widget.id, "lead@example.com", "Jane");
  await recordCapturedLead(widget.id, "lead2@example.com");

  const leads = await getCapturedLeads(widget.id);
  assert.equal(leads.length, 2);
  assert.equal(leads[0].email, "lead@example.com");
  assert.equal(leads[0].name, "Jane");
});

test("Claspo: A/B test creation and results", async () => {
  const widget = await createWidget(T, "Spin Wheel", "spin-to-win", {}, "<div>Spin</div>");
  const variants = await createAbTest(widget.id, [
    { name: "Variant A", weight: 50 },
    { name: "Variant B", weight: 50 },
  ]);
  assert.equal(variants.length, 2);

  const results = await getAbTestResults(widget.id);
  assert.equal(results.length, 2);
  assert.equal(results[0].impressions, 0);
});

test("Claspo: generate embed script", () => {
  const script = claspoEmbed("widget-123", { apiKey: "test-key" });
  assert.ok(script.includes("widget-123"));
  assert.ok(script.includes("test-key"));
});

test("Claspo: health check fails without API key", async () => {
  const result = await claspoHealth({ apiKey: "" });
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("not configured"));
});

// ---------------------------------------------------------------------------
// Pickaxe
// ---------------------------------------------------------------------------

test("Pickaxe: create chatbot and list by tenant", async () => {
  const kb = await createKnowledgeBase(T, "Product Docs");
  const bot = await createChatbot(T, "Sales Bot", kb.id, "Hello!", ["What is your budget?"]);
  assert.equal(bot.name, "Sales Bot");
  assert.equal(bot.qualificationQuestions.length, 1);

  const bots = await listChatbots(T);
  assert.equal(bots.length, 1);
});

test("Pickaxe: chat session with lead capture and qualification", async () => {
  const kb = await createKnowledgeBase(T, "KB");
  const bot = await createChatbot(T, "Bot", kb.id, "Hi", []);
  const session = await startSession(bot.id, "visitor-1");

  await addMessage(session.id, "user", "I need help");
  await addMessage(session.id, "assistant", "Sure, what is your email?");
  await captureLeadData(session.id, { email: "visitor@example.com", budget: "10k" });
  const qualified = await markQualified(session.id);

  assert.equal(qualified.qualified, true);
  assert.equal(qualified.capturedData.email, "visitor@example.com");
  assert.equal(qualified.messages.length, 2);
  assert.ok(qualified.endedAt);
});

test("Pickaxe: generate embed script", () => {
  const script = pickaxeEmbed("bot-abc", { apiKey: "pk-key" });
  assert.ok(script.includes("bot-abc"));
  assert.ok(script.includes("pk-key"));
});

test("Pickaxe: health check fails without API key", async () => {
  const result = await pickaxeHealth({ apiKey: "" });
  assert.equal(result.ok, false);
});

// ---------------------------------------------------------------------------
// Meiro
// ---------------------------------------------------------------------------

test("Meiro: generate avatar video", async () => {
  const video = await generateVideo(T, "avatar-business-m1", "Hello, welcome to our product demo.", "en");
  assert.ok(video.id.startsWith("mvid-"));
  assert.equal(video.status, "completed");
  assert.ok(video.videoUrl);
  assert.ok(video.durationSeconds! > 0);
});

test("Meiro: batch generation creates multiple videos", async () => {
  const batch = await generateBatch(T, [
    { avatarId: "avatar-business-m1", script: "Video one script" },
    { avatarId: "avatar-casual-f1", script: "Video two script", language: "es" },
  ]);
  assert.equal(batch.videoIds.length, 2);
  assert.equal(batch.status, "completed");

  const videos = await meiroListVideos(T);
  assert.equal(videos.length, 2);
});

test("Meiro: personalized video replaces name placeholder", async () => {
  const video = await generatePersonalizedVideo(T, "avatar-business-f1", "Alice", "Hello {{name}}, this is for you.");
  assert.ok(video.script.includes("Alice"));
  assert.ok(!video.script.includes("{{name}}"));
});

test("Meiro: available avatars list", () => {
  const avatars = getAvatars();
  assert.ok(avatars.length >= 6);
  assert.ok(avatars.some((a) => a.style === "business"));
});

// ---------------------------------------------------------------------------
// SalesNexus
// ---------------------------------------------------------------------------

test("SalesNexus: create and list contacts", async () => {
  await createContact({ email: "john@example.com", firstName: "John", lastName: "Doe", score: 85, tenantId: T });
  await createContact({ email: "jane@example.com", firstName: "Jane", lastName: "Smith", tenantId: T });

  const contacts = await listContacts({ tenantId: T });
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].status, "lead");
});

test("SalesNexus: sync leads with create and update", async () => {
  await createContact({ email: "existing@example.com", firstName: "Old", lastName: "Name", tenantId: T });

  const result = await syncLeadsToSalesNexus(T, [
    { email: "existing@example.com", firstName: "Updated", lastName: "Name", score: 90 },
    { email: "new@example.com", firstName: "New", lastName: "Lead" },
  ]);

  assert.equal(result.updated, 1);
  assert.equal(result.created, 1);
  assert.equal(result.errors.length, 0);
});

test("SalesNexus: create pipeline and deal", async () => {
  const contact = await createContact({ email: "deal@example.com", firstName: "Deal", lastName: "Person", tenantId: T });
  const pipeline = await createPipeline(T, "Sales Pipeline", ["prospect", "negotiation", "closed"]);
  const deal = await createDeal({ contactId: contact.id, title: pipeline.id, stage: "prospect", value: 5000, tenantId: T });

  assert.equal(deal.status, "open");
  assert.equal(deal.value, 5000);

  const deals = await listDeals({ tenantId: T });
  assert.equal(deals.length, 1);
});

// ---------------------------------------------------------------------------
// Thoughtly
// ---------------------------------------------------------------------------

test("Thoughtly: create voice agent and trigger call", async () => {
  const agent = await createAgent(T, "Qualifier Bot", "Hello, I'm calling about...", "voice-en-us-1", ["budget", "timeline"]);
  assert.equal(agent.active, true);

  const call = await triggerCall(T, agent.id, "+15551234567");
  assert.equal(call.status, "completed");
  assert.ok(call.transcript);
  assert.ok(call.durationSeconds! > 0);
});

test("Thoughtly: batch calls and summary", async () => {
  const agent = await createAgent(T, "Batch Bot", "Script", "voice-1", []);
  await triggerBatchCalls(T, agent.id, ["+15551111111", "+15552222222", "+15553333333"]);

  const calls = await listCalls(T);
  assert.equal(calls.length, 3);

  const summary = await getCallSummary(T);
  assert.equal(summary.totalCalls, 3);
  assert.ok(summary.averageDuration > 0);
});

test("Thoughtly: trigger call fails for nonexistent agent", async () => {
  await assert.rejects(
    () => triggerCall(T, "nonexistent-agent", "+15550000000"),
    { message: /Voice agent not found/ },
  );
});

// ---------------------------------------------------------------------------
// Brizy
// ---------------------------------------------------------------------------

test("Brizy: create and publish page", async () => {
  const page = await createPage(T, "My Landing Page", "tmpl-landing");
  assert.equal(page.status, "draft");
  assert.ok(page.html.includes("My Landing Page"));

  const published = await publishPage(page.id);
  assert.equal(published.status, "published");
  assert.ok(published.publishedUrl);
});

test("Brizy: embed widgets on page", async () => {
  const page = await createPage(T, "Lead Page");
  await embedWidget(page.id, "lead-form", { fields: ["name", "email"] });
  await embedWidget(page.id, "chatbot", { botId: "bot-123" });

  const widgets = await brizyListWidgets(page.id);
  assert.equal(widgets.length, 2);
  assert.equal(widgets[0].type, "lead-form");
});

test("Brizy: templates available", () => {
  const templates = brizyTemplates();
  assert.ok(templates.length >= 5);
  assert.ok(templates.some((t) => t.category === "marketing"));
});

// ---------------------------------------------------------------------------
// Sinosend
// ---------------------------------------------------------------------------

test("Sinosend: create and send campaign", async () => {
  const campaign = await sinoCreateCampaign(T, "Welcome", "Welcome!", "<p>Hi</p>", ["a@b.com", "c@d.com"]);
  assert.equal(campaign.status, "draft");

  const sent = await sinoSendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.equal(sent.stats.sent, 2);
});

test("Sinosend: create sequence and enroll", async () => {
  const seq = await sinoCreateSequence(T, "Nurture", "lead-score-change", [
    { delayHours: 0, subject: "Welcome", htmlBody: "<p>Welcome</p>" },
    { delayHours: 24, subject: "Follow up", htmlBody: "<p>Following up</p>" },
  ]);
  assert.equal(seq.steps.length, 2);
  assert.equal(seq.trigger, "lead-score-change");

  await enrollInSequence(seq.id, "user@example.com");
  const enrollments = await listEnrollments(seq.id);
  assert.equal(enrollments.length, 1);
  assert.equal(enrollments[0].status, "active");
});

test("Sinosend: health check fails without API key", async () => {
  const result = await sinosendHealth({ apiKey: "" });
  assert.equal(result.ok, false);
});

// ---------------------------------------------------------------------------
// Easy Text Marketing
// ---------------------------------------------------------------------------

test("Easy Text: send SMS and list messages", async () => {
  const msg = await sendSms(T, "+15551234567", "Your lead is hot!");
  assert.equal(msg.status, "delivered");
  assert.ok(msg.sentAt);

  const messages = await listMessages(T);
  assert.equal(messages.length, 1);
});

test("Easy Text: create and send SMS campaign", async () => {
  const campaign = await etCreateCampaign(T, "Promo", "50% off today!", ["+15551111111", "+15552222222"]);
  assert.equal(campaign.status, "draft");

  const sent = await etSendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.equal(sent.stats.delivered, 2);
});

test("Easy Text: create SMS sequence", async () => {
  const seq = await etCreateSequence(T, "Follow-up", "lead-event", [
    { delayMinutes: 0, body: "Thanks for your interest!" },
    { delayMinutes: 60, body: "Just checking in..." },
  ]);
  assert.equal(seq.steps.length, 2);
  assert.equal(seq.active, true);

  const sequences = await etListSequences(T);
  assert.equal(sequences.length, 1);
});

// ---------------------------------------------------------------------------
// Zebracat
// ---------------------------------------------------------------------------

test("Zebracat: create video from text", async () => {
  const video = await zcCreateVideo(T, "Product Demo", "This is a demo of our product features and benefits.");
  assert.ok(video.id.startsWith("zvid-"));
  assert.equal(video.status, "completed");
  assert.ok(video.videoUrl);
  assert.ok(video.durationSeconds! > 0);
});

test("Zebracat: create from template", async () => {
  const video = await zcFromTemplate(T, "zt-social", "Social Clip", "Quick hook for social media.");
  assert.equal(video.style, "social-post");
});

test("Zebracat: batch creation", async () => {
  const videos = await zcBatch(T, [
    { title: "Ad 1", script: "Buy now", style: "ad" as const },
    { title: "Ad 2", script: "Limited offer" },
  ]);
  assert.equal(videos.length, 2);

  const all = await zcListVideos(T);
  assert.equal(all.length, 2);
});

test("Zebracat: templates available", () => {
  const templates = zcTemplates();
  assert.ok(templates.length >= 5);
  assert.ok(templates.some((t) => t.style === "explainer"));
});

// ---------------------------------------------------------------------------
// Gumlet
// ---------------------------------------------------------------------------

test("Gumlet: upload and host video", async () => {
  const video = await uploadVideo(T, "Demo Video", "https://source.example.com/video.mp4");
  assert.ok(video.id.startsWith("gvid-"));
  assert.equal(video.status, "ready");
  assert.ok(video.playbackUrl);
  assert.ok(video.embedCode.includes("iframe"));
});

test("Gumlet: track video analytics", async () => {
  const video = await uploadVideo(T, "Tracked Video", "https://source.example.com/v2.mp4");
  await recordView(video.id, 75);
  await recordView(video.id, 95);

  const analytics = await getVideoAnalytics(video.id);
  assert.ok(analytics);
  assert.equal(analytics.views, 2);
  assert.ok(analytics.totalWatchTime > 0);
});

test("Gumlet: generate embed code with options", () => {
  const code = generateEmbedCode("gvid-123", 800, 450, true);
  assert.ok(code.includes("800"));
  assert.ok(code.includes("450"));
  assert.ok(code.includes("autoplay=1"));
});

test("Gumlet: transcode profiles available", () => {
  const profiles = getProfiles();
  assert.ok(profiles.length >= 4);
  assert.ok(profiles.some((p) => p.name === "1080p"));
});

// ---------------------------------------------------------------------------
// Provider catalog validation
// ---------------------------------------------------------------------------

test("PROVIDER_CATALOG includes all 10 AppSumo providers", () => {
  const names = PROVIDER_CATALOG.map((p) => p.provider);
  assert.ok(names.includes("claspo"), "claspo missing");
  assert.ok(names.includes("pickaxe"), "pickaxe missing");
  assert.ok(names.includes("meiro"), "meiro missing");
  assert.ok(names.includes("salesnexus"), "salesnexus missing");
  assert.ok(names.includes("thoughtly"), "thoughtly missing");
  assert.ok(names.includes("brizy"), "brizy missing");
  assert.ok(names.includes("sinosend"), "sinosend missing");
  assert.ok(names.includes("easy_text_marketing"), "easy_text_marketing missing");
  assert.ok(names.includes("zebracat"), "zebracat missing");
  assert.ok(names.includes("gumlet"), "gumlet missing");
});

test("PROVIDER_CATALOG has correct categories for AppSumo tools", () => {
  const byName = (name: string) => PROVIDER_CATALOG.find((p) => p.provider === name);
  assert.equal(byName("claspo")?.category, "conversion-optimization");
  assert.equal(byName("pickaxe")?.category, "ai-chatbot");
  assert.equal(byName("meiro")?.category, "ai-video");
  assert.equal(byName("salesnexus")?.category, "crm");
  assert.equal(byName("thoughtly")?.category, "ai-voice");
  assert.equal(byName("brizy")?.category, "page-builder");
  assert.equal(byName("sinosend")?.category, "email");
  assert.equal(byName("easy_text_marketing")?.category, "sms");
  assert.equal(byName("zebracat")?.category, "ai-video");
  assert.equal(byName("gumlet")?.category, "video-hosting");
});

test("All AppSumo providers have fields and enables defined", () => {
  const appsumoProviders = ["claspo", "pickaxe", "meiro", "salesnexus", "thoughtly", "brizy", "sinosend", "easy_text_marketing", "zebracat", "gumlet"];
  for (const name of appsumoProviders) {
    const provider = PROVIDER_CATALOG.find((p) => p.provider === name);
    assert.ok(provider, `${name} not found in catalog`);
    assert.ok(provider.fields.length > 0, `${name} has no fields`);
    assert.ok(provider.enables.length > 0, `${name} has no enables`);
  }
});
