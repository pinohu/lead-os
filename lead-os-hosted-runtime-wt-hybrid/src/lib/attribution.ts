import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface AttributionTouch {
  id: string;
  leadKey: string;
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  referrer: string;
  landingPage: string;
  createdAt: string;
}

export interface AttributionTouchCredit {
  touchId: string;
  channel: string;
  source: string;
  credit: number;
  value: number;
}

export type AttributionModel = "first-touch" | "last-touch" | "linear" | "time-decay" | "position-based";

export interface AttributionResult {
  leadKey: string;
  model: AttributionModel;
  touches: AttributionTouchCredit[];
  totalValue: number;
}

export interface ChannelPerformance {
  channel: string;
  touches: number;
  conversions: number;
  revenue: number;
  roi: number;
}

const touchStore: AttributionTouch[] = [];

let schemaReady: Promise<void> | null = null;

const TIME_DECAY_HALF_LIFE_DAYS = 7;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_attribution_touches (
          id TEXT PRIMARY KEY,
          lead_key TEXT NOT NULL,
          channel TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT '',
          medium TEXT NOT NULL DEFAULT '',
          campaign TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          referrer TEXT NOT NULL DEFAULT '',
          landing_page TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_lead_key
          ON lead_os_attribution_touches (lead_key, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_channel
          ON lead_os_attribution_touches (channel);
        CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_created_at
          ON lead_os_attribution_touches (created_at);
      `);
    } catch (error: unknown) {
      console.error("Failed to create attribution schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureSchema();
  return activePool.query<T>(text, values);
}

export async function recordTouch(
  touch: Omit<AttributionTouch, "id" | "createdAt">,
): Promise<AttributionTouch> {
  const record: AttributionTouch = {
    ...touch,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  touchStore.push(record);

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `INSERT INTO lead_os_attribution_touches
         (id, lead_key, channel, source, medium, campaign, content, referrer, landing_page, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.leadKey,
        record.channel,
        record.source,
        record.medium,
        record.campaign,
        record.content,
        record.referrer,
        record.landingPage,
        record.createdAt,
      ],
    );
  }

  return record;
}

