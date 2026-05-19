import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProviderCheckoutCancelledPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Checkout cancelled</h1>
      <p className="mt-4 text-muted-foreground">No charge was made. You can return to plans when ready.</p>
      <Button className="mt-8" asChild>
        <Link href="/providers/offers">Back to plans</Link>
      </Button>
    </main>
  )
}
