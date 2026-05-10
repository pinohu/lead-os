"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type ConvertBoxContext = {
  serviceSlug: string | null;
  serviceLabel: string | null;
  pageType: string;
  family: string | null;
  boxId: number | null;
  countyFocus: string;
  source: "erie.pro";
};

type ConvertBoxEventPayload = {
  eventType: string;
  eventId?: string;
  sourcePage?: string;
  sourcePageType?: string;
  serviceNiche?: string | null;
  serviceSlug?: string | null;
  serviceLabel?: string | null;
  family?: string | null;
  boxId?: number | string | null;
  actionLabel?: string | null;
  actionType?: string | null;
  stepId?: string | null;
  stepName?: string | null;
  stepIndex?: number | null;
  branchId?: string | null;
  branchLabel?: string | null;
  consumerName?: string | null;
  consumerPhone?: string | null;
  consumerEmail?: string | null;
  requestSummary?: string | null;
  consentToContact?: boolean;
  marketingConsent?: boolean;
  sessionId?: string;
  visitorId?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    erieProConvertBox?: ConvertBoxContext;
    erieProTrackConvertBoxEvent?: (eventType: string, payload?: Partial<ConvertBoxEventPayload>) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const EVENT_ENDPOINT = "/api/events/convertbox";
const SESSION_KEY = "erie_pro_convertbox_session_id";
const VISITOR_KEY = "erie_pro_convertbox_visitor_id";

function getStoredId(key: string, prefix: string) {
  try {
    const existing = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    if (existing) return existing;
    const generated = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const storage = key === SESSION_KEY ? window.sessionStorage : window.localStorage;
    storage.setItem(key, generated);
    return generated;
  } catch {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getCampaignParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

function buildEvent(
  eventType: string,
  payload: Partial<ConvertBoxEventPayload> = {},
): ConvertBoxEventPayload {
  const context = window.erieProConvertBox;
  return {
    eventType,
    eventId: payload.eventId ?? `${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourcePage: payload.sourcePage ?? window.location.href,
    sourcePageType: payload.sourcePageType ?? context?.pageType ?? "unknown",
    serviceNiche: payload.serviceNiche ?? context?.serviceSlug ?? null,
    serviceSlug: payload.serviceSlug ?? context?.serviceSlug ?? null,
    serviceLabel: payload.serviceLabel ?? context?.serviceLabel ?? null,
    family: payload.family ?? context?.family ?? null,
    boxId: payload.boxId ?? context?.boxId ?? null,
    sessionId: payload.sessionId ?? getStoredId(SESSION_KEY, "epcbs"),
    visitorId: payload.visitorId ?? getStoredId(VISITOR_KEY, "epcbv"),
    utmSource: payload.utmSource ?? getCampaignParam("utm_source"),
    utmMedium: payload.utmMedium ?? getCampaignParam("utm_medium"),
    utmCampaign: payload.utmCampaign ?? getCampaignParam("utm_campaign"),
    gclid: payload.gclid ?? getCampaignParam("gclid"),
    ...payload,
    metadata: {
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      pathname: window.location.pathname,
      ...(payload.metadata ?? {}),
    },
  };
}

function postEvent(event: ConvertBoxEventPayload) {
  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(EVENT_ENDPOINT, new Blob([body], { type: "application/json" }));
    if (sent) return;
  }

  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function isConvertBoxDataLayerEvent(item: Record<string, unknown>) {
  const event = String(item.event ?? item.eventType ?? "").toLowerCase();
  return event.includes("convertbox") || event.includes("cbox");
}

function sanitizeDataLayerEvent(item: Record<string, unknown>) {
  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value == null) {
      metadata[key] = value;
    }
  }
  return metadata;
}

function isConvertBoxBridgeMessage(value: unknown): value is {
  source: "erie-pro-convertbox";
  eventType: string;
  payload?: Partial<ConvertBoxEventPayload>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.source === "erie-pro-convertbox" && typeof record.eventType === "string";
}

function hasVisibleConvertBoxNode() {
  const nodes = document.querySelectorAll<HTMLElement>(
    'iframe[src*="convertbox"], [id*="convertbox" i], [class*="convertbox" i], [id*="cbox" i], [class*="cbox" i]',
  );

  for (const node of Array.from(nodes)) {
    const rect = node.getBoundingClientRect();
    const styles = window.getComputedStyle(node);
    if (rect.width > 20 && rect.height > 20 && styles.display !== "none" && styles.visibility !== "hidden") {
      return true;
    }
  }

  return false;
}

export function ConvertBoxEventTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sent = new Set<string>();
    const track = (eventType: string, payload: Partial<ConvertBoxEventPayload> = {}) => {
      const event = buildEvent(eventType, payload);
      const dedupeKey = [
        event.eventType,
        event.sourcePageType,
        event.boxId,
        event.stepId,
        event.stepIndex,
        event.actionLabel,
        event.metadata?.dataLayerEvent,
      ].join("|");

      if (sent.has(dedupeKey)) return;
      sent.add(dedupeKey);
      postEvent(event);
    };

    window.erieProTrackConvertBoxEvent = track;
    track("convertbox.context_loaded");

    const currentDataLayer: NonNullable<Window["dataLayer"]> = window.dataLayer ?? [];
    const originalPush = currentDataLayer.push?.bind(currentDataLayer);
    window.dataLayer = currentDataLayer;
    window.dataLayer.push = (...items: Array<Record<string, unknown>>) => {
      for (const item of items) {
        if (isConvertBoxDataLayerEvent(item)) {
          track("convertbox.data_layer_event", {
            actionType: "data_layer",
            actionLabel: String(item.event ?? item.eventType ?? "ConvertBox event"),
            metadata: {
              dataLayerEvent: String(item.event ?? item.eventType ?? "unknown"),
              dataLayer: sanitizeDataLayerEvent(item),
            },
          });
        }
      }
      return originalPush ? originalPush(...items) : Array.prototype.push.apply(currentDataLayer, items);
    };

    let visible = hasVisibleConvertBoxNode();
    if (visible) track("convertbox.box_displayed");

    const observer = new MutationObserver(() => {
      const nextVisible = hasVisibleConvertBoxNode();
      if (nextVisible && !visible) track("convertbox.box_displayed");
      if (!nextVisible && visible) track("convertbox.box_closed");
      visible = nextVisible;
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const clickable = target?.closest<HTMLElement>(
        'a[href*="convertbox"], a[href*="cbox"], button[data-convertbox], [data-convertbox], [data-cbox]',
      );
      if (!clickable) return;

      const href = clickable instanceof HTMLAnchorElement ? clickable.href : null;
      track("convertbox.direct_link_opened", {
        actionType: "direct_link",
        actionLabel: clickable.textContent?.trim().slice(0, 500) || href || "ConvertBox trigger",
        metadata: {
          href,
          elementId: clickable.id || null,
          elementClass: typeof clickable.className === "string" ? clickable.className : null,
        },
      });
    };
    document.addEventListener("click", onClick, true);

    const onMessage = (event: MessageEvent) => {
      if (!isConvertBoxBridgeMessage(event.data)) return;
      if (!event.origin.includes("convertbox.com") && event.origin !== window.location.origin) return;
      track(event.data.eventType, {
        ...(event.data.payload ?? {}),
        metadata: {
          origin: event.origin,
          ...(event.data.payload?.metadata ?? {}),
        },
      });
    };
    window.addEventListener("message", onMessage);

    const onScriptLoad = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLScriptElement && target.src.includes("convertbox")) {
        track("convertbox.script_loaded", {
          metadata: { scriptSrc: target.src },
        });
      }
    };
    document.addEventListener("load", onScriptLoad, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("load", onScriptLoad, true);
      if (window.dataLayer) window.dataLayer.push = originalPush;
      if (window.erieProTrackConvertBoxEvent === track) delete window.erieProTrackConvertBoxEvent;
    };
  }, [pathname]);

  return null;
}
