// ── County Authority Section ──────────────────────────────────────────
// Renders comprehensive county-level information on the /directory page,
// turning it into the authoritative reference for the entire service
// area. Pulls from the existing local-seo dataset (which already has
// neighborhoods, ZIPs, landmarks, climate, building codes, licensing).
//
// Why this matters: long-tail SEO ("Erie County building permits",
// "Erie County ZIP codes", "Erie County licensed plumbers") all land on
// this page. Every visitor leaves either with the answer they came for
// or a route to a verified local pro.

import {
  MapPin,
  Landmark,
  Snowflake,
  ShieldCheck,
  Building,
  Thermometer,
  Hash,
  ScrollText,
} from "lucide-react";
import { localSeo } from "@/lib/local-seo";

export default function CountyAuthoritySection() {
  return (
    <section
      aria-labelledby="county-authority-heading"
      className="border-t bg-card"
    >
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2
          id="county-authority-heading"
          className="mb-2 text-2xl font-bold tracking-tight"
        >
          About {localSeo.countyName}
        </h2>
        <p className="mb-8 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Everything you need to know about the {localSeo.countyName} service
          area, from coverage and ZIP codes to climate, building codes, and
          contractor licensing. Use this as a reference when planning any
          home or business project.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Coverage area ────────────────────────────── */}
          <article
            aria-labelledby="coverage-heading"
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3
                id="coverage-heading"
                className="text-sm font-semibold"
              >
                Coverage area
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Neighborhoods served
                </p>
                <p className="mt-1 leading-relaxed text-foreground">
                  {localSeo.neighborhoods.join(" · ")}
                </p>
              </div>
              {localSeo.population && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Population
                  </p>
                  <p className="mt-0.5 text-foreground">{localSeo.population}</p>
                </div>
              )}
              {localSeo.medianHomeValue && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Median home value
                  </p>
                  <p className="mt-0.5 text-foreground">{localSeo.medianHomeValue}</p>
                </div>
              )}
            </div>
          </article>

          {/* ── ZIP codes served ─────────────────────────── */}
          <article
            aria-labelledby="zip-heading"
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 id="zip-heading" className="text-sm font-semibold">
                ZIP codes
              </h3>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              {localSeo.zipCodes.length} ZIPs across the service footprint:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {localSeo.zipCodes.map((z) => (
                <span
                  key={z}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-xs"
                >
                  {z}
                </span>
              ))}
            </div>
          </article>

          {/* ── Landmarks ────────────────────────────────── */}
          {localSeo.landmarks.length > 0 && (
            <article
              aria-labelledby="landmarks-heading"
              className="rounded-lg border border-border bg-background p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <Landmark
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <h3
                  id="landmarks-heading"
                  className="text-sm font-semibold"
                >
                  Landmarks
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                {localSeo.landmarks.slice(0, 10).map((l) => (
                  <li key={l} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                    />
                    <span className="text-foreground">{l}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {/* ── Climate ──────────────────────────────────── */}
          {(localSeo.climateNotes.length > 0 ||
            localSeo.annualSnowfall ||
            localSeo.avgWinterTemp) && (
            <article
              aria-labelledby="climate-heading"
              className="rounded-lg border border-border bg-background p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <Thermometer
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <h3
                  id="climate-heading"
                  className="text-sm font-semibold"
                >
                  Climate context
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {localSeo.avgWinterTemp && (
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground">Winter avg</p>
                    <p className="font-semibold">{localSeo.avgWinterTemp}</p>
                  </div>
                )}
                {localSeo.avgSummerTemp && (
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground">Summer avg</p>
                    <p className="font-semibold">{localSeo.avgSummerTemp}</p>
                  </div>
                )}
                {localSeo.annualSnowfall && (
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground">Snowfall</p>
                    <p className="text-xs font-semibold">{localSeo.annualSnowfall}</p>
                  </div>
                )}
              </div>
              {localSeo.climateNotes.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {localSeo.climateNotes.slice(0, 4).map((n) => (
                    <li key={n} className="flex gap-2">
                      <Snowflake
                        className="mt-0.5 h-3 w-3 shrink-0 text-blue-500"
                        aria-hidden="true"
                      />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}

          {/* ── Building codes ───────────────────────────── */}
          {localSeo.buildingCodes.length > 0 && (
            <article
              aria-labelledby="codes-heading"
              className="rounded-lg border border-border bg-background p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <Building
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <h3 id="codes-heading" className="text-sm font-semibold">
                  Building codes
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                {localSeo.buildingCodes.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                    />
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {/* ── Licensing requirements ──────────────────── */}
          {localSeo.licensingRequirements.length > 0 && (
            <article
              aria-labelledby="licensing-heading"
              className="rounded-lg border border-border bg-background p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <h3
                  id="licensing-heading"
                  className="text-sm font-semibold"
                >
                  Contractor licensing
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                {localSeo.licensingRequirements.slice(0, 8).map((l) => (
                  <li key={l} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                    />
                    <span className="text-foreground">{l}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>

        {/* ── Permit info banner ───────────────────────────── */}
        {localSeo.permitInfo && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex gap-3">
              <ScrollText
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                aria-hidden="true"
              />
              <div>
                <h3 className="mb-1 text-sm font-semibold text-blue-900">
                  Permits in {localSeo.countyName}
                </h3>
                <p className="text-sm leading-relaxed text-blue-900/80">
                  {localSeo.permitInfo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
