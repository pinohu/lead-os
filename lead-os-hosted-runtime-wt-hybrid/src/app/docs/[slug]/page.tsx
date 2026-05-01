import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownDocument } from "@/components/MarkdownDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocEntry, readDocMarkdown, docsCatalog } from "@/lib/docs-catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return docsCatalog.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getDocEntry(slug);
  if (!entry) return {};
  return {
    title: `${entry.title} | Docs`,
    description: entry.description,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const entry = getDocEntry(slug);
  if (!entry) notFound();

  let markdown: string;
  try {
    markdown = await readDocMarkdown(entry);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/docs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to docs
          </Link>
        </Button>
      </div>

      <header className="mb-8 rounded-lg border border-border bg-card p-6">
        <Badge variant="secondary" className="mb-3">
          {entry.category}
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{entry.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Source: <code>{entry.file}</code>
        </p>
      </header>

      <MarkdownDocument markdown={markdown} />
    </main>
  );
}
