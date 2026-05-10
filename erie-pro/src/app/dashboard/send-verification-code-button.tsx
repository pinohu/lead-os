"use client";

import { useState } from "react";

export default function SendVerificationCodeButton({
  label = "Send Verification Code",
  className,
}: {
  label?: string;
  className: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendCode() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/verify-claim/send", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        setStatus("error");
        setMessage(data.error ?? "Could not send the code.");
        return;
      }

      setStatus("success");
      if (data.status === "already_verified") {
        setMessage("Already verified. Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } else if (data.status === "admin_review") {
        setMessage(data.message ?? "Sent to manual review.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(data.maskedEmail ? `Code sent to ${data.maskedEmail}.` : "Code sent.");
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={sendCode}
        disabled={status === "loading"}
        className={className}
      >
        {status === "loading" ? "Sending..." : label}
      </button>
      {message ? (
        <span
          className={`block mt-2 text-xs ${
            status === "error"
              ? "text-red-700 dark:text-red-300"
              : "text-amber-800 dark:text-amber-200"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </span>
      ) : null}
    </>
  );
}
