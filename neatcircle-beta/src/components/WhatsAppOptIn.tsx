"use client";

import { useState, useEffect } from "react";
import {
  buildTraceIntakePayload,
  ensureVisitorId,
  getStoredProfile,
  updateStoredProfile,
} from "@/lib/trace";

export default function WhatsAppOptIn() {
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const syncVisibility = () => {
      const profile = getStoredProfile();
      const shouldShow = !!profile.email && !profile.whatsappOptIn && !profile.whatsappDismissed;

      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (shouldShow) {
        timer = setTimeout(() => setVisible(true), 3000);
      } else {
        setVisible(false);
      }
    };

    syncVisibility();
    window.addEventListener("nc-profile-updated", syncVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("nc-profile-updated", syncVisibility);
    };
  }, []);

  if (!visible || submitted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);

    updateStoredProfile({ phone, whatsappOptIn: true, currentStepId: "whatsapp-optin" });

    const profile = getStoredProfile();

    fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildTraceIntakePayload({
          source: "whatsapp_optin",
          visitorId: ensureVisitorId(),
          firstName: profile.email ? String(profile.email).split("@")[0] : "Lead",
          lastName: ".",
          email: profile.email as string | undefined,
          phone,
          service: profile.nicheInterest as string | undefined,
          niche: profile.nicheInterest as string | undefined,
          page: window.location.pathname,
          metadata: { whatsappOptIn: true },
          stepId: "whatsapp-optin",
        }),
      ),
    }).catch(() => {});

    setSubmitted(true);
    setLoading(false);
  };

  const dismiss = () => {
    setVisible(false);
    updateStoredProfile({ whatsappDismissed: true });
  };

  return (
    <div className="fixed bottom-24 left-6 z-[9997] w-72 animate-[slideUp_0.3s_ease-out]">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 text-gray-600 hover:text-gray-600"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-navy">Get updates on WhatsApp</span>
        </div>

        <p className="mb-3 text-xs text-gray-500">
          98% open rate vs 22% email. Get priority updates, quick answers, and exclusive offers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect on WhatsApp"}
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] text-gray-600">
          Unsubscribe anytime by replying STOP
        </p>
      </div>
    </div>
  );
}
