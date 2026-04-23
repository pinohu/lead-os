#!/usr/bin/env node

/**
 * deploy-event-scenarios.mjs — Make.com Scenarios #24-#27
 *
 * Behavioral event capture scenarios for Lead OS.
 * Each receives webhooks from external tools, logs to AITable,
 * and sends Discord/Telegram alerts. Score updates happen via
 * the Vercel nurture cron (reads AITable events).
 *
 * Scenarios:
 *   #24 — Email Event Processor (Emailit open/click/bounce)
 *   #25 — WhatsApp Reply Capture (WbizTool incoming)
 *   #26 — Phone Event Processor (CallScaler call/missed)
 *   #27 — Visitor Event Processor (Plerdy/Happierleads)
 *
 * Uses only proven Boost.space modules:
 *   gateway:CustomWebHook, http:ActionSendData, gateway:WebhookRespond
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Config ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = process.env.MAKE_API_TOKEN;
if (!API_TOKEN) throw new Error('MAKE_API_TOKEN environment variable is required');

const DISCORD = {
  newLeads: process.env.DISCORD_WEBHOOK_NEW_LEADS || '',
  highValue: process.env.DISCORD_WEBHOOK_HIGH_VALUE || '',
};

const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  newLeads: process.env.TELEGRAM_NEW_LEADS_CHAT || '',
  highValue: process.env.TELEGRAM_HIGH_VALUE_CHAT || '',
};

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN || '',
  datasheetId: process.env.AITABLE_DATASHEET_ID || '',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const WBIZTOOL = {
  apiKey: process.env.WBIZTOOL_API_KEY || '',
  instanceId: process.env.WBIZTOOL_INSTANCE_ID || '',
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

// ════════════════════════════════════════════════════════════════
// SCENARIO #24 — Email Event Processor
// ════════════════════════════════════════════════════════════════

function buildEmailEventScenario() {
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Email Event Processor (#24)',
    metadata: { version: 1 },
    flow: [
      {
        id: 1, module: 'gateway:CustomWebHook', version: 1,
        parameters: { hook: null, maxResults: 1 }, metadata: d(0, 0),
      },

      // AITable — log email event with score hints for nurture cron
      modHttp(10, atUrl,
        `{"records":[{"fields":{"Title":"email.{{1.event}} — {{1.email}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Contact Name":"{{1.contact}}","Status":"EVENT-EMAIL-{{upper(1.event)}}","Touchpoint":"email.{{1.event}}","AI Generated":"Email {{1.event}}. Score delta: {{if(1.event = opened; engagement+5; if(1.event = clicked; intent+10 engagement+10; bounced))}}"}}],"fieldKey":"name"}`,
        [atAuth], 300, 0),

      // Discord notification
      modHttp(20, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udce7 Email {{1.event}}: {{1.company}}","color":3447003,"fields":[{"name":"Contact","value":"{{1.email}}","inline":true},{"name":"Event","value":"email.{{1.event}}","inline":true},{"name":"Scenario","value":"{{1.scenario}}","inline":true}],"footer":{"text":"Email Event Processor #24"},"timestamp":"{{now}}"}]}`,
        null, 600, 0),

      {
        id: 90, module: 'gateway:WebhookRespond', version: 1,
        mapper: { status: '200', body: '{"received":true,"processor":"email-events"}' },
        metadata: d(900, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #25 — WhatsApp Reply Capture
// ════════════════════════════════════════════════════════════════

function buildWhatsAppReplyScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'WhatsApp Reply Capture (#25)',
    metadata: { version: 1 },
    flow: [
      {
        id: 1, module: 'gateway:CustomWebHook', version: 1,
        parameters: { hook: null, maxResults: 1 }, metadata: d(0, 0),
      },

      // AITable — log reply event
      modHttp(10, atUrl,
        `{"records":[{"fields":{"Title":"whatsapp.replied — {{1.from}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Contact Name":"{{1.contact}}","Status":"EVENT-WHATSAPP-REPLY","Touchpoint":"whatsapp.replied","AI Generated":"WhatsApp reply from {{1.from}}: {{substring(1.body; 0; 500)}}. Score delta: intent+25 engagement+25"}}],"fieldKey":"name"}`,
        [atAuth], 300, 0),

      // Discord alert
      modHttp(20, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udcf1 WhatsApp Reply","color":2067276,"fields":[{"name":"From","value":"{{1.from}}","inline":true},{"name":"Contact","value":"{{1.contact}} ({{1.email}})","inline":true},{"name":"Message","value":"{{substring(1.body; 0; 300)}}"}],"footer":{"text":"WhatsApp Reply Capture #25"},"timestamp":"{{now}}"}]}`,
        null, 600, 0),

      // Telegram alert
      modHttp(30, tgUrl,
        `{"chat_id":"${TELEGRAM.newLeads}","parse_mode":"HTML","text":"\\ud83d\\udcf1 <b>WhatsApp Reply</b>\\n<b>From:</b> {{1.from}}\\n<b>Contact:</b> {{1.contact}}\\n<b>Message:</b> {{substring(1.body; 0; 300)}}"}`,
        null, 900, 0),

      {
        id: 90, module: 'gateway:WebhookRespond', version: 1,
        mapper: { status: '200', body: '{"received":true,"processor":"whatsapp-reply"}' },
        metadata: d(1200, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #26 — Phone Event Processor
// ════════════════════════════════════════════════════════════════

function buildPhoneEventScenario() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Phone Event Processor (#26)',
    metadata: { version: 1 },
    flow: [
      {
        id: 1, module: 'gateway:CustomWebHook', version: 1,
        parameters: { hook: null, maxResults: 1 }, metadata: d(0, 0),
      },

      // WhatsApp text-back for missed calls
      modHttp(10, `${WBIZTOOL.apiBase}/send`,
        `{"instance_id":"${WBIZTOOL.instanceId}","to":"{{1.caller_number}}","type":"text","body":"Sorry I missed your call! This is the NeatCircle team. I will call you back shortly. Feel free to reply here with any questions!"}`,
        [{ name: 'apikey', value: WBIZTOOL.apiKey }], 300, 0),

      // AITable — log phone event
      modHttp(20, atUrl,
        `{"records":[{"fields":{"Title":"phone.{{1.event}} — {{1.caller_number}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Contact Name":"{{1.contact}}","Status":"EVENT-PHONE-{{upper(1.event)}}","Touchpoint":"phone.{{1.event}}","AI Generated":"Phone {{1.event}} from {{1.caller_number}}. Duration: {{1.duration}}s. Score delta: intent+40 urgency+40 engagement+30"}}],"fieldKey":"name"}`,
        [atAuth], 600, 0),

      // Discord alert (high-value — phone calls are always high intent)
      modHttp(30, DISCORD.highValue,
        `{"embeds":[{"title":"\\ud83d\\udcde Phone {{1.event}}: {{1.company}}","color":15844367,"fields":[{"name":"Caller","value":"{{1.caller_number}}","inline":true},{"name":"Contact","value":"{{1.contact}}","inline":true},{"name":"Duration","value":"{{1.duration}}s","inline":true}],"footer":{"text":"Phone Event Processor #26"},"timestamp":"{{now}}"}]}`,
        null, 900, 0),

      // Telegram alert
      modHttp(40, tgUrl,
        `{"chat_id":"${TELEGRAM.highValue}","parse_mode":"HTML","text":"\\ud83d\\udcde <b>Phone {{1.event}}: {{1.company}}</b>\\n<b>Caller:</b> {{1.caller_number}}\\n<b>Contact:</b> {{1.contact}}\\n<b>Duration:</b> {{1.duration}}s"}`,
        null, 1200, 0),

      {
        id: 90, module: 'gateway:WebhookRespond', version: 1,
        mapper: { status: '200', body: '{"received":true,"processor":"phone-events"}' },
        metadata: d(1500, 0),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// SCENARIO #27 — Visitor Event Processor
// ════════════════════════════════════════════════════════════════

function buildVisitorEventScenario() {
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  return {
    name: 'Visitor Event Processor (#27)',
    metadata: { version: 1 },
    flow: [
      {
        id: 1, module: 'gateway:CustomWebHook', version: 1,
        parameters: { hook: null, maxResults: 1 }, metadata: d(0, 0),
      },

      // AITable — log visitor event
      modHttp(10, atUrl,
        `{"records":[{"fields":{"Title":"visitor.{{1.event}} — {{1.company}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Status":"EVENT-VISITOR-{{upper(1.event)}}","Touchpoint":"page.{{1.event}}","AI Generated":"Page: {{1.page_url}}. Referrer: {{1.referrer}}. Session pages: {{1.pages_in_session}}. Score delta: {{if(1.event = pricing_page_viewed; intent+20; if(1.event = case_study_viewed; intent+15; if(1.event = multiple_pages; urgency+25; none)))}}"}}],"fieldKey":"name"}`,
        [atAuth], 300, 0),

      // Discord notification
      modHttp(20, DISCORD.newLeads,
        `{"embeds":[{"title":"\\ud83d\\udc41 Visitor: {{1.company}}","color":10181046,"fields":[{"name":"Event","value":"{{1.event}}","inline":true},{"name":"Page","value":"{{1.page_url}}","inline":true},{"name":"Email","value":"{{1.email}}","inline":true}],"footer":{"text":"Visitor Event Processor #27"},"timestamp":"{{now}}"}]}`,
        null, 600, 0),

      {
        id: 90, module: 'gateway:WebhookRespond', version: 1,
        mapper: { status: '200', body: '{"received":true,"processor":"visitor-events"}' },
        metadata: d(900, 0),
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

      const listRes = await makeApi('GET', '/scenarios?teamId=2568&pg[limit]=100');
      await sleep(API_DELAY);

      let scenarioId = null;
      if (listRes.ok) {
        const scenarios = listRes.data?.scenarios || listRes.data || [];
        const existing = scenarios.find(s => s.name === name);
        if (existing) {
          scenarioId = existing.id;
          log(`  Found existing: #${scenarioId}`);

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
        const createRes = await makeApi('POST', '/scenarios', {
          teamId: 2568,
          folderId: 10436,
          blueprint: JSON.stringify(blueprint),
          scheduling: JSON.stringify({ type: 'immediately' }),
        });
        await sleep(API_DELAY);

        if (!createRes.ok) throw new Error(`CREATE: ${createRes.status} — ${JSON.stringify(createRes.data).slice(0, 200)}`);

        scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
        await makeApi('POST', `/scenarios/${scenarioId}/start`);
        await sleep(API_DELAY);
      }

      await writeFile(join(BACKUP_DIR, `${scenarioId}-blueprint.json`), JSON.stringify(blueprint, null, 2));
      log(`  DEPLOYED — ${name} #${scenarioId}`);
      results.success++;
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      results.failed++;
      results.errors.push({ name, error: e.message });
    }
  }

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
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
