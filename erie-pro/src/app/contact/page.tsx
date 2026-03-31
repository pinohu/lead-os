import Link from "next/link"
import type { Metadata } from "next"
import {
  Mail,
  MapPin,
  Send,
  MessageSquare,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: `Contact ${cityConfig.domain} — Get in Touch`,
  description: `Contact the ${cityConfig.domain} team. Questions about finding a provider, listing your business, or feedback about the platform.`,
}

export default function ContactPage() {
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
                <BreadcrumbPage>Contact</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <MessageSquare className="mr-1.5 h-3 w-3" />
            Contact Us
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Questions about {cityConfig.domain}? Whether you&apos;re a
            homeowner looking for help or a business wanting to list, we&apos;d
            love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact Form + Info ───────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you
                  within 1 business day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" action="/api/contact" method="POST">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(814) 555-1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      placeholder="What is this about?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      hello@{cityConfig.domain}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Service Area</p>
                    <p className="text-sm text-muted-foreground">
                      {cityConfig.name}, {cityConfig.stateCode} and
                      surrounding communities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">
                    Looking for a service provider?
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse our{" "}
                    <Link
                      href="/#services"
                      className="text-primary hover:underline"
                    >
                      service categories
                    </Link>{" "}
                    to find verified providers and get free quotes.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Want to list your business?
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Visit our{" "}
                    <Link
                      href="/for-business"
                      className="text-primary hover:underline"
                    >
                      For Businesses
                    </Link>{" "}
                    page to learn about listing options and pricing.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Have feedback or a correction?
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use the form on this page. We review all feedback and
                    update our information promptly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Schema.org ────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: `Contact ${cityConfig.domain}`,
            url: `https://${cityConfig.domain}/contact`,
            mainEntity: {
              "@type": "Organization",
              name: cityConfig.domain,
              email: `hello@${cityConfig.domain}`,
              url: `https://${cityConfig.domain}`,
            },
          }),
        }}
      />
    </main>
  )
}
