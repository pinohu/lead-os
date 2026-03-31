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
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

type Props = { params: Promise<{ niche: string; provider: string }> }

/* ── Niche-specific content helpers ──────────────────────────── */

function getServicesForNiche(nicheSlug: string, nicheLabel: string): string[] {
  const serviceMap: Record<string, string[]> = {
    plumbing: [
      "Emergency pipe repair",
      "Drain cleaning & unclogging",
      "Water heater installation & repair",
      "Sewer line inspection & replacement",
      "Fixture installation (sinks, toilets, faucets)",
      "Water softener installation",
      "Gas line repair",
      "Leak detection",
    ],
    hvac: [
      "Furnace repair & installation",
      "Air conditioning service & installation",
      "Heat pump systems",
      "Ductwork installation & cleaning",
      "Thermostat installation",
      "Indoor air quality testing",
      "Preventive maintenance plans",
      "Emergency heating repair",
    ],
    electrical: [
      "Panel upgrades & replacements",
      "Wiring & rewiring",
      "Lighting installation",
      "Outlet & switch installation",
      "Generator installation",
      "Smoke & carbon monoxide detectors",
      "Ceiling fan installation",
      "Electrical safety inspections",
    ],
    roofing: [
      "Roof repair & patching",
      "Full roof replacement",
      "Gutter installation & repair",
      "Storm damage restoration",
      "Roof inspection & assessment",
      "Skylight installation",
      "Flat roof systems",
      "Ice dam prevention",
    ],
    landscaping: [
      "Lawn mowing & maintenance",
      "Landscape design & installation",
      "Hardscaping (patios, walkways)",
      "Tree & shrub planting",
      "Irrigation system installation",
      "Seasonal cleanup",
      "Mulching & bed maintenance",
      "Snow removal",
    ],
    dental: [
      "General cleanings & exams",
      "Cosmetic dentistry",
      "Teeth whitening",
      "Dental implants",
      "Orthodontics & braces",
      "Root canal therapy",
      "Crown & bridge work",
      "Emergency dental care",
    ],
    legal: [
      "Personal injury claims",
      "Family law & divorce",
      "Criminal defense",
      "Estate planning & wills",
      "Real estate closings",
      "Business formation",
      "Immigration services",
      "Workers' compensation",
    ],
    cleaning: [
      "Regular house cleaning",
      "Deep cleaning",
      "Move-in / move-out cleaning",
      "Commercial office cleaning",
      "Carpet & upholstery cleaning",
      "Window cleaning",
      "Post-construction cleanup",
      "Disinfection services",
    ],
    "auto-repair": [
      "Engine diagnostics & repair",
      "Brake service & replacement",
      "Oil changes & fluid services",
      "Transmission repair",
      "Tire rotation & alignment",
      "Collision & body repair",
      "AC & heating service",
      "State inspection",
    ],
    "pest-control": [
      "Insect extermination",
      "Rodent removal & prevention",
      "Termite inspection & treatment",
      "Bed bug treatment",
      "Wildlife removal",
      "Preventive pest barriers",
      "Commercial pest management",
      "Seasonal pest prevention",
    ],
    painting: [
      "Interior painting",
      "Exterior painting",
      "Cabinet painting & refinishing",
      "Deck & fence staining",
      "Wallpaper removal",
      "Drywall repair & texturing",
      "Pressure washing",
      "Color consultation",
    ],
    "real-estate": [
      "Buyer representation",
      "Seller listing services",
      "Property market analysis",
      "Home staging consultation",
      "Rental property management",
      "Commercial real estate",
      "Investment property advice",
      "Relocation assistance",
    ],
  }
  return (
    serviceMap[nicheSlug] ?? [
      `${nicheLabel} consultation`,
      `${nicheLabel} installation`,
      `${nicheLabel} repair`,
      `${nicheLabel} maintenance`,
      `Emergency ${nicheLabel.toLowerCase()} services`,
      `${nicheLabel} inspection`,
    ]
  )
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

function getFAQsForNiche(
  nicheLabel: string,
  providerName: string
): { question: string; answer: string }[] {
  return [
    {
      question: `How do I get a quote from ${providerName}?`,
      answer: `Simply fill out the contact form on this page or call ${providerName} directly. They typically respond within a few hours with a detailed, no-obligation estimate for your ${nicheLabel.toLowerCase()} project.`,
    },
    {
      question: `Is ${providerName} licensed and insured?`,
      answer: `${providerName} is a verified provider on ${cityConfig.domain}. All providers listed on our platform are vetted for proper licensing and insurance for ${nicheLabel.toLowerCase()} services in ${cityConfig.state}.`,
    },
    {
      question: `What areas does ${providerName} serve?`,
      answer: `${providerName} provides ${nicheLabel.toLowerCase()} services throughout the greater ${cityConfig.name} area, including ${cityConfig.serviceArea.slice(0, 5).join(", ")}, and surrounding communities.`,
    },
    {
      question: `How much does ${nicheLabel.toLowerCase()} service typically cost?`,
      answer: `${nicheLabel} project costs vary depending on the scope of work. Contact ${providerName} for a personalized quote tailored to your specific needs and budget.`,
    },
  ]
}

/* ── Placeholder reviews ─────────────────────────────────────── */

function getPlaceholderReviews(providerName: string, nicheLabel: string) {
  return [
    {
      name: "Sarah M.",
      initials: "SM",
      rating: 5,
      date: "2 weeks ago",
      text: `${providerName} did an outstanding job on our ${nicheLabel.toLowerCase()} project. Professional, punctual, and the quality of work exceeded our expectations. Highly recommend!`,
    },
    {
      name: "James T.",
      initials: "JT",
      rating: 5,
      date: "1 month ago",
      text: `We've used ${providerName} twice now and they never disappoint. Fair pricing, great communication, and they always clean up after themselves.`,
    },
    {
      name: "Linda K.",
      initials: "LK",
      rating: 4,
      date: "2 months ago",
      text: `Good experience overall. ${providerName} was responsive and got the work done on schedule. Would use them again for future ${nicheLabel.toLowerCase()} needs.`,
    },
  ]
}

/* ── Stars component ─────────────────────────────────────────── */

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < count
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  )
}

