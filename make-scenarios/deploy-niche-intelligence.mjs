#!/usr/bin/env node

/**
 * deploy-niche-intelligence.mjs — Make.com Scenario #29
 *
 * Weekly niche intelligence report. Webhook-triggered by Vercel cron
 * which computes metrics and POSTs them here for distribution.
 *
 * Pipeline:
 *   Webhook (metrics payload) → AITable summary row → Emailit briefing → Discord digest
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Config ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = process.env.MAKE_API_TOKEN;
if (!API_TOKEN) throw new Error('MAKE_API_TOKEN environment variable is required');

const EMAILIT = {
  apiKey: process.env.EMAILIT_API_KEY || '',
  domain: 'neatcircle.com',
  adminTo: 'ike@neatcircle.com',
};

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN || '',
  datasheetId: process.env.AITABLE_DATASHEET_ID || '',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const DISCORD = {
  wins: process.env.DISCORD_WEBHOOK_WINS || '',
};

const EMAILIT_URL = 'https://api.emailit.com/v1/emails';
const BACKUP_DIR = join(process.cwd(), 'backups', 'niche-intelligence');
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

// ── Blueprint ──

function buildNicheIntelligence() {
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };
  const emailAuth = { name: 'Authorization', value: `Bearer ${EMAILIT.apiKey}` };

  return {
    name: 'Niche Intelligence (#29)',
    metadata: { version: 1 },
    flow: [
      // Webhook — receives pre-computed metrics from Vercel cron
      // Expected: { totalThisWeek, nicheCount, topNiche, summary, weekEnding }
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // AITable — Write NICHE-INTELLIGENCE summary row
      modHttp(10, atUrl,
        `{"records":[{"fields":{"Title":"NICHE-INTELLIGENCE — Week of {{1.weekEnding}}","Scenario":"all","Company":"SYSTEM","Contact Email":"system@neatcircle.com","Status":"NICHE-INTELLIGENCE","Touchpoint":"intelligence.weekly","AI Generated":"Weekly Intelligence Report. Total: {{1.totalThisWeek}} records, {{1.nicheCount}} niches. Top: {{1.topNiche}}. {{1.summary}}"}}],"fieldKey":"name"}`,
        [atAuth], 300, 0),

      // Emailit — Weekly briefing to Ike
      modHttp(20, EMAILIT_URL,
        `{"from":"Lead OS Intelligence <automations@${EMAILIT.domain}>","to":"${EMAILIT.adminTo}","subject":"Weekly Niche Intelligence — {{1.weekEnding}}","html":"<div style=font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333><h2>Lead OS — Weekly Intelligence Report</h2><p>Week ending {{1.weekEnding}}</p><div style=background:#f0f4ff;padding:20px;border-radius:8px;margin:20px_0><h3 style=margin:0_0_10px>Summary</h3><p><strong>{{1.totalThisWeek}}</strong> records this week across <strong>{{1.nicheCount}}</strong> niches</p><p>Top performing niche: <strong>{{1.topNiche}}</strong></p></div><h3>Per-Niche Breakdown</h3><pre style=white-space:pre-wrap;background:#f8f9fa;padding:16px;border-radius:8px;font-size:13px>{{1.summary}}</pre><p style=color:#888;font-size:12px;margin-top:30px;border-top:1px_solid_#eee;padding-top:15px>Lead OS Niche Intelligence Engine</p></div>","tracking":{"opens":true,"clicks":true}}`,
        [emailAuth], 600, 0),

      // Discord #wins — weekly digest
      modHttp(30, DISCORD.wins,
        `{"embeds":[{"title":"\\ud83d\\udcca Weekly Niche Intelligence — {{1.weekEnding}}","color":5763719,"fields":[{"name":"Records This Week","value":"{{1.totalThisWeek}}","inline":true},{"name":"Active Niches","value":"{{1.nicheCount}}","inline":true},{"name":"Top Niche","value":"{{1.topNiche}}","inline":true},{"name":"Breakdown","value":"{{substring(1.summary; 0; 900)}}"}],"footer":{"text":"Niche Intelligence Engine"},"timestamp":"{{now}}"}]}`,
        null, 900, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true,"processor":"niche-intelligence"}' },
        metadata: d(1200, 0),
      },
    ],
  };
}

// ── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   NICHE INTELLIGENCE — Scenario #29 Deployment   ║');
  console.log('  ║   Webhook → AITable + Email + Discord            ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const blueprint = buildNicheIntelligence();
  const scenarioName = 'Niche Intelligence (#29)';

  const listRes = await makeApi('GET', '/scenarios?teamId=2568&pg[limit]=100');
  await sleep(API_DELAY);

  let scenarioId = null;
  if (listRes.ok) {
    const scenarios = listRes.data?.scenarios || listRes.data || [];
    const existing = scenarios.find(s => s.name === scenarioName);
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

    if (!createRes.ok) throw new Error(`CREATE: ${createRes.status}`);

    scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
    await makeApi('POST', `/scenarios/${scenarioId}/start`);
    await sleep(API_DELAY);
  }

  await writeFile(join(BACKUP_DIR, `${scenarioId}-blueprint.json`), JSON.stringify(blueprint, null, 2));

  log(`DEPLOYED — Niche Intelligence #${scenarioId}`);
  console.log('\n  Trigger: Webhook (POST metrics from Vercel cron)');
  console.log('  Output: AITable summary + Email briefing + Discord digest');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
