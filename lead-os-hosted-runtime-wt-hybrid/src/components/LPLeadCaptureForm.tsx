"use client";

import { useState, useId } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormStatus = "idle" | "submitting" | "success" | "error";

interface LPLeadCaptureFormProps {
  source: string;
  niche: string;
  businessName: string;
  accentColor: string;
}

interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

// ─── Style constants ──────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "#385145",
  marginBottom: "6px",
};

const FIELD_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: "1rem",
  color: "#14211d",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const FIELD_ERROR_STYLE: React.CSSProperties = {
  ...FIELD_STYLE,
  border: "1px solid #dc2626",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LPLeadCaptureForm({
  source,
  niche,
  businessName,
  accentColor,
}: LPLeadCaptureFormProps) {
  const baseId = useId();
  const firstNameId = `${baseId}-firstName`;
  const lastNameId = `${baseId}-lastName`;
  const emailId = `${baseId}-email`;
  const phoneId = `${baseId}-phone`;
  const serviceId = `${baseId}-service`;
  const statusId = `${baseId}-status`;
  const emailErrorId = `${baseId}-email-error`;

  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = status === "submitting";
  const emailInvalid = emailTouched && fields.email.length > 0 && !isValidEmail(fields.email);

  function setField(key: keyof FormFields) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFields((prev) => ({ ...prev, [key]: event.target.value }));
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(fields.email)) {
      setEmailTouched(true);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || undefined,
          service: fields.service.trim() || undefined,
          source,
          niche,
          family: "qualification",
          intent: "solve-now",
        }),
      });

      const payload: { success?: boolean; error?: string } = await response.json();

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Unable to connect. Please check your connection and try again.");
      setStatus("error");
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "36px 28px",
          borderRadius: "16px",
          background: "rgba(29,111,81,0.08)",
          border: "1px solid rgba(29,111,81,0.22)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "52px",
            height: "52px",
            borderRadius: "999px",
            background: "#1d6f51",
            color: "#fff",
            fontSize: "1.5rem",
            marginBottom: "16px",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
            fontSize: "1.25rem",
            color: "#14211d",
          }}
        >
          You are all set
        </h3>
        <p style={{ color: "#385145", margin: 0, lineHeight: 1.6 }}>
          We received your request and someone from {businessName} will be in touch shortly.
        </p>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Contact form"
      aria-describedby={statusId}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* First name */}
        <div>
          <label htmlFor={firstNameId} style={LABEL_STYLE}>
            First name{" "}
            <span aria-hidden="true" style={{ color: accentColor }}>*</span>
          </label>
          <input
            id={firstNameId}
            type="text"
            autoComplete="given-name"
            required
            aria-required="true"
            value={fields.firstName}
            onChange={setField("firstName")}
            style={FIELD_STYLE}
          />
        </div>

        {/* Last name */}
        <div>
          <label htmlFor={lastNameId} style={LABEL_STYLE}>
            Last name{" "}
            <span aria-hidden="true" style={{ color: accentColor }}>*</span>
          </label>
          <input
            id={lastNameId}
            type="text"
            autoComplete="family-name"
            required
            aria-required="true"
            value={fields.lastName}
            onChange={setField("lastName")}
            style={FIELD_STYLE}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor={emailId} style={LABEL_STYLE}>
            Email address{" "}
            <span aria-hidden="true" style={{ color: accentColor }}>*</span>
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-required="true"
            aria-invalid={emailInvalid ? "true" : undefined}
            aria-describedby={emailInvalid ? emailErrorId : undefined}
            value={fields.email}
            onChange={setField("email")}
            onBlur={() => setEmailTouched(true)}
            style={emailInvalid ? FIELD_ERROR_STYLE : FIELD_STYLE}
          />
          {emailInvalid ? (
            <span
              id={emailErrorId}
              role="alert"
              style={{ fontSize: "0.82rem", color: "#dc2626", marginTop: "4px", display: "block" }}
            >
              Please enter a valid email address.
            </span>
          ) : null}
        </div>

        {/* Phone (optional) */}
        <div>
          <label htmlFor={phoneId} style={LABEL_STYLE}>
            Phone number{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span>
          </label>
          <input
            id={phoneId}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={fields.phone}
            onChange={setField("phone")}
            style={FIELD_STYLE}
          />
        </div>

        {/* Service */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={serviceId} style={LABEL_STYLE}>
            Service needed{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span>
          </label>
          <input
            id={serviceId}
            type="text"
            autoComplete="off"
            placeholder={`e.g. ${niche} service`}
            value={fields.service}
            onChange={setField("service")}
            style={FIELD_STYLE}
          />
        </div>
      </div>

      {/* Status / error region */}
      <div
        id={statusId}
        role="alert"
        aria-live="polite"
        style={{ minHeight: "24px", marginBottom: errorMessage ? "16px" : "0" }}
      >
        {errorMessage ? (
          <p
            style={{
              margin: 0,
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "#dc2626",
              fontSize: "0.92rem",
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </p>
        ) : null}
      </div>

      {/* Privacy notice */}
      <p
        style={{
          fontSize: "0.78rem",
          color: "#64748b",
          marginBottom: "20px",
          lineHeight: 1.5,
        }}
      >
        By submitting, you agree to our{" "}
        <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>
          Privacy Policy
        </a>
        . We may send follow-up communications related to your inquiry. You can unsubscribe at any time.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting ? "true" : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "52px",
          padding: "14px 32px",
          borderRadius: "999px",
          border: "none",
          background: accentColor,
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: isSubmitting ? "wait" : "pointer",
          opacity: isSubmitting ? 0.75 : 1,
          boxShadow: `0 12px 24px ${accentColor}38`,
          fontFamily: "inherit",
        }}
      >
        {isSubmitting ? "Submitting\u2026" : "Get My Free Quote"}
      </button>
    </form>
  );
}
