import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { getAllSlugs, getServiceBySlug } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Story Not Found" };
  return {
    title: `${service.title} Success Story | ${siteConfig.brandName}`,
    description: `How ${service.title.toLowerCase()} transforms businesses. Real results, real impact.`,
    openGraph: {
      title: `${service.title} Success Story | ${siteConfig.brandName}`,
      description: service.tagline,
      type: "article",
      url: `${siteConfig.siteUrl}/stories/${service.slug}`,
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="bg-navy text-white pt-28">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="inline-flex rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-1 text-sm text-rose-200">
            Documentary / VSL Funnel
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">{service.title}</h1>
          <p className="mt-6 text-lg text-slate-300">{service.overview}</p>
          <div className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600">What the visitor learns</p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {service.features.slice(0, 3).map((feature) => (
                <div key={feature.title} className="rounded-2xl bg-black/20 p-5">
                  <h2 className="text-lg font-semibold">{feature.title}</h2>
                  <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Why this page exists</h2>
              <p className="mt-4 text-slate-300">
                Documentary and VSL pages are ideal when trust, sophistication, and proof matter more than speed. They
                let Lead OS sequence narrative, objection handling, and proof before the ask.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Intelligent next step</h2>
              <p className="mt-4 text-slate-300">
                Viewers who stay engaged can be routed to application, live consult, calculator, or webinar flows
                depending on their behavior and profile.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={`/assess/${service.slug}`} className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white">
              Start {service.title} Assessment
            </a>
            <a href="/calculator" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white">
              Calculate ROI
            </a>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${service.title} Success Story`,
            description: service.tagline,
            url: `${siteConfig.siteUrl}/stories/${service.slug}`,
            publisher: {
              "@type": "Organization",
              name: siteConfig.brandName,
              url: siteConfig.siteUrl,
            },
          }),
        }}
      />
    </>
  );
}
