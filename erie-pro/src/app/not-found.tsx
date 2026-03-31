import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft } from "lucide-react"

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
          Try browsing our services or searching for what you need.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">
              <Search className="mr-2 h-4 w-4" />
              Browse services
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
