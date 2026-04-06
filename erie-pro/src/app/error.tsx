"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mb-8 text-muted-foreground">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mb-6 overflow-auto rounded-lg bg-muted p-4 text-left text-xs">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
