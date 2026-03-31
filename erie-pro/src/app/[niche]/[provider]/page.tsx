import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight, MapPin, Shield, CheckCircle2 } from "lucide-react"
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

type Props = { params: Promise<{ niche: string; provider: string }> }

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
  }
}

export default async function ProviderPage({ params }: Props) {
  const { niche: nicheSlug, provider: providerSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) notFound()

  const providerName = providerSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="success" className="mb-4">
            <Shield className="mr-1.5 h-3 w-3" />
            Verified {cityConfig.name} Provider
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {providerName}
          </h1>

          <p className="mt-2 text-lg text-muted-foreground">
            {niche.icon} {niche.label} in {cityConfig.name},{" "}
            {cityConfig.stateCode}
          </p>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {niche.description}. Serving{" "}
            {cityConfig.serviceArea.slice(0, 5).join(", ")} and
            surrounding areas.
          </p>

          <div className="mt-6">
            <Button asChild size="lg">
              <a href="#contact">
                Request a Free Quote from {providerName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Provider info ───────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Service Area</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cityConfig.serviceArea.join(", ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {niche.label} — {niche.description}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project Range</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {niche.avgProjectValue}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Contact form ────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Contact {providerName}</CardTitle>
            <CardDescription>
              Send your request directly to {providerName} in{" "}
              {cityConfig.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <input type="hidden" name="niche" value={niche.slug} />
              <input type="hidden" name="provider" value={providerSlug} />
              <input type="hidden" name="city" value={cityConfig.slug} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                />
                <Input
                  type="tel"
                  name="phone"
                  required
                  placeholder="Phone"
                />
              </div>
              <Input
                type="email"
                name="email"
                required
                placeholder="Email"
              />
              <textarea
                name="message"
                rows={3}
                placeholder="What do you need?"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit" className="w-full" size="lg">
                Send Request to {providerName}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* ── Schema.org ──────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: providerName,
            description: `${niche.label} services in ${cityConfig.name}, ${cityConfig.state}`,
            url: `https://${cityConfig.domain}/${niche.slug}/${providerSlug}`,
            areaServed: cityConfig.serviceArea.map((area) => ({
              "@type": "City",
              name: area,
            })),
            makesOffer: {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: niche.label,
                description: niche.description,
              },
            },
          }),
        }}
      />
    </main>
  )
}
