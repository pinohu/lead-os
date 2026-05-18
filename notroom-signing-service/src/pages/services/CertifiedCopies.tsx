import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, FileCheck, Shield, Clock, BadgeCheck, AlertCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";
import FAQSection from "@/components/marketing/FAQSection";
import TrustIndicators from "@/components/marketing/TrustIndicators";

const CertifiedCopies = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "Certified Copy Services Erie, PA",
    description: "Official certified copy services in Erie, PA. Birth certificates, diplomas, passports, legal documents. $20 per document. Same-day service available.",
    provider: "Notroom - PA Licensed Notary",
    areaServed: "Northwestern Pennsylvania",
    price: "20",
    url: "https://notroom.com/services/certified-copies"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Certified Copies", url: "https://notroom.com/services/certified-copies" }
  ]);

  const faqSchema = generateFAQSchema([
    {
      question: "What is a certified copy in Pennsylvania?",
      answer: "A certified copy is an official reproduction of an original document that a Pennsylvania notary public verifies as a true, complete, and accurate copy. The notary compares the copy to the original and certifies it with their seal and signature under 57 Pa. Code § 307.3."
    },
    {
      question: "Are certified copies legally valid in Pennsylvania?",
      answer: "Yes! Certified copies by a Pennsylvania notary are legally recognized by PA courts, government agencies, employers, schools, and institutions. They hold the same legal weight as the original document for most purposes."
    },
    {
      question: "What documents can Pennsylvania notaries certify?",
      answer: "PA notaries can certify copies of most documents EXCEPT vital records (birth/death certificates issued by government), public documents already recorded with the state, or documents that explicitly require original submission by law."
    },
    {
      question: "How much does a certified copy cost in Erie, PA?",
      answer: "Certified copies are $20 per document at our office, or $20 + travel fees for mobile service. This includes the PA notary fee ($5-15 per signature) plus our service fee for comparison, certification, and professional handling."
    },
    {
      question: "Can I get certified copies for immigration purposes?",
      answer: "Yes! Certified copies are commonly accepted for USCIS applications, green card renewals, citizenship applications, and visa petitions. We certify diplomas, transcripts, birth certificates, marriage certificates, and other supporting documents."
    },
    {
      question: "How long does it take to get a certified copy?",
      answer: "Most certified copies are completed while you wait at our office (5-10 minutes). For mobile service, we come to your location and complete certification on-site. Same-day appointments available throughout Erie County."
    },
    {
      question: "What's the difference between a certified copy and a notarized copy?",
      answer: "These terms are often used interchangeably. A certified copy means the notary has compared the copy to the original and certifies accuracy. A notarized copy is the same process—the notary's seal and signature certify the copy matches the original document."
    }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <Layout>
      <SEO
        title="Certified Copy Services Erie, PA | $20 per Document | Crawford, Warren, Mercer Counties"
        description="Official certified copy services Northwestern PA. Birth certificates, diplomas, passports, legal documents. $20 per document. Same-day service Erie, Meadville, Warren, Sharon."
        keywords="certified copies Erie PA, document certification Northwestern PA, notarized copies Crawford County, birth certificate copy Warren PA, diploma certification Erie, certified documents Mercer County"
        canonical="https://notroom.com/services/certified-copies"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <FileCheck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Certified Copy Services in Pennsylvania</h1>
            <p className="text-xl mb-8 opacity-90">
              Official certified copies of your important documents. Accepted for legal, immigration, educational, and business purposes throughout Pennsylvania.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Book Now - $20 per Document
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

      {/* PA Law Explanation */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Understanding Certified Copies in Pennsylvania</h2>
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">What Pennsylvania Law Says</h3>
                  <p className="text-muted-foreground mb-4">
                    Under 57 Pa. Code § 307.3, Pennsylvania notaries are authorized to certify copies of documents. This means the notary compares the copy to the original document and certifies that it's a true, complete, and accurate reproduction.
                  </p>
                  <div className="bg-primary/10 border-l-4 border-primary p-4">
                    <p className="text-sm">
                      <strong>Legal Citation:</strong> "A notarial officer may certify that a tangible copy of an electronic record is an accurate copy of the electronic record." - 57 Pa. Code § 307.3
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-2">Important Limitations</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pennsylvania notaries <strong>cannot certify</strong> copies of:
                      </p>
                      <ul className="text-sm space-y-2">
                        <li>• <strong>Vital records</strong> issued by government agencies (birth/death certificates) - only issuing agency can certify these</li>
                        <li>• <strong>Public records</strong> already recorded (court documents on file) - get certified copies from the recorder's office</li>
                        <li>• <strong>Recordable documents</strong> like deeds or mortgages that must be recorded</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Simple, Transparent Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 border-primary border-2">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Office Service</h3>
                  <div className="text-5xl font-bold text-primary mb-2">$20</div>
                  <p className="text-muted-foreground">Per certified document copy</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Official PA notary certification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Notary seal and signature</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Document comparison verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Completed while you wait (5-10 min)</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Book Office Appointment</Button>
              </Card>

              <Card className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Mobile Service</h3>
                  <div className="text-5xl font-bold text-primary mb-2">$20+</div>
                  <p className="text-muted-foreground">+ $1.50/mile travel from Erie</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">We come to your location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All office service features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Home, office, or facility visits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Same-day appointments available</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Book Mobile Service</Button>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-6">
              PA law limits notary fees to $5-15 per signature. Additional fees are for document handling, comparison verification, and administrative services.
            </p>
          </div>
        </div>
      </section>

      {/* Common Documents */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Documents We Commonly Certify</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <FileText className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Personal Documents</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Diplomas & degrees</li>
                  <li>• Academic transcripts</li>
                  <li>• Professional licenses</li>
                  <li>• Passports</li>
                  <li>• Driver's licenses</li>
                  <li>• Social Security cards</li>
                </ul>
              </Card>

              <Card className="p-6">
                <FileCheck className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Legal Documents</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Powers of attorney</li>
                  <li>• Living wills</li>
                  <li>• Trust documents</li>
                  <li>• Contracts</li>
                  <li>• Affidavits</li>
                  <li>• Legal correspondence</li>
                </ul>
              </Card>

              <Card className="p-6">
                <BadgeCheck className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Business Documents</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Articles of incorporation</li>
                  <li>• Business licenses</li>
                  <li>• Corporate bylaws</li>
                  <li>• Financial statements</li>
                  <li>• Tax documents</li>
                  <li>• Insurance policies</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Certification Process</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Bring Original + Copy</h3>
                    <p className="text-muted-foreground">
                      You must present the original document along with a photocopy. We cannot certify without seeing the original to compare against.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Document Comparison</h3>
                    <p className="text-muted-foreground">
                      Our PA-licensed notary carefully compares the photocopy to the original document, verifying that the copy is complete and accurate in every detail.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Certification & Seal</h3>
                    <p className="text-muted-foreground">
                      The notary adds a certification statement to the copy stating it's a true and accurate reproduction, then applies their official Pennsylvania notary seal and signature.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Original Returned</h3>
                    <p className="text-muted-foreground">
                      You receive the certified copy along with your original document. The certified copy is now legally valid for submission to institutions, agencies, or courts.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Mistakes to Avoid</h2>
            <Card className="p-8">
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">❌ Not Bringing the Original</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    We MUST see the original document to certify a copy. We cannot certify from another copy or from photos/scans.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">❌ Requesting Certification of Vital Records</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    PA notaries cannot certify government-issued birth or death certificates. You must obtain certified copies from the issuing agency (PA Vital Records, county office, etc.).
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">❌ Using Poor Quality Copies</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Bring a clear, complete photocopy. Faded, partial, or blurry copies may not be certifiable if we can't verify accuracy against the original.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">❌ Assuming All Institutions Accept Certified Copies</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Some agencies require original documents only. Check with the requesting institution before getting copies certified.
                  </p>
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
            question: "What is a certified copy in Pennsylvania?",
            answer: "A certified copy is an official reproduction of an original document that a Pennsylvania notary public verifies as a true, complete, and accurate copy. The notary compares the copy to the original and certifies it with their seal and signature under 57 Pa. Code § 307.3."
          },
          {
            question: "Are certified copies legally valid in Pennsylvania?",
            answer: "Yes! Certified copies by a Pennsylvania notary are legally recognized by PA courts, government agencies, employers, schools, and institutions. They hold the same legal weight as the original document for most purposes."
          },
          {
            question: "What documents can Pennsylvania notaries certify?",
            answer: "PA notaries can certify copies of most documents EXCEPT vital records (birth/death certificates issued by government), public documents already recorded with the state, or documents that explicitly require original submission by law."
          },
          {
            question: "How much does a certified copy cost in Erie PA?",
            answer: "Certified copies are $20 per document at our office, or $20 + travel fees for mobile service. This includes the PA notary fee ($5-15 per signature) plus our service fee for comparison, certification, and professional handling."
          },
          {
            question: "Can I get certified copies for immigration purposes?",
            answer: "Yes! Certified copies are commonly accepted for USCIS applications, green card renewals, citizenship applications, and visa petitions. We certify diplomas, transcripts, birth certificates, marriage certificates, and other supporting documents."
          },
          {
            question: "How long does it take to get a certified copy?",
            answer: "Most certified copies are completed while you wait at our office (5-10 minutes). For mobile service, we come to your location and complete certification on-site. Same-day appointments available throughout Erie County."
          },
          {
            question: "What's the difference between a certified copy and a notarized copy?",
            answer: "These terms are often used interchangeably. A certified copy means the notary has compared the copy to the original and certifies accuracy. A notarized copy is the same process—the notary's seal and signature certify the copy matches the original document."
          }
        ]}
      />

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Certified Copy Services"
        reviews={[
          { text: "Quick service for my birth certificate copy. Accepted by the court no problem.", author: "Karen M.", city: "Erie", rating: 5 },
          { text: "Needed certified diploma copies for my PA teaching license. Fast and affordable.", author: "Thomas R.", city: "Millcreek", rating: 5 },
          { text: "Professional notarized copies for immigration documents. Great service.", author: "Maria G.", city: "Harborcreek", rating: 5 },
          { text: "Same-day certified copies of my passport. Very convenient.", author: "John D.", city: "Fairview", rating: 5 }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need Certified Copies Today?</h2>
            <p className="text-xl mb-8 opacity-90">
              Get your documents certified quickly and professionally. Just $20 per document at our office, or we'll come to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={scrollToBooking} className="text-lg px-8">
                Book Appointment
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

export default CertifiedCopies;
