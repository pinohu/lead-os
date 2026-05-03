"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type InquiryType = "sales" | "support" | "partnership" | "other";

function publicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lead-os.example";
  return raw.replace(/\/$/, "");
}

function publicSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com";
}

function publicBrandName() {
  return process.env.NEXT_PUBLIC_BRAND_NAME ?? "Lead OS";
}

export default function ContactPage() {
  const contactJsonLd = useMemo(() => {
    const baseUrl = publicSiteUrl();
    const supportEmail = publicSupportEmail();
    const brandName = publicBrandName();
    return {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "@id": `${baseUrl}/contact#webpage`,
      url: `${baseUrl}/contact`,
      name: `Contact ${brandName}`,
      description: `Questions about ${brandName}? Reach out for solution selection, account access, support, or partnerships.`,
      isPartOf: { "@id": `${baseUrl}/#website` },
      mainEntity: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: brandName,
        url: baseUrl,
        contactPoint: [
          { "@type": "ContactPoint", email: supportEmail, contactType: "customer support", availableLanguage: "English" },
          { "@type": "ContactPoint", email: supportEmail, contactType: "legal" },
        ],
      },
    };
  }, []);
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [inquiry, setInquiry] = useState<InquiryType>("sales");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, inquiryType: inquiry, message }),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h1 className="text-foreground text-2xl font-bold mb-3">Message Sent</h1>
        <p className="text-foreground mb-6">
          Thank you for reaching out. We will get back to you within 24 hours.
        </p>
        <Link href="/" className="text-primary underline">
          Return home
        </Link>
      </div>
      </>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-foreground text-2xl font-extrabold mb-2">Get help launching the right solution</h1>
      <p className="text-foreground mb-8">
        Ask which solution fits the customer outcome, what account access is needed, or how to activate a production
        integration after launch.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-1">
            Name <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1">
            Email <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-semibold mb-1">
            Company (optional)
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div>
          <label htmlFor="inquiry" className="block text-sm font-semibold mb-1">
            Inquiry Type
          </label>
          <select
            id="inquiry"
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value as InquiryType)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="partnership">Partnership</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold mb-1">
            Message <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {formState === "error" && (
          <p role="alert" className="text-destructive text-sm">
            Something went wrong. Please try again or email us directly.
          </p>
        )}

        <button
          type="submit"
          disabled={formState === "submitting"}
          aria-busy={formState === "submitting"}
          className="px-6 py-2.5 bg-primary text-primary-foreground border-none rounded-md font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {formState === "submitting" ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          You can also reach us directly at{" "}
          <a href={`mailto:${publicSupportEmail()}`} className="text-primary">{publicSupportEmail()}</a>.
          {" "}Most inquiries get a response within 4 business hours.
        </p>
      </div>
    </div>
    </>
  );
}
