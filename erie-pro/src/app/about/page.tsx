import Link from "next/link"
import type { Metadata } from "next"
import {
  MapPin,
  Shield,
  Users,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: `About ${cityConfig.domain} — Erie's Local Service Directory`,
  description: `Learn about ${cityConfig.domain}, Erie's trusted platform for finding verified local service providers. Our mission, our model, and our commitment to the community.`,
  alternates: { canonical: 'https://erie.pro/about' },
}

export default function AboutPage() {
  return (
    <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>About</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Building2 className="mr-1.5 h-3 w-3" />
            About Us
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            About {cityConfig.domain}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The trusted way to find verified local service providers in{" "}
            {cityConfig.name}, {cityConfig.stateCode}. Built for the
            community, by people who know Erie.
          </p>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          Our Mission
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Finding a reliable service provider shouldn&apos;t be a gamble.
            Whether you need an emergency plumber during an Erie blizzard or
            a dentist who&apos;s accepting new patients, you deserve to find
            trustworthy professionals quickly and confidently.
          </p>
          <p>
            {cityConfig.domain} is Erie&apos;s dedicated local service
            directory. We verify every provider on our platform — checking
            licenses, insurance, and reputation — so you don&apos;t have to.
            No anonymous listings. No paid placements disguised as
            recommendations. Just verified local professionals serving the
            Erie community.
          </p>
        </div>
      </section>

      {/* ── Founded in Erie ─────────────────────────────────── */}
      <section className="border-t bg-primary/5 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Founded in Erie
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Founded in 2024 by a team of Erie natives who saw local service
              providers struggling to compete with national platforms. We believe
              the best plumber in Millcreek shouldn&apos;t lose business to an
              algorithm in Silicon Valley.
            </p>
            <p>
              We grew up here. We know that when a pipe bursts during a Lake
              Erie blizzard, you need someone who knows the roads, knows the
              houses, and can actually get to you. That&apos;s why we built a
              platform that puts local expertise first — connecting Erie
              residents with the professionals their neighbors already trust.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
            The {cityConfig.domain} Model
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Hyper-Local Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We focus exclusively on {cityConfig.name} and the
                  surrounding communities:{" "}
                  {cityConfig.serviceArea.slice(0, 5).join(", ")}, and more.
                  This isn&apos;t a national directory with a local filter
                  — it&apos;s built for Erie from the ground up.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Verified Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every service provider on our platform is verified for
                  licensing, insurance, and reputation. We check Pennsylvania
                  state records, verify insurance certificates, and monitor
                  customer feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Geographic Exclusivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our model limits the number of providers per niche,
                  ensuring that listed businesses receive meaningful leads
                  rather than competing with dozens of others. Quality over
                  quantity — for both consumers and providers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── What we cover ─────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Services We Cover
        </h2>
        <p className="mb-6 text-muted-foreground">
          {cityConfig.domain} connects Erie residents with verified
          professionals across {niches.length} service categories:
        </p>
        <div className="flex flex-wrap gap-2">
          {niches.map((n) => (
            <Button key={n.slug} asChild variant="outline" size="sm">
              <Link href={`/${n.slug}`}>
                {n.icon} {n.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Our Commitments
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: Shield,
                title: "Transparency",
                desc: "No hidden agendas. If a provider is listed, they've been verified. If we recommend a service, we tell you why. We never accept payment for placement in search results.",
              },
              {
                icon: Users,
                title: "Community First",
                desc: `We're invested in ${cityConfig.name}'s success. Supporting local businesses means supporting local jobs, local families, and the Erie economy.`,
              },
              {
                icon: Zap,
                title: "Accuracy",
                desc: "We keep provider information current, pricing data updated, and content relevant. Our guides and FAQs reflect actual Erie-area conditions, not generic national averages.",
              },
              {
                icon: CheckCircle2,
                title: "Consumer Protection",
                desc: "We verify licenses, insurance, and reputation. If a provider fails to meet our standards, they're removed from the platform — no exceptions.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Businesses CTA ────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Are you a service provider in Erie?</CardTitle>
            <CardDescription>
              Join {cityConfig.domain} to connect with customers who are
              actively looking for your services. Limited spots available per
              service category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/for-business">
                Learn About Listing Your Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Contact link ──────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          Have questions about {cityConfig.domain}?{" "}
          <Link
            href="/contact"
            className="font-medium text-primary hover:underline"
          >
            Get in touch
            <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        </p>
      </section>

      {/* ── Schema.org ────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: cityConfig.domain,
            url: `https://${cityConfig.domain}`,
            description: `Erie's trusted platform for finding verified local service providers.`,
            areaServed: {
              "@type": "City",
              name: cityConfig.name,
              containedInPlace: {
                "@type": "State",
                name: cityConfig.state,
              },
            },
          }),
        }}
      />
    </main>
  )
}
