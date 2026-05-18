import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Shield, CheckCircle, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialProof from "@/components/marketing/SocialProof";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const LoanSigningAgent = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loanTypes = [
    "Purchase mortgages",
    "Refinance loans",
    "Home equity lines of credit (HELOC)",
    "Reverse mortgages",
    "Commercial real estate loans",
    "Construction loans"
  ];

  const qualifications = [
    { icon: Award, title: "NNA Certified", desc: "National Notary Association certified signing agent" },
    { icon: Shield, title: "$100K E&O Insurance", desc: "Comprehensive errors and omissions coverage" },
    { icon: FileText, title: "MISMO Standards", desc: "Compliant with mortgage industry standards" },
    { icon: Clock, title: "Flexible Scheduling", desc: "Available by appointment including evenings and weekends" }
  ];

  const serviceSchema = generateServiceSchema({
    name: "Loan Signing Agent Service Erie, PA",
    description: "NNA-certified loan signing agent for real estate closings in Erie, Crawford, Warren, Mercer, and Venango counties. $100K E&O insurance, MISMO compliant. Specializing in purchase mortgages, refinances, HELOCs, and reverse mortgages.",
    provider: "Notroom - NNA Certified Loan Signing Agent",
    areaServed: "Northwestern Pennsylvania",
    price: "175",
    url: "https://notroom.com/services/loan-signing-agent"
  });

  const faqSchema = generateFAQSchema([
    {
      question: "How much does a loan signing agent cost in Erie, PA?",
      answer: "Loan signing services start at $175 for standard purchase/refinance closings ($5 PA notary fee per signature + $170 signing agent service fee covering printing, travel, insurance, and scan-back). Complex closings range $250-400 depending on document volume and complexity."
    },
    {
      question: "Are you a certified loan signing agent in Pennsylvania?",
      answer: "Yes, we are NNA (National Notary Association) certified signing agents with $100K errors & omissions insurance. Pennsylvania does not require separate state certification—NNA certification is the industry standard recognized by all title companies and lenders."
    },
    {
      question: "What areas do you serve for loan signings in Pennsylvania?",
      answer: "We provide loan signing services throughout Erie County (Erie, Millcreek, Harborcreek), Crawford County (Meadville, Titusville), Warren County (Warren), Mercer County (Sharon, Hermitage, Grove City), and Venango County (Oil City, Franklin)."
    },
    {
      question: "Can you handle evening and weekend loan signings in Erie?",
      answer: "Yes! We offer flexible scheduling including evening and weekend loan signing appointments throughout northwestern Pennsylvania. This allows borrowers to close at convenient times outside traditional business hours."
    }
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "Loan Signing Agent", url: "https://notroom.com/services/loan-signing-agent" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Loan Signing Agent Erie, PA | NNA Certified | Meadville, Warren, Sharon | Real Estate Closings"
        description="NNA-certified loan signing agent in Erie, PA - $175+. $100K E&O insurance, MISMO compliant. Purchase, refinance, HELOC, reverse mortgage closings. Serving Erie, Crawford, Warren, Mercer counties. Flexible scheduling. Book now!"
        keywords="loan signing agent erie pa, notary signing agent pennsylvania, mortgage closing notary, real estate notary erie, certified signing agent meadville, loan signing warren pa, NNA certified notary"
        canonical="https://notroom.com/services/loan-signing-agent"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              NNA Certified
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Loan Signing Agent in Erie, PA
            </h1>
              <p className="text-xl mb-8 opacity-90">
                NNA-certified loan signing agent for mortgage closings, refinances, and real estate transactions. $100K E&O insurance and MISMO compliant. Pennsylvania does not require separate state licensing for signing agents—certification through the National Notary Association is the industry standard recognized by title companies and lenders.
              </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Schedule Signing - $175-$400
              </Button>
              <p className="text-sm opacity-80 mt-2">
                Standard $175-225 | Complex $250-325 | Commercial $400+
              </p>
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
          <div className="max-w-6xl mx-auto">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Title Companies & Lenders Trust Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {qualifications.map((qual, index) => (
                <Card key={index} className="p-6">
                  <qual.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2">{qual.title}</h3>
                  <p className="text-sm text-muted-foreground">{qual.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">Loan Types We Handle</h2>
                <ul className="space-y-3">
                  {loanTypes.map((type, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{type}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Process</h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Receive Documents</h3>
                      <p className="text-sm text-muted-foreground">We review closing package in advance</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Print & Prepare</h3>
                      <p className="text-sm text-muted-foreground">High-quality printing of all loan documents</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Conduct Signing</h3>
                      <p className="text-sm text-muted-foreground">Professional, thorough signing at borrower's location</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Return Documents</h3>
                      <p className="text-sm text-muted-foreground">Same-day shipping back to title company</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Title Companies */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">For Title Companies & Lenders</h2>
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">Reliable & On-Time</h3>
                    <p className="text-muted-foreground">
                      99.8% on-time performance rate. We understand the importance of closing deadlines and coordinate seamlessly with your team.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">Fully Insured & Bonded</h3>
                    <p className="text-muted-foreground">
                      $100,000 errors and omissions insurance provides peace of mind for your transactions. Pennsylvania notary fee ($15 per signature) is separate from signing agent services as required by law.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">Background Checked</h3>
                    <p className="text-muted-foreground">
                      Comprehensive background screening ensures client safety and professional standards.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Set up a signing agent account for seamless ordering
                </p>
                <div className="flex justify-center">
                  <Button onClick={scrollToBooking}>Contact Us for Account Setup</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Transparent Pricing Structure</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Standard Closings</h3>
                <div className="text-3xl font-bold mb-4">$175-225</div>
                <div className="bg-muted/50 p-4 rounded text-sm space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PA notary fees (per signature):</span>
                    <span className="font-semibold">$5 each</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Signing agent service:</span>
                    <span className="font-semibold">$170+</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-2">
                    • Document printing & preparation<br/>
                    • Travel within service area<br/>
                    • $100K E&O insurance coverage<br/>
                    • Scan-back to title company
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Document printing included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Travel within service area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Scan-back service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>$100K E&O insurance</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-primary border-2">
                <h3 className="text-xl font-bold mb-4">Purchase / Reverse Mortgage</h3>
                <div className="text-3xl font-bold mb-4">$250-$325</div>
                <div className="bg-muted/50 p-4 rounded text-sm space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PA notary fees (per signature):</span>
                    <span className="font-semibold">$5 each</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Signing agent service:</span>
                    <span className="font-semibold">$245-320+</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-2">
                    • Higher document volume<br/>
                    • Extended appointment time<br/>
                    • Complex document review<br/>
                    • All standard services included
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Complex document handling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Extended signing time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Multiple document packages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Priority handling & shipping</span>
                  </li>
                </ul>
              </Card>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Commercial loans $400+. After-hours +$25-50. Weekend +$50-75. Same-day +$50-75.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FAQSection 
        faqs={[
          {
            question: "What makes you different from other signing agents?",
            answer: "We're NNA certified with $100K E&O insurance, MISMO compliant, and maintain a 99.8% on-time performance rate. We treat every signing with professionalism and understand the importance of closing deadlines."
          },
          {
            question: "Do you handle all types of loan signings?",
            answer: "Yes! We handle purchases, refinances, HELOCs, reverse mortgages, commercial loans, and construction loans. We also specialize in hybrid and electronic closings."
          },
          {
            question: "How far in advance should we book a signing?",
            answer: "We can accommodate most signings within 24-48 hours. For rush closings, call us directly at (814) 480-0989."
          },
          {
            question: "What's the difference between standard and hybrid/e-closing pricing?",
            answer: "Hybrid/e-closings ($225) involve coordinating digital signature platforms with wet-signed notarized documents, requiring additional technology and platform integration work compared to standard paper closings ($175). Both include full signing agent services."
          },
          {
            question: "Do you have errors and omissions insurance?",
            answer: "Yes, we carry $100,000 E&O insurance that covers all loan signing activities. Certificate of insurance provided upon request to title companies and lenders."
          },
          {
            question: "What areas do you cover for loan signings in Pennsylvania?",
            answer: "We serve Erie, Crawford, Warren, Mercer, and Venango counties. Travel fees may apply for locations outside Erie city limits. Call us for specific coverage confirmation in your area."
          },
          {
            question: "Are you background checked?",
            answer: "Yes. We've completed comprehensive background screening including criminal history, credit check, and NNA background verification. All documentation is available for title company review."
          },
          {
            question: "Can you handle same-day signings?",
            answer: "In many cases, yes. If documents arrive before 2 PM, we can often accommodate same-day signings in Erie County. Call us directly for same-day availability at (814) 480-0989."
          },
          {
            question: "Do you work with signing services and title companies nationwide?",
            answer: "Absolutely. We're approved with major title companies and signing services throughout Pennsylvania. We accept orders via fax, email, or direct portal uploads. Quick turnaround on document scan-backs guaranteed."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Certified Loan Signing Agent?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Professional, reliable service for title companies, lenders, and borrowers throughout Erie County.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Schedule Loan Signing
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
    </Layout>
  );
};

export default LoanSigningAgent;
