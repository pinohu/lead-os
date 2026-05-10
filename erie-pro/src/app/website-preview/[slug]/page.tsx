import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  DollarSign,
  FileText,
  Gauge,
  Image as ImageIcon,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { serviceLabelForNiche, websitePackages } from "@/lib/website-opportunities"
import { TrackedPhoneLink } from "@/components/tracked-phone-link"
import { WebsitePreviewLeadForm } from "./WebsitePreviewLeadForm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Website Preview | ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

type PreviewRow = {
  businessName: string
  slug: string
  niche: string
  phone: string | null
  addressCity: string | null
  addressState: string | null
  rating: number | null
  reviewCount: number
  categories: string[]
  photoRefs: string[]
  servicesOffered: string[]
  status: string
  score: number
}

type ServiceIntent = {
  name: string
  problem: string
  customerStep: string
  seoPhrase: string
}

const erieAreas = [
  "Erie",
  "Millcreek",
  "Fairview",
  "Harborcreek",
  "Girard",
  "North East",
  "Edinboro",
  "Waterford",
  "Summit Township",
  "Wesleyville",
  "Lawrence Park",
  "Presque Isle",
]

const serviceIntentMap: Record<string, ServiceIntent[]> = {
  towing: [
    {
      name: "Roadside assistance",
      problem: "Drivers need fast help when the car will not start, a tire fails, or they are stuck away from home.",
      customerStep: "Call now, share your location, and describe the vehicle issue.",
      seoPhrase: "roadside assistance Erie PA",
    },
    {
      name: "Local towing",
      problem: "Customers want a tow without calling several companies or wondering who serves their part of Erie County.",
      customerStep: "Request a tow, confirm the pickup spot, and choose the destination.",
      seoPhrase: "towing company in Erie PA",
    },
    {
      name: "Jump starts",
      problem: "A dead battery can block work, school, travel, or a medical appointment.",
      customerStep: "Tell the dispatcher the vehicle type, parking location, and whether the hood opens.",
      seoPhrase: "car jump start Erie PA",
    },
    {
      name: "Flat tire help",
      problem: "Drivers need safe help on local roads, parking lots, and highway shoulders.",
      customerStep: "Share whether you have a spare tire and where the vehicle is parked.",
      seoPhrase: "flat tire help Erie PA",
    },
    {
      name: "Lockout support",
      problem: "People need clear expectations when keys are locked inside a vehicle.",
      customerStep: "Confirm vehicle make, exact location, and proof of ownership when requested.",
      seoPhrase: "car lockout service Erie PA",
    },
    {
      name: "Accident recovery coordination",
      problem: "After a collision, customers need calm next steps and reliable routing.",
      customerStep: "Call first if safe, then share the scene location and destination request.",
      seoPhrase: "accident towing Erie PA",
    },
  ],
  plumbing: [
    {
      name: "Leak repair",
      problem: "Homeowners need to stop water damage before a small leak becomes expensive.",
      customerStep: "Turn off water if possible, take a photo, and request help.",
      seoPhrase: "plumber for leak repair Erie PA",
    },
    {
      name: "Drain cleaning",
      problem: "Slow, clogged, or backed-up drains create health and property risks.",
      customerStep: "Describe which fixtures are affected and when the problem started.",
      seoPhrase: "drain cleaning Erie PA",
    },
    {
      name: "Water heater service",
      problem: "No hot water disrupts showers, laundry, cleaning, and business operations.",
      customerStep: "Share tank type, age if known, and whether there is leaking.",
      seoPhrase: "water heater repair Erie PA",
    },
    {
      name: "Fixture installation",
      problem: "Customers want faucets, toilets, sinks, and valves installed correctly.",
      customerStep: "Send fixture type, location, and whether parts are already purchased.",
      seoPhrase: "plumbing fixture installation Erie PA",
    },
    {
      name: "Pipe repair",
      problem: "Frozen, corroded, or damaged pipes need careful diagnosis.",
      customerStep: "Explain visible water, wall/ceiling damage, and shutoff access.",
      seoPhrase: "pipe repair Erie PA",
    },
    {
      name: "Emergency plumbing calls",
      problem: "Urgent water or sewer problems need simple instructions and fast routing.",
      customerStep: "Call immediately and use the form only if the issue is not active flooding.",
      seoPhrase: "emergency plumber Erie PA",
    },
  ],
}

