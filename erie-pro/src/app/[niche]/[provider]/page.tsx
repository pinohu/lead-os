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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import ContactForm from "@/components/contact-form"

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

function Stars({ count, label }: { count: number; label?: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={label ?? `${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(count) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
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

  // Fallback: if no DB data, derive from slug (for backwards compatibility during builds)
  const providerName = data?.businessName ?? providerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const services = getServicesForNiche(niche.slug, niche.label)
  const certifications = getCertificationsForNiche(niche.slug)
  const faqs = getFAQsForNiche(niche.label, providerName)
  const parsedHours = data ? parseHoursFromJson(data.hoursJson) : null
  const parsedReviews = data ? parseReviewsFromJson(data.reviewsJson) : []
  const localSeo = getLocalSeoSnippet(niche.slug)

  const phone = data?.phone ?? null
  const website = data?.website ?? null
  const rating = data?.rating ?? null
  const reviewCount = data?.reviewCount ?? 0
  const isVerified = data?.isVerified ?? false
  const isListing = data?.type === "listing"
  const hasPhotos = (data?.photoRefs?.length ?? 0) > 0

  const mapsUrl = data?.latitude && data?.longitude
    ? `https://maps.google.com/?q=${data.latitude},${data.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${providerName} ${cityConfig.name} ${cityConfig.stateCode}`)}`

  return (
    <main className="pb-16">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href={`/${niche.slug}`}>{niche.label}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{providerName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background pb-12 pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isVerified ? (
                  <Badge variant="success" className="text-xs">
                    <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                    Verified Provider
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Building2 className="mr-1 h-3 w-3" aria-hidden="true" />
                    Listed on {cityConfig.domain}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {niche.icon} {niche.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="mr-1 h-3 w-3" aria-hidden="true" />
                  {data?.addressCity ?? cityConfig.name}, {data?.addressState ?? cityConfig.stateCode}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {providerName}
              </h1>

              <p className="mt-2 text-lg text-muted-foreground">
                {niche.label} services in {data?.addressCity ?? cityConfig.name}, {data?.addressState ?? cityConfig.stateCode}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {rating !== null && (
                  <span className="flex items-center gap-1">
                    <Stars count={rating} label={`${rating} out of 5 stars based on ${reviewCount} reviews`} />
                    <span className="ml-1 font-medium text-foreground">{rating.toFixed(1)}</span>
                    ({reviewCount} reviews)
                  </span>
                )}
                {rating !== null && (data?.avgResponseTime || phone) && (
                  <Separator orientation="vertical" className="h-4" />
                )}
                {data?.avgResponseTime ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Responds in ~{Math.round(data.avgResponseTime / 60)} min
                  </span>
                ) : phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Available for estimates
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <a href="#quote">
                  Get a Free Quote
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              {phone && (
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:${phone.replace(/\D/g, "")}`} aria-label={`Call ${providerName} at ${phone}`}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                    {phone}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo Gallery ────────────────────────────────────── */}
      {hasPhotos && (
        <section className="border-b bg-muted/10 py-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {data!.photoRefs.slice(0, 5).map((ref, i) => (
                <img
                  key={i}
                  src={`/api/places-photo?ref=${encodeURIComponent(ref)}&w=400`}
                  alt={`${providerName} — ${niche.label} in ${cityConfig.name} (photo ${i + 1})`}
                  className="h-48 w-72 flex-shrink-0 rounded-lg object-cover shadow-sm"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 py-12 lg:grid-cols-3">
          {/* ── Main content (left 2/3) ────────────────────────── */}
          <div className="space-y-10 lg:col-span-2">

            {/* ── About ────────────────────────────────────────── */}
            <section>
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
              {(data?.yearEstablished || data?.insurance || data?.license) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.yearEstablished && (
                    <Badge variant="outline" className="text-xs">Est. {data.yearEstablished}</Badge>
                  )}
                  {data.insurance && (
                    <Badge variant="outline" className="text-xs"><Shield className="mr-1 h-3 w-3" aria-hidden="true" />Insured</Badge>
                  )}
                  {data.license && (
                    <Badge variant="outline" className="text-xs"><Award className="mr-1 h-3 w-3" aria-hidden="true" />Licensed</Badge>
                  )}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Services ─────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Services Offered</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <div key={service} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-sm">{service}</span>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Service area ─────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Service Area</h2>
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
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                        View on Google Maps
                        <ExternalLink className="ml-2 h-3 w-3" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </section>

            <Separator />

            {/* ── Reviews ──────────────────────────────────────── */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
                {rating !== null && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    {rating.toFixed(1)} ({reviewCount} reviews)
                  </Badge>
                )}
              </div>

              {parsedReviews.length > 0 ? (
                <div className="space-y-4">
                  {parsedReviews.map((review, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {review.author.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{review.author}</p>
                                <Stars count={review.rating} />
                              </div>
                              {review.relativeTime && (
                                <span className="text-xs text-muted-foreground">{review.relativeTime}</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {reviewCount > parsedReviews.length && (
                    <p className="text-center text-sm text-muted-foreground">
                      Based on {reviewCount} Google reviews.{" "}
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        See all reviews
                      </a>
                    </p>
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
            <section>
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
          <div className="space-y-6">
            {/* ── Quote form ───────────────────────────────────── */}
            <Card id="quote" className="sticky top-20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                  Request a Free Quote
                </CardTitle>
                <CardDescription>
                  Send your request directly to {providerName}. No obligation.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <tbody>
                      {parsedHours.map(({ day, hours }) => {
                        const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase().startsWith(day.toLowerCase().slice(0, 3))
                        return (
                          <tr key={day} className={`text-sm ${isToday ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            <th scope="row" className="py-1.5 text-left font-medium">{day}</th>
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

      {/* ── Schema.org JSON-LD ──────────────────────────────── */}
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
                areaServed: cityConfig.serviceArea.map((area) => ({ "@type": "City", name: area })),
                ...(rating !== null ? {
                  aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toString(), reviewCount: reviewCount.toString(), bestRating: "5" },
                } : {}),
                makesOffer: services.map((service) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: service, provider: { "@type": "LocalBusiness", name: providerName } },
                })),
                priceRange: niche.avgProjectValue,
                image: hasPhotos ? `/api/places-photo?ref=${encodeURIComponent(data!.photoRefs[0])}&w=800` : `/api/og/${niche.slug}/${data?.slug ?? providerSlug}`,
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
    </main>
  )
}
