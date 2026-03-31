// ── Call Tracking System ────────────────────────────────────────────
// Phone-based lead tracking with call routing and outcome recording.
// Dry-run mode assigns placeholder tracking numbers.
// In production, integrates with CallScaler or similar service.

export interface TrackedCall {
  id: string;
  niche: string;
  city: string;
  callerPhone: string;
  trackingNumber: string;
  routedTo: string; // provider phone
  duration: number; // seconds
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

// ── Configuration ───────────────────────────────────────────────────

const CALLSCALER_API_KEY = process.env.CALLSCALER_API_KEY ?? "";
const isDryRun = !CALLSCALER_API_KEY;

// ── In-Memory Stores ────────────────────────────────────────────────

const trackingNumbers: Map<string, string> = new Map();
const callLog: Map<string, TrackedCall> = new Map();
const providerCalls: Map<string, string[]> = new Map(); // providerId -> callIds

function generateCallId(): string {
  return `call-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// ── Tracking Number Management ──────────────────────────────────────

// Pre-assigned mock tracking numbers for each niche
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

// Provider phone routing table
const PROVIDER_ROUTES: Record<string, { providerPhone: string; providerId: string }> = {
  "(814) 900-0101": { providerPhone: "(814) 555-0101", providerId: "prov-plumb-001" },
  "(814) 900-0102": { providerPhone: "(814) 555-0301", providerId: "prov-hvac-001" },
  "(814) 900-0103": { providerPhone: "(814) 555-0401", providerId: "prov-elec-001" },
  "(814) 900-0104": { providerPhone: "(814) 555-0701", providerId: "prov-roof-001" },
  "(814) 900-0106": { providerPhone: "(814) 555-0501", providerId: "prov-dental-001" },
  "(814) 900-0107": { providerPhone: "(814) 555-0601", providerId: "prov-legal-001" },
};

/**
 * Get the tracking number for a niche + city combination.
 * In dry-run mode, returns a pre-assigned mock number.
 */
export function getTrackingNumber(niche: string, city: string): string {
  const key = `${niche}-${city}`;

  // Check if already assigned
  const existing = trackingNumbers.get(key);
  if (existing) return existing;

  if (isDryRun) {
    const mockNumber = MOCK_TRACKING_NUMBERS[key] ?? `(814) 900-${String(trackingNumbers.size + 200).padStart(4, "0")}`;
    trackingNumbers.set(key, mockNumber);
    console.log(`[CallTracking DRY-RUN] Assigned tracking number: ${mockNumber} for ${key}`);
    return mockNumber;
  }

  // Production: provision from CallScaler
  // const number = await callscaler.provisionNumber({ areaCode: "814", ... });
  const fallback = `(814) 900-${String(trackingNumbers.size + 200).padStart(4, "0")}`;
  trackingNumbers.set(key, fallback);
  return fallback;
}

/**
 * Route an incoming call to the appropriate provider.
 */
export function routeCall(trackingNumber: string): { providerPhone: string; providerId: string } {
  const route = PROVIDER_ROUTES[trackingNumber];
  if (route) {
    console.log(
      isDryRun ? "[CallTracking DRY-RUN]" : "[CallTracking]",
      `Routing ${trackingNumber} -> ${route.providerPhone} (${route.providerId})`
    );
    return route;
  }

  // Default fallback
  console.log(
    isDryRun ? "[CallTracking DRY-RUN]" : "[CallTracking]",
    `No route for ${trackingNumber}, using default`
  );
  return { providerPhone: "(814) 555-9999", providerId: "unknown" };
}

/**
 * Record the outcome of a tracked call.
 */
export function recordCallOutcome(
  callId: string,
  outcome: TrackedCall["outcome"],
  duration: number
): TrackedCall | undefined {
  const call = callLog.get(callId);
  if (!call) return undefined;

  call.outcome = outcome;
  call.duration = duration;
  callLog.set(callId, call);

  console.log(
    isDryRun ? "[CallTracking DRY-RUN]" : "[CallTracking]",
    `Call ${callId}: ${outcome}, ${duration}s`
  );

  return call;
}

/**
 * Log a new incoming call.
 */
export function logIncomingCall(
  niche: string,
  city: string,
  callerPhone: string
): TrackedCall {
  const trackingNumber = getTrackingNumber(niche, city);
  const route = routeCall(trackingNumber);
  const callId = generateCallId();

  const call: TrackedCall = {
    id: callId,
    niche,
    city,
    callerPhone,
    trackingNumber,
    routedTo: route.providerPhone,
    duration: 0,
    outcome: "connected",
    timestamp: new Date().toISOString(),
  };

  callLog.set(callId, call);

  // Index by provider
  const existing = providerCalls.get(route.providerId) ?? [];
  existing.push(callId);
  providerCalls.set(route.providerId, existing);

  return call;
}

/**
 * Get call statistics for a provider.
 */
export function getCallStats(providerId: string): CallStats {
  const callIds = providerCalls.get(providerId) ?? [];
  const calls = callIds.map((id) => callLog.get(id)).filter(Boolean) as TrackedCall[];

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
export function getAllCalls(): TrackedCall[] {
  return Array.from(callLog.values());
}

/**
 * Get calls for a specific niche.
 */
export function getCallsByNiche(niche: string): TrackedCall[] {
  return Array.from(callLog.values()).filter((c) => c.niche === niche);
}

/**
 * Check if call tracking is in dry-run mode.
 */
export function isCallTrackingDryRun(): boolean {
  return isDryRun;
}
