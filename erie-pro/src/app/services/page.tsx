import Link from "next/link"
import type { Metadata } from "next"
import { LayoutGrid, ArrowRight } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export const metadata: Metadata = {
  title: `All Services — ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
  description: `Browse all ${niches.length} service categories on ${cityConfig.domain}. Find verified professionals for plumbing, HVAC, electrical, roofing, landscaping, dental, legal, cleaning, auto repair, pest control, painting, and real estate in ${cityConfig.name}, ${cityConfig.stateCode}.`,
}

export default function ServicesPage() {
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
                <BreadcrumbPage>All Services</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <LayoutGrid className="mr-1.5 h-3 w-3" />
            Service Directory
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            All Services on {cityConfig.domain}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Browse {niches.length} service categories covering everything{" "}
            {cityConfig.name} homeowners and residents need. Every provider is
            verified for licensing, insurance, and quality.
          </p>
        </div>
      </section>

      {/* ── Services Accordion ────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Accordion type="multiple" className="w-full">
          {niches.map((niche) => {
            const content = getNicheContent(niche.slug)
            if (!content) return null

            return (
              <AccordionItem key={niche.slug} value={niche.slug}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{niche.icon}</span>
                    <div>
                      <span className="font-semibold">{niche.label}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {content.commonServices.length} services
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-10 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {niche.description}
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {content.commonServices.map((service, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {service}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/${niche.slug}`}>
                          Browse {content.pluralLabel}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${niche.slug}/pricing`}>Pricing</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${niche.slug}/faq`}>FAQ</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${niche.slug}/guides`}>Guides</Link>
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Not sure which service you need?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Contact us and we will help you find the right professional for your
            project in {cityConfig.name}.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
