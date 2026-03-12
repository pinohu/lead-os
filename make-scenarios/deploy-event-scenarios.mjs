#!/usr/bin/env node

/**
 * deploy-event-scenarios.mjs — Make.com Scenarios #24-#27
 *
 * Behavioral event capture scenarios for Lead OS scoring engine.
 * Each scenario receives webhooks from external tools, updates DataStore
 * scores, logs to AITable, and triggers Hot Lead Radar alerts.
 *
 * Scenarios:
 *   #24 — Email Event Processor (Emailit open/click/bounce)
 *   #25 — WhatsApp Reply Capture (WbizTool incoming)
 *   #26 — Phone Event Processor (CallScaler call/missed)
 *   #27 — Visitor Event Processor (Plerdy/Happierleads/Salespanel)
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Config ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = process.env.MAKE_API_TOKEN || '24595d5e-9b7f-48f9-ab61-9644c46ed7f9';
const DS_ID = 3748;

const DISCORD = {
  newLeads: 'https://discord.com/api/webhooks/1480429578047717449/7bF_noLBXwykgIVye6hxYQ_e61-eDKS_OEyER_OpL8L0yxObOMDkCmqifgHPuEI3LoTp',
  highValue: 'https://discord.com/api/webhooks/1480429897263480962/e-vvArec6HCRc_HpzxmWOpz3GbJ7ncekeLBD7hSnKHm4v-zXTwt8fm6DjrY7TUBeo6Ct',
  errors: 'https://discord.com/api/webhooks/1480423483207975066/ZWeuxptsElvzpj8Fzrd-Q3pPDGkL3StUpuNJybNwKlJwyVkGm8D6k_qjz6mdsSHZ7J4n',
};

const TELEGRAM = {
  botToken: '8739229269:AAGYs6jIIjDa87y4TAVwn4QtTWBqliohDQI',
  newLeads: '-1003809646667',
  highValue: '-1003862266875',
};

const AITABLE = {
  apiToken: 'usk8wYBrRgsc6RHxkZP9VAN',
  datasheetId: 'dstBicDQKC6gpLAMYj',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const WBIZTOOL = {
  apiKey: '54140a11389a13031a2eb19070ce35c5ce769a30',
  instanceId: '12316',
  apiBase: 'https://app.wbiztool.com/api',
};

const BACKUP_DIR = join(process.cwd(), 'backups', 'event-scenarios');
const API_DELAY = 500;

// ── Helpers ──

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const d = (x, y = 0) => ({ designer: { x, y } });

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
    console.error(`  API ${method} ${path} -> ${res.status}: ${typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300)}`);
  }
  return { status: res.status, ok: res.ok, data };
}

function modHttp(id, url, body, extraHeaders, x, y) {
  const headers = [{ name: 'Content-Type', value: 'application/json' }, ...(extraHeaders || [])];
  return {
    id, module: 'http:ActionSendData', version: 3,
    parameters: { handleErrors: true },
    mapper: { url, method: 'post', headers, body, parseResponse: false },
    metadata: d(x, y),
    onerror: [{ id: id + 200, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(x, y + 200) }],
  };
}

// ── Score calculation helper (used in custom code modules) ──

const SCORE_RECALC_CODE = `
// Recalculate priority score from component scores
const intent = parseFloat(data.intent_score) || 0;
const engagement = parseFloat(data.engagement_score) || 0;
const fit = parseFloat(data.fit_score) || 0;
const urgency = parseFloat(data.urgency_score) || 0;
const priority = Math.round(intent * 0.4 + engagement * 0.3 + fit * 0.2 + urgency * 0.1);
return { priority_score: String(priority), is_hot: priority >= 80 };
`;

// ════════════════════════════════════════════════════════════════
// SCENARIO #24 — Email Event Processor (Emailit webhooks)
// ════════════════════════════════════════════════════════════════

function buildEmailEventScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Email Event Processor (#24)',
    metadata: { version: 1 },
    flow: [
      // Webhook trigger — Emailit sends open/click/bounce events
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // SetVariable — normalize event data
      {
        id: 4,
        module: 'util:SetVariable',
        version: 1,
        mapper: {
          name: 'event',
          value: '{{1}}',
          scope: 'roundtrip',
        },
        metadata: d(300, 0),
      },

      // Custom code — calculate score deltas based on event type
      {
        id: 10,
        module: 'util:SetVariable',
        version: 1,
        mapper: {
          name: 'score_delta',
          value: '{{if(1.event = "opened"; "intent:0,engagement:5"; if(1.event = "clicked"; "intent:10,engagement:10"; "intent:0,engagement:0"))}}',
          scope: 'roundtrip',
        },
        metadata: d(600, 0),
      },

      // DataStore — search for lead by email
      {
        id: 20,
        module: 'datastore:SearchRecords',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          filter: [[{ a: '{{data.email}}', b: '{{1.email}}', o: 'text:equal' }]],
          limit: 1,
        },
        metadata: d(900, 0),
        onerror: [{ id: 220, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(900, 200) }],
      },

      // DataStore — update scores
      // For email.opened: engagement += 5
      // For email.clicked: intent += 10, engagement += 10
      // For email.bounced: mark email_invalid
      {
        id: 30,
        module: 'datastore:UpdateRecord',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          key: '{{20.key}}',
          data: {
            engagement_score: '{{add(20.data.engagement_score; if(1.event = "opened"; 5; if(1.event = "clicked"; 10; 0)))}}',
            intent_score: '{{add(20.data.intent_score; if(1.event = "clicked"; 10; 0))}}',
            priority_score: '{{round(multiply(add(20.data.intent_score; if(1.event = "clicked"; 10; 0)); 0.4) + multiply(add(20.data.engagement_score; if(1.event = "opened"; 5; if(1.event = "clicked"; 10; 0))); 0.3) + multiply(20.data.fit_score; 0.2) + multiply(20.data.urgency_score; 0.1))}}',
            email_invalid: '{{if(1.event = "bounced"; "true"; 20.data.email_invalid)}}',
          },
        },
        metadata: d(1200, 0),
        onerror: [{ id: 230, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(1200, 200) }],
      },

      // AITable — log event
      modHttp(40, atUrl, `{"records":[{"fields":{"Title":"email.${`{{1.event}}`} — {{20.data.scenario}} — {{20.data.company}}","Scenario":"{{20.data.scenario}}","Company":"{{20.data.company}}","Contact Email":"{{1.email}}","Status":"EVENT-EMAIL-${`{{upper(1.event)}}`}","Touchpoint":"email.${`{{1.event}}`}","AI Generated":"Email ${`{{1.event}}`} event. Score delta applied."}}],"fieldKey":"name"}`, [atAuth], 1500, 0),

      // Discord — notify if score crossed hot threshold
      modHttp(50, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udce7 Email ${`{{1.event}}`}: {{20.data.company}}","color":3447003,"fields":[{"name":"Contact","value":"{{1.email}}","inline":true},{"name":"Event","value":"email.${`{{1.event}}`}","inline":true},{"name":"Updated Priority","value":"{{30.data.priority_score}}","inline":true}],"footer":{"text":"Email Event Processor"},"timestamp":"{{now}}"}]}`,
        null, 1800, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true}' },
        metadata: d(2100, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #25 — WhatsApp Reply Capture (WbizTool incoming)
// ════════════════════════════════════════════════════════════════

function buildWhatsAppReplyScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'WhatsApp Reply Capture (#25)',
    metadata: { version: 1 },
    flow: [
      // Webhook trigger — WbizTool incoming message
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // DataStore — search lead by phone number
      {
        id: 20,
        module: 'datastore:SearchRecords',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          filter: [[{ a: '{{data.email}}', b: '{{1.from}}', o: 'text:contains' }]],
          limit: 5,
        },
        metadata: d(300, 0),
        onerror: [{ id: 220, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(300, 200) }],
      },

      // DataStore — update scores (engagement +25, intent +25)
      {
        id: 30,
        module: 'datastore:UpdateRecord',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          key: '{{20.key}}',
          data: {
            engagement_score: '{{add(20.data.engagement_score; 25)}}',
            intent_score: '{{add(20.data.intent_score; 25)}}',
            priority_score: '{{round(multiply(add(20.data.intent_score; 25); 0.4) + multiply(add(20.data.engagement_score; 25); 0.3) + multiply(20.data.fit_score; 0.2) + multiply(20.data.urgency_score; 0.1))}}',
          },
        },
        metadata: d(600, 0),
        onerror: [{ id: 230, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(600, 200) }],
      },

      // AITable — log whatsapp.replied event
      modHttp(40, atUrl, `{"records":[{"fields":{"Title":"whatsapp.replied — {{20.data.scenario}} — {{20.data.company}}","Scenario":"{{20.data.scenario}}","Company":"{{20.data.company}}","Contact Email":"{{20.data.email}}","Status":"EVENT-WHATSAPP-REPLY","Touchpoint":"whatsapp.replied","AI Generated":"WhatsApp reply from {{1.from}}: {{substring(1.body; 0; 500)}}"}}],"fieldKey":"name"}`, [atAuth], 900, 0),

      // Discord — alert
      modHttp(50, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udcf1 WhatsApp Reply: {{20.data.company}}","color":2067276,"fields":[{"name":"From","value":"{{1.from}}","inline":true},{"name":"Contact","value":"{{20.data.contact}} ({{20.data.email}})","inline":true},{"name":"Message","value":"{{substring(1.body; 0; 300)}}"},{"name":"Updated Priority","value":"{{30.data.priority_score}}","inline":true}],"footer":{"text":"WhatsApp Reply Capture"},"timestamp":"{{now}}"}]}`,
        null, 1200, 0),

      // Telegram — alert
      modHttp(51, tgUrl,
        `{"chat_id":"${TELEGRAM.newLeads}","parse_mode":"HTML","text":"\\ud83d\\udcf1 <b>WhatsApp Reply: {{20.data.company}}</b>\\n<b>From:</b> {{1.from}}\\n<b>Contact:</b> {{20.data.contact}}\\n<b>Message:</b> {{substring(1.body; 0; 300)}}\\n<b>Priority:</b> {{30.data.priority_score}}"}`,
        null, 1500, 0),

      // Hot Lead check — if priority >= 80, send to high-value channel
      modHttp(60, DISCORD.highValue,
        `{"embeds":[{"title":"\\ud83d\\udd25 HOT LEAD — WhatsApp Reply","color":15548997,"fields":[{"name":"Company","value":"{{20.data.company}}","inline":true},{"name":"Contact","value":"{{20.data.contact}}","inline":true},{"name":"Priority","value":"{{30.data.priority_score}}","inline":true},{"name":"Message","value":"{{substring(1.body; 0; 300)}}"}],"footer":{"text":"Hot Lead Radar"},"timestamp":"{{now}}"}]}`,
        null, 1800, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true}' },
        metadata: d(2100, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #26 — Phone Event Processor (CallScaler)
// ════════════════════════════════════════════════════════════════

function buildPhoneEventScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Phone Event Processor (#26)',
    metadata: { version: 1 },
    flow: [
      // Webhook trigger — CallScaler events
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // DataStore — search lead by phone
      {
        id: 20,
        module: 'datastore:SearchRecords',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          filter: [[{ a: '{{data.email}}', b: '{{1.caller_number}}', o: 'text:contains' }]],
          limit: 5,
        },
        metadata: d(300, 0),
        onerror: [{ id: 220, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(300, 200) }],
      },

      // DataStore — update scores
      // call_received: intent +40, urgency +40, engagement +30
      // call_missed: urgency +40
      {
        id: 30,
        module: 'datastore:UpdateRecord',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          key: '{{20.key}}',
          data: {
            intent_score: '{{add(20.data.intent_score; if(1.event = "call_received"; 40; 0))}}',
            urgency_score: '{{add(20.data.urgency_score; 40)}}',
            engagement_score: '{{add(20.data.engagement_score; if(1.event = "call_received"; 30; 0))}}',
            priority_score: '{{round(multiply(add(20.data.intent_score; if(1.event = "call_received"; 40; 0)); 0.4) + multiply(add(20.data.engagement_score; if(1.event = "call_received"; 30; 0)); 0.3) + multiply(20.data.fit_score; 0.2) + multiply(add(20.data.urgency_score; 40); 0.1))}}',
          },
        },
        metadata: d(600, 0),
        onerror: [{ id: 230, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(600, 200) }],
      },

      // WhatsApp text-back for missed calls
      modHttp(35, `${WBIZTOOL.apiBase}/send`,
        `{"instance_id":"${WBIZTOOL.instanceId}","to":"{{1.caller_number}}","type":"text","body":"Sorry I missed your call! This is the NeatCircle team. I saw you tried to reach us — I will call you back shortly. In the meantime, feel free to reply here with any questions!"}`,
        [{ name: 'apikey', value: WBIZTOOL.apiKey }], 750, 0),

      // AITable — log event
      modHttp(40, atUrl, `{"records":[{"fields":{"Title":"phone.{{1.event}} — {{20.data.scenario}} — {{20.data.company}}","Scenario":"{{20.data.scenario}}","Company":"{{20.data.company}}","Contact Email":"{{20.data.email}}","Status":"EVENT-PHONE-{{upper(1.event)}}","Touchpoint":"phone.{{1.event}}","AI Generated":"Phone {{1.event}} from {{1.caller_number}}. Duration: {{1.duration}}s. Score delta: intent +{{if(1.event = call_received; 40; 0)}}, urgency +40, engagement +{{if(1.event = call_received; 30; 0)}}."}}],"fieldKey":"name"}`, [atAuth], 900, 0),

      // Discord + Telegram alerts
      modHttp(50, DISCORD.highValue,
        `{"embeds":[{"title":"\\ud83d\\udcde Phone {{1.event}}: {{20.data.company}}","color":15844367,"fields":[{"name":"Caller","value":"{{1.caller_number}}","inline":true},{"name":"Contact","value":"{{20.data.contact}}","inline":true},{"name":"Duration","value":"{{1.duration}}s","inline":true},{"name":"Priority","value":"{{30.data.priority_score}}","inline":true}],"footer":{"text":"Phone Event Processor"},"timestamp":"{{now}}"}]}`,
        null, 1200, 0),

      modHttp(51, tgUrl,
        `{"chat_id":"${TELEGRAM.highValue}","parse_mode":"HTML","text":"\\ud83d\\udcde <b>Phone {{1.event}}: {{20.data.company}}</b>\\n<b>Caller:</b> {{1.caller_number}}\\n<b>Contact:</b> {{20.data.contact}}\\n<b>Duration:</b> {{1.duration}}s\\n<b>Priority:</b> {{30.data.priority_score}}"}`,
        null, 1500, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true}' },
        metadata: d(1800, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #27 — Visitor Event Processor (Plerdy/Happierleads/Salespanel)
// ════════════════════════════════════════════════════════════════

function buildVisitorEventScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Visitor Event Processor (#27)',
    metadata: { version: 1 },
    flow: [
      // Webhook trigger — visitor tracking events
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // SetVariable — calculate score deltas based on page/event type
      {
        id: 4,
        module: 'util:SetVariable',
        version: 1,
        mapper: {
          name: 'deltas',
          value: '{{if(1.event = "pricing_page_viewed"; "intent:20,urgency:0"; if(1.event = "case_study_viewed"; "intent:15,urgency:0"; if(1.event = "multiple_pages"; "intent:0,urgency:25"; "intent:0,urgency:0")))}}',
          scope: 'roundtrip',
        },
        metadata: d(300, 0),
      },

      // DataStore — search lead by email (if identified) or session ID
      {
        id: 20,
        module: 'datastore:SearchRecords',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          filter: [[{ a: '{{data.email}}', b: '{{1.email}}', o: 'text:equal' }]],
          limit: 1,
        },
        metadata: d(600, 0),
        onerror: [{ id: 220, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(600, 200) }],
      },

      // DataStore — update scores
      {
        id: 30,
        module: 'datastore:UpdateRecord',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          key: '{{20.key}}',
          data: {
            intent_score: '{{add(20.data.intent_score; if(1.event = "pricing_page_viewed"; 20; if(1.event = "case_study_viewed"; 15; 0)))}}',
            urgency_score: '{{add(20.data.urgency_score; if(1.event = "multiple_pages"; 25; 0))}}',
            priority_score: '{{round(multiply(add(20.data.intent_score; if(1.event = "pricing_page_viewed"; 20; if(1.event = "case_study_viewed"; 15; 0))); 0.4) + multiply(20.data.engagement_score; 0.3) + multiply(20.data.fit_score; 0.2) + multiply(add(20.data.urgency_score; if(1.event = "multiple_pages"; 25; 0)); 0.1))}}',
          },
        },
        metadata: d(900, 0),
        onerror: [{ id: 230, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(900, 200) }],
      },

      // AITable — log visitor event
      modHttp(40, atUrl, `{"records":[{"fields":{"Title":"visitor.{{1.event}} — {{ifempty(20.data.company; 1.company_identified; unknown)}}","Scenario":"{{20.data.scenario}}","Company":"{{ifempty(20.data.company; 1.company_identified; anonymous)}}","Contact Email":"{{ifempty(1.email; 20.data.email; anonymous)}}","Status":"EVENT-VISITOR-{{upper(1.event)}}","Touchpoint":"page.{{1.event}}","AI Generated":"Page: {{1.page_url}}. Referrer: {{1.referrer}}. Session pages: {{1.pages_in_session}}."}}],"fieldKey":"name"}`, [atAuth], 1200, 0),

      // Discord — log (only for identified leads)
      modHttp(50, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udc41 Visitor: {{ifempty(20.data.company; 1.company_identified; anonymous)}}","color":10181046,"fields":[{"name":"Event","value":"{{1.event}}","inline":true},{"name":"Page","value":"{{1.page_url}}","inline":true},{"name":"Email","value":"{{ifempty(1.email; anonymous)}}","inline":true},{"name":"Priority","value":"{{ifempty(30.data.priority_score; n/a)}}","inline":true}],"footer":{"text":"Visitor Event Processor"},"timestamp":"{{now}}"}]}`,
        null, 1500, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true}' },
        metadata: d(1800, 0),
      },
    ],
  };
}

// ── Deployment ──

const SCENARIO_BUILDERS = [
  { name: 'Email Event Processor (#24)', builder: buildEmailEventScenario },
  { name: 'WhatsApp Reply Capture (#25)', builder: buildWhatsAppReplyScenario },
  { name: 'Phone Event Processor (#26)', builder: buildPhoneEventScenario },
  { name: 'Visitor Event Processor (#27)', builder: buildVisitorEventScenario },
];

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   LEAD OS — Event Capture Scenarios #24-#27      ║');
  console.log('  ║   Email • WhatsApp • Phone • Visitor tracking   ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (const { name, builder } of SCENARIO_BUILDERS) {
    log(`\n━━━ ${name} ━━━`);

    try {
      const blueprint = builder();

      // Try to find existing scenario by name
      const listRes = await makeApi('GET', '/scenarios?pg[limit]=100');
      await sleep(API_DELAY);

      let scenarioId = null;
      if (listRes.ok) {
        const scenarios = listRes.data?.scenarios || listRes.data || [];
        const existing = scenarios.find(s => s.name === name);
        if (existing) {
          scenarioId = existing.id;
          log(`  Found existing scenario: ID ${scenarioId}`);

          // Backup
          const bpRes = await makeApi('GET', `/scenarios/${scenarioId}/blueprint`);
          await sleep(API_DELAY);
          if (bpRes.ok) {
            await writeFile(join(BACKUP_DIR, `${scenarioId}-backup.json`), JSON.stringify(bpRes.data, null, 2));
          }

          // Stop, update, restart
          await makeApi('POST', `/scenarios/${scenarioId}/stop`);
          await sleep(API_DELAY);

          const patchRes = await makeApi('PATCH', `/scenarios/${scenarioId}`, {
            blueprint: JSON.stringify(blueprint),
          });
          await sleep(API_DELAY);

          if (!patchRes.ok) throw new Error(`PATCH: ${patchRes.status}`);

          await makeApi('POST', `/scenarios/${scenarioId}/start`);
          await sleep(API_DELAY);
        }
      }

      if (!scenarioId) {
        // Create new scenario
        const createRes = await makeApi('POST', '/scenarios', {
          teamId: 1,
          folderId: null,
          blueprint: JSON.stringify(blueprint),
        });
        await sleep(API_DELAY);

        if (!createRes.ok) throw new Error(`CREATE: ${createRes.status} — ${JSON.stringify(createRes.data).slice(0, 200)}`);

        scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
        log(`  Created scenario #${scenarioId}`);

        await makeApi('POST', `/scenarios/${scenarioId}/start`);
        await sleep(API_DELAY);
      }

      // Save blueprint
      await writeFile(join(BACKUP_DIR, `${scenarioId}-blueprint.json`), JSON.stringify(blueprint, null, 2));

      log(`  DEPLOYED — ${name}`);
      results.success++;
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      results.failed++;
      results.errors.push({ name, error: e.message });
    }
  }

  // Summary
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   EVENT SCENARIOS DEPLOYMENT SUMMARY             ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log(`  Success: ${results.success}/${SCENARIO_BUILDERS.length}`);
  console.log(`  Failed:  ${results.failed}/${SCENARIO_BUILDERS.length}`);

  if (results.errors.length) {
    console.log('\n  Failures:');
    results.errors.forEach(e => console.log(`    ${e.name}: ${e.error}`));
  }

  console.log('\n  Webhook URLs must be configured in:');
  console.log('    #24: Emailit dashboard → Webhooks → email events');
  console.log('    #25: WbizTool dashboard → Incoming Messages → webhook URL');
  console.log('    #26: CallScaler dashboard → Webhooks → call events');
  console.log('    #27: Plerdy/Happierleads/Salespanel → Webhook integrations');
  console.log('  ════════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
