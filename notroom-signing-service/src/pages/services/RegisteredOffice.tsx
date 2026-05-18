import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building, FileText, Bell, Shield, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import EnhancedUPLDisclaimer from "@/components/EnhancedUPLDisclaimer";
import SocialProof from "@/components/marketing/SocialProof";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";

const RegisteredOffice = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const registeredOfficeFeatures = [
    "CROP-ready services for Pennsylvania businesses",
    "Professional business address for your LLC/Corporation",
    "Mail scanning & digital forwarding",
    "Service of process acceptance & forwarding",
    "Annual report and FinCEN BOI deadline reminders",
    "Secure document vault"
  ];

  const filingServices = [
    { service: "LLC Formation", desc: "Form preparation & filing assistance (you provide entity details)", price: "$149", note: "Includes: Certificate of Organization filing with PA DOS. PA state fee $125 additional. We fill forms with your provided information only." },
    { service: "Corporation Formation", desc: "Articles of Incorporation form assistance", price: "$199", note: "Includes: Filing with PA DOS. PA state fee $125 additional. We prepare forms per your instructions only." },
    { service: "DBA/Fictitious Name", desc: "Trade name registration filing", price: "$99", note: "Includes: County registration filing. County fees vary $20-70 additional." },
    { service: "Annual Report Filing", desc: "PA Decennial Report form preparation", price: "$79", note: "PA does not require annual reports for LLCs/Corps. We assist with decennial filings when due." },
    { service: "EIN Application Assistance", desc: "Federal tax ID (Form SS-4) preparation", price: "$49", note: "We prepare Form SS-4 per your information. IRS filing is free. You remain responsible party." },
    { service: "Operating Agreement Template", desc: "Standard PA LLC template (your customization)", price: "$99", note: "Pre-drafted template only. We do NOT draft custom provisions or provide legal advice on terms. Consult attorney for custom agreements." }
  ];

  const complianceClubFeatures = [
    "Automatic annual report reminders",
    "FinCEN BOI deadline tracking",
    "Document storage & retrieval",
    "Secretary of State filing monitoring",
    "Priority email support",
    "10% discount on all filings"
  ];

  const serviceSchema = generateServiceSchema({
    name: "Pennsylvania Registered Office & Business Filing Services (CROP-Ready)",
    description: "CROP-ready registered office and business filing services for Pennsylvania. We support businesses that need a PA Commercial Registered Office Provider. LLC formation, registered office address, annual reports, and compliance management.",
    provider: "Notroom - PA CROP-Ready Services",
    areaServed: "Pennsylvania",
    price: "99",
    url: "https://notroom.com/crop"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Registered Office", url: "https://notroom.com/services/registered-office" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="PA Registered Office & CROP-Ready Business Services - Erie, Meadville, Warren"
        description="CROP-ready registered office services for Pennsylvania businesses. We support companies needing a PA Commercial Registered Office Provider. LLC formation Erie, registered office address, annual reports, DBA filing. From $99/year."
        keywords="Pennsylvania registered office, PA CROP-ready Erie, LLC formation Pennsylvania, registered agent Erie PA, business filing service Northwestern PA, annual report PA, LLC formation Erie County, CROP services Crawford County, registered office Warren County"
        canonical="https://notroom.com/crop"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              CROP-Ready Services for PA Businesses
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Pennsylvania Registered Office & Business Filing Services
            </h1>
            <p className="text-xl mb-8 opacity-90">
              CROP-ready registered office address and business filing services for Pennsylvania LLCs and corporations. We support businesses that need a PA Commercial Registered Office Provider.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Get Started - $99/year
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

      {/* What is CROP */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">What is a Commercial Registered Office Provider (CROP)?</h2>
            <Card className="p-8">
            <p className="text-lg mb-4">
                In Pennsylvania, every business entity must maintain a registered office address—a physical location in Pennsylvania where legal documents, service of process, and official correspondence can be received. A Commercial Registered Office Provider (CROP) is a third-party service registered with the PA Department of State Bureau of Corporations that provides this address professionally.
              </p>
              <p className="text-muted-foreground mb-6">
                Unlike other states that use "registered agents," Pennsylvania uses the CROP system under 15 Pa.C.S. § 109 and § 415. We provide CROP-ready services and maintain a physical Pennsylvania address to serve as your official registered office, handling mail, service of process, and state correspondence on your behalf per written agreement.
              </p>
              <div className="bg-primary/10 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                     <h3 className="font-bold mb-2">Why Use Our CROP-Ready Service?</h3>
                     <p className="text-sm text-muted-foreground">
                       Protect your privacy by keeping your home address off public Secretary of State records. Get professional mail handling, digital scanning, service of process acceptance, and compliance deadline reminders—all in one place. We support businesses that need a PA Commercial Registered Office Provider. Required by Pennsylvania law: You must list a CROP on your filings only after we have agreed in writing to serve in that capacity (contract provided).
                     </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Options */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Registered Office */}
            <Card className="p-6">
              <Building className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Registered Office</h3>
              <p className="text-3xl font-bold text-primary mb-2">$99-149/year</p>
              <p className="text-sm text-muted-foreground mb-6">Professional PA registered office address</p>
              <ul className="space-y-3 mb-6">
                {registeredOfficeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={scrollToBooking}>
                Get Started
              </Button>
            </Card>

            {/* Business Filings */}
            <Card className="p-6 border-primary border-2">
              <FileText className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Business Filings</h3>
              <p className="text-3xl font-bold text-primary mb-2">$49-199</p>
              <p className="text-sm text-muted-foreground mb-6">LLC, DBA, annual reports & more</p>
              <div className="space-y-3 mb-6">
                {filingServices.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.service}</span>
                    <span className="font-bold">{item.price}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={scrollToBooking}>
                View All Filings
              </Button>
            </Card>

            {/* Compliance Club */}
            <Card className="p-6">
              <Bell className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Compliance Club</h3>
              <p className="text-3xl font-bold text-primary mb-2">$19-39/mo</p>
              <p className="text-sm text-muted-foreground mb-6">Never miss a deadline</p>
              <ul className="space-y-3 mb-6">
                {complianceClubFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={scrollToBooking}>
                Join Club
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Filing Services Detail */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Complete Business Filing Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {filingServices.map((item, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{item.service}</h3>
                    <span className="text-xl font-bold text-primary">{item.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                  <p className="text-xs text-muted-foreground border-t pt-3">{item.note}</p>
                </Card>
              ))}
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3">Important Legal Limitations - Not Legal Advice</h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li>• <strong>Document Preparation Only:</strong> We fill out government forms with information you provide. We do NOT select entity types for you, advise on business structure, or draft custom legal documents.</li>
                <li>• <strong>No Legal/Tax Advice:</strong> We cannot advise whether an LLC vs. Corporation is better for your situation, draft bylaws/operating agreement provisions, or provide tax guidance. Consult an attorney or CPA.</li>
                <li>• <strong>State Fees Separate:</strong> All prices are our service fees. PA Department of State filing fees ($125 LLC/Corp, $70 name reservation, $250 foreign entity, etc.) are paid directly to the state and not included in our pricing.</li>
                <li>• <strong>CROP-Ready Status:</strong> We provide CROP-ready services to support businesses that need a PA Commercial Registered Office Provider under 15 Pa.C.S. § 109. A written service contract is required before listing us on any filing.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Business Launch Pack */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-background text-primary border-0">
              Best Value
            </Badge>
            <h2 className="text-3xl font-bold mb-6">Business Launch Pack</h2>
            <Card className="p-8 bg-background/10 border-primary-foreground/20">
              <p className="text-5xl font-bold mb-4">$349</p>
              <p className="text-lg mb-8 opacity-90">+ PA state fees</p>
              <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">LLC formation filing</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Registered office (1 year)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">EIN application assistance</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Standard operating agreement template</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Compliance calendar</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">2 RON credits included</span>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
                className="w-full"
              >
                Launch Your Business
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Choose Your Service</h3>
                    <p className="text-muted-foreground">
                      Select registered office, business filing, or the complete Business Launch Pack.
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
                    <h3 className="text-xl font-bold mb-2">We Handle the Paperwork</h3>
                    <p className="text-muted-foreground">
                      We prepare and file all documents with the PA Department of State. You'll receive updates throughout the process.
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
                    <h3 className="text-xl font-bold mb-2">Get Your Documents</h3>
                    <p className="text-muted-foreground">
                      Receive your stamped certificates, EIN confirmation, and all supporting documents digitally and by mail.
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
                    <h3 className="text-xl font-bold mb-2">Stay Compliant</h3>
                    <p className="text-muted-foreground">
                      We monitor deadlines and send reminders for annual reports, FinCEN BOI filings, and other requirements.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Registered Office & Business Filing Services"
        reviews={[
          { text: "Great service for my LLC formation. They handled everything professionally.", author: "Mark B.", city: "Erie", rating: 5 },
          { text: "Using their registered office keeps my home address private. Excellent service.", author: "Susan T.", city: "Meadville", rating: 5 },
          { text: "Fast DBA filing and helpful reminders for compliance deadlines.", author: "James L.", city: "Warren", rating: 5 },
          { text: "Professional CROP service. Mail scanning is a huge convenience.", author: "Patricia K.", city: "Sharon", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection 
        faqs={[
          {
            question: "What is a Commercial Registered Office Provider (CROP)?",
            answer: "A CROP provides a professional PA address for your business's registered office. We're registered with PA Dept of State and accept service of process on your behalf per written agreement."
          },
          {
            question: "How much does LLC formation cost in Pennsylvania?",
            answer: "Our service is $149 + $125 PA state fee = $274 total. Includes preparing Certificate of Organization with your info and filing with PA Department of State. 5-7 business days processing."
          },
          {
            question: "Do I need an attorney to form an LLC in Pennsylvania?",
            answer: "No, but we cannot provide legal advice. We prepare standard forms with your information only. Consult an attorney for complex structures or custom operating agreements."
          },
          {
            question: "Does Pennsylvania require annual reports for LLCs?",
            answer: "No. PA doesn't require annual reports but requires decennial (every 10 years) filings. We track these deadlines and remind you when due."
          },
          {
            question: "What happens if I receive a lawsuit at my registered office?",
            answer: "We accept service of process, then immediately forward all legal documents to you via email and certified mail. You're responsible for responding—we're the official receiving address."
          },
          {
            question: "Can I use a P.O. Box as my registered office?",
            answer: "No. PA law requires a physical street address—P.O. Boxes aren't acceptable. Our CROP service provides the required physical PA address."
          },
          {
            question: "What's included in the Business Launch Pack?",
            answer: "The $349 pack includes LLC formation, 1 year registered office, EIN assistance, operating agreement template, compliance calendar, and 2 RON credits. PA state fees ($125+) additional."
          },
          {
            question: "What's the difference between a registered office and a registered agent?",
            answer: "Pennsylvania uses the term 'Commercial Registered Office Provider' (CROP) instead of 'registered agent.' Under 15 Pa.C.S. § 109 and § 415, CROPs must register with the PA Department of State Bureau of Corporations. We are a registered CROP and provide a physical Pennsylvania address where your business can receive legal documents, service of process, and official state correspondence. This is different from other states' registered agent systems."
          },
          {
            question: "Can I use your address as my business address?",
            answer: "Yes! Our registered office address can be used as your business address on all state filings, keeping your personal address private from public records."
          },
          {
            question: "How long does LLC formation take?",
            answer: "Standard LLC formation through PA Department of State typically takes 5-7 business days. Expedited processing options are available for faster turnaround."
          },
          {
            question: "What's included in the Business Launch Pack?",
            answer: "The $349 pack (plus $125 PA state fee) includes: LLC formation form preparation and filing, 1 year of CROP registered office service, EIN application assistance, standard operating agreement template, compliance calendar, and 2 RON credits. Note: We prepare forms per your information only—entity selection and custom legal provisions require an attorney."
          },
          {
            question: "Can you help me decide between an LLC and Corporation?",
            answer: "We cannot advise on entity selection as that constitutes legal/tax advice we're not authorized to provide. We recommend consulting a licensed attorney or CPA to determine which structure best fits your situation. Once you decide, we can assist with the form preparation and filing."
          },
          {
            question: "What are the PA state filing fees?",
            answer: "PA Department of State charges: $125 for LLC Certificate of Organization, $125 for Corporation Articles of Incorporation, $70 for name reservations, $250 for foreign entity registration. These fees are separate from our service fees and paid directly to the state."
          },
          {
            question: "Do you handle ongoing compliance reminders?",
            answer: "Yes! All registered office clients receive automatic reminders for annual reports, FinCEN BOI filings, and other compliance deadlines. Compliance Club members get enhanced monitoring and priority support."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start or Maintain Your Pennsylvania Business?</h2>
          <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Professional registered office and filing services that keep your business compliant and your privacy protected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = "tel:814-480-0989"}
            >
              Call (814) 480-0989
            </Button>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <EnhancedUPLDisclaimer service="registered-office" />
            <div className="mt-8">
              <LegalDisclaimer variant="compact" />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default RegisteredOffice;
