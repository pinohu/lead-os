import Link from "next/link"
import type { Metadata } from "next"
import { FileText } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
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
  title: `Terms of Service — ${cityConfig.domain}`,
  description: `Terms of service for ${cityConfig.domain}. Understand the rules and guidelines governing your use of our local business directory.`,
}

export default function TermsPage() {
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
                <BreadcrumbPage>Terms of Service</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-10 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <FileText className="mr-1.5 h-3 w-3" />
            Legal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: January 1, 2025
          </p>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">

          <div>
            <h2 className="text-xl font-bold mb-3">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using {cityConfig.domain} (&ldquo;the Website&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Website. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Website following any changes constitutes acceptance of the revised Terms.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              {cityConfig.domain} is a local business directory and lead generation platform serving the {cityConfig.name}, {cityConfig.stateCode} metropolitan area. We connect consumers seeking home services and professional services with verified local providers. Our platform provides informational content, directory listings, quote request functionality, and review capabilities.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">User Responsibilities</h2>
            <h3 className="font-semibold mt-4 mb-2">For Consumers</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>You agree to provide accurate and complete information when requesting quotes or submitting forms.</li>
              <li>You understand that {cityConfig.domain} connects you with independent service providers and does not itself provide home services, dental, legal, or other professional services.</li>
              <li>You agree to submit honest, fair, and factual reviews based on your actual experience with service providers.</li>
              <li>You will not use the Website for any unlawful purpose or in violation of these Terms.</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">For Service Providers</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>You agree to maintain all required licenses, certifications, and insurance as represented in your listing.</li>
              <li>You agree to respond promptly and professionally to consumer inquiries received through the platform.</li>
              <li>You will not misrepresent your qualifications, experience, pricing, or service capabilities.</li>
              <li>You agree to abide by the listing terms, exclusivity agreements, and payment obligations in your service agreement.</li>
              <li>You understand that your listing may be suspended or removed for failure to maintain standards or comply with these Terms.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Directory Listings</h2>
            <p className="text-muted-foreground leading-relaxed">
              Service provider listings on {cityConfig.domain} are based on verified information. However, we do not guarantee the accuracy, completeness, or currentness of all listing information. Providers are responsible for keeping their listing information up to date. We reserve the right to modify, suspend, or remove any listing at our sole discretion.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Reviews and User Content</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By submitting a review or other content to {cityConfig.domain}, you grant us a non-exclusive, royalty-free, perpetual, and worldwide license to use, display, reproduce, and distribute that content in connection with our services. You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Your review reflects your genuine experience with the service provider.</li>
              <li>Your content does not contain false, misleading, defamatory, or fraudulent statements.</li>
              <li>Your content does not violate any third party's intellectual property or privacy rights.</li>
              <li>You are not compensated by or affiliated with competitors of the reviewed business.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We reserve the right to remove reviews that violate these guidelines or that we determine, in our sole discretion, to be inappropriate.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE WEBSITE AND ALL CONTENT, MATERIALS, AND SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              {cityConfig.domain} IS A DIRECTORY AND REFERRAL PLATFORM. WE ARE NOT A PARTY TO ANY AGREEMENT BETWEEN CONSUMERS AND SERVICE PROVIDERS. WE ARE NOT RESPONSIBLE FOR THE QUALITY, SAFETY, LEGALITY, OR TIMELINESS OF SERVICES PROVIDED BY LISTED BUSINESSES. TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE WEBSITE OR SERVICES OBTAINED THROUGH THE WEBSITE.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless {cityConfig.domain}, its owners, operators, officers, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorney fees) arising from your use of the Website, your violation of these Terms, or your violation of any third party's rights.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, design, graphics, logos, text, and software on {cityConfig.domain} are the property of {cityConfig.domain} or its content suppliers and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content on the Website without our prior written consent.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of {cityConfig.state}, without regard to its conflict of law principles. Any legal action arising from these Terms shall be brought in the courts of Erie County, {cityConfig.state}.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-1 text-muted-foreground mt-2">
              <li><strong>Website:</strong> {cityConfig.domain}</li>
              <li><strong>Email:</strong> legal@{cityConfig.domain}</li>
              <li><strong>Location:</strong> {cityConfig.name}, {cityConfig.state} {cityConfig.stateCode}</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  )
}
