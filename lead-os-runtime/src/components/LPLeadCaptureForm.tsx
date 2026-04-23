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
        className="rounded-2xl border border-primary/20 bg-primary/10 px-7 py-9 text-center"
      >
        <div
          aria-hidden="true"
          className="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-2xl text-white"
        >
          ✓
        </div>
        <h3
          className="mb-2 font-serif text-xl text-foreground"
        >
          You are all set
        </h3>
        <p className="leading-relaxed text-foreground">
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
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {/* First name */}
        <div>
          <label htmlFor={firstNameId} className="mb-1.5 block text-[0.9rem] font-semibold text-foreground">
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
            className="block w-full rounded-[10px] border border-border bg-card px-4 py-3 font-inherit text-base text-foreground"
          />
        </div>

        {/* Last name */}
        <div>
          <label htmlFor={lastNameId} className="mb-1.5 block text-[0.9rem] font-semibold text-foreground">
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
            className="block w-full rounded-[10px] border border-border bg-card px-4 py-3 font-inherit text-base text-foreground"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-[0.9rem] font-semibold text-foreground">
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
            className={`block w-full rounded-[10px] border bg-card px-4 py-3 font-inherit text-base text-foreground ${emailInvalid ? "border-destructive" : "border-border"}`}
          />
          {emailInvalid ? (
            <span
              id={emailErrorId}
              role="alert"
              className="mt-1 block text-[0.82rem] text-destructive"
            >
              Please enter a valid email address.
            </span>
          ) : null}
        </div>

        {/* Phone (optional) */}
        <div>
          <label htmlFor={phoneId} className="mb-1.5 block text-[0.9rem] font-semibold text-foreground">
            Phone number{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={phoneId}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={fields.phone}
            onChange={setField("phone")}
            className="block w-full rounded-[10px] border border-border bg-card px-4 py-3 font-inherit text-base text-foreground"
          />
        </div>

        {/* Service */}
        <div className="col-span-full">
          <label htmlFor={serviceId} className="mb-1.5 block text-[0.9rem] font-semibold text-foreground">
            Service needed{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={serviceId}
            type="text"
            autoComplete="off"
            placeholder={`e.g. ${niche} service`}
            value={fields.service}
            onChange={setField("service")}
            className="block w-full rounded-[10px] border border-border bg-card px-4 py-3 font-inherit text-base text-foreground"
          />
        </div>
      </div>

      {/* Status / error region */}
      <div
        id={statusId}
        role="alert"
        aria-live="polite"
        className={`min-h-[24px] ${errorMessage ? "mb-4" : ""}`}
      >
        {errorMessage ? (
          <p className="rounded-[10px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-[0.92rem] font-semibold text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {/* Privacy notice */}
      <p className="mb-5 text-[0.78rem] leading-relaxed text-muted-foreground">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="text-inherit underline">
          Privacy Policy
        </a>
        . We may send follow-up communications related to your inquiry. You can unsubscribe at any time.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting ? "true" : undefined}
        className="inline-flex min-h-[52px] items-center justify-center rounded-full px-8 py-3.5 font-inherit text-base font-bold text-white"
        style={{
          background: accentColor,
          cursor: isSubmitting ? "wait" : "pointer",
          opacity: isSubmitting ? 0.75 : 1,
          boxShadow: `0 12px 24px ${accentColor}38`,
        }}
      >
        {isSubmitting ? "Submitting\u2026" : "Get My Free Quote"}
      </button>
    </form>
  );
}
