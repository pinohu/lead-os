"use client";

import { useState } from "react";

export default function VerificationCodeForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/verify-claim/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Verified! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className="w-32 rounded-md border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900 px-3 py-2 text-center text-lg font-mono tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={status === "loading" || status === "success"}
      />
      <button
        type="submit"
        disabled={code.length !== 6 || status === "loading" || status === "success"}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Checking..." : status === "success" ? "Verified!" : "Verify"}
      </button>
      {message && (
        <span className={`text-sm ${status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message}
        </span>
      )}
    </form>
  );
}
