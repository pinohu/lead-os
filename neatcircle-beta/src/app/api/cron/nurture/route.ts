import { NextResponse } from "next/server";

// ── Config (env vars for secrets) ──

const EMAILIT = {
  apiKey: process.env.EMAILIT_API_KEY ?? "",
  apiBase: "https://api.emailit.com/v1",
  domain: "neatcircle.com",
  adminTo: "ike@neatcircle.com",
};

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? "",
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? "dstBicDQKC6gpLAMYj",
  apiBase: "https://aitable.ai/fusion/v1",
};

const WBIZTOOL = {
  apiKey: process.env.WBIZTOOL_API_KEY ?? "",
  instanceId: process.env.WBIZTOOL_INSTANCE_ID ?? "12316",
  apiBase: "https://app.wbiztool.com/api",
};

const DISCORD = {
  newLeads: process.env.DISCORD_NEW_LEADS_WEBHOOK ?? "",
  errors: process.env.DISCORD_ERRORS_WEBHOOK ?? "",
};

const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  newLeads: process.env.TELEGRAM_NEW_LEADS_CHAT ?? "",
};

// ── Advisor personas (must match V10 deploy-advanced-scenarios.mjs) ──

interface Advisor {
  name: string;
  title: string;
}

const ADVISORS: Record<string, Advisor> = {
  onboarding: { name: "Sarah Chen", title: "Onboarding Specialist" },
  strategy: { name: "James Park", title: "Strategy Consultant" },
  compliance: { name: "Dr. Maya Patel", title: "Compliance Director" },
  analytics: { name: "Alex Thompson", title: "Analytics Advisor" },
  solutions: { name: "Marcus Rivera", title: "Solutions Architect" },
  legal: { name: "Victoria Santos", title: "Legal Technology Advisor" },
  industry: { name: "David Mitchell", title: "Industry Specialist" },
  franchise: { name: "Elena Vasquez", title: "Franchise Systems Advisor" },
  workforce: { name: "Rachel Kim", title: "Workforce Solutions Advisor" },
  community: { name: "Michael Thompson", title: "Community Engagement Advisor" },
  creative: { name: "Zara Williams", title: "Creator Economy Specialist" },
};

const SCENARIO_ADVISOR_MAP: Record<string, Advisor> = {
  "yd-portal-setup": ADVISORS.onboarding,
  "yd-crm-pipeline": ADVISORS.strategy,
  "yd-onboarding": ADVISORS.onboarding,
  "yd-compliance-training": ADVISORS.compliance,
  "yd-business-intelligence": ADVISORS.analytics,
  "yd-managed-services": ADVISORS.solutions,
  "nc-client-portal": ADVISORS.onboarding,
  "nc-process-automation": ADVISORS.solutions,
  "nc-systems-integration": ADVISORS.solutions,
  "nc-training-platform": ADVISORS.compliance,
  "nc-business-intelligence": ADVISORS.analytics,
  "nc-compliance-training": ADVISORS.compliance,
  "nc-managed-services": ADVISORS.solutions,
  "nc-digital-transformation": ADVISORS.solutions,
  "nc-re-syndication": ADVISORS.legal,
  "nc-immigration-law": ADVISORS.legal,
  "nc-construction": ADVISORS.industry,
  "nc-franchise": ADVISORS.franchise,
  "nc-staffing": ADVISORS.workforce,
  "nc-church-management": ADVISORS.community,
  "nc-creator-management": ADVISORS.creative,
  "nc-compliance-productized": ADVISORS.compliance,
};

// ── Journey stages ──

interface Stage {
  id: number;
  name: string;
  day: number;
  label: string;
  channels: ("email" | "whatsapp")[];
}

