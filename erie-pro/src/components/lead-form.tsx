"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { cityConfig } from "@/lib/city-config";

// TCPA consent text — v2 (2026-04-02). Update version when changing text.
const TCPA_TEXT = `By submitting this form, I consent to be contacted by phone, text message, or email by a service provider regarding my service request. I understand that message and data rates may apply for text messages. I can opt out at any time by replying STOP to any text message or contacting us at hello@${cityConfig.domain}.`;

// ── Validation helpers ──────────────────────────────────────────────
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v: string) {
  return v.replace(/\D/g, "").length === 10;
}
function formatPhone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface FieldErrors {
  firstName?: string;
  phone?: string;
  email?: string;
}

interface LeadFormProps {
  nicheSlug: string;
  nicheLabel: string;
  citySlug: string;
  cityName: string;
}

export default function LeadForm({ nicheSlug, nicheLabel, citySlug, cityName }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [canResubmit, setCanResubmit] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const clearError = useCallback((field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  function validateField(field: keyof FieldErrors, value: string): string | undefined {
    switch (field) {
      case "firstName":
        return value.trim() ? undefined : "First name is required";
      case "email":
        return isValidEmail(value) ? undefined : "Please enter a valid email address";
      case "phone":
        return isValidPhone(value) ? undefined : "Please enter a 10-digit phone number";
    }
  }

  function handleBlur(field: keyof FieldErrors, value: string) {
    const err = validateField(field, value);
    if (err) setErrors((prev) => ({ ...prev, [field]: err }));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setPhoneDisplay(formatted);
    clearError("phone");
  }

  const isFormValid =
    tcpaConsent &&
    !errors.firstName &&
    !errors.email &&
    !errors.phone;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newErrors: FieldErrors = {};
    const fn = (formData.get("firstName") as string) ?? "";
    const em = (formData.get("email") as string) ?? "";
    const ph = (formData.get("phone") as string) ?? "";

    const fnErr = validateField("firstName", fn);
    const emErr = validateField("email", em);
    const phErr = validateField("phone", ph);
    if (fnErr) newErrors.firstName = fnErr;
    if (emErr) newErrors.email = emErr;
    if (phErr) newErrors.phone = phErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fn,
          lastName: formData.get("lastName"),
          phone: ph,
          email: em,
          message: formData.get("message"),
          niche: nicheSlug,
          city: citySlug,
          tcpaConsent,
          tcpaConsentText: TCPA_TEXT,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: "A verified provider will contact you within 4 hours.",
        });
        formRef.current?.reset();
        setTcpaConsent(false);
        setPhoneDisplay("");
        setErrors({});
        setCanResubmit(false);
        setTimeout(() => setCanResubmit(true), 5000);
      } else {
        setResult({
          success: false,
          message: data.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="animate-in fade-in-0 duration-300 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 text-center"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
        <p className="mt-3 text-lg font-bold text-green-800 dark:text-green-300">
          Request Submitted!
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          {result.message}
        </p>
        <button
          type="button"
          disabled={!canResubmit}
          onClick={() => setResult(null)}
          className="mt-4 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} ref={formRef}>
      {result && !result.success && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
        >
          {result.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
          <Input
            id="firstName"
            type="text"
            name="firstName"
            required
            aria-required="true"
            placeholder="John"
            onBlur={(e) => handleBlur("firstName", e.target.value)}
            onChange={() => clearError("firstName")}
          />
          {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" type="text" name="lastName" placeholder="Smith" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
        <Input
          id="phone"
          type="tel"
          name="phone"
          required
          aria-required="true"
          placeholder="(814) 555-0199"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          onBlur={(e) => handleBlur("phone", e.target.value)}
        />
        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          type="email"
          name="email"
          required
          aria-required="true"
          placeholder="john@example.com"
          onBlur={(e) => handleBlur("email", e.target.value)}
          onChange={() => clearError("email")}
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">What do you need?</Label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Describe your ${nicheLabel.toLowerCase()} needs...`}
        />
      </div>

      {/* ── TCPA Consent ────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="tcpaConsent"
          checked={tcpaConsent}
          onChange={(e) => setTcpaConsent(e.target.checked)}
          required
          aria-required="true"
          className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-800"
        />
        <label htmlFor="tcpaConsent" className="text-xs text-muted-foreground leading-relaxed">
          {TCPA_TEXT}
        </label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
        {loading ? "Submitting..." : "Get My Free Quote"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No obligation. Your info goes only to verified {cityName} providers.
      </p>
    </form>
  );
}
