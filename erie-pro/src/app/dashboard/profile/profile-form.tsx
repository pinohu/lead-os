"use client";

// ── Profile Edit Form ─────────────────────────────────────────────────
// Client component for editing provider profile fields.
// Submits updates to /api/provider/update via PATCH.

import { useState, type FormEvent } from "react";

interface ProfileData {
  businessName: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  yearEstablished: string;
  employeeCount: string;
  license: string;
  insurance: boolean;
  serviceAreas: string[];
  emailVerified: boolean;
}

const inputStyles =
  "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [phone, setPhone] = useState(profile.phone);
  const [website, setWebsite] = useState(profile.website);
  const [description, setDescription] = useState(profile.description);
  const [yearEstablished, setYearEstablished] = useState(profile.yearEstablished);
  const [employeeCount, setEmployeeCount] = useState(profile.employeeCount);
  const [license, setLicense] = useState(profile.license);
  const [insurance, setInsurance] = useState(profile.insurance);
  const [serviceAreasText, setServiceAreasText] = useState(
    profile.serviceAreas.join(", ")
  );

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    // Parse service areas from comma-separated text
    const serviceAreas = serviceAreasText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Build payload with only changed fields
    const payload: Record<string, unknown> = {};
    if (businessName !== profile.businessName) payload.businessName = businessName;
    if (phone !== profile.phone) payload.phone = phone;
    if (description !== profile.description) payload.description = description;
    if (employeeCount !== profile.employeeCount) payload.employeeCount = employeeCount;
    if (license !== profile.license) payload.license = license;
    if (insurance !== profile.insurance) payload.insurance = insurance;

    // Website: send null to clear, or the URL string
    const currentWebsite = website.trim() || null;
    const originalWebsite = profile.website || null;
    if (currentWebsite !== originalWebsite) payload.website = currentWebsite;

    // Service areas comparison
    const areasChanged =
      serviceAreas.length !== profile.serviceAreas.length ||
      serviceAreas.some((a, i) => a !== profile.serviceAreas[i]);
    if (areasChanged) payload.serviceAreas = serviceAreas;

    if (Object.keys(payload).length === 0) {
      setStatus("success");
      return;
    }

    try {
      const res = await fetch("/api/provider/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Failed to save changes");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Feedback Banner ──────────────────────────────────── */}
      {status === "success" && (
        <div className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Profile updated successfully.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
        </div>
      )}

      {/* ── Business Information ──────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Business Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business Name" required>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              minLength={2}
              maxLength={200}
              className={inputStyles}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              disabled
              className={`${inputStyles} opacity-60 cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
              Contact support to change your email address.
            </p>
          </Field>

          <Field label="Phone" required>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={10}
              maxLength={20}
              className={inputStyles}
            />
          </Field>

          <Field label="Website">
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              maxLength={500}
              className={inputStyles}
            />
          </Field>

          <Field label="Year Established">
            <input
              type="number"
              value={yearEstablished}
              onChange={(e) => setYearEstablished(e.target.value)}
              placeholder="e.g. 2015"
              min={1900}
              max={new Date().getFullYear()}
              className={inputStyles}
            />
          </Field>

          <Field label="Employee Count">
            <select
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              className={inputStyles}
            >
              <option value="">Select...</option>
              <option value="1">Solo (1)</option>
              <option value="2-5">2-5</option>
              <option value="6-10">6-10</option>
              <option value="11-25">11-25</option>
              <option value="26-50">26-50</option>
              <option value="51-100">51-100</option>
              <option value="100+">100+</option>
            </select>
          </Field>
        </div>

        <Field label="Business Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Describe your business, services, and what sets you apart..."
            className={`${inputStyles} resize-y`}
          />
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
            {description.length}/2000 characters
          </p>
        </Field>
      </section>

      {/* ── Service Areas ──────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Service Areas
        </h2>
        <Field label="Areas Served">
          <input
            type="text"
            value={serviceAreasText}
            onChange={(e) => setServiceAreasText(e.target.value)}
            placeholder="e.g. Erie, Millcreek, Harborcreek, Fairview"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
            Separate multiple areas with commas.
          </p>
        </Field>
      </section>

      {/* ── License & Insurance ──────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          License & Insurance
        </h2>

        <Field label="License Number">
          <input
            type="text"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="Enter your license or registration number"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">
            Displayed on your listing to build trust with customers.
          </p>
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={insurance}
            onClick={() => setInsurance(!insurance)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              insurance ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                insurance ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Insured
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-500">
            Indicates your business carries liability insurance
          </span>
        </div>
      </section>

      {/* ── Email Verification Status ──────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Verification
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-600">
              {profile.email}
            </p>
          </div>
          {profile.emailVerified ? (
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-400">
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-400">
              Not Verified
            </span>
          )}
        </div>
      </section>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
