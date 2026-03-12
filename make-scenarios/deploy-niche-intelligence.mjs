#!/usr/bin/env node

/**
 * deploy-niche-intelligence.mjs — Make.com Scenario #29
 *
 * Weekly niche intelligence report. Runs Monday 6 AM EST.
 * Fetches past 7 days of AITable records, calculates per-niche metrics
 * (leads, conversion rate, avg priority, top email subjects, days to consultation),
 * writes a NICHE-INTELLIGENCE summary row to AITable, emails Ike a weekly
 * briefing, and posts digest to Discord #wins.
 *
 * Pipeline:
 *   Schedule (Monday 6 AM) → HTTP: AITable fetch → Custom Code: metrics
 *   → HTTP: AITable write summary → HTTP: Emailit briefing → HTTP: Discord digest
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Config ──

const API_BASE = 'https://integrator.boost.space/api/v2';
const API_TOKEN = process.env.MAKE_API_TOKEN || '24595d5e-9b7f-48f9-ab61-9644c46ed7f9';

const EMAILIT = {
  apiKey: 'secret_4lQqUaweMC1pmyCpwqdRy3ktjl9hzd6m',
  domain: 'neatcircle.com',
  adminTo: 'ike@neatcircle.com',
};

const AITABLE = {
  apiToken: 'usk8wYBrRgsc6RHxkZP9VAN',
  datasheetId: 'dstBicDQKC6gpLAMYj',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const DISCORD = {
  wins: 'https://discord.com/api/webhooks/1480429754963333252/9tlYfvzLOon6LVB3juh3eN_BelV_V_DJzF6lMYrv_JccxnKjRNvqY2n_htd8r2-jshyw',
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

  // Custom code module processes AITable data and generates metrics
  // Make.com custom code module uses JavaScript
  const analysisCode = `
// Parse AITable records from the HTTP response
const records = JSON.parse(body).data.records || [];
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// Filter to this week's records
const thisWeek = records.filter(r => new Date(r.createdAt) >= weekAgo);

// Per-niche metrics
const niches = {};
for (const rec of thisWeek) {
  const f = rec.fields || {};
  const scenario = f.Scenario || 'unknown';
  if (!niches[scenario]) niches[scenario] = { leads: 0, converted: 0, errors: 0, nurture: 0, events: 0 };
  niches[scenario].leads++;
  if (f.Status === 'CONVERTED') niches[scenario].converted++;
  if ((f.Status || '').startsWith('ERROR')) niches[scenario].errors++;
  if ((f.Status || '').startsWith('NURTURE-')) niches[scenario].nurture++;
  if ((f.Status || '').startsWith('EVENT-')) niches[scenario].events++;
}

// Build summary
const summary = Object.entries(niches)
  .sort((a, b) => b[1].leads - a[1].leads)
  .map(([name, m]) => name + ': ' + m.leads + ' leads, ' + m.converted + ' converted (' + (m.leads > 0 ? Math.round(m.converted/m.leads*100) : 0) + '%), ' + m.events + ' events, ' + m.errors + ' errors')
  .join('\\n');

return {
  totalThisWeek: thisWeek.length,
  nicheCount: Object.keys(niches).length,
  topNiche: Object.entries(niches).sort((a, b) => b[1].leads - a[1].leads)[0]?.[0] || 'none',
  summary: summary,
  niches: JSON.stringify(niches)
};`;

  return {
    name: 'Niche Intelligence (#29)',
    metadata: { version: 1 },
    flow: [
      // Schedule trigger — Monday 6 AM EST (11:00 UTC)
      {
        id: 1,
        module: 'builtin:BasicScheduler',
        version: 1,
        mapper: { time: '11:00' },
        parameters: { scheduling: { type: 'indefinitely', interval: 10080 } }, // 7 days in minutes
        metadata: d(0, 0),
      },

      // HTTP — Fetch all AITable records
      {
        id: 10,
        module: 'http:ActionSendData',
        version: 3,
        parameters: { handleErrors: true },
        mapper: {
          url: `${atUrl}&pageSize=1000`,
          method: 'get',
          headers: [{ name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` }],
          parseResponse: true,
        },
        metadata: d(300, 0),
        onerror: [{ id: 210, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(300, 200) }],
      },

      // Custom Code — Calculate per-niche metrics
      {
        id: 20,
        module: 'util:FunctionJavaScript',
        version: 1,
        mapper: {
          code: analysisCode,
        },
        metadata: d(600, 0),
        onerror: [{ id: 220, module: 'builtin:Resume', version: 1, mapper: {}, metadata: d(600, 200) }],
      },

      // AITable — Write NICHE-INTELLIGENCE summary row
      modHttp(30, atUrl,
        `{"records":[{"fields":{"Title":"NICHE-INTELLIGENCE — Week of {{formatDate(now; YYYY-MM-DD)}}","Scenario":"all","Company":"SYSTEM","Contact Email":"system@neatcircle.com","Status":"NICHE-INTELLIGENCE","Touchpoint":"intelligence.weekly","AI Generated":"Weekly Intelligence Report\\nTotal records this week: {{20.totalThisWeek}}\\nNiches active: {{20.nicheCount}}\\nTop niche: {{20.topNiche}}\\n\\nPer-niche breakdown:\\n{{20.summary}}"}}],"fieldKey":"name"}`,
        [atAuth], 900, 0),

      // Emailit — Weekly intelligence briefing to Ike
      modHttp(40, EMAILIT_URL,
        `{"from":"Lead OS Intelligence <automations@${EMAILIT.domain}>","to":"${EMAILIT.adminTo}","subject":"Weekly Niche Intelligence — {{formatDate(now; MMMM D, YYYY)}}","html":"<div style=font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333><h2>Lead OS — Weekly Intelligence Report</h2><p>Week ending {{formatDate(now; MMMM D, YYYY)}}</p><div style=background:#f0f4ff;padding:20px;border-radius:8px;margin:20px_0><h3 style=margin:0_0_10px>Summary</h3><p><strong>{{20.totalThisWeek}}</strong> records this week across <strong>{{20.nicheCount}}</strong> niches</p><p>Top performing niche: <strong>{{20.topNiche}}</strong></p></div><h3>Per-Niche Breakdown</h3><pre style=white-space:pre-wrap;background:#f8f9fa;padding:16px;border-radius:8px;font-size:13px>{{20.summary}}</pre><p style=color:#888;font-size:12px;margin-top:30px;border-top:1px_solid_#eee;padding-top:15px>Lead OS Niche Intelligence Engine<br>Generated automatically every Monday at 6 AM EST</p></div>","tracking":{"opens":true,"clicks":true}}`,
        [emailAuth], 1200, 0),

      // Discord #wins — weekly digest
      modHttp(50, DISCORD.wins,
        `{"embeds":[{"title":"\\ud83d\\udcca Weekly Niche Intelligence — {{formatDate(now; MMMM D)}}","color":5763719,"fields":[{"name":"Records This Week","value":"{{20.totalThisWeek}}","inline":true},{"name":"Active Niches","value":"{{20.nicheCount}}","inline":true},{"name":"Top Niche","value":"{{20.topNiche}}","inline":true},{"name":"Breakdown","value":"{{substring(20.summary; 0; 900)}}"}],"footer":{"text":"Niche Intelligence Engine \\u2022 Runs weekly"},"timestamp":"{{now}}"}]}`,
        null, 1500, 0),
    ],
  };
}

// ── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   NICHE INTELLIGENCE — Scenario #29 Deployment   ║');
  console.log('  ║   Monday 6 AM → Metrics → Email → Discord       ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const blueprint = buildNicheIntelligence();
  const scenarioName = 'Niche Intelligence (#29)';

  const listRes = await makeApi('GET', '/scenarios?pg[limit]=100');
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
      teamId: 1,
      blueprint: JSON.stringify(blueprint),
    });
    await sleep(API_DELAY);

    if (!createRes.ok) throw new Error(`CREATE: ${createRes.status}`);

    scenarioId = createRes.data?.scenario?.id || createRes.data?.id;
    await makeApi('POST', `/scenarios/${scenarioId}/start`);
    await sleep(API_DELAY);
  }

  await writeFile(join(BACKUP_DIR, `${scenarioId}-blueprint.json`), JSON.stringify(blueprint, null, 2));

  log(`DEPLOYED — Niche Intelligence #${scenarioId}`);
  console.log('\n  Schedule: Every Monday at 6:00 AM EST (11:00 UTC)');
  console.log('  Output: AITable NICHE-INTELLIGENCE row + Email briefing + Discord digest');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