const STAGES: Stage[] = [
  { id: 1, name: "value_delivery", day: 2, label: "Value Delivery", channels: ["email"] },
  { id: 2, name: "micro_engagement", day: 5, label: "Micro-Engagement", channels: ["email", "whatsapp"] },
  { id: 3, name: "strategic_positioning", day: 10, label: "Strategic Positioning", channels: ["email"] },
  { id: 4, name: "consultation_offer", day: 14, label: "Consultation Offer", channels: ["email", "whatsapp"] },
  { id: 5, name: "final_touch", day: 21, label: "Final Touch", channels: ["email"] },
  { id: 6, name: "long_term_nurture", day: 30, label: "Long-term Nurture", channels: ["email"] },
];

// ── Types ──

interface Lead {
  email: string;
  contactName: string;
  company: string;
  scenario: string;
  status: string;
  aiGenerated: string;
  phone: string;
  intakeDate: Date;
  lastTouchpoint: string;
  lastStageNum: number;
  touchpointCount: number;
  recordId: string;
  advisor: Advisor;
  brand: string;
  intentScore: number;
}

interface AITableRecord {
  recordId: string;
  createdAt?: string;
  fields?: Record<string, string>;
}

// ── HTTP helper ──

async function httpJson(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; ok: boolean; data: unknown }> {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: (err as Error).message };
  }
}

// ── AITable API ──

