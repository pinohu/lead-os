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

const SERIF = "'Palatino Linotype', 'Book Antiqua', Georgia, serif";

/** Shared Tailwind classes for section containers */
const SECTION_CLASSES = "py-16 px-6";
const MAX_W_CLASSES = "max-w-[1080px] mx-auto";
const CARD_CLASSES = "bg-slate-50 border border-slate-200 rounded-xl";

/** Shared heading className */
const HEADING_CLASSES = "mb-8 text-center -tracking-[0.02em]";

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

  return (
    <div
      className="bg-cover bg-center py-20 px-6 text-center text-white"
      style={{
        backgroundImage: bgImage
          ? `linear-gradient(135deg, ${accent}e6 0%, ${accent}b3 100%), url(${bgImage})`
          : `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
      }}
    >
      <div className={MAX_W_CLASSES}>
        <h1
          className="mb-5 leading-[1.08] -tracking-[0.02em] text-white"
          style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
        >
          {headline}
        </h1>
        {subheadline ? (
          <p
            className="text-white/90 max-w-[62ch] mx-auto mb-6 leading-relaxed"
            style={{ fontSize: "clamp(1.05rem, 2vw, 1.3rem)" }}
          >
            {subheadline}
          </p>
        ) : null}
        {reviewCount > 0 ? (
          <div
            aria-label={`Rated ${rating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}
            className="inline-flex items-center gap-2 mb-7 bg-white/15 py-1.5 px-4 rounded-full"
          >
            <span aria-hidden="true" className="text-amber-300 text-[1.1rem] tracking-[2px]">
              {stars}
            </span>
            <span className="text-[0.9rem] font-semibold text-white/95">
              {rating.toFixed(1)} ({reviewCount.toLocaleString()} reviews)
            </span>
          </div>
        ) : null}
        <div>
          <a
            href="#lead-capture"
            className="inline-flex items-center justify-center min-h-[52px] py-3.5 px-8 rounded-full bg-white font-bold text-base no-underline shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            style={{ color: accent }}
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
    <div className="p-6 bg-slate-50 border-b border-slate-200">
      <div className={`${MAX_W_CLASSES} flex flex-wrap items-center gap-4 justify-center`}>
        {reviewCount > 0 ? (
          <div
            className="flex items-center gap-1.5"
            aria-label={`Rated ${rating} out of 5 stars from ${reviewCount} reviews`}
          >
            <span aria-hidden="true" className="text-amber-500 text-[1.1rem] tracking-[1px]">
              {stars}
            </span>
            <span className="text-[0.9rem] font-semibold text-[#385145]">
              {reviewCount.toLocaleString()} reviews
            </span>
          </div>
        ) : null}
        {serviceArea ? (
          <span className="py-1.5 px-3.5 rounded-full bg-[rgba(34,95,84,0.1)] border border-[rgba(34,95,84,0.18)] text-[0.85rem] font-semibold text-[#225f54]">
            {serviceArea}
          </span>
        ) : null}
        {badges.map((badge) => (
          <span
            key={badge}
            className="py-1.5 px-3.5 rounded-full bg-white border border-slate-200 text-[0.85rem] font-semibold text-[#385145]"
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
    <div className={SECTION_CLASSES}>
      <div className={MAX_W_CLASSES}>
        <h2 className={HEADING_CLASSES} style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Our Services</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 list-none p-0 m-0">
          {items.map((item, index) => (
            <li
              key={`${item.name ?? "service"}-${index}`}
              className={`${CARD_CLASSES} py-[22px] px-6`}
            >
              <h3
                className="mb-1.5 text-[1.15rem] text-foreground"
                style={{ fontFamily: SERIF }}
              >
                {item.name ?? "Service"}
              </h3>
              {item.description ? (
                <p className="m-0 text-[0.92rem] text-slate-500 leading-[1.55]">
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
    <div className={`${SECTION_CLASSES} bg-slate-50`}>
      <div className={MAX_W_CLASSES}>
        <h2 className={HEADING_CLASSES} style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>What Our Customers Say</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {reviews.map((review, index) => {
            const rating = typeof review.rating === "number" ? review.rating : 5;
            const clampedRating = Math.min(Math.max(Math.round(rating), 0), 5);
            const stars = "★".repeat(clampedRating);
            const initial = (review.author ?? "C").charAt(0).toUpperCase();
            const timeAgo = relativeTime(review.date);

            return (
              <figure
                key={`review-${index}`}
                className="m-0 p-6 rounded-xl bg-white border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <div
                    aria-hidden="true"
                    className="shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-base text-[#385145]"
                  >
                    {initial}
                  </div>
                  <div>
                    <div className="font-bold text-[0.92rem] text-foreground">
                      {review.author ?? "Customer"}
                    </div>
                    {timeAgo ? (
                      <div className="text-[0.8rem] text-slate-500">{timeAgo}</div>
                    ) : null}
                  </div>
                </div>
                <div
                  aria-label={`${clampedRating} out of 5 stars`}
                  className="text-amber-500 text-base mb-2.5"
                >
                  <span aria-hidden="true">{stars}</span>
                </div>
                <blockquote className="m-0 italic text-[#385145] leading-[1.65] text-[0.97rem]">
                  &ldquo;{review.text ?? ""}&rdquo;
                </blockquote>
              </figure>
            );
          })}
        </div>
        <p className="mt-7 text-center text-[0.82rem] text-muted-foreground">
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

  const DT_CLASSES = "text-[0.82rem] font-bold text-slate-500 uppercase tracking-[0.08em]";

  return (
    <div className={SECTION_CLASSES}>
      <div className={MAX_W_CLASSES}>
        <h2
          className="mb-5 -tracking-[0.02em]"
          style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}
        >
          About {businessName}
        </h2>
        {description ? (
          <p className="text-[1.05rem] text-[#385145] leading-[1.7] max-w-[68ch] mb-8">
            {description}
          </p>
        ) : null}
        {(phone || email || address || website) ? (
          <div className={`${CARD_CLASSES} p-6 inline-block min-w-[260px]`}>
            <h3
              className="text-[1.15rem] mb-4"
              style={{ fontFamily: SERIF }}
            >
              Contact Information
            </h3>
            <dl className="m-0 grid gap-2.5">
              {phone ? (
                <>
                  <dt className={DT_CLASSES}>Phone</dt>
                  <dd className="m-0">
                    <a href={`tel:${phone.replace(/\D/g, "")}`} className="text-foreground font-semibold no-underline">
                      {phone}
                    </a>
                  </dd>
                </>
              ) : null}
              {email ? (
                <>
                  <dt className={DT_CLASSES}>Email</dt>
                  <dd className="m-0">
                    <a href={`mailto:${email}`} className="text-foreground font-semibold no-underline">
                      {email}
                    </a>
                  </dd>
                </>
              ) : null}
              {address ? (
                <>
                  <dt className={DT_CLASSES}>Address</dt>
                  <dd className="m-0 text-[#385145]">{address}</dd>
                </>
              ) : null}
              {website ? (
                <>
                  <dt className={DT_CLASSES}>Website</dt>
                  <dd className="m-0">
                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold no-underline">
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
    <div className={`${SECTION_CLASSES} bg-slate-50`}>
      <div className="max-w-[600px] mx-auto">
        <h2 className={HEADING_CLASSES} style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Hours of Operation</h2>
        <div className="p-6 rounded-xl bg-white border border-slate-200">
          <table
            className="w-full border-collapse text-[0.95rem]"
            aria-label="Hours of operation"
          >
            <thead>
              <tr>
                <th scope="col" className="text-left pb-3 pr-6 font-bold text-foreground text-[0.82rem] uppercase tracking-[0.08em]">Day</th>
                <th scope="col" className="text-left pb-3 font-bold text-foreground text-[0.82rem] uppercase tracking-[0.08em]">Hours</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((row, index) => (
                <tr
                  key={`hour-${index}`}
                  className="border-t border-slate-200"
                >
                  <th scope="row" className="py-2.5 pr-6 font-semibold text-foreground text-left whitespace-nowrap">
                    {row.day ?? ""}
                  </th>
                  <td className="py-2.5 text-[#385145]">
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
    <div className={SECTION_CLASSES}>
      <div className={MAX_W_CLASSES}>
        <h2 className={HEADING_CLASSES} style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Why Choose Us</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 list-none p-0 m-0">
          {items.map((attr, index) => (
            <li
              key={`attr-${index}`}
              className={`${CARD_CLASSES} flex items-center gap-2.5 py-3.5 px-[18px] text-[0.95rem] font-semibold text-foreground`}
            >
              <span
                aria-hidden="true"
                className="shrink-0 w-[22px] h-[22px] rounded-full bg-green-100 flex items-center justify-center text-[0.8rem] text-green-600 font-bold"
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
    <div className={`${SECTION_CLASSES} bg-slate-50`}>
      <div className="max-w-[760px] mx-auto">
        <h2 className={HEADING_CLASSES} style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>Frequently Asked Questions</h2>
        <div className="grid gap-2">
          {items.map((item, index) => (
            <details
              key={`faq-${index}`}
              className="rounded-xl bg-white border border-slate-200 overflow-hidden"
            >
              <summary className="py-[18px] px-[22px] font-semibold text-base text-foreground cursor-pointer list-none flex justify-between items-center gap-3">
                {item.question ?? ""}
                <span aria-hidden="true" className="shrink-0 text-[1.2rem] text-slate-500">+</span>
              </summary>
              <div className="px-[22px] pb-[18px] text-[#385145] leading-[1.7] text-[0.97rem]">
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
    <div id="lead-capture" className={`${SECTION_CLASSES} bg-slate-50`}>
      <div className="max-w-[640px] mx-auto py-10 px-8 rounded-[20px] bg-white border border-slate-200 shadow-[0_18px_60px_rgba(24,33,29,0.08)]">
        <h2
          className="mb-2.5 -tracking-[0.02em] text-foreground"
          style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
        >
          {headline}
        </h2>
        {c.description ? (
          <p className="text-[#385145] mb-7 leading-relaxed">
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
    <div className="py-12 px-6 text-center" style={{ background: accent }}>
      <div className={MAX_W_CLASSES}>
        <h2
          className="mb-5 -tracking-[0.02em] text-white"
          style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}
        >
          {headline}
        </h2>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              className="inline-flex items-center justify-center min-h-[52px] py-3.5 px-7 rounded-full bg-white font-bold text-base no-underline shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
              style={{ color: accent }}
            >
              {phone}
            </a>
          ) : null}
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center min-h-[52px] py-3.5 px-7 rounded-full bg-white/[0.18] border-2 border-white/60 text-white font-bold text-base no-underline"
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
    <main className="max-w-full p-0 m-0">
      {/* Skip-to-content — visible only on keyboard focus */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: ".lp-skip-link{position:absolute;top:-48px;left:16px;z-index:9999;transition:top 150ms ease}.lp-skip-link:focus-visible{top:0}" }} />
      <a
        href="#lead-capture"
        className="lp-skip-link py-2.5 px-[18px] bg-[#14211d] text-white rounded-b-lg text-[0.9rem] font-semibold no-underline"
      >
        Skip to contact form
      </a>

      {sortedSections.map((section) => (
        <section key={section.id} id={`section-${section.id}`} aria-label={section.type}>
          {renderSection(section, page)}
        </section>
      ))}

      <footer className="text-center p-6 text-muted-foreground text-[0.82rem] border-t border-slate-200">
        <p className="m-0">
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
