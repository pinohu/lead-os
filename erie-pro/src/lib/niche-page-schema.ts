// ── Enhanced Schema.org JSON-LD Builder ───────────────────────────────
// Builds a multi-schema JSON-LD payload for a niche page:
//   - LocalBusiness (from existing local-seo)
//   - Service (the specific service offered)
//   - FAQPage (rendered FAQ items)
//   - BreadcrumbList (Home → niche)
//
// All schemas combined in a single @graph for cleaner injection. This is
// the kind of structured data that drives rich-result eligibility.

import type { NicheFaqItem } from "@/lib/niche-content";

interface BuildOpts {
  nicheSlug: string;
  nicheLabel: string;
  nicheDescription: string;
  pageUrl: string;
  domain: string;
  cityName: string;
  cityStateCode: string;
  countyName: string;
  faqItems: NicheFaqItem[];
  /** Pre-built LocalBusiness schema (from local-seo getLocalSchemaOrg) */
  localBusinessSchema?: object;
  priceRange?: string;
  /** ISO duration like "P0D" (immediate) for response time */
  expectedResponseTime?: string;
}

export function buildNichePageSchema(opts: BuildOpts) {
  const {
    nicheSlug,
    nicheLabel,
    nicheDescription,
    pageUrl,
    domain,
    cityName,
    cityStateCode,
    countyName,
    faqItems,
    localBusinessSchema,
    priceRange,
  } = opts;

  const graph: object[] = [];

  // Breadcrumb
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${domain}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: nicheLabel,
        item: pageUrl,
      },
    ],
  });

  // Service
  graph.push({
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    serviceType: nicheLabel,
    name: `${nicheLabel} in ${cityName}, ${cityStateCode}`,
    description: nicheDescription,
    provider: {
      "@type": "Organization",
      name: domain,
      url: `https://${domain}`,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: countyName,
    },
    ...(priceRange ? { offers: { "@type": "Offer", priceRange } } : {}),
  });

  // FAQPage
  if (faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.slice(0, 10).map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });
  }

  // LocalBusiness (from caller, since the local-seo helper builds it)
  if (localBusinessSchema && typeof localBusinessSchema === "object") {
    graph.push(localBusinessSchema as object);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
