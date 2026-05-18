// erie-pro/src/lib/organization-nap.ts
import { cityConfig } from "@/lib/city-config"

const DEFAULT_PHONE = "+18142000328"
const DEFAULT_PHONE_DISPLAY = "(814) 200-0328"

export const organizationNap = {
  name: cityConfig.domain,
  legalName: process.env.NEXT_PUBLIC_ORG_LEGAL_NAME ?? `${cityConfig.domain} (Erie County operations)`,
  phone: process.env.NEXT_PUBLIC_NAP_PHONE ?? DEFAULT_PHONE,
  phoneDisplay: process.env.NEXT_PUBLIC_NAP_PHONE_DISPLAY ?? DEFAULT_PHONE_DISPLAY,
  email: process.env.NEXT_PUBLIC_NAP_EMAIL ?? `hello@${cityConfig.domain}`,
  streetAddress: process.env.NEXT_PUBLIC_NAP_STREET_ADDRESS,
  postalCode: process.env.NEXT_PUBLIC_NAP_POSTAL_CODE ?? "16501",
  addressLocality: cityConfig.name,
  addressRegion: cityConfig.stateCode,
  addressCountry: "US",
  googleBusinessUrl: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_PROFILE_URL,
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  bbbUrl: process.env.NEXT_PUBLIC_BBB_URL,
  hours: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
    { dayOfWeek: "Saturday", opens: "09:00", closes: "15:00" },
  ],
} as const

export function buildOrganizationSameAs() {
  return [organizationNap.googleBusinessUrl, organizationNap.facebookUrl, organizationNap.bbbUrl].filter(
    (url): url is string => Boolean(url),
  )
}

export function buildOrganizationPostalAddress() {
  if (organizationNap.streetAddress) {
    return {
      "@type": "PostalAddress" as const,
      streetAddress: organizationNap.streetAddress,
      addressLocality: organizationNap.addressLocality,
      addressRegion: organizationNap.addressRegion,
      postalCode: organizationNap.postalCode,
      addressCountry: organizationNap.addressCountry,
    }
  }
  return {
    "@type": "PostalAddress" as const,
    addressLocality: organizationNap.addressLocality,
    addressRegion: organizationNap.addressRegion,
    postalCode: organizationNap.postalCode,
    addressCountry: organizationNap.addressCountry,
  }
}

export function buildOrganizationJsonLd() {
  const sameAs = buildOrganizationSameAs()
  return {
    "@type": "Organization",
    "@id": `https://${cityConfig.domain}/#organization`,
    name: organizationNap.name,
    url: `https://${cityConfig.domain}`,
    email: organizationNap.email,
    telephone: organizationNap.phone,
    address: buildOrganizationPostalAddress(),
    areaServed: cityConfig.serviceArea.map((area) => ({
      "@type": "City",
      name: area,
    })),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function googleMapsEmbedUrl() {
  const { lat, lng } = cityConfig.coordinates
  return `https://maps.google.com/maps?q=${lat},${lng}&z=11&output=embed`
}
