import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Eye, FileText, Shield, AlertCircle, UserCheck, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";

const WitnessService = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "Professional Witness Service Erie PA",
    description: "Impartial witness service for document signings in Erie PA. $60 base fee + travel. Alternative to notarization for documents not requiring notarial acts.",
    provider: "Notroom - Professional Witness",
    areaServed: "Erie County PA",
    price: "60",
    url: "https://notroom.com/services/witness-service"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Witness Service", url: "https://notroom.com/services/witness-service" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Professional Witness Service Erie PA | $60 + Travel | Northwestern PA"
        description="Impartial witness service Northwestern PA. $60 base fee + $1.50/mile travel. Alternative to notarization. Serving Erie, Crawford, Warren, Mercer Counties."
        keywords="witness service Erie PA, professional witness Northwestern PA, document witness Erie County, signing witness Crawford County, impartial witness Warren PA"
        canonical="https://notroom.com/services/witness-service"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <UserCheck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Witness Services</h1>
            <p className="text-xl mb-8 opacity-90">
              Neutral third-party witness for private agreements, contracts, and transactions that don't require notarization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Book Witness Service - $60 + Travel
              </Button>
              <Button size="lg" variant="amberOutline" onClick={() => navigate("/calculator")}>
                Calculate Your Cost
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 border-primary border-2">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <div className="text-5xl font-bold text-primary mb-2">$60</div>
                <p className="text-xl text-muted-foreground">Mobile service + $1.50/mile round-trip from Erie</p>
                <div className="mt-4 bg-muted/30 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm">Example: 15 miles from Erie</p>
                  <div className="text-xs space-y-1 mt-2">
                    <div className="flex justify-between"><span>Witness service:</span><span className="font-semibold">$60</span></div>
                    <div className="flex justify-between"><span>Travel (30 miles round-trip):</span><span className="font-semibold">$45</span></div>
                    <div className="flex justify-between border-t pt-1 mt-1"><span className="font-bold">Total:</span><span className="font-bold">$105</span></div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                    What We Provide:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Neutral third-party verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Professional witness signature</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Document date verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Mobile service at your location</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Common Uses:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Private contracts & agreements</li>
                    <li>• Business transactions</li>
                    <li>• Settlement agreements</li>
                    <li>• Memorandums of understanding</li>
                    <li>• Personal agreements</li>
                    <li>• Partnership agreements</li>
                    <li>• Service contracts</li>
                    <li>• Any document needing witness signature</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Important Notes:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• This service is for documents that don't require notarization</li>
                  <li>• We serve as an impartial witness to the signing</li>
                  <li>• If your document requires notarization, book our Mobile Notary service instead</li>
                  <li>• Mobile service: $1.50/mile round-trip from Erie</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Witness vs Notary */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Witness Service vs. Notarization</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-primary">Professional Witness Service ($60)</h3>
                <p className="text-muted-foreground mb-4">Best for:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Private agreements between parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Business contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Documents not requiring notarization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Lower cost option</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-primary">Mobile Notary Service ($125+)</h3>
                <p className="text-muted-foreground mb-4">Required for:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Legal documents (affidavits, deeds)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Powers of attorney</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Real estate transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Government forms</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Not sure which service you need? <a href="tel:814-480-0989" className="text-primary hover:underline font-semibold">Call us at (814) 480-0989</a> and we'll help you choose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Professional Witness Service"
        reviews={[
          { text: "Needed a witness for personal documents. Quick and professional service.", author: "Catherine R.", city: "Erie", rating: 5 },
          { text: "Great alternative when notary wasn't required. Fair pricing.", author: "Andrew M.", city: "Millcreek", rating: 5 },
          { text: "Professional witness for family documents. Very helpful service.", author: "Michelle K.", city: "Harborcreek", rating: 5 },
          { text: "Impartial witness for business agreement. Excellent experience.", author: "Robert T.", city: "Fairview", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "What is a professional witness service?",
            answer: "A professional witness service provides an impartial third-party to observe and witness the signing of documents. We verify the date, sign as a witness, and provide neutral verification that the signing occurred. This is different from notarization, which involves verifying identity and administering oaths."
          },
          {
            question: "When do I need a witness instead of a notary?",
            answer: "You need a witness (not notary) for private agreements, business contracts, personal documents, settlement agreements, and any documents that don't legally require notarization. If your document specifically states it needs to be 'notarized,' you need our Mobile Notary service instead."
          },
          {
            question: "How much does professional witness service cost?",
            answer: "Base fee is $60 within Erie city limits. Add $1.50 per mile round-trip from our Erie office (6238 Cobblestone Dr, Erie, PA 16509) for locations outside Erie. We provide transparent quotes before every appointment."
          },
          {
            question: "What's the difference between a witness and a notary in Pennsylvania?",
            answer: "A witness observes signing and signs as proof. A PA notary verifies signer identity, ensures understanding and willingness, maintains a journal, and applies an official seal. Notaries are state-commissioned and regulated under Pennsylvania law. Witnesses provide simpler verification without legal certification."
          },
          {
            question: "Can the same person be both a notary and a witness?",
            answer: "Yes, but for different purposes. If a document requires notarization, we provide notary service. If a document just needs witness signatures, we provide witness service. Some documents require both - we can provide both services during the same visit."
          },
          {
            question: "Do you travel for witness services like mobile notary?",
            answer: "Yes! We provide mobile witness service throughout Erie, Crawford, Warren, Mercer, and Venango counties. We come to your home, office, hospital, or any location. Same pricing as our mobile notary for travel: $60 base + mileage outside Erie."
          },
          {
            question: "What documents commonly need witness signatures?",
            answer: "Common documents include private contracts, business agreements, partnership agreements, settlement agreements, memorandums of understanding, service contracts, personal loans between family/friends, and various business transactions that don't require government filing or notarization."
          },
          {
            question: "Are you allowed to witness documents as a PA notary?",
            answer: "Yes. While Pennsylvania notaries are commissioned for notarial acts, they can also serve as regular witnesses for documents that don't require notarization. When providing witness service, we act as an impartial witness, not in our official notary capacity."
          },
          {
            question: "How fast can you provide witness service in Erie?",
            answer: "Same-day appointments are typically available throughout Erie County. Call (814) 480-0989 for urgent scheduling. Most appointments can be completed within 30-60 minutes from booking during business hours."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need a Professional Witness?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get a neutral third-party witness for your agreements. Mobile service available throughout Erie County.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8">
                Book Witness Service
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
                View All Services
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Questions? Call us at <a href="tel:814-480-0989" className="text-primary hover:underline">(814) 480-0989</a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WitnessService;
