import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { serviceLabelForNiche } from "@/lib/website-opportunities"
import { TrackedPhoneLink } from "@/components/tracked-phone-link"
import { WebsitePreviewLeadForm } from "@/app/website-preview/[slug]/WebsitePreviewLeadForm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Client Website Example | ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

type ListingRow = {
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
}

const autoServices = [
  ["State inspections", "Schedule inspection help with a clear path for timing, vehicle details, and callback preference."],
  ["Brake service", "Help customers understand warning signs, urgency, and what to share before the visit."],
  ["Oil changes", "Convert routine maintenance searches into simple appointment requests."],
  ["Diagnostics", "Give worried drivers a plain-language next step when a light, noise, or performance issue appears."],
  ["Tire and wheel help", "Capture tire, rotation, repair, and safety-related requests without making customers guess."],
  ["General repair", "Route unknown problems into a qualified request with symptoms, timeline, and vehicle context."],
]

const erieAreas = ["Erie", "Millcreek", "Harborcreek", "Wesleyville", "Lawrence Park", "Fairview", "Girard", "Summit Township"]

function getPhotoUrl(ref: string) {
  return `/api/places-photo?ref=${encodeURIComponent(ref)}&w=1400`
}

export default async function ClientExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const rows = await prisma.$queryRawUnsafe<ListingRow[]>(
    `
      SELECT
        "businessName",
        slug,
        niche,
        phone,
        "addressCity",
        "addressState",
        rating,
        "reviewCount",
        categories,
        "photoRefs"
      FROM directory_listings
      WHERE slug = $1
        AND "isActive" = true
      LIMIT 1
    `,
    slug
  )

  const listing = rows[0]
  if (!listing) notFound()

  const city = listing.addressCity ?? "Erie"
  const state = listing.addressState ?? "PA"
  const serviceLabel = serviceLabelForNiche(listing.niche)
  const heroPhoto = listing.photoRefs?.[0]
  const photos = listing.photoRefs?.slice(0, 3) ?? []

  return (
    <main className="min-h-screen bg-[#080d14] text-white">
      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#0b111a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-black">erie.pro</Link>
          <nav className="hidden items-center gap-5 text-sm font-bold text-slate-300 lg:flex">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#proof" className="hover:text-white">Proof</a>
            <a href="#areas" className="hover:text-white">Areas</a>
            <a href="#quote" className="hover:text-white">Quote</a>
          </nav>
          {listing.phone && (
            <TrackedPhoneLink
              phone={listing.phone}
              className="rounded-md bg-[#f93355] px-4 py-2 text-sm font-black text-white"
              serviceNiche={listing.niche}
              serviceSlug={listing.niche}
              sourcePageType="client_example"
              requestedProviderName={listing.businessName}
              requestedProviderSlug={listing.slug}
            >
              Call Now
            </TrackedPhoneLink>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10">
        {heroPhoto && (
          <img
            src={getPhotoUrl(heroPhoto)}
            alt={`${listing.businessName} public business photo`}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080d14]/70 via-[#080d14]/92 to-[#080d14]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-sm font-black text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Client website example
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              {listing.businessName}
            </h1>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-slate-100">
              Auto repair help in {city}, {state} with simple scheduling, clear service guidance, and fast tap-to-call access.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {listing.phone && (
                <TrackedPhoneLink
                  phone={listing.phone}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-black text-slate-950"
                  serviceNiche={listing.niche}
                  serviceSlug={listing.niche}
                  sourcePageType="client_example"
                  requestedProviderName={listing.businessName}
                  requestedProviderSlug={listing.slug}
                >
                  <Phone className="h-4 w-4" />
                  {listing.phone}
                </TrackedPhoneLink>
              )}
              <a href="#quote" className="inline-flex items-center gap-2 rounded-md bg-[#f93355] px-5 py-3 font-black text-white">
                Request service
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroMetric icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} label="Public rating" value={listing.rating?.toFixed(1) ?? "N/A"} detail={`${listing.reviewCount} public reviews`} />
              <HeroMetric icon={<MapPin className="h-4 w-4 text-[#f93355]" />} label="Service area" value={city} detail={`${state} local market`} />
              <HeroMetric icon={<Gauge className="h-4 w-4 text-blue-300" />} label="Customer path" value="Call or quote" detail="Clear next step" />
            </div>
          </div>

          <aside id="quote" className="rounded-md bg-white p-5 text-slate-950 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Request auto service</p>
            <h2 className="mt-2 text-3xl font-black">Tell us what your vehicle needs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is what a live client lead funnel looks like: practical, mobile-friendly, and wired to capture useful service context.
            </p>
            <WebsitePreviewLeadForm
              businessName={listing.businessName}
              niche={listing.niche}
              city={city}
              serviceExample="Brake service, inspection, diagnostics, oil change"
            />
          </aside>
        </div>
      </section>

      <section id="services" className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionIntro eyebrow="Services" title="Built around real auto-repair customer intent" text="A strong one-page client site gives each common customer need enough depth to earn trust and generate a qualified request." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {autoServices.map(([title, text]) => (
              <article key={title} className="rounded-md border border-slate-200 p-5">
                <Wrench className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionIntro dark eyebrow="Trust proof" title="The page feels real because the proof is visible" text="For a paying client, public photos are only the beginning. The finished version should include approved shop photos, team details, service policies, and verified credentials." />
          <div className="grid gap-4 sm:grid-cols-3">
            {photos.length > 0 ? photos.map((ref, index) => (
              <div key={ref} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                <img src={getPhotoUrl(ref)} alt={`${listing.businessName} photo ${index + 1}`} className="h-48 w-full object-cover" />
                <div className="p-4 text-sm font-semibold text-slate-300">Public listing photo</div>
              </div>
            )) : (
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-5 text-slate-300">Client photos would appear here after approval.</div>
            )}
          </div>
        </div>
      </section>

      <section id="areas" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionIntro eyebrow="Local SEO" title={`${serviceLabel} in ${city}, PA`} text="The live client version would use one page to combine service intent, local relevance, FAQs, photos, and conversion tracking without creating thin location pages." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {erieAreas.map((area) => (
              <div key={area} className="rounded-md border border-slate-200 p-4 text-center font-black">{area}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionIntro eyebrow="What the client gets" title="A one-page site that behaves like a growth system" text="The finished client version combines the public-facing site with the back-end pieces that make it valuable." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Lead capture", "Calls and forms with service, location, timing, and contact preference."],
              ["SEO structure", "Keyword-focused sections, FAQ markup, local copy, and image optimization."],
              ["Trust system", "Owner-approved proof, policies, photos, credentials, and review governance."],
              ["Measurement", "Call tracking, form tracking, Search Console, conversion review, and monthly updates."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080d14] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Client example</p>
            <h2 className="mt-2 text-3xl font-black">This is the direction: real, specific, and conversion-ready.</h2>
          </div>
          <a href="#quote" className="inline-flex items-center justify-center rounded-md bg-[#f93355] px-5 py-3 font-black text-white">
            Request service
          </a>
        </div>
      </section>
    </main>
  )
}

function SectionIntro({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">{eyebrow}</p>
      <h2 className={`mt-2 text-3xl font-black tracking-normal sm:text-4xl ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      <p className={`mt-3 text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>
    </div>
  )
}

function HeroMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-bold">{icon}{label}</div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  )
}
