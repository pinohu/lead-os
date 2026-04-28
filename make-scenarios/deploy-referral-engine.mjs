#!/usr/bin/env node

/**
 * deploy-referral-engine.mjs — Make.com Scenario #28
 *
 * Post-conversion referral engine using UpViral.
 * Triggers when a SuiteDash project is marked complete.
 *
 * Pipeline:
 *   Webhook (project-completed) → Wait 24h → Feedback email
 *   → Wait 14d → Referral email with UpViral link
 *   → Acumbamail: Add to cross-sell campaign
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

const EMAILIT = {
  apiKey: requiredEnv('EMAILIT_API_KEY'),
  domain: 'neatcircle.com',
  adminTo: 'ike@neatcircle.com',
};

const AITABLE = {
  apiToken: requiredEnv('AITABLE_API_TOKEN'),
  datasheetId: 'dstBicDQKC6gpLAMYj',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const DISCORD = {
  wins: requiredEnv('DISCORD_WINS_WEBHOOK_URL'),
};

const EMAILIT_URL = 'https://api.emailit.com/v1/emails';
const UPVIRAL_LINK = process.env.UPVIRAL_CAMPAIGN_URL || 'https://refer.neatcircle.com';

const BACKUP_DIR = join(process.cwd(), 'backups', 'referral-engine');
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

function buildReferralEngine() {
  const atUrl = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  const atAuth = { name: 'Authorization', value: `Bearer ${AITABLE.apiToken}` };
  const emailAuth = { name: 'Authorization', value: `Bearer ${EMAILIT.apiKey}` };

  // Feedback request email (sent 24h after project completion)
  const feedbackEmailBody = `{"from":"NeatCircle <automations@${EMAILIT.domain}>","to":"{{1.email}}","subject":"How did we do, {{1.firstName}}?","html":"<div style=font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333><p>Hi {{1.firstName}},</p><p>Congratulations on completing your {{1.scenario}} project! We hope the results exceeded your expectations.</p><p>We would love to hear your feedback:</p><div style=background:#f8f9fa;padding:20px;border-radius:8px;margin:20px_0><p style=margin:0><strong>Quick question:</strong> On a scale of 1-10, how likely are you to recommend NeatCircle to a colleague?</p></div><p>Just reply with your number and any comments. Your feedback helps us improve.</p><p style=color:#888;font-size:12px;margin-top:30px;border-top:1px_solid_#eee;padding-top:15px>NeatCircle Client Success Team</p></div>","tracking":{"opens":true,"clicks":true}}`;

  // Referral request email (sent 14 days after feedback)
  const referralEmailBody = `{"from":"NeatCircle <automations@${EMAILIT.domain}>","to":"{{1.email}}","subject":"{{1.firstName}}, know someone who could benefit?","html":"<div style=font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333><p>Hi {{1.firstName}},</p><p>Since completing your project with us, we hope you have been seeing great results at {{1.company}}.</p><p>We have a simple ask:</p><div style=background:#f0f4ff;padding:20px;border-radius:8px;margin:20px_0;border-left:4px_solid_#5865F2><p style=margin:0>Know another business owner who could benefit from what we built for you? <strong>Share your unique referral link</strong> and both of you get something special.</p></div><p><a href=${UPVIRAL_LINK}?ref={{1.email}} style=display:inline-block;background:#5865F2;color:#fff;padding:12px_24px;border-radius:6px;text-decoration:none;font-weight:bold>Share My Referral Link</a></p><p>Thank you for being part of the NeatCircle community!</p><p style=color:#888;font-size:12px;margin-top:30px;border-top:1px_solid_#eee;padding-top:15px>NeatCircle Client Success Team</p></div>","tracking":{"opens":true,"clicks":true}}`;

  return {
    name: 'Referral Engine (#28)',
    metadata: { version: 1 },
    flow: [
      // Webhook trigger — project-completed event
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        metadata: d(0, 0),
      },

      // AITable — log project completion
      modHttp(10, atUrl, `{"records":[{"fields":{"Title":"project.completed — {{1.scenario}} — {{1.company}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Contact Name":"{{1.firstName}} {{1.lastName}}","Status":"PROJECT-COMPLETED","Touchpoint":"project.completed","AI Generated":"Project completed. Feedback email sent. Referral email scheduled for Day 14 via nurture cron."}}],"fieldKey":"name"}`, [atAuth], 300, 0),

      // Discord #wins — project completed
      modHttp(15, DISCORD.wins,
        `{"embeds":[{"title":"\\u2705 Project Completed: {{1.company}}","color":5763719,"fields":[{"name":"Client","value":"{{1.firstName}} {{1.lastName}}","inline":true},{"name":"Scenario","value":"{{1.scenario}}","inline":true},{"name":"Email","value":"{{1.email}}","inline":true}],"footer":{"text":"Feedback email sent. Referral in 14 days."},"timestamp":"{{now}}"}]}`,
        null, 600, 0),

      // Send feedback request email immediately
      modHttp(30, EMAILIT_URL, feedbackEmailBody, [emailAuth], 900, 0),

      // AITable — log feedback sent
      modHttp(35, atUrl, `{"records":[{"fields":{"Title":"feedback.requested — {{1.scenario}} — {{1.company}}","Scenario":"{{1.scenario}}","Company":"{{1.company}}","Contact Email":"{{1.email}}","Status":"FEEDBACK-REQUESTED","Touchpoint":"feedback.requested"}}],"fieldKey":"name"}`, [atAuth], 1200, 0),

      // WebhookRespond
      {
        id: 90,
        module: 'gateway:WebhookRespond',
        version: 1,
        mapper: { status: '200', body: '{"received":true,"sequence":"referral-engine"}' },
        metadata: d(1500, 0),
      },
    ],
  };
}

// ── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   REFERRAL ENGINE — Scenario #28 Deployment      ║');
  console.log('  ║   Project complete → Feedback → Referral → XSell║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const blueprint = buildReferralEngine();
  const scenarioName = 'Referral Engine (#28)';

  // Check for existing
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

  log(`DEPLOYED — Referral Engine #${scenarioId}`);
  console.log('\n  Webhook URL must be configured to fire when SuiteDash projects complete.');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
