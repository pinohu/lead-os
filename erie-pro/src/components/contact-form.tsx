"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  name?: string;
  email?: string;
  phone?: string;
}

interface ContactFormProps {
  /** Optional hidden fields */
  nicheSlug?: string;
  providerSlug?: string;
  citySlug?: string;
  /** When set, this form is on an unclaimed directory listing page */
  listingId?: string;
  /** Label for submit button */
  submitLabel?: string;
  /** Placeholder for the message field */
  messagePlaceholder?: string;
}

export default function ContactForm({
  nicheSlug,
  providerSlug,
  citySlug,
  listingId,
  submitLabel = "Send Message",
  messagePlaceholder = "Tell us how we can help...",
}: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phoneDisplay, setPhoneDisplay] = useState("");

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
      case "name":
        return value.trim() ? undefined : "Full name is required";
      case "email":
        return isValidEmail(value) ? undefined : "Please enter a valid email address";
      case "phone":
        // Phone is optional on this form — only validate if user typed something
        if (!value.trim()) return undefined;
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

  const isFormValid = !errors.name && !errors.email && !errors.phone;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newErrors: FieldErrors = {};
    const nm = (formData.get("name") as string) ?? "";
    const em = (formData.get("email") as string) ?? "";
    const ph = (formData.get("phone") as string) ?? "";

    const nmErr = validateField("name", nm);
    const emErr = validateField("email", em);
    const phErr = validateField("phone", ph);
    if (nmErr) newErrors.name = nmErr;
    if (emErr) newErrors.email = emErr;
    if (phErr) newErrors.phone = phErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          email: em,
          phone: ph || undefined,
          message: formData.get("message"),
          niche: nicheSlug ?? formData.get("niche") ?? undefined,
          listingId: listingId ?? undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message ?? "Thank you! We'll be in touch within 24 hours.",
        });
        e.currentTarget.reset();
        setPhoneDisplay("");
        setErrors({});
      } else {
        setResult({
          success: false,
          message: data.message ?? data.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} aria-label="Contact form">
      {/* Hidden fields for routing */}
      {nicheSlug && <input type="hidden" name="niche" value={nicheSlug} />}
      {providerSlug && <input type="hidden" name="provider" value={providerSlug} />}
      {citySlug && <input type="hidden" name="city" value={citySlug} />}

      {result && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-md p-3 text-sm ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name <span className="text-destructive" aria-label="required">*</span></Label>
        <Input
          id="name"
          type="text"
          name="name"
          required
          aria-required="true"
          placeholder="John Smith"
          onBlur={(e) => handleBlur("name", e.target.value)}
          onChange={() => clearError("name")}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-destructive" aria-label="required">*</span></Label>
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
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          name="phone"
          placeholder="(814) 555-0199"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          onBlur={(e) => handleBlur("phone", e.target.value)}
        />
        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message <span className="text-destructive" aria-label="required">*</span></Label>
        <Textarea id="message" name="message" required aria-required="true" rows={4} placeholder={messagePlaceholder} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
        {loading ? "Sending..." : submitLabel}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your information is kept private and never shared without your consent.
      </p>
    </form>
  );
}
