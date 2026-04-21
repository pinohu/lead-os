"use client";

import { useState } from "react";

export default function NodeLeadForm({ state, county, city, niche }: { state: string; county: string; city: string; niche: string }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact_form",
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          message: form.message,
          service: `${niche} service request`,
          niche,
          askingForQuote: true,
          wantsBooking: true,
          contentEngaged: true,
          metadata: {
            state,
            county,
            city,
            pageType: "directory_node",
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || json?.message || "Lead submission failed");
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 32, border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Request {niche} service in {city}</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
        <textarea placeholder={`Describe your ${niche} need`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 120 }} />
        <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 8, background: "black", color: "white" }}>
          {loading ? "Submitting..." : `Request ${niche} service`}
        </button>
      </form>

      {error ? <p style={{ color: "red", marginTop: 12 }}>{error}</p> : null}

      {result ? (
        <div style={{ marginTop: 20 }}>
          <h3>Lead processed</h3>
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
