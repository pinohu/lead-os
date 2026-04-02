import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Lead OS. Read the terms governing your use of the Lead OS platform.",
};

export default function TermsOfServicePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";

  const termsJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/terms#webpage`,
    url: `${baseUrl}/terms`,
    name: "Terms of Service | Lead OS",
    description: "Terms of Service for Lead OS. Read the terms governing your use of the Lead OS platform.",
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@type": "Organization", "@id": `${baseUrl}/#organization` },
    dateModified: "2026-03-28",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }} />
    <main id="main-content" className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legal</p>
          <h1 className="text-foreground">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: March 28, 2026. Please read these terms carefully before using Lead OS.
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-8 leading-relaxed">
        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Lead OS (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, do not use the Service. These Terms apply to all visitors, users, operators, and others who access the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>Lead OS is a programmable, multi-tenant lead generation infrastructure platform. The Service provides lead capture, scoring, routing, nurturing, conversion optimization, AI-powered content generation, marketplace functionality, and operator dashboard tools. Features may vary by subscription tier.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">3. Account Terms</h2>
          <ul className="pl-6">
            <li>You must be 18 years or older to use the Service.</li>
            <li>You must provide accurate and complete registration information.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>One person or legal entity may maintain no more than one free account.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="pl-6">
            <li>Use the Service for any unlawful purpose or to violate any laws.</li>
            <li>Upload or transmit malware, viruses, or other harmful code.</li>
            <li>Attempt to gain unauthorized access to any part of the Service.</li>
            <li>Send unsolicited communications (spam) through the Service.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Collect or harvest personal data of other users without consent.</li>
            <li>Use the Service to generate, store, or distribute content that is illegal, harmful, or violates third-party rights.</li>
            <li>Exceed the usage limits of your subscription tier.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">5. Payment Terms</h2>
          <p>Paid plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We may change pricing with 30 days notice. Failure to pay may result in suspension or termination of your account. Usage-based charges are billed at the end of each billing period based on actual consumption.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">6. Intellectual Property</h2>
          <p>The Service and its original content, features, and functionality are owned by Lead OS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of data you input into the Service. By using the Service, you grant us a limited license to process your data as necessary to provide the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">7. Data Processing</h2>
          <p>We process personal data in accordance with our <a href="/privacy" className="text-primary underline">Privacy Policy</a>. For business customers processing personal data of EU residents, we will enter into a Data Processing Agreement upon request. You are responsible for ensuring your use of the Service complies with applicable data protection laws, including obtaining necessary consents from individuals whose data you process through the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">8. Service Level and Availability</h2>
          <p>We strive to maintain 99.9% uptime for the Service. Scheduled maintenance will be announced at least 24 hours in advance. We are not liable for downtime caused by circumstances beyond our reasonable control, including but not limited to natural disasters, government actions, or third-party service outages.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Lead OS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Lead OS from any claims, damages, losses, and expenses arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">11. Termination</h2>
          <p>We may terminate or suspend your access immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion. Upon termination, your right to use the Service ceases immediately. You may export your data within 30 days of termination using the GDPR export endpoint.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">12. Dispute Resolution</h2>
          <p>These Terms are governed by the laws of the State of Delaware, United States. Any dispute arising from these Terms shall first be attempted to be resolved through good faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">13. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes at least 30 days before they take effect by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-foreground text-xl font-semibold mb-3">14. Contact Information</h2>
          <p>For questions about these Terms, please contact us at <a href="mailto:legal@leadgen-os.com" className="text-primary underline">legal@leadgen-os.com</a> or visit our <a href="/contact" className="text-primary underline">contact page</a>.</p>
        </section>
      </article>
    </main>
    </>
  );
}
