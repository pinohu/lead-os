import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Car,
  CheckCircle2,
  Clock,
  Gauge,
  MapPinned,
  MapPin,
  Navigation,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  TriangleAlert,
  Wrench,
} from "lucide-react"
import { prisma } from "@/lib/db"
import { TrackedPhoneLink } from "@/components/tracked-phone-link"
import { ClientServiceRequestForm } from "./ClientServiceRequestForm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `AL's AUTO | Erie Auto Repair`,
  description: "Auto repair, inspections, brakes, oil changes, diagnostics, tires, and general repair in Erie, PA.",
  robots: { index: false, follow: false },
}

type ListingRow = {
  businessName: string
  slug: string
  niche: string
  phone: string | null
  website: string | null
  addressStreet: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  addressFormatted: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  rating: number | null
  reviewCount: number
  hoursJson: { weekdayDescriptions?: string[] } | null
  categories: string[]
  photoRefs: string[]
  reviewsJson: Array<{
    text?: string
    author?: string
    rating?: number
    publishTime?: string
    relativeTime?: string
  }> | null
  servicesOffered: string[]
}

const services = [
  {
    title: "PA state inspections",
    intent: "Need your inspection done without guessing who to call?",
    details: "Bring the basics: vehicle year, make, model, mileage, registration timing, and anything that may affect inspection.",
    goodFor: "Annual inspection, renewal timing, pre-trip check",
    expect: "If a repair is needed before a sticker can be issued, ask for the issue in plain language before approving work.",
  },
  {
    title: "Brake concerns",
    intent: "Squeaking, grinding, vibration, soft pedal, or warning light?",
    details: "Call if it feels unsafe. Otherwise, send the symptoms and when you need help.",
    goodFor: "Pads, rotors, brake noise, warning lights",
    expect: "Brake problems can become safety problems quickly, especially if the pedal feels soft or the vehicle pulls when stopping.",
  },
  {
    title: "Diagnostics",
    intent: "Check-engine light or a problem you cannot name yet?",
    details: "Tell us what changed. A noise, light, smell, leak, or rough drive is enough to start.",
    goodFor: "Warning lights, leaks, noises, rough starts",
    expect: "Describe when it happens: starting, idling, braking, turning, accelerating, highway driving, or after the car warms up.",
  },
  {
    title: "Oil changes and maintenance",
    intent: "Need routine maintenance without the back-and-forth?",
    details: "Send your vehicle details and preferred timing, and ask what should be checked.",
    goodFor: "Oil changes, mileage service, basic maintenance",
    expect: "Routine visits are a good time to ask about fluids, tires, lights, brakes, belts, and anything that recently started feeling different.",
  },
  {
    title: "Tires and safety checks",
    intent: "Low pressure, uneven wear, vibration, or visible tire damage?",
    details: "Share what you noticed and whether the vehicle still feels safe to drive.",
    goodFor: "Tire pressure, vibration, tread wear, damage",
    expect: "If a tire is visibly damaged, losing air, or the vehicle shakes badly, call before driving farther.",
  },
  {
    title: "General auto repair",
    intent: "Not sure what service you need?",
    details: "Start with what changed: sound, smell, light, leak, shake, start, stop, or drive feel.",
    goodFor: "Repairs, maintenance, vehicle problems",
    expect: "You do not need the right repair term. A clear symptom is often the best place to start.",
  },
]

const proofStats = [
  ["Call if it feels urgent", "Use the phone for unsafe driving, smoke, severe braking trouble, or a vehicle that will not run."],
  ["Start with the issue", "Inspection, brakes, warning light, oil change, tire problem, or something you cannot name yet."],
  ["Tell us the basics", "Share the vehicle, what changed, where it is, and the best way to reach you."],
  ["No repair name needed", "You can describe symptoms in plain words and still ask for help."],
]

