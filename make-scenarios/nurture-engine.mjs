#!/usr/bin/env node

/**
 * nurture-engine.mjs — AI Concierge Multi-Day Nurture System
 *
 * Extends V4 intake into a full 7-stage lead journey.
 * Reads leads from AITable, determines who needs follow-up,
 * sends personalized multi-channel messages, updates tracking.
 *
 * JOURNEY STAGES:
 *   0: Intake        (Day 0)  — handled by V4 Boost.space scenarios
 *   1: Value Delivery (Day 2)  — industry insight + resource
 *   2: Micro-Engage   (Day 5)  — quick question + helpful tip
 *   3: Positioning    (Day 10) — case study + ROI preview
 *   4: Consultation   (Day 14) — meeting invitation
 *   5: Final Touch    (Day 21) — personal note + last offer
 *   6: Long-term      (Day 30+)— monthly check-in
 *
 * CHANNELS: Emailit (email), WbizTool (WhatsApp), Discord + Telegram (team)
 *
 * Usage:
 *   node nurture-engine.mjs                    # Process all leads
 *   node nurture-engine.mjs --dry-run          # Preview without sending
 *   node nurture-engine.mjs --email=x@y.com    # Process single lead
 *   node nurture-engine.mjs --stage=2          # Force specific stage
 */

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

const EMAILIT = {
  apiKey: process.env.EMAILIT_API_KEY || '',
  apiBase: 'https://api.emailit.com/v1',
  domain: 'neatcircle.com',
  adminTo: 'ike@neatcircle.com',
};

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN || '',
  datasheetId: process.env.AITABLE_DATASHEET_ID || '',
  apiBase: 'https://aitable.ai/fusion/v1',
};

const WBIZTOOL = {
  apiKey: process.env.WBIZTOOL_API_KEY || '',
  instanceId: '12316',
  apiBase: 'https://app.wbiztool.com/api',
};

const DISCORD = {
  newLeads: process.env.DISCORD_WEBHOOK_NEW_LEADS || '',
  errors: process.env.DISCORD_WEBHOOK_ERRORS || '',
  wins: process.env.DISCORD_WEBHOOK_WINS || '',
  highValue: process.env.DISCORD_WEBHOOK_HIGH_VALUE || '',
};

const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  newLeads: process.env.TELEGRAM_CHAT_NEW_LEADS || '',
  errors: process.env.TELEGRAM_CHAT_ERRORS || '',
  wins: process.env.TELEGRAM_CHAT_WINS || '',
  highValue: process.env.TELEGRAM_CHAT_HIGH_VALUE || '',
};

// ════════════════════════════════════════════════════════════════
// ADVISOR PERSONAS (must match V4 deploy-advanced-scenarios.mjs)
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

const SCENARIO_ADVISOR_MAP = {
  'yd-portal-setup': ADVISORS.onboarding,
  'yd-crm-pipeline': ADVISORS.strategy,
  'yd-onboarding': ADVISORS.onboarding,
  'yd-compliance-training': ADVISORS.compliance,
  'yd-business-intelligence': ADVISORS.analytics,
  'yd-managed-services': ADVISORS.solutions,
  'nc-client-portal': ADVISORS.onboarding,
  'nc-process-automation': ADVISORS.solutions,
  'nc-systems-integration': ADVISORS.solutions,
  'nc-training-platform': ADVISORS.compliance,
  'nc-business-intelligence': ADVISORS.analytics,
  'nc-compliance-training': ADVISORS.compliance,
  'nc-managed-services': ADVISORS.solutions,
  'nc-digital-transformation': ADVISORS.solutions,
  'nc-re-syndication': ADVISORS.legal,
  'nc-immigration-law': ADVISORS.legal,
  'nc-construction': ADVISORS.industry,
  'nc-franchise': ADVISORS.franchise,
  'nc-staffing': ADVISORS.workforce,
  'nc-church-management': ADVISORS.community,
  'nc-creator-management': ADVISORS.creative,
  'nc-compliance-productized': ADVISORS.compliance,
};

