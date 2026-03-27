"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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

interface RealtimeContextValue {
  events: RealtimeEvent[];
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  events: [],
  connected: false,
});

const MAX_CLIENT_EVENTS = 200;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/realtime/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    es.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as RealtimeEvent;
        setEvents((prev) => {
          const next = [...prev, event];
          if (next.length > MAX_CLIENT_EVENTS) {
            return next.slice(-MAX_CLIENT_EVENTS);
          }
          return next;
        });
      } catch {
        // Ignore malformed events
      }
    };

    const eventTypes: RealtimeEventType[] = [
      "lead.captured",
      "lead.scored",
      "lead.hot",
      "experiment.conversion",
      "marketplace.claimed",
      "provisioning.step",
      "system.alert",
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, (messageEvent) => {
        try {
          const event = JSON.parse((messageEvent as MessageEvent).data) as RealtimeEvent;
          setEvents((prev) => {
            const next = [...prev, event];
            if (next.length > MAX_CLIENT_EVENTS) {
              return next.slice(-MAX_CLIENT_EVENTS);
            }
            return next;
          });
        } catch {
          // Ignore malformed events
        }
      });
    }

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      const delay = Math.min(
        RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current),
        RECONNECT_MAX_DELAY,
      );
      reconnectAttempts.current += 1;

      setTimeout(() => {
        connect();
      }, delay);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return (
    <RealtimeContext.Provider value={{ events, connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeEvents(eventTypes?: RealtimeEventType[]): RealtimeEvent[] {
  const { events } = useContext(RealtimeContext);

  if (!eventTypes || eventTypes.length === 0) {
    return events;
  }

  const typeSet = new Set(eventTypes);
  return events.filter((e) => typeSet.has(e.type));
}

export function useRealtimeConnected(): boolean {
  const { connected } = useContext(RealtimeContext);
  return connected;
}