const customerPrep = [
  ["Vehicle basics", "Year, make, model, mileage, and whether the vehicle is safe to drive."],
  ["Symptoms", "Warning lights, sounds, smells, leaks, vibration, braking feel, or performance changes."],
  ["Timing", "Emergency, today, this week, or routine maintenance planning."],
  ["Photos", "Dashboard lights, tire damage, leaks, or visible issues when safe to photograph."],
]

const stopDrivingWarnings = [
  ["Brake pedal sinks or feels soft", "Pull over safely and call. Do not keep driving if stopping feels uncertain."],
  ["Smoke, burning smell, or overheating", "Shut the vehicle off when safe and call before causing more damage."],
  ["Severe shaking or loud grinding", "Avoid highway driving and explain when the sound or vibration started."],
  ["Red warning light", "Treat red dashboard warnings as urgent until a professional tells you otherwise."],
]

const decisionPromises = [
  ["No pressure to know the repair name", "Say what you hear, see, smell, or feel. That is enough to start the conversation."],
  ["Clearer first call", "The more detail you share, the easier it is to understand urgency and next steps."],
  ["Real shop signals", "Address, hours, photos, categories, rating, and public reviews are shown where available."],
  ["Practical expectations", "Quotes, timing, and repairs may require an in-person inspection before final pricing."],
]

const faqs = [
  ["Can I request service online?", "Yes. Use the request form with the vehicle issue, timing, location, and best contact method."],
  ["What should I do if the vehicle feels unsafe?", "Call first. If there is active danger, smoke, severe braking trouble, or the vehicle cannot be driven safely, do not rely on a form as the first step."],
  ["Do I need to know the exact repair?", "No. Plain-language symptoms are enough to start the conversation."],
  ["Can I ask about inspections, brakes, oil changes, and diagnostics?", "Yes. Share what you need, when you need it, and the best way to reach you."],
  ["Can I get an exact price from this page?", "Some simple services may be easy to discuss, but many repairs need inspection before a fair price can be given."],
  ["What should I include in the request?", "Add the vehicle, symptoms, when it started, whether it is safe to drive, your timing, and your best contact method."],
]

const areas = ["Erie", "Millcreek", "Harborcreek", "Wesleyville", "Lawrence Park", "Fairview", "Girard", "Summit Township"]

function getPhotoUrl(ref: string) {
  if (ref.startsWith("http")) return ref
  return `/api/places-photo?ref=${encodeURIComponent(ref)}&w=1600`
}

function getHours(hoursJson: ListingRow["hoursJson"]) {
  return hoursJson?.weekdayDescriptions?.filter(Boolean) ?? []
}

function getReviewSnippets(reviewsJson: ListingRow["reviewsJson"]) {
  return (reviewsJson ?? [])
    .filter((review) => (review.rating ?? 0) >= 4 && review.text && review.author)
    .slice(0, 3)
}

function excerpt(text: string, words = 18) {
  const parts = text.split(/\s+/).filter(Boolean)
  const clipped = parts.slice(0, words).join(" ")
  return parts.length > words ? `${clipped}...` : clipped
}

