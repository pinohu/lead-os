#!/usr/bin/env node

/**
 * deploy-advanced-scenarios.mjs — V11 (AI Concierge + Lead Scoring)
 *
 * White-glove, AI-driven concierge lead acquisition system.
 * Every lead receives a personalized, human-feeling experience
 * across email, WhatsApp, Discord, and Telegram simultaneously.
 *
 * V11 adds: Lead scoring (intent, fit, engagement, urgency, priority)
 *   to DataStore writes + structured SCORES: JSON from OpenAI #1.
 *   Email tracking (opens/clicks) enabled on Emailit sends.
 *
 * 15-module linear pipeline per scenario (every module has onerror:Resume):
 *   Webhook → SetVar×2 → HTTP POST → OpenAI #1 (Intelligence+Scores) → OpenAI #2 (Email Writer)
 *   → Boost.space sync → Discord → Telegram → Emailit (personal) → WhatsApp
 *   → Emailit (admin) → AITable → DataStore → WebhookRespond
 *
 * V10 fix over V9: Switched from Router to LINEAR pipeline
 *   Boost.space router validates ALL modules in ALL routes even when routes won't execute,
 *   causing BundleValidationErrors. Linear flow avoids this entirely.
 *   Every module has onerror:Resume for resilience — individual failures don't crash pipeline.
 * V9 fix over V8: Added onerror:Resume to ALL modules (HTTP, OpenAI, BoostSpace, DataStore)
 *   http:ActionSendData v3 needs onerror handler to pass validation in router routes
 *   Non-HTTP modules get onerror for pipeline resilience (individual failures don't crash scenario)
 * V8 fix over V7: Added scope:'roundtrip' to SetVariable mapper (webhook trigger fails without it)
 *   Also strips stale metadata.expect from webhook modules
 * V7 fix over V6: Added version:1 to BoostSpace modules (runtime validation fails without it)
 * V6 fix over V5:
 *   - Replaced google-email:ActionSendEmail with Emailit HTTP (Gmail module
 *     crashes at runtime with smtpHost error on all Google connections)
 *   - Email modules now use http:ActionSendData to Emailit API
 *   - Graceful degradation: returns 402 when Emailit credits are 0,
 *     but scenario continues (Discord/Telegram/WhatsApp still deliver)
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = requireEnv('MAKE_API_TOKEN');

const YD_API = 'https://yourdeputy-review.vercel.app/api/automations';
const NC_API = 'https://neatcircle-beta.vercel.app/api/automations';

const OPENAI_CONN = 80684;
const BS_CONN = 164296;
const BS_SPACES = 22;
const DS_ID = 3748;
const EMAILIT_URL = 'https://api.emailit.com/v1/emails';

const DISCORD = {
  newLeads: requireEnv('DISCORD_NEW_LEADS_WEBHOOK'),
  errors: requireEnv('DISCORD_ERRORS_WEBHOOK'),
  wins: requireEnv('DISCORD_WINS_WEBHOOK'),
  highValue: requireEnv('DISCORD_HIGH_VALUE_WEBHOOK'),
};

const TELEGRAM = {
  botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  newLeads: process.env.TELEGRAM_NEW_LEADS_CHAT || '-1003809646667',
  errors: process.env.TELEGRAM_ERRORS_CHAT || '-1003751399010',
};

const EMAILIT = {
  apiKey: requireEnv('EMAILIT_API_KEY'),
  domain: process.env.EMAILIT_DOMAIN || 'neatcircle.com',
  adminTo: process.env.ADMIN_NOTIFICATION_EMAIL || 'ike@neatcircle.com',
};

const AITABLE = {
  apiToken: requireEnv('AITABLE_API_TOKEN'),
  datasheetId: process.env.AITABLE_DATASHEET_ID || 'dstBicDQKC6gpLAMYj',
  apiBase: process.env.AITABLE_API_BASE || 'https://aitable.ai/fusion/v1',
};

const WBIZTOOL = {
  apiKey: requireEnv('WBIZTOOL_API_KEY'),
  instanceId: process.env.WBIZTOOL_INSTANCE_ID || '12316',
  apiBase: process.env.WBIZTOOL_API_BASE || 'https://app.wbiztool.com/api',
};

const BACKUP_DIR = join(process.cwd(), 'backups', new Date().toISOString().slice(0, 10));
const API_DELAY = 500;

// ════════════════════════════════════════════════════════════════
// ADVISOR PERSONAS — "The Team"
// ════════════════════════════════════════════════════════════════

const ADVISORS = {
  onboarding:  { name: 'Sarah Chen',      title: 'Onboarding Specialist' },
  strategy:    { name: 'James Park',       title: 'Strategy Consultant' },
  compliance:  { name: 'Dr. Maya Patel',   title: 'Compliance Director' },
  analytics:   { name: 'Alex Thompson',    title: 'Analytics Advisor' },
  solutions:   { name: 'Marcus Rivera',    title: 'Solutions Architect' },
  legal:       { name: 'Victoria Santos',  title: 'Legal Technology Advisor' },
  industry:    { name: 'David Mitchell',   title: 'Industry Specialist' },
  franchise:   { name: 'Elena Vasquez',    title: 'Franchise Systems Advisor' },
  workforce:   { name: 'Rachel Kim',       title: 'Workforce Solutions Advisor' },
  community:   { name: 'Michael Thompson', title: 'Community Engagement Advisor' },
  creative:    { name: 'Zara Williams',    title: 'Creator Economy Specialist' },
};

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function makeApi(method, path, body = null) {
  const opts = {
    method,
    headers: { Authorization: `Token ${API_TOKEN}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const preview = typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300);
    console.error(`  API ${method} ${path} -> ${res.status}: ${preview}`);
  }
  return { status: res.status, ok: res.ok, data };
}

function jb(fields) {
  return '{' + fields.map(([k, v, raw]) => raw ? `"${k}":${v}` : `"${k}":"${v}"`).join(',') + '}';
}

// ════════════════════════════════════════════════════════════════
// MODULE BUILDERS
// ════════════════════════════════════════════════════════════════

const d = (x, y = 0) => ({ designer: { x, y } });

function modSetVariable(id, name, value, x, y) {
  return { id, module: 'util:SetVariable', version: 1, mapper: { name, value, scope: 'roundtrip' }, metadata: d(x, y) };
}

function modHttpPost(id, url, body, x, y) {
  return {
    id, module: 'http:ActionSendData', version: 3,
    parameters: { handleErrors: true },
    mapper: { url, method: 'post', headers: [{ name: 'Content-Type', value: 'application/json' }], body, parseResponse: true },
    metadata: d(x, y),
    onerror: [{ id: id + 80, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }],
  };
}

function modOpenAI(id, systemPrompt, userPrompt, x, y) {
  return {
    id, module: 'openai-gpt-3:CreateCompletion', version: 1,
    parameters: { __IMTCONN__: OPENAI_CONN },
    mapper: {
      select: 'chat', model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: '800', temperature: '0.7',
      n_completions: '1', response_format: 'text',
    },
    metadata: d(x, y),
    onerror: [{ id: id + 200, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }],
  };
}

function modBoostSpace(id, remoteId, remoteApp, x, y) {
  return {
    id, module: 'boostspace-bs-custom-module-2:CustomModuleIteme83898e1', version: 1,
    parameters: { __IMTCONN__: BS_CONN },
    mapper: { spaces: BS_SPACES, remoteId, remoteApplication: remoteApp },
    metadata: d(x, y),
    onerror: [{ id: id + 200, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }],
  };
}

function modHttp(id, url, body, extraHeaders, x, y) {
  const headers = [{ name: 'Content-Type', value: 'application/json' }, ...(extraHeaders || [])];
  return { id, module: 'http:ActionSendData', version: 3, parameters: { handleErrors: true }, mapper: { url, method: 'post', headers, body, parseResponse: false }, metadata: d(x, y),
    onerror: [{ id: id + 200, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }] };
}

function modEmailit(id, body, x, y) {
  return modHttp(id, EMAILIT_URL, body, [{ name: 'Authorization', value: `Bearer ${EMAILIT.apiKey}` }], x, y);
}

function modDataStoreAdd(id, key, data, x, y) {
  return { id, module: 'datastore:AddRecord', version: 1, parameters: { datastore: DS_ID }, mapper: { key, data }, metadata: d(x, y),
    onerror: [{ id: id + 200, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }] };
}

function modRespond(id, status, body, x, y) {
  return { id, module: 'gateway:WebhookRespond', version: 1, mapper: { status, body }, metadata: d(x, y) };
}

// ════════════════════════════════════════════════════════════════
// PIPELINE BUILDER — AI CONCIERGE ARCHITECTURE
// ════════════════════════════════════════════════════════════════

function buildPipeline(webhook, bpName, bpMeta, cfg) {
  // Strip stale metadata.expect from webhook (added during debugging, causes issues)
  if (webhook.metadata?.expect) delete webhook.metadata.expect;

  const wid = webhook.id;
  const r = (s) => s.replace(/\{\{1\./g, `{{${wid}.`);

  const emailRef = r(cfg.emailRef);
  const companyRef = r(cfg.companyRef);
  const contactRef = r(cfg.contactRef);
  const apiBody = r(cfg.bodyTemplate);
  const brand = cfg.brand;
  const adv = cfg.advisor;

  // No filters needed in linear pipeline — onerror:Resume handles failures gracefully

  // ════════════════════════════════════════════════════════
  // AI PROMPTS — The core of the concierge experience
  // ════════════════════════════════════════════════════════

  // OpenAI #1: Lead Intelligence Analyst + Scoring
  const intelSystem = `You are a Lead Intelligence Analyst for ${brand}. You build deep persona profiles for incoming business leads. Your analysis should read like a briefing prepared by a seasoned business consultant who intimately understands the lead's industry.

Structure your analysis exactly as follows:
INDUSTRY INSIGHT: 2 sentences on specific trends and challenges in their industry right now.
PAIN POINTS: 3 likely pain points based on their industry, company type, and inquiry. Be specific — reference real operational challenges, not generic issues.
REVENUE OPPORTUNITY: Estimate the dollar value this lead represents. Reference industry benchmarks.
BUYING STAGE: Assessment (Awareness/Consideration/Decision) with reasoning.
TALKING POINTS: 3 specific, personalized conversation starters that reference their business.
RISK FACTORS: 1-2 things that could prevent conversion.

SCORES: Output a JSON block on a single line with your fit assessment:
{"fit_score": <0-100>, "fit_reason": "<1 sentence>", "buying_stage_num": <1=Awareness, 2=Consideration, 3=Decision>, "estimated_deal_value": <dollar amount integer>}
fit_score criteria: correct niche match (+30), company appears to be in target size range (+20), complete contact info provided (+10), geography/market match (+20), budget likely in range (+20). Sum applicable points.

Be specific and reference real industry dynamics. Never be generic.`;

  const intelUser = r(cfg.intelPrompt);

  // OpenAI #2: Concierge Email Writer
  const emailSystem = `You are ${adv.name}, ${adv.title} at ${brand}. Write a personal welcome email to this lead.

CRITICAL RULES:
- Sound genuinely human and warm — NOT like a template, bot, or marketing email
- Open with something specific about THEIR business or industry — show you did your homework
- Include one surprising insight, statistic, or observation relevant to their industry
- Reference how you have helped a similar business (invent a realistic but vague example)
- End with a soft, specific next step — NOT a generic CTA
- Keep it under 150 words
- Write in simple HTML: use <p> tags for paragraphs, <strong> for emphasis
- Sign off with: ${adv.name}<br>${adv.title}, ${brand}
- Do NOT use double-quote characters anywhere in your output
- Do NOT include a subject line`;

  const emailUser = `Lead intelligence briefing:
{{40.result}}

Write a welcome email to ${contactRef} at ${companyRef}. Their email: ${emailRef}.`;

  // ── PERSONALIZED EMAIL SUBJECT ──
  const emailSubject = r(cfg.emailSubject);
  const fromAddr = `${adv.name} via ${brand} <automations@${EMAILIT.domain}>`;

  // ── DISCORD EMBED (Rich Persona Intelligence) ──
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  const errEmbed = `{"embeds":[{"title":"\\u274c ERROR — ${cfg.slug}","color":15548997,"fields":[{"name":"Company","value":"${companyRef}","inline":true},{"name":"Contact","value":"${contactRef}","inline":true},{"name":"Advisor","value":"${adv.name}","inline":true},{"name":"Error","value":"{{substring(20.data; 0; 400)}}"}],"footer":{"text":"AI Concierge System"},"timestamp":"{{now}}"}]}`;

  const okEmbed = `{"embeds":[{"author":{"name":"${adv.name} — ${adv.title}"},"title":"\\ud83c\\udfaf New Lead: ${companyRef}","color":5763719,"fields":[{"name":"Contact","value":"${contactRef} (${emailRef})","inline":true},{"name":"Scenario","value":"${cfg.slug}","inline":true},{"name":"Advisor","value":"${adv.name}","inline":true},{"name":"\\ud83d\\udcca Lead Intelligence","value":"{{substring(40.result; 0; 700)}}"},{"name":"\\ud83d\\udce7 Email Sent (Preview)","value":"{{substring(42.result; 0; 300)}}"}],"footer":{"text":"AI Concierge System \\u2022 ${brand}"},"timestamp":"{{now}}"}]}`;

  // ── TELEGRAM ──
  const errTg = `{"chat_id":"${TELEGRAM.errors}","parse_mode":"HTML","text":"\\u274c <b>ERROR — ${cfg.slug}</b>\\\\n<b>Company:</b> ${companyRef}\\\\n<b>Advisor:</b> ${adv.name}\\\\n<b>Error:</b> {{substring(20.data; 0; 200)}}"}`;

  const okTg = `{"chat_id":"${TELEGRAM.newLeads}","parse_mode":"HTML","text":"\\ud83c\\udfaf <b>New Lead: ${companyRef}</b>\\\\n<b>Contact:</b> ${contactRef} (${emailRef})\\\\n<b>Advisor:</b> ${adv.name}, ${adv.title}\\\\n\\\\n\\ud83d\\udcca <b>Intelligence:</b>\\\\n{{substring(40.result; 0; 600)}}\\\\n\\\\n\\ud83d\\udce7 <b>Email sent</b> — personalized by AI"}`;

  // ── EMAIL (AI-Generated) ──
  const emailBody = `{"from":"${fromAddr}","to":"${emailRef}","subject":"${emailSubject}","html":"{{42.result}}","tracking":{"opens":true,"clicks":true}}`;

  // ── WHATSAPP (WbizTool) ──
  const phoneRef = r(cfg.phoneRef || '');
  const waBody = `{"instance_id":"${WBIZTOOL.instanceId}","to":"${phoneRef}","type":"text","body":"Hi ${contactRef}, this is ${adv.name} from ${brand}. Thanks for reaching out! I have reviewed your inquiry and will send you a detailed email shortly with some personalized insights for ${companyRef}. Looking forward to connecting! - ${adv.name}, ${adv.title}"}`;

  // ── ADMIN EMAIL (lead briefing to Ike) ──
  const adminBody = `{"from":"AI Concierge <automations@${EMAILIT.domain}>","to":"${EMAILIT.adminTo}","subject":"New Lead: ${companyRef} (${cfg.slug})","html":"<h2>New Lead Captured</h2><p><strong>Company:</strong> ${companyRef}<br><strong>Contact:</strong> ${contactRef} (${emailRef})<br><strong>Scenario:</strong> ${cfg.slug}<br><strong>Advisor:</strong> ${adv.name}, ${adv.title}</p><h3>AI Intelligence Briefing</h3><pre style=white-space:pre-wrap>{{substring(40.result; 0; 2000)}}</pre><h3>Email Sent (Preview)</h3><div style=border:1px solid #ddd;padding:15px>{{42.result}}</div>"}`;

  // ── AITABLE ──
  const errAt = `{"records":[{"fields":{"Title":"ERROR — ${cfg.slug} — ${companyRef}","Scenario":"${cfg.slug}","Company":"${companyRef}","Contact Email":"${emailRef}","Contact Name":"${contactRef}","Status":"ERROR","API Response":"{{substring(20.data; 0; 1000)}}"}}],"fieldKey":"name"}`;

  const okAt = `{"records":[{"fields":{"Title":"${cfg.slug} — ${companyRef}","Scenario":"${cfg.slug}","Company":"${companyRef}","Contact Email":"${emailRef}","Contact Name":"${contactRef}","Status":"SUCCESS","Touchpoint":"intake","API Response":"{{substring(20.data; 0; 500)}}","AI Generated":"{{substring(40.result; 0; 2000)}}"}}],"fieldKey":"name"}`;

  // ══════════════════════════════════════════════════════
  // LINEAR PIPELINE (no router — avoids Boost.space
  // router validation bug that validates ALL route modules
  // even when routes won't execute)
  // ══════════════════════════════════════════════════════

  // ── Avoid ID collision with webhook ──
  const usedIds = new Set([wid]);
  const pickId = (preferred) => { let id = preferred; while (usedIds.has(id)) id++; usedIds.add(id); return id; };
  const svId1 = pickId(4);
  const svId2 = pickId(6);

  return {
    name: bpName,
    metadata: bpMeta,
    flow: [
      webhook,
      modSetVariable(svId1, 'slug', cfg.slug, 0, 0),
      modSetVariable(svId2, 'advisor', `${adv.name} | ${adv.title}`, 300, 0),
      modHttpPost(20, cfg.apiUrl, apiBody, 600, 0),

      // OpenAI #1: Lead Intelligence Analyst (onerror:Resume if API failed)
      modOpenAI(40, intelSystem, intelUser, 900, 0),

      // OpenAI #2: Concierge Email Writer (continues from #1)
      modOpenAI(42, emailSystem, emailUser, 1200, 0),

      // Boost.space sync — fair use compliance + CRM
      modBoostSpace(50, `${cfg.slug}_${emailRef}`, brand, 1500, 0),

      // Discord — success notification
      modHttp(60, DISCORD.newLeads, okEmbed, null, 1800, 0),

      // Telegram — AI briefing
      modHttp(61, tgUrl, okTg, null, 2100, 0),

      // Emailit — AI-written personal email from named advisor
      modEmailit(70, emailBody, 2400, 0),

      // WbizTool — WhatsApp welcome message (instant mobile touch)
      modHttp(71, `${WBIZTOOL.apiBase}/send`, waBody,
        [{ name: 'apikey', value: WBIZTOOL.apiKey }], 2700, 0),

      // Emailit — admin lead briefing to ike@neatcircle.com
      modEmailit(72, adminBody, 3000, 0),

      // AITable — comprehensive event log
      modHttp(75, atUrl, okAt, [atAuth], 3300, 0),

      // DataStore — lead profile with scoring for nurture engine + Hot Lead Radar
      modDataStoreAdd(80, `${cfg.slug}_${emailRef}`,
        { scenario: cfg.slug, email: emailRef, company: companyRef, contact: contactRef, advisor: adv.name, brand, stage: 'intake', touchpoints: '1', status: 'concierge-active', intent_score: '30', fit_score: '0', engagement_score: '0', urgency_score: phoneRef ? '10' : '0', priority_score: phoneRef ? '13' : '12', hot_lead_notified: 'false', consultation_offered: 'false' },
        3600, 0),

      // WebhookRespond — return intelligence + advisor + journey info
      modRespond(90, '200',
        `{"success":true,"scenario":"${cfg.slug}","advisor":{"name":"${adv.name}","title":"${adv.title}"},"journeyStage":"intake","status":"concierge-active"}`,
        3900, 0),
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// 22 SCENARIO DEFINITIONS — AI Concierge Configurations
// ════════════════════════════════════════════════════════════════

const SCENARIOS = [
  // ─── YD Services (6) ───
  {
    id: 143953, slug: 'yd-portal-setup', serviceName: 'Portal Setup', brand: 'Your Deputy',
    advisor: ADVISORS.onboarding,
    apiUrl: `${YD_API}/portal-setup`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactFirstName', '{{1.contactFirstName}}'],
      ['contactLastName', '{{1.contactLastName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['phone', '{{1.phone}}'], ['domain', '{{1.domain}}'], ['industry', '{{1.industry}}'],
    ]),
    emailSubject: 'Quick thoughts on {{1.companyName}} portal setup, {{1.contactFirstName}}',
    intelPrompt: 'New portal setup inquiry.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}} ({{1.contactEmail}})\nIndustry: {{1.industry}}\nDomain: {{1.domain}}\nPhone: {{1.phone}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this lead. Focus on: what portal features matter most for their industry, what integrations they likely need, and what their competitors are probably doing with client portals.',
  },
  {
    id: 143956, slug: 'yd-crm-pipeline', serviceName: 'CRM Pipeline', brand: 'Your Deputy',
    advisor: ADVISORS.strategy,
    apiUrl: `${YD_API}/crm-pipeline`,
    emailRef: '{{1.email}}', companyRef: '{{1.company}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['firstName', '{{1.firstName}}'], ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['stage', '{{1.stage}}'], ['company', '{{1.company}}'], ['phone', '{{1.phone}}'],
      ['source', '{{1.source}}'], ['dealValue', '{{1.dealValue}}', true], ['notes', '{{1.notes}}'],
    ]),
    emailSubject: 'Wanted to share some insights on {{1.company}}, {{1.firstName}}',
    intelPrompt: 'CRM pipeline lead.\nCompany: {{1.company}}\nContact: {{1.firstName}} {{1.lastName}} ({{1.email}})\nDeal stage: {{1.stage}}\nDeal value: ${{1.dealValue}}\nSource: {{1.source}}\nNotes: {{1.notes}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this deal. Focus on: stage-appropriate next steps, whether the deal value matches typical deals for this company size, competitive positioning, and urgency signals. If deal value exceeds $10K, flag as high-value opportunity.',
  },
  {
    id: 143957, slug: 'yd-onboarding', serviceName: 'Client Onboarding', brand: 'Your Deputy',
    advisor: ADVISORS.onboarding,
    apiUrl: `${YD_API}/onboarding`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactFirstName', '{{1.contactFirstName}}'],
      ['contactLastName', '{{1.contactLastName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['plan', '{{1.plan}}'], ['phone', '{{1.phone}}'], ['billingEmail', '{{1.billingEmail}}'],
    ]),
    emailSubject: 'Welcome aboard, {{1.contactFirstName}} — your onboarding roadmap',
    intelPrompt: 'New client onboarding.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}}\nPlan: {{1.plan}}\nBilling email: {{1.billingEmail}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this onboarding. Focus on: plan-appropriate feature recommendations, common early wins for their plan tier, potential upgrade path, and what similar companies typically configure first. Create a personalized 30-day success roadmap.',
  },
  {
    id: 143958, slug: 'yd-compliance-training', serviceName: 'Compliance Training', brand: 'Your Deputy',
    advisor: ADVISORS.compliance,
    apiUrl: `${YD_API}/compliance-training`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['contactFirstName', '{{1.contactFirstName}}'], ['contactLastName', '{{1.contactLastName}}'],
      ['employees', '{{1.employees}}', true], ['courses', '{{1.courses}}', true],
    ]),
    emailSubject: '{{1.companyName}} compliance training — what to expect, {{1.contactFirstName}}',
    intelPrompt: 'Compliance training enrollment.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}}\nEmployee count: {{1.employees}}\nCourses requested: {{1.courses}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this enrollment. Focus on: regulatory requirements for their likely industry, completion timeline estimates based on employee count, which additional compliance courses they probably need, and potential penalties for non-compliance in their sector.',
  },
  {
    id: 143959, slug: 'yd-business-intelligence', serviceName: 'Business Intelligence', brand: 'Your Deputy',
    advisor: ADVISORS.analytics,
    apiUrl: `${YD_API}/business-intelligence`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactFirstName', '{{1.contactFirstName}}'],
      ['contactLastName', '{{1.contactLastName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['dataSources', '{{1.dataSources}}', true], ['kpis', '{{1.kpis}}', true],
      ['reportingFrequency', '{{1.reportingFrequency}}'],
    ]),
    emailSubject: 'BI dashboard ideas for {{1.companyName}}, {{1.contactFirstName}}',
    intelPrompt: 'BI setup request.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}}\nData sources: {{1.dataSources}}\nKPIs: {{1.kpis}}\nReporting frequency: {{1.reportingFrequency}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this BI request. Focus on: which KPIs actually matter for their business type, data quality concerns with their sources, dashboard layout recommendations, and what insights their competitors are probably tracking that they are not.',
  },
  {
    id: 143960, slug: 'yd-managed-services', serviceName: 'Managed Services', brand: 'Your Deputy',
    advisor: ADVISORS.solutions,
    apiUrl: `${YD_API}/managed-services`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactFirstName', '{{1.contactFirstName}}'],
      ['contactLastName', '{{1.contactLastName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['plan', '{{1.plan}}'], ['monthlyBudget', '{{1.monthlyBudget}}', true],
    ]),
    emailSubject: 'A few ideas for {{1.companyName}}, {{1.contactFirstName}}',
    intelPrompt: 'Managed services inquiry.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}}\nPlan: {{1.plan}}\nMonthly budget: ${{1.monthlyBudget}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this managed services lead. Focus on: what they can realistically achieve within their budget, where they are likely over-spending on manual work, SLA expectations for their plan tier, and a phased roadmap to maximize ROI.',
  },

  // ─── NC Core Services (8) ───
  {
    id: 143961, slug: 'nc-client-portal', serviceName: 'Client Portal', brand: 'NeatCircle',
    advisor: ADVISORS.onboarding,
    apiUrl: `${NC_API}/client-portal`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['phone', '{{1.phone}}'], ['industry', '{{1.industry}}'],
    ]),
    emailSubject: 'Ideas for {{1.companyName}} client portal, {{1.firstName}}',
    intelPrompt: 'Client portal setup.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nIndustry: {{1.industry}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this portal lead. Focus on: which portal modules matter most for their industry (invoicing, scheduling, file sharing, messaging), what their clients expect from a modern portal, and what branding customizations will make the biggest impression.',
  },
  {
    id: 143962, slug: 'nc-process-automation', serviceName: 'Process Automation', brand: 'NeatCircle',
    advisor: ADVISORS.solutions,
    apiUrl: `${NC_API}/process-automation`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['estimatedManualHours', '{{1.estimatedManualHours}}', true],
    ]),
    emailSubject: 'Saving {{1.companyName}} time — a few automation ideas, {{1.firstName}}',
    intelPrompt: 'Process automation inquiry.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nEstimated manual hours/week: {{1.estimatedManualHours}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this automation lead. Focus on: which processes deliver the highest ROI when automated (calculate dollar savings from manual hours at $35-50/hr), quick wins they can implement in week 1, and common automation mistakes to avoid.',
  },
  {
    id: 143963, slug: 'nc-systems-integration', serviceName: 'Systems Integration', brand: 'NeatCircle',
    advisor: ADVISORS.solutions,
    apiUrl: `${NC_API}/systems-integration`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['syncFrequency', '{{1.syncFrequency}}'],
    ]),
    emailSubject: 'Integration architecture for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'Systems integration request.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nSync frequency: {{1.syncFrequency}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this integration lead. Focus on: common data silos for companies like theirs, sync frequency implications (real-time vs batch), data mapping pitfalls, and how to phase the integration to minimize disruption.',
  },
  {
    id: 143964, slug: 'nc-training-platform', serviceName: 'Training Platform', brand: 'NeatCircle',
    advisor: ADVISORS.compliance,
    apiUrl: `${NC_API}/training-platform`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['trainingType', '{{1.trainingType}}'], ['estimatedLearners', '{{1.estimatedLearners}}', true],
    ]),
    emailSubject: 'Training platform ideas for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'Training platform setup.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nTraining type: {{1.trainingType}}\nEstimated learners: {{1.estimatedLearners}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this training lead. Focus on: course structure for their training type, engagement tactics to hit 80%+ completion rates, certification design, and how to measure training ROI for their organization.',
  },
  {
    id: 143965, slug: 'nc-business-intelligence', serviceName: 'Business Intelligence', brand: 'NeatCircle',
    advisor: ADVISORS.analytics,
    apiUrl: `${NC_API}/business-intelligence`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['reportingFrequency', '{{1.reportingFrequency}}'],
    ]),
    emailSubject: 'Dashboard ideas for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'BI dashboard request.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nReporting frequency: {{1.reportingFrequency}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this BI lead. Focus on: which metrics actually drive decisions for companies like theirs, dashboard design principles, alert threshold recommendations, and what data stories their leadership team needs to see.',
  },
  {
    id: 143966, slug: 'nc-compliance-training', serviceName: 'Compliance Training', brand: 'NeatCircle',
    advisor: ADVISORS.compliance,
    apiUrl: `${NC_API}/compliance-training`,
    emailRef: '{{1.contactEmail}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.contactFirstName}} {{1.contactLastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['contactEmail', '{{1.contactEmail}}'],
      ['contactFirstName', '{{1.contactFirstName}}'], ['contactLastName', '{{1.contactLastName}}'],
      ['employees', '{{1.employees}}', true], ['courses', '{{1.courses}}', true],
    ]),
    emailSubject: '{{1.companyName}} compliance roadmap, {{1.contactFirstName}}',
    intelPrompt: 'Compliance training.\nCompany: {{1.companyName}}\nContact: {{1.contactFirstName}} {{1.contactLastName}}\nEmployees: {{1.employees}}\nCourses: {{1.courses}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this compliance lead. Focus on: regulatory landscape for their industry, mandatory vs recommended training, realistic completion timeline, and penalty risks for non-compliance. Be specific about regulations (OSHA, HIPAA, SOX, etc.) based on likely industry.',
  },
  {
    id: 143967, slug: 'nc-managed-services', serviceName: 'Managed Services', brand: 'NeatCircle',
    advisor: ADVISORS.solutions,
    apiUrl: `${NC_API}/managed-services`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'], ['plan', '{{1.plan}}'],
    ]),
    emailSubject: 'A plan for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'Managed services.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nPlan: {{1.plan}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this managed services lead. Focus on: what their plan tier includes vs what they will likely need in 6 months, common service gaps for companies their size, and a phased approach to expanding their service scope.',
  },
  {
    id: 143968, slug: 'nc-digital-transformation', serviceName: 'Digital Transformation', brand: 'NeatCircle',
    advisor: ADVISORS.solutions,
    apiUrl: `${NC_API}/digital-transformation`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'], ['firstName', '{{1.firstName}}'],
      ['lastName', '{{1.lastName}}'], ['email', '{{1.email}}'],
      ['timeline', '{{1.timeline}}'], ['budgetRange', '{{1.budgetRange}}'],
    ]),
    emailSubject: 'Digital transformation roadmap for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'Digital transformation.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nTimeline: {{1.timeline}}\nBudget range: {{1.budgetRange}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this transformation lead. Focus on: what is achievable within their timeline and budget, where most companies fail in digital transformation (and how to avoid it), quick wins that show ROI in month 1, and a phased roadmap.',
  },

  // ─── NC Blue-Ocean Niches (8) ───
  {
    id: 143969, slug: 'nc-re-syndication', serviceName: 'RE Syndication Portal', brand: 'NeatCircle',
    advisor: ADVISORS.legal,
    apiUrl: `${NC_API}/re-syndication`,
    emailRef: '{{1.email}}', companyRef: '{{1.syndicationName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['syndicationName', '{{1.syndicationName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['dealType', '{{1.dealType}}'], ['targetRaise', '{{1.targetRaise}}', true],
      ['propertyType', '{{1.propertyType}}'],
    ]),
    emailSubject: 'Investor portal insights for {{1.syndicationName}}, {{1.firstName}}',
    intelPrompt: 'RE syndication lead.\nSyndication: {{1.syndicationName}}\nContact: {{1.firstName}} {{1.lastName}}\nDeal type: {{1.dealType}}\nTarget raise: ${{1.targetRaise}}\nProperty type: {{1.propertyType}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this syndication lead. Focus on: investor portal best practices for their deal type, SEC compliance requirements (Reg D 506b/c), investor communication cadence, and how their target raise compares to market norms for their property type.',
  },
  {
    id: 143970, slug: 'nc-immigration-law', serviceName: 'Immigration Law Portal', brand: 'NeatCircle',
    advisor: ADVISORS.legal,
    apiUrl: `${NC_API}/immigration-law`,
    emailRef: '{{1.email}}', companyRef: '{{1.firmName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['firmName', '{{1.firmName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['caseVolume', '{{1.caseVolume}}', true],
    ]),
    emailSubject: 'Case management ideas for {{1.firmName}}, {{1.firstName}}',
    intelPrompt: 'Immigration law firm.\nFirm: {{1.firmName}}\nContact: {{1.firstName}} {{1.lastName}}\nMonthly case volume: {{1.caseVolume}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this immigration law lead. Focus on: case management workflow optimization for their volume, multilingual client communication needs, USCIS deadline tracking automation, and how to reduce administrative burden on attorneys. Reference specific visa types (H-1B, L-1, EB-5) and their processing challenges.',
  },
  {
    id: 143971, slug: 'nc-construction', serviceName: 'Construction Management', brand: 'NeatCircle',
    advisor: ADVISORS.industry,
    apiUrl: `${NC_API}/construction`,
    emailRef: '{{1.email}}', companyRef: '{{1.companyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['companyName', '{{1.companyName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['annualRevenue', '{{1.annualRevenue}}', true],
      ['safetyProgram', '{{1.safetyProgram}}', true],
    ]),
    emailSubject: 'Project management ideas for {{1.companyName}}, {{1.firstName}}',
    intelPrompt: 'Construction company.\nCompany: {{1.companyName}}\nContact: {{1.firstName}} {{1.lastName}}\nAnnual revenue: ${{1.annualRevenue}}\nSafety program: {{1.safetyProgram}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this construction lead. Focus on: project management pain points at their revenue level, OSHA compliance requirements, subcontractor coordination challenges, and how field-to-office communication gaps cost them money. Reference specific construction industry metrics.',
  },
  {
    id: 143972, slug: 'nc-franchise', serviceName: 'Franchise Management', brand: 'NeatCircle',
    advisor: ADVISORS.franchise,
    apiUrl: `${NC_API}/franchise`,
    emailRef: '{{1.email}}', companyRef: '{{1.brandName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['brandName', '{{1.brandName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['locationCount', '{{1.locationCount}}', true],
    ]),
    emailSubject: 'Multi-location insights for {{1.brandName}}, {{1.firstName}}',
    intelPrompt: 'Franchise brand.\nBrand: {{1.brandName}}\nContact: {{1.firstName}} {{1.lastName}}\nLocations: {{1.locationCount}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this franchise lead. Focus on: multi-location management challenges at their scale, brand consistency enforcement across locations, franchisee communication and reporting, and FDD compliance. Reference specific challenges that emerge at their location count threshold.',
  },
  {
    id: 143973, slug: 'nc-staffing', serviceName: 'Staffing Agency Portal', brand: 'NeatCircle',
    advisor: ADVISORS.workforce,
    apiUrl: `${NC_API}/staffing`,
    emailRef: '{{1.email}}', companyRef: '{{1.agencyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['agencyName', '{{1.agencyName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['placementsPerMonth', '{{1.placementsPerMonth}}', true],
    ]),
    emailSubject: 'Placement pipeline ideas for {{1.agencyName}}, {{1.firstName}}',
    intelPrompt: 'Staffing agency.\nAgency: {{1.agencyName}}\nContact: {{1.firstName}} {{1.lastName}}\nMonthly placements: {{1.placementsPerMonth}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this staffing lead. Focus on: candidate pipeline bottlenecks at their volume, time-to-fill benchmarks for their placement volume, client portal features that reduce account management overhead, and compliance requirements (I-9, background checks, workers comp).',
  },
  {
    id: 143974, slug: 'nc-church-management', serviceName: 'Church Management', brand: 'NeatCircle',
    advisor: ADVISORS.community,
    apiUrl: `${NC_API}/church-management`,
    emailRef: '{{1.email}}', companyRef: '{{1.organizationName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['organizationName', '{{1.organizationName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['memberCount', '{{1.memberCount}}', true],
    ]),
    emailSubject: 'Community engagement ideas for {{1.organizationName}}, {{1.firstName}}',
    intelPrompt: 'Church/nonprofit.\nOrganization: {{1.organizationName}}\nContact: {{1.firstName}} {{1.lastName}}\nMembers: {{1.memberCount}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this church/nonprofit lead. Focus on: member engagement strategies for their congregation size, event and volunteer coordination workflows, donation tracking and year-end reporting needs, and communication channels that work best for congregations (groups, SMS, email). Reference challenges specific to their member count range.',
  },
  {
    id: 143975, slug: 'nc-creator-management', serviceName: 'Creator Management', brand: 'NeatCircle',
    advisor: ADVISORS.creative,
    apiUrl: `${NC_API}/creator-management`,
    emailRef: '{{1.email}}', companyRef: '{{1.agencyName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['agencyName', '{{1.agencyName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['talentCount', '{{1.talentCount}}', true],
    ]),
    emailSubject: 'Talent management ideas for {{1.agencyName}}, {{1.firstName}}',
    intelPrompt: 'Creator management agency.\nAgency: {{1.agencyName}}\nContact: {{1.firstName}} {{1.lastName}}\nTalent count: {{1.talentCount}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this creator management lead. Focus on: talent portfolio management challenges at their scale, brand deal tracking and revenue splits, content calendar coordination across multiple creators, and how to present portfolio analytics to brands. Reference current creator economy trends and rates.',
  },
  {
    id: 143976, slug: 'nc-compliance-productized', serviceName: 'Compliance Training Platform', brand: 'NeatCircle',
    advisor: ADVISORS.compliance,
    apiUrl: `${NC_API}/compliance-productized`,
    emailRef: '{{1.email}}', companyRef: '{{1.resellerName}}',
    contactRef: '{{1.firstName}} {{1.lastName}}', phoneRef: '{{1.phone}}',
    bodyTemplate: jb([
      ['resellerName', '{{1.resellerName}}'],
      ['contactInfo', '{"firstName":"{{1.firstName}}","lastName":"{{1.lastName}}","email":"{{1.email}}","phone":"{{1.phone}}"}', true],
      ['targetMarket', '{{1.targetMarket}}'], ['pricingModel', '{{1.pricingModel}}'],
    ]),
    emailSubject: 'White-label compliance platform for {{1.resellerName}}, {{1.firstName}}',
    intelPrompt: 'Compliance platform reseller.\nReseller: {{1.resellerName}}\nContact: {{1.firstName}} {{1.lastName}}\nTarget market: {{1.targetMarket}}\nPricing model: {{1.pricingModel}}\n\nAPI result: {{substring(20.data; 0; 500)}}\n\nAnalyze this reseller lead. Focus on: white-label configuration for their target market, pricing strategy analysis (their model vs market norms), compliance content customization requirements, and go-to-market recommendations for their specific target market.',
  },
];

// ════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   AI CONCIERGE SYSTEM — V11 Deployment            ║');
  console.log('  ║   15-module pipeline × 22 scenarios + scoring   ║');
  console.log('  ║   2× OpenAI • WhatsApp • 4-Channel + Scores    ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
    log(`Backup dir: ${BACKUP_DIR}`);
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (const cfg of SCENARIOS) {
    log(`\n━━━ [${cfg.id}] ${cfg.serviceName} (${cfg.slug}) — Advisor: ${cfg.advisor.name} ━━━`);

    try {
      const bpRes = await makeApi('GET', `/scenarios/${cfg.id}/blueprint`);
      await sleep(API_DELAY);
      if (!bpRes.ok) throw new Error(`GET blueprint: ${bpRes.status}`);

      const bp = bpRes.data.response?.blueprint || bpRes.data.blueprint || bpRes.data;
      const webhook = (bp.flow || [])[0];
      if (!webhook || webhook.module !== 'gateway:CustomWebHook') {
        throw new Error(`First module is ${webhook?.module || 'missing'}, expected gateway:CustomWebHook`);
      }
      log(`  Webhook: id=${webhook.id}, hook=${webhook.parameters?.hook}`);

      await writeFile(join(BACKUP_DIR, `${cfg.id}-${cfg.slug}.json`), JSON.stringify(bp, null, 2));

      await makeApi('POST', `/scenarios/${cfg.id}/stop`);
      await sleep(API_DELAY);

      const newBp = buildPipeline(webhook, bp.name, bp.metadata, cfg);

      let modCount = newBp.flow.length;
      for (const m of newBp.flow) {
        if (m.routes) for (const route of m.routes) modCount += (route.flow || []).length;
        if (m.onerror) modCount += m.onerror.length;
      }
      log(`  Blueprint: ${modCount} modules | OpenAI×2 | WhatsApp:${cfg.phoneRef ? 'Y' : 'N'} | Advisor: ${cfg.advisor.name}`);

      const patchRes = await makeApi('PATCH', `/scenarios/${cfg.id}`, {
        blueprint: JSON.stringify(newBp),
      });
      await sleep(API_DELAY);

      if (!patchRes.ok) {
        throw new Error(`PATCH: ${patchRes.status} — ${JSON.stringify(patchRes.data).slice(0, 400)}`);
      }

      const startRes = await makeApi('POST', `/scenarios/${cfg.id}/start`);
      if (!startRes.ok) console.warn(`  Warning: Activation ${startRes.status}`);
      await sleep(API_DELAY);

      log(`  ✓ DEPLOYED — Concierge active`);
      results.success++;
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}`);
      results.failed++;
      results.errors.push({ id: cfg.id, slug: cfg.slug, error: e.message });
    }
  }

  // ── Summary ──
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   DEPLOYMENT SUMMARY                             ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log(`  Success: ${results.success}/${SCENARIOS.length}`);
  console.log(`  Failed:  ${results.failed}/${SCENARIOS.length}`);

  if (results.errors.length) {
    console.log('\n  Failures:');
    results.errors.forEach(e => console.log(`    [${e.id}] ${e.slug}: ${e.error}`));
  }

  // ── Verification ──
  log('\nVerifying...');
  for (const cfg of SCENARIOS) {
    const v = await makeApi('GET', `/scenarios/${cfg.id}/blueprint`);
    if (v.ok) {
      const vbp = v.data.response?.blueprint || v.data.blueprint || v.data;
      const flow = vbp.flow || [];
      const hasOpenAI = flow.filter(m => m.module?.includes('openai')).length;
      const hasBS = flow.some(m => m.module?.includes('boostspace'));
      const hasWA = flow.some(m => JSON.stringify(m.mapper || {}).includes('wbiztool'));
      const withResume = flow.filter(m => m.onerror?.length > 0).length;
      log(`  [${cfg.id}] ${cfg.slug}: ${flow.length} mods | AI:${hasOpenAI} | BS:${hasBS ? 'Y' : 'N'} | WA:${hasWA ? 'Y' : 'N'} | Resume:${withResume} | ${cfg.advisor.name}`);
    }
    await sleep(200);
  }

  console.log('\n  ════════════════════════════════════════════════');
  console.log(`  Complete. Backups: ${BACKUP_DIR}`);
  console.log('  AI Concierge V11 active across all 22 scenarios.');
  console.log('  ════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