const SCENARIO_BRAND_MAP = {};
for (const slug of Object.keys(SCENARIO_ADVISOR_MAP)) {
  SCENARIO_BRAND_MAP[slug] = slug.startsWith('yd-') ? 'Your Deputy' : 'NeatCircle';
}

// ════════════════════════════════════════════════════════════════
// JOURNEY STAGES
// ════════════════════════════════════════════════════════════════

const STAGES = [
  { id: 1, name: 'value_delivery',       day: 2,  label: 'Value Delivery',       channels: ['email'] },
  { id: 2, name: 'micro_engagement',     day: 5,  label: 'Micro-Engagement',     channels: ['email', 'whatsapp'] },
  { id: 3, name: 'strategic_positioning', day: 10, label: 'Strategic Positioning', channels: ['email'] },
  { id: 4, name: 'consultation_offer',   day: 14, label: 'Consultation Offer',   channels: ['email', 'whatsapp'] },
  { id: 5, name: 'final_touch',          day: 21, label: 'Final Touch',          channels: ['email'] },
  { id: 6, name: 'long_term_nurture',    day: 30, label: 'Long-term Nurture',    channels: ['email'] },
];

// ════════════════════════════════════════════════════════════════
// CLI ARGS
// ════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE_EMAIL = args.find(a => a.startsWith('--email='))?.split('=')[1];
const FORCE_STAGE = args.find(a => a.startsWith('--stage='))?.split('=')[1];

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const daysBetween = (d1, d2) => Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));

async function httpJson(method, url, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: err.message };
  }
}

// ════════════════════════════════════════════════════════════════
// AITABLE API
// ════════════════════════════════════════════════════════════════

