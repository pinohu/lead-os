"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { ServiceRequestSuccess } from "@/components/service-request-success"
import type { ServiceRequestSubmitResponse } from "@/lib/service-requests/types"

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; result: ServiceRequestSubmitResponse }
  | { status: "error"; message: string }

export function ClientServiceRequestForm({
  businessName,
  niche,
  city,
  serviceExample,
  requestedProviderSlug,
  requestedProviderPhone,
  requestedProviderAddress,
  sourcePage,
}: {
  businessName: string
  niche: string
  city: string
  serviceExample: string
  requestedProviderSlug: string
  requestedProviderPhone?: string | null
  requestedProviderAddress?: string | null
  sourcePage: string
}) {
  const [state, setState] = useState<SubmitState>({ status: "idle" })
  const [canResubmit, setCanResubmit] = useState(true)

  async function handleSubmit(formData: FormData) {
    setState({ status: "submitting" })

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
      const response = await fetch("/api/service-requests", {
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
          requestedProviderSlug,
          requestedProviderPhone,
          requestedProviderAddress,
          sourcePage,
          routingIntent: "provider_specific",
          message: [
            `Service request for ${businessName}.`,
            `Service: ${service || serviceExample}.`,
            `Timing: ${timeline || "Not specified"}.`,
            `Vehicle location: ${location || city}.`,
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
          message: result?.error ?? "Your request could not be sent. Please check the fields and try again.",
        })
        return
      }

      setState({ status: "success", result: result as ServiceRequestSubmitResponse })
      setCanResubmit(false)
      setTimeout(() => setCanResubmit(true), 5000)
    } catch {
      setState({
        status: "error",
        message: "Your request could not be sent because the connection failed. Please try again.",
      })
    }
  }

  if (state.status === "success") {
    return (
      <div className="mt-5 space-y-4">
        <ServiceRequestSuccess result={state.result} />
        {canResubmit && (
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Send another request
          </button>
        )}
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="mt-5 grid gap-3">
      <div className="rounded-md bg-slate-950 p-4 text-white">
        <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Before you send</p>
        <p className="mt-2 text-lg font-black">Tell us what is wrong. If driving feels unsafe, call first.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="First name" name="firstName" placeholder="Jane" required />
        <FormField label="Last name" name="lastName" placeholder="Smith" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Email" name="email" placeholder="jane@example.com" type="email" required />
        <FormField label="Phone" name="phone" placeholder="814-555-0123" type="tel" />
      </div>
      <FormField label="What is going on?" name="service" placeholder={serviceExample} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Where is the vehicle?" name="location" placeholder={`${city}, PA`} />
        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="timeline">
            How soon do you need help?
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
            <option value="Routine maintenance">Routine maintenance</option>
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
          placeholder="Tell us what happened, what changed, and the best way to reach you."
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
        disabled={state.status === "submitting" || !canResubmit}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#f93355] px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Send service request
      </button>
      {state.status === "error" && (
        <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">
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
