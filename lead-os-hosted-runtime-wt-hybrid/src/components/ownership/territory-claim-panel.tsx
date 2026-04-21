"use client";

import { useState } from "react";

export default function TerritoryClaimPanel({ nodeId, initialState }: { nodeId: string; initialState: string }) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function claim() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ownership/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, ownerId: "demo-owner" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Claim failed");
      setState(json?.record?.state || "claimed_pending");
      setMessage("Claim submitted. Territory is under review.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  if (state === "active_exclusive") {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 20 }}>
        <h3>Territory Status</h3>
        <p>This territory is currently served by an active exclusive partner.</p>
      </div>
    );
  }

  if (state === "claimed_pending") {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 20 }}>
        <h3>Territory Status</h3>
        <p>This territory has a pending claim under review.</p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 20 }}>
      <h3>Claim this territory</h3>
      <p>Become the exclusive local partner for this node.</p>
      <button onClick={claim} disabled={loading} style={{ padding: 10, borderRadius: 8, background: "black", color: "white" }}>
        {loading ? "Submitting..." : "Claim this territory"}
      </button>
      {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}
    </div>
  );
}