export default async function ClientSitePage({
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
        website,
        "addressStreet",
        "addressCity",
        "addressState",
        "addressZip",
        "addressFormatted",
        latitude,
        longitude,
        description,
        rating,
        "reviewCount",
        "hoursJson",
        categories,
        "photoRefs",
        "reviewsJson",
        "servicesOffered"
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
  const heroPhoto = listing.photoRefs?.[1] ?? listing.photoRefs?.[0]
  const photos = listing.photoRefs?.slice(0, 3) ?? []
  const rating = listing.rating?.toFixed(1) ?? "N/A"
  const hours = getHours(listing.hoursJson)
  const reviews = getReviewSnippets(listing.reviewsJson)
  const address = listing.addressFormatted ?? [listing.addressStreet, city, state, listing.addressZip].filter(Boolean).join(", ")
  const directionsHref = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined
  const categoryText = listing.categories?.slice(0, 6).join(" | ")
  const mapSrc = listing.latitude && listing.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.01}%2C${listing.latitude - 0.007}%2C${listing.longitude + 0.01}%2C${listing.latitude + 0.007}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`
    : null

  return (
    <main className="-mt-16 min-h-screen bg-[#070b12] text-white">
      <section className="fixed inset-x-0 top-0 z-[70] border-b border-white/10 bg-[#070b12] shadow-2xl shadow-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-black tracking-normal">
            {listing.businessName}
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold text-slate-300 lg:flex">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#why" className="hover:text-white">Why Us</a>
            <a href="#safety" className="hover:text-white">Safety</a>
            <a href="#proof" className="hover:text-white">Proof</a>
            <a href="#location" className="hover:text-white">Location</a>
            <a href="#areas" className="hover:text-white">Areas</a>
            <a href="#request" className="hover:text-white">Request</a>
          </nav>
          <div className="flex items-center gap-2">
            {listing.phone && (
              <TrackedPhoneLink
                phone={listing.phone}
                className="rounded-md border border-white/15 px-3 py-2 text-sm font-black text-white hover:bg-white/10"
                serviceNiche={listing.niche}
                serviceSlug={listing.niche}
                sourcePageType="client_site"
                requestedProviderName={listing.businessName}
                requestedProviderSlug={listing.slug}
              >
                Call
              </TrackedPhoneLink>
            )}
            <a href="#request" className="rounded-md bg-[#f93355] px-3 py-2 text-sm font-black text-white">
              Request Service
            </a>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10">
        {heroPhoto && (
          <img
            src={getPhotoUrl(heroPhoto)}
            alt={`${listing.businessName} auto repair shop in ${city}, ${state}`}
            className="absolute inset-0 h-full w-full object-cover opacity-24"
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,51,85,0.22),transparent_34%),linear-gradient(90deg,rgba(7,11,18,0.98),rgba(7,11,18,0.86),rgba(7,11,18,0.72))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-28 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20 lg:pt-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-sm font-black text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              {rating} rated Erie auto repair | {listing.reviewCount} public reviews
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              Auto repair in Erie without the runaround.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-100">
              Need an inspection, brake help, diagnostics, an oil change, tire help, or general repair? Call {listing.businessName} or send what is happening. You do not need to know the repair name.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-bold text-slate-200 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#f93355]" />
                {address || `${city}, ${state}`}
              </div>
              {hours[0] && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-300" />
                  {hours[0].replace("Monday: ", "Mon ")}
                </div>
              )}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {listing.phone && (
                <TrackedPhoneLink
                  phone={listing.phone}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-black text-slate-950"
                  serviceNiche={listing.niche}
                  serviceSlug={listing.niche}
                  sourcePageType="client_site"
                  requestedProviderName={listing.businessName}
                  requestedProviderSlug={listing.slug}
                >
                  <Phone className="h-4 w-4" />
                  {listing.phone}
                </TrackedPhoneLink>
              )}
              <a href="#request" className="inline-flex items-center gap-2 rounded-md bg-[#f93355] px-5 py-3 font-black text-white">
                Request service
                <ArrowRight className="h-4 w-4" />
              </a>
              {directionsHref && (
                <a href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-3 font-black text-white hover:bg-white/10">
                  <Navigation className="h-4 w-4" />
                  Directions
                </a>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <PremiumMetric icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} label="Public rating" value={rating} detail={`${listing.reviewCount} public reviews`} />
              <PremiumMetric icon={<MapPin className="h-4 w-4 text-[#f93355]" />} label="Nearby" value={city} detail={`${state} drivers and nearby communities`} />
              <PremiumMetric icon={<Gauge className="h-4 w-4 text-blue-300" />} label="Next step" value="Call or request" detail="Choose what feels easiest right now" />
            </div>
            {categoryText && (
              <p className="mt-5 max-w-3xl text-sm font-bold leading-6 text-slate-300">
                Listed services include: {categoryText}.
              </p>
            )}
          </div>

          <aside id="request" className="rounded-md border border-white/10 bg-white p-5 text-slate-950 shadow-2xl sm:p-6">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#f93355]">
              <Car className="h-4 w-4" />
              Service request
            </div>
            <h2 className="mt-2 text-3xl font-black">Tell us what your vehicle needs.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Share what is happening, when you need help, and how to reach you. If the vehicle feels unsafe, call first.
            </p>
            <ClientServiceRequestForm
              businessName={listing.businessName}
              niche={listing.niche}
              city={city}
              serviceExample="Inspection, brakes, diagnostics, oil change, tire help"
              requestedProviderSlug={listing.slug}
              requestedProviderPhone={listing.phone}
              requestedProviderAddress={address}
              sourcePage={`https://erie.pro/client-sites/${listing.slug}`}
            />
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b111a]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-4">
          {proofStats.map(([title, text]) => (
            <div key={title} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="font-black">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="trust" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Why AL's AUTO"
              title="A real Erie shop with visible proof"
              text={`${listing.businessName} is listed as an Erie auto repair shop with public reviews, shop photos, business hours, and a real Parade Street location.`}
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <TrustPill icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} title={`${rating} public rating`} text={`${listing.reviewCount} public reviews available for drivers to check.`} />
              <TrustPill icon={<MapPinned className="h-4 w-4 text-[#f93355]" />} title="Parade Street location" text={address || `${city}, ${state}`} />
              <TrustPill icon={<Clock className="h-4 w-4 text-emerald-600" />} title="Published hours" text={hours[0] ? "Hours are shown below before you call or visit." : "Call first to confirm current hours."} />
              <TrustPill icon={<Wrench className="h-4 w-4 text-blue-600" />} title="Auto repair categories" text="Inspection, brakes, maintenance, oil, tires, mechanic, and truck repair listings." />
            </div>
          </div>
          <div className="grid gap-4">
            {reviews.length > 0 ? reviews.map((review) => (
              <article key={`${review.author}-${review.publishTime}`} className="rounded-md border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Quote className="h-5 w-5 text-[#f93355]" />
                  <div className="flex gap-1 text-amber-500" aria-label={`${review.rating ?? 5} star review`}>
                    {Array.from({ length: Math.min(5, review.rating ?? 5) }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-lg font-black leading-7 text-slate-900">"{excerpt(review.text ?? "")}"</p>
                <p className="mt-3 text-sm font-bold text-slate-500">Public review by {review.author}</p>
              </article>
            )) : (
              <article className="rounded-md border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-black text-slate-900">Public reviews should be connected here once verified.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Until then, drivers should call and ask direct questions before scheduling service.</p>
              </article>
            )}
          </div>
        </div>
      </section>

      <section id="services" className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Services"
            title="What can we help with?"
            text="Tell us what your vehicle is doing. You do not need to know the exact repair before you reach out."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="rounded-md border border-slate-200 p-5">
                <Wrench className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{service.title}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{service.intent}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.details}</p>
                <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  Good for: {service.goodFor}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  <span className="font-black text-slate-900">What to expect: </span>
                  {service.expect}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Why drivers call"
            title="Straight answers when your vehicle is acting up"
            text="Tell us what changed and how soon you need help. You can call now or send the details first."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["You can call first", "Call if the issue feels urgent, unsafe, or hard to explain in a form."],
              ["You can explain symptoms", "Describe the sound, light, leak, smell, vibration, or driving problem in your own words."],
              ["You can ask about common services", "Inspections, brakes, diagnostics, oil changes, tires, and general repair are all simple to request."],
              ["You can start with confidence", `${listing.reviewCount} public reviews and a ${rating} public rating help you know who you are contacting.`],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <BadgeCheck className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader
              eyebrow="Before you call"
              title="Helpful details to have ready"
              text="A few details can make the first call easier and help the shop understand what you need."
            />
            <div className="mt-6 rounded-md bg-slate-950 p-5 text-white">
              <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Not sure what is wrong?</p>
              <p className="mt-2 text-2xl font-black">That is okay. Start with what you hear, see, smell, or feel.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {customerPrep.map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="bg-[#fff6f7] text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionHeader
              eyebrow="Safety first"
              title="When to call before you drive"
              text="Some vehicle problems are not worth testing on the road. If any of these are happening, use the phone first and describe exactly what changed."
            />
            {listing.phone && (
              <TrackedPhoneLink
                phone={listing.phone}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 font-black text-white"
                serviceNiche={listing.niche}
                serviceSlug={listing.niche}
                sourcePageType="client_site"
                requestedProviderName={listing.businessName}
                requestedProviderSlug={listing.slug}
              >
                <Phone className="h-4 w-4" />
                Call {listing.phone}
              </TrackedPhoneLink>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stopDrivingWarnings.map(([title, text]) => (
              <article key={title} className="rounded-md border border-red-100 bg-white p-5 shadow-sm">
                <TriangleAlert className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Straight expectations"
            title="What this page can and cannot promise"
            text="Trust comes from being clear. This page helps you start the repair conversation, but final pricing and timing may depend on the vehicle and shop schedule."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {decisionPromises.map(([title, text]) => (
              <article key={title} className="rounded-md border border-slate-200 p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader
            dark
            eyebrow="Shop photos"
            title="See the shop before you reach out"
            text="A real shop should feel real online. Photos, reviews, and clear contact options help you know who you are calling."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {photos.length > 0 ? photos.map((ref, index) => (
              <div key={ref} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                <img src={getPhotoUrl(ref)} alt={`${listing.businessName} shop photo ${index + 1}`} className="h-56 w-full object-cover" />
              </div>
            )) : (
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-5 text-slate-300">Owner-approved shop photography belongs here.</div>
            )}
          </div>
        </div>
      </section>

      <section id="location" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Location and hours"
              title="Plan the call, visit, or drop-off"
              text="Before you head over, confirm timing by phone. Repair availability can change based on workload, parts, inspections, and the vehicle issue."
            />
            <div className="mt-6 grid gap-3">
              {address && (
                <div className="rounded-md border border-slate-200 p-4">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">Address</p>
                  <p className="mt-1 text-lg font-black">{address}</p>
                  {directionsHref && (
                    <a href={directionsHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#f93355] px-4 py-2 text-sm font-black text-white">
                      <Navigation className="h-4 w-4" />
                      Open directions
                    </a>
                  )}
                </div>
              )}
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">Phone</p>
                {listing.phone ? (
                  <TrackedPhoneLink
                    phone={listing.phone}
                    className="mt-1 inline-flex items-center gap-2 text-lg font-black text-slate-950"
                    serviceNiche={listing.niche}
                    serviceSlug={listing.niche}
                    sourcePageType="client_site"
                    requestedProviderName={listing.businessName}
                    requestedProviderSlug={listing.slug}
                  >
                    <Phone className="h-4 w-4 text-[#f93355]" />
                    {listing.phone}
                  </TrackedPhoneLink>
                ) : (
                  <p className="mt-1 text-lg font-black">Call information unavailable</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {mapSrc ? (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                <iframe
                  title={`${listing.businessName} map`}
                  src={mapSrc}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : address ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-6">
                <MapPinned className="h-8 w-8 text-[#f93355]" />
                <p className="mt-3 text-lg font-black">{address}</p>
                {directionsHref && (
                  <a href={directionsHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#f93355] px-4 py-2 text-sm font-black text-white">
                    <Navigation className="h-4 w-4" />
                    Open directions
                  </a>
                )}
              </div>
            ) : null}
            <div className="rounded-md border border-slate-200 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">Published hours</p>
              {hours.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {hours.map((line) => (
                    <p key={line} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-600">Hours are not published here. Call before visiting.</p>
              )}
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Hours can change for holidays, staffing, or workload. Calling first is the safest move for inspections, urgent repairs, and drop-offs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="areas" className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader
            eyebrow="Service area"
            title={`Auto repair help for ${city} and nearby communities`}
            text={`If you are in or near ${city}, start with a call or request and include where the vehicle is located.`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {areas.map((area) => (
              <div key={area} className="rounded-md border border-slate-200 p-4 text-center font-black">
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="What happens next"
            title="Here is the simple path"
            text="Tell us what is happening, how soon you need help, and how to reach you."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["1. Describe it", "Tell us the service or symptom: brakes, inspection, oil, tire, warning light, noise, leak, or something else."],
              ["2. Share timing", "Let us know whether it is urgent, today, this week, or routine maintenance."],
              ["3. Add contact info", "Choose the best way to reach you so the shop can follow up."],
              ["4. Get moving", "Call for urgent issues or send the form when you want to include details first."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <BarChart3 className="h-5 w-5 text-[#f93355]" />
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.78fr_1.22fr]">
          <SectionHeader
            eyebrow="Erie driver guide"
            title="How to ask for auto repair help clearly"
            text="A better first message usually leads to a better first conversation. Use simple details instead of trying to diagnose the car yourself."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-md border border-slate-200 p-5">
              <h3 className="text-xl font-black">If you need an inspection</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Say when your inspection is due, whether any dashboard lights are on, and whether the vehicle has recent brake, tire, exhaust, or frame concerns.
              </p>
            </article>
            <article className="rounded-md border border-slate-200 p-5">
              <h3 className="text-xl font-black">If the brakes feel different</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Say whether you hear grinding, feel shaking, notice pulling, see a warning light, or need more distance to stop. Call first if stopping feels unsafe.
              </p>
            </article>
            <article className="rounded-md border border-slate-200 p-5">
              <h3 className="text-xl font-black">If a light came on</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Include the light color, whether it is flashing, when it appeared, and whether the vehicle drives normally, loses power, smells hot, or leaks fluid.
              </p>
            </article>
            <article className="rounded-md border border-slate-200 p-5">
              <h3 className="text-xl font-black">If you just need maintenance</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Share mileage, last service if you know it, and whether you want oil, tires, fluids, lights, brakes, or general safety items checked.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <SectionHeader
            eyebrow="FAQ"
            title="Answers before you call"
            text="A few quick answers so you can decide whether to call now or send a request."
          />
          <div className="mt-8 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {faqs.map(([question, answer]) => (
              <div key={question} className="p-5">
                <h3 className="font-black">{question}</h3>
                <p className="mt-2 leading-7 text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#070b12] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Call or request service</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">
              Need help with your vehicle?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Call now if the issue feels urgent, or send a service request with the details and your preferred contact method.
            </p>
          </div>
          <div className="rounded-md bg-white p-5 text-slate-950">
            <p className="text-sm font-black uppercase tracking-wide text-[#f93355]">Need auto repair help?</p>
            <h3 className="mt-2 text-2xl font-black">Call now or send the details.</h3>
            <div className="mt-5 grid gap-3">
              {listing.phone && (
                  <TrackedPhoneLink
                    phone={listing.phone}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-black text-white"
                    serviceNiche={listing.niche}
                    serviceSlug={listing.niche}
                    sourcePageType="client_site"
                    requestedProviderName={listing.businessName}
                    requestedProviderSlug={listing.slug}
                  >
                    <Phone className="h-4 w-4" />
                    Call {listing.phone}
                  </TrackedPhoneLink>
              )}
              <a href="#request" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#f93355] px-4 py-3 font-black text-white">
                Request service
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b12]/95 p-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {listing.phone ? (
            <TrackedPhoneLink
              phone={listing.phone}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-black text-slate-950"
              serviceNiche={listing.niche}
              serviceSlug={listing.niche}
              sourcePageType="client_site"
              requestedProviderName={listing.businessName}
              requestedProviderSlug={listing.slug}
            >
              <Phone className="h-4 w-4" />
              Call
            </TrackedPhoneLink>
          ) : (
            <a href="#request" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-black text-slate-950">
              Details
            </a>
          )}
          <a href="#request" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#f93355] px-3 py-3 text-sm font-black text-white">
            Request
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
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

function TrustPill({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-black text-slate-900">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function PremiumMetric({
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
    <div className="rounded-md border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center gap-2 text-sm font-bold">{icon}{label}</div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  )
}
