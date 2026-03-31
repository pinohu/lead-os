import Link from "next/link"
import type { Metadata } from "next"
import { Shield } from "lucide-react"
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
  title: `Privacy Policy — ${cityConfig.domain}`,
  description: `Privacy policy for ${cityConfig.domain}. Learn how we collect, use, and protect your personal information.`,
}

export default function PrivacyPage() {
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
                <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-10 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Shield className="mr-1.5 h-3 w-3" />
            Legal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
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
            <h2 className="text-xl font-bold mb-3">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              {cityConfig.domain} (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates a local business directory serving the {cityConfig.name}, {cityConfig.stateCode} metropolitan area. This Privacy Policy describes how we collect, use, disclose, and protect your personal information when you visit our website or use our services.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Information We Collect</h2>
            <h3 className="font-semibold mt-4 mb-2">Information You Provide</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information you voluntarily provide when you use our services, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Name, email address, and phone number when requesting quotes or contacting providers</li>
              <li>Details about your project or service needs submitted through quote request forms</li>
              <li>Reviews and feedback you submit about service providers</li>
              <li>Business information submitted by service providers for directory listings</li>
              <li>Communications you send to us through contact forms or email</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">Information Collected Automatically</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you visit our website, we automatically collect certain technical information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>IP address and approximate geographic location</li>
              <li>Browser type, operating system, and device information</li>
              <li>Pages visited, time spent on pages, and navigation patterns</li>
              <li>Referring website or search terms that led you to our site</li>
              <li>Cookies and similar tracking technologies (see Cookie Policy below)</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>To connect you with qualified service providers in the {cityConfig.name} area</li>
              <li>To process and fulfill quote requests and service inquiries</li>
              <li>To communicate with you about your requests, our services, and relevant updates</li>
              <li>To display and manage service provider listings and reviews</li>
              <li>To improve our website, services, and user experience</li>
              <li>To analyze usage patterns and optimize our platform</li>
              <li>To prevent fraud and protect the security of our platform</li>
              <li>To comply with legal obligations and enforce our terms of service</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Service Providers:</strong> When you request a quote, we share your project details and contact information with relevant service providers so they can respond to your inquiry.</li>
              <li><strong>Analytics Partners:</strong> We use third-party analytics services (such as Google Analytics) to understand how our website is used. These services may collect anonymized usage data.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or government regulation, or when necessary to protect our rights, safety, or property.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Cookie Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. Disabling cookies may affect the functionality of certain features on our website.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of internet transmission or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Access and receive a copy of your personal information</li>
              <li>Request correction of inaccurate personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Object to certain processing of your personal information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, contact us at the information provided below.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites, including service provider websites, social media platforms, and government resources. We are not responsible for the privacy practices of these external sites and encourage you to review their privacy policies.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete it promptly.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <ul className="list-none space-y-1 text-muted-foreground mt-2">
              <li><strong>Website:</strong> {cityConfig.domain}</li>
              <li><strong>Email:</strong> privacy@{cityConfig.domain}</li>
              <li><strong>Location:</strong> {cityConfig.name}, {cityConfig.state} {cityConfig.stateCode}</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  )
}
