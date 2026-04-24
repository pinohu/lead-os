import type { Metadata } from "next";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Privacy Policy | CX React",
  description:
    "Learn how CX React collects, uses, and protects your personal data. Understand your GDPR and CCPA rights and how to exercise them.",
};

export default function PrivacyPolicyPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? tenantConfig.supportEmail;

  const privacyJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/privacy#webpage`,
    url: `${baseUrl}/privacy`,
    name: "Privacy Policy | CX React",
    description: "Learn how CX React collects, uses, and protects your personal data. Understand your GDPR and CCPA rights.",
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@type": "Organization", "@id": `${baseUrl}/#organization` },
    dateModified: "2026-01-15",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyJsonLd) }} />
    <main id="main-content" className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legal</p>
          <h1 className="text-foreground">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 15, 2026. This policy explains how CX React collects, uses, shares,
            and protects your personal information, and the rights you have over that data.
          </p>
        </div>
      </section>

      <article
        className="rounded-xl border border-border bg-card p-6 max-w-4xl mx-auto leading-relaxed"
      >
        <section aria-labelledby="controller-heading" className="mb-10">
          <h2 className="text-foreground" id="controller-heading">1. Data Controller</h2>
          <p>
            CX React (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is the data
            controller responsible for personal data processed through this platform. You may contact
            us regarding privacy matters at:
          </p>
          <address className="not-italic mt-3">
            <strong>CX React Privacy Team</strong>
            <br />
            Email:{" "}
            <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
            <br />
            Website:{" "}
            <a href={baseUrl} rel="noopener noreferrer">
              {baseUrl}
            </a>
          </address>
        </section>

        <section aria-labelledby="data-collected-heading" className="mb-10">
          <h2 className="text-foreground" id="data-collected-heading">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>

          <h3 className="text-foreground mt-5">2.1 Data You Provide Directly</h3>
          <ul className="space-y-2">
            <li>
              <strong>Contact information:</strong> Name, email address, phone number, and postal
              address submitted through lead capture forms.
            </li>
            <li>
              <strong>Account credentials:</strong> Email address used for operator magic-link
              authentication.
            </li>
            <li>
              <strong>Business information:</strong> Company name, industry, service interests, and
              budget ranges entered during lead qualification flows.
            </li>
            <li>
              <strong>Communications:</strong> Messages submitted through contact forms or support
              channels.
            </li>
          </ul>

          <h3 className="text-foreground mt-5">2.2 Data Collected Automatically</h3>
          <ul className="space-y-2">
            <li>
              <strong>Usage data:</strong> Pages visited, time spent, click patterns, funnel stage
              progression, and milestone events.
            </li>
            <li>
              <strong>Device and browser data:</strong> IP address, browser type and version,
              operating system, screen resolution, and user agent string.
            </li>
            <li>
              <strong>Referral data:</strong> Referring URLs and UTM parameters used to attribute
              traffic sources.
            </li>
            <li>
              <strong>Session data:</strong> Visit count, returning-visitor status, and engagement
              signals used for lead scoring.
            </li>
          </ul>

          <h3 className="text-foreground mt-5">2.3 Data from Third Parties</h3>
          <ul className="space-y-2">
            <li>
              <strong>Partner programs:</strong> Referral identifiers from affiliate and partner
              networks such as Partnero.
            </li>
            <li>
              <strong>CRM integrations:</strong> Lead enrichment data provided by connected CRM or
              marketing automation providers configured by operators.
            </li>
          </ul>
        </section>

        <section aria-labelledby="legal-basis-heading" className="mb-10">
          <h2 className="text-foreground" id="legal-basis-heading">3. Legal Basis for Processing (GDPR)</h2>
          <p>
            If you are located in the European Economic Area (EEA) or United Kingdom, we process
            your personal data under the following legal bases:
          </p>
          <ul className="space-y-2">
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> Where you have given explicit consent, such
              as submitting a lead capture form or opting into communications.
            </li>
            <li>
              <strong>Contractual necessity (Art. 6(1)(b)):</strong> Where processing is required to
              provide services you have requested, including operator account management.
            </li>
            <li>
              <strong>Legitimate interests (Art. 6(1)(f)):</strong> For analytics, fraud prevention,
              platform security, and improving our services, where our interests do not override your
              fundamental rights.
            </li>
            <li>
              <strong>Legal obligation (Art. 6(1)(c)):</strong> Where processing is required to
              comply with applicable laws.
            </li>
          </ul>
        </section>

        <section aria-labelledby="use-heading" className="mb-10">
          <h2 className="text-foreground" id="use-heading">4. How We Use Your Data</h2>
          <ul className="space-y-2">
            <li>Capture and qualify leads on behalf of platform operators.</li>
            <li>Score leads based on engagement signals, behavior, and qualification responses.</li>
            <li>Route leads to appropriate operator workflows, CRMs, and follow-up sequences.</li>
            <li>Send automated follow-up communications with operator consent.</li>
            <li>Authenticate operator accounts via magic link.</li>
            <li>Generate analytics reports and funnel performance metrics.</li>
            <li>Detect fraud, abuse, and unauthorized access.</li>
            <li>Comply with legal obligations and respond to lawful requests.</li>
            <li>Improve platform performance, reliability, and features.</li>
          </ul>
        </section>

        <section aria-labelledby="sharing-heading" className="mb-10">
          <h2 className="text-foreground" id="sharing-heading">5. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal data. We share data only in the following circumstances:
          </p>
          <ul className="space-y-2">
            <li>
              <strong>Platform operators:</strong> Lead data is shared with the operator (business)
              whose form or funnel captured the lead, as this is the core function of the service.
            </li>
            <li>
              <strong>Service providers:</strong> We use trusted third-party processors including
              email delivery services, cloud infrastructure providers, and analytics tools, each
              bound by data processing agreements.
            </li>
            <li>
              <strong>Partner programs:</strong> Referral attribution data may be shared with
              affiliate partners (e.g., Partnero) to track program performance.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose data when required by law,
              court order, or governmental authority, or to protect the rights, property, or safety
              of CX React, its users, or the public.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of
              assets, personal data may be transferred as part of the transaction with appropriate
              notice to affected users.
            </li>
          </ul>
        </section>

        <section aria-labelledby="cookies-heading" className="mb-10">
          <h2 className="text-foreground" id="cookies-heading">6. Cookies and Tracking Technologies</h2>
          <p>We use the following categories of cookies and similar technologies:</p>
          <ul className="space-y-2">
            <li>
              <strong>Strictly necessary:</strong> Session management, authentication tokens, and
              security cookies required for the platform to function.
            </li>
            <li>
              <strong>Analytics:</strong> First-party analytics cookies to measure traffic, funnel
              performance, and lead conversion rates.
            </li>
            <li>
              <strong>Attribution:</strong> Cookies to track referral sources and UTM parameters
              for marketing attribution.
            </li>
            <li>
              <strong>Partner tracking:</strong> Cookies set by affiliate partner programs (such as
              Partnero) to track referral conversions.
            </li>
          </ul>
          <p className="mt-3">
            You may control cookie preferences through your browser settings. Note that disabling
            strictly necessary cookies may impair platform functionality.
          </p>
        </section>

        <section aria-labelledby="retention-heading" className="mb-10">
          <h2 className="text-foreground" id="retention-heading">7. Data Retention</h2>
          <p>We retain personal data for the following periods:</p>
          <ul className="space-y-2">
            <li>
              <strong>Lead records:</strong> Retained for the duration of the operator account plus
              90 days following account termination, or as required by applicable law.
            </li>
            <li>
              <strong>Operator account data:</strong> Retained for the duration of the active
              subscription plus 12 months, to support billing disputes and compliance obligations.
            </li>
            <li>
              <strong>Analytics and event logs:</strong> Aggregated analytics retained for up to 24
              months. Raw event logs retained for 12 months.
            </li>
            <li>
              <strong>Authentication logs:</strong> Retained for 90 days for security monitoring.
            </li>
          </ul>
          <p className="mt-3">
            You may request earlier deletion by exercising your rights as described in Section 9.
          </p>
        </section>

        <section aria-labelledby="transfers-heading" className="mb-10">
          <h2 className="text-foreground" id="transfers-heading">8. International Data Transfers</h2>
          <p>
            CX React operates infrastructure in the United States. If you are located in the EEA, UK,
            or Switzerland, your personal data may be transferred to and processed in the United
            States. We implement appropriate safeguards for these transfers, including:
          </p>
          <ul className="space-y-2">
            <li>
              Standard Contractual Clauses (SCCs) approved by the European Commission.
            </li>
            <li>
              Data Processing Agreements with all processors that handle EEA personal data.
            </li>
            <li>
              Adherence to the EU-U.S. Data Privacy Framework where applicable.
            </li>
          </ul>
        </section>

        <section aria-labelledby="gdpr-rights-heading" className="mb-10">
          <h2 className="text-foreground" id="gdpr-rights-heading">9. Your Rights</h2>

          <h3 className="text-foreground mt-5">9.1 GDPR Rights (EEA and UK Residents)</h3>
          <p>If you are located in the EEA or UK, you have the following rights:</p>
          <ul className="space-y-2">
            <li>
              <strong>Right of access (Art. 15):</strong> Request a copy of the personal data we
              hold about you. Exercise this right at{" "}
              <a href="/api/gdpr/export">/api/gdpr/export</a>.
            </li>
            <li>
              <strong>Right to erasure (Art. 17):</strong> Request deletion of your personal data.
              Exercise this right at <a href="/api/gdpr/delete">/api/gdpr/delete</a>.
            </li>
            <li>
              <strong>Right to data portability (Art. 20):</strong> Receive your data in a
              structured, machine-readable format. Use the export endpoint at{" "}
              <a href="/api/gdpr/export">/api/gdpr/export</a>.
            </li>
            <li>
              <strong>Right to rectification (Art. 16):</strong> Request correction of inaccurate
              personal data. Contact us at{" "}
              <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
            </li>
            <li>
              <strong>Right to restriction (Art. 18):</strong> Request that we restrict processing
              of your personal data in certain circumstances.
            </li>
            <li>
              <strong>Right to object (Art. 21):</strong> Object to processing based on legitimate
              interests, including profiling.
            </li>
            <li>
              <strong>Right to withdraw consent:</strong> Where processing is based on consent,
              withdraw it at any time without affecting lawfulness of prior processing.
            </li>
          </ul>

          <h3 className="text-foreground mt-5">9.2 CCPA Rights (California Residents)</h3>
          <p>
            Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act
            (CPRA), California residents have the following rights:
          </p>
          <ul className="space-y-2">
            <li>
              <strong>Right to know:</strong> Request disclosure of the categories and specific
              pieces of personal information collected about you.
            </li>
            <li>
              <strong>Right to delete:</strong> Request deletion of personal information collected
              from you, subject to certain exceptions.
            </li>
            <li>
              <strong>Right to opt out:</strong> Opt out of the sale or sharing of personal
              information. We do not sell personal information.
            </li>
            <li>
              <strong>Right to correct:</strong> Request correction of inaccurate personal
              information.
            </li>
            <li>
              <strong>Right to limit use:</strong> Limit the use and disclosure of sensitive
              personal information.
            </li>
            <li>
              <strong>Non-discrimination:</strong> We will not discriminate against you for
              exercising your privacy rights.
            </li>
          </ul>
          <p className="mt-3">
            To exercise your CCPA rights, contact us at{" "}
            <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> or use our data
            endpoints: <a href="/api/gdpr/export">export your data</a> or{" "}
            <a href="/api/gdpr/delete">request deletion</a>.
          </p>
        </section>

        <section aria-labelledby="security-heading" className="mb-10">
          <h2 className="text-foreground" id="security-heading">10. Security Measures</h2>
          <p>
            We implement industry-standard technical and organizational security measures to protect
            your personal data, including:
          </p>
          <ul className="space-y-2">
            <li>Encryption of data in transit using TLS 1.2 or higher.</li>
            <li>Encryption of sensitive data at rest.</li>
            <li>Passwordless authentication (magic link) for operator accounts.</li>
            <li>Access controls limiting data access to authorized personnel only.</li>
            <li>Regular security assessments and dependency audits.</li>
            <li>Incident response procedures with notification timelines per GDPR Art. 33.</li>
          </ul>
          <p className="mt-3">
            No method of transmission over the internet is 100% secure. We cannot guarantee
            absolute security but are committed to using commercially reasonable measures.
          </p>
        </section>

        <section aria-labelledby="children-heading" className="mb-10">
          <h2 className="text-foreground" id="children-heading">11. Children&apos;s Privacy</h2>
          <p>
            CX React is not directed to individuals under the age of 16. We do not knowingly collect
            personal data from children. If you believe a child has provided personal data to us,
            contact us at{" "}
            <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> and we will delete
            it promptly.
          </p>
        </section>

        <section aria-labelledby="third-party-heading" className="mb-10">
          <h2 className="text-foreground" id="third-party-heading">12. Third-Party Services</h2>
          <p>
            Our platform integrates with third-party services at the operator&apos;s direction.
            These may include:
          </p>
          <ul className="space-y-2">
            <li>Email marketing and CRM platforms (e.g., ActiveCampaign, HubSpot, GoHighLevel).</li>
            <li>Scheduling tools (e.g., Calendly, Cal.com).</li>
            <li>Payment processors (governed by their own privacy policies).</li>
            <li>Affiliate and referral tracking (e.g., Partnero).</li>
          </ul>
          <p className="mt-3">
            Each third-party service has its own privacy policy. We encourage you to review the
            privacy practices of any third-party services you interact with through our platform.
          </p>
        </section>

        <section aria-labelledby="changes-heading" className="mb-10">
          <h2 className="text-foreground" id="changes-heading">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be communicated
            by updating the &ldquo;Last updated&rdquo; date at the top of this page and, where
            required by law, by direct notification to affected users. Your continued use of the
            platform after changes take effect constitutes acceptance of the revised policy.
          </p>
        </section>

        <section aria-labelledby="contact-heading" className="mb-10">
          <h2 className="text-foreground" id="contact-heading">14. Contact Us</h2>
          <p>
            To exercise your rights, make a complaint, or ask questions about this policy:
          </p>
          <address className="not-italic mt-3">
            <strong>CX React Privacy Team</strong>
            <br />
            Email:{" "}
            <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
          </address>
          <p className="mt-3">
            If you are located in the EEA and believe your rights have been violated, you have the
            right to lodge a complaint with your local data protection authority.
          </p>
        </section>
      </article>
    </main>
    </>
  );
}
