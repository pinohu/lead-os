import { SITE_CONFIG } from "@/constants/seo";

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export const generateFAQSchema = (faqs: FAQItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateLocalBusinessSchema = (params: {
  name: string;
  description: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
  url: string;
  services: Array<{ name: string; description: string; price: string }>;
  areaServed?: string[];
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": params.name,
    "image": `${SITE_CONFIG.url}/logo.png`,
    "description": params.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": params.city,
      "addressRegion": params.state,
      "addressCountry": "US",
      "postalCode": params.zipCode
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": SITE_CONFIG.address.latitude,
      "longitude": SITE_CONFIG.address.longitude
    },
    "url": params.url,
    "telephone": SITE_CONFIG.phone,
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59",
        "description": "Remote Online Notary (RON) available 24/7"
      }
    ],
    "areaServed": params.areaServed?.map(area => ({
      "@type": "City",
      "name": area,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": params.state,
        "addressCountry": "US"
      }
    })),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Notary Services",
      "itemListElement": params.services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name,
          "description": service.description
        },
        "price": service.price,
        "priceCurrency": "USD"
      }))
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "50"
    }
  };
};

export const generateServiceSchema = (params: {
  name: string;
  description: string;
  provider: string;
  areaServed: string;
  price: string;
  url: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": params.name,
    "description": params.description,
    "provider": {
      "@type": "Organization",
      "name": params.provider,
      "telephone": SITE_CONFIG.phone,
      "url": SITE_CONFIG.url
    },
    "areaServed": {
      "@type": "State",
      "name": "Pennsylvania"
    },
    "offers": {
      "@type": "Offer",
      "price": params.price,
      "priceCurrency": "USD",
      "url": params.url
    }
  };
};