async function aitableGet(params = '') {
  const url = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name${params}`;
  return httpJson('GET', url, null, { Authorization: `Bearer ${AITABLE.apiToken}` });
}

async function aitableCreate(fields) {
  const url = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  return httpJson('POST', url, { records: [{ fields }], fieldKey: 'name' }, {
    Authorization: `Bearer ${AITABLE.apiToken}`,
  });
}

async function aitableUpdate(recordId, fields) {
  const url = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  return httpJson('PATCH', url, { records: [{ recordId, fields }], fieldKey: 'name' }, {
    Authorization: `Bearer ${AITABLE.apiToken}`,
  });
}

// ════════════════════════════════════════════════════════════════
// EMAILIT API
// ════════════════════════════════════════════════════════════════

async function sendEmail(to, subject, html, fromName, fromAddr) {
  const from = fromAddr
    ? `${fromName} <${fromAddr}>`
    : `${fromName} <automations@${EMAILIT.domain}>`;
  return httpJson('POST', `${EMAILIT.apiBase}/emails`, { from, to, subject, html, tracking: { opens: true, clicks: true } }, {
    Authorization: `Bearer ${EMAILIT.apiKey}`,
  });
}

// ════════════════════════════════════════════════════════════════
// WBIZTOOL (WHATSAPP) API
// ════════════════════════════════════════════════════════════════

async function sendWhatsApp(phone, message) {
  if (!phone) return { ok: false, data: 'No phone number' };
  const cleaned = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  return httpJson('POST', `${WBIZTOOL.apiBase}/send`, {
    instance_id: WBIZTOOL.instanceId,
    to: cleaned,
    type: 'text',
    body: message,
  }, { apikey: WBIZTOOL.apiKey });
}

// ════════════════════════════════════════════════════════════════
// DISCORD NOTIFICATIONS
// ════════════════════════════════════════════════════════════════

async function discordEmbed(webhookUrl, embed) {
  return httpJson('POST', webhookUrl, { embeds: [embed] });
}

// ════════════════════════════════════════════════════════════════
// TELEGRAM NOTIFICATIONS
// ════════════════════════════════════════════════════════════════

async function telegramSend(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  return httpJson('POST', url, { chat_id: chatId, parse_mode: 'HTML', text });
}

// ════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES — Personalized HTML per journey stage
// ════════════════════════════════════════════════════════════════

function emailTemplate(stage, lead) {
  const { contactName, company, scenario, advisor, brand, aiGenerated } = lead;
  const firstName = contactName?.split(' ')[0] || 'there';
  const advName = advisor.name;
  const advTitle = advisor.title;

  // Extract key insight from the AI-generated intelligence (from V4 intake)
  const insight = (aiGenerated || '').slice(0, 300);

  const footer = `
    <p style="color:#888;font-size:12px;margin-top:30px;border-top:1px solid #eee;padding-top:15px;">
      ${advName}<br>${advTitle}, ${brand}<br>
      <em>This is a personal message, not an automated email.</em>
    </p>`;

  const templates = {
    // ── STAGE 1: Value Delivery (Day 2) ──
    value_delivery: {
      subject: `${firstName}, found something relevant for ${company}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>Hi ${firstName},</p>
          <p>It's ${advName} again. Since we connected, I've been thinking about ${company} and wanted to share something.</p>
          <p>Based on what I know about your situation:</p>
          <blockquote style="border-left:3px solid #5865F2;padding-left:15px;color:#555;margin:20px 0;">
            ${insight ? insight.split('\n')[0] : `Companies in your space are seeing 40-60% efficiency gains with the right automation stack.`}
          </blockquote>
          <p>I put together a quick mental model of where ${company} could see the fastest wins. Three areas jumped out:</p>
          <ol>
            <li><strong>Process bottlenecks</strong> — The repetitive tasks that eat 10+ hours/week</li>
            <li><strong>Client communication gaps</strong> — Where leads or clients fall through cracks</li>
            <li><strong>Data silos</strong> — Information trapped in spreadsheets or inboxes</li>
          </ol>
          <p>Would any of these resonate? I'd love to hear which one feels most urgent for ${company}.</p>
          <p>No agenda — just genuinely curious about your workflow.</p>
          ${footer}
        </div>`,
    },

    // ── STAGE 2: Micro-Engagement (Day 5) ──
    micro_engagement: {
      subject: `Quick question about ${company}, ${firstName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>Hi ${firstName},</p>
          <p>Quick one — I was reviewing some notes and had a thought about ${company}.</p>
          <p>If you could wave a magic wand and fix ONE thing about how ${company} handles its day-to-day operations, what would it be?</p>
          <ul style="list-style:none;padding:0;">
            <li style="padding:8px 0;">🔄 <strong>Repetitive manual tasks</strong> that should be automated</li>
            <li style="padding:8px 0;">📊 <strong>Reporting and visibility</strong> into what's actually happening</li>
            <li style="padding:8px 0;">🤝 <strong>Client/customer experience</strong> that feels outdated</li>
            <li style="padding:8px 0;">📱 <strong>Team coordination</strong> across locations or departments</li>
          </ul>
          <p>Just reply with the emoji — or tell me something else entirely. I find that the answer to this question usually reveals the highest-ROI starting point.</p>
          ${footer}
        </div>`,
    },

    // ── STAGE 3: Strategic Positioning (Day 10) ──
    strategic_positioning: {
      subject: `${company} — what companies like yours are doing differently`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>${firstName},</p>
          <p>I've been working with companies similar to ${company} lately, and there's a pattern I keep seeing.</p>
          <p>The ones growing fastest aren't doing anything revolutionary — they're just <strong>removing friction</strong> from three specific areas:</p>
          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>1. First-touch to follow-up:</strong> Under 5 minutes (most companies take 24-48 hours)</p>
            <p style="margin:0 0 10px;"><strong>2. Proposal to signed contract:</strong> Under 48 hours (most take 1-2 weeks)</p>
            <p style="margin:0;"><strong>3. Onboarding to first value:</strong> Under 7 days (most take 30+)</p>
          </div>
          <p>The companies hitting all three are seeing <strong>2-3x conversion rates</strong> compared to industry averages.</p>
          <p>I've mapped out how ${company} could implement each of these. It's specific to your setup — not generic advice.</p>
          <p>Want me to walk you through it? 15 minutes on a call, and I'll show you exactly what I mean.</p>
          ${footer}
        </div>`,
    },

    // ── STAGE 4: Consultation Offer (Day 14) ──
    consultation_offer: {
      subject: `${firstName}, I have a specific idea for ${company}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>Hi ${firstName},</p>
          <p>I've been sitting on an idea for ${company} for about a week now, and I think it's worth sharing.</p>
          <p>Without getting into too much detail over email, here's the short version:</p>
          <div style="background:#f0f4ff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #5865F2;">
            <p style="margin:0;">I believe ${company} is leaving <strong>significant revenue on the table</strong> with its current operational setup.
            Based on what I've seen from similar companies, there's a path to recovering that — and it doesn't require a massive overhaul.</p>
          </div>
          <p>I'd love to show you the specifics in a 20-minute call. No pitch, no pressure — just a concrete walkthrough of what I see and how to capture it.</p>
          <p><strong>Would this Thursday or Friday work?</strong> Morning or afternoon — I'll make it fit.</p>
          <p>If now's not the right time, just say so — I won't follow up again unless you want me to.</p>
          ${footer}
        </div>`,
    },

    // ── STAGE 5: Final Touch (Day 21) ──
    final_touch: {
      subject: `Last note from me, ${firstName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>Hi ${firstName},</p>
          <p>I know you're busy, so I'll keep this brief.</p>
          <p>I've reached out a few times about some ideas for ${company}. If the timing isn't right, I completely understand — these things have a way of working out when they're supposed to.</p>
          <p>I'm going to move your file to my "check back later" list. But before I do, I wanted to leave you with one thing:</p>
          <div style="background:#fff8f0;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
            <p style="margin:0;">The single highest-impact thing ${company} could do right now is <strong>automate your lead follow-up</strong>.
            Companies that respond to inquiries within 5 minutes are <strong>21x more likely</strong> to qualify the lead. Most respond in 42 hours.</p>
          </div>
          <p>If you ever want to explore this — or anything else — just reply to this email. I'll be here.</p>
          <p>Wishing ${company} continued success.</p>
          ${footer}
        </div>`,
    },

    // ── STAGE 6: Long-term Nurture (Day 30+) ──
    long_term_nurture: {
      subject: `${firstName}, quick update worth seeing`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
          <p>Hi ${firstName},</p>
          <p>${advName} here — it's been a while since we connected.</p>
          <p>I wanted to share a quick win from a company similar to ${company}:</p>
          <div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #22c55e;">
            <p style="margin:0;">They automated their client intake and follow-up process and saw a <strong>47% increase in conversion rate</strong> within the first 60 days.
            Total setup time was under 2 weeks.</p>
          </div>
          <p>If the timing is better now, I'd love to reconnect and see if there's something here for ${company}.</p>
          <p>Either way — hope business is going well.</p>
          ${footer}
        </div>`,
    },
  };

  return templates[stage.name] || templates.value_delivery;
}

// ════════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES
// ════════════════════════════════════════════════════════════════

function whatsappTemplate(stage, lead) {
  const firstName = lead.contactName?.split(' ')[0] || 'Hi';
  const advName = lead.advisor.name;

  const templates = {
    micro_engagement: `Hey ${firstName}, it's ${advName} from ${lead.brand}. 👋

Quick question — if you could fix ONE thing about ${lead.company}'s daily operations, what would it be?

No sales pitch, genuinely curious. Sometimes the answer reveals the biggest opportunity.`,

    consultation_offer: `Hi ${firstName}, ${advName} here from ${lead.brand}.

I've been thinking about ${lead.company} and have a specific idea I'd love to share — just 15 minutes.

Would a quick call this week work? I'll send calendar options if you're interested. 📅`,
  };

  return templates[stage.name] || null;
}

// ════════════════════════════════════════════════════════════════
// LEAD PROCESSING
// ════════════════════════════════════════════════════════════════

function parseLeads(records) {
  const leadMap = new Map();

  for (const rec of records) {
    const f = rec.fields || {};
    const email = f['Contact Email'];
    if (!email) continue;

    const existing = leadMap.get(email);
    const createdAt = new Date(rec.createdAt || f['Timestamp'] || Date.now());
    const touchpoint = f['Touchpoint'] || 'intake';
    const stageNum = STAGES.findIndex(s => s.name === touchpoint);

    if (!existing || createdAt < existing.intakeDate) {
      leadMap.set(email, {
        email,
        contactName: f['Contact Name'] || '',
        company: f['Company'] || '',
        scenario: f['Scenario'] || '',
        status: f['Status'] || '',
        aiGenerated: f['AI Generated'] || '',
        phone: f['Phone'] || '',
        intakeDate: existing?.intakeDate && existing.intakeDate < createdAt ? existing.intakeDate : createdAt,
        lastTouchpoint: existing?.lastTouchpoint || touchpoint,
        lastStageNum: existing?.lastStageNum ?? -1,
        touchpointCount: (existing?.touchpointCount || 0) + 1,
        recordId: rec.recordId,
        records: [...(existing?.records || []), rec],
      });
    }

    // Track the highest stage reached
    const lead = leadMap.get(email);
    if (stageNum > lead.lastStageNum) {
      lead.lastStageNum = stageNum;
      lead.lastTouchpoint = touchpoint;
    }
    if (!lead.records.includes(rec)) lead.records.push(rec);
  }

  return [...leadMap.values()];
}

function determineNextStage(lead) {
  const now = new Date();
  const daysSinceIntake = daysBetween(lead.intakeDate, now);
  const currentStageIdx = lead.lastStageNum;

  // Find the next stage that's due
  for (const stage of STAGES) {
    if (stage.id <= currentStageIdx + 1) continue; // Already past this stage
    if (daysSinceIntake >= stage.day) return stage;
  }

  return null; // No stage due yet
}

// ════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   AI CONCIERGE — Nurture Engine                  ║');
  console.log('  ║   Multi-Day Lead Journey Orchestrator            ║');
  console.log(`  ║   ${DRY_RUN ? '🔍 DRY RUN MODE' : '🚀 LIVE MODE'}                                  ║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── Step 1: Fetch all leads from AITable ──
  log('Fetching leads from AITable...');
  let allRecords = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await aitableGet(`&pageSize=1000&pageNum=${pageNum}`);
    if (!res.ok) {
      console.error(`AITable fetch failed: ${res.status} — ${JSON.stringify(res.data).slice(0, 300)}`);
      process.exit(1);
    }
    const records = res.data?.data?.records || [];
    allRecords.push(...records);
    hasMore = records.length === 1000;
    pageNum++;
    await sleep(200);
  }

  log(`  Fetched ${allRecords.length} total records`);

  // ── Step 2: Parse and deduplicate leads ──
  const successRecords = allRecords.filter(r => (r.fields?.Status || '') === 'SUCCESS');
  log(`  ${successRecords.length} SUCCESS records`);

  const leads = parseLeads(successRecords);
  log(`  ${leads.length} unique leads`);

  // ── Step 3: Filter leads needing follow-up ──
  const actionable = [];
  const now = new Date();

  for (const lead of leads) {
    // Apply email filter if specified
    if (FORCE_EMAIL && lead.email !== FORCE_EMAIL) continue;

    // Resolve advisor for this lead
    lead.advisor = SCENARIO_ADVISOR_MAP[lead.scenario] || ADVISORS.onboarding;
    lead.brand = SCENARIO_BRAND_MAP[lead.scenario] || 'NeatCircle';

    // Determine next stage
    let nextStage;
    if (FORCE_STAGE) {
      nextStage = STAGES.find(s => s.name === FORCE_STAGE || String(s.id) === FORCE_STAGE);
    } else {
      nextStage = determineNextStage(lead);
    }

    if (nextStage) {
      const daysSince = daysBetween(lead.intakeDate, now);
      actionable.push({ lead, stage: nextStage, daysSince });
    }
  }

  log(`  ${actionable.length} leads ready for follow-up`);

  if (actionable.length === 0) {
    log('\nNo leads need follow-up today. All caught up.');
    return;
  }

  // ── Step 4: Process each lead ──
  const results = { sent: 0, failed: 0, whatsapp: 0, errors: [] };

  for (const { lead, stage, daysSince } of actionable) {
    log(`\n━━━ ${lead.company} (${lead.email}) — Stage: ${stage.label} (Day ${daysSince}) ━━━`);
    log(`  Advisor: ${lead.advisor.name} | Brand: ${lead.brand} | Scenario: ${lead.scenario}`);

    if (DRY_RUN) {
      log(`  [DRY RUN] Would send ${stage.channels.join(', ')} to ${lead.email}`);
      results.sent++;
      continue;
    }

    try {
      // ── Send Email ──
      if (stage.channels.includes('email')) {
        const tmpl = emailTemplate(stage, lead);
        const fromName = `${lead.advisor.name} via ${lead.brand}`;
        const emailRes = await sendEmail(lead.email, tmpl.subject, tmpl.html, fromName);
        if (emailRes.ok) {
          log(`  ✓ Email sent: "${tmpl.subject}"`);
        } else {
          log(`  ✗ Email failed: ${emailRes.status} — ${JSON.stringify(emailRes.data).slice(0, 200)}`);
        }
        await sleep(300);
      }

      // ── Send WhatsApp ──
      if (stage.channels.includes('whatsapp') && lead.phone) {
        const waMsg = whatsappTemplate(stage, lead);
        if (waMsg) {
          const waRes = await sendWhatsApp(lead.phone, waMsg);
          if (waRes.ok) {
            log(`  ✓ WhatsApp sent to ${lead.phone}`);
            results.whatsapp++;
          } else {
            log(`  ⚠ WhatsApp: ${waRes.status} — ${JSON.stringify(waRes.data).slice(0, 150)}`);
          }
          await sleep(300);
        }
      }

      // ── Log to AITable ──
      const atRes = await aitableCreate({
        Title: `${stage.label} — ${lead.scenario} — ${lead.company}`,
        Scenario: lead.scenario,
        Company: lead.company,
        'Contact Email': lead.email,
        'Contact Name': lead.contactName,
        Status: `NURTURE-${stage.name.toUpperCase()}`,
        Touchpoint: stage.name,
        'AI Generated': `Stage ${stage.id}: ${stage.label} (Day ${daysSince}). Advisor: ${lead.advisor.name}. Channels: ${stage.channels.join(', ')}.`,
      });
      if (atRes.ok) {
        log(`  ✓ AITable logged`);
      } else {
        log(`  ⚠ AITable: ${atRes.status}`);
      }
      await sleep(200);

      // ── Discord notification ──
      const embed = {
        author: { name: `${lead.advisor.name} — Nurture Engine` },
        title: `📬 ${stage.label}: ${lead.company}`,
        color: [0, 0x3498db, 0x2ecc71, 0xe67e22, 0xe74c3c, 0x9b59b6, 0x1abc9c][stage.id] || 0x3498db,
        fields: [
          { name: 'Contact', value: `${lead.contactName} (${lead.email})`, inline: true },
          { name: 'Stage', value: `${stage.label} (Day ${daysSince})`, inline: true },
          { name: 'Advisor', value: lead.advisor.name, inline: true },
          { name: 'Channels', value: stage.channels.join(', '), inline: true },
          { name: 'Scenario', value: lead.scenario, inline: true },
        ],
        footer: { text: `Nurture Engine • ${lead.brand}` },
        timestamp: new Date().toISOString(),
      };
      await discordEmbed(DISCORD.newLeads, embed);
      await sleep(200);

      // ── Telegram notification ──
      const tgText = [
        `📬 <b>${stage.label}: ${lead.company}</b>`,
        `<b>Contact:</b> ${lead.contactName} (${lead.email})`,
        `<b>Stage:</b> ${stage.label} (Day ${daysSince})`,
        `<b>Advisor:</b> ${lead.advisor.name}`,
        `<b>Channels:</b> ${stage.channels.join(', ')}`,
      ].join('\n');
      await telegramSend(TELEGRAM.newLeads, tgText);
      await sleep(200);

      results.sent++;
      log(`  ✓ Complete — ${stage.label} delivered`);

    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      results.failed++;
      results.errors.push({ email: lead.email, company: lead.company, error: err.message });

      // Error notifications
      try {
        await discordEmbed(DISCORD.errors, {
          title: `❌ Nurture Error: ${lead.company}`,
          color: 0xe74c3c,
          fields: [
            { name: 'Lead', value: `${lead.contactName} (${lead.email})`, inline: true },
            { name: 'Stage', value: stage.label, inline: true },
            { name: 'Error', value: err.message.slice(0, 300) },
          ],
          timestamp: new Date().toISOString(),
        });
      } catch {}
    }
  }

  // ── Step 5: Admin Summary ──
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   NURTURE ENGINE — RUN SUMMARY                  ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log(`  Processed: ${results.sent + results.failed}/${actionable.length} leads`);
  console.log(`  Emails:    ${results.sent} sent`);
  console.log(`  WhatsApp:  ${results.whatsapp} sent`);
  console.log(`  Failed:    ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n  Errors:');
    results.errors.forEach(e => console.log(`    ${e.email} (${e.company}): ${e.error}`));
  }

  // ── Admin email summary ──
  if (!DRY_RUN && actionable.length > 0) {
    const summaryHtml = `
      <h2>Nurture Engine Run — ${new Date().toISOString().slice(0, 10)}</h2>
      <p><strong>${results.sent}</strong> follow-ups sent, <strong>${results.whatsapp}</strong> WhatsApp messages, <strong>${results.failed}</strong> failed.</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:13px;">
        <tr style="background:#f0f0f0;"><th>Company</th><th>Contact</th><th>Stage</th><th>Day</th><th>Advisor</th></tr>
        ${actionable.map(({ lead, stage, daysSince }) =>
          `<tr><td>${lead.company}</td><td>${lead.contactName}</td><td>${stage.label}</td><td>${daysSince}</td><td>${lead.advisor.name}</td></tr>`
        ).join('')}
      </table>`;

    await sendEmail(EMAILIT.adminTo, `Nurture Engine: ${results.sent} follow-ups sent`, summaryHtml, 'AI Concierge System');
    log('\n  Admin summary email sent to ' + EMAILIT.adminTo);
  }

  // ── Discord summary ──
  if (!DRY_RUN && actionable.length > 0) {
    const stageBreakdown = {};
    for (const { stage } of actionable) {
      stageBreakdown[stage.label] = (stageBreakdown[stage.label] || 0) + 1;
    }

    await discordEmbed(DISCORD.newLeads, {
      title: '📊 Nurture Engine — Daily Summary',
      color: 0x5865F2,
      fields: [
        { name: 'Total Processed', value: `${results.sent + results.failed}`, inline: true },
        { name: 'Emails Sent', value: `${results.sent}`, inline: true },
        { name: 'WhatsApp Sent', value: `${results.whatsapp}`, inline: true },
        { name: 'Stage Breakdown', value: Object.entries(stageBreakdown).map(([k, v]) => `${k}: ${v}`).join('\n') },
      ],
      footer: { text: 'Runs daily at 9:00 AM EST' },
      timestamp: new Date().toISOString(),
    });
  }

  console.log('\n  Done.');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
