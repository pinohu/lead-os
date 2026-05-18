import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, FileSearch, Shield, Clock, MapPin, FileText, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";
import FAQSection from "@/components/marketing/FAQSection";
import TrustIndicators from "@/components/marketing/TrustIndicators";

const DocumentRetrieval = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "Document Retrieval Services Pennsylvania",
    description: "Professional document retrieval from courthouses, vital records, government offices in Pennsylvania. Fast turnaround. From $75 + fees.",
    provider: "Notroom - Professional Document Retrieval",
    areaServed: "Northwestern Pennsylvania",
    price: "75",
    url: "https://notroom.com/services/document-retrieval"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Document Retrieval", url: "https://notroom.com/services/document-retrieval" }
  ]);

  const faqSchema = generateFAQSchema([
    {
      question: "What is document retrieval service?",
      answer: "Document retrieval is a professional service where we obtain certified copies of documents from courthouses, vital records offices, and government agencies on your behalf. Instead of traveling yourself, waiting in line, and navigating bureaucracy, we handle everything for you."
    },
    {
      question: "How much does document retrieval cost in Pennsylvania?",
      answer: "Our base retrieval fee is $75 per request, plus government filing fees (varies by document type and office). For example: birth certificate from PA Vital Records costs $75 service fee + $24 state fee = $99 total. We provide exact quotes before starting."
    },
    {
      question: "How long does document retrieval take?",
      answer: "Standard retrieval takes 3-7 business days depending on the office and document type. Rush service (1-2 business days) is available for an additional fee. Vital records typically take 5-10 business days, while court documents may be available same-day."
    },
    {
      question: "What documents can you retrieve in Pennsylvania?",
      answer: "We retrieve court records, vital records (birth/death/marriage certificates), property deeds, UCC filings, corporate documents, divorce decrees, criminal records, land records, and more from PA county courthouses and state offices."
    },
    {
      question: "Do I need to provide authorization for document retrieval?",
      answer: "For most public records, no authorization is needed. For restricted documents (like your own birth certificate or sealed court records), we'll need your signed authorization and ID. We'll guide you through the exact requirements."
    },
    {
      question: "Which Pennsylvania counties do you serve?",
      answer: "We primarily serve Northwestern PA including Erie, Crawford, Warren, Mercer, and Venango counties. We can also retrieve documents from any PA county courthouse or the PA Department of State in Harrisburg through our network."
    },
    {
      question: "Can you retrieve documents from out-of-state?",
      answer: "Yes! While our primary service area is Pennsylvania, we have partnerships with retrieval services in other states and can coordinate out-of-state document retrieval. Additional fees and extended timelines apply."
    }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <Layout>
      <SEO
        title="Document Retrieval Services PA | $75+ | Erie, Crawford, Warren, Mercer Counties"
        description="Professional document retrieval Northwestern PA courthouses, vital records, government offices. Court documents, birth certificates, property deeds. Fast turnaround. From $75 + fees."
        keywords="document retrieval Pennsylvania, court document retrieval Erie PA, vital records retrieval Crawford County, certified copies retrieval Warren PA, courthouse document retrieval Northwestern PA"
        canonical="https://notroom.com/services/document-retrieval"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <FileSearch className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Document Retrieval Services</h1>
            <p className="text-xl mb-8 opacity-90">
              Save time and hassle. We'll retrieve certified copies and documents from courthouses, vital records offices, and government agencies throughout Pennsylvania.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Request Retrieval - From $75
              </Button>
              <Button size="lg" variant="amberOutline" onClick={() => navigate("/calculator")}>
                Calculate Your Cost
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* What We Retrieve */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Documents We Retrieve</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Building className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Court Documents</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Civil case records</li>
                  <li>• Criminal records</li>
                  <li>• Divorce decrees</li>
                  <li>• Judgments & liens</li>
                  <li>• Probate records</li>
                  <li>• Court orders</li>
                </ul>
              </Card>

              <Card className="p-6">
                <FileText className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Vital Records</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Birth certificates</li>
                  <li>• Death certificates</li>
                  <li>• Marriage licenses</li>
                  <li>• Divorce records</li>
                  <li>• Name change orders</li>
                  <li>• Adoption records</li>
                </ul>
              </Card>

              <Card className="p-6">
                <MapPin className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Property & Business</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Property deeds</li>
                  <li>• UCC filings</li>
                  <li>• Corporate documents</li>
                  <li>• Tax records</li>
                  <li>• Business licenses</li>
                  <li>• Assumed name certificates</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Transparent Pricing</h2>
            <Card className="p-8 border-primary border-2">
              <div className="space-y-6">
                <div className="text-center pb-6 border-b">
                  <div className="text-5xl font-bold text-primary mb-2">$75+</div>
                  <p className="text-xl text-muted-foreground">Base service fee + government fees</p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4">Pricing Examples:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div>
                        <p className="font-semibold">Birth Certificate (PA Vital Records)</p>
                        <p className="text-sm text-muted-foreground">Our fee $75 + State fee $24</p>
                      </div>
                      <span className="text-xl font-bold">$99</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div>
                        <p className="font-semibold">Court Document (Erie County)</p>
                        <p className="text-sm text-muted-foreground">Our fee $75 + Court fee $5-20</p>
                      </div>
                      <span className="text-xl font-bold">$80-95</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div>
                        <p className="font-semibold">Property Deed (County Recorder)</p>
                        <p className="text-sm text-muted-foreground">Our fee $75 + Recording fee $10-15</p>
                      </div>
                      <span className="text-xl font-bold">$85-90</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div>
                        <p className="font-semibold">Rush Service (1-2 days)</p>
                        <p className="text-sm text-muted-foreground">Additional expedite fee</p>
                      </div>
                      <span className="text-xl font-bold">+$50</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>What's Included:</strong> Research, travel to courthouse/office, waiting in line, obtaining certified copies, payment of government fees, secure document handling, and delivery to you via mail or email scan.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How Document Retrieval Works</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Request & Quote</h3>
                    <p className="text-muted-foreground">
                      Tell us what document you need and from which office. We'll provide a detailed quote including our service fee and estimated government fees.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Authorization (if needed)</h3>
                    <p className="text-muted-foreground">
                      For personal records, we'll send you a simple authorization form to sign. This allows us to request your documents on your behalf.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">We Handle Everything</h3>
                    <p className="text-muted-foreground">
                      We visit the courthouse, vital records office, or government agency in person. We navigate the process, wait in line, pay fees, and obtain certified copies.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Delivery to You</h3>
                    <p className="text-muted-foreground">
                      We deliver your certified documents via USPS Priority Mail (2-3 days), email scan (same day), or local pickup. You choose your preferred delivery method.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who Uses This */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Who Uses Document Retrieval Services?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">Legal Professionals</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Attorneys, paralegals, and law firms use our service to obtain court records, property deeds, and vital records for cases without sending staff to courthouses.
                </p>
                <p className="text-xs text-muted-foreground">
                  Typical request: Court dockets, divorce decrees, criminal records
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">Title Companies</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Real estate professionals need property deeds, lien searches, and chain of title documents quickly for closings.
                </p>
                <p className="text-xs text-muted-foreground">
                  Typical request: Property deeds, mortgages, UCC filings
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">Individuals</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  People who need their own vital records for passport applications, immigration, genealogy, or legal matters but can't travel to offices.
                </p>
                <p className="text-xs text-muted-foreground">
                  Typical request: Birth certificates, marriage licenses, death certificates
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">Businesses</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Companies conducting due diligence, background checks, or verifying credentials need official documents from government sources.
                </p>
                <p className="text-xs text-muted-foreground">
                  Typical request: Corporate filings, business licenses, court judgments
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Counties Served */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Service Areas</h2>
            <Card className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-4">Primary Service Counties:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Erie County</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Crawford County</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Warren County</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Mercer County</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Venango County</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-4">Statewide Retrieval:</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We can retrieve documents from any Pennsylvania county courthouse or state office including:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• PA Department of State (Harrisburg)</li>
                    <li>• PA Vital Records</li>
                    <li>• Any PA county prothonotary</li>
                    <li>• Any PA county recorder of deeds</li>
                    <li>• PA court system (AOPC)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "What is document retrieval service?",
            answer: "Document retrieval is a professional service where we obtain certified copies of documents from courthouses, vital records offices, and government agencies on your behalf. Instead of traveling yourself, waiting in line, and navigating bureaucracy, we handle everything for you."
          },
          {
            question: "How much does document retrieval cost in Pennsylvania?",
            answer: "Our base retrieval fee is $75 per request, plus government filing fees (varies by document type and office). For example: birth certificate from PA Vital Records costs $75 service fee + $24 state fee = $99 total. We provide exact quotes before starting."
          },
          {
            question: "How long does document retrieval take?",
            answer: "Standard retrieval takes 3-7 business days depending on the office and document type. Rush service (1-2 business days) is available for an additional fee. Vital records typically take 5-10 business days, while court documents may be available same-day."
          },
          {
            question: "What documents can you retrieve in Pennsylvania?",
            answer: "We retrieve court records, vital records (birth/death/marriage certificates), property deeds, UCC filings, corporate documents, divorce decrees, criminal records, land records, and more from PA county courthouses and state offices."
          },
          {
            question: "Do I need to provide authorization for document retrieval?",
            answer: "For most public records, no authorization is needed. For restricted documents (like your own birth certificate or sealed court records), we'll need your signed authorization and ID. We'll guide you through the exact requirements."
          },
          {
            question: "Which Pennsylvania counties do you serve?",
            answer: "We primarily serve Northwestern PA including Erie, Crawford, Warren, Mercer, and Venango counties. We can also retrieve documents from any PA county courthouse or the PA Department of State in Harrisburg through our network."
          },
          {
            question: "Can you retrieve documents from out-of-state?",
            answer: "Yes! While our primary service area is Pennsylvania, we have partnerships with retrieval services in other states and can coordinate out-of-state document retrieval. Additional fees and extended timelines apply."
          }
        ]}
      />

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Document Retrieval Services"
        reviews={[
          { text: "Retrieved court documents from Erie County courthouse quickly. Saved me a trip.", author: "Attorney Sarah B.", city: "Erie", rating: 5 },
          { text: "Fast retrieval of property deeds for title work. Professional service.", author: "Mark T.", city: "Meadville", rating: 5 },
          { text: "Got my birth certificate from vital records office without hassle.", author: "Lisa M.", city: "Warren", rating: 5 },
          { text: "Excellent service for retrieving estate documents. Highly recommend.", author: "Robert K.", city: "Sharon", rating: 5 }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need Documents Retrieved?</h2>
            <p className="text-xl mb-8 opacity-90">
              Save time and hassle. We'll handle the retrieval process for you. Fast, professional, and reliable document retrieval throughout Pennsylvania.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={scrollToBooking} className="text-lg px-8">
                Request Service
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground opacity-90 hover:opacity-100" onClick={() => window.location.href = "tel:814-480-0989"}>
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DocumentRetrieval;
