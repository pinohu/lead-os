"use client"

import { useMemo, useState } from "react"
import { ArrowRight, BarChart3, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProviderGrowthOfferProps = {
  serviceSlug: string
  serviceLabel: string
  serviceFamily: string
}

function getCampaignParam(name: string) {
  if (typeof window === "undefined") return null
  try {
    return new URL(window.location.href).searchParams.get(name)
  } catch {
    return null
  }
}

export function ProviderGrowthOffer({
  serviceSlug,
  serviceLabel,
  serviceFamily,
}: ProviderGrowthOfferProps) {
  const [email, setEmail] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle")

  const headline = useMemo(() => {
    if (serviceFamily === "Emergency Home Response") {
      return `See how ready your ${serviceLabel.toLowerCase()} business is for urgent Erie County leads`
    }
    if (serviceFamily === "Seasonal Erie Services") {
      return `Find the best time to win more Erie County ${serviceLabel.toLowerCase()} jobs`
    }
    if (serviceFamily === "Health and Appointments") {
      return `Check whether your ${serviceLabel.toLowerCase()} intake path builds enough trust`
    }
    return `See where your ${serviceLabel.toLowerCase()} business could win more Erie County leads`
  }, [serviceFamily, serviceLabel])

  async function submitScorecard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    const response = await fetch("/api/offers/scorecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        companyName,
        websiteUrl,
        googleBusinessUrl,
        serviceSlug,
        sourcePage: window.location.href,
        sourcePageType: "niche_landing_page",
        utmSource: getCampaignParam("utm_source"),
        utmMedium: getCampaignParam("utm_medium"),
        utmCampaign: getCampaignParam("utm_campaign"),
        gclid: getCampaignParam("gclid"),
      }),
    })

    if (response.ok) {
      setStatus("sent")
      window.erieProTrackConvertBoxEvent?.("convertbox.lead_submitted", {
        actionType: "automated_offer_scorecard",
        actionLabel: "Provider requested lead readiness scorecard",
        serviceSlug,
        serviceLabel,
        family: serviceFamily,
        consumerEmail: email,
        requestSummary: `${companyName || "Provider"} requested an automated ${serviceLabel} lead readiness scorecard.`,
        consentToContact: true,
        marketingConsent: true,
        metadata: {
          offerSlug: "erie-lead-readiness-scorecard",
          websiteUrl,
          googleBusinessUrl,
        },
      })
      return
    }

    setStatus("error")
  }

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <Card className="overflow-hidden border-teal-200 bg-white shadow-sm">
        <CardContent className="grid gap-0 p-0 md:grid-cols-[1.05fr_.95fr]">
          <div className="bg-slate-950 p-6 text-white sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              Provider growth check
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{headline}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Get an automated scorecard that reviews your page, local proof, intake path, and follow-up readiness for this service category.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-200">
              {[
                "County-focused positioning",
                "Service-specific conversion gaps",
                "Recommended next offer and follow-up path",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submitScorecard} className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BarChart3 className="h-4 w-4 text-teal-700" />
              Free automated scorecard
            </div>
            <div className="space-y-2">
              <Label htmlFor={`scorecard-email-${serviceSlug}`}>Work email</Label>
              <Input
                id={`scorecard-email-${serviceSlug}`}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`scorecard-company-${serviceSlug}`}>Business name</Label>
              <Input
                id={`scorecard-company-${serviceSlug}`}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder={`${serviceLabel} business`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`scorecard-website-${serviceSlug}`}>Website</Label>
              <Input
                id={`scorecard-website-${serviceSlug}`}
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`scorecard-gbp-${serviceSlug}`}>Google Business Profile link</Label>
              <Input
                id={`scorecard-gbp-${serviceSlug}`}
                type="url"
                value={googleBusinessUrl}
                onChange={(event) => setGoogleBusinessUrl(event.target.value)}
                placeholder="https://"
              />
            </div>
            <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800" disabled={status === "submitting" || status === "sent"}>
              {status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : status === "sent" ? (
                "Scorecard queued"
              ) : (
                <>
                  Get my scorecard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {status === "sent" && (
              <p className="text-sm text-teal-700">Your scorecard is being generated and will be emailed automatically.</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600">The scorecard could not be started. Please try again.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
