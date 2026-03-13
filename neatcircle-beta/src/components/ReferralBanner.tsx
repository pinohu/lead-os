"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/site-config";

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}");
  } catch {
    return {};
  }
}

export default function ReferralBanner() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncVisibility = () => {
      const profile = getProfile();
      const nextVisible = !!profile.email || profile.sessions >= 3;
      setVisible(nextVisible);
      setEmail(profile.email ?? "");
    };

    syncVisibility();
    window.addEventListener("nc-profile-updated", syncVisibility);

    return () => {
      window.removeEventListener("nc-profile-updated", syncVisibility);
    };
  }, []);

  if (!visible) return null;

  const referralLink = email
    ? `${siteConfig.siteUrl}/?ref=${btoa(email).slice(0, 12)}`
    : `${siteConfig.siteUrl}/?ref=share`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: localStorage.getItem("nc_visitor_id") ?? "",
          type: "referral_click",
          page: window.location.pathname,
          data: { action: "copy_link", email: email || undefined },
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="border-t border-cyan/20 bg-gradient-to-r from-navy to-navy-light py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-cyan-light">
            Know someone who could benefit?
          </p>
          <p className="text-xs text-gray-300">
            Share {siteConfig.brandName} and both you and your referral get priority support + 10% off.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="rounded bg-navy-dark px-3 py-2 text-xs text-cyan-light">
            {referralLink.length > 40 ? referralLink.slice(0, 37) + "..." : referralLink}
          </code>
          <button
            onClick={handleCopy}
            className="rounded-lg bg-cyan px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-dark"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </section>
  );
}
