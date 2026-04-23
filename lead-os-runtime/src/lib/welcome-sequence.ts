// ---------------------------------------------------------------------------
// Welcome Sequence — sends operators a 5-email onboarding sequence after signup
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WelcomeEmail {
  id: string;
  stepNumber: number;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  delayHours: number;
  purpose: string;
}

export interface WelcomeSequenceState {
  tenantId: string;
  email: string;
  brandName: string;
  startedAt: string;
  sentSteps: number[];
  nextStepDue?: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const sequenceStore = new Map<string, WelcomeSequenceState>();

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_welcome_sequences (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_welcome_sequences_tenant
          ON lead_os_welcome_sequences (tenant_id);

        CREATE INDEX IF NOT EXISTS idx_lead_os_welcome_sequences_next_step
          ON lead_os_welcome_sequences ((payload->>'nextStepDue'))
          WHERE payload->>'completedAt' IS NULL;
      `);
    } catch (err) {
      schemaReady = null;
      throw err;
    }
  })();

  return schemaReady;
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function persistState(state: WelcomeSequenceState): Promise<void> {
  if (!hasPostgres()) return;

  const activePool = getPool();
  if (!activePool) return;

  try {
    await ensureSchema();
    await activePool.query(
      `
        INSERT INTO lead_os_welcome_sequences (id, tenant_id, payload, created_at, updated_at)
        VALUES ($1, $2, $3::jsonb, now(), now())
        ON CONFLICT (tenant_id)
        DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = now()
      `,
      [randomUUID(), state.tenantId, JSON.stringify(state)],
    );
  } catch (err) {
    console.error(
      "[welcome-sequence] DB write failed:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

async function loadFromDb(tenantId: string): Promise<WelcomeSequenceState | null> {
  const activePool = getPool();
  if (!activePool) return null;

  try {
    await ensureSchema();
    const result = await activePool.query<{ payload: WelcomeSequenceState }>(
      `SELECT payload FROM lead_os_welcome_sequences WHERE tenant_id = $1 LIMIT 1`,
      [tenantId],
    );

    if (result.rows.length === 0) return null;
    const state = result.rows[0].payload;
    sequenceStore.set(tenantId, state);
    return state;
  } catch (err) {
    console.error(
      "[welcome-sequence] DB read failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

async function loadAllFromDb(): Promise<WelcomeSequenceState[]> {
  const activePool = getPool();
  if (!activePool) return [];

  try {
    await ensureSchema();
    const result = await activePool.query<{ payload: WelcomeSequenceState }>(
      `SELECT payload FROM lead_os_welcome_sequences WHERE payload->>'completedAt' IS NULL`,
    );
    const states = result.rows.map((r) => r.payload);
    for (const state of states) {
      sequenceStore.set(state.tenantId, state);
    }
    return states;
  } catch (err) {
    console.error(
      "[welcome-sequence] DB load-all failed:",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Email sending
// ---------------------------------------------------------------------------

interface SendResult {
  ok: boolean;
  error?: string;
}

async function sendWelcomeEmail(
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText: string,
): Promise<SendResult> {
  const apiKey = process.env.SINOSEND_API_KEY;

  if (!apiKey) {
    console.log(`[welcome-sequence] DRY-RUN: Would send "${subject}" to ${to}`);
    return { ok: true };
  }

  try {
    const response = await fetch("https://api.sinosend.com/v1/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html: bodyHtml,
        text: bodyText,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Sinosend API error ${response.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Sequence content
// ---------------------------------------------------------------------------

export function getWelcomeSequence(
  brandName: string,
  dashboardUrl: string,
  siteUrl: string,
): WelcomeEmail[] {
  return [
    {
      id: "welcome-step-1",
      stepNumber: 1,
      delayHours: 0,
      purpose: "Orient the operator and get them into the dashboard immediately",
      subject: `Welcome to ${brandName}`,
      bodyHtml: `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Welcome to ${brandName}!</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
  Your account is live. Here's how to get started in the next 10 minutes:
</p>
<ol style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:2;color:#374151;">
  <li>Log in to your <a href="${dashboardUrl}" style="color:#14b8a6;font-weight:600;">dashboard</a></li>
  <li>Add your first lead capture widget to your website</li>
  <li>Connect your email provider to start receiving leads</li>
</ol>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  Your embed code is ready and waiting. Once you paste it on your site, leads will start flowing in automatically.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:6px;background-color:#14b8a6;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Go to Dashboard</a>
    </td>
  </tr>
</table>
      `.trim(),
      bodyText: `Welcome to ${brandName}!

Your account is live. Here's how to get started:

1. Log in to your dashboard: ${dashboardUrl}
2. Add your first lead capture widget to your website
3. Connect your email provider to start receiving leads

Your embed code is ready. Once you paste it on your site, leads will start flowing in automatically.

Go to your dashboard: ${dashboardUrl}
`,
    },
    {
      id: "welcome-step-2",
      stepNumber: 2,
      delayHours: 24,
      purpose: "Drive email provider connection to unlock lead delivery",
      subject: `Connect your email provider — ${brandName}`,
      bodyHtml: `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Connect your email provider to ${brandName}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
  One step separates you from receiving leads directly in your inbox. Connecting your email provider means:
</p>
<ul style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:2;color:#374151;">
  <li>Instant notifications when new leads come in</li>
  <li>Automated follow-up sequences triggered on capture</li>
  <li>Full lead history synced to your inbox</li>
</ul>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  It takes under 2 minutes. Head to your credentials page to paste in your API key and you're done.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:6px;background-color:#14b8a6;">
      <a href="${dashboardUrl}/settings/credentials" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Connect Email Provider</a>
    </td>
  </tr>
</table>
      `.trim(),
      bodyText: `Connect your email provider — ${brandName}

One step separates you from receiving leads directly in your inbox.

When connected, you get:
- Instant notifications when new leads come in
- Automated follow-up sequences triggered on capture
- Full lead history synced to your inbox

It takes under 2 minutes. Go to your credentials page:
${dashboardUrl}/settings/credentials
`,
    },
    {
      id: "welcome-step-3",
      stepNumber: 3,
      delayHours: 72,
      purpose: "Guide operator to embed their first widget and see it in action",
      subject: `Your first lead capture widget — ${brandName}`,
      bodyHtml: `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Time to capture your first lead with ${brandName}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
  Your widget is already built. Here's how to get it live on your site in 3 steps:
</p>
<ol style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:2;color:#374151;">
  <li>Copy the embed snippet from your <a href="${dashboardUrl}/widgets" style="color:#14b8a6;">Widgets page</a></li>
  <li>Paste it just before the <code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">&lt;/body&gt;</code> tag on your site</li>
  <li>Visit <a href="${siteUrl}" style="color:#14b8a6;">${siteUrl}</a> and test the form yourself</li>
</ol>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  Want to see a live preview first? Open the widget preview tool on your dashboard before going live.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:6px;background-color:#14b8a6;">
      <a href="${dashboardUrl}/widgets" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">View My Widgets</a>
    </td>
  </tr>
</table>
      `.trim(),
      bodyText: `Your first lead capture widget — ${brandName}

Your widget is already built. Get it live in 3 steps:

1. Copy the embed snippet from your Widgets page: ${dashboardUrl}/widgets
2. Paste it just before the </body> tag on your site
3. Visit ${siteUrl} and test the form yourself

Want to preview first? Use the widget preview tool on your dashboard.

View your widgets: ${dashboardUrl}/widgets
`,
    },
    {
      id: "welcome-step-4",
      stepNumber: 4,
      delayHours: 120,
      purpose: "Educate operator on lead scores so they can qualify and tune effectively",
      subject: `Understanding your lead scores — ${brandName}`,
      bodyHtml: `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">What your lead scores mean</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
  Every lead captured by ${brandName} gets an automatic score from 0–100. Here's the scale:
</p>
<table role="presentation" cellspacing="0" cellpadding="12" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
  <thead>
    <tr style="background-color:#f9fafb;">
      <th scope="col" style="text-align:left;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Score</th>
      <th scope="col" style="text-align:left;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Signal</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">80–100</td><td style="font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">Hot — contact within 1 hour</td></tr>
    <tr><td style="font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">50–79</td><td style="font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">Warm — nurture with email sequence</td></tr>
    <tr><td style="font-size:15px;color:#111827;">0–49</td><td style="font-size:15px;color:#111827;">Cold — add to long-term drip</td></tr>
  </tbody>
</table>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  You can tune the scoring weights on your Scoring page to match what matters most for your business — budget signals, intent keywords, location fit, and more.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:6px;background-color:#14b8a6;">
      <a href="${dashboardUrl}/scoring" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Tune My Scoring</a>
    </td>
  </tr>
</table>
      `.trim(),
      bodyText: `Understanding your lead scores — ${brandName}

Every lead gets an automatic score from 0-100:

80-100: Hot — contact within 1 hour
50-79:  Warm — nurture with email sequence
0-49:   Cold — add to long-term drip

You can tune the scoring weights on your Scoring page to match what matters most: budget signals, intent keywords, location fit, and more.

Tune your scoring: ${dashboardUrl}/scoring
`,
    },
    {
      id: "welcome-step-5",
      stepNumber: 5,
      delayHours: 168,
      purpose: "Confirm readiness and drive operator to go live with confidence",
      subject: `You're ready to go live — ${brandName}`,
      bodyHtml: `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">You're ready to go live on ${brandName}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
  Here's your pre-launch checklist:
</p>
<ul style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:2;color:#374151;">
  <li>Widget embed code installed on your site</li>
  <li>Email provider connected</li>
  <li>Lead scoring tuned to your ideal customer</li>
  <li>Test lead submitted and received</li>
</ul>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  When you're ready, hit the Go Live button in your dashboard. Your widget will activate and leads will start flowing.
</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
  Need help? Reply to this email or visit <a href="${siteUrl}/support" style="color:#14b8a6;">${siteUrl}/support</a> — we typically respond within 2 hours.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:6px;background-color:#14b8a6;">
      <a href="${dashboardUrl}/go-live" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Go Live Now</a>
    </td>
  </tr>
</table>
      `.trim(),
      bodyText: `You're ready to go live — ${brandName}

Pre-launch checklist:
- Widget embed code installed on your site
- Email provider connected
- Lead scoring tuned to your ideal customer
- Test lead submitted and received

When you're ready, hit the Go Live button in your dashboard:
${dashboardUrl}/go-live

Need help? Visit ${siteUrl}/support — we typically respond within 2 hours.
`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Sequence state helpers
// ---------------------------------------------------------------------------

function computeNextStepDue(startedAt: string, nextStepDelayHours: number): string {
  const start = new Date(startedAt);
  return new Date(start.getTime() + nextStepDelayHours * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function startWelcomeSequence(
  tenantId: string,
  email: string,
  brandName: string,
): Promise<WelcomeSequenceState> {
  const now = new Date().toISOString();

  const sequence = getWelcomeSequence(brandName, "https://app.example.com", "https://example.com");
  const firstEmail = sequence[0];

  const state: WelcomeSequenceState = {
    tenantId,
    email,
    brandName,
    startedAt: now,
    sentSteps: [],
    nextStepDue: now,
  };

  sequenceStore.set(tenantId, state);
  await persistState(state);

  const result = await sendWelcomeEmail(
    email,
    firstEmail.subject,
    firstEmail.bodyHtml,
    firstEmail.bodyText,
  );

  if (result.ok) {
    state.sentSteps = [1];
    const secondStep = sequence[1];
    if (secondStep) {
      state.nextStepDue = computeNextStepDue(now, secondStep.delayHours);
    } else {
      state.completedAt = now;
      delete state.nextStepDue;
    }
  }

  sequenceStore.set(tenantId, state);
  await persistState(state);

  return state;
}

export async function getWelcomeSequenceState(
  tenantId: string,
): Promise<WelcomeSequenceState | null> {
  const inMemory = sequenceStore.get(tenantId);
  if (inMemory) return inMemory;

  if (hasPostgres()) {
    return loadFromDb(tenantId);
  }

  return null;
}

export async function markWelcomeStepSent(
  tenantId: string,
  stepNumber: number,
): Promise<WelcomeSequenceState | null> {
  const state = await getWelcomeSequenceState(tenantId);
  if (!state) return null;

  if (!state.sentSteps.includes(stepNumber)) {
    state.sentSteps.push(stepNumber);
    state.sentSteps.sort((a, b) => a - b);
  }

  const sequence = getWelcomeSequence(state.brandName, "", "");
  const totalSteps = sequence.length;
  const nextStepNumber = stepNumber + 1;

  if (nextStepNumber > totalSteps) {
    state.completedAt = new Date().toISOString();
    delete state.nextStepDue;
  } else {
    const nextStep = sequence.find((s) => s.stepNumber === nextStepNumber);
    if (nextStep) {
      state.nextStepDue = computeNextStepDue(state.startedAt, nextStep.delayHours);
    }
  }

  sequenceStore.set(tenantId, state);
  await persistState(state);

  return state;
}

export async function processWelcomeSequenceDue(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const now = new Date();
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Merge DB + memory for completeness
  const dbStates = await loadAllFromDb();
  const allTenantIds = new Set([
    ...sequenceStore.keys(),
    ...dbStates.map((s) => s.tenantId),
  ]);

  const candidates: WelcomeSequenceState[] = [];
  for (const tenantId of allTenantIds) {
    const state = sequenceStore.get(tenantId) ?? dbStates.find((s) => s.tenantId === tenantId);
    if (state) candidates.push(state);
  }

  for (const state of candidates) {
    if (state.completedAt) {
      skipped++;
      continue;
    }

    if (!state.nextStepDue) {
      skipped++;
      continue;
    }

    const due = new Date(state.nextStepDue);
    if (due > now) {
      skipped++;
      continue;
    }

    const sequence = getWelcomeSequence(state.brandName, "", "");
    const totalSteps = sequence.length;
    const nextStepNumber = (state.sentSteps.length > 0 ? Math.max(...state.sentSteps) : 0) + 1;

    if (nextStepNumber > totalSteps) {
      state.completedAt = now.toISOString();
      delete state.nextStepDue;
      sequenceStore.set(state.tenantId, state);
      await persistState(state);
      skipped++;
      continue;
    }

    const emailStep = sequence.find((s) => s.stepNumber === nextStepNumber);
    if (!emailStep) {
      skipped++;
      continue;
    }

    // Re-interpolate with stored brandName; dashboardUrl/siteUrl fall back to empty string
    // for process-due context — production callers should extend state with those URLs if needed.
    const fullSequence = getWelcomeSequence(
      state.brandName,
      process.env.DASHBOARD_URL ?? "",
      process.env.SITE_URL ?? "",
    );
    const fullStep = fullSequence.find((s) => s.stepNumber === nextStepNumber);
    if (!fullStep) {
      skipped++;
      continue;
    }

    try {
      const result = await sendWelcomeEmail(
        state.email,
        fullStep.subject,
        fullStep.bodyHtml,
        fullStep.bodyText,
      );

      if (!result.ok) {
        console.error(
          `[welcome-sequence] Failed to send step ${nextStepNumber} to ${state.email}: ${result.error}`,
        );
        errors++;
        continue;
      }

      await markWelcomeStepSent(state.tenantId, nextStepNumber);
      processed++;
    } catch (err) {
      console.error(
        `[welcome-sequence] Unexpected error processing tenant ${state.tenantId}:`,
        err instanceof Error ? err.message : String(err),
      );
      errors++;
    }
  }

  return { processed, skipped, errors };
}

export function listWelcomeSequences(): WelcomeSequenceState[] {
  return Array.from(sequenceStore.values());
}

export function resetWelcomeStore(): void {
  sequenceStore.clear();
  schemaReady = null;
}