function getServiceIntents(listing: PreviewRow, serviceLabel: string): ServiceIntent[] {
  const mapped = serviceIntentMap[listing.niche]
  if (mapped) return mapped

  const sourceItems = [...(listing.servicesOffered ?? []), ...(listing.categories ?? [])]
    .filter(Boolean)
    .filter((item) => !item.toLowerCase().includes("point of interest"))
    .slice(0, 6)

  const names =
    sourceItems.length >= 4
      ? sourceItems
      : [
          `${serviceLabel} appointments`,
          `${serviceLabel} estimates`,
          `${serviceLabel} repair inquiries`,
          `${serviceLabel} maintenance`,
          `${serviceLabel} project planning`,
          `${serviceLabel} local support`,
        ]

  return names.map((name) => ({
    name,
    problem: `Customers searching for ${name.toLowerCase()} need fast clarity, trust, and an easy way to request help.`,
    customerStep: "Use the call button or request form with the service needed, location, timing, and contact preference.",
    seoPhrase: `${name.toLowerCase()} ${listing.addressCity ?? "Erie"} PA`,
  }))
}

function getLocalProof(listing: PreviewRow) {
  return [
    {
      label: "Local presence",
      value: `${listing.addressCity ?? "Erie"}, ${listing.addressState ?? "PA"}`,
      detail: "Public local listing found for this market.",
    },
    {
      label: "Phone readiness",
      value: listing.phone ? "Callable" : "Needs confirmation",
      detail: listing.phone ? "Phone number is available for tap-to-call routing." : "Owner should confirm contact routing before launch.",
    },
    {
      label: "Review footprint",
      value: `${listing.reviewCount} reviews`,
      detail: "Public review count should be verified before final publication.",
    },
    {
      label: "Rating signal",
      value: listing.rating ? listing.rating.toFixed(1) : "N/A",
      detail: "Ratings are shown only as public-data signals, not invented testimonials.",
    },
  ]
}

function getFaqs(businessName: string, serviceLabel: string, city: string) {
  return [
    {
      question: `Does ${businessName} serve ${city}, PA?`,
      answer: `This preview is based on public local directory data for a ${serviceLabel.toLowerCase()} provider in the ${city} area. The owner should claim the page to confirm exact cities, ZIP codes, hours, and service limits.`,
    },
    {
      question: "What should a customer do first?",
      answer: "If the need is urgent, call. If it can wait, use the quote request flow with the service needed, location, timeline, photos if available, and preferred contact method.",
    },
    {
      question: "Can pricing be shown on this page?",
      answer: "Yes, but only as owner-approved guidance. The final site should explain what affects cost, what information is needed for an estimate, and when an in-person diagnosis is required.",
    },
    {
      question: `Is this the official website for ${businessName}?`,
      answer: `Not yet. This is an Erie.pro preview. It becomes official only after the business owner reviews, claims, edits, and approves it.`,
    },
    {
      question: "How does the finished page help with SEO?",
      answer: "The finished version combines one-page depth, service-intent sections, Erie-area content, schema-safe structured data, internal links from Erie.pro, image optimization, fast mobile performance, and monthly updates.",
    },
    {
      question: "How does the finished page prove ROI?",
      answer: "The finished version should track calls, form submissions, conversion rate, top queries, organic entrances, missed calls, and lead quality so the owner sees what the site is doing.",
    },
  ]
}

function getPhotoUrl(ref: string) {
  return `/api/places-photo?ref=${encodeURIComponent(ref)}&w=1200`
}

