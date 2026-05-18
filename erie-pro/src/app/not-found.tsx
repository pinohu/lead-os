import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, Phone, ListChecks } from "lucide-react"
import { CONCIERGE_PHONE_DISPLAY, CONCIERGE_PHONE_TEL } from "@/lib/concierge"

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-6xl font-extrabold text-muted-foreground/20">
          404
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mb-8 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Browse the directory, start a free quote, or call our concierge.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/directory">
              <ListChecks className="mr-2 h-4 w-4" />
              Browse directory
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/get-matched">
              <Search className="mr-2 h-4 w-4" />
              Get matched free
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={CONCIERGE_PHONE_TEL}>
              <Phone className="mr-2 h-4 w-4" />
              {CONCIERGE_PHONE_DISPLAY}
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
