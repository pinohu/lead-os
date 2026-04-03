import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowRight,
  MapPin,
  Shield,
  CheckCircle2,
  Star,
  Clock,
  Phone,
  Mail,
  Award,
  MessageSquare,
  ChevronRight,
  Globe,
  Building2,
  ExternalLink,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getProviderBySlug } from "@/lib/provider-store"
import { getDirectoryListingBySlug, getAllDirectoryListingSlugs } from "@/lib/directory-store"
import { getLocalSeoSnippet } from "@/lib/local-seo"
import { getNicheContent } from "@/lib/niche-content"
import { InternalLinks } from "@/components/internal-links"
import { getDirectoryListingsByNiche } from "@/lib/directory-store"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import ContactForm from "@/components/contact-form"
import { PhotoGalleryDialog } from "@/components/photo-gallery-dialog"

type Props = { params: Promise<{ niche: string; provider: string }> }

/* ── Unified data shape for both Provider and DirectoryListing ── */

interface ProviderData {
  type: "provider" | "listing"
  id: string
  slug: string
  businessName: string
  niche: string
  phone: string | null
  email: string | null
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
  hoursJson: unknown
  photoRefs: string[]
  reviewsJson: unknown
  isVerified: boolean
  avgResponseTime: number | null
  insurance: boolean
  license: string | null
  yearEstablished: number | null
  categories: string[]
  servicesOffered: string[]
}

async function resolveProvider(
  nicheSlug: string,
  providerSlug: string
): Promise<ProviderData | null> {
  // 1. Try paying provider first
  try {
    const provider = await getProviderBySlug(providerSlug)
    if (provider && provider.niche === nicheSlug) {
      return {
        type: "provider",
        id: provider.id,
        slug: provider.slug,
        businessName: provider.businessName,
        niche: provider.niche,
        phone: provider.phone,
        email: provider.email,
        website: provider.website ?? null,
        addressStreet: provider.address.street || null,
        addressCity: provider.address.city || null,
        addressState: provider.address.state || null,
        addressZip: provider.address.zip || null,
        addressFormatted: [provider.address.street, provider.address.city, provider.address.state, provider.address.zip].filter(Boolean).join(", ") || null,
        latitude: null,
        longitude: null,
        description: provider.description || null,
        rating: provider.avgRating || null,
        reviewCount: provider.reviewCount,
        hoursJson: null,
        photoRefs: [],
        reviewsJson: null,
        isVerified: true,
        avgResponseTime: provider.avgResponseTime || null,
        insurance: provider.insurance,
        license: provider.license ?? null,
        yearEstablished: provider.yearEstablished ?? null,
        categories: [],
        servicesOffered: [],
      }
    }
  } catch {
    // DB unavailable
  }

  // 2. Try directory listing
  try {
    const listing = await getDirectoryListingBySlug(providerSlug)
    if (listing && listing.niche === nicheSlug) {
      return {
        type: "listing",
        id: listing.id,
        slug: listing.slug,
        businessName: listing.businessName,
        niche: listing.niche,
        phone: listing.phone,
        email: listing.email,
        website: listing.website,
        addressStreet: listing.addressStreet,
        addressCity: listing.addressCity,
        addressState: listing.addressState,
        addressZip: listing.addressZip,
        addressFormatted: listing.addressFormatted,
        latitude: listing.latitude,
        longitude: listing.longitude,
        description: listing.description,
        rating: listing.rating,
        reviewCount: listing.reviewCount,
        hoursJson: listing.hoursJson,
        photoRefs: listing.photoRefs,
        reviewsJson: listing.reviewsJson,
        isVerified: false,
        avgResponseTime: null,
        insurance: false,
        license: null,
        yearEstablished: null,
        categories: listing.categories,
        servicesOffered: listing.servicesOffered,
      }
    }
  } catch {
    // DB unavailable
  }

  return null
}

/* ── Niche-specific content helpers ──────────────────────────── */

