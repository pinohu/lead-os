import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Clock, TrendingDown, CheckCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialProof from "@/components/marketing/SocialProof";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const BusinessRetainer = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const benefits = [
    "Priority scheduling - skip the waitlist",
    "Dedicated account manager",
    "Volume discounts on notarizations",
    "Flexible monthly or annual billing",
    "Custom service level agreements",
    "Training for your staff on document preparation"
  ];

  const industries = [
    { name: "Legal Firms", desc: "Power of attorney, affidavits, depositions" },
    { name: "Real Estate", desc: "Purchase agreements, leases, disclosures" },
    { name: "Financial Services", desc: "Account openings, wire transfers, loan documents" },
    { name: "Healthcare", desc: "HIPAA authorizations, medical powers of attorney" },
    { name: "Human Resources", desc: "I-9 verifications, background check forms" },
    { name: "Title Companies", desc: "Closing documents, deed transfers" }
  ];

  const serviceSchema = generateServiceSchema({
    name: "Business Notary Retainer Plans",
    description: "Business notary retainer services for Erie, PA companies. Priority scheduling, volume discounts, dedicated support. Perfect for legal firms, real estate agencies, HR departments, financial services.",
    provider: "Notroom - Business Notary Services",
    areaServed: "Pennsylvania",
    price: "500",
    url: "https://notroom.com/services/business-retainer"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "Business Retainer", url: "https://notroom.com/services/business-retainer" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Business Notary Retainer PA | Volume Plans for Erie Companies | Law Firms, Real Estate, HR"
        description="Business notary retainer plans for Erie, PA companies - From $500/month. Priority scheduling, volume discounts, dedicated support. Perfect for legal firms, real estate, financial services, HR departments. Monthly/annual billing available."
        keywords="business notary retainer erie pa, corporate notary services, bulk notarization, law firm notary, company notary plan, HR notary services pennsylvania"
        canonical="https://notroom.com/services/business-retainer"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              For Businesses
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Business Notary Retainer Plans
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Streamline your company's notarization needs with a dedicated business account. Priority service, volume discounts, and simplified billing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Get Custom Quote
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
          <div className="max-w-6xl mx-auto">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Businesses Choose Retainer Plans</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <TrendingDown className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Save 20-40%</h3>
                <p className="text-muted-foreground">
                  Volume discounts reduce your per-notarization cost significantly compared to one-off bookings.
                </p>
              </Card>
              <Card className="p-6">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Priority Service</h3>
                <p className="text-muted-foreground">
                  Skip the queue with guaranteed same-day or next-day appointments for retainer clients.
                </p>
              </Card>
              <Card className="p-6">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Dedicated Support</h3>
                <p className="text-muted-foreground">
                  Your own account manager who understands your business and notarization needs.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="text-3xl font-bold mb-4">$399<span className="text-lg text-muted-foreground">/mo</span></div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">15 notarizations per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Monthly reporting</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Get Started</Button>
              </Card>

              <Card className="p-6 border-primary border-2 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-4">$899<span className="text-lg text-muted-foreground">/mo</span></div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">40 notarizations per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Phone & email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Detailed analytics</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Get Started</Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-4">Custom</div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited notarizations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Immediate priority access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated notary team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Extended phone support hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom SLA agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">API integration available</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Contact Sales</Button>
              </Card>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Legal Disclosure:</strong> Prepaid notarization packages. Pennsylvania notary fee limits ($5-15 per signature) still apply to each individual notarial act. Unused notarizations expire at contract end and are non-refundable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Industries We Serve</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((industry, index) => (
                <Card key={index} className="p-6">
                  <Building2 className="w-10 h-10 text-primary mb-3" />
                  <h3 className="font-bold mb-2">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Business Retainer"
        reviews={[
          { text: "Our law firm uses their retainer plan. Priority scheduling is a game-changer!", author: "Attorney James R.", city: "Erie", rating: 5 },
          { text: "Perfect for our real estate office. Volume discounts save us money every month.", author: "Carol P.", city: "Meadville", rating: 5 },
          { text: "Dedicated account manager makes everything smooth. Highly recommend for businesses.", author: "Mark T.", city: "Warren", rating: 5 },
          { text: "Best decision we made. Handles all our HR document needs professionally.", author: "Sarah L.", city: "Harborcreek", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "How do prepaid notarization packages work?",
            answer: "You purchase a monthly plan with a set number of notarizations included. Unused notarizations expire at contract end. Pennsylvania notary fee limits ($5-15 per signature) still apply to each individual notarial act."
          },
          {
            question: "Can multiple people in our company use the retainer?",
            answer: "Yes! All employees at your company can use the notarization credits included in your plan. Your dedicated account manager helps coordinate scheduling."
          },
          {
            question: "What happens if we need more notarizations than our plan includes?",
            answer: "Additional notarizations beyond your plan are available at discounted retainer rates. We can also upgrade your plan mid-contract if your needs increase."
          },
          {
            question: "Is there a contract term requirement?",
            answer: "Plans are month-to-month or annual. Annual contracts receive additional discounts. No long-term commitment required—cancel anytime with 30 days notice."
          },
          {
            question: "What types of businesses benefit most from retainer plans?",
            answer: "Law firms, real estate agencies, title companies, financial services firms, HR departments, and healthcare facilities with recurring notarization needs see the most value and cost savings."
          },
          {
            question: "Are prepaid notary packages legal in Pennsylvania?",
            answer: "Yes, with proper structure. PA law requires each notarial act be charged separately at the maximum fee ($5-15). Retainer packages are legal as long as individual notarial acts remain separately identifiable and comply with fee limits. Our plans are structured in full compliance with PA notary law."
          },
          {
            question: "Do you offer mobile notary service for retainer clients?",
            answer: "Yes! Priority mobile service is included in Professional and Enterprise plans. We come to your office location throughout Erie and surrounding counties. Travel fees may apply for locations outside Erie city limits."
          },
          {
            question: "Can we customize a plan for our specific needs?",
            answer: "Absolutely. Enterprise clients receive fully customized service level agreements (SLAs) tailored to their volume, response time requirements, and specific document types. Contact us for a consultation and custom quote."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Notarization Process?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Get a custom quote tailored to your business needs. No obligations, free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Request Quote
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

export default BusinessRetainer;
