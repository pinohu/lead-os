// erie-pro/src/components/audience/site-header-nav.tsx
"use client"

import Link from "next/link"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { usePageAudience } from "@/components/audience/audience-provider"
import { shouldShowConsumerPrimaryCta } from "@/lib/audience-context"

const topNiches = niches.slice(0, 6)
const moreNiches = niches.slice(6)

export function SiteHeaderNav() {
  const { audience } = usePageAudience()
  const isProviderZone = audience === "provider"
  const showConsumerCta = shouldShowConsumerPrimaryCta(audience)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href={isProviderZone ? "/pros" : "/"} className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">{cityConfig.domain}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {isProviderZone ? (
            <>
              <Link
                href="/for-business"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Plans &amp; pricing
              </Link>
              <Link
                href="/for-business/claim"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Claim listing
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="ml-1 inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Find services
              </Link>
            </>
          ) : (
            <>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 text-sm">Services</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[480px] gap-1 p-4 md:grid-cols-2">
                        {topNiches.map((n) => (
                          <NavigationMenuLink key={n.slug} asChild>
                            <Link
                              href={`/${n.slug}`}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <span>{n.icon}</span>
                              <div>
                                <div className="font-medium">{n.label}</div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{n.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                        {moreNiches.length > 0 && (
                          <>
                            <Separator className="col-span-2 my-1" />
                            {moreNiches.map((n) => (
                              <NavigationMenuLink key={n.slug} asChild>
                                <Link
                                  href={`/${n.slug}`}
                                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  <span>{n.icon}</span>
                                  <span>{n.label}</span>
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </>
                        )}
                        <Separator className="col-span-2 my-1" />
                        <NavigationMenuLink asChild>
                          <Link
                            href="/services"
                            className="col-span-2 rounded-md px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
                          >
                            View all services
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/directory"
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Directory
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/areas"
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Areas
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/emergency"
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Emergency
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/get-matched"
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Request help
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Link
                href="/pros"
                className="ml-1 inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                For providers
              </Link>
            </>
          )}

          <ThemeToggle />

          {showConsumerCta ? (
            <Button asChild size="sm" className="ml-2">
              <Link href="/get-matched">Get matched free</Link>
            </Button>
          ) : isProviderZone ? (
            <Button asChild size="sm" className="ml-2">
              <Link href="/for-business/claim">Claim listing</Link>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {showConsumerCta ? (
            <Button asChild size="sm" className="h-9 px-3 text-xs">
              <Link href="/get-matched">Get matched</Link>
            </Button>
          ) : isProviderZone ? (
            <Button asChild size="sm" className="h-9 px-3 text-xs">
              <Link href="/for-business/claim">Claim</Link>
            </Button>
          ) : null}
          <MobileNav />
        </div>
      </nav>
    </header>
  )
}