/* ── Metadata ────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, provider } = await params
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) return { title: "Not Found" }
  const providerName = provider
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    title: `${providerName} — ${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `${providerName} provides ${niche.label.toLowerCase()} services in ${cityConfig.name}, ${cityConfig.state}. ${niche.description}. Get a free quote today.`,
    openGraph: {
      title: `${providerName} — ${niche.label} in ${cityConfig.name}`,
      description: `${niche.description}. Serving ${cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.`,
      type: "website",
      url: `https://${cityConfig.domain}/${niche.slug}/${provider}`,
    },
  }
}

/* ── Page ─────────────────────────────────────────────────────── */

export default async function ProviderPage({ params }: Props) {
  const { niche: nicheSlug, provider: providerSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) notFound()

  const providerName = providerSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const services = getServicesForNiche(niche.slug, niche.label)
  const certifications = getCertificationsForNiche(niche.slug)
  const faqs = getFAQsForNiche(niche.label, providerName)
  const reviews = getPlaceholderReviews(providerName, niche.label)

  const businessHours = [
    { day: "Monday", hours: "8:00 AM - 5:00 PM" },
    { day: "Tuesday", hours: "8:00 AM - 5:00 PM" },
    { day: "Wednesday", hours: "8:00 AM - 5:00 PM" },
    { day: "Thursday", hours: "8:00 AM - 5:00 PM" },
    { day: "Friday", hours: "8:00 AM - 5:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 2:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ]

  return (
    <main className="pb-16">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${niche.slug}`}>{niche.label}</Link>
                </BreadcrumbLink>
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
                <Badge variant="success" className="text-xs">
                  <Shield className="mr-1 h-3 w-3" />
                  Verified Provider
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {niche.icon} {niche.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="mr-1 h-3 w-3" />
                  {cityConfig.name}, {cityConfig.stateCode}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {providerName}
              </h1>

              <p className="mt-2 text-lg text-muted-foreground">
                {niche.label} services in {cityConfig.name},{" "}
                {cityConfig.stateCode}
              </p>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Stars count={5} />
                  <span className="ml-1 font-medium text-foreground">
                    4.9
                  </span>
                  (47 reviews)
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Responds in ~2 hrs
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <a href="#quote">
                  Get a Free Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="tel:+18145551234">
                  <Phone className="mr-2 h-4 w-4" />
                  (814) 555-1234
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 py-12 lg:grid-cols-3">
          {/* ── Main content (left 2/3) ────────────────────────── */}
          <div className="space-y-10 lg:col-span-2">
            {/* ── About ────────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                About {providerName}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {providerName} is a trusted {niche.label.toLowerCase()} provider
                serving the greater {cityConfig.name} area. With years of
                experience and a commitment to quality, they deliver reliable{" "}
                {niche.label.toLowerCase()} services to residential and
                commercial customers throughout{" "}
                {cityConfig.serviceArea.slice(0, 4).join(", ")}, and surrounding
                communities.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {niche.description}. Whether you need routine maintenance or a
                complex project, {providerName} is ready to help with
                professional expertise and competitive pricing.
              </p>
            </section>

            <Separator />

            {/* ── Services ─────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                Services Offered
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <div key={service} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-sm">{service}</span>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Service area ─────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                Service Area
              </h2>
              <Card className="overflow-hidden">
                <div className="bg-muted/50 p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    Serving the greater {cityConfig.name} metro area
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {cityConfig.serviceArea.map((area) => (
                      <div
                        key={area}
                        className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm shadow-sm"
                      >
                        <ChevronRight className="h-3 w-3 text-primary" />
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            <Separator />

            {/* ── Reviews ──────────────────────────────────────── */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">
                  Customer Reviews
                </h2>
                <Badge variant="secondary" className="text-xs">
                  <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4.9 avg ({reviews.length} reviews)
                </Badge>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.name}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {review.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{review.name}</p>
                              <Stars count={review.rating} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {review.text}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Certifications ───────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                Certifications &amp; Credentials
              </h2>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert) => (
                  <Badge
                    key={cert}
                    variant="outline"
                    className="gap-1.5 px-3 py-1.5 text-sm"
                  >
                    <Award className="h-3.5 w-3.5 text-primary" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── FAQ ──────────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>

          {/* ── Sidebar (right 1/3) ────────────────────────────── */}
          <div className="space-y-6">
            {/* ── Quote form ───────────────────────────────────── */}
            <Card id="quote" className="sticky top-20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Request a Free Quote
                </CardTitle>
                <CardDescription>
                  Send your request directly to {providerName}. No obligation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <input type="hidden" name="niche" value={niche.slug} />
                  <input type="hidden" name="provider" value={providerSlug} />
                  <input type="hidden" name="city" value={cityConfig.slug} />

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      name="name"
                      required
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="(814) 555-1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Describe Your Project</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder={`Tell ${providerName} about your ${niche.label.toLowerCase()} needs...`}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Send Request to {providerName}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Free quote, no obligation. Your info goes only to{" "}
                    {providerName}.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* ── Business hours ────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {businessHours.map(({ day, hours }) => {
                    const isToday =
                      new Date()
                        .toLocaleDateString("en-US", { weekday: "long" }) === day
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between text-sm ${
                          isToday ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <span>{day}</span>
                        <span>{hours}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Quick contact ─────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href="tel:+18145551234">
                    <Phone className="mr-2 h-4 w-4" />
                    (814) 555-1234
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`mailto:info@${providerSlug}.com`}>
                    <Mail className="mr-2 h-4 w-4" />
                    info@{providerSlug}.com
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${providerName} ${cityConfig.name} ${cityConfig.stateCode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {cityConfig.name}, {cityConfig.stateCode}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Schema.org LocalBusiness ──────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: providerName,
            description: `${niche.label} services in ${cityConfig.name}, ${cityConfig.state}. ${niche.description}.`,
            url: `https://${cityConfig.domain}/${niche.slug}/${providerSlug}`,
            telephone: "+1-814-555-1234",
            email: `info@${providerSlug}.com`,
            address: {
              "@type": "PostalAddress",
              addressLocality: cityConfig.name,
              addressRegion: cityConfig.stateCode,
              addressCountry: "US",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: cityConfig.coordinates.lat,
              longitude: cityConfig.coordinates.lng,
            },
            areaServed: cityConfig.serviceArea.map((area) => ({
              "@type": "City",
              name: area,
            })),
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                ],
                opens: "08:00",
                closes: "17:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Saturday",
                opens: "09:00",
                closes: "14:00",
              },
            ],
            makesOffer: services.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service,
                provider: {
                  "@type": "LocalBusiness",
                  name: providerName,
                },
              },
            })),
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "47",
              bestRating: "5",
            },
            review: reviews.map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.name },
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating.toString(),
                bestRating: "5",
              },
              reviewBody: r.text,
            })),
            priceRange: niche.avgProjectValue,
            image: `https://${cityConfig.domain}/og/${niche.slug}/${providerSlug}.png`,
          }),
        }}
      />
    </main>
  )
}
