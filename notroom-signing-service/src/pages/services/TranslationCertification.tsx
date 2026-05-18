import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Languages, Shield, FileCheck, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import FAQSection from "@/components/marketing/FAQSection";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";

const TranslationCertification = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "Translation Certification Services PA",
    description: "Notarized certification of translated documents for USCIS, courts, and official use. From $35 per page. Serving Northwestern Pennsylvania.",
    provider: "Notroom - Translation Certification",
    areaServed: "Pennsylvania",
    price: "35",
    url: "https://notroom.com/services/translation-certification"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Translation Certification", url: "https://notroom.com/services/translation-certification" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Translation Certification Services | From $35/page | Erie, PA"
        description="Professional translation certification in Erie, PA. Notarized translations for immigration, legal, business documents. From $35 per page."
        keywords="translation certification Erie PA, notarized translation, certified translation, document translation"
        canonical="https://notroom.com/services/translation-certification"
      />

      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <Languages className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Translation Certification Services</h1>
            <p className="text-xl mb-8 opacity-90">
              Professional certification of translated documents for immigration, legal proceedings, and business purposes.
            </p>
            <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
              Get Started - From $35/page
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 border-primary border-2">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
                <div className="text-5xl font-bold text-primary mb-2">$35+</div>
                <p className="text-xl text-muted-foreground">Per page certified</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Our Services:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Notarized certification of translations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Certified translator network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Accepted by USCIS & courts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Quick turnaround times</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Common Documents:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Birth certificates</li>
                    <li>• Marriage certificates</li>
                    <li>• Diplomas & transcripts</li>
                    <li>• Legal documents</li>
                    <li>• Immigration papers</li>
                    <li>• Business contracts</li>
                    <li>• Medical records</li>
                    <li>• Court documents</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Translation certification includes our notary certification that the translated document is accurate. 
                  We work with certified translators for major languages including Spanish, Arabic, Chinese, and more.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* What is Certified Translation */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">What is a Certified Translation?</h2>
            <Card className="p-8">
              <p className="text-lg mb-4">A certified translation includes a signed statement by the translator certifying that the translation is accurate and complete. This certification is required by USCIS, courts, and many institutions for official use of foreign language documents.</p>
              <p className="text-muted-foreground mb-6">Our service connects you with professional translators who provide certified translations, which we then notarize to add an extra layer of authentication for Pennsylvania use.</p>
              <div className="bg-primary/10 p-6 rounded-lg">
                <h3 className="font-bold mb-3">Two-Step Process:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>1. Professional Translation:</strong> Certified translator creates accurate translation with certification statement.</p>
                  <p><strong>2. Notarization:</strong> We notarize the translator's certification signature for additional authenticity.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Translation Certification Process</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Submit Document</h3>
                    <p className="text-muted-foreground">Send us your document for translation quote. We'll assess language pair, document complexity, and provide timeline and pricing.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Professional Translation</h3>
                    <p className="text-muted-foreground">Certified translator (native speaker with credentials) translates your document and prepares certification statement affirming accuracy.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Notarization</h3>
                    <p className="text-muted-foreground">We notarize the translator's certification signature, adding Pennsylvania notary seal and signature to authenticate the certification.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Delivery</h3>
                    <p className="text-muted-foreground">Receive original document, certified translation, and notarized certification statement - ready for submission to USCIS, courts, or institutions.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Supported Languages</h2>
            <p className="text-center text-muted-foreground mb-8">We work with certified translators for major world languages including:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['Spanish', 'Arabic', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Russian', 'French', 'Portuguese', 'German', 'Italian', 'Japanese', 'Korean', 'Vietnamese', 'Polish', 'Tagalog', 'Hindi', 'Urdu'].map((lang, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                  <Languages className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{lang}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">Need a different language? Contact us - we can source translators for most languages.</p>
          </div>
        </div>
      </section>

      {/* USCIS Requirements */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">USCIS Translation Requirements</h2>
            <Card className="p-8">
              <p className="text-muted-foreground mb-6">USCIS has specific requirements for certified translations of immigration documents:</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <strong>Certification Required:</strong> Translator must certify competence in both languages and translation accuracy.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <strong>Complete Translation:</strong> Entire document must be translated, including stamps, seals, and handwritten notes.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <strong>Original Included:</strong> Always submit both original foreign document and certified English translation.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <strong>Professional Standards:</strong> Translator cannot be family member or party to petition.
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">Our certified translations meet all USCIS requirements and are accepted for I-485, N-400, I-130, and other immigration applications.</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Local SEO */}
      <ServiceLocalSEO 
        serviceName="Translation Certification"
        reviews={[
          { text: "Excellent certified translation for my USCIS application. Accepted without issues.", author: "Ahmed H.", city: "Erie", rating: 5 },
          { text: "Professional Spanish translation of birth certificates. Fast and accurate.", author: "Maria S.", city: "Meadville", rating: 5 },
          { text: "They handled Arabic translation and notarization perfectly.", author: "Omar K.", city: "Warren", rating: 5 },
          { text: "Great service for immigration document translation. USCIS accepted it.", author: "Yuki M.", city: "Harborcreek", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "What's the difference between notarized and certified translation?",
            answer: "A certified translation includes the translator's signed certification of accuracy. Notarization is an additional step where we notarize the translator's signature to authenticate their certification. For USCIS, certified translation is required; notarization is optional but adds credibility."
          },
          {
            question: "Can you translate my birth certificate for USCIS?",
            answer: "Yes! Birth certificate translation is one of our most common services. We work with certified translators who provide USCIS-compliant translations with proper certification statements. Turnaround is typically 3-5 business days."
          },
          {
            question: "How much does certified translation cost?",
            answer: "Pricing starts at $35 per page for standard documents. Final cost depends on language pair, document complexity, urgency, and length. Complex legal or medical documents may be higher. Contact us for a specific quote."
          },
          {
            question: "How long does translation certification take?",
            answer: "Standard turnaround is 3-5 business days for most documents. Rush service (24-48 hours) is available for urgent needs. Timeline depends on document length, language pair, and translator availability."
          },
          {
            question: "Will USCIS accept your certified translations?",
            answer: "Yes! Our translations meet all USCIS requirements: professional translator certification, complete translation of all content, and proper formatting. We follow USCIS guidelines for certified translations submitted with immigration applications."
          },
          {
            question: "Can I translate my own documents for USCIS?",
            answer: "USCIS allows self-translation IF you are competent in both languages and can certify accuracy. However, professional certified translation is strongly recommended and may be required by some immigration officers or for complex documents."
          },
          {
            question: "Do you translate legal documents for Pennsylvania courts?",
            answer: "Yes, we coordinate certified translation of legal documents including foreign court orders, judgments, contracts, and powers of attorney. Our certified translations are accepted by Pennsylvania courts and government agencies."
          }
        ]}
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need a Certified Translation?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get your documents professionally translated and certified. Accepted by USCIS, courts, and institutions.
            </p>
            <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8">
              Request Quote
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TranslationCertification;
