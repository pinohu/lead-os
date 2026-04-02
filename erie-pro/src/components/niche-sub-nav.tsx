"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NICHE_PAGES = [
  { segment: "",               label: "Overview" },
  { segment: "directory",      label: "Directory" },
  { segment: "reviews",        label: "Reviews" },
  { segment: "pricing",        label: "Pricing" },
  { segment: "costs",          label: "Costs" },
  { segment: "faq",            label: "FAQ" },
  { segment: "guides",         label: "Guides" },
  { segment: "blog",           label: "Blog" },
  { segment: "compare",        label: "Compare" },
  { segment: "tips",           label: "Tips" },
  { segment: "emergency",      label: "Emergency" },
  { segment: "seasonal",       label: "Seasonal" },
  { segment: "checklist",      label: "Checklist" },
  { segment: "certifications", label: "Certifications" },
  { segment: "glossary",       label: "Glossary" },
] as const

export function NicheSubNav({ niche }: { niche: string }) {
  const pathname = usePathname()

  // Determine which segment is active
  // pathname looks like /plumbing, /plumbing/faq, /plumbing/some-provider-slug
  const parts = pathname.split("/").filter(Boolean)
  const currentSegment = parts.length > 1 ? parts[1] : ""
  const knownSegments = new Set(NICHE_PAGES.map((p) => p.segment))

  // If the second segment isn't a known page type, it's a provider page — highlight "Directory"
  const activeSegment = knownSegments.has(currentSegment as typeof NICHE_PAGES[number]["segment"]) ? currentSegment : "directory"

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {NICHE_PAGES.map((page) => {
            const href = page.segment ? `/${niche}/${page.segment}` : `/${niche}`
            const isActive = activeSegment === page.segment

            return (
              <Link
                key={page.segment}
                href={href}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {page.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
