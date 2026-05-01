import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSourceReference, sourceReferenceCatalog } from "@/lib/source-reference-catalog";

type Props = {
  params: Promise<{ path?: string[] }>;
};

export const metadata: Metadata = {
  title: "Source reference | Docs",
  description: "Read-only website view for referenced public-repo source files.",
};

export function generateStaticParams() {
  return sourceReferenceCatalog.map((entry) => ({ path: entry.relative.split("/") }));
}

export default async function SourceReferencePage({ params }: Props) {
  const { path: pathParts } = await params;
  const relative = pathParts?.join("/") ?? "";
  const entry = getSourceReference(relative);
  if (!entry) notFound();

  let source: string;
  try {
    source = await readFile(entry.absolutePath, "utf8");
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/docs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to docs
          </Link>
        </Button>
      </div>

      <header className="mb-6 rounded-lg border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source reference</p>
        <h1 className="mt-2 break-words text-2xl font-bold text-foreground">{entry.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only website view of a public-repo file referenced by the product. This keeps operational buttons on the
          site instead of sending users to GitHub.
        </p>
        <p className="mt-3 break-words text-xs text-muted-foreground">
          Source: <code>{entry.relative}</code>
        </p>
      </header>

      <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed">
        <code>{source}</code>
      </pre>
    </main>
  );
}
