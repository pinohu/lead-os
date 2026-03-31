import { MapPin, Shield, FileText } from "lucide-react"
import { ERIE_LOCAL_SEO } from "@/lib/local-seo"

/**
 * Local SEO Footer — renders on every page with deep local signals.
 * Includes neighborhoods, zip codes, licensing info, and Schema.org
 * LocalBusiness markup with geo coordinates.
 */
export function LocalSeoFooter() {
  const seo = ERIE_LOCAL_SEO

  return (
    <section
      aria-label="Local service area information"
      className="border-t bg-muted/20"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
            <MapPin className="h-5 w-5 text-primary" />
            Serving {seo.city} and Surrounding Communities
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {seo.countyName}, {seo.state}
          </p>
        </div>

        {/* Neighborhoods grid */}
        <div className="mb-8">
          <h3 className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Neighborhoods &amp; Communities We Serve
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {seo.neighborhoods.map((neighborhood) => (
              <span
                key={neighborhood}
                className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {neighborhood}
              </span>
            ))}
          </div>
        </div>

        {/* Info row */}
        <div className="grid gap-6 text-center text-sm sm:grid-cols-3">
          {/* Licensing */}
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Licensed &amp; Insured in Pennsylvania</h3>
            <p className="text-xs text-muted-foreground">
              All providers are verified and meet {seo.state} licensing
              requirements
            </p>
          </div>

          {/* Zip Codes */}
          <div className="flex flex-col items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-medium">{seo.countyName} Zip Codes</h3>
            <p className="text-xs text-muted-foreground">
              {seo.zipCodes.join(" \u00B7 ")}
            </p>
          </div>

          {/* Permits */}
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Permit Information</h3>
            <p className="text-xs text-muted-foreground">
              {seo.permitInfo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Schema.org LocalBusiness with geo coordinates ──────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "erie.pro",
            description: `Find verified local service providers in ${seo.city}, ${seo.stateCode}. Free quotes, no obligation.`,
            url: "https://erie.pro",
            telephone: "+1-814-000-0000",
            address: {
              "@type": "PostalAddress",
              addressLocality: seo.city,
              addressRegion: seo.stateCode,
              addressCountry: "US",
              postalCode: seo.zipCodes[0],
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: seo.geoCoordinates.lat,
              longitude: seo.geoCoordinates.lng,
            },
            areaServed: seo.neighborhoods.map((n) => ({
              "@type": "Place",
              name: n,
            })),
            sameAs: ["https://erie.pro"],
          }),
        }}
      />
    </section>
  )
}
