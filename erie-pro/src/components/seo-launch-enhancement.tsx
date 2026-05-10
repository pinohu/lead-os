import Link from "next/link"
import { BadgeCheck, CalendarClock, CheckCircle2, Link2, MapPin, ShieldCheck, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSeoLaunchPlan, getSeoLaunchService, type SeoLaunchPageType } from "@/lib/seo-launch-plans"

type SeoLaunchEnhancementProps = {
  nicheSlug: string
  nicheLabel: string
  pageType: SeoLaunchPageType
}

export function SeoLaunchEnhancement({ nicheSlug, nicheLabel, pageType }: SeoLaunchEnhancementProps) {
  const plan = getSeoLaunchPlan(nicheSlug, pageType)
  if (!plan) return null

  const service = getSeoLaunchService(nicheSlug)
  const pageLinks = relatedPageLinks(nicheSlug, pageType)
  const article = buildSeoArticle({
    nicheLabel,
    pageType,
    primaryKeyword: plan.primaryKeyword,
    supportingKeywords: plan.supportingKeywords,
    serviceAreas: service?.serviceAreas ?? ["Erie", "Millcreek", "Harborcreek", "Fairview", "North East"],
  })

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-label={`${nicheLabel} Erie guide`}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Local Erie guide
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Updated {formatDate(plan.lastUpdated)}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{article.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {article.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{article.sectionsTitle}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {article.guidance.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.localProof.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold">Local checks before you choose</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[...article.localChecks, ...plan.localProof].slice(0, 6).map((proof) => (
                    <div key={proof} className="flex gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{proof}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="text-lg font-semibold">How this page uses search phrases responsibly</h2>
              <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                <p>
                  This page is written for Erie residents searching for {article.keywordPhrase}. It also covers related
                  phrases naturally, including {article.relatedPhraseList}. The goal is to answer the request clearly,
                  not repeat keywords or create near-duplicate pages.
                </p>
                <p>
                  Erie.pro does not invent reviews, ratings, prices, addresses, licensing claims, or availability. Those
                  details should only appear when they are supported by provider data or a verified source.
                </p>
              </div>
            </div>

            {plan.faqs.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold">Questions Erie residents ask</h2>
                <div className="mt-3 divide-y rounded-lg border">
                  {plan.faqs.slice(0, 4).map((faq) => (
                    <details key={faq.question} className="group p-4">
                      <summary className="cursor-pointer list-none font-medium">{faq.question}</summary>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trust standards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {article.trustStandards.concat(plan.trustSignals).slice(0, 6).map((signal) => (
                <div key={signal} className="flex gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{signal}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best-fit for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {article.bestFit.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search intents covered</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[plan.primaryKeyword, ...plan.supportingKeywords].slice(0, 6).map((phrase) => (
                  <li key={phrase} className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
                    {phrase}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Erie.pro pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}

function relatedPageLinks(nicheSlug: string, currentType: SeoLaunchPageType) {
  const links = [
    { label: "Service overview", href: `/${nicheSlug}`, type: "core" as const },
    { label: "Provider directory", href: `/${nicheSlug}/directory`, type: "directory" as const },
    { label: "Pricing guide", href: `/${nicheSlug}/pricing`, type: "pricing" as const },
    { label: "Emergency help", href: `/${nicheSlug}/emergency`, type: "emergency" as const },
    { label: "Reviews guide", href: `/${nicheSlug}/reviews`, type: "reviews" as const },
    { label: "FAQ", href: `/${nicheSlug}/faq`, type: "faq" as const },
  ]

  return links.filter((link) => link.type !== currentType)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function buildSeoArticle({
  nicheLabel,
  pageType,
  primaryKeyword,
  supportingKeywords,
  serviceAreas,
}: {
  nicheLabel: string
  pageType: SeoLaunchPageType
  primaryKeyword: string
  supportingKeywords: string[]
  serviceAreas: string[]
}) {
  const service = nicheLabel.toLowerCase()
  const areas = serviceAreas.slice(0, 5)
  const areaList = formatList(areas)
  const relatedPhraseList = formatList(supportingKeywords.slice(0, 3))

  const byType = {
    core: {
      title: `${nicheLabel} in Erie, PA: what to know before you request help`,
      sectionsTitle: `How to choose ${service} help in Erie`,
      intro: [
        `When you search for ${primaryKeyword}, you usually need a clear next step: describe the job, understand who serves your part of Erie County, and get connected without calling every company yourself.`,
        `Erie.pro is built around local matching for Erie, Millcreek, Harborcreek, and nearby communities. Use this guide to understand what to ask, what proof to check, and when a matched local provider is a good fit.`,
      ],
      guidance: [
        `Be specific about the job type, timing, location, and any access issues before requesting ${service} help.`,
        `Confirm that the provider serves ${areaList} or your specific ZIP code before you rely on availability.`,
        "Ask what is included in the estimate and what could change after the provider sees the job.",
        "Look for current contact details, service-area fit, and proof that the provider handles this kind of work.",
        "Use directory, pricing, review, and FAQ pages together instead of choosing from one signal alone.",
        "For regulated work, verify credentials directly before signing or paying.",
      ],
      bestFit: ["Homeowners comparing local options", "Small businesses that need one clear next step", "Residents who want fewer calls and less guesswork"],
    },
    emergency: {
      title: `Emergency ${nicheLabel} in Erie: what to do first`,
      sectionsTitle: `Fast steps before requesting emergency ${service} help`,
      intro: [
        `Emergency searches like ${primaryKeyword} usually mean the problem cannot wait. The right page should help you act quickly without promising fake response times or unsupported availability.`,
        `Use Erie.pro to organize the request, explain the situation clearly, and connect with a local provider when emergency service is available in Erie and nearby areas such as ${areaList}.`,
      ],
      guidance: [
        "Start with safety. If there is immediate danger, call emergency services before using any matching site.",
        "Describe what happened, when it started, and whether the issue is still getting worse.",
        "Share photos if available, but do not delay urgent safety steps just to gather details.",
        "Confirm arrival window, after-hours fees, and what the provider can actually do on the first visit.",
        "Avoid pages or providers that guarantee availability without verifying your location and job type.",
        "Save written notes about the request, estimate, and next step.",
      ],
      bestFit: ["Urgent service requests", "After-hours comparison", "Residents who need a quick handoff to a local provider"],
    },
    pricing: {
      title: `${nicheLabel} costs in Erie: how to read pricing before you request a quote`,
      sectionsTitle: `What affects ${service} pricing in Erie`,
      intro: [
        `People searching for ${primaryKeyword} usually want a realistic price range, not a surprise bill. Pricing pages should explain cost drivers and limits without pretending every job costs the same.`,
        `Use this guide to compare common Erie cost factors, then request a provider estimate based on your address, scope, timing, materials, and site conditions.`,
      ],
      guidance: [
        "Treat online price ranges as planning information until a provider reviews the job.",
        "Ask what labor, materials, trip fees, permits, disposal, and after-hours charges are included.",
        `Erie homes and buildings vary by age, access, weather exposure, and neighborhood conditions across ${areaList}.`,
        "Get the estimate in writing when possible and ask what could change the final price.",
        "Be cautious with unusually low quotes that do not explain scope, materials, or warranty terms.",
        "Do not rely on unsupported pricing claims for healthcare, legal, financial, or licensed work.",
      ],
      bestFit: ["Budget planning", "Quote comparison", "Residents trying to avoid hidden fees"],
    },
    directory: {
      title: `${nicheLabel} directory for Erie: how to compare local providers`,
      sectionsTitle: `How to use an Erie ${service} directory`,
      intro: [
        `A search for ${primaryKeyword} often starts with a list of providers, but a directory is only useful if it helps you narrow the options and verify the right fit.`,
        `Use Erie.pro directory pages to compare local service-area coverage, provider details, and next-step links for Erie, ${areas.slice(1, 3).join(", ")}, and surrounding communities.`,
      ],
      guidance: [
        "Start with providers that clearly serve your address or neighborhood.",
        "Compare service focus, hours, phone availability, and whether the job type is listed.",
        "Do not treat ratings or review counts as verified unless they come from a supported source.",
        "Use provider profiles, pricing guidance, reviews guidance, and FAQs before deciding.",
        "For licensed categories, confirm credentials directly with the provider or official source.",
        "Request a match when you want Erie.pro to help reduce the number of calls you need to make.",
      ],
      bestFit: ["Provider comparison", "Local directory browsing", "Residents deciding who to contact first"],
    },
    reviews: {
      title: `${nicheLabel} reviews in Erie: what signals are worth trusting`,
      sectionsTitle: `How to read ${service} reviews without getting misled`,
      intro: [
        `Searches like ${primaryKeyword} can be useful, but reviews need context. A good reviews page should help you judge relevance, recency, and proof instead of pushing fake ratings.`,
        `Erie.pro uses reviews guidance to help residents compare providers more carefully before requesting ${service} help in Erie County.`,
      ],
      guidance: [
        "Look for reviews that mention the specific job type, timing, communication, and follow-through.",
        "Recent reviews are usually more useful than old reviews when availability or ownership may have changed.",
        "Be cautious when a page shows ratings without a source, date, or provider identity.",
        "Match review signals with service-area fit, credentials, pricing clarity, and response expectations.",
        "Ask providers for references or examples when the job is expensive, regulated, or high risk.",
        "Do not assume a provider is best for your job just because a generic review count is high.",
      ],
      bestFit: ["Review comparison", "Trust checks", "Residents choosing between similar providers"],
    },
    faq: {
      title: `${nicheLabel} FAQ for Erie residents`,
      sectionsTitle: `Common ${service} questions before you request help`,
      intro: [
        `People searching for ${primaryKeyword} usually want quick, plain answers before they submit a request. This FAQ is designed to remove uncertainty and make the next step easier.`,
        `Use these answers to decide what information to share, what to verify, and when Erie.pro can help match your request with a local provider.`,
      ],
      guidance: [
        "Share the service needed, location, preferred timing, and any photos or details that clarify the job.",
        "Ask whether the provider serves your exact Erie-area location before assuming availability.",
        "Use pricing pages for planning, but rely on provider quotes for final numbers.",
        "Use review pages for trust signals, but avoid unsupported ratings or claims.",
        "For legal, healthcare, financial, insurance, and licensed work, verify credentials and scope carefully.",
        "Use the directory when you want to compare options before submitting a match request.",
      ],
      bestFit: ["Quick answers", "First-time requesters", "Residents who want a simple next step"],
    },
  } satisfies Record<
    SeoLaunchPageType,
    {
      title: string
      sectionsTitle: string
      intro: string[]
      guidance: string[]
      bestFit: string[]
    }
  >

  return {
    ...byType[pageType],
    keywordPhrase: primaryKeyword,
    relatedPhraseList,
    localChecks: [
      `Service area includes Erie and nearby communities such as ${areaList}.`,
      "Provider details, prices, reviews, and credentials should be verified before publication or hiring.",
    ],
    trustStandards: [
      "No fake reviews or aggregate ratings",
      "No invented addresses or service availability",
      "No guaranteed pricing without provider confirmation",
    ],
  }
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "Erie"
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}
