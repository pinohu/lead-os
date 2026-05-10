"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export function WebsitePreviewLeadForm({
  businessName,
  niche,
  city,
  serviceExample,
}: {
  businessName: string
  niche: string
  city: string
  serviceExample: string
}) {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" })

  async function handleSubmit(formData: FormData) {
    setState({ status: "submitting", message: "Sending request..." })

    const firstName = String(formData.get("firstName") ?? "").trim()
    const lastName = String(formData.get("lastName") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const service = String(formData.get("service") ?? "").trim()
    const timeline = String(formData.get("timeline") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const details = String(formData.get("details") ?? "").trim()
    const tcpaConsent = formData.get("tcpaConsent") === "on"

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          niche,
          city: city.toLowerCase(),
          provider: businessName,
          requestedProviderName: businessName,
          sourcePage: window.location.href,
          routingIntent: "provider_specific",
          message: [
            `Website preview request for ${businessName}.`,
            `Service: ${service || serviceExample}.`,
            `Timeline: ${timeline || "Not specified"}.`,
            `Location: ${location || city}.`,
            `Details: ${details || "No additional details provided."}`,
          ].join("\n"),
          tcpaConsent,
          tcpaConsentText:
            "I agree that Erie.pro and its service providers may contact me about this request by phone, text, or email. Consent is not required to buy services.",
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.success) {
        setState({
          status: "error",
          message: result?.error ?? "The request could not be sent. Please check the fields and try again.",
        })
        return
      }

      setState({
        status: "success",
        message: "Request received. The live version tracks this lead through routing, response, and follow-up.",
      })
    } catch {
      setState({
        status: "error",
        message: "The request could not be sent because the connection failed. Please try again.",
      })
    }
  }

  return (
    <form action={handleSubmit} className="mt-5 grid gap-3">
      <div className="rounded-md bg-slate-950 p-4 text-white">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Route</p>
            <p className="mt-1 text-lg font-black">Qualified lead</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Captured</p>
            <p className="mt-1 text-lg font-black">Need + timing</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Next step</p>
            <p className="mt-1 text-lg font-black">Call or quote</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="First name" name="firstName" placeholder="Jane" required />
        <FormField label="Last name" name="lastName" placeholder="Smith" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Email" name="email" placeholder="jane@example.com" type="email" required />
        <FormField label="Phone" name="phone" placeholder="814-555-0123" type="tel" />
      </div>
      <FormField label="What do you need?" name="service" placeholder={serviceExample} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Where is the job?" name="location" placeholder={`${city}, PA`} />
        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="timeline">
            How soon?
          </label>
          <select
            id="timeline"
            name="timeline"
            className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 outline-none ring-[#f93355]/20 focus:border-[#f93355] focus:ring-4"
            defaultValue=""
          >
            <option value="" disabled>Choose timing</option>
            <option value="Emergency">Emergency</option>
            <option value="Today">Today</option>
            <option value="This week">This week</option>
            <option value="Planning ahead">Planning ahead</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="details">
          Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 outline-none ring-[#f93355]/20 focus:border-[#f93355] focus:ring-4"
          placeholder="Tell us what happened, where you are, and the best way to reach you."
        />
      </div>
      <label className="flex gap-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <input name="tcpaConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#f93355]" />
        <span>
          I agree that Erie.pro and its service providers may contact me about this request by phone, text, or email. Consent is not required to buy services.
        </span>
      </label>
      <button
        type="submit"
        disabled={state.status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#f93355] px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Request a quote
      </button>
      {state.message && (
        <div
          className={`flex gap-2 rounded-md p-3 text-sm font-semibold ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-800"
              : state.status === "error"
                ? "bg-red-50 text-red-800"
                : "bg-slate-50 text-slate-700"
          }`}
        >
          {state.status === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {state.message}
        </div>
      )}
    </form>
  )
}

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string
  name: string
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 outline-none ring-[#f93355]/20 focus:border-[#f93355] focus:ring-4"
        placeholder={placeholder}
      />
    </div>
  )
}
