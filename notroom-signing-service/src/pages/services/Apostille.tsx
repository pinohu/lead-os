import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileCheck, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import SocialProof from "@/components/marketing/SocialProof";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const Apostille = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const documents = [
    "Birth certificates", "Marriage certificates", "Death certificates",
    "Divorce decrees", "Adoption papers", "Court documents",
    "Power of attorney", "Business documents", "Educational diplomas",
    "Transcripts", "Corporate documents", "Affidavits"
  ];

  const countries = [
    "Canada", "Mexico", "United Kingdom", "Germany", "France", "Spain",
    "Italy", "China", "Japan", "Australia", "Brazil", "India"
  ];

  const serviceSchema = generateServiceSchema({
    name: "Apostille Services Pennsylvania",
    description: "Professional apostille assistance and document preparation in Pennsylvania. We notarize your documents and guide you through the PA Department of State apostille process for international use in Hague Convention countries.",
    provider: "Notroom - Pennsylvania Apostille Services",
    areaServed: "Pennsylvania",
    price: "245",
    url: "https://notroom.com/services/apostille"
  });

  const faqSchema = generateFAQSchema([
    {
      question: "How much does apostille service cost in Pennsylvania?",
      answer: "Our full apostille assistance service starts at $245, which includes notarization ($60), document preparation, PA Department of State apostille filing ($20 state fee), and expedited processing coordination. Rush service available for additional fees."
    },
    {
      question: "How long does apostille processing take in PA?",
      answer: "Standard PA Department of State apostille processing takes 7-10 business days. Expedited service (3-5 business days) and rush service (24-48 hours) are available. We handle all communication with the PA Department of State."
    },
    {
      question: "What documents can be apostilled in Pennsylvania?",
      answer: "Pennsylvania can apostille birth certificates, marriage certificates, death certificates, divorce decrees, diplomas, transcripts, corporate documents, powers of attorney, notarized affidavits, and court documents issued by PA authorities."
    },
    {
      question: "Which countries accept Pennsylvania apostilles?",
      answer: "Pennsylvania apostilles are accepted in all 100+ Hague Convention countries including Canada, Mexico, UK, Germany, France, Spain, Italy, China, Japan, Australia, Brazil, and India. We can verify acceptance for your destination country."
    }
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "Apostille Services", url: "https://notroom.com/services/apostille" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Apostille Services Pennsylvania | PA Department of State | Erie, Meadville, Warren | International Documents"
        description="PA apostille services - $245+. Birth certificates, marriage certificates, diplomas, corporate documents for international use. Fast processing through PA Dept of State. Serving Erie, Crawford, Warren counties. Licensed & bonded."
        keywords="apostille service pennsylvania, apostille erie pa, PA department of state apostille, document authentication pennsylvania, international notary pa, hague apostille pennsylvania, birth certificate apostille pa"
        canonical="https://notroom.com/services/apostille"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              International Documents
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Apostille Assistance & Document Preparation in Pennsylvania
            </h1>
            <p className="text-xl mb-8 opacity-90">
              We notarize your documents and assist with the apostille application process through the Pennsylvania Department of State.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Get Started - Book Apostille Service
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground opacity-90 hover:opacity-100"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* What is Apostille */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">What is an Apostille?</h2>
            <Card className="p-8">
              <div className="bg-primary/10 border-l-4 border-primary p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2 text-primary">Important Disclaimer</h3>
                    <p className="text-sm">
                      <strong>Please note:</strong> Notaries cannot issue apostilles in Pennsylvania. Only the Pennsylvania Department of State can authenticate documents with an apostille. We provide document notarization and assistance with the apostille application process.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-lg mb-4">
                An apostille is an official certification that authenticates the origin of a public document for use in another country. It's required under the Hague Convention for documents traveling between member countries.
              </p>
              <p className="text-muted-foreground mb-6">
                Think of it as an international seal of approval that verifies your document is legitimate and can be legally recognized abroad. Without an apostille, foreign governments and institutions may not accept your documents.
              </p>
              <div className="bg-muted/30 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">How We Help</h3>
                    <p className="text-sm text-muted-foreground">
                      The apostille process varies by document type and destination country. We notarize your documents (if needed), prepare your apostille application, and can submit it to the PA Department of State on your behalf.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Apostille Process</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Document Review & Notarization</h3>
                    <p className="text-muted-foreground">
                      We verify your documents are eligible for apostille and provide notarization if required ($5-15 per signature as allowed by PA law). Many documents must be notarized before they can receive an apostille.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Apostille Application Preparation</h3>
                    <p className="text-muted-foreground">
                      We prepare your complete apostille application package with all required documentation for submission to the PA Department of State.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Submission to PA Department of State</h3>
                    <p className="text-muted-foreground">
                      We submit your documents to the Pennsylvania Department of State for apostille certification. Typical processing: 2-3 weeks standard; expedited options available.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Delivery of Apostilled Documents</h3>
                    <p className="text-muted-foreground">
                      Once the PA Department of State issues the apostille, we return your authenticated documents via secure tracked shipping or local pickup in Erie.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Documents & Countries */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">Common Documents</h2>
                <div className="grid grid-cols-2 gap-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">Popular Destinations</h2>
                <div className="grid grid-cols-2 gap-3">
                  {countries.map((country, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{country}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  And 100+ other Hague Convention member countries
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Transparent Pricing</h2>
            <Card className="p-8">
              <div className="space-y-6">
                <div className="pb-4 border-b">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Standard Apostille Service</h3>
                      <p className="text-sm text-muted-foreground">Processing time: 7–10 business days</p>
                    </div>
                    <span className="text-2xl font-bold">$245</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PA Dept of State apostille fee:</span>
                      <span className="font-semibold">$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notarization (if required):</span>
                      <span className="font-semibold">$5-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (prep + submission + return):</span>
                      <span className="font-semibold">$215</span>
                    </div>
                  </div>
                </div>
                
                <div className="pb-4 border-b">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Expedited Apostille Service</h3>
                      <p className="text-sm text-muted-foreground">Processing time: 1–2 business days</p>
                    </div>
                    <span className="text-2xl font-bold">$395</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PA Dept of State apostille fee:</span>
                      <span className="font-semibold">$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notarization (if required):</span>
                      <span className="font-semibold">$5-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (expedited processing + courier):</span>
                      <span className="font-semibold">$365</span>
                    </div>
                  </div>
                </div>

                <div className="pb-4 border-b">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Full-Chain Authentication</h3>
                      <p className="text-sm text-muted-foreground">For non-Hague countries (PA → US Dept of State → Embassy)</p>
                    </div>
                    <span className="text-2xl font-bold">$495</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PA Dept of State certification:</span>
                      <span className="font-semibold">$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">US Dept of State authentication:</span>
                      <span className="font-semibold">$20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Embassy legalization (varies):</span>
                      <span className="font-semibold">$25-50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (complete chain coordination):</span>
                      <span className="font-semibold">$385</span>
                    </div>
                  </div>
                </div>

                <div className="pb-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">Translation + Notarization Add-on</h3>
                      <p className="text-sm text-muted-foreground">Certified translation with notarized affidavit</p>
                    </div>
                    <span className="text-xl font-bold">+$75</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">Courier Return (Overnight)</h3>
                      <p className="text-sm text-muted-foreground">FedEx overnight shipping to your address</p>
                    </div>
                    <span className="text-xl font-bold">+$45</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6 text-center border-t pt-4">
                All pricing includes government fees + service fees. No hidden charges. Processing times are typical turnaround from PA Department of State.
              </p>
            </Card>
          </div>
        </div>
      </section>


      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Apostille Services"
        reviews={[
          { text: "Got my birth certificate apostilled for Italian citizenship. Fast and professional service!", author: "Maria G.", city: "Erie", rating: 5 },
          { text: "Handled my diploma apostille for teaching abroad. They made the process so easy.", author: "Tom H.", city: "Fairview", rating: 5 },
          { text: "Needed apostille for business documents. They walked me through everything.", author: "Susan B.", city: "Meadville", rating: 5 },
          { text: "Rush service was worth it. Got my apostille in 3 days for my France visa.", author: "Chris P.", city: "Warren", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "What documents can be apostilled in Pennsylvania?",
            answer: "Common documents include birth certificates, marriage certificates, death certificates, divorce decrees, diplomas, transcripts, powers of attorney, corporate documents, court documents, and notarized affidavits. Most Pennsylvania public documents can receive an apostille."
          },
          {
            question: "How long does the apostille process take?",
            answer: "Standard processing takes 7-10 business days ($245). Expedited service takes 1-2 business days ($395). Full-chain authentication for non-Hague countries takes 3-6 weeks ($495). Processing times depend on PA Department of State workload."
          },
          {
            question: "Do all documents need to be notarized before apostille?",
            answer: "Many documents require notarization before they can receive an apostille. We'll review your documents and provide notarization if needed ($5-15 per signature) as part of our service. Pennsylvania-issued vital records typically don't need notarization."
          },
          {
            question: "Which countries accept Pennsylvania apostilles?",
            answer: "Apostilles are accepted by all Hague Convention member countries (100+ nations) including Canada, Mexico, UK, Germany, France, Spain, Italy, China, Japan, Australia, Brazil, and India. We can verify acceptance for your destination country."
          },
          {
            question: "How much does apostille service cost in PA?",
            answer: "Our complete service starts at $245 (standard 7-10 business days) which includes PA state apostille fee ($15), notarization if required ($5-15), document preparation, submission, and return shipping. Expedited service (1-2 days) is $395. Full-chain authentication for non-Hague countries is $495."
          },
          {
            question: "Can you apostille documents from other states in Pennsylvania?",
            answer: "No. Each state can only apostille documents issued by that state. Pennsylvania can only apostille PA-issued documents, notarizations by PA notaries, or federal documents. Documents from other states must be apostilled by that state's Secretary of State office."
          },
          {
            question: "What's the difference between apostille and authentication?",
            answer: "Apostilles are for Hague Convention countries (100+ nations) - single-step process through PA Department of State. Authentication (also called legalization) is for non-Hague countries - multi-step process through PA Dept of State, US Dept of State, and then the foreign embassy. We handle both processes."
          },
          {
            question: "Do you handle the entire apostille process or do I need to mail documents to Harrisburg?",
            answer: "We handle everything! You just provide your documents to us. We notarize if needed, prepare the application, submit to PA Department of State in Harrisburg, track the process, and return your apostilled documents via secure shipping or local pickup. No need for you to mail anything to Harrisburg."
          },
          {
            question: "Can apostilled documents be used multiple times in different countries?",
            answer: "Each apostille is typically valid only in the country where you plan to use it, even though it's recognized by all Hague Convention countries. Many countries require original apostilled documents, not copies. If you need documents for multiple countries, you may need multiple apostilles on multiple original documents."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Apostille Service</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Let us handle the complex apostille process for you. Fast, reliable, and stress-free international document authentication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Start Apostille Process
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground opacity-90 hover:opacity-100"
              onClick={() => window.location.href = "tel:814-480-0989"}
            >
              Call (814) 480-0989
            </Button>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <LegalDisclaimer variant="compact" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Apostille;
