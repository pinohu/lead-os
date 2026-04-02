"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2 } from "lucide-react";

const TCPA_TEXT =
  "By submitting this form, I consent to be contacted by phone, text message, or email by a service provider regarding my service request. I understand that message and data rates may apply for text messages. I can opt out at any time by replying STOP to any text message or contacting us at hello@erie.pro.";

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

interface NicheOption {
  slug: string;
  label: string;
  icon: string;
}

interface HomepageLeadFormProps {
  niches: NicheOption[];
  citySlug: string;
  cityName: string;
}

export function HomepageLeadForm({ niches, citySlug, cityName }: HomepageLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("");
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
    selectedNiche !== "" &&
    tcpaConsent &&
    !errors.firstName &&
    !errors.email &&
    !errors.phone;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedNiche) return;

    // Final validation pass
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
          niche: selectedNiche,
          city: citySlug,
          tcpaConsent,
          tcpaConsentText: TCPA_TEXT,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: "Your request has been received! A local provider will contact you shortly.",
        });
        (e.target as HTMLFormElement).reset();
        setTcpaConsent(false);
        setSelectedNiche("");
        setPhoneDisplay("");
        setErrors({});
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {result && (
        <div
          role="alert"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg p-4 text-sm ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
          }`}
        >
          {result.success && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          {result.message}
        </div>
      )}

      {/* ── Service selector ──────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="niche-select">What service do you need? <span className="text-destructive">*</span></Label>
        <select
          id="niche-select"
          value={selectedNiche}
          onChange={(e) => setSelectedNiche(e.target.value)}
          required
          aria-required="true"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select a service...</option>
          {niches.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.icon} {n.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Name fields ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hp-firstName">First name <span className="text-destructive">*</span></Label>
          <Input
            id="hp-firstName"
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
          <Label htmlFor="hp-lastName">Last name</Label>
          <Input id="hp-lastName" type="text" name="lastName" placeholder="Smith" />
        </div>
      </div>

      {/* ── Contact fields ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hp-phone">Phone <span className="text-destructive">*</span></Label>
          <Input
            id="hp-phone"
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
          <Label htmlFor="hp-email">Email <span className="text-destructive">*</span></Label>
          <Input
            id="hp-email"
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
      </div>

      {/* ── Message ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="hp-message">Describe what you need</Label>
        <textarea
          id="hp-message"
          name="message"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tell us about your project or issue..."
        />
      </div>

      {/* ── TCPA consent ──────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="hp-tcpaConsent"
          checked={tcpaConsent}
          onChange={(e) => setTcpaConsent(e.target.checked)}
          required
          aria-required="true"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="hp-tcpaConsent" className="text-xs text-muted-foreground leading-relaxed">
          {TCPA_TEXT}
        </label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
        {loading ? (
          "Submitting..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Get My Free Quote
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No obligation &middot; Free forever &middot; Only verified {cityName} providers
      </p>
    </form>
  );
}