function getServicesForNiche(nicheSlug: string, nicheLabel: string): string[] {
  const serviceMap: Record<string, string[]> = {
    plumbing: ["Emergency pipe repair", "Drain cleaning & unclogging", "Water heater installation & repair", "Sewer line inspection & replacement", "Fixture installation (sinks, toilets, faucets)", "Water softener installation", "Gas line repair", "Leak detection"],
    hvac: ["Furnace repair & installation", "Air conditioning service & installation", "Heat pump systems", "Ductwork installation & cleaning", "Thermostat installation", "Indoor air quality testing", "Preventive maintenance plans", "Emergency heating repair"],
    electrical: ["Panel upgrades & replacements", "Wiring & rewiring", "Lighting installation", "Outlet & switch installation", "Generator installation", "Smoke & carbon monoxide detectors", "Ceiling fan installation", "Electrical safety inspections"],
    roofing: ["Roof repair & patching", "Full roof replacement", "Gutter installation & repair", "Storm damage restoration", "Roof inspection & assessment", "Skylight installation", "Flat roof systems", "Ice dam prevention"],
    landscaping: ["Lawn mowing & maintenance", "Landscape design & installation", "Hardscaping (patios, walkways)", "Tree & shrub planting", "Irrigation system installation", "Seasonal cleanup", "Mulching & bed maintenance", "Snow removal"],
    dental: ["General cleanings & exams", "Cosmetic dentistry", "Teeth whitening", "Dental implants", "Orthodontics & braces", "Root canal therapy", "Crown & bridge work", "Emergency dental care"],
    legal: ["Personal injury claims", "Family law & divorce", "Criminal defense", "Estate planning & wills", "Real estate closings", "Business formation", "Immigration services", "Workers' compensation"],
    cleaning: ["Regular house cleaning", "Deep cleaning", "Move-in / move-out cleaning", "Commercial office cleaning", "Carpet & upholstery cleaning", "Window cleaning", "Post-construction cleanup", "Disinfection services"],
    "auto-repair": ["Engine diagnostics & repair", "Brake service & replacement", "Oil changes & fluid services", "Transmission repair", "Tire rotation & alignment", "Collision & body repair", "AC & heating service", "State inspection"],
    "pest-control": ["Insect extermination", "Rodent removal & prevention", "Termite inspection & treatment", "Bed bug treatment", "Wildlife removal", "Preventive pest barriers", "Commercial pest management", "Seasonal pest prevention"],
    painting: ["Interior painting", "Exterior painting", "Cabinet painting & refinishing", "Deck & fence staining", "Wallpaper removal", "Drywall repair & texturing", "Pressure washing", "Color consultation"],
    "real-estate": ["Buyer representation", "Seller listing services", "Property market analysis", "Home staging consultation", "Rental property management", "Commercial real estate", "Investment property advice", "Relocation assistance"],
  }
  return serviceMap[nicheSlug] ?? [`${nicheLabel} consultation`, `${nicheLabel} installation`, `${nicheLabel} repair`, `${nicheLabel} maintenance`, `Emergency ${nicheLabel.toLowerCase()} services`, `${nicheLabel} inspection`]
}

function getCertificationsForNiche(nicheSlug: string): string[] {
  const certMap: Record<string, string[]> = {
    plumbing: ["Licensed Master Plumber", "EPA Certified", "Insured & Bonded", "BBB Accredited"],
    hvac: ["NATE Certified", "EPA 608 Certified", "Insured & Bonded", "Energy Star Partner"],
    electrical: ["Licensed Master Electrician", "OSHA Certified", "Insured & Bonded", "BBB Accredited"],
    roofing: ["GAF Certified Installer", "Licensed & Insured", "OSHA Safety Certified", "BBB Accredited"],
    landscaping: ["ISA Certified Arborist", "Licensed & Insured", "NALP Member", "EPA WaterSense Partner"],
    dental: ["ADA Member", "Board Certified", "State Licensed", "HIPAA Compliant"],
    legal: ["State Bar Licensed", "ABA Member", "Super Lawyers Rated", "Martindale-Hubbell Rated"],
    cleaning: ["Licensed & Insured", "Green Seal Certified", "ISSA Member", "Bonded"],
    "auto-repair": ["ASE Certified", "AAA Approved", "Licensed & Insured", "I-CAR Gold Class"],
    "pest-control": ["State Licensed", "EPA Certified", "NPMA Member", "QualityPro Certified"],
    painting: ["Licensed & Insured", "EPA Lead-Safe Certified", "PPG Certified Painter", "Bonded"],
    "real-estate": ["Licensed Realtor", "NAR Member", "ABR Designation", "CRS Certified"],
  }
  return certMap[nicheSlug] ?? ["Licensed & Insured", "BBB Accredited", "Locally Owned", "Background Checked"]
}

function getFAQsForNiche(nicheLabel: string, providerName: string): { question: string; answer: string }[] {
  return [
    { question: `How do I get a quote from ${providerName}?`, answer: `Simply fill out the contact form on this page or call ${providerName} directly. They typically respond within a few hours with a detailed, no-obligation estimate for your ${nicheLabel.toLowerCase()} project.` },
    { question: `Is ${providerName} licensed and insured?`, answer: `${providerName} is a verified provider on ${cityConfig.domain}. All providers listed on our platform are vetted for proper licensing and insurance for ${nicheLabel.toLowerCase()} services in ${cityConfig.state}.` },
    { question: `What areas does ${providerName} serve?`, answer: `${providerName} provides ${nicheLabel.toLowerCase()} services throughout the greater ${cityConfig.name} area, including ${cityConfig.serviceArea.slice(0, 5).join(", ")}, and surrounding communities.` },
    { question: `How much does ${nicheLabel.toLowerCase()} service typically cost?`, answer: `${nicheLabel} project costs vary depending on the scope of work. Contact ${providerName} for a personalized quote tailored to your specific needs and budget.` },
  ]
}

