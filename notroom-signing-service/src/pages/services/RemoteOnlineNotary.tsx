import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Video, Clock, Shield, Globe, FileCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import SocialProof from "@/components/marketing/SocialProof";
import GuaranteeSection from "@/components/marketing/GuaranteeSection";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const RemoteOnlineNotary = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const features = [
    "Complete notarization in 5 minutes",
    "Available by appointment, including evenings & weekends",
    "Legally valid in all 50 states",
    "Bank-level encryption & security",
    "Digital certificate included",
    "Record stored securely for 10 years (PA law requirement)"
  ];

  const requirements = [
    "Must be physically located in Pennsylvania during session",
    "Valid government-issued photo ID required",
    "Knowledge-Based Authentication (KBA) verification",
    "Stable internet connection with camera and microphone"
  ];

  const documents = [
    "Real estate documents",
    "Powers of attorney",
    "Affidavits & sworn statements",
    "Business contracts",
    "Healthcare directives",
    "Loan documents"
  ];

  const serviceSchema = generateServiceSchema({
    name: "Remote Online Notary (RON) Service",
    description: "Remote online notarization service available 24/7 in Pennsylvania. Get documents notarized via secure video call from anywhere in Erie, Crawford, Warren, Mercer, or Venango counties.",
    provider: "Notroom - Erie, PA Notary Services",
    areaServed: "Pennsylvania",
    price: "60",
    url: "https://notroom.com/services/remote-online-notary"
  });

  const faqSchema = generateFAQSchema([
    {
      question: "Is remote online notarization legally valid in Pennsylvania?",
      answer: "Yes! RON notarizations are legally recognized in all 50 states and comply with Pennsylvania Act 79 of 2020 (RULONA). Your notarized documents will be accepted nationwide by courts, government agencies, and financial institutions."
    },
    {
      question: "What do I need for a RON session in Pennsylvania?",
      answer: "You'll need: 1) A valid government-issued photo ID, 2) A device with camera and microphone, 3) Stable internet connection, 4) To be physically located in Pennsylvania during the session. We use knowledge-based authentication (KBA) as required by PA law."
    },
    {
      question: "How long does a remote online notary session take?",
      answer: "Most RON sessions are completed in 5-10 minutes. We handle identity verification, document review, and notarization efficiently while maintaining accuracy and legal compliance with Pennsylvania regulations."
    },
    {
      question: "Can I use RON for real estate documents in Pennsylvania?",
      answer: "Yes! Pennsylvania allows RON for most real estate documents including deeds, mortgages, and powers of attorney. RON notarizations are accepted by all Pennsylvania county recorder offices and title companies."
    },
    {
      question: "How much does remote online notarization cost in PA?",
      answer: "Standard RON service is $60 total ($5 PA notary fee + $55 technology/platform fee). Real estate documents are $95. We offer business subscriptions at $399/month for 10 sessions ($39.90 per act)."
    }
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "Remote Online Notary", url: "https://notroom.com/services/remote-online-notary" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Remote Online Notary PA | RON Service Erie, Meadville, Warren | 24/7 Online Notarization"
        description="Pennsylvania Remote Online Notary (RON) - $60. Available 24/7 by appointment in Erie, Crawford, Warren, Mercer, Venango counties. PA Act 79 compliant. Licensed notaries. Secure video notarization in 5 minutes. Book now!"
        keywords="remote online notary pennsylvania, RON service PA, online notarization erie pa, virtual notary meadville, RON warren pa, 24/7 notary pennsylvania, remote notarization crawford county, online notary venango county, PA RON service"
        canonical="https://notroom.com/services/remote-online-notary"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              PA Department of State Registered
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Remote Online Notary (RON) Service
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Get your documents notarized from anywhere in Pennsylvania. Secure, fast, and legally binding video notarization available by appointment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Book RON Session - $60
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground opacity-90 hover:opacity-100"
                onClick={() => navigate("/resources/how-ron-works")}
              >
                How RON Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators + Urgency */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Remote Online Notarization?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Save Time</h3>
                <p className="text-muted-foreground">
                  Complete notarization in as little as 5 minutes. No travel, no waiting rooms, no scheduling conflicts.
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Maximum Security</h3>
                <p className="text-muted-foreground">
                  Bank-level 256-bit encryption, multi-factor authentication, and secure document storage for 10 years.
                </p>
              </Card>
              <Card className="p-6">
                <Globe className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Legally Valid</h3>
                <p className="text-muted-foreground">
                  RON notarizations are legally recognized in all 50 states and comply with Pennsylvania state law.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Upload Your Document</h3>
                  <p className="text-muted-foreground">
                    After booking, securely upload your document to our encrypted platform. We accept PDF, Word, and most common file formats.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Verify Your Identity</h3>
                  <p className="text-muted-foreground">
                    Present a valid government-issued photo ID during the video call. Our system performs knowledge-based authentication (KBA) as required by PA law.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Meet with Licensed Notary</h3>
                  <p className="text-muted-foreground">
                    Connect via secure video call with a Pennsylvania-licensed notary public. The entire session is recorded and stored as required by law.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Receive Notarized Document</h3>
                  <p className="text-muted-foreground">
                    Your notarized document with digital certificate is emailed to you immediately. Original is stored securely for 10 years.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PA Authorization Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="p-8 bg-muted/30">
              <h2 className="text-3xl font-bold mb-6 text-center">Pennsylvania RON Authorization</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-lg">Registered & Compliant</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Registered with PA Department of State for Remote Online Notarization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Using state-approved RON technology platform</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">All sessions recorded and stored for 10 years (PA law requirement)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Compliant with Act 79 of 2020 (RULONA)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-4 text-lg">Session Requirements</h3>
                  <ul className="space-y-3">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">What's Included</h2>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">Service Pricing</h2>
                <Card className="p-6 bg-primary/5">
                  <div className="space-y-4">
                    <div className="pb-3 border-b">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">Standard Documents</h3>
                          <p className="text-xs text-muted-foreground">Powers of attorney, affidavits, contracts</p>
                        </div>
                        <span className="text-2xl font-bold">$60</span>
                      </div>
                      <div className="text-xs bg-background/50 p-2 rounded space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PA notary fee (legal max):</span>
                          <span>$5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Technology platform fee:</span>
                          <span>$55</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">Complex Documents</h3>
                          <p className="text-xs text-muted-foreground">Estate planning, real estate, business contracts</p>
                        </div>
                        <span className="text-2xl font-bold">$125</span>
                      </div>
                      <div className="text-xs bg-background/50 p-2 rounded space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PA notary fee:</span>
                          <span>$15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RON platform + document review:</span>
                          <span>$110</span>
                        </div>
                      </div>
                    </div>
                  </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      * Pennsylvania law limits notary fees to $5 per notarial act. All other fees are for technology platform (secure video infrastructure, KBA identity verification systems, tamper-evident digital certificates, 10-year session recording storage as required by PA law).
                    </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Offer */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4">Business Subscription Available</Badge>
            <h2 className="text-3xl font-bold mb-4">Need Regular Notarizations?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Business subscription: $399/month for 10 notarization sessions ($39.90 per act). Perfect for attorneys, real estate agents, and businesses with recurring needs.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/subscriptions")}
            >
              View Subscription Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Local SEO Section */}
      <ServiceLocalSEO serviceName="Remote Online Notary (RON)" />

      {/* Professional Commitments */}
      <GuaranteeSection />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "Is remote online notarization legally valid?",
            answer: "Yes! RON notarizations are legally recognized in all 50 states and comply with Pennsylvania Act 79 of 2020 (RULONA). Your notarized documents will be accepted nationwide."
          },
          {
            question: "What do I need for a RON session?",
            answer: "You'll need: 1) A valid government-issued photo ID, 2) A device with camera and microphone, 3) Stable internet connection, 4) To be physically located in Pennsylvania during the session."
          },
          {
            question: "How long does a RON session take?",
            answer: "Most sessions are completed in 5-10 minutes. We handle everything efficiently while maintaining accuracy and legal compliance."
          },
          {
            question: "Are there documents that cannot be notarized via RON in PA?",
            answer: "Most documents can be notarized remotely. However, wills and testamentary trusts cannot be notarized via RON in Pennsylvania. Some institutions may not accept RON for specific forms—check first."
          },
          {
            question: "Can I notarize multiple documents in one session?",
            answer: "Yes! You can notarize multiple documents during a single session for $60 total. Each document is notarized during the same video session."
          },
          {
            question: "Do you offer subscription plans for frequent RON users?",
            answer: "Absolutely! We have a business subscription at $399/month for 10 notarization sessions ($39.90 per act). Perfect for attorneys, real estate professionals, and businesses with recurring needs."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Remote Online Notary Session</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Schedule your remote online notary session now. Available by appointment with instant confirmation.
          </p>
          <Button 
            size="lg" 
            onClick={scrollToBooking}
            variant="secondary"
          >
            Book RON Session - From $35
          </Button>
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

export default RemoteOnlineNotary;