async function aitableGet(params = "") {
  const url = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name${params}`;
  return httpJson("GET", url, undefined, { Authorization: `Bearer ${AITABLE.apiToken}` });
}

async function aitableCreate(fields: Record<string, string>) {
  const url = `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`;
  return httpJson("POST", url, { records: [{ fields }], fieldKey: "name" }, {
    Authorization: `Bearer ${AITABLE.apiToken}`,
  });
}

// ── Send email (Emailit direct with tracking) ──

async function sendEmail(to: string, subject: string, html: string, fromName: string) {
  const from = `${fromName} <automations@${EMAILIT.domain}>`;
  return httpJson("POST", `${EMAILIT.apiBase}/emails`, { from, to, subject, html, tracking: { opens: true, clicks: true } }, {
    Authorization: `Bearer ${EMAILIT.apiKey}`,
  });
}

// ── Send WhatsApp ──

async function sendWhatsApp(phone: string, message: string) {
  if (!phone) return { ok: false, data: "No phone number", status: 0 };
  const cleaned = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
  return httpJson("POST", `${WBIZTOOL.apiBase}/send`, {
    instance_id: WBIZTOOL.instanceId,
    to: cleaned,
    type: "text",
    body: message,
  }, { apikey: WBIZTOOL.apiKey });
}

// ── Discord embed ──

async function discordEmbed(webhookUrl: string, embed: Record<string, unknown>) {
  if (!webhookUrl) return { ok: false, data: "No webhook URL", status: 0 };
  return httpJson("POST", webhookUrl, { embeds: [embed] });
}

// ── Telegram ──

async function telegramSend(chatId: string, text: string) {
  if (!TELEGRAM.botToken || !chatId) return { ok: false, data: "No Telegram config", status: 0 };
  const url = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
  return httpJson("POST", url, { chat_id: chatId, parse_mode: "HTML", text });
}

// ── Email templates ──

function emailTemplate(stage: Stage, lead: Lead) {
  const firstName = lead.contactName?.split(" ")[0] || "there";
  const { company, advisor, brand, aiGenerated } = lead;
  const advName = advisor.name;
  const advTitle = advisor.title;
  const insight = (aiGenerated || "").slice(0, 300);

  const footer = `<p style="color:#888;font-size:12px;margin-top:30px;border-top:1px solid #eee;padding-top:15px;">${advName}<br>${advTitle}, ${brand}<br><em>This is a personal message, not an automated email.</em></p>`;

  const templates: Record<string, { subject: string; html: string }> = {
    value_delivery: {
      subject: `${firstName}, found something relevant for ${company}`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>Hi ${firstName},</p><p>It's ${advName} again. Since we connected, I've been thinking about ${company} and wanted to share something.</p><p>Based on what I know about your situation:</p><blockquote style="border-left:3px solid #5865F2;padding-left:15px;color:#555;margin:20px 0;">${insight ? insight.split("\n")[0] : "Companies in your space are seeing 40-60% efficiency gains with the right automation stack."}</blockquote><p>I put together a quick mental model of where ${company} could see the fastest wins. Three areas jumped out:</p><ol><li><strong>Process bottlenecks</strong> — The repetitive tasks that eat 10+ hours/week</li><li><strong>Client communication gaps</strong> — Where leads or clients fall through cracks</li><li><strong>Data silos</strong> — Information trapped in spreadsheets or inboxes</li></ol><p>Would any of these resonate? I'd love to hear which one feels most urgent for ${company}.</p><p>No agenda — just genuinely curious about your workflow.</p>${footer}</div>`,
    },
    micro_engagement: {
      subject: `Quick question about ${company}, ${firstName}`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>Hi ${firstName},</p><p>Quick one — I was reviewing some notes and had a thought about ${company}.</p><p>If you could wave a magic wand and fix ONE thing about how ${company} handles its day-to-day operations, what would it be?</p><ul style="list-style:none;padding:0;"><li style="padding:8px 0;">&#x1f504; <strong>Repetitive manual tasks</strong> that should be automated</li><li style="padding:8px 0;">&#x1f4ca; <strong>Reporting and visibility</strong> into what's actually happening</li><li style="padding:8px 0;">&#x1f91d; <strong>Client/customer experience</strong> that feels outdated</li><li style="padding:8px 0;">&#x1f4f1; <strong>Team coordination</strong> across locations or departments</li></ul><p>Just reply with the emoji — or tell me something else entirely. I find that the answer to this question usually reveals the highest-ROI starting point.</p>${footer}</div>`,
    },
    strategic_positioning: {
      subject: `${company} — what companies like yours are doing differently`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>${firstName},</p><p>I've been working with companies similar to ${company} lately, and there's a pattern I keep seeing.</p><p>The ones growing fastest aren't doing anything revolutionary — they're just <strong>removing friction</strong> from three specific areas:</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;"><p style="margin:0 0 10px;"><strong>1. First-touch to follow-up:</strong> Under 5 minutes (most companies take 24-48 hours)</p><p style="margin:0 0 10px;"><strong>2. Proposal to signed contract:</strong> Under 48 hours (most take 1-2 weeks)</p><p style="margin:0;"><strong>3. Onboarding to first value:</strong> Under 7 days (most take 30+)</p></div><p>The companies hitting all three are seeing <strong>2-3x conversion rates</strong> compared to industry averages.</p><p>I've mapped out how ${company} could implement each of these. It's specific to your setup — not generic advice.</p><p>Want me to walk you through it? 15 minutes on a call, and I'll show you exactly what I mean.</p>${footer}</div>`,
    },
    consultation_offer: {
      subject: `${firstName}, I have a specific idea for ${company}`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>Hi ${firstName},</p><p>I've been sitting on an idea for ${company} for about a week now, and I think it's worth sharing.</p><p>Without getting into too much detail over email, here's the short version:</p><div style="background:#f0f4ff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #5865F2;"><p style="margin:0;">I believe ${company} is leaving <strong>significant revenue on the table</strong> with its current operational setup. Based on what I've seen from similar companies, there's a path to recovering that — and it doesn't require a massive overhaul.</p></div><p>I'd love to show you the specifics in a 20-minute call. No pitch, no pressure — just a concrete walkthrough of what I see and how to capture it.</p><p><strong>Would this Thursday or Friday work?</strong> Morning or afternoon — I'll make it fit.</p><p>If now's not the right time, just say so — I won't follow up again unless you want me to.</p>${footer}</div>`,
    },
    final_touch: {
      subject: `Last note from me, ${firstName}`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>Hi ${firstName},</p><p>I know you're busy, so I'll keep this brief.</p><p>I've reached out a few times about some ideas for ${company}. If the timing isn't right, I completely understand — these things have a way of working out when they're supposed to.</p><p>I'm going to move your file to my "check back later" list. But before I do, I wanted to leave you with one thing:</p><div style="background:#fff8f0;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;"><p style="margin:0;">The single highest-impact thing ${company} could do right now is <strong>automate your lead follow-up</strong>. Companies that respond to inquiries within 5 minutes are <strong>21x more likely</strong> to qualify the lead. Most respond in 42 hours.</p></div><p>If you ever want to explore this — or anything else — just reply to this email. I'll be here.</p><p>Wishing ${company} continued success.</p>${footer}</div>`,
    },
    long_term_nurture: {
      subject: `${firstName}, quick update worth seeing`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;"><p>Hi ${firstName},</p><p>${advName} here — it's been a while since we connected.</p><p>I wanted to share a quick win from a company similar to ${company}:</p><div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #22c55e;"><p style="margin:0;">They automated their client intake and follow-up process and saw a <strong>47% increase in conversion rate</strong> within the first 60 days. Total setup time was under 2 weeks.</p></div><p>If the timing is better now, I'd love to reconnect and see if there's something here for ${company}.</p><p>Either way — hope business is going well.</p>${footer}</div>`,
    },
  };

  return templates[stage.name] ?? templates.value_delivery;
}

// ── WhatsApp templates ──

function whatsappTemplate(stage: Stage, lead: Lead): string | null {
  const firstName = lead.contactName?.split(" ")[0] || "Hi";
  const advName = lead.advisor.name;

  const templates: Record<string, string> = {
    micro_engagement: `Hey ${firstName}, it's ${advName} from ${lead.brand}. Quick question — if you could fix ONE thing about ${lead.company}'s daily operations, what would it be? No sales pitch, genuinely curious.`,
    consultation_offer: `Hi ${firstName}, ${advName} here from ${lead.brand}. I've been thinking about ${lead.company} and have a specific idea I'd love to share — just 15 minutes. Would a quick call this week work?`,
  };

  return templates[stage.name] ?? null;
}

// ── Lead parsing ──

function parseLeads(records: AITableRecord[]): Lead[] {
  const leadMap = new Map<string, Lead>();

  for (const rec of records) {
    const f = rec.fields ?? {};
    const email = f["Contact Email"];
    if (!email) continue;

    const existing = leadMap.get(email);
    const createdAt = new Date(rec.createdAt ?? f["Timestamp"] ?? Date.now());
    const touchpoint = f["Touchpoint"] || "intake";
    const stageNum = STAGES.findIndex((s) => s.name === touchpoint);

    if (!existing || createdAt < existing.intakeDate) {
      leadMap.set(email, {
        email,
        contactName: f["Contact Name"] || "",
        company: f["Company"] || "",
        scenario: f["Scenario"] || "",
        status: f["Status"] || "",
        aiGenerated: f["AI Generated"] || "",
        phone: f["Phone"] || "",
        intakeDate: existing?.intakeDate && existing.intakeDate < createdAt ? existing.intakeDate : createdAt,
        lastTouchpoint: existing?.lastTouchpoint || touchpoint,
        lastStageNum: existing?.lastStageNum ?? -1,
        touchpointCount: (existing?.touchpointCount || 0) + 1,
        recordId: rec.recordId,
        advisor: ADVISORS.onboarding,
        brand: "NeatCircle",
        intentScore: 0,
      });
    }

    const lead = leadMap.get(email)!;
    if (stageNum > lead.lastStageNum) {
      lead.lastStageNum = stageNum;
      lead.lastTouchpoint = touchpoint;
    }
    lead.touchpointCount = (lead.touchpointCount || 0) + 1;
  }

  return [...leadMap.values()];
}

// ── Stage determination ──

function daysBetween(d1: Date, d2: Date) {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function determineNextStage(lead: Lead): Stage | null {
  const now = new Date();
  const daysSinceIntake = daysBetween(lead.intakeDate, now);

  for (const stage of STAGES) {
    if (stage.id <= lead.lastStageNum + 1) continue;
    if (daysSinceIntake >= stage.day) return stage;
  }
  return null;
}

// ── Score-triggered consultation fast-track (Phase 4.1) ──

function checkScoreFastTrack(lead: Lead): Stage | null {
  if (lead.intentScore >= 50) {
    const consultationAlreadySent = lead.lastStageNum >= 3;
    if (!consultationAlreadySent) {
      return STAGES.find((s) => s.name === "consultation_offer") ?? null;
    }
  }
  return null;
}

// ── Main handler ──

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: string[] = [];
  const log = (msg: string) => logs.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

  try {
    log("Fetching leads from AITable...");

    // Step 1: Paginate all AITable records
    const allRecords: AITableRecord[] = [];
    let pageNum = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await aitableGet(`&pageSize=1000&pageNum=${pageNum}`);
      if (!res.ok) {
        log(`AITable fetch failed: ${res.status}`);
        return NextResponse.json({ error: "AITable fetch failed", logs }, { status: 502 });
      }
      const data = res.data as { data?: { records?: AITableRecord[] } };
      const records = data?.data?.records ?? [];
      allRecords.push(...records);
      hasMore = records.length === 1000;
      pageNum++;
    }

    log(`Fetched ${allRecords.length} total records`);

    // Step 2: Filter SUCCESS, parse leads
    const successRecords = allRecords.filter(
      (r) => (r.fields?.["Status"] || "") === "SUCCESS",
    );
    const leads = parseLeads(successRecords);
    log(`${leads.length} unique leads from ${successRecords.length} SUCCESS records`);

    // Step 3: Determine who needs follow-up
    const now = new Date();
    const actionable: { lead: Lead; stage: Stage; daysSince: number }[] = [];

    for (const lead of leads) {
      lead.advisor = SCENARIO_ADVISOR_MAP[lead.scenario] || ADVISORS.onboarding;
      lead.brand = lead.scenario.startsWith("yd-") ? "Your Deputy" : "NeatCircle";

      // Phase 4.1: Score-based fast-track overrides day-based logic
      let nextStage = checkScoreFastTrack(lead);
      if (!nextStage) {
        nextStage = determineNextStage(lead);
      }

      if (nextStage) {
        actionable.push({ lead, stage: nextStage, daysSince: daysBetween(lead.intakeDate, now) });
      }
    }

    log(`${actionable.length} leads ready for follow-up`);

    if (actionable.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "No leads need follow-up", logs });
    }

    // Step 4: Process each actionable lead
    const results = { sent: 0, failed: 0, whatsapp: 0, errors: [] as string[] };

    for (const { lead, stage, daysSince } of actionable) {
      log(`${lead.company} (${lead.email}) — ${stage.label} (Day ${daysSince})`);

      try {
        // Send email
        if (stage.channels.includes("email")) {
          const tmpl = emailTemplate(stage, lead);
          const fromName = `${lead.advisor.name} via ${lead.brand}`;
          const emailRes = await sendEmail(lead.email, tmpl.subject, tmpl.html, fromName);
          log(emailRes.ok ? `  Email sent: "${tmpl.subject}"` : `  Email failed: ${emailRes.status}`);
        }

        // Send WhatsApp
        if (stage.channels.includes("whatsapp") && lead.phone) {
          const waMsg = whatsappTemplate(stage, lead);
          if (waMsg) {
            const waRes = await sendWhatsApp(lead.phone, waMsg);
            if (waRes.ok) results.whatsapp++;
            log(waRes.ok ? `  WhatsApp sent to ${lead.phone}` : `  WhatsApp failed: ${waRes.status}`);
          }
        }

        // Log to AITable
        await aitableCreate({
          Title: `${stage.label} — ${lead.scenario} — ${lead.company}`,
          Scenario: lead.scenario,
          Company: lead.company,
          "Contact Email": lead.email,
          "Contact Name": lead.contactName,
          Status: `NURTURE-${stage.name.toUpperCase()}`,
          Touchpoint: stage.name,
          "AI Generated": `Stage ${stage.id}: ${stage.label} (Day ${daysSince}). Advisor: ${lead.advisor.name}. Channels: ${stage.channels.join(", ")}.`,
        });

        // Discord notification
        await discordEmbed(DISCORD.newLeads, {
          author: { name: `${lead.advisor.name} — Nurture Engine` },
          title: `Nurture ${stage.label}: ${lead.company}`,
          color: [0, 0x3498db, 0x2ecc71, 0xe67e22, 0xe74c3c, 0x9b59b6, 0x1abc9c][stage.id] || 0x3498db,
          fields: [
            { name: "Contact", value: `${lead.contactName} (${lead.email})`, inline: true },
            { name: "Stage", value: `${stage.label} (Day ${daysSince})`, inline: true },
            { name: "Advisor", value: lead.advisor.name, inline: true },
            { name: "Channels", value: stage.channels.join(", "), inline: true },
          ],
          footer: { text: `Nurture Engine | ${lead.brand}` },
          timestamp: new Date().toISOString(),
        });

        // Telegram notification
        await telegramSend(
          TELEGRAM.newLeads,
          `<b>Nurture ${stage.label}: ${lead.company}</b>\n<b>Contact:</b> ${lead.contactName} (${lead.email})\n<b>Stage:</b> ${stage.label} (Day ${daysSince})\n<b>Advisor:</b> ${lead.advisor.name}`,
        );

        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${lead.email}: ${(err as Error).message}`);
        log(`  Error: ${(err as Error).message}`);

        await discordEmbed(DISCORD.errors, {
          title: `Nurture Error: ${lead.company}`,
          color: 0xe74c3c,
          fields: [
            { name: "Lead", value: `${lead.contactName} (${lead.email})`, inline: true },
            { name: "Stage", value: stage.label, inline: true },
            { name: "Error", value: (err as Error).message.slice(0, 300) },
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 5: Admin summary email
    if (actionable.length > 0) {
      const rows = actionable
        .map(({ lead, stage, daysSince }) =>
          `<tr><td>${lead.company}</td><td>${lead.contactName}</td><td>${stage.label}</td><td>${daysSince}</td><td>${lead.advisor.name}</td></tr>`,
        )
        .join("");

      await sendEmail(
        EMAILIT.adminTo,
        `Nurture Engine: ${results.sent} follow-ups sent`,
        `<h2>Nurture Engine Run — ${new Date().toISOString().slice(0, 10)}</h2><p><strong>${results.sent}</strong> sent, <strong>${results.whatsapp}</strong> WhatsApp, <strong>${results.failed}</strong> failed.</p><table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:13px;"><tr style="background:#f0f0f0;"><th>Company</th><th>Contact</th><th>Stage</th><th>Day</th><th>Advisor</th></tr>${rows}</table>`,
        "AI Concierge System",
      );

      // Discord daily summary
      const stageBreakdown: Record<string, number> = {};
      for (const { stage } of actionable) {
        stageBreakdown[stage.label] = (stageBreakdown[stage.label] || 0) + 1;
      }

      await discordEmbed(DISCORD.newLeads, {
        title: "Nurture Engine — Daily Summary",
        color: 0x5865f2,
        fields: [
          { name: "Total Processed", value: `${results.sent + results.failed}`, inline: true },
          { name: "Emails Sent", value: `${results.sent}`, inline: true },
          { name: "WhatsApp Sent", value: `${results.whatsapp}`, inline: true },
          { name: "Stage Breakdown", value: Object.entries(stageBreakdown).map(([k, v]) => `${k}: ${v}`).join("\n") },
        ],
        footer: { text: "Runs daily at 9:00 AM EST" },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.sent + results.failed,
      sent: results.sent,
      whatsapp: results.whatsapp,
      failed: results.failed,
      errors: results.errors,
      logs,
    });
  } catch (err) {
    log(`Fatal: ${(err as Error).message}`);
    return NextResponse.json({ error: (err as Error).message, logs }, { status: 500 });
  }
}
