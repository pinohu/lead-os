import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, ExternalLink, Map, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllPackageClientExamples, getPackageClientExample } from "@/lib/package-client-examples";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPackageClientExamples().map((example) => ({ slug: example.pkg.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const example = getPackageClientExample(slug);
  if (!example) return {};

  return {
    title: {
      absolute: `${example.clientName} | Example Client Website`,
    },
    description: example.plainPromise,
    openGraph: {
      title: `${example.clientName} | Example Client Website`,
      description: example.plainPromise,
      siteName: example.clientName,
      images: [{ url: example.photoUrl, alt: example.photoAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${example.clientName} | Example Client Website`,
      description: example.plainPromise,
      images: [example.photoUrl],
    },
  };
}

export default async function ClientExamplePage({ params }: Props) {
  const { slug } = await params;
  const example = getPackageClientExample(slug);
  if (!example) notFound();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <nav className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href={`/client-examples/${example.pkg.slug}`} className="font-extrabold tracking-tight">
            {example.clientName}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <a href="#deliverables" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Deliverables
            </a>
            <a href="#tutorial" className="rounded-md px-3 py-2 hover:bg-slate-100">
              How to use it
            </a>
            <a href="#proof" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Result
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[72vh] overflow-hidden">
        <img src={example.photoUrl} alt={example.photoAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/72" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-white sm:py-24">
          <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-semibold">
            {example.domain}
          </p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {example.plainPromise}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
            This example shows the real shape of the {example.pkg.title}. It is written so a busy owner can understand
            it fast.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#deliverables">
                {example.heroAction} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#tutorial">Show me the steps</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
          <InfoBlock label="Who this is for" value={example.buyer} />
          <InfoBlock label="Who gets helped" value={example.endUser} />
          <InfoBlock label="Main problem" value={example.mainPain} />
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge className="mb-3">Finished result</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight">What the client gets</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-700">{example.exampleResult}</p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              The client does not get a box of tools. The client gets a working set of pages, guides, rules, and proof
              screens that solve the problem.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {example.simpleSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Map className="h-5 w-5" />
            <h2 className="text-2xl font-extrabold">Process map</h2>
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
        </div>
      </section>

      <section id="deliverables" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3 border-slate-300 text-slate-700">
            Launched on this client site
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">The finished deliverables</h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            Each item below is something the client can open, use, send, review, or measure. The words are simple on
            purpose.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {example.visibleDeliverables.map((deliverable) => (
            <article id={deliverable.id} key={deliverable.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{deliverable.title}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {deliverable.launchSurface}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{deliverable.createdArtifact}</p>
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                <span className="font-semibold">How to use it:</span> {deliverable.plainUse}
              </p>
              <a href={`#${deliverable.id}`} className="mt-4 inline-flex items-center text-sm font-semibold text-slate-950">
                Open this deliverable <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="tutorial" className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <PlayCircle className="h-6 w-6" />
            <h2 className="text-3xl font-extrabold">Simple tutorial</h2>
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

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 rounded-lg border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <h2 className="text-2xl font-extrabold">Client handoff checklist</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Use this before the client calls the work finished.
            </p>
          </div>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {[
              "The buyer and end user are named clearly.",
              "The main pain is easy to understand.",
              "Every deliverable has a plain use note.",
              "The process map shows what happens next.",
              "The report explains how success is proven.",
              "The client can start without learning a new tool.",
            ].map((item) => (
              <li key={item} className="flex gap-2 rounded-md bg-white p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{value}</p>
    </div>
  );
}
