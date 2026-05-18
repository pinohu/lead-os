import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Video, MapPin, Building2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import SocialProof from "@/components/marketing/SocialProof";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const I9Verification = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    if (window.location.pathname === "/") {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#booking-form");
    }
  };

  const remoteFeatures = [
    "DHS-compliant alternative procedure for E-Verify employers",
    "Video-based identity document verification",
    "Same-day or next-day availability",
    "Volume discounts for multiple hires",
    "Secure digital recordkeeping",
    "Completion within 15 minutes per employee"
  ];

  const mobileFeatures = [
    "In-person verification as authorized representative",
    "Onsite service at your location (Erie & surrounding counties)",
    "Multi-employee sessions available",
    "Same-day appointments",
    "Review Section 2 with employer after verification",
    "Professional documentation handling"
  ];

  const whoNeedsThis = [
    { type: "Staffing Agencies", desc: "High-volume hiring with recurring verification needs" },
    { type: "Seasonal Employers", desc: "Restaurant, retail, hospitality hiring surges" },
    { type: "Small Businesses", desc: "New hires needing compliant I-9 completion" },
    { type: "Remote Companies", desc: "E-Verify employers hiring PA-based employees" },
    { type: "Healthcare Facilities", desc: "Nursing homes, hospitals with frequent onboarding" },
    { type: "Construction Firms", desc: "Project-based hiring requiring immediate compliance" }
  ];

  const faqs = [
    {
      question: "What is I-9 verification and why do I need it?",
      answer: "Form I-9 is required by federal law for all US employers to verify each employee's identity and work authorization. We act as your authorized representative to complete Section 2 of the I-9 form."
    },
    {
      question: "What's the difference between remote and in-person I-9 verification?",
      answer: "In-person I-9 ($85) is available for all employers and done at your location. Remote I-9 ($125) uses video calls and is only available for E-Verify employers using the DHS alternative procedure, with added technology costs."
    },
    {
      question: "How quickly can you complete I-9 verification?",
      answer: "Most verifications are completed within 15 minutes per employee. Same-day and next-day appointments are available for both remote and mobile services."
    },
    {
      question: "Do you offer volume discounts for multiple employees?",
      answer: "Yes! Volume discounts are available starting at 5 employees per month for remote verification, and for multiple employees during the same mobile visit."
    },
    {
      question: "Is this service compliant with DHS requirements?",
      answer: "Absolutely. We follow all Department of Homeland Security guidelines for I-9 verification. Note: This is NOT a notarization service—it's performed as an authorized representative per DHS rules."
    },
    {
      question: "Can I-9 forms be notarized instead of using an authorized representative?",
      answer: "No. USCIS explicitly prohibits notarizing Form I-9. Federal regulations require I-9 Section 2 completion by the employer or an authorized representative—never a notary acting in their notarial capacity. Our service complies with USCIS guidelines as an authorized representative only."
    },
    {
      question: "What documents do employees need for I-9 verification?",
      answer: "Employees must present original documents from the USCIS I-9 acceptable documents list: List A (passport, permanent resident card) OR combination of List B (driver's license, state ID) + List C (Social Security card, birth certificate). We verify originals only—no copies or expired documents."
    },
    {
      question: "How long must employers retain completed I-9 forms?",
      answer: "Federal law requires employers to retain I-9 forms for 3 years after the date of hire OR 1 year after employment ends, whichever is later. Employers must produce I-9 forms within 3 business days of an ICE inspection request. We provide secure digital copies for your records."
    }
  ];

  const serviceSchema = generateServiceSchema({
    name: "I-9 Employment Verification Service",
    description: "Professional I-9 employment verification for Pennsylvania businesses. Remote I-9 via video and in-person verification throughout Erie, Crawford, Warren counties. USCIS compliant Section 2 completion.",
    provider: "Notroom - PA I-9 Verification",
    areaServed: "Pennsylvania",
    price: "85",
    url: "https://notroom.com/services/i9-verification"
  });

  const faqSchemaData = generateFAQSchema(faqs.map(f => ({ question: f.question, answer: f.answer })));

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "I-9 Verification", url: "https://notroom.com/services/i9-verification" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchemaData, breadcrumbSchema]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Complete I-9 Employment Verification",
    "description": "Step-by-step guide to completing I-9 verification through Notroom",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Employer Books Service",
        "text": "Schedule remote or mobile I-9 verification. Provide employee details and preferred date/time."
      },
      {
        "@type": "HowToStep",
        "name": "Employee Session",
        "text": "Remote: Employee joins secure video call with valid ID documents. Mobile: We meet employee at your location to review documents in person."
      },
      {
        "@type": "HowToStep",
        "name": "Document Verification",
        "text": "We verify identity and employment authorization documents as the authorized representative, completing Section 2 of Form I-9."
      },
      {
        "@type": "HowToStep",
        "name": "Completed Form Returned",
        "text": "Employer receives completed I-9 form with Section 2 filled out. For remote, E-Verify must be initiated within 3 business days."
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="I-9 Employment Verification Services PA - Remote & Mobile"
        description="Professional I-9 verification services for employers in Pennsylvania. DHS-compliant remote and mobile I-9 completion. Staffing agencies, seasonal employers, small businesses. From $35/employee."
        keywords="I-9 verification Pennsylvania, employment verification service, I-9 authorized representative, remote I-9 E-Verify, mobile I-9 service Erie PA"
        canonical="https://notroom.com/services/i9-verification"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20" role="banner">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0" aria-label="Service category">
              DHS-Compliant I-9 Services
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              I-9 Employment Verification Services
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Professional I-9 document verification for employers. Remote service for E-Verify employers and mobile in-person verification for all businesses. Compliant, fast, and affordable.
            </p>
            <div className="bg-background/10 backdrop-blur-sm border border-primary-foreground/20 rounded-lg p-5 mb-8 text-sm md:text-base" role="alert" aria-live="polite">
              <p className="font-semibold mb-2">⚠️ Important Notice</p>
              <p className="opacity-90">
                <strong>This is NOT a notarization service.</strong> I-9 verification is performed as an Authorized Representative on behalf of employers. No notary seal or commission is used in this process, per Pennsylvania Department of State guidance. I am not an attorney and do not provide legal or immigration advice.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
                aria-label="Book I-9 verification service"
              >
                Book I-9 Verification
              </Button>
              <Button 
                size="lg" 
                variant="amberOutline"
                onClick={() => window.location.href = "tel:814-480-0989"}
                aria-label="Call for I-9 verification service"
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
          <div className="max-w-6xl mx-auto">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Service Options */}
      <section className="py-16 bg-background" aria-labelledby="service-options-heading">
        <div className="container mx-auto px-4">
          <h2 id="service-options-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">Choose Your I-9 Verification Method</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 md:p-8 border-2 border-primary" role="article" aria-labelledby="in-person-heading">
              <MapPin className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
              <h3 id="in-person-heading" className="text-xl md:text-2xl font-bold mb-4">In-Person I-9 Verification</h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                In-person I-9 completion as your authorized representative. We come to your location.
              </p>
              <ul className="space-y-3 mb-6" role="list">
                {mobileFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-primary/10 p-4 md:p-5 rounded-lg mb-6">
                <p className="text-2xl md:text-3xl font-bold text-primary" aria-label="Price: $85 per employee">$85</p>
                <p className="text-sm md:text-base text-muted-foreground">Per employee verification</p>
                <div className="mt-3 text-xs md:text-sm bg-background/50 p-3 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Verification service:</span>
                    <span>$85</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <span>Includes travel to location + document review</span>
                  </div>
                </div>
              </div>
              <Button className="w-full text-base" onClick={scrollToBooking} aria-label="Book in-person I-9 verification">
                Book In-Person I-9
              </Button>
            </Card>

            <Card className="p-6 md:p-8 border-2" role="article" aria-labelledby="remote-heading">
              <Video className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
              <h3 id="remote-heading" className="text-xl md:text-2xl font-bold mb-4">Remote I-9 (E-Verify Employers)</h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                For E-Verify employers using DHS alternative procedure. Complete I-9 verification via secure video call.
              </p>
              <ul className="space-y-3 mb-6" role="list">
                {remoteFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-primary/10 p-4 md:p-5 rounded-lg mb-6">
                <p className="text-2xl md:text-3xl font-bold text-primary" aria-label="Price: $125 per employee">$125</p>
                <p className="text-sm md:text-base text-muted-foreground">Per employee (E-Verify employers only)</p>
                <div className="mt-3 text-xs md:text-sm bg-background/50 p-3 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Remote verification + technology:</span>
                    <span>$125</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <span>Video platform + document analysis + DHS compliance</span>
                  </div>
                </div>
              </div>
              <Button className="w-full text-base" onClick={scrollToBooking} aria-label="Book remote I-9 verification">
                Book Remote I-9
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-16 bg-muted/30" aria-labelledby="who-needs-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 id="who-needs-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">Who Needs I-9 Verification Services?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whoNeedsThis.map((item, index) => (
                <Card key={index} className="p-6 border-2" role="article">
                  <Building2 className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
                  <h3 className="font-bold text-base md:text-lg mb-2">{item.type}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-background" aria-labelledby="process-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 id="process-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
            <ol className="space-y-6" role="list">
              <li>
                <Card className="p-6 border-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg" aria-label="Step 1">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Employer Books Service</h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Schedule remote or mobile I-9 verification. Provide employee details and preferred date/time.
                      </p>
                    </div>
                  </div>
                </Card>
              </li>

              <li>
                <Card className="p-6 border-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg" aria-label="Step 2">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Employee Session</h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        <strong>Remote:</strong> Employee joins secure video call with valid ID documents.<br />
                        <strong>Mobile:</strong> We meet employee at your location to review documents in person.
                      </p>
                    </div>
                  </div>
                </Card>
              </li>

              <li>
                <Card className="p-6 border-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg" aria-label="Step 3">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Document Verification</h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        We verify identity and employment authorization documents as the authorized representative, completing Section 2 of Form I-9.
                      </p>
                    </div>
                  </div>
                </Card>
              </li>

              <li>
                <Card className="p-6 border-2">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg" aria-label="Step 4">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Completed Form Returned</h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Employer receives completed I-9 form with Section 2 filled out. For remote, E-Verify must be initiated within 3 business days.
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-muted/30" aria-labelledby="pricing-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">Transparent Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-6 md:p-8 border-2 border-primary" role="article">
                <h3 className="text-lg md:text-xl font-bold mb-6">In-Person I-9 Verification</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b text-sm md:text-base">
                    <span>Single employee</span>
                    <span className="font-bold text-lg md:text-xl">$85</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b text-sm md:text-base">
                    <span>2-5 employees (same visit)</span>
                    <span className="font-bold text-lg md:text-xl">$75 each</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <span>6+ employees (same visit)</span>
                    <span className="font-bold text-lg md:text-xl">$65 each</span>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-4">Travel to your location included for Erie County</p>
              </Card>

              <Card className="p-6 md:p-8 border-2" role="article">
                <h3 className="text-lg md:text-xl font-bold mb-6">Remote I-9 (E-Verify Employers)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b text-sm md:text-base">
                    <span>Per employee</span>
                    <span className="font-bold text-lg md:text-xl">$125</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b text-sm md:text-base">
                    <span>5+ employees/month</span>
                    <span className="font-bold text-lg md:text-xl">$110 each</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <span>10+ employees/month</span>
                    <span className="font-bold text-lg md:text-xl">$100 each</span>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-4">Requires E-Verify enrollment by employer</p>
              </Card>
            </div>
            <p className="text-sm md:text-base text-muted-foreground text-center mt-6">
              * Recurring monthly bundles available for staffing agencies and high-volume employers. Contact us for custom pricing.
            </p>
          </div>
        </div>
      </section>


      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="I-9 Verification"
        reviews={[
          { text: "Perfect for our remote hires. The video I-9 service is fast and compliant.", author: "Dan M.", city: "Erie", rating: 5 },
          { text: "They came to our office for multiple employee verifications. Very efficient!", author: "Rachel K.", city: "Meadville", rating: 5 },
          { text: "Great service for our staffing agency. They handle all our I-9 needs.", author: "Tom B.", city: "Warren", rating: 5 },
          { text: "Professional and knowledgeable about DHS requirements. Highly recommend!", author: "Lisa H.", city: "Harborcreek", rating: 5 }
        ]}
      />


      {/* FAQs */}
      <FAQSection faqs={faqs} />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-4">Book Your I-9 Verification Service</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Professional I-9 verification that keeps your business compliant. Remote or mobile options to fit your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
              aria-label="Schedule I-9 verification service"
            >
              Schedule I-9 Verification
            </Button>
            <Button 
              size="lg" 
              variant="amberOutline"
              onClick={() => window.location.href = "tel:814-480-0989"}
              aria-label="Call for I-9 verification assistance"
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

export default I9Verification;