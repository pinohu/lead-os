export type RealtimeEventType =
  | "lead.captured"
  | "lead.scored"
  | "lead.hot"
  | "experiment.conversion"
  | "marketplace.claimed"
  | "provisioning.step"
  | "system.alert";

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  tenantId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

type EventCallback = (event: RealtimeEvent) => void;

const subscribers = new Map<string, Set<EventCallback>>();
const recentEvents = new Map<string, RealtimeEvent[]>();

const MAX_RECENT_EVENTS = 100;

export function subscribe(tenantId: string, callback: EventCallback): () => void {
  let tenantSubs = subscribers.get(tenantId);
  if (!tenantSubs) {
    tenantSubs = new Set();
    subscribers.set(tenantId, tenantSubs);
  }
  tenantSubs.add(callback);

  return () => {
    tenantSubs.delete(callback);
    if (tenantSubs.size === 0) {
      subscribers.delete(tenantId);
    }
  };
}

export function publish(event: Omit<RealtimeEvent, "id" | "timestamp">): void {
  const fullEvent: RealtimeEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  let tenantRecent = recentEvents.get(event.tenantId);
  if (!tenantRecent) {
    tenantRecent = [];
    recentEvents.set(event.tenantId, tenantRecent);
  }
  tenantRecent.push(fullEvent);
  if (tenantRecent.length > MAX_RECENT_EVENTS) {
    tenantRecent.splice(0, tenantRecent.length - MAX_RECENT_EVENTS);
  }

  const tenantSubs = subscribers.get(event.tenantId);
  if (tenantSubs) {
    for (const callback of tenantSubs) {
      try {
        callback(fullEvent);
      } catch {
        // Swallowed intentionally: a failing subscriber must not break the event bus
      }
    }
  }
}

export function getRecentEvents(tenantId: string, limit = 50): RealtimeEvent[] {
  const tenantRecent = recentEvents.get(tenantId);
  if (!tenantRecent) return [];
  return tenantRecent.slice(-limit);
}

export function getSubscriberCount(tenantId: string): number {
  return subscribers.get(tenantId)?.size ?? 0;
}

export function resetRealtime(): void {
  subscribers.clear();
  recentEvents.clear();
}