export default async function WebsitePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const rows = await prisma.$queryRawUnsafe<PreviewRow[]>(
    `
      SELECT
        dl."businessName",
        dl.slug,
        dl.niche,
        dl.phone,
        dl."addressCity",
        dl."addressState",
        dl.rating,
        dl."reviewCount",
        dl.categories,
        dl."photoRefs",
        dl."servicesOffered",
        wo.status,
        wo.score
      FROM website_opportunities wo
      JOIN directory_listings dl ON dl.id = wo.listing_id
      WHERE dl.slug = $1
      LIMIT 1
    `,
    slug
  )

  const listing = rows[0]
  if (!listing) notFound()

  const serviceLabel = serviceLabelForNiche(listing.niche)
  const serviceIntents = getServiceIntents(listing, serviceLabel)
  const localProof = getLocalProof(listing)
  const city = listing.addressCity ?? "Erie"
  const state = listing.addressState ?? "PA"
  const faqs = getFaqs(listing.businessName, serviceLabel, city)
  const premiumPackage = websitePackages[2]
  const topPhotoRefs = (listing.photoRefs ?? []).slice(0, 3)
  const coreKeywords = [
    `${serviceLabel} ${city} PA`,
    `${serviceLabel} near me`,
    `best ${serviceLabel.toLowerCase()} ${city}`,
    `${serviceLabel.toLowerCase()} quotes ${city} PA`,
    `${serviceLabel.toLowerCase()} company Erie County`,
    ...serviceIntents.slice(0, 4).map((service) => service.seoPhrase),
  ]
  const valueSystems = [
    {
      title: "Acquisition",
      value: "Search, local-pack, direct, and Erie.pro referral demand captured on one URL.",
      detail: "The page is structured around urgent and planned customer intent so traffic has somewhere useful to land.",
    },
    {
      title: "Conversion",
      value: "Tap-to-call, quote intake, service triage, consent capture, and lead context.",
      detail: "A visitor should know whether to call, request help, or claim the site without needing instruction.",
    },
    {
      title: "Operations",
      value: "Lead routing, response tracking, owner approval, correction/removal, and launch controls.",
      detail: "The site is designed to become part of a business workflow, not just a public brochure.",
    },
    {
      title: "Optimization",
      value: "Rankings, calls, forms, queries, refresh cadence, and monthly improvement backlog.",
      detail: "The site becomes more valuable when performance data turns into concrete updates.",
    },
  ]
  const monthlyOperatingPlan = [
    "Refresh top service section with seasonal demand, new photos, and current customer questions.",
    "Review Search Console queries and add missing explanations where customer intent is clear.",
    "Audit calls/forms for missed-lead causes, response time, and weak qualification fields.",
    "Update proof: photos, policies, service areas, review references, and verified credentials.",
    "Check page speed, mobile layout, tap targets, schema validity, and broken links.",
    "Create one owner-approved offer or service note that reflects current capacity.",
  ]
  const salesEnablement = [
    "Lead notification with service, location, timeline, and customer message.",
    "Suggested callback script for urgent, same-day, and planned requests.",
    "Missed-call recovery expectation with response-time logging.",
    "Lead-quality review so bad-fit requests improve the page instead of wasting time.",
  ]
  const executiveMetrics = [
    { label: "Primary conversion", value: "Call + quote", detail: "Two clear actions above the fold." },
    { label: "Search surface", value: "One URL", detail: "Service, area, proof, FAQ, and article depth." },
    { label: "Sales routing", value: "Lead OS", detail: "Lead context captured before owner handoff." },
    { label: "Governance", value: "Approval gated", detail: "No unsupported claims go live." },
  ]
  const valueLedger = [
    {
      item: "One-page acquisition strategy",
      value: "$7,500",
      detail: "Search intent map, conversion hierarchy, trust architecture, and Erie-area positioning.",
    },
    {
      item: "Premium UX and conversion build",
      value: "$12,500",
      detail: "Mobile-first funnel, tap-to-call flow, quote intake, urgent/planned routing, and CTA system.",
    },
    {
      item: "Local SEO and content system",
      value: "$10,000",
      detail: "Keyword clusters, service sections, FAQ schema, internal-link plan, and refresh cadence.",
    },
    {
      item: "Lead operations and measurement",
      value: "$12,500",
      detail: "Lead capture, consent, routing context, call/form metrics, reporting model, and optimization loop.",
    },
    {
      item: "Trust, reputation, and compliance layer",
      value: "$7,500",
      detail: "Proof governance, owner approval, photo requirements, claim controls, and no-fake-claims policy.",
    },
  ]
  const launchSprints = [
    ["Sprint 1", "Verify", "Owner confirms business facts, service areas, contact routing, and claim status."],
    ["Sprint 2", "Prove", "Photos, policies, credentials, reviews, project examples, and trust claims are approved."],
    ["Sprint 3", "Launch", "Analytics, schema, sitemap, call tracking, lead routing, speed, and mobile QA are verified."],
    ["Sprint 4", "Optimize", "Queries, calls, forms, missed leads, and customer objections drive monthly updates."],
  ]
  const transformationRows = [
    {
      before: "Customers see a listing with no real website.",
      after: "Customers see a complete, trustworthy local service experience before they call.",
    },
    {
      before: "Calls arrive with little context and weak qualification.",
      after: "Leads arrive with need, location, timing, contact preference, and consent.",
    },
    {
      before: "SEO depends on a third-party profile and scattered directory mentions.",
      after: "Search demand has one owner-approved page with service, area, FAQ, proof, and schema structure.",
    },
    {
      before: "The business cannot explain what the website produced.",
      after: "Calls, forms, queries, lead quality, and refresh work are visible in a monthly operating loop.",
    },
  ]
  const readinessScore = [
    ["Conversion clarity", 92, "Call and quote paths are above the fold and repeated at decision points."],
    ["Search architecture", 88, "Service intents, Erie-area copy, FAQ schema, and keyword clusters are mapped to one URL."],
    ["Trust foundation", 84, "Public signals are visible, but final credentials and proof must be owner-approved."],
    ["Operational wiring", 90, "Lead intake is functional, and final owner routing is gated by claim verification."],
  ]
  const moatItems = [
    "One-page depth without doorway-page risk.",
    "Erie.pro internal authority and directory context.",
    "Owner approval gate that protects trust and search quality.",
    "Lead data loop that turns weak inquiries into better copy and stronger qualification.",
    "Monthly refresh cadence so the page does not decay after launch.",
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${listing.businessName} website preview`,
        description: `Unclaimed Erie.pro preview website for ${listing.businessName}, a ${serviceLabel.toLowerCase()} provider serving ${city}, ${state}.`,
        isPartOf: {
          "@type": "WebSite",
          name: cityConfig.domain,
          url: `https://${cityConfig.domain}`,
        },
      },
      {
        "@type": "Service",
        name: serviceLabel,
        areaServed: erieAreas.map((area) => ({
          "@type": "City",
          name: area,
        })),
        provider: {
          "@type": "Organization",
          name: `${listing.businessName} website preview`,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#080d14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#0b111a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0 text-lg font-black tracking-normal">
            erie.pro
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-300 lg:flex">
            <a href="#request" className="hover:text-white">Request</a>
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#proof" className="hover:text-white">Proof</a>
            <a href="#seo" className="hover:text-white">SEO</a>
            <a href="#roi" className="hover:text-white">ROI</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex min-w-0 items-center gap-2">
            {listing.phone && (
              <TrackedPhoneLink
                phone={listing.phone}
                className="hidden rounded-md border border-white/15 px-3 py-2 text-sm font-bold text-white hover:bg-white/10 sm:inline-flex"
                serviceNiche={listing.niche}
                serviceSlug={listing.niche}
                sourcePageType="website_preview"
                requestedProviderName={listing.businessName}
                requestedProviderSlug={listing.slug}
              >
                Call
              </TrackedPhoneLink>
            )}
            <Link href={`/website-preview/${listing.slug}/claim`} className="rounded-md bg-[#f93355] px-3 py-2 text-sm font-black text-white hover:bg-[#ff4968]">
              Claim Site
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(249,51,85,0.2),transparent_36%),linear-gradient(180deg,#0b111a,#080d14)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-100">
              <ShieldCheck className="h-4 w-4" />
              Private one-page revenue prototype. Owner approval required.
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              {listing.businessName}
            </h1>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-slate-100">
              A single-page acquisition system for {serviceLabel.toLowerCase()} customers in {city}, {state}.
            </p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Built as a premium local revenue asset: executive positioning, urgent-call clarity, quote intake, service depth, proof governance, local SEO content, lead operations, and owner-controlled launch readiness on one URL.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              {listing.phone && (
                <TrackedPhoneLink
                  phone={listing.phone}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-black text-slate-950"
                  serviceNiche={listing.niche}
                  serviceSlug={listing.niche}
                  sourcePageType="website_preview"
                  requestedProviderName={listing.businessName}
                  requestedProviderSlug={listing.slug}
                >
                  <Phone className="h-4 w-4" />
                  {listing.phone}
                </TrackedPhoneLink>
              )}
              <a href="#request" className="inline-flex items-center gap-2 rounded-md bg-[#f93355] px-5 py-3 font-black text-white hover:bg-[#ff4968]">
                Start the lead flow
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href={`/website-preview/${listing.slug}/claim`} className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 font-black text-white hover:bg-white/10">
                Claim and edit
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricCard icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} label="Public Rating" value={listing.rating?.toFixed(1) ?? "N/A"} detail={`${listing.reviewCount} public reviews`} />
              <MetricCard icon={<MapPin className="h-4 w-4 text-[#f93355]" />} label="Local Market" value={city} detail={`${state} service visibility`} />
              <MetricCard icon={<Sparkles className="h-4 w-4 text-blue-300" />} label="Preview Score" value={String(listing.score)} detail="Erie.pro opportunity score" />
            </div>

            <div className="mt-8 rounded-md border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-blue-100">
                <BriefcaseBusiness className="h-4 w-4" />
                Executive brief
              </div>
              <p className="mt-3 text-lg font-black leading-7 text-white">
                This is the sales floor, SEO hub, lead desk, trust center, and launch dashboard compressed into one page.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {executiveMetrics.map((metric) => (
                  <div key={metric.label} className="border-l-2 border-[#f93355] pl-4">
                    <p className="text-sm font-bold text-slate-400">{metric.label}</p>
                    <p className="mt-1 text-2xl font-black">{metric.value}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside id="request" className="rounded-md border border-white/10 bg-white p-5 text-slate-950 shadow-2xl sm:p-6">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#f93355]">
              <Target className="h-4 w-4" />
              Functional lead capture
            </div>
            <h2 className="mt-2 text-3xl font-black">Get help from {listing.businessName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is the above-the-fold conversion module a customer should see immediately. The form uses Erie.pro lead routing and consent capture; owner-specific routing is completed after claim and verification.
            </p>
            <WebsitePreviewLeadForm
              businessName={listing.businessName}
              niche={listing.niche}
              city={city}
              serviceExample={serviceIntents[0]?.name ?? serviceLabel}
            />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Preview mode: official business ownership, claims, service availability, and final routing still require business-owner approval.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b111a]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-4">
          {[
            "Call and quote CTAs visible in seconds",
            "One-page SEO architecture with anchors",
            "Owner-approved claims before publishing",
            "Tracking plan for calls, forms, and rankings",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#080d14]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 rounded-md border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-sm font-black text-emerald-100">
                <Award className="h-4 w-4" />
                $50,000+ one-page build case
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-normal text-white sm:text-5xl">
                The buyer is not buying a page. They are buying a deployable local growth machine.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                The page must package strategy, design, conversion, SEO, operations, analytics, reputation, compliance, and monthly improvement into one coherent asset. That is the difference between a website and an acquisition system.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <CommandStat icon={<DollarSign className="h-5 w-5" />} label="Value thesis" value="$50k+" />
                <CommandStat icon={<Rocket className="h-5 w-5" />} label="Launch model" value="4 sprints" />
                <CommandStat icon={<LockKeyhole className="h-5 w-5" />} label="Risk control" value="Verified" />
              </div>
            </div>
            <div className="rounded-md bg-white p-5 text-slate-950">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Revenue command center</p>
                  <h3 className="mt-1 text-2xl font-black">What the page controls</h3>
                </div>
                <Database className="h-8 w-8 text-slate-400" />
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  ["Demand", "Organic search, Erie.pro referrals, direct visits, and mobile callers."],
                  ["Decision", "Proof, service fit, urgency triage, FAQs, and trust safeguards."],
                  ["Action", "Tap-to-call, quote request, owner claim, correction, and removal."],
                  ["Learning", "Queries, calls, forms, lead quality, missed leads, and monthly fixes."],
                ].map(([label, detail]) => (
                  <div key={label} className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-[120px_1fr]">
                    <p className="font-black text-slate-950">{label}</p>
                    <p className="text-sm leading-6 text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionHeader
              eyebrow="Transformation"
              title="The asset changes how the business is perceived before the first call"
              text="A premium one-pager has to create immediate confidence for customers and immediate clarity for the business owner."
            />
            <div className="mt-6 rounded-md bg-slate-950 p-5 text-white">
              <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Positioning shift</p>
              <p className="mt-2 text-2xl font-black">From invisible or incomplete to obvious, credible, and easy to hire.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {transformationRows.map((row) => (
              <div key={row.before} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div className="rounded-md bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Before</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{row.before}</p>
                </div>
                <div className="rounded-md bg-slate-950 p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-300">After</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{row.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <SectionHeader
              eyebrow="Readiness scorecard"
              title="Premium pricing requires visible readiness, not vibes"
              text="This scorecard shows where the one-page asset is strong now and where owner verification must close the remaining gap before official launch."
            />
            <div className="mt-8 grid gap-4">
              {readinessScore.map(([label, score, detail]) => (
                <div key={label} className="rounded-md border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-black">{label}</h3>
                    <span className="text-2xl font-black text-[#f93355]">{score}/100</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#f93355]" style={{ width: `${score}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-md bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-blue-100">
              <ShieldCheck className="h-4 w-4" />
              Competitive moat
            </div>
            <h3 className="mt-3 text-3xl font-black">What competitors cannot copy quickly</h3>
            <div className="mt-6 grid gap-3">
              {moatItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-14">
          <SectionHeader
            eyebrow="$50k+ value architecture"
            title="The page is priced as a business system, not a design file"
            text="A one-page website can justify a premium price only when it captures demand, converts demand, routes demand, and improves from real performance data."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {valueSystems.map((system) => (
              <article key={system.title} className="rounded-md border border-slate-200 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-black">{system.title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{system.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{system.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Value ledger"
              title="The $50,000+ scope is visible, itemized, and operational"
              text="This is not a claim that every preview is automatically worth this. It is the scope the asset must satisfy before being sold at that tier."
            />
            <div className="mt-6 rounded-md bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-slate-300">Target finished-system value</p>
              <p className="mt-1 text-5xl font-black">$50,000+</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Requires owner-approved facts, real proof, tracking, launch QA, and ongoing optimization.
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {valueLedger.map((row) => (
              <div key={row.item} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 md:grid-cols-[120px_1fr]">
                <div className="text-2xl font-black text-[#f93355]">{row.value}</div>
                <div>
                  <h3 className="text-lg font-black">{row.item}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-14">
          <SectionHeader
            eyebrow="Service menu"
            title="The single page carries the depth of multiple service pages"
            text={`Each section targets a real ${serviceLabel.toLowerCase()} search intent while giving customers plain-language next steps.`}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceIntents.map((service) => (
              <article key={service.name} className="rounded-md border border-slate-200 p-5">
                <Wrench className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{service.name}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500">{service.seoPhrase}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.problem}</p>
                <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  Customer step: {service.customerStep}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeader
              eyebrow="Emergency clarity"
              title="Customers should know what to do within two seconds"
              text="The page must separate urgent calls from normal quote requests so the customer does not freeze, browse, or leave."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {listing.phone && (
                <TrackedPhoneLink
                  phone={listing.phone}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 font-black text-white"
                  serviceNiche={listing.niche}
                  serviceSlug={listing.niche}
                  sourcePageType="website_preview"
                  requestedProviderName={listing.businessName}
                  requestedProviderSlug={listing.slug}
                >
                  <Phone className="h-4 w-4" />
                  Call now
                </TrackedPhoneLink>
              )}
              <a href="#request" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 font-black text-slate-950">
                Request help
              </a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Call", "Best for urgent, unsafe, time-sensitive, or active damage situations."],
              ["Request", "Best for estimates, non-urgent service, planned projects, and follow-up questions."],
              ["Qualify", "The intake asks for service, location, timing, photos, and contact preference."],
              ["Route", "The live version sends the lead to the owner with tracking and response records."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Reputation engine"
              title="Trust proof becomes a managed asset"
              text="The one-page site should help the owner turn real work into proof without inventing reviews or unsupported claims."
            />
            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
              Final review excerpts, ratings, badges, warranties, licensing, and insurance language should publish only after source verification and owner approval.
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Review capture", "Ask satisfied customers for feedback after completed work, with opt-out and platform rules respected."],
              ["Proof library", "Store before/after photos, job notes, service area examples, and owner-approved case snippets."],
              ["Objection handling", "Answer price, response time, availability, service limits, and warranty questions before the call."],
              ["Trust governance", "Flag stale claims, outdated hours, old photos, unsupported badges, and unverifiable promises."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 p-5">
                <BadgeCheck className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="border-y border-white/10 bg-[#0b111a]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Trust center"
              title="Strong enough to earn the click, honest enough to earn the customer"
              text="The preview uses public facts and labels unverified items clearly. The owner-approved version should add real photos, team details, guarantees, policies, credentials, and project proof."
              dark
            />
            <div className="mt-6 rounded-md border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-slate-300">
              No fake reviews, no fake licensing claims, no fake emergency availability, and no invented guarantees. Trust must be earned with verified data.
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {localProof.map((proof) => (
              <div key={proof.label} className="rounded-md border border-white/10 bg-white/[0.04] p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="mt-3 text-sm font-bold text-slate-400">{proof.label}</p>
                <p className="mt-1 text-2xl font-black">{proof.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{proof.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Visual proof"
            title="Photos should prove the business is real"
            text="A $50,000-level page cannot rely on generic visuals. It needs owner-approved photos, vehicles, people, tools, job sites, finished work, and local context."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {topPhotoRefs.length > 0
              ? topPhotoRefs.map((ref, index) => (
                  <div key={ref} className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <img
                      src={getPhotoUrl(ref)}
                      alt={`${listing.businessName} public listing photo ${index + 1}`}
                      className="h-56 w-full object-cover"
                    />
                    <div className="p-4 text-sm font-semibold text-slate-600">
                      Public listing photo. Owner should approve and replace with optimized assets.
                    </div>
                  </div>
                ))
              : ["Team photo", "Work photo", "Vehicle or storefront photo"].map((item) => (
                  <div key={item} className="flex h-72 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                    <h3 className="mt-4 text-xl font-black">{item}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Required before final launch for a premium, trustworthy page.
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section id="seo" className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="SEO article built into the page"
              title={`${serviceLabel} in ${city}, PA`}
              text={`This section gives the one-page website enough local depth to answer customer questions and support organic search without spinning doorway pages.`}
            />
            <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
              <p>
                Customers searching for {serviceLabel.toLowerCase()} in {city}, PA usually want three things: a provider who serves their area, a simple way to request help, and enough proof to feel safe making contact. This one-page website is structured around those needs instead of forcing visitors through a maze of separate pages.
              </p>
              <p>
                The finished version should describe the most common service requests, explain what affects price and timing, show real local proof, and guide customers toward the right action: call now for urgent help or request a quote for planned work.
              </p>
              <p>
                For SEO, the page should be refreshed with owner-approved service details, Erie-area examples, image alt text, internal links from Erie.pro directory pages, schema-safe markup, and helpful FAQs based on real customer questions.
              </p>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#f93355]">
              <Search className="h-4 w-4" />
              Keyword targets
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {coreKeywords.map((keyword) => (
                <span key={keyword} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              {[
                "Primary keyword in title, H1, intro, service sections, and FAQ where natural.",
                "Supporting keyphrases assigned to visible sections, not hidden stuffing.",
                "Schema kept honest: WebPage, Service, FAQPage, and owner-approved LocalBusiness only after claim.",
                "Canonical kept on the approved page; preview remains noindex until official.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-md bg-slate-50 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="areas" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Service area"
            title="Erie-area coverage without doorway-page risk"
            text="The live page should mention service areas only when the business actually serves them, and each area reference should help customers make a decision."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {erieAreas.map((area) => (
              <div key={area} className="rounded-md border border-slate-200 p-4 text-center font-black">
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b111a]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Customer journey"
            title="A complete sales process on one page"
            text="The point is not to impress the visitor with volume. The point is to remove doubt and make the next step obvious."
            dark
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {[
              {
                icon: <MessageSquareText className="h-5 w-5" />,
                title: "Request",
                text: "Customer describes the job, timeline, location, and contact preference.",
              },
              {
                icon: <ClipboardCheck className="h-5 w-5" />,
                title: "Qualify",
                text: "The page collects enough information to judge urgency and service fit.",
              },
              {
                icon: <CalendarCheck className="h-5 w-5" />,
                title: "Schedule",
                text: "The live workflow confirms whether the lead should become a call, quote, or appointment.",
              },
              {
                icon: <FileText className="h-5 w-5" />,
                title: "Track",
                text: "Every call, form, and conversion is measured so the site can improve.",
              },
            ].map((step, index) => (
              <div key={step.title} className="rounded-md border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f93355] text-white">
                  {step.icon}
                </div>
                <p className="mt-4 text-sm font-black text-slate-400">Step {index + 1}</p>
                <h3 className="mt-1 text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Sales operations"
              title="The page should make the phone ring and help the owner close"
              text="For a premium price, the website must support the business after the visitor clicks. That means lead context, callback behavior, missed-call recovery, and lead-quality learning."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {salesEnablement.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#f93355]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roi" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeader
              eyebrow="ROI system"
              title="What makes this worth a serious price"
              text="The value is not the HTML. The value is the complete local acquisition system wrapped around the business."
            />
            <div className="mt-6 grid gap-3">
              {[
                "Call tracking for tap-to-call actions and missed-call recovery.",
                "Form tracking for quote requests, urgency, service type, and location.",
                "Search Console monitoring for impressions, clicks, and ranking opportunities.",
                "Local-pack visibility tracking by ZIP code and neighborhood.",
                "Monthly content refreshes for seasonal services, photos, FAQs, and offers.",
                "Owner dashboard path for leads, verification, photos, and service updates.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-slate-200 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-md bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-blue-100">
              <BarChart3 className="h-4 w-4" />
              Growth dashboard preview
            </div>
            <div className="mt-5 grid gap-3">
              <DashboardMetric icon={<Phone className="h-4 w-4" />} label="Tracked calls" value="Ready" />
              <DashboardMetric icon={<TrendingUp className="h-4 w-4" />} label="Organic entrances" value="Ready" />
              <DashboardMetric icon={<Gauge className="h-4 w-4" />} label="Conversion rate" value="Ready" />
              <DashboardMetric icon={<LifeBuoy className="h-4 w-4" />} label="Lead follow-up" value="Ready" />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              These metrics require final owner approval, analytics setup, call tracking, and lead routing before the site is sold as a live growth asset.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 border-t border-slate-200 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Monthly growth cadence"
              title="The one-page site gets more valuable after launch"
              text="A $50,000+ asset needs an operating rhythm. The page should be measured, updated, and improved like a sales system."
            />
          </div>
          <div className="grid gap-3">
            {monthlyOperatingPlan.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-md border border-slate-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="font-medium leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Implementation sprints"
            title="Premium value comes from launch discipline"
            text="A high-ticket one-pager needs a controlled path from preview to official site, with risk removed before the page is indexed or sold as complete."
            dark
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {launchSprints.map(([sprint, title, text]) => (
              <div key={sprint} className="rounded-md border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-black text-[#f93355]">{sprint}</p>
                <h3 className="mt-2 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Offer stack"
              title="The one-page site still includes the full premium package"
              text={`${premiumPackage.name}: ${premiumPackage.summary}`}
            />
            <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
              <div className="text-4xl font-black">$50,000</div>
              <p className="mt-1 text-sm font-bold text-slate-500">target value when fully completed, verified, launched, and measured</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "One-page homepage, service hub, quote funnel, FAQ, local SEO article, and trust center.",
              "Owner-approved business copy, service details, hours, policies, and service area.",
              "Optimized business photos, alt text, gallery, and visual proof sections.",
              "Schema-safe structured data and noindex-to-index launch control.",
              "Call tracking, form tracking, analytics, Search Console, and reporting.",
              "Monthly refresh system for content, photos, offers, FAQs, and rankings.",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f93355]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080d14] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 rounded-md border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Buyer promise</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-5xl">
                This page should feel like the business hired a growth team, not a web designer.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                The finished product earns the premium only when the owner can look at it and see a complete system for being found, trusted, contacted, measured, and improved.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                ["Found", "The page captures local service demand with focused search architecture."],
                ["Trusted", "The page proves what can be verified and refuses what cannot."],
                ["Contacted", "The page makes the right next step obvious on mobile and desktop."],
                ["Measured", "The page ties calls, forms, rankings, and lead quality to ongoing decisions."],
                ["Improved", "The page has a monthly cadence for keeping proof, offers, and copy current."],
              ].map(([label, detail]) => (
                <div key={label} className="grid gap-3 rounded-md bg-white p-4 text-slate-950 sm:grid-cols-[120px_1fr]">
                  <p className="text-lg font-black">{label}</p>
                  <p className="text-sm font-semibold leading-6 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/10 bg-[#0b111a]">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <SectionHeader
            eyebrow="FAQ"
            title="Questions this one-page website must answer"
            text="Customers need plain answers. Business owners need guardrails before this becomes official."
            dark
          />
          <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-5">
                <h3 className="font-black">{faq.question}</h3>
                <p className="mt-2 leading-7 text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeader
              eyebrow="Launch checklist"
              title="What must be done before this becomes an official business website"
              text="This protects users, the business owner, Erie.pro, and search quality."
            />
            <div className="mt-6 grid gap-3">
              {[
                "Business owner verifies name, phone, service area, hours, categories, and claims.",
                "Owner uploads or approves photos, gallery, team details, proof, and policies.",
                "Lead routing is tested: calls, forms, notifications, spam checks, and response expectations.",
                "Analytics, call tracking, Search Console, sitemap, canonical, and schema are verified.",
                "Accessibility, mobile layout, contrast, tap targets, speed, and crawlability are audited.",
                "Preview noindex is removed only after the page becomes official and approved.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-slate-200 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-black text-blue-100">
              <Clock className="h-4 w-4" />
              Owner review required
            </div>
            <h3 className="mt-3 text-2xl font-black">This preview is not official until approved.</h3>
            <p className="mt-3 leading-7 text-slate-300">
              Erie.pro can prepare the asset, but the business owner must confirm final wording, claims, photos, service availability, contact routing, pricing language, and any licensing or insurance details.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href={`/website-preview/${listing.slug}/claim`} className="inline-flex w-full items-center justify-center rounded-md bg-[#f93355] px-4 py-3 font-black text-white hover:bg-[#ff4968]">
                Claim and complete this website
              </Link>
              <Link href={`/website-preview/${listing.slug}/remove`} className="inline-flex w-full items-center justify-center rounded-md border border-white/15 px-4 py-3 font-black text-white hover:bg-white/10">
                Request correction or removal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b111a]">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm leading-6 text-slate-300">
          This is a premium one-page website preview prepared by Erie.pro from public directory information. It is not the official website of {listing.businessName} unless and until the business owner claims and approves it. Business owners can request corrections or removal at any time. Public ratings, review counts, photos, service areas, prices, licensing, insurance, guarantees, and availability must be verified before final publication.
        </div>
      </section>
    </main>
  )
}

function SectionHeader({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string
  title: string
  text: string
  dark?: boolean
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">{eyebrow}</p>
      <h2 className={`mt-2 text-3xl font-black tracking-normal sm:text-4xl ${dark ? "text-white" : "text-slate-950"}`}>
        {title}
      </h2>
      <p className={`mt-3 text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  )
}

function CommandStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <span className="text-sm font-bold">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function DashboardMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-blue-100">{icon}</div>
        <span className="font-bold text-slate-200">{label}</span>
      </div>
      <span className="font-black text-emerald-300">{value}</span>
    </div>
  )
}