export async function getTouches(leadKey: string): Promise<AttributionTouch[]> {
  const activePool = getPool();
  if (activePool) {
    const result = await queryPostgres<{
      id: string;
      lead_key: string;
      channel: string;
      source: string;
      medium: string;
      campaign: string;
      content: string;
      referrer: string;
      landing_page: string;
      created_at: string;
    }>(
      `SELECT id, lead_key, channel, source, medium, campaign, content, referrer, landing_page, created_at
       FROM lead_os_attribution_touches
       WHERE lead_key = $1
       ORDER BY created_at ASC`,
      [leadKey],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadKey: row.lead_key,
      channel: row.channel,
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      content: row.content,
      referrer: row.referrer,
      landingPage: row.landing_page,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  return touchStore
    .filter((t) => t.leadKey === leadKey)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function applyFirstTouch(touches: AttributionTouch[], totalValue: number): AttributionTouchCredit[] {
  if (touches.length === 0) return [];

  return touches.map((touch, index) => ({
    touchId: touch.id,
    channel: touch.channel,
    source: touch.source,
    credit: index === 0 ? 1 : 0,
    value: index === 0 ? totalValue : 0,
  }));
}

function applyLastTouch(touches: AttributionTouch[], totalValue: number): AttributionTouchCredit[] {
  if (touches.length === 0) return [];

  const lastIndex = touches.length - 1;
  return touches.map((touch, index) => ({
    touchId: touch.id,
    channel: touch.channel,
    source: touch.source,
    credit: index === lastIndex ? 1 : 0,
    value: index === lastIndex ? totalValue : 0,
  }));
}

function applyLinear(touches: AttributionTouch[], totalValue: number): AttributionTouchCredit[] {
  if (touches.length === 0) return [];

  const credit = 1 / touches.length;
  const valuePerTouch = totalValue / touches.length;

  return touches.map((touch) => ({
    touchId: touch.id,
    channel: touch.channel,
    source: touch.source,
    credit,
    value: valuePerTouch,
  }));
}

function applyTimeDecay(touches: AttributionTouch[], totalValue: number): AttributionTouchCredit[] {
  if (touches.length === 0) return [];

  const lastTouchTime = new Date(touches[touches.length - 1].createdAt).getTime();
  const halfLifeMs = TIME_DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;

  const rawWeights = touches.map((touch) => {
    const touchTime = new Date(touch.createdAt).getTime();
    const daysBefore = (lastTouchTime - touchTime) / halfLifeMs;
    return Math.pow(0.5, daysBefore);
  });

  const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);

  return touches.map((touch, index) => {
    const credit = totalWeight > 0 ? rawWeights[index] / totalWeight : 0;
    return {
      touchId: touch.id,
      channel: touch.channel,
      source: touch.source,
      credit,
      value: credit * totalValue,
    };
  });
}

function applyPositionBased(touches: AttributionTouch[], totalValue: number): AttributionTouchCredit[] {
  if (touches.length === 0) return [];

  if (touches.length === 1) {
    return [{
      touchId: touches[0].id,
      channel: touches[0].channel,
      source: touches[0].source,
      credit: 1,
      value: totalValue,
    }];
  }

  if (touches.length === 2) {
    return touches.map((touch, index) => ({
      touchId: touch.id,
      channel: touch.channel,
      source: touch.source,
      credit: 0.5,
      value: totalValue * 0.5,
    }));
  }

  const middleCount = touches.length - 2;
  const middleCredit = 0.2 / middleCount;

  return touches.map((touch, index) => {
    let credit: number;
    if (index === 0) {
      credit = 0.4;
    } else if (index === touches.length - 1) {
      credit = 0.4;
    } else {
      credit = middleCredit;
    }

    return {
      touchId: touch.id,
      channel: touch.channel,
      source: touch.source,
      credit,
      value: credit * totalValue,
    };
  });
}

export function computeAttribution(
  touches: AttributionTouch[],
  model: AttributionModel,
  totalValue: number,
): AttributionResult {
  if (touches.length === 0) {
    return { leadKey: "", model, touches: [], totalValue };
  }

  const leadKey = touches[0].leadKey;
  const sorted = touches
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let credits: AttributionTouchCredit[];

  switch (model) {
    case "first-touch":
      credits = applyFirstTouch(sorted, totalValue);
      break;
    case "last-touch":
      credits = applyLastTouch(sorted, totalValue);
      break;
    case "linear":
      credits = applyLinear(sorted, totalValue);
      break;
    case "time-decay":
      credits = applyTimeDecay(sorted, totalValue);
      break;
    case "position-based":
      credits = applyPositionBased(sorted, totalValue);
      break;
  }

  return { leadKey, model, touches: credits, totalValue };
}

export async function getChannelPerformance(
  since?: string,
): Promise<ChannelPerformance[]> {
  const activePool = getPool();

  let allTouches: AttributionTouch[];

  if (activePool) {
    const sinceClause = since ? "WHERE created_at >= $1::timestamptz" : "";
    const values = since ? [since] : [];

    const result = await queryPostgres<{
      id: string;
      lead_key: string;
      channel: string;
      source: string;
      medium: string;
      campaign: string;
      content: string;
      referrer: string;
      landing_page: string;
      created_at: string;
    }>(
      `SELECT id, lead_key, channel, source, medium, campaign, content, referrer, landing_page, created_at
       FROM lead_os_attribution_touches
       ${sinceClause}
       ORDER BY created_at ASC`,
      values,
    );

    allTouches = result.rows.map((row) => ({
      id: row.id,
      leadKey: row.lead_key,
      channel: row.channel,
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      content: row.content,
      referrer: row.referrer,
      landingPage: row.landing_page,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  } else {
    const sinceTime = since ? new Date(since).getTime() : 0;
    allTouches = touchStore.filter(
      (t) => new Date(t.createdAt).getTime() >= sinceTime,
    );
  }

  const channelMap = new Map<
    string,
    { touches: number; leads: Set<string> }
  >();

  for (const touch of allTouches) {
    const entry = channelMap.get(touch.channel) ?? {
      touches: 0,
      leads: new Set<string>(),
    };
    entry.touches++;
    entry.leads.add(touch.leadKey);
    channelMap.set(touch.channel, entry);
  }

  const results: ChannelPerformance[] = [];
  for (const [channel, data] of channelMap) {
    results.push({
      channel,
      touches: data.touches,
      conversions: data.leads.size,
      revenue: 0,
      roi: 0,
    });
  }

  return results.sort((a, b) => b.touches - a.touches);
}
