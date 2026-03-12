#!/usr/bin/env node

/**
 * deploy-hot-lead-radar.mjs — Make.com Scenario #23
 *
 * Polls DataStore every 15 minutes for leads with priority_score >= 80.
 * Sends instant alerts to Discord #high-value-leads, Telegram high-value chat,
 * and optionally WhatsApp to Ike. Flags records to prevent duplicate alerts.
 *
 * Pipeline:
 *   Schedule (15min) → DataStore: Search → Iterator → Filter (not notified)
 *   → Discord embed → Telegram alert → DataStore: Update flag
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Config (same as deploy-advanced-scenarios.mjs) ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = process.env.MAKE_API_TOKEN || '24595d5e-9b7f-48f9-ab61-9644c46ed7f9';
const DS_ID = 3748;

const DISCORD = {
  highValue: 'https://discord.com/api/webhooks/1480429897263480962/e-vvArec6HCRc_HpzxmWOpz3GbJ7ncekeLBD7hSnKHm4v-zXTwt8fm6DjrY7TUBeo6Ct',
};

const TELEGRAM = {
  botToken: '8739229269:AAGYs6jIIjDa87y4TAVwn4QtTWBqliohDQI',
  highValue: '-1003862266875',
};

const WBIZTOOL = {
  apiKey: '54140a11389a13031a2eb19070ce35c5ce769a30',
  instanceId: '12316',
  apiBase: 'https://app.wbiztool.com/api',
};

const IKE_PHONE = process.env.IKE_PHONE || '';

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

// ── Blueprint builder ──

function buildHotLeadRadarBlueprint() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;

  // Discord rich embed for hot lead
  const discordBody = `{"embeds":[{"title":"\\ud83d\\udd25 HOT LEAD DETECTED","color":15548997,"fields":[{"name":"Company","value":"{{4.data.company}}","inline":true},{"name":"Contact","value":"{{4.data.contact}} ({{4.data.email}})","inline":true},{"name":"Scenario","value":"{{4.data.scenario}}","inline":true},{"name":"Priority Score","value":"{{4.data.priority_score}}","inline":true},{"name":"Intent","value":"{{4.data.intent_score}}","inline":true},{"name":"Engagement","value":"{{4.data.engagement_score}}","inline":true},{"name":"Advisor","value":"{{4.data.advisor}}","inline":true},{"name":"Status","value":"{{4.data.status}}","inline":true}],"footer":{"text":"Hot Lead Radar \\u2022 Priority >= 80"},"timestamp":"{{now}}"}]}`;

  // Telegram alert
  const telegramBody = `{"chat_id":"${TELEGRAM.highValue}","parse_mode":"HTML","text":"\\ud83d\\udd25 <b>HOT LEAD DETECTED</b>\\n\\n<b>Company:</b> {{4.data.company}}\\n<b>Contact:</b> {{4.data.contact}} ({{4.data.email}})\\n<b>Scenario:</b> {{4.data.scenario}}\\n<b>Priority:</b> {{4.data.priority_score}}\\n<b>Intent:</b> {{4.data.intent_score}} | <b>Engagement:</b> {{4.data.engagement_score}}\\n<b>Advisor:</b> {{4.data.advisor}}"}`;

  const flow = [
    // Module 1: Schedule trigger (every 15 minutes)
    {
      id: 1,
      module: 'builtin:BasicScheduler',
      version: 1,
      mapper: { time: '{{formatDate(now; "HH:mm")}}' },
      parameters: { scheduling: { type: 'indefinitely', interval: 15 } },
      metadata: d(0, 0),
    },

    // Module 2: DataStore — Search for hot leads
    {
      id: 2,
      module: 'datastore:SearchRecords',
      version: 1,
      parameters: { datastore: DS_ID },
      mapper: {
        filter: [
          [{ a: '{{data.priority_score}}', b: '80', o: 'number:greaterorequal' }],
        ],
        limit: 20,
      },
      metadata: d(300, 0),
      onerror: [{ id: 202, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(300, 200) }],
    },

    // Module 3: Iterator — process each matching record
    {
      id: 3,
      module: 'builtin:BasicFeeder',
      version: 1,
      mapper: { array: '{{2.records}}' },
      metadata: d(600, 0),
    },

    // Module 4: Set Variables — extract record data
    {
      id: 4,
      module: 'util:SetVariable',
      version: 1,
      mapper: {
        name: 'data',
        value: '{{3.value}}',
        scope: 'roundtrip',
      },
      metadata: d(900, 0),
    },

    // Module 5: Filter — skip already-notified leads
    {
      id: 5,
      module: 'builtin:BasicRouter',
      version: 1,
      metadata: d(1200, 0),
      routes: [
        {
          flow: [
            // Module 10: Discord — rich embed to #high-value-leads
            {
              id: 10,
              module: 'http:ActionSendData',
              version: 3,
              parameters: { handleErrors: true },
              mapper: {
                url: DISCORD.highValue,
                method: 'post',
                headers: [{ name: 'Content-Type', value: 'application/json' }],
                body: discordBody,
                parseResponse: false,
              },
              metadata: d(1500, -200),
              onerror: [{ id: 210, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(1500, 0) }],
            },

            // Module 11: Telegram — hot lead alert
            {
              id: 11,
              module: 'http:ActionSendData',
              version: 3,
              parameters: { handleErrors: true },
              mapper: {
                url: tgUrl,
                method: 'post',
                headers: [{ name: 'Content-Type', value: 'application/json' }],
                body: telegramBody,
                parseResponse: false,
              },
              metadata: d(1800, -200),
              onerror: [{ id: 211, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(1800, 0) }],
            },

            // Module 12: DataStore — flag as notified
            {
              id: 12,
              module: 'datastore:UpdateRecord',
              version: 1,
              parameters: { datastore: DS_ID },
              mapper: {
                key: '{{4.data.scenario}}_{{4.data.email}}',
                data: { hot_lead_notified: 'true' },
              },
              metadata: d(2100, -200),
              onerror: [{ id: 212, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(2100, 0) }],
            },
          ],
          filter: {
            name: 'Not already notified',
            conditions: [[{ a: '{{4.data.hot_lead_notified}}', b: 'true', o: 'text:notequal' }]],
          },
        },
      ],
    },
  ];

  return {
    name: SCENARIO_NAME,
    flow,
    metadata: { version: 1 },
  };
}

// ── Alternative: Linear pipeline version (no router) ──
// If the router causes validation issues (like V10 did), use this linear version.

function buildHotLeadRadarLinear() {
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;

  const discordBody = `{"embeds":[{"title":"\\ud83d\\udd25 HOT LEAD DETECTED","color":15548997,"fields":[{"name":"Company","value":"{{2.data.company}}","inline":true},{"name":"Contact","value":"{{2.data.contact}} ({{2.data.email}})","inline":true},{"name":"Scenario","value":"{{2.data.scenario}}","inline":true},{"name":"Priority Score","value":"{{2.data.priority_score}}","inline":true},{"name":"Intent","value":"{{2.data.intent_score}}","inline":true},{"name":"Engagement","value":"{{2.data.engagement_score}}","inline":true},{"name":"Advisor","value":"{{2.data.advisor}}","inline":true}],"footer":{"text":"Hot Lead Radar \\u2022 Priority >= 80"},"timestamp":"{{now}}"}]}`;

  const telegramBody = `{"chat_id":"${TELEGRAM.highValue}","parse_mode":"HTML","text":"\\ud83d\\udd25 <b>HOT LEAD DETECTED</b>\\n\\n<b>Company:</b> {{2.data.company}}\\n<b>Contact:</b> {{2.data.contact}} ({{2.data.email}})\\n<b>Scenario:</b> {{2.data.scenario}}\\n<b>Priority:</b> {{2.data.priority_score}}\\n<b>Advisor:</b> {{2.data.advisor}}"}`;

  return {
    name: SCENARIO_NAME,
    metadata: { version: 1 },
    flow: [
      // Schedule trigger (15 min)
      {
        id: 1,
        module: 'builtin:BasicScheduler',
        version: 1,
        mapper: { time: '{{formatDate(now; "HH:mm")}}' },
        parameters: { scheduling: { type: 'indefinitely', interval: 15 } },
        metadata: d(0, 0),
      },

      // DataStore search: priority_score >= 80 AND hot_lead_notified != true
      {
        id: 2,
        module: 'datastore:SearchRecords',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          filter: [
            [
              { a: '{{data.priority_score}}', b: '80', o: 'number:greaterorequal' },
              { a: '{{data.hot_lead_notified}}', b: 'true', o: 'text:notequal' },
            ],
          ],
          limit: 20,
        },
        metadata: d(300, 0),
        onerror: [{ id: 202, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(300, 200) }],
      },

      // Discord — rich embed to #high-value-leads
      {
        id: 10,
        module: 'http:ActionSendData',
        version: 3,
        parameters: { handleErrors: true },
        mapper: {
          url: DISCORD.highValue,
          method: 'post',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          body: discordBody,
          parseResponse: false,
        },
        metadata: d(600, 0),
        onerror: [{ id: 210, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(600, 200) }],
      },

      // Telegram alert
      {
        id: 11,
        module: 'http:ActionSendData',
        version: 3,
        parameters: { handleErrors: true },
        mapper: {
          url: tgUrl,
          method: 'post',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          body: telegramBody,
          parseResponse: false,
        },
        metadata: d(900, 0),
        onerror: [{ id: 211, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(900, 200) }],
      },

      // DataStore — flag as hot-lead-notified
      {
        id: 12,
        module: 'datastore:UpdateRecord',
        version: 1,
        parameters: { datastore: DS_ID },
        mapper: {
          key: '{{2.data.scenario}}_{{2.data.email}}',
          data: { hot_lead_notified: 'true' },
        },
        metadata: d(1200, 0),
        onerror: [{ id: 212, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(1200, 200) }],
      },
    ],
  };
}

// ── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   HOT LEAD RADAR — Scenario #23 Deployment      ║');
  console.log('  ║   15-min schedule → DataStore → Discord + TG    ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  // Step 1: Create new scenario via Make.com API
  log('Creating new scenario...');

  const createRes = await makeApi('POST', '/scenarios', {
    teamId: 1, // default team
    folderId: null,
    blueprint: JSON.stringify(buildHotLeadRadarLinear()),
    scheduling: { type: 'indefinitely', interval: 15 },
  });
  await sleep(API_DELAY);

  if (!createRes.ok) {
    // If create fails, try to find existing scenario by name
    log(`Create failed (${createRes.status}). Checking if scenario already exists...`);

    const listRes = await makeApi('GET', '/scenarios?pg[limit]=100');
    await sleep(API_DELAY);

    if (listRes.ok) {
      const scenarios = listRes.data?.scenarios || listRes.data || [];
      const existing = scenarios.find(s => s.name === SCENARIO_NAME);

      if (existing) {
        log(`Found existing scenario: ID ${existing.id}`);

        // Backup existing blueprint
        const bpRes = await makeApi('GET', `/scenarios/${existing.id}/blueprint`);
        await sleep(API_DELAY);
        if (bpRes.ok) {
          await writeFile(
            join(BACKUP_DIR, `${existing.id}-backup.json`),
            JSON.stringify(bpRes.data, null, 2),
          );
          log(`  Backup saved`);
        }

        // Stop, update, restart
        await makeApi('POST', `/scenarios/${existing.id}/stop`);
        await sleep(API_DELAY);

        const patchRes = await makeApi('PATCH', `/scenarios/${existing.id}`, {
          blueprint: JSON.stringify(buildHotLeadRadarLinear()),
        });
        await sleep(API_DELAY);

        if (!patchRes.ok) {
          throw new Error(`PATCH failed: ${patchRes.status} — ${JSON.stringify(patchRes.data).slice(0, 300)}`);
        }

        const startRes = await makeApi('POST', `/scenarios/${existing.id}/start`);
        await sleep(API_DELAY);
        log(`  ${startRes.ok ? 'DEPLOYED — Radar active' : `Activation: ${startRes.status}`}`);
        return;
      }
    }

    throw new Error(`Cannot create scenario: ${createRes.status} — ${JSON.stringify(createRes.data).slice(0, 300)}`);
  }

  const scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
  log(`Created scenario #${scenarioId}`);

  // Save blueprint backup
  await writeFile(
    join(BACKUP_DIR, `${scenarioId}-initial.json`),
    JSON.stringify(buildHotLeadRadarLinear(), null, 2),
  );

  // Activate scenario
  const startRes = await makeApi('POST', `/scenarios/${scenarioId}/start`);
  await sleep(API_DELAY);
  log(startRes.ok ? 'DEPLOYED — Hot Lead Radar active' : `Activation: ${startRes.status}`);

  console.log('');
  console.log('  ════════════════════════════════════════════════');
  console.log(`  Scenario #${scenarioId}: ${SCENARIO_NAME}`);
  console.log('  Schedule: Every 15 minutes');
  console.log('  Threshold: priority_score >= 80');
  console.log('  Channels: Discord #high-value-leads + Telegram');
  console.log('  ════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
