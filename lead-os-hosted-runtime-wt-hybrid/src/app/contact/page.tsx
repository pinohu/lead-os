"use client";

import { useState } from "react";
import Link from "next/link";

type InquiryType = "sales" | "support" | "partnership" | "other";

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [inquiry, setInquiry] = useState<InquiryType>("sales");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, inquiryType: inquiry, message }),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <main id="main-content" style={{ maxWidth: "32rem", margin: "0 auto", padding: "6rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Message Sent</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Thank you for reaching out. We will get back to you within 24 hours.
        </p>
        <Link href="/" style={{ color: "#4f46e5", textDecoration: "underline" }}>
          Return home
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" style={{ maxWidth: "32rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Contact Us</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Questions about Lead OS? We would love to hear from you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="name" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
          />
        </div>

        <div>
          <label htmlFor="company" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            Company (optional)
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
          />
        </div>

        <div>
          <label htmlFor="inquiry" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            Inquiry Type
          </label>
          <select
            id="inquiry"
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value as InquiryType)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
          >
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="partnership">Partnership</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", resize: "vertical" }}
          />
        </div>

        {formState === "error" && (
          <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
            Something went wrong. Please try again or email us directly.
          </p>
        )}

        <button
          type="submit"
          disabled={formState === "submitting"}
          style={{
            padding: "0.625rem 1.5rem",
            background: formState === "submitting" ? "#9ca3af" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: 600,
            cursor: formState === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {formState === "submitting" ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          You can also reach us at{" "}
          <a href="mailto:support@leadgen-os.com" style={{ color: "#4f46e5" }}>support@leadgen-os.com</a>
          {" "}or find us on{" "}
          <a href="https://github.com/pinohu/lead-os" style={{ color: "#4f46e5" }}>GitHub</a>.
        </p>
      </div>
    </main>
  );
}
