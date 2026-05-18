import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import TrustBadges from "@/components/marketing/TrustBadges";
import SEO from "@/components/SEO";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// Performance optimization: Lazy load below-the-fold components
const ProcessTimeline = lazy(() => import("@/components/ProcessTimeline"));
const WhyNotroom = lazy(() => import("@/components/WhyNotroom"));
const RealTestimonials = lazy(() => import("@/components/marketing/RealTestimonials"));
const FAQ = lazy(() => import("@/components/FAQ"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));
const BookingForm = lazy(() => import("@/components/BookingForm"));
const ExitIntent = lazy(() => import("@/components/ExitIntent"));
const PricingCalculator = lazy(() => import("@/components/PricingCalculator"));
const GuaranteeSection = lazy(() => import("@/components/marketing/GuaranteeSection"));
const ValueStack = lazy(() => import("@/components/marketing/ValueStack"));
const ComparisonTable = lazy(() => import("@/components/marketing/ComparisonTable"));
const BeforeAfter = lazy(() => import("@/components/marketing/BeforeAfter"));
const AuthorityBuilder = lazy(() => import("@/components/marketing/AuthorityBuilder"));
const LeadMagnet = lazy(() => import("@/components/lead-gen/LeadMagnet"));
const ServiceQuiz = lazy(() => import("@/components/lead-gen/ServiceQuiz"));
const TripwireOffer = lazy(() => import("@/components/lead-gen/TripwireOffer"));
const ValueLadder = lazy(() => import("@/components/lead-gen/ValueLadder"));

const Index = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "name": "Notroom - Notary, Business Filing & Compliance Services",
        "image": "https://notroom.com/logo.png",
        "description": "Complete business services in Erie, PA: notary (remote & mobile), loan signing, transaction coordination, apostille, I-9 verification, LLC formation, and registered office services.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Erie",
          "addressRegion": "PA",
          "addressCountry": "US"
        },
        "telephone": "814-480-0989",
        "email": "support@notroom.com",
        "priceRange": "$60-$399",
        "url": "https://notroom.com",
        "areaServed": [
          {
            "@type": "State",
            "name": "Pennsylvania"
          },
          {
            "@type": "City",
            "name": "Erie",
            "containedIn": {
              "@type": "State",
              "name": "Pennsylvania"
            }
          }
        ],
        "serviceType": [
          "Remote Online Notarization",
          "Mobile Notary Service",
          "Loan Signing Agent",
          "Transaction Coordination",
          "Apostille Services",
          "I-9 Employment Verification",
          "Business Formation",
          "Registered Office Provider"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is a Remote Online Notary (RON)?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Remote Online Notarization (RON) allows you to get documents notarized via a secure video call with a licensed notary, legally valid in all 50 states."
            }
          }
        ]
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Notroom | Notary, Business Filing & Compliance Services | Erie, PA"
        description="Complete business services in Erie, PA: Remote & mobile notary (from $60), loan signing ($175), transaction coordination ($299+), apostille services ($245+), I-9 verification ($85+), LLC formation ($149), and registered office ($149/yr). Licensed, bonded, PA-compliant."
        keywords="notary Erie PA, online notary, mobile notary, loan signing agent, apostille service, I-9 verification, LLC formation Pennsylvania, registered office PA, business filing Erie"
        canonical="https://notroom.com"
        schema={schema}
      />
      {/* Critical above-the-fold content - loaded immediately */}
      <Hero />
      
      <TrustBadges />
      
      {/* Below-the-fold content - lazy loaded for performance */}
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <ValueLadder />
      </Suspense>
      
      <Services />
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <BeforeAfter />
      </Suspense>
      
      {/* Lead Generation: Service Quiz */}
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <section className="py-16 bg-background" id="service-quiz" aria-labelledby="service-quiz-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 id="service-quiz-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Not Sure Which Service You Need?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Take our 60-second quiz to get a personalized recommendation
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <ServiceQuiz />
            </div>
          </div>
        </section>
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <ValueStack />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <ComparisonTable />
      </Suspense>
      
      {/* Lead Generation: Tripwire Offer */}
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <section className="py-16 bg-muted/30" aria-labelledby="special-offer-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <TripwireOffer />
            </div>
          </div>
        </section>
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <ProcessTimeline />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <AuthorityBuilder />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <WhyNotroom />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <RealTestimonials />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <GuaranteeSection />
      </Suspense>
      
      {/* Lead Generation: Lead Magnet */}
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <section className="py-16 bg-background" id="lead-magnet" aria-labelledby="lead-magnet-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <LeadMagnet />
            </div>
          </div>
        </section>
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <section className="py-16 bg-muted/30" aria-labelledby="pricing-calculator-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <PricingCalculator />
            </div>
          </div>
        </section>
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <FAQ />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <FinalCTA />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <BookingForm />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="card" className="container mx-auto my-8" />}>
        <ExitIntent />
      </Suspense>
    </Layout>
  );
};

export default Index;
