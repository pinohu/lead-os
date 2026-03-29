import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLandingPage, listLandingPages } from "@/lib/landing-page-generator";
import type { LandingPageSection, GeneratedLandingPage } from "@/lib/landing-page-generator";
import { LPLeadCaptureForm } from "@/components/LPLeadCaptureForm";

// ─── Route types ──────────────────────────────────────────────────────────────

type LPPageProps = {
  params: Promise<{ slug: string }>;
};

// Extend the stored type with optional fields added post-generation.
// status is widened to include "archived" which the generator doesn't produce
// today but may be set by admin tooling at runtime.
type FullLandingPage = Omit<GeneratedLandingPage, "status"> & {
  status: "draft" | "published" | "archived";
  ogImage?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
};

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const pages = await listLandingPages();
  return pages
    .filter((p) => p.status === "published")
    .map((p) => ({ slug: p.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: LPPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = (await getLandingPage(slug)) as FullLandingPage | undefined;
  if (!page) return { title: "Page Not Found" };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      images: page.ogImage ? [{ url: page.ogImage }] : [],
      type: "website",
    },
    alternates: page.canonicalUrl ? { canonical: page.canonicalUrl } : undefined,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const SECTION_PADDING: React.CSSProperties["padding"] = "64px 24px";
const MAX_WIDTH = "1080px";
const CARD_BG = "#f8fafc";
const CARD_BORDER = "1px solid #e2e8f0";
const CARD_RADIUS = "12px";
const SERIF = "'Palatino Linotype', 'Book Antiqua', Georgia, serif";

// ─── Shared heading style ─────────────────────────────────────────────────────

function sectionHeadingStyle(): React.CSSProperties {
  return {
    fontFamily: SERIF,
    fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
    letterSpacing: "-0.02em",
    marginBottom: "32px",
    textAlign: "center",
  };
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

type HeroContent = {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  rating?: number;
  reviewCount?: number;
};

function HeroSection({
  content,
  accent,
  businessName,
}: {
  content: Record<string, unknown>;
  accent: string;
  businessName: string;
}) {
  const c = content as HeroContent;
  const headline = c.headline ?? businessName;
  const subheadline = c.subheadline ?? "";
  const ctaLabel = c.ctaText ?? "Get Started";
  const bgImage = typeof c.backgroundImage === "string" ? c.backgroundImage : null;
  const rating = typeof c.rating === "number" ? c.rating : 0;
  const reviewCount = typeof c.reviewCount === "number" ? c.reviewCount : 0;
  const clampedRating = Math.min(Math.max(Math.round(rating), 0), 5);
  const stars = "★".repeat(clampedRating) + "☆".repeat(5 - clampedRating);

  const heroStyle: React.CSSProperties = {
    backgroundImage: bgImage
      ? `linear-gradient(135deg, ${accent}e6 0%, ${accent}b3 100%), url(${bgImage})`
      : `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: "80px 24px",
    textAlign: "center",
    color: "#fff",
  };

  return (
    <div style={heroStyle}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: "20px",
          }}
        >
          {headline}
        </h1>
        {subheadline ? (
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.3rem)",
              color: "rgba(255,255,255,0.9)",
              maxWidth: "62ch",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            {subheadline}
          </p>
        ) : null}
        {reviewCount > 0 ? (
          <div
            aria-label={`Rated ${rating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "28px",
              background: "rgba(255,255,255,0.15)",
              padding: "6px 16px",
              borderRadius: "999px",
            }}
          >
            <span aria-hidden="true" style={{ color: "#fcd34d", fontSize: "1.1rem", letterSpacing: "2px" }}>
              {stars}
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
              {rating.toFixed(1)} ({reviewCount.toLocaleString()} reviews)
            </span>
          </div>
        ) : null}
        <div>
          <a
            href="#lead-capture"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "52px",
              padding: "14px 32px",
              borderRadius: "999px",
              background: "#fff",
              color: accent,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Trust Bar ───────────────────────────────────────────────────────

type TrustBarContent = {
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  serviceArea?: string;
};

function TrustBarSection({ content }: { content: Record<string, unknown> }) {
  const c = content as TrustBarContent;
  const badges = Array.isArray(c.badges) ? c.badges : [];
  const rating = typeof c.rating === "number" ? c.rating : 5;
  const reviewCount = typeof c.reviewCount === "number" ? c.reviewCount : 0;
  const serviceArea = typeof c.serviceArea === "string" ? c.serviceArea : "";
  const clampedRating = Math.min(Math.max(Math.round(rating), 0), 5);
  const stars = "★".repeat(clampedRating);

  return (
    <div style={{ padding: "24px", background: CARD_BG, borderBottom: CARD_BORDER }}>
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {reviewCount > 0 ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            aria-label={`Rated ${rating} out of 5 stars from ${reviewCount} reviews`}
          >
            <span aria-hidden="true" style={{ color: "#f59e0b", fontSize: "1.1rem", letterSpacing: "1px" }}>
              {stars}
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#385145" }}>
              {reviewCount.toLocaleString()} reviews
            </span>
          </div>
        ) : null}
        {serviceArea ? (
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(34,95,84,0.1)",
              border: "1px solid rgba(34,95,84,0.18)",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#225f54",
            }}
          >
            {serviceArea}
          </span>
        ) : null}
        {badges.map((badge) => (
          <span
            key={badge}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              background: "#fff",
              border: CARD_BORDER,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#385145",
            }}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Services ────────────────────────────────────────────────────────

type ServiceItem = { name?: string; description?: string };
type ServicesContent = {
  headline?: string;
  services?: ServiceItem[];
  items?: ServiceItem[];
};

function ServicesSection({ content }: { content: Record<string, unknown> }) {
  const c = content as ServicesContent;
  const items: ServiceItem[] = Array.isArray(c.services)
    ? c.services
    : Array.isArray(c.items)
      ? c.items
      : [];

  return (
    <div style={{ padding: SECTION_PADDING }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h2 style={sectionHeadingStyle()}>Our Services</h2>
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {items.map((item, index) => (
            <li
              key={`${item.name ?? "service"}-${index}`}
              style={{
                padding: "22px 24px",
                borderRadius: CARD_RADIUS,
                background: CARD_BG,
                border: CARD_BORDER,
              }}
            >
              <h3
                style={{
                  margin: "0 0 6px",
                  fontFamily: SERIF,
                  fontSize: "1.15rem",
                  color: "#14211d",
                }}
              >
                {item.name ?? "Service"}
              </h3>
              {item.description ? (
                <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", lineHeight: 1.55 }}>
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Section: Social Proof ────────────────────────────────────────────────────

type ReviewItem = { author?: string; rating?: number; text?: string; date?: string };
type SocialProofContent = {
  headline?: string;
  reviews?: ReviewItem[];
};

function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"} ago`;
}

function SocialProofSection({ content }: { content: Record<string, unknown> }) {
  const c = content as SocialProofContent;
  const reviews = Array.isArray(c.reviews) ? c.reviews : [];

  return (
    <div style={{ padding: SECTION_PADDING, background: CARD_BG }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h2 style={sectionHeadingStyle()}>What Our Customers Say</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {reviews.map((review, index) => {
            const rating = typeof review.rating === "number" ? review.rating : 5;
            const clampedRating = Math.min(Math.max(Math.round(rating), 0), 5);
            const stars = "★".repeat(clampedRating);
            const initial = (review.author ?? "C").charAt(0).toUpperCase();
            const timeAgo = relativeTime(review.date);

            return (
              <figure
                key={`review-${index}`}
                style={{
                  margin: 0,
                  padding: "24px",
                  borderRadius: CARD_RADIUS,
                  background: "#fff",
                  border: CARD_BORDER,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: "40px",
                      height: "40px",
                      borderRadius: "999px",
                      background: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "#385145",
                    }}
                  >
                    {initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#14211d" }}>
                      {review.author ?? "Customer"}
                    </div>
                    {timeAgo ? (
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{timeAgo}</div>
                    ) : null}
                  </div>
                </div>
                <div
                  aria-label={`${clampedRating} out of 5 stars`}
                  style={{ color: "#f59e0b", fontSize: "1rem", marginBottom: "10px" }}
                >
                  <span aria-hidden="true">{stars}</span>
                </div>
                <blockquote
                  style={{
                    margin: 0,
                    fontStyle: "italic",
                    color: "#385145",
                    lineHeight: 1.65,
                    fontSize: "0.97rem",
                  }}
                >
                  &ldquo;{review.text ?? ""}&rdquo;
                </blockquote>
              </figure>
            );
          })}
        </div>
        <p
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "0.82rem",
            color: "#94a3b8",
          }}
        >
          Reviews sourced from Google
        </p>
      </div>
    </div>
  );
}

// ─── Section: About ───────────────────────────────────────────────────────────

type ContactInfo = { phone?: string; email?: string; address?: string };
type AboutContent = {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact?: ContactInfo;
};

function AboutSection({
  content,
  businessName,
}: {
  content: Record<string, unknown>;
  businessName: string;
}) {
  const c = content as AboutContent;
  const description = c.description ?? "";
  const phone = c.phone ?? (c.contact as ContactInfo | undefined)?.phone;
  const email = c.email ?? (c.contact as ContactInfo | undefined)?.email;
  const address = c.address ?? (c.contact as ContactInfo | undefined)?.address;
  const website = typeof c.website === "string" ? c.website : null;

  return (
    <div style={{ padding: SECTION_PADDING }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
            letterSpacing: "-0.02em",
            marginBottom: "20px",
          }}
        >
          About {businessName}
        </h2>
        {description ? (
          <p
            style={{
              fontSize: "1.05rem",
              color: "#385145",
              lineHeight: 1.7,
              maxWidth: "68ch",
              marginBottom: "32px",
            }}
          >
            {description}
          </p>
        ) : null}
        {(phone || email || address || website) ? (
          <div
            style={{
              padding: "24px",
              borderRadius: CARD_RADIUS,
              background: CARD_BG,
              border: CARD_BORDER,
              display: "inline-block",
              minWidth: "260px",
            }}
          >
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: "1.15rem",
                margin: "0 0 16px",
              }}
            >
              Contact Information
            </h3>
            <dl style={{ margin: 0, display: "grid", gap: "10px" }}>
              {phone ? (
                <>
                  <dt style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</dt>
                  <dd style={{ margin: 0 }}>
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      style={{ color: "#14211d", fontWeight: 600, textDecoration: "none" }}
                    >
                      {phone}
                    </a>
                  </dd>
                </>
              ) : null}
              {email ? (
                <>
                  <dt style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</dt>
                  <dd style={{ margin: 0 }}>
                    <a
                      href={`mailto:${email}`}
                      style={{ color: "#14211d", fontWeight: 600, textDecoration: "none" }}
                    >
                      {email}
                    </a>
                  </dd>
                </>
              ) : null}
              {address ? (
                <>
                  <dt style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Address</dt>
                  <dd style={{ margin: 0, color: "#385145" }}>{address}</dd>
                </>
              ) : null}
              {website ? (
                <>
                  <dt style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Website</dt>
                  <dd style={{ margin: 0 }}>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#14211d", fontWeight: 600, textDecoration: "none" }}
                    >
                      {website}
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Section: Hours ───────────────────────────────────────────────────────────

type BusinessHour = { day?: string; hours?: string };
type HoursContent = {
  hours?: BusinessHour[];
  businessHours?: BusinessHour[];
};

function HoursSection({ content }: { content: Record<string, unknown> }) {
  const c = content as HoursContent;
  const hours: BusinessHour[] = Array.isArray(c.hours)
    ? c.hours
    : Array.isArray(c.businessHours)
      ? c.businessHours
      : [];

  if (hours.length === 0) return null;

  return (
    <div style={{ padding: SECTION_PADDING, background: CARD_BG }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={sectionHeadingStyle()}>Hours of Operation</h2>
        <div
          style={{
            padding: "24px",
            borderRadius: CARD_RADIUS,
            background: "#fff",
            border: CARD_BORDER,
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}
            aria-label="Hours of operation"
          >
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "0 0 12px", fontWeight: 700, color: "#14211d", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", paddingRight: "24px" }}>Day</th>
                <th scope="col" style={{ textAlign: "left", padding: "0 0 12px", fontWeight: 700, color: "#14211d", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((row, index) => (
                <tr
                  key={`hour-${index}`}
                  style={{ borderTop: "1px solid #e2e8f0" }}
                >
                  <th
                    scope="row"
                    style={{
                      padding: "10px 24px 10px 0",
                      fontWeight: 600,
                      color: "#14211d",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.day ?? ""}
                  </th>
                  <td style={{ padding: "10px 0", color: "#385145" }}>
                    {row.hours ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Attributes ──────────────────────────────────────────────────────

type AttributesContent = {
  headline?: string;
  attributes?: string[];
  items?: string[];
};

function AttributesSection({ content }: { content: Record<string, unknown> }) {
  const c = content as AttributesContent;
  const items: string[] = Array.isArray(c.attributes)
    ? c.attributes
    : Array.isArray(c.items)
      ? c.items
      : [];

  if (items.length === 0) return null;

  return (
    <div style={{ padding: SECTION_PADDING }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h2 style={sectionHeadingStyle()}>Why Choose Us</h2>
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {items.map((attr, index) => (
            <li
              key={`attr-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 18px",
                borderRadius: CARD_RADIUS,
                background: CARD_BG,
                border: CARD_BORDER,
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#14211d",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: "22px",
                  height: "22px",
                  borderRadius: "999px",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  color: "#16a34a",
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              {attr}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Section: FAQ ─────────────────────────────────────────────────────────────

type FAQItem = { question?: string; answer?: string };
type FAQContent = {
  headline?: string;
  faqs?: FAQItem[];
  items?: FAQItem[];
};

function FAQSection({ content }: { content: Record<string, unknown> }) {
  const c = content as FAQContent;
  const items: FAQItem[] = Array.isArray(c.faqs)
    ? c.faqs
    : Array.isArray(c.items)
      ? c.items
      : [];

  if (items.length === 0) return null;

  return (
    <div style={{ padding: SECTION_PADDING, background: CARD_BG }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <h2 style={sectionHeadingStyle()}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "8px" }}>
          {items.map((item, index) => (
            <details
              key={`faq-${index}`}
              style={{
                borderRadius: CARD_RADIUS,
                background: "#fff",
                border: CARD_BORDER,
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  padding: "18px 22px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: "#14211d",
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {item.question ?? ""}
                <span aria-hidden="true" style={{ flexShrink: 0, fontSize: "1.2rem", color: "#64748b" }}>+</span>
              </summary>
              <div
                style={{
                  padding: "0 22px 18px",
                  color: "#385145",
                  lineHeight: 1.7,
                  fontSize: "0.97rem",
                }}
              >
                {item.answer ?? ""}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Lead Magnet ─────────────────────────────────────────────────────

type LeadMagnetContent = {
  headline?: string;
  description?: string;
};

function LeadMagnetSection({
  content,
  accent,
  niche,
  businessName,
  slug,
}: {
  content: Record<string, unknown>;
  accent: string;
  niche: string;
  businessName: string;
  slug: string;
}) {
  const c = content as LeadMagnetContent;
  const headline = c.headline ?? "Get in Touch";

  return (
    <div id="lead-capture" style={{ padding: SECTION_PADDING, background: CARD_BG }}>
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "40px 32px",
          borderRadius: "20px",
          background: "#fff",
          border: CARD_BORDER,
          boxShadow: "0 18px 60px rgba(24,33,29,0.08)",
        }}
      >
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            letterSpacing: "-0.02em",
            marginBottom: "10px",
            color: "#14211d",
          }}
        >
          {headline}
        </h2>
        {c.description ? (
          <p style={{ color: "#385145", marginBottom: "28px", lineHeight: 1.6 }}>
            {c.description}
          </p>
        ) : null}
        <LPLeadCaptureForm
          source={`lp-${slug}`}
          niche={niche}
          businessName={businessName}
          accentColor={accent}
        />
      </div>
    </div>
  );
}

// ─── Section: CTA Banner ──────────────────────────────────────────────────────

type CTABannerContent = {
  headline?: string;
  ctaText?: string;
  ctaUrl?: string;
  phone?: string;
};

function CTABannerSection({
  content,
  accent,
}: {
  content: Record<string, unknown>;
  accent: string;
}) {
  const c = content as CTABannerContent;
  const headline = c.headline ?? "Ready to get started?";
  const ctaLabel = c.ctaText ?? "Contact Us";
  const ctaHref = c.ctaUrl ?? "#lead-capture";
  const phone = typeof c.phone === "string" && c.phone ? c.phone : null;

  return (
    <div style={{ padding: "48px 24px", background: accent, textAlign: "center" }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: "20px",
          }}
        >
          {headline}
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {phone ? (
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "52px",
                padding: "14px 28px",
                borderRadius: "999px",
                background: "#fff",
                color: accent,
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              }}
            >
              {phone}
            </a>
          ) : null}
          <a
            href={ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "52px",
              padding: "14px 28px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.6)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function renderSection(
  section: LandingPageSection,
  page: FullLandingPage,
): React.ReactNode {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          content={section.content}
          accent={page.accentColor}
          businessName={page.businessName}
        />
      );
    case "trust-bar":
      return <TrustBarSection content={section.content} />;
    case "services":
      return <ServicesSection content={section.content} />;
    case "social-proof":
      return <SocialProofSection content={section.content} />;
    case "about":
      return <AboutSection content={section.content} businessName={page.businessName} />;
    case "lead-magnet":
      return (
        <LeadMagnetSection
          content={section.content}
          accent={page.accentColor}
          niche={page.niche}
          businessName={page.businessName}
          slug={page.slug}
        />
      );
    case "cta-banner":
      return <CTABannerSection content={section.content} accent={page.accentColor} />;
    case "faq":
      return <FAQSection content={section.content} />;
    default: {
      // Gracefully handle any section types added in future without a
      // corresponding renderer. Treat unknown types as no-ops.
      return null;
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage({ params }: LPPageProps) {
  const { slug } = await params;
  const page = (await getLandingPage(slug)) as FullLandingPage | undefined;

  if (!page || page.status === "archived" || page.status !== "published") notFound();

  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);
  const year = new Date().getFullYear();

  return (
    <main style={{ maxWidth: "100%", padding: 0, margin: 0 }}>
      {/* Skip-to-content — visible only on keyboard focus */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: ".lp-skip-link{position:absolute;top:-48px;left:16px;z-index:9999;transition:top 150ms ease}.lp-skip-link:focus-visible{top:0}" }} />
      <a
        href="#lead-capture"
        className="lp-skip-link"
        style={{
          padding: "10px 18px",
          background: "#14211d",
          color: "#fff",
          borderRadius: "0 0 8px 8px",
          fontSize: "0.9rem",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Skip to contact form
      </a>

      {sortedSections.map((section) => (
        <section key={section.id} id={`section-${section.id}`} aria-label={section.type}>
          {renderSection(section, page)}
        </section>
      ))}

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "#94a3b8",
          fontSize: "0.82rem",
          borderTop: CARD_BORDER,
        }}
      >
        <p style={{ margin: 0 }}>
          Business information sourced from Google. &copy; {year} {page.businessName}. Powered by LeadOS.
        </p>
      </footer>

      {/* JSON-LD structured data */}
      {page.jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }}
        />
      ) : null}
    </main>
  );
}
