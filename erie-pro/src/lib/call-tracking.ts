// ── Call Tracking System ────────────────────────────────────────────
// Phone-based lead tracking with call routing and outcome recording.
// Persistent via Prisma/Postgres. Dry-run mode with placeholder numbers.

import { prisma } from "@/lib/db";
import type {
  TrackedCall as PrismaTrackedCall,
  CallOutcome,
} from "@/generated/prisma";

// ── Public Interfaces ──────────────────────────────────────────────

export interface TrackedCall {
  id: string;
  niche: string;
  city: string;
  callerPhone: string;
  trackingNumber: string;
  routedTo: string;
  duration: number;
  recordingUrl?: string;
  outcome: "connected" | "voicemail" | "missed" | "busy";
  timestamp: string;
}

export interface CallStats {
  total: number;
  connected: number;
  voicemail: number;
  missed: number;
  busy: number;
  avgDuration: number;
  connectionRate: number;
}

// ── Configuration ──────────────────────────────────────────────────

const CALLSCALER_API_KEY = process.env.CALLSCALER_API_KEY ?? "";
const isDryRun = !CALLSCALER_API_KEY;

// ── Mock Tracking Numbers ──────────────────────────────────────────

const MOCK_TRACKING_NUMBERS: Record<string, string> = {
  "plumbing-erie": "(814) 900-0101",
  "hvac-erie": "(814) 900-0102",
  "electrical-erie": "(814) 900-0103",
  "roofing-erie": "(814) 900-0104",
  "landscaping-erie": "(814) 900-0105",
  "dental-erie": "(814) 900-0106",
  "legal-erie": "(814) 900-0107",
  "cleaning-erie": "(814) 900-0108",
  "auto-repair-erie": "(814) 900-0109",
  "pest-control-erie": "(814) 900-0110",
  "painting-erie": "(814) 900-0111",
  "real-estate-erie": "(814) 900-0112",
};

// In-memory tracking number cache (for dry-run)
const trackingNumberCache: Map<string, string> = new Map();
let nextMockNumber = 200;

// ── Mapper ─────────────────────────────────────────────────────────

function toTrackedCall(c: PrismaTrackedCall): TrackedCall {
  return {
    id: c.id,
    niche: c.niche,
    city: c.city,
    callerPhone: c.callerPhone,
    trackingNumber: c.trackingNumber,
    routedTo: c.routedTo,
    duration: c.duration,
    recordingUrl: c.recordingUrl ?? undefined,
    outcome: c.outcome as TrackedCall["outcome"],
    timestamp: c.createdAt.toISOString(),
  };
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Get the tracking number for a niche + city combination.
 */
export function getTrackingNumber(niche: string, city: string): string {
  const key = `${niche}-${city}`;

  // Check cache
  const cached = trackingNumberCache.get(key);
  if (cached) return cached;

  // Check mock numbers
  const mock = MOCK_TRACKING_NUMBERS[key];
  if (mock) {
    trackingNumberCache.set(key, mock);
    return mock;
  }

  // Generate a new mock number
  const number = `(814) 900-${String(nextMockNumber++).padStart(4, "0")}`;
  trackingNumberCache.set(key, number);
  return number;
}

/**
 * Route an incoming call to the appropriate provider.
 * In production, queries DB for the provider assigned to the niche.
 */
export async function routeCall(
  trackingNumber: string
): Promise<{ providerPhone: string; providerId: string }> {
  // Find the provider for this tracking number's niche
  // For now, use a simple lookup approach
  for (const [key, number] of Object.entries(MOCK_TRACKING_NUMBERS)) {
    if (number === trackingNumber) {
      const [niche, city] = key.split("-");
      const provider = await prisma.provider.findFirst({
        where: {
          niche,
          city: { equals: city, mode: "insensitive" },
          tier: "primary",
          subscriptionStatus: "active",
        },
        select: { id: true, phone: true },
      });
      if (provider) {
        return { providerPhone: provider.phone, providerId: provider.id };
      }
    }
  }

  return { providerPhone: "(814) 555-9999", providerId: "unknown" };
}

/**
 * Record the outcome of a tracked call.
 */
export async function recordCallOutcome(
  callId: string,
  outcome: TrackedCall["outcome"],
  duration: number
): Promise<TrackedCall | undefined> {
  try {
    const updated = await prisma.trackedCall.update({
      where: { id: callId },
      data: {
        outcome: outcome as CallOutcome,
        duration,
      },
    });
    return toTrackedCall(updated);
  } catch {
    return undefined;
  }
}

/**
 * Log a new incoming call.
 */
export async function logIncomingCall(
  niche: string,
  city: string,
  callerPhone: string
): Promise<TrackedCall> {
  const trackingNumber = getTrackingNumber(niche, city);
  const route = await routeCall(trackingNumber);

  const call = await prisma.trackedCall.create({
    data: {
      niche,
      city: city.toLowerCase(),
      callerPhone,
      trackingNumber,
      routedTo: route.providerPhone,
      providerId: route.providerId !== "unknown" ? route.providerId : null,
      outcome: "connected",
    },
  });

  return toTrackedCall(call);
}

/**
 * Get call statistics for a provider.
 */
export async function getCallStats(providerId: string): Promise<CallStats> {
  const calls = await prisma.trackedCall.findMany({
    where: { providerId },
  });

  const total = calls.length;
  const connected = calls.filter((c) => c.outcome === "connected").length;
  const voicemail = calls.filter((c) => c.outcome === "voicemail").length;
  const missed = calls.filter((c) => c.outcome === "missed").length;
  const busy = calls.filter((c) => c.outcome === "busy").length;

  const durations = calls.filter((c) => c.duration > 0).map((c) => c.duration);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  return {
    total,
    connected,
    voicemail,
    missed,
    busy,
    avgDuration,
    connectionRate: total > 0 ? Math.round((connected / total) * 100) / 100 : 0,
  };
}

/**
 * Get all tracked calls (admin).
 */
export async function getAllCalls(): Promise<TrackedCall[]> {
  const calls = await prisma.trackedCall.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return calls.map(toTrackedCall);
}

/**
 * Get calls for a specific niche.
 */
export async function getCallsByNiche(niche: string): Promise<TrackedCall[]> {
  const calls = await prisma.trackedCall.findMany({
    where: { niche },
    orderBy: { createdAt: "desc" },
  });
  return calls.map(toTrackedCall);
}

/**
 * Check if call tracking is in dry-run mode.
 */
export function isCallTrackingDryRun(): boolean {
  return isDryRun;
}
