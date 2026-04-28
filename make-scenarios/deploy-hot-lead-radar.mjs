#!/usr/bin/env node

/**
 * deploy-hot-lead-radar.mjs — Make.com Scenario #23
 *
 * Webhook-triggered hot lead alert system.
 * When any part of the system detects a lead with priority_score >= 80,
 * it POSTs to this webhook. The scenario sends instant alerts to:
 *   - Discord #high-value-leads (rich embed)
 *   - Telegram high-value chat
 *   - AITable event log
 *
 * Pipeline:
 *   Webhook → SetVar → Discord embed → Telegram alert → AITable log → WebhookRespond
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Set it in your shell or CI secret store; do not commit it.`);
  }
  return value;
}



// ── Config ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = requiredEnv('MAKE_API_TOKEN');

const DISCORD = {
  highValue: requiredEnv('DISCORD_HIGH_VALUE_WEBHOOK_URL'),
};

const TELEGRAM = {
  botToken: requiredEnv('TELEGRAM_BOT_TOKEN'),
  highValue: '-1003862266875',
};

const AITABLE = {
  apiToken: requiredEnv('AITABLE_API_TOKEN'),
  datasheetId: 'dstBicDQKC6gpLAMYj',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const BACKUP_DIR = join(process.cwd(), 'backups', 'hot-lead-radar');
const API_DELAY = 500;
const SCENARIO_NAME = 'Hot Lead Radar (#23)';

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

// ── Blueprint ──

function buildHotLeadRadar() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };

  // Discord rich embed
  const discordBody = `{"embeds":[{"title":"\\ud83d\\udd25 HOT LEAD DETECTED","color":15548997,"fields":[{"name":"Company","value":"{{1.company}}","inline":true},{"name":"Contact","value":"{{1.contact}} ({{1.email}})","inline":true},{"name":"Scenario","value":"{{1.scenario}}","inline":true},{"name":"Priority Score","value":"{{1.priority_score}}","inline":true},{"name":"Intent","value":"{{1.intent_score}}","inline":true},{"name":"Engagement","value":"{{1.engagement_score}}","inline":true},{"name":"Advisor","value":"{{1.advisor}}","inline":true}],"footer":{"text":"Hot Lead Radar \\u2022 Priority >= 80"},"timestamp":"{{now}}"}]}`;

  // Telegram alert
  const telegramBody = `{"chat_id":"${TELEGRAM.highValue}","parse_mode":"HTML","text":"\\ud83d\\udd25 <b>HOT LEAD DETECTED</b>\\n\\n<b>Company:</b> {{1.company}}\\n<b>Contact:</b> {{1.contact}} ({{1.email}})\\n<b>Scenario:</b> {{1.scenario}}\\n<b>Priority:</b> {{1.priority_score}}\\n<b>Intent:</b> {{1.intent_score}} | <b>Engagement:</b> {{1.engagement_score}}\\n<b>Advisor:</b> {{1.advisor}}"}`;

  // AITable log
  const aitableBody = `{"records":[{"fields":{"Title":"HOT-LEAD — {{1.scenario}} — {{1.company}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Contact Name":"{{1.contact}}","Status":"HOT-LEAD-ALERT","Touchpoint":"hot_lead.detected","AI Generated":"Priority: {{1.priority_score}} | Intent: {{1.intent_score}} | Engagement: {{1.engagement_score}} | Fit: {{1.fit_score}} | Urgency: {{1.urgency_score}}"}}],"fieldKey":"name"}`;

  return {
    name: SCENARIO_NAME,
    metadata: { version: 1 },
    flow: [
      // Webhook trigger
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // Discord #high-value-leads
      modHttp(10, DISCORD.highValue, discordBody, null, 300, 0),

      // Telegram alert
      modHttp(20, tgUrl, telegramBody, null, 600, 0),

      // AITable log
      modHttp(30, atUrl, aitableBody, [atAuth], 900, 0),

      // Webhook respond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true,"alert":"hot-lead-radar"}' },
        metadata: d(1200, 0),
      },
    ],
  };
}

// ── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   HOT LEAD RADAR — Scenario #23 Deployment      ║');
  console.log('  ║   Webhook → Discord + Telegram + AITable        ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const blueprint = buildHotLeadRadar();

  // Check for existing scenario
  const listRes = await makeApi('GET', '/scenarios?teamId=2568&pg[limit]=100');
  await sleep(API_DELAY);

  let scenarioId = null;
  if (listRes.ok) {
    const scenarios = listRes.data?.scenarios || listRes.data || [];
    const existing = scenarios.find(s => s.name === SCENARIO_NAME);
    if (existing) {
      scenarioId = existing.id;
      log(`Found existing: #${scenarioId}`);

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

    if (!createRes.ok) throw new Error(`CREATE: ${createRes.status} — ${JSON.stringify(createRes.data).slice(0, 300)}`);

    scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
    await makeApi('POST', `/scenarios/${scenarioId}/start`);
    await sleep(API_DELAY);
  }

  await writeFile(join(BACKUP_DIR, `${scenarioId}-blueprint.json`), JSON.stringify(blueprint, null, 2));

  log(`DEPLOYED — Hot Lead Radar #${scenarioId}`);
  console.log('\n  Trigger: Webhook (POST lead data when priority >= 80)');
  console.log('  Channels: Discord #high-value-leads + Telegram + AITable');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
