"use client";

import { useEffect, useCallback, useRef } from "react";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("nc_visitor_id");
  if (!id) {
    id = "v_" + crypto.randomUUID();
    localStorage.setItem("nc_visitor_id", id);
  }
  return id;
}

function getSessionCount(): number {
  const count = parseInt(localStorage.getItem("nc_sessions") ?? "0", 10);
  return count;
}

function incrementSession() {
  const last = localStorage.getItem("nc_last_session");
  const now = Date.now();
  if (!last || now - parseInt(last, 10) > 30 * 60 * 1000) {
    const count = getSessionCount() + 1;
    localStorage.setItem("nc_sessions", String(count));
    localStorage.setItem("nc_last_session", String(now));
  }
}

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}");
  } catch {
    return {};
  }
}

function updateProfile(updates: Record<string, unknown>) {
  const current = getProfile();
  localStorage.setItem("nc_profile", JSON.stringify({ ...current, ...updates }));
  window.dispatchEvent(new Event("nc-profile-updated"));
}

function trackEvent(type: string, data?: Record<string, unknown>) {
  const visitorId = getVisitorId();
  const profile = getProfile();

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId,
      type,
      page: window.location.pathname,
      data,
      scores: profile.scores,
      email: profile.email,
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {});
}

export default function BehavioralTracker() {
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    if (percent > maxScroll.current) {
      maxScroll.current = percent;

      // Track scroll milestones
      if (percent >= 50 && !tracked50.current) {
        tracked50.current = true;
        trackEvent("scroll_depth", { depth: 50 });
      }
      if (percent >= 75 && !tracked75.current) {
        tracked75.current = true;
        trackEvent("scroll_depth", { depth: 75 });
      }

      // Update profile
      const scrollMap = getProfile().scrollDepth ?? {};
      scrollMap[window.location.pathname] = percent;
      updateProfile({ scrollDepth: scrollMap });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const visitorId = getVisitorId();
    incrementSession();

    // Track page view
    const pages = getProfile().pagesViewed ?? [];
    const path = window.location.pathname;
    if (!pages.includes(path)) {
      pages.push(path);
      updateProfile({ pagesViewed: pages });
    }

    // Track return visits
    const sessions = getSessionCount();
    if (sessions >= 2) {
      trackEvent("return_visit", { sessionCount: sessions });
    }

    // Track pricing page views
    if (path.includes("pricing") || path.includes("/services")) {
      trackEvent("pricing_view", { page: path });
    }

    // Track UTM params
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    if (Object.keys(utm).length > 0) {
      updateProfile({ utm });
    }

    // Update first/last seen
    if (!getProfile().firstSeen) {
      updateProfile({ firstSeen: new Date().toISOString(), visitorId });
    }
    updateProfile({ lastSeen: new Date().toISOString(), sessions });

    // Scroll tracking
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Time tracking — send on unload
    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      const totalTime = (getProfile().totalTimeOnSite ?? 0) + timeSpent;
      updateProfile({ totalTimeOnSite: totalTime });

      if (timeSpent > 30) {
        trackEvent("time_on_page", { seconds: timeSpent, totalSeconds: totalTime });
      }

      // Recompute scores
      const profile = getProfile();
      const pv = profile.pagesViewed?.length ?? 0;
      const avgScroll = Object.values(profile.scrollDepth ?? {}).reduce(
        (a: number, b: unknown) => a + (b as number), 0
      ) / Math.max(Object.keys(profile.scrollDepth ?? {}).length, 1);
      const mins = (totalTime) / 60;

      let engagement = Math.min(pv * 8, 30) + Math.min((avgScroll as number) * 0.3, 25) + Math.min(mins * 5, 25);
      if (profile.chatEngaged) engagement += 15;
      if (profile.assessmentCompleted) engagement += 20;
      engagement = Math.min(engagement, 100);

      let intent = 0;
      const highPages = (profile.pagesViewed ?? []).filter(
        (p: string) => p.includes("/services") || p.includes("/pricing") || p.includes("/assess") || p.includes("/calculator")
      ).length;
      intent += Math.min(highPages * 15, 35);
      if (profile.assessmentCompleted) intent += 25;
      if (profile.roiCalculatorUsed) intent += 20;
      if (profile.email) intent += 15;
      if (profile.phone) intent += 10;
      intent = Math.min(intent, 100);

      let urgency = 0;
      if (sessions >= 3) urgency += 30;
      else if (sessions >= 2) urgency += 15;
      if (profile.phone) urgency += 20;
      if (profile.whatsappOptIn) urgency += 15;
      urgency = Math.min(urgency, 100);

      const fit = profile.nicheInterest ? 30 : 0;
      const composite = Math.round(intent * 0.35 + engagement * 0.25 + fit * 0.25 + urgency * 0.15);

      updateProfile({
        scores: { engagement: Math.round(engagement), intent, fit, urgency, composite },
      });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [handleScroll]);

  return null; // Invisible component
}