/* ── Stars component ─────────────────────────────────────────── */

function Stars({ count, size = "sm", label }: { count: number; size?: "sm" | "lg"; label?: string }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4"
  return (
    <div className="flex gap-0.5" role="img" aria-label={label ?? `${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < Math.round(count) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/* ── Hours parser ────────────────────────────────────────────── */

function parseHoursFromJson(hoursJson: unknown): { day: string; hours: string }[] | null {
  if (!hoursJson || typeof hoursJson !== "object") return null
  const data = hoursJson as { weekdayDescriptions?: string[] }
  if (!data.weekdayDescriptions?.length) return null
  return data.weekdayDescriptions.map((desc) => {
    const colonIdx = desc.indexOf(":")
    if (colonIdx === -1) return { day: desc, hours: "" }
    return { day: desc.slice(0, colonIdx).trim(), hours: desc.slice(colonIdx + 1).trim() }
  })
}

/* ── Reviews parser ──────────────────────────────────────────── */

interface ParsedReview { author: string; rating: number; text: string; relativeTime: string }

function parseReviewsFromJson(reviewsJson: unknown): ParsedReview[] {
  if (!reviewsJson || !Array.isArray(reviewsJson)) return []
  return reviewsJson.filter((r) => r?.text).map((r) => ({
    author: r.author ?? "Customer",
    rating: r.rating ?? 5,
    text: r.text ?? "",
    relativeTime: r.relativeTime ?? "",
  }))
}

/* ── Rating distribution helper ──────────────────────────────── */

function computeRatingDistribution(reviews: ParsedReview[]): { star: number; count: number; pct: number }[] {
  const counts = [0, 0, 0, 0, 0] // index 0 = 1-star, index 4 = 5-star
  for (const r of reviews) {
    const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4)
    counts[idx]++
  }
  const total = reviews.length || 1
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star - 1],
    pct: Math.round((counts[star - 1] / total) * 100),
  }))
}

/* ── Photo src helper ────────────────────────────────────────── */

function getPhotoSrc(ref: string, width: number = 400): string {
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref
  return `/api/places-photo?ref=${encodeURIComponent(ref)}&w=${width}`
}

/* ── Schema.org hours helper ─────────────────────────────────── */

function buildOpeningHoursSpec(parsedHours: { day: string; hours: string }[] | null) {
  if (!parsedHours) return undefined
  const dayMap: Record<string, string> = {
    monday: "Mo", tuesday: "Tu", wednesday: "We", thursday: "Th",
    friday: "Fr", saturday: "Sa", sunday: "Su",
  }
  return parsedHours
    .filter((h) => h.hours && h.hours.toLowerCase() !== "closed")
    .map((h) => {
      const dayCode = dayMap[h.day.toLowerCase()] ?? h.day.slice(0, 2)
      return { "@type": "OpeningHoursSpecification", dayOfWeek: dayCode, opens: h.hours.split("–")[0]?.trim() ?? "", closes: h.hours.split("–")[1]?.trim() ?? "" }
    })
}

/* ── Static Params ───────────────────────────────────────────── */

export async function generateStaticParams() {
  try {
    const listings = await getAllDirectoryListingSlugs()
    return listings.map((l) => ({ niche: l.niche, provider: l.slug }))
  } catch {
    return []
  }
}

/* ── Metadata ────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, provider: providerSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) return { title: "Not Found" }

  const data = await resolveProvider(nicheSlug, providerSlug)
  const providerName = data?.businessName ?? providerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const ratingText = data?.rating ? `Rated ${data.rating}/5 (${data.reviewCount} reviews). ` : ""

  return {
    title: `${providerName} — ${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    description: `${providerName} provides ${niche.label.toLowerCase()} services in ${cityConfig.name}, ${cityConfig.state}. ${ratingText}${niche.description}. Get a free quote today.`,
    alternates: { canonical: `https://${cityConfig.domain}/${niche.slug}/${data?.slug ?? providerSlug}` },
    openGraph: {
      title: `${providerName} — ${niche.label} in ${cityConfig.name}`,
      description: `${ratingText}${niche.description}. Serving ${cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.`,
      type: "website",
      url: `https://${cityConfig.domain}/${niche.slug}/${data?.slug ?? providerSlug}`,
      siteName: cityConfig.domain,
      images: [{ url: `/api/og/${niche.slug}/${data?.slug ?? providerSlug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  }
}

/* ── Page ─────────────────────────────────────────────────────── */

export default async function ProviderPage({ params }: Props) {
  const { niche: nicheSlug, provider: providerSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) notFound()

  const data = await resolveProvider(nicheSlug, providerSlug)

  const providerName = data?.businessName ?? providerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const nicheContent = getNicheContent(niche.slug)

  // Use provider's actual services, fall back to niche-content, then inline helper
  const services = (data?.servicesOffered?.length ?? 0) > 0
    ? data!.servicesOffered
    : nicheContent?.commonServices ?? getServicesForNiche(niche.slug, niche.label)
  const certifications = nicheContent?.certifications ?? getCertificationsForNiche(niche.slug)
  const emergencyServices = nicheContent?.emergencyServices ?? []
  const pricingRanges = nicheContent?.pricingRanges ?? []
  const comparisonPoints = nicheContent?.comparisonPoints ?? []
  const trustSignals = nicheContent?.trustSignals ?? []
  const seasonalTips = nicheContent?.seasonalTips ?? []

  // Merge niche-content FAQs (richer) with personalized provider FAQs
  const personalizedFaqs = getFAQsForNiche(niche.label, providerName)
  const nicheFaqs = nicheContent?.faqItems ?? []
  const faqs = [...nicheFaqs, ...personalizedFaqs]

  const parsedHours = data ? parseHoursFromJson(data.hoursJson) : null
  const parsedReviews = data ? parseReviewsFromJson(data.reviewsJson) : []
  const localSeo = getLocalSeoSnippet(niche.slug)
  const ratingDist = computeRatingDistribution(parsedReviews)

  // Related providers (for cross-links at bottom)
  let relatedListings: Awaited<ReturnType<typeof getDirectoryListingsByNiche>> = []
  try {
    const allListings = await getDirectoryListingsByNiche(niche.slug, { limit: 6 })
    relatedListings = allListings.filter((l) => l.slug !== (data?.slug ?? providerSlug))
  } catch {
    // DB unavailable
  }

  const phone = data?.phone ?? null
  const website = data?.website ?? null
  const rating = data?.rating ?? null
  const reviewCount = data?.reviewCount ?? 0
  const isVerified = data?.isVerified ?? false
  const isListing = data?.type === "listing"
  const hasPhotos = (data?.photoRefs?.length ?? 0) > 0
  const heroPhoto = hasPhotos ? getPhotoSrc(data!.photoRefs[0], 1200) : null

  const mapsUrl = data?.latitude && data?.longitude
    ? `https://maps.google.com/?q=${data.latitude},${data.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${providerName} ${cityConfig.name} ${cityConfig.stateCode}`)}`

  const mapsEmbedUrl = data?.latitude && data?.longitude
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}&z=14&output=embed`
    : null

  // Determine if "open now" based on parsed hours
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const todayHours = parsedHours?.find((h) => h.day.toLowerCase() === todayName.toLowerCase())
  const isOpenToday = todayHours ? todayHours.hours.toLowerCase() !== "closed" && todayHours.hours.length > 0 : false

  return (
    <main className="pb-20 lg:pb-0">

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — IMMERSIVE PHOTO HERO
          ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[400px] md:min-h-[500px] flex flex-col justify-end overflow-hidden">
        {/* Background */}
        {heroPhoto ? (
          <>
            <img
              src={heroPhoto}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}

        {/* Content overlay */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 pb-8 pt-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className={`mb-8 text-sm ${heroPhoto ? "text-white/70" : "text-muted-foreground"}`}>
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={`/${niche.slug}`} className="hover:underline">{niche.label}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={`/${niche.slug}/directory`} className="hover:underline">Directory</Link></li>
              <li aria-hidden="true">/</li>
              <li className={heroPhoto ? "text-white" : "text-foreground"}>{providerName}</li>
            </ol>
          </nav>

          {/* Badges row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isVerified ? (
              <Badge className="bg-green-600 text-white border-green-500 text-xs">
                <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                Verified Provider
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/10 text-white border-white/20">
                <Building2 className="mr-1 h-3 w-3" aria-hidden="true" />
                Listed on {cityConfig.domain}
              </Badge>
            )}
            {rating !== null && (
              <span className="flex items-center gap-1.5">
                <Stars count={rating} size="lg" label={`${rating} out of 5 stars based on ${reviewCount} reviews`} />
                <span className={`font-semibold ${heroPhoto ? "text-white" : "text-foreground"}`}>{rating.toFixed(1)}</span>
                <span className={`text-sm ${heroPhoto ? "text-white/70" : "text-muted-foreground"}`}>({reviewCount})</span>
              </span>
            )}
          </div>

          {/* Business name */}
          <h1 className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${heroPhoto ? "text-white" : "text-foreground"}`}>
            {providerName}
          </h1>
          <p className={`mt-2 text-lg ${heroPhoto ? "text-white/80" : "text-muted-foreground"}`}>
            {niche.icon} {niche.label} &middot; {data?.addressCity ?? cityConfig.name}, {data?.addressState ?? cityConfig.stateCode}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base px-6">
              <a href="#quote">
                Get a Free Quote
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            {phone && (
              <Button asChild size="lg" variant={heroPhoto ? "secondary" : "outline"} className={`text-base px-6 ${heroPhoto ? "bg-white/15 text-white border-white/25 hover:bg-white/25 backdrop-blur-sm" : ""}`}>
                <a href={`tel:${phone.replace(/\D/g, "")}`} aria-label={`Call ${providerName} at ${phone}`}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  {phone}
                </a>
              </Button>
            )}
          </div>

          {/* Photo Gallery */}
          {hasPhotos && data!.photoRefs.length > 1 && (
            <PhotoGalleryDialog
              thumbnailUrls={data!.photoRefs.map((ref) => getPhotoSrc(ref, 400))}
              fullUrls={data!.photoRefs.map((ref) => getPhotoSrc(ref, 800))}
              providerName={providerName}
            />
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — TRUST BAR (sticky)
          ══════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm shadow-sm print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          {rating !== null && (
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {rating.toFixed(1)} Rating
            </span>
          )}
          {isVerified ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Verified
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Listed
            </span>
          )}
          {data?.avgResponseTime ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              ~{Math.round(data.avgResponseTime / 60)} min response
            </span>
          ) : isOpenToday ? (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              Available today
            </span>
          ) : null}
          {data?.yearEstablished && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Award className="h-4 w-4" aria-hidden="true" />
              Est. {data.yearEstablished}
            </span>
          )}
          <div className="ml-auto hidden sm:block">
            <Button asChild size="sm">
              <a href="#quote">
                Get Quote
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          UNCLAIMED LISTING BANNER
          ══════════════════════════════════════════════════════════ */}
      {isListing && (
        <div className="border-b bg-amber-50 dark:bg-amber-950/20">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              This listing was created from public business data.{" "}
              <strong>Is this your business?</strong>
            </p>
            <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40">
              <Link href={`/for-business/claim?niche=${niche.slug}&listing=${data!.id}`}>
                Claim it free
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — SECTION NAV TABS
          ══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-[53px] z-30 border-b bg-background print:hidden" aria-label="Page sections">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {[
              { id: "about", label: "About" },
              { id: "reviews", label: `Reviews${reviewCount ? ` (${reviewCount})` : ""}` },
              { id: "services", label: "Services" },
              ...(pricingRanges.length > 0 ? [{ id: "pricing", label: "Pricing" }] : []),
              { id: "area", label: "Service Area" },
              { id: "faq", label: "FAQ" },
            ].map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — MAIN CONTENT + SIDEBAR
          ══════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 py-10 lg:grid-cols-3">

          {/* ── Main content (left 2/3) ────────────────────────── */}
          <div className="space-y-10 lg:col-span-2 print:col-span-3">

            {/* ── About ────────────────────────────────────────── */}
            <section id="about" className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">About {providerName}</h2>
              {data?.description ? (
                <p className="leading-relaxed text-muted-foreground">{data.description}</p>
              ) : (
                <p className="leading-relaxed text-muted-foreground">
                  {providerName} is a trusted {niche.label.toLowerCase()} provider serving the greater {cityConfig.name} area.
                  With a commitment to quality, they deliver reliable {niche.label.toLowerCase()} services to residential and
                  commercial customers throughout {cityConfig.serviceArea.slice(0, 4).join(", ")}, and surrounding communities.
                </p>
              )}
              {localSeo && (
                <p className="mt-3 leading-relaxed text-muted-foreground text-sm">{localSeo}</p>
              )}

              {/* Category badges */}
              {data?.categories && data.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.categories.slice(0, 6).map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                  ))}
                </div>
              )}

              {/* ── Business Highlights Dashboard ─────────────── */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {data?.yearEstablished && (
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <Clock className="mx-auto mb-1.5 h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="text-2xl font-bold">{new Date().getFullYear() - data.yearEstablished}+</p>
                      <p className="text-xs text-muted-foreground">Years in Business</p>
                    </CardContent>
                  </Card>
                )}
                {rating !== null && (
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <Star className="mx-auto mb-1.5 h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                      <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{reviewCount} Reviews</p>
                    </CardContent>
                  </Card>
                )}
                {data?.avgResponseTime ? (
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <MessageSquare className="mx-auto mb-1.5 h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="text-2xl font-bold">~{Math.round(data.avgResponseTime / 60)} min</p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </CardContent>
                  </Card>
                ) : isOpenToday ? (
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <span className="mx-auto mb-1.5 flex justify-center">
                        <span className="relative flex h-5 w-5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-5 w-5 rounded-full bg-green-500" />
                        </span>
                      </span>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">Open Now</p>
                      <p className="text-xs text-muted-foreground">Available Today</p>
                    </CardContent>
                  </Card>
                ) : null}
                {(data?.insurance || data?.license) && (
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <Shield className="mx-auto mb-1.5 h-5 w-5 text-green-600" aria-hidden="true" />
                      <p className="text-lg font-bold">
                        {data.insurance && data.license ? "Yes" : data.insurance ? "Insured" : "Licensed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.insurance && data.license ? "Licensed & Insured" : data.insurance ? "Fully Insured" : "Licensed"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Trust signals from niche content (fallback for scraped listings) */}
              {!(data?.yearEstablished || data?.insurance || data?.license) && trustSignals.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trustSignals.map((signal) => (
                    <Badge key={signal} variant="outline" className="text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3 text-primary" aria-hidden="true" />
                      {signal}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Why Choose This Provider ─────────────────────── */}
            {(comparisonPoints.length > 0 || trustSignals.length > 0) && (
              <>
                <section className="scroll-mt-28">
                  <h2 className="mb-4 text-2xl font-bold tracking-tight">Why Choose {providerName}?</h2>
                  {trustSignals.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {trustSignals.map((signal) => (
                        <Badge key={signal} variant="secondary" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3 text-primary" aria-hidden="true" />
                          {signal}
                        </Badge>
                      ))}
                      {isVerified && (
                        <Badge className="bg-green-600 text-white text-xs">
                          <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                          Verified on {cityConfig.domain}
                        </Badge>
                      )}
                    </div>
                  )}
                  {comparisonPoints.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {comparisonPoints.map((point) => (
                        <div key={point} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                          <span className="text-sm">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <Separator />
              </>
            )}

            {/* ── Reviews (PROMOTED to #2) ─────────────────────── */}
            <section id="reviews" className="scroll-mt-28">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
                {rating !== null && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    {rating.toFixed(1)} ({reviewCount})
                  </Badge>
                )}
              </div>

              {/* Rating distribution summary */}
              {rating !== null && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      {/* Big rating number */}
                      <div className="flex flex-col items-center gap-1 sm:min-w-[120px]">
                        <span className="text-5xl font-bold tracking-tight">{rating.toFixed(1)}</span>
                        <Stars count={rating} size="lg" />
                        <span className="text-sm text-muted-foreground">{reviewCount} reviews</span>
                      </div>
                      {/* Distribution bars */}
                      <div className="flex-1 space-y-1.5">
                        {ratingDist.map(({ star, count, pct }) => (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-6 text-right font-medium text-muted-foreground">{star}</span>
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-yellow-400 transition-all"
                                style={{ width: `${parsedReviews.length > 0 ? pct : (star === Math.round(rating) ? 100 : 0)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs text-muted-foreground">
                              {parsedReviews.length > 0 ? count : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Individual reviews */}
              {parsedReviews.length > 0 ? (
                <div className="space-y-4">
                  {parsedReviews.slice(0, 6).map((review, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {review.author.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-medium">{review.author}</p>
                                <Stars count={review.rating} />
                              </div>
                              {review.relativeTime && (
                                <span className="flex-shrink-0 text-xs text-muted-foreground">{review.relativeTime}</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-4">{review.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {reviewCount > parsedReviews.length && (
                    <div className="text-center pt-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          See all {reviewCount} reviews on Google
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : rating !== null ? (
                <p className="text-sm text-muted-foreground py-4">
                  Rated {rating.toFixed(1)}/5 based on {reviewCount} Google reviews.{" "}
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    See reviews on Google
                  </a>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  No reviews yet. Be the first to work with {providerName} and share your experience.
                </p>
              )}
            </section>

            <Separator />

            {/* ── Services (Enhanced) ─────────────────────────── */}
            <section id="services" className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Services Offered</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const isEmergency = emergencyServices.some((e) => service.toLowerCase().includes(e.toLowerCase().split(" ")[0]))
                  return (
                    <Card key={service} className="group">
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                        <span className="text-sm font-medium flex-1">{service}</span>
                        {isEmergency && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">24/7</Badge>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            <Separator />

            {/* ── Pricing Guide ───────────────────────────────── */}
            {pricingRanges.length > 0 && (
              <>
                <section id="pricing" className="scroll-mt-28">
                  <h2 className="mb-4 text-2xl font-bold tracking-tight">Typical Pricing</h2>
                  <Card>
                    <CardContent className="pt-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-sm">
                            <th className="pb-2 font-semibold">Service</th>
                            <th className="pb-2 text-right font-semibold">Typical Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingRanges.map(({ service, range }) => (
                            <tr key={service} className="border-b last:border-0 text-sm">
                              <td className="py-2.5">{service}</td>
                              <td className="py-2.5 text-right font-medium text-primary">{range}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Prices are estimates for the {cityConfig.name} area. Contact {providerName} for an exact quote tailored to your project.
                      </p>
                    </CardContent>
                  </Card>
                </section>
                <Separator />
              </>
            )}

            {/* ── Service Area ─────────────────────────────────── */}
            <section id="area" className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Service Area</h2>

              {/* Google Maps Embed */}
              {mapsEmbedUrl && (
                <div className="mb-4 overflow-hidden rounded-lg border">
                  <iframe
                    src={mapsEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${providerName} location on Google Maps`}
                  />
                </div>
              )}

              <Card className="overflow-hidden">
                <div className="bg-muted/50 p-6">
                  {data?.addressFormatted && (
                    <p className="mb-3 text-sm font-medium">
                      <MapPin className="mr-1 inline h-4 w-4 text-primary" aria-hidden="true" />
                      {data.addressFormatted}
                    </p>
                  )}
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    Serving the greater {cityConfig.name} metro area
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {cityConfig.serviceArea.map((area) => (
                      <div key={area} className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm shadow-sm">
                        <ChevronRight className="h-3 w-3 text-primary" aria-hidden="true" />
                        {area}
                      </div>
                    ))}
                  </div>
                  {!mapsEmbedUrl && (
                    <div className="mt-4">
                      <Button asChild variant="outline" size="sm">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                          View on Google Maps
                          <ExternalLink className="ml-2 h-3 w-3" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            <Separator />

            {/* ── Certifications ───────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Certifications &amp; Credentials</h2>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                    <Award className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── FAQ ──────────────────────────────────────────── */}
            <section id="faq" className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* ── Related Providers ─────────────────────────────── */}
            {relatedListings.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-2xl font-bold tracking-tight">
                    Other {niche.label} Providers in {cityConfig.name}
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {relatedListings.slice(0, 4).map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/${niche.slug}/${listing.slug}`}
                        className="flex-shrink-0 w-52 group"
                      >
                        <Card className="h-full transition-colors hover:border-primary/30">
                          <CardContent className="pt-4 pb-3 px-4">
                            <p className="font-semibold text-sm truncate group-hover:text-primary">
                              {listing.businessName}
                            </p>
                            {listing.rating && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                                {listing.rating.toFixed(1)}
                                {listing.reviewCount > 0 && ` (${listing.reviewCount})`}
                              </div>
                            )}
                            {listing.addressCity && (
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                <MapPin className="inline h-3 w-3 mr-0.5" aria-hidden="true" />
                                {listing.addressCity}, {listing.addressState ?? cityConfig.stateCode}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${niche.slug}/directory`}>
                        View all {niche.label.toLowerCase()} providers
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </section>
              </>
            )}

            {/* ── Claim This Listing (scraped only) ────────────── */}
            {isListing && (
              <>
                <Separator />
                <section>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Is this your business?</CardTitle>
                      <CardDescription>
                        Claim your free listing on {cityConfig.domain} to manage your info, respond to leads directly, and appear as a Verified Provider.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />Manage your info</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />Receive leads directly</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />Get Verified badge</span>
                      </div>
                      <Button asChild>
                        <Link href={`/for-business/claim?niche=${niche.slug}&listing=${data!.id}`}>
                          Claim This Listing
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </div>

          {/* ── Sidebar (right 1/3) ────────────────────────────── */}
          <div className="space-y-6 print:hidden">
            {/* ── Quote form ───────────────────────────────────── */}
            <Card id="quote" className="sticky top-28 shadow-lg scroll-mt-28">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                  {nicheContent?.quoteFormTitle ?? "Request a Free Quote"}
                </CardTitle>
                <CardDescription>
                  {nicheContent?.quoteFormDescription
                    ? nicheContent.quoteFormDescription
                    : isVerified
                      ? `Send your request directly to ${providerName}. No obligation.`
                      : `Request forwarded to ${providerName}. No obligation.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Urgency signal */}
                {isOpenToday && (
                  <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                    </span>
                    Available today
                  </div>
                )}
                <ContactForm
                  nicheSlug={niche.slug}
                  providerSlug={data?.slug ?? providerSlug}
                  citySlug={cityConfig.slug}
                  listingId={data?.type === "listing" ? data.id : undefined}
                  submitLabel={`Send Request to ${providerName}`}
                  messagePlaceholder={`Tell ${providerName} about your ${niche.label.toLowerCase()} needs...`}
                />
              </CardContent>
            </Card>

            {/* ── Business hours ────────────────────────────────── */}
            {parsedHours ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                      Business Hours
                    </span>
                    {isOpenToday ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Open</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Closed today</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <tbody>
                      {parsedHours.map(({ day, hours }) => {
                        const isToday = day.toLowerCase() === todayName.toLowerCase()
                        return (
                          <tr key={day} className={`text-sm ${isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            <th scope="row" className="py-1.5 text-left font-medium">
                              {day}
                              {isToday && <span className="ml-1.5 text-xs text-primary">(Today)</span>}
                            </th>
                            <td className="py-1.5 text-right">{hours || "Closed"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Contact {providerName} for current business hours.</p>
                </CardContent>
              </Card>
            )}

            {/* ── Seasonal Tip ──────────────────────────────────── */}
            {seasonalTips.length > 0 && (() => {
              const month = new Date().getMonth()
              const seasonIdx = month < 3 ? 0 : month < 6 ? 1 : month < 9 ? 2 : 3
              const tip = seasonalTips[seasonIdx % seasonalTips.length]
              return tip ? (
                <Card className="border-primary/10 bg-primary/5">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                      Seasonal Tip
                    </p>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </CardContent>
                </Card>
              ) : null
            })()}

            {/* ── Quick contact ─────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {phone && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={`tel:${phone.replace(/\D/g, "")}`} aria-label={`Call ${providerName}`}>
                      <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                      {phone}
                    </a>
                  </Button>
                )}
                {data?.email && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={`mailto:${data.email}`} aria-label={`Email ${providerName}`}>
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      {data.email}
                    </a>
                  </Button>
                )}
                {website && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${providerName} website`}>
                      <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
                      Visit Website
                      <ExternalLink className="ml-auto h-3 w-3" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${providerName} on map`}>
                    <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                    View on Map
                    <ExternalLink className="ml-auto h-3 w-3" aria-hidden="true" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* ── Own This Business? (scraped only) ────────────── */}
            {isListing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Own This Business?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Claim this listing to manage your info, respond to leads, and get verified.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/for-business/claim?niche=${niche.slug}&listing=${data!.id}`}>
                      Claim Listing
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE STICKY CTA BAR
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:hidden print:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {phone ? (
            <>
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:${phone.replace(/\D/g, "")}`}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  Call
                </a>
              </Button>
              <Button asChild className="flex-1">
                <a href="#quote">
                  <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                  Get Free Quote
                </a>
              </Button>
            </>
          ) : (
            <Button asChild className="flex-1">
              <a href="#quote">
                <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                Get a Free Quote
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SCHEMA.ORG JSON-LD (Enhanced)
          ══════════════════════════════════════════════════════════ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "LocalBusiness",
                name: providerName,
                description: data?.description ?? `${niche.label} services in ${cityConfig.name}, ${cityConfig.state}. ${niche.description}.`,
                url: `https://${cityConfig.domain}/${niche.slug}/${data?.slug ?? providerSlug}`,
                ...(phone ? { telephone: phone } : {}),
                ...(website ? { sameAs: [website] } : {}),
                address: {
                  "@type": "PostalAddress",
                  ...(data?.addressStreet ? { streetAddress: data.addressStreet } : {}),
                  addressLocality: data?.addressCity ?? cityConfig.name,
                  addressRegion: data?.addressState ?? cityConfig.stateCode,
                  ...(data?.addressZip ? { postalCode: data.addressZip } : {}),
                  addressCountry: "US",
                },
                ...(data?.latitude && data?.longitude ? {
                  geo: { "@type": "GeoCoordinates", latitude: data.latitude, longitude: data.longitude },
                } : {
                  geo: { "@type": "GeoCoordinates", latitude: cityConfig.coordinates.lat, longitude: cityConfig.coordinates.lng },
                }),
                hasMap: mapsUrl,
                areaServed: cityConfig.serviceArea.map((area) => ({ "@type": "City", name: area })),
                ...(rating !== null ? {
                  aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toString(), reviewCount: reviewCount.toString(), bestRating: "5" },
                } : {}),
                // Individual reviews for rich snippets
                ...(parsedReviews.length > 0 ? {
                  review: parsedReviews.slice(0, 5).map((r) => ({
                    "@type": "Review",
                    author: { "@type": "Person", name: r.author },
                    reviewRating: { "@type": "Rating", ratingValue: r.rating.toString(), bestRating: "5" },
                    reviewBody: r.text,
                  })),
                } : {}),
                // Opening hours
                ...(buildOpeningHoursSpec(parsedHours) ? { openingHoursSpecification: buildOpeningHoursSpec(parsedHours) } : {}),
                makesOffer: services.map((service) => {
                  const priceMatch = pricingRanges.find((p) => service.toLowerCase().includes(p.service.toLowerCase().split(" ")[0]))
                  return {
                    "@type": "Offer",
                    itemOffered: { "@type": "Service", name: service, provider: { "@type": "LocalBusiness", name: providerName } },
                    ...(priceMatch ? { priceSpecification: { "@type": "UnitPriceSpecification", priceCurrency: "USD", price: priceMatch.range } } : {}),
                  }
                }),
                potentialAction: {
                  "@type": "CommunicateAction",
                  target: `https://${cityConfig.domain}/${niche.slug}/${data?.slug ?? providerSlug}#quote`,
                  name: "Request a Free Quote",
                },
                priceRange: niche.avgProjectValue,
                image: hasPhotos ? getPhotoSrc(data!.photoRefs[0], 800) : `/api/og/${niche.slug}/${data?.slug ?? providerSlug}`,
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `https://${cityConfig.domain}` },
                  { "@type": "ListItem", position: 2, name: niche.label, item: `https://${cityConfig.domain}/${niche.slug}` },
                  { "@type": "ListItem", position: 3, name: providerName, item: `https://${cityConfig.domain}/${niche.slug}/${data?.slug ?? providerSlug}` },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              },
            ],
          }),
        }}
      />

      <InternalLinks niche={niche.slug} currentPage="directory" />
    </main>
  )
}
