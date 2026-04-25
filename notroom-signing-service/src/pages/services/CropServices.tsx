import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Building, Mail, FileCheck, Bell, Shield, ArrowRight, Phone, Clock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";
import { CROP_PLANS } from "@/constants/cropPlans";
import { siteConfig } from "@/constants/siteConfig";

const CropServices = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/crop/application");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const serviceSchema = generateServiceSchema({
    name: "Pennsylvania Registered Office & CROP Services",
    description: siteConfig.isOfficialCropApproved
      ? "Approved Commercial Registered Office Provider (CROP) services for Pennsylvania LLCs, corporations, and foreign entities. Professional PA address, service of process, mail handling, and compliance support."
      : "CROP-ready registered office services for Pennsylvania LLCs, corporations, and foreign entities. Professional PA address, service of process, mail handling, and compliance support.",
    provider: siteConfig.isOfficialCropApproved
      ? "Notroom - Approved PA CROP"
      : "Notroom - PA CROP-Ready Services",
    areaServed: "Pennsylvania",
    price: "149",
    url: "https://notroom.com/crop"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Business Services", url: "https://notroom.com/crop" },
    { name: "Registered Office & CROP", url: "https://notroom.com/crop" }
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this compliant with PA Department of State rules?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": siteConfig.isOfficialCropApproved
            ? "Yes. Notroom is an approved Commercial Registered Office Provider (CROP) registered with the PA Department of State Bureau of Corporations and Charitable Organizations under 15 Pa.C.S. § 109 and § 415. We maintain a physical Pennsylvania address and handle service of process acceptance and official mail forwarding per written service agreement. You can list us as your registered office on state filings once we execute the required CROP service contract."
            : "Yes. We provide CROP-ready services that align with Pennsylvania's Commercial Registered Office Provider requirements under 15 Pa.C.S. § 109 and § 415. We maintain a physical Pennsylvania address and handle service of process acceptance and official mail forwarding per written service agreement. Before listing us on any state filing, we will execute the required CROP service contract with you to ensure full legal compliance."
        }
      },
      {
        "@type": "Question",
        "name": "Can I switch my current registered office to Notroom?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. If you currently have a different registered office address on file with the PA Department of State, you can file a Statement of Change to update it to our address. We'll provide the necessary forms and instructions. The state filing fee for a Statement of Change is approximately $70 (paid directly to PA DOS). Once approved and executed, we can serve as your new registered office. This process typically takes 1-2 weeks for state processing."
        }
      },
      {
        "@type": "Question",
        "name": "How do renewals work for the registered office service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your registered office service renews annually. We'll send you a renewal notice 60 days before your anniversary date via email and through your client portal. You can renew online with a credit card or ACH payment. If you choose not to renew, we require 30 days' written notice so you have time to designate a new registered office with the state before we cease service. Pennsylvania law requires all active entities to maintain a current registered office at all times."
        }
      },
      {
        "@type": "Question",
        "name": "How is mail and service of process handled?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Standard Plan: We receive and forward physical mail to your designated mailing address weekly. Digital Plan: We scan the exterior of envelopes and upload images to your secure portal within 24 hours. You can request we open and scan contents, forward originals, or shred routine items. Service of Process: If we receive legal papers (summons, subpoena, lawsuit), we immediately email and text you, then overnight the originals to your designated address. You'll know within hours, not days. All mail handling follows your written instructions in the service agreement."
        }
      }
    ]
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema, faqSchema]
  };

  const plans = [
    {
      name: CROP_PLANS.standard.name,
      price: CROP_PLANS.standard.price,
      period: CROP_PLANS.standard.period,
      description: CROP_PLANS.standard.description,
      features: CROP_PLANS.standard.features,
      cta: "Get Started",
      highlighted: false
    },
    {
      name: CROP_PLANS.digital.name,
      price: CROP_PLANS.digital.price,
      period: CROP_PLANS.digital.period,
      description: CROP_PLANS.digital.description,
      features: CROP_PLANS.digital.features,
      cta: "Most Popular",
      highlighted: true
    },
    {
      name: CROP_PLANS.premium.name,
      price: CROP_PLANS.premium.price,
      period: CROP_PLANS.premium.period,
      description: CROP_PLANS.premium.description,
      features: CROP_PLANS.premium.features,
      cta: "Best Value",
      highlighted: false
    }
  ];

  const howItWorksSteps = [
    {
      number: "1",
      title: "Complete Secure CROP Intake Form",
      description: "Fill out our secure online intake form with your entity details, authorized contacts, and mail handling preferences. We'll verify your information and prepare your service agreement. Takes about 5-10 minutes.",
      icon: FileCheck
    },
    {
      number: "2",
      title: "Choose Your Plan & Pay Online",
      description: "Select the registered office plan that fits your needs. Pay securely online via credit card or ACH. Your subscription begins immediately upon payment confirmation. No setup fees or hidden charges.",
      icon: CheckCircle
    },
    {
      number: "3",
      title: "Receive Confirmation & Instructions",
      description: "You'll receive a welcome email with your service agreement, official registered office address, and step-by-step instructions for listing us in your PA filings. Access your secure client portal to manage preferences.",
      icon: Mail
    },
    {
      number: "4",
      title: "Use Our Address in Your PA Filings",
      description: "List our address as your registered office on new entity filings or file a Statement of Change to update existing entities. We'll handle all official mail and service of process from day one. You stay compliant, we handle the details.",
      icon: Building
    }
  ];

  const whoNeedsCrop = [
    {
      title: "Out-of-State Business Owners",
      description: "Operating a Pennsylvania LLC or corporation from another state? PA law requires a physical Pennsylvania address for your registered office—not a PO Box. Use our address to maintain compliance while running your business from anywhere.",
      icon: Globe
    },
    {
      title: "Privacy-Conscious Entrepreneurs",
      description: "Don't want your home address on public state records? Your registered office address appears on the PA Department of State's public database. Using our professional address keeps your personal residence private.",
      icon: Shield
    },
    {
      title: "Foreign Entities Registering in PA",
      description: "Businesses formed in other states must designate a registered office when registering to do business in Pennsylvania. We serve as your local presence for legal compliance and official correspondence.",
      icon: Building
    },
    {
      title: "Growing Businesses Needing Flexibility",
      description: "Moving offices, working remotely, or expanding? Your registered office must stay current with the state. With us, your official address remains stable even as your business location changes—no amendment filings needed.",
      icon: ArrowRight
    }
  ];

  const whatYouGet = [
    {
      title: "Registered Office Address in Pennsylvania",
      description: "A professional, physical street address in Pennsylvania that meets all PA Department of State requirements. This is your official address for legal and state correspondence, listed on your entity's public record.",
      icon: Building
    },
    {
      title: "Service of Process & Official Mail Acceptance",
      description: "We accept service of process (lawsuits, subpoenas, legal notices) and official state correspondence on your behalf. You receive immediate notification via email and text when legal documents arrive, with originals overnighted to you the same day.",
      icon: Mail
    },
    {
      title: "Digital Mail Forwarding Workflow",
      description: "Choose physical-only forwarding (weekly batches) or digital scanning (24-hour turnaround). With digital scanning, we photograph envelope exteriors and upload to your secure portal. You decide what to open, forward, or shred—all managed online.",
      icon: Clock
    },
    {
      title: "Annual Compliance Reminders",
      description: "Never miss critical deadlines. We monitor your entity's status and send timely reminders for annual reports (if applicable), FinCEN BOI filings, and registered office renewal. Stay compliant without calendar stress.",
      icon: Bell
    },
    {
      title: "Bundle with Notary & Filing Services",
      description: "Need documents notarized or help with state filings? As a registered office client, you get priority access to our Remote Online Notary (RON), mobile notary, and business filing services—all in one place. Seamless support for your Pennsylvania business needs.",
      icon: FileCheck
    }
  ];

  return (
    <Layout>
      <SEO
        title="Registered Office & CROP Services for Pennsylvania Businesses | Notroom"
        description={siteConfig.isOfficialCropApproved
          ? "Approved Commercial Registered Office Provider (CROP) services for PA LLCs, corporations, and foreign entities. Secure address, service of process, digital mail scanning, compliance support. From $149/year."
          : "Professional registered office and CROP-ready services for PA LLCs, corporations, and foreign entities. Secure address, service of process, digital mail scanning, compliance support. From $149/year."}
        keywords="Pennsylvania registered office, PA CROP service, registered agent PA, LLC registered office Pennsylvania, service of process PA, business address Pennsylvania, CROP provider Erie PA, registered office Northwestern PA"
        canonical="https://notroom.com/crop"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20 pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0 text-sm px-4 py-1">
              {siteConfig.isOfficialCropApproved
                ? "Approved PA CROP • PA Department of State Registered • Trusted by 150+ Businesses"
                : "CROP-Ready Services • PA Compliant • Trusted by 150+ Businesses"}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {siteConfig.isOfficialCropApproved
                ? "Registered Office & CROP Services for Pennsylvania Businesses"
                : "Registered Office & CROP Services for Pennsylvania Businesses"}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-95 leading-relaxed">
              {siteConfig.isOfficialCropApproved
                ? "Notroom is an approved Commercial Registered Office Provider (CROP) in Pennsylvania. Use our trusted address and compliance services for LLCs, corporations, and foreign registrations."
                : "Use Notroom as your trusted address and compliance partner for LLCs, corporations, and foreign registrations in Pennsylvania. We support businesses that need a PA Commercial Registered Office Provider."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started with Registered Office Service
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary-foreground/20 hover:border-primary-foreground/40 hover:bg-primary-foreground/10"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                <Phone className="mr-2 w-5 h-5" />
                Schedule a Quick Call
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No setup fees • Annual billing • Cancel anytime with 30 days notice
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <TrustIndicators />
        </div>
      </section>

      {/* Who Needs a CROP */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Needs a Registered Office in Pennsylvania?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Pennsylvania law requires every LLC, corporation, limited partnership, and foreign entity doing business in PA to maintain a registered office—a physical address where official documents can be served.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {whoNeedsCrop.map((item, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Important:</strong> A registered office must be a physical street address in Pennsylvania—PO Boxes are not permitted by the PA Department of State. Our service provides a compliant address that meets all state requirements under 15 Pa.C.S. § 109.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Get with Notroom</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Professional registered office services designed for modern businesses. Stay compliant, protect your privacy, and focus on what matters.
              </p>
            </div>
            <div className="space-y-8">
              {whatYouGet.map((item, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-primary/10 rounded-lg flex-shrink-0">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Choose the registered office plan that fits your business needs. No hidden fees, no surprises.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`p-8 hover:shadow-xl transition-all ${
                    plan.highlighted ? 'border-2 border-primary shadow-lg scale-105' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="mb-4 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-6 min-h-[3rem]">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={scrollToBooking}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              ))}
            </div>
            <div className="mt-8 p-6 bg-background border border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Prices shown are for our registered office service only. Pennsylvania Department of State filing fees for entity formation, amendments, or changes are separate and paid directly to the state (typically $125 for LLC/Corporation formation, $70 for Statement of Change). Our team can assist with preparing these filings for an additional service fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Getting started with your Pennsylvania registered office is simple and secure. Here's the process:
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksSteps.map((step, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-3">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </Card>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button size="lg" onClick={scrollToBooking}>
                Start Your Application Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about registered office services in Pennsylvania.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Is this compliant with PA Department of State rules?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  {siteConfig.isOfficialCropApproved
                    ? "Yes. Notroom is an approved Commercial Registered Office Provider (CROP) registered with the PA Department of State Bureau of Corporations and Charitable Organizations under 15 Pa.C.S. § 109 and § 415. We maintain a physical Pennsylvania address and handle service of process acceptance and official mail forwarding per written service agreement. You can list us as your registered office on state filings once we execute the required CROP service contract."
                    : "Yes. We provide CROP-ready services that align with Pennsylvania's Commercial Registered Office Provider requirements under 15 Pa.C.S. § 109 and § 415. We maintain a physical Pennsylvania address and handle service of process acceptance and official mail forwarding per written service agreement. Before listing us on any state filing, we will execute the required CROP service contract with you to ensure full legal compliance."}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Can I switch my current registered office to Notroom?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Yes. If you currently have a different registered office address on file with the PA Department of State, you can file a Statement of Change to update it to our address. We'll provide the necessary forms and instructions. The state filing fee for a Statement of Change is approximately $70 (paid directly to PA DOS). Once approved and executed, we can serve as your new registered office. This process typically takes 1-2 weeks for state processing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  How do renewals work for the registered office service?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Your registered office service renews annually. We'll send you a renewal notice 60 days before your anniversary date via email and through your client portal. You can renew online with a credit card or ACH payment. If you choose not to renew, we require 30 days' written notice so you have time to designate a new registered office with the state before we cease service. Pennsylvania law requires all active entities to maintain a current registered office at all times.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  How is mail and service of process handled?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  <strong>Standard Plan:</strong> We receive and forward physical mail to your designated mailing address weekly.<br/><br/>
                  <strong>Digital Plan:</strong> We scan the exterior of envelopes and upload images to your secure portal within 24 hours. You can request we open and scan contents, forward originals, or shred routine items.<br/><br/>
                  <strong>Service of Process:</strong> If we receive legal papers (summons, subpoena, lawsuit), we immediately email and text you, then overnight the originals to your designated address. You'll know within hours, not days. All mail handling follows your written instructions in the service agreement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What happens if I receive a lawsuit or legal notice?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Service of process is our top priority. The moment we receive legal documents, we take immediate action: (1) Email and SMS notification sent to you within 1 hour, (2) Documents photographed and uploaded to your secure portal, (3) Originals shipped via overnight delivery to your designated address, (4) Signed acceptance logged and archived. You'll have legal papers in hand the next business day with proof of service acceptance. This fast notification gives you maximum time to consult with your attorney and respond appropriately.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Can I use your address for more than just my registered office?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Our address is specifically for your registered office with the PA Department of State and official business correspondence. You may also use it as your principal office address in state filings if needed. However, it cannot be used as a general mailing address for marketing materials, personal mail, or as a public-facing business address on your website or marketing collateral. If you need a full business mailing address with mail forwarding for all business correspondence, ask us about our Virtual Mailbox service ($50/month), which can be bundled with your registered office service.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Do you offer business formation services too?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Yes. We offer form preparation assistance for Pennsylvania LLC and corporation formation, DBA registration, and other state filings. Our team can help you prepare the necessary forms with information you provide, though we cannot provide legal advice on entity selection or custom legal drafting. Typical fees: LLC formation assistance $149 (plus $125 state fee), Corporation formation assistance $199 (plus $125 state fee). As a registered office client, you receive priority service and 10% off all business filing assistance. Visit our Business Filing Services page or call us to discuss your needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What if I need to cancel my service?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  We require 30 days' written notice to cancel. This gives you adequate time to file a Statement of Change with the PA Department of State to update your registered office to a new address. Canceling without updating your state filing could result in non-compliance and administrative dissolution of your entity. We'll provide instructions and forms to help you transition smoothly. Refunds are not provided for unused portions of annual subscriptions, but we'll continue service through the end of your 30-day notice period.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Establish Your Pennsylvania Registered Office?
            </h2>
            <p className="text-xl mb-8 opacity-95">
              Join 150+ businesses trusting Notroom for professional registered office services. Get started in minutes with our secure online application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={scrollToBooking}
                className="text-lg px-8 py-6"
              >
                Start Your Application
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary-foreground/20 hover:border-primary-foreground/40 hover:bg-primary-foreground/10"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                <Phone className="mr-2 w-5 h-5" />
                Questions? Call Us
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>PA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Same-Day Setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CropServices;
