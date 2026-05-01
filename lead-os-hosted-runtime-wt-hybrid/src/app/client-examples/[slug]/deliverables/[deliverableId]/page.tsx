import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Map, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAllPackageDeliverableClientExamples,
  getPackageDeliverableClientExample,
} from "@/lib/package-client-examples";

type Props = {
  params: Promise<{ slug: string; deliverableId: string }>;
};

export function generateStaticParams() {
  return getAllPackageDeliverableClientExamples().map((example) => ({
    slug: example.packageExample.pkg.slug,
    deliverableId: example.deliverable.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, deliverableId } = await params;
  const example = getPackageDeliverableClientExample(slug, deliverableId);
  if (!example) return {};

  return {
    title: {
      absolute: `${example.deliverable.title} | ${example.packageExample.clientName}`,
    },
    description: example.plainResult,
    openGraph: {
      title: `${example.deliverable.title} | ${example.packageExample.clientName}`,
      description: example.plainResult,
      siteName: example.packageExample.clientName,
      images: [{ url: example.packageExample.photoUrl, alt: example.packageExample.photoAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${example.deliverable.title} | ${example.packageExample.clientName}`,
      description: example.plainResult,
      images: [example.packageExample.photoUrl],
    },
  };
}

export default async function ClientDeliverableExamplePage({ params }: Props) {
  const { slug, deliverableId } = await params;
  const example = getPackageDeliverableClientExample(slug, deliverableId);
  if (!example) notFound();

  const packageExample = example.packageExample;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href={`/client-examples/${packageExample.pkg.slug}`} className="font-extrabold tracking-tight">
            {packageExample.clientName}
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href={`/client-examples/${packageExample.pkg.slug}`}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to client site
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200">
        <img src={packageExample.photoUrl} alt={packageExample.photoAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/88" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="mb-4 bg-slate-950 text-white">{example.visualLabel}</Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {example.headline}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">{example.plainResult}</p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              This is one finished deliverable from the {packageExample.pkg.title}. It has its own page so the client
              knows what it is, how to use it, and how to check that it worked.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#tutorial">
                  Use this deliverable <PlayCircle className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#proof">Check if it is done</a>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created output</p>
            <h2 className="mt-2 text-2xl font-extrabold">{example.deliverable.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">{example.deliverable.createdArtifact}</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold">How the client uses it</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{example.deliverable.plainUse}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
          <Info label="Buyer" value={packageExample.buyer} />
          <Info label="User helped" value={packageExample.endUser} />
          <Info label="Problem solved" value={packageExample.mainPain} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center gap-2">
          <Map className="h-5 w-5" />
          <h2 className="text-2xl font-extrabold">Mini process map</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {example.processMap.map((step, index) => (
            <div key={step.title} className="relative rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              {index < example.processMap.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-white text-slate-500 md:block" />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section id="tutorial" className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <PlayCircle className="h-6 w-6" />
            <h2 className="text-3xl font-extrabold">How to use it</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {example.tutorial.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-white/15 bg-white/10 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="font-bold">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              <h2 className="text-2xl font-extrabold">Done when</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Use this checklist before showing the deliverable as complete.
            </p>
          </div>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {example.acceptanceChecks.map((check) => (
              <li key={check} className="flex gap-2 rounded-md bg-white p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{value}</p>
    </div>
  );
}
