import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main aria-labelledby="not-found-heading">
      <div className="max-w-xl mx-auto grid gap-10 text-center">
        <div className="hero grid gap-8">
          <span
            aria-hidden="true"
            className="block text-7xl font-bold text-primary leading-none tracking-tighter"
            style={{ fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif' }}
          >
            404
          </span>
          <h1 id="not-found-heading" className="text-foreground text-3xl font-bold">
            Page not found
          </h1>
          <p className="text-lg text-muted-foreground">
            The page you are looking for does not exist, was moved, or is no
            longer available.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild><Link href="/" aria-label="Return to the home page">
              Back to home
            </Link></Button>
            <Button asChild variant="outline"><Link href="/setup">
              Setup
            </Link></Button>
          </div>
        </div>
      </div>
    </main>
  );
}
