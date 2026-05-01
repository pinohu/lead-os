import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllPackageClientExamples } from "@/lib/package-client-examples";

export const metadata: Metadata = {
  title: "Client Example Websites | Lead OS",
  description:
    "Standalone client-style example websites for every package, showing the deliverables, tutorials, process maps, and outcome proof.",
};

export default function ClientExamplesIndexPage() {
  const examples = getAllPackageClientExamples();

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Badge variant="secondary" className="mb-4">
            Client-style launches
          </Badge>
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Every package has a live example client website.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            These pages do not read like product docs. Each one looks like a simple website for a made-up client. The
            page shows the finished deliverables, the steps to use them, and the result the client should expect.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {examples.map((example) => (
            <article key={example.pkg.slug} className="overflow-hidden rounded-lg border border-border bg-card">
              <img src={example.photoUrl} alt={example.photoAlt} className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {example.domain}
                </p>
                <h2 className="mt-2 text-lg font-bold">{example.clientName}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{example.plainPromise}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/client-examples/${example.pkg.slug}`}>
                      View client site <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/packages/${example.pkg.slug}`}>
                      Package <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
