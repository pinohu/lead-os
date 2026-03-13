import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssessmentQuiz from "@/components/AssessmentQuiz";
import { NICHE_ASSESSMENTS, DEFAULT_ASSESSMENT } from "@/lib/funnel-engine";
import { siteConfig } from "@/lib/site-config";

const VALID_NICHES = Array.from(new Set(["general", ...Object.keys(NICHE_ASSESSMENTS).filter((niche) =>
  siteConfig.activeServiceSlugs.includes(niche),
)]));

export function generateStaticParams() {
  return VALID_NICHES.map(niche => ({ niche }));
}

export function generateMetadata({ params }: { params: Promise<{ niche: string }> }) {
  // Use default metadata since we can't await in generateMetadata synchronously
  return {
    title: `Business Readiness Assessment | ${siteConfig.brandName}`,
    description: "Take our free assessment and discover how automation can transform your business.",
  };
}

export default async function AssessPage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche } = await params;

  if (!VALID_NICHES.includes(niche)) {
    notFound();
  }

  const assessment = NICHE_ASSESSMENTS[niche] ?? DEFAULT_ASSESSMENT;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 pt-32">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">
              Free Assessment
            </div>
            <h1 className="mb-3 text-4xl font-bold text-navy">{assessment.title}</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-600">{assessment.subtitle}</p>
          </div>

          <AssessmentQuiz
            niche={niche}
            title={assessment.title}
            subtitle={assessment.subtitle}
            questions={assessment.questions}
            resultTiers={assessment.resultTiers}
          />

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              Takes less than 2 minutes. No signup required to start.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
