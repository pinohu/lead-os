"use client";

import { useState } from "react";

export default function EriePlumbingDemoPage() {
  const [form, setForm] = useState({
    firstName: "John",
    lastName: "Customer",
    email: "john@example.com",
    phone: "8145550100",
    message: "Need urgent plumbing help",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(e) {
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
          service: "Emergency Plumbing",
          niche: "plumbing",
          askingForQuote: true,
          wantsBooking: true,
          contentEngaged: true,
          metadata: {
            city: "Erie",
            state: "PA",
            demo: true,
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message || "Demo submission failed");
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Live Demo</p>
        <h1 className="text-3xl font-bold mb-3">Erie Plumbing Lead Capture Demo</h1>
        <p className="text-muted-foreground">
          Submit a test plumbing request and show how your system captures the lead, scores it,
          and runs OpenClaw actions automatically.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <form onSubmit={onSubmit} className="border rounded-lg p-5 space-y-4 bg-background">
          <div>
            <label className="block text-sm font-medium mb-1">First name</label>
            <input className="w-full border rounded px-3 py-2" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last name</label>
            <input className="w-full border rounded px-3 py-2" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Problem</label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Demo Lead"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>

        <section className="border rounded-lg p-5 bg-muted/20">
          <h2 className="text-lg font-semibold mb-3">What to show the client</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground mb-6">
            <li>Submit the form as if you are a customer in Erie.</li>
            <li>Show that the lead is accepted and scored.</li>
            <li>Show the OpenClaw actions returned by the API.</li>
            <li>Explain that email, SMS, and CRM sync are triggered from the same flow.</li>
          </ol>

          <h3 className="font-medium mb-2">Latest response</h3>
          <pre className="text-xs overflow-auto rounded border bg-white p-3 min-h-[280px]">
            {result ? JSON.stringify(result, null, 2) : "No submission yet."}
          </pre>
        </section>
      </div>
    </main>
  );
}
