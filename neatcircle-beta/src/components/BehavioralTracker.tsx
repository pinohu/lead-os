"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  ensureSession,
  ensureVisitorId,
  getSessionCount,
  getStoredProfile,
  trackBrowserEvent,
  updateStoredProfile,
} from "@/lib/trace";

export default function BehavioralTracker() {
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    if (percent <= maxScroll.current) return;

    maxScroll.current = percent;

    if (percent >= 50 && !tracked50.current) {
      tracked50.current = true;
      trackBrowserEvent({
        type: "scroll_depth",
        data: { depth: 50 },
      });
    }
    if (percent >= 75 && !tracked75.current) {
      tracked75.current = true;
      trackBrowserEvent({
        type: "scroll_depth",
        data: { depth: 75 },
      });
    }

    const scrollMap = (getStoredProfile().scrollDepth ?? {}) as Record<string, number>;
    scrollMap[window.location.pathname] = percent;
    updateStoredProfile({ scrollDepth: scrollMap });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const visitorId = ensureVisitorId();
    const session = ensureSession();
    const path = window.location.pathname;

    const pages = (getStoredProfile().pagesViewed ?? []) as string[];
    if (!pages.includes(path)) {
      pages.push(path);
      updateStoredProfile({ pagesViewed: pages });
    }

    trackBrowserEvent({
      type: "page_view",
      data: {
        isNewSession: session.isNewSession,
        sessionCount: session.sessions,
      },
    });

    const sessions = getSessionCount();
    if (sessions >= 2) {
      trackBrowserEvent({
        type: "return_visit",
        data: { sessionCount: sessions },
      });
    }

    if (path.includes("pricing") || path.includes("/services")) {
      trackBrowserEvent({
        type: "pricing_view",
        data: { page: path },
      });
    }

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    if (Object.keys(utm).length > 0) {
      updateStoredProfile({
        utm,
        utmSource: utm.utm_source,
        utmMedium: utm.utm_medium,
      });
    }

    const profile = getStoredProfile();
    if (!profile.firstSeen) {
      updateStoredProfile({
        firstSeen: new Date().toISOString(),
        visitorId,
        sessionId: session.sessionId,
      });
    }
    updateStoredProfile({
      lastSeen: new Date().toISOString(),
      sessions,
      sessionId: session.sessionId,
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      const totalTime = ((getStoredProfile().totalTimeOnSite ?? 0) as number) + timeSpent;
      updateStoredProfile({ totalTimeOnSite: totalTime });

      if (timeSpent > 30) {
        trackBrowserEvent({
          type: "time_on_page",
          data: { seconds: timeSpent, totalSeconds: totalTime },
        });
      }

      const latestProfile = getStoredProfile();
      const pv = ((latestProfile.pagesViewed ?? []) as string[]).length;
      const avgScroll =
        Object.values((latestProfile.scrollDepth ?? {}) as Record<string, number>).reduce(
          (sum, value) => sum + value,
          0,
        ) / Math.max(Object.keys((latestProfile.scrollDepth ?? {}) as Record<string, number>).length, 1);
      const mins = totalTime / 60;

      let engagement =
        Math.min(pv * 8, 30) + Math.min(avgScroll * 0.3, 25) + Math.min(mins * 5, 25);
      if (latestProfile.chatEngaged) engagement += 15;
      if (latestProfile.assessmentCompleted) engagement += 20;
      engagement = Math.min(engagement, 100);

      let intent = 0;
      const highPages = ((latestProfile.pagesViewed ?? []) as string[]).filter(
        (page) =>
          page.includes("/services") ||
          page.includes("/pricing") ||
          page.includes("/assess") ||
          page.includes("/calculator"),
      ).length;
      intent += Math.min(highPages * 15, 35);
      if (latestProfile.assessmentCompleted) intent += 25;
      if (latestProfile.roiCalculatorUsed) intent += 20;
      if (latestProfile.email) intent += 15;
      if (latestProfile.phone) intent += 10;
      intent = Math.min(intent, 100);

      let urgency = 0;
      if (sessions >= 3) urgency += 30;
      else if (sessions >= 2) urgency += 15;
      if (latestProfile.phone) urgency += 20;
      if (latestProfile.whatsappOptIn) urgency += 15;
      urgency = Math.min(urgency, 100);

      const fit = latestProfile.nicheInterest ? 30 : 0;
      const composite = Math.round(
        intent * 0.35 + engagement * 0.25 + fit * 0.25 + urgency * 0.15,
      );

      updateStoredProfile({
        scores: { engagement: Math.round(engagement), intent, fit, urgency, composite },
      });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [handleScroll]);

  return null;
}
