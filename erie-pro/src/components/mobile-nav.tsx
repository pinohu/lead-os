"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

const niches = [
  { slug: "plumbing", label: "Plumbing", icon: "\uD83D\uDD27" },
  { slug: "hvac", label: "HVAC", icon: "\u2744\uFE0F" },
  { slug: "electrical", label: "Electrical", icon: "\u26A1" },
  { slug: "roofing", label: "Roofing", icon: "\uD83C\uDFE0" },
  { slug: "landscaping", label: "Landscaping", icon: "\uD83C\uDF3F" },
  { slug: "dental", label: "Dental", icon: "\uD83E\uDDB7" },
  { slug: "legal", label: "Legal", icon: "\u2696\uFE0F" },
  { slug: "cleaning", label: "Cleaning", icon: "\u2728" },
  { slug: "auto-repair", label: "Auto Repair", icon: "\uD83D\uDE97" },
  { slug: "pest-control", label: "Pest Control", icon: "\uD83D\uDC1B" },
  { slug: "painting", label: "Painting", icon: "\uD83C\uDFA8" },
  { slug: "real-estate", label: "Real Estate", icon: "\uD83C\uDFE1" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] overflow-y-auto sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="text-left">erie.pro</SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-1">
          {/* Services accordion */}
          <button
            onClick={() => setServicesOpen(!servicesOpen)}
            aria-expanded={servicesOpen}
            aria-controls="services-menu"
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Services
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                servicesOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {servicesOpen && (
            <div id="services-menu" className="ml-3 space-y-0.5 border-l pl-3">
              {niches.map((n) => (
                <Link
                  key={n.slug}
                  href={`/${n.slug}`}
                  onClick={close}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span>{n.icon}</span>
                  {n.label}
                </Link>
              ))}
              <Link
                href="/services"
                onClick={close}
                className="block rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
              >
                View All Services
              </Link>
            </div>
          )}

          <Link
            href="/areas"
            onClick={close}
            className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Areas
          </Link>

          <Link
            href="/about"
            onClick={close}
            className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            About
          </Link>

          <Link
            href="/contact"
            onClick={close}
            className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Contact
          </Link>

          <Separator className="my-2" />

          <Link
            href="/for-business"
            onClick={close}
            className="rounded-md px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            For Businesses
          </Link>

          <div className="mt-4 px-3">
            <Button asChild className="w-full" size="lg" onClick={close}>
              <Link href="/#services">Get a Free Quote</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
