import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, FileText, Users, Clock, Shield, ArrowRight, Phone, Mail, Calendar, Target, Handshake, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";
import { TC_PLANS } from "@/constants/tcPlans";

const TransactionCoordination = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/transaction-coordination/application");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const serviceSchema = generateServiceSchema({
    name: "Transaction Coordination Services",
    description: "Professional transaction coordination services for real estate, business sales, mergers, contract negotiations, and complex multi-party transactions. Expert coordination, document management, and deadline tracking.",
    provider: "Notroom - Professional Transaction Coordination",
    areaServed: "Pennsylvania",
    price: "299",
    url: "https://notroom.com/transaction-coordination"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Business Services", url: "https://notroom.com/transaction-coordination" },
    { name: "Transaction Coordination", url: "https://notroom.com/transaction-coordination" }
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is transaction coordination?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Transaction coordination is a professional service that manages the complex process of multi-party transactions. Our coordinators handle document collection, deadline tracking, communication between parties, meeting scheduling, and ensure all requirements are met for successful transaction completion."
        }
      },
      {
        "@type": "Question",
        "name": "What types of transactions do you coordinate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We coordinate a wide range of transactions including real estate closings, business sales and acquisitions, mergers, contract negotiations, settlement agreements, and other complex multi-party deals. Our service adapts to your specific transaction needs."
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
      name: TC_PLANS.basic.name,
      price: TC_PLANS.basic.price,
      period: TC_PLANS.basic.period,
      description: TC_PLANS.basic.description,
      features: TC_PLANS.basic.features,
      idealFor: TC_PLANS.basic.idealFor,
      cta: "Get Started",
      highlighted: false
    },
    {
      name: TC_PLANS.standard.name,
      price: TC_PLANS.standard.price,
      period: TC_PLANS.standard.period,
      description: TC_PLANS.standard.description,
      features: TC_PLANS.standard.features,
      idealFor: TC_PLANS.standard.idealFor,
      cta: "Most Popular",
      highlighted: true
    },
    {
      name: TC_PLANS.premium.name,
      price: TC_PLANS.premium.price,
      period: TC_PLANS.premium.period,
      description: TC_PLANS.premium.description,
      features: TC_PLANS.premium.features,
      idealFor: TC_PLANS.premium.idealFor,
      cta: "Best Value",
      highlighted: false
    }
  ];

  const howItWorksSteps = [
    {
      number: "1",
      title: "Complete Transaction Intake Form",
      description: "Share details about your transaction: type, parties involved, key documents, timeline, and coordination needs. Our secure intake form takes about 10-15 minutes to complete. We'll review your information and prepare a customized coordination plan.",
      icon: FileText
    },
    {
      number: "2",
      title: "Choose Your Coordination Plan",
      description: "Select the plan that matches your transaction complexity. Basic for straightforward deals, Standard for moderate complexity, or Premium for high-stakes transactions requiring dedicated support. Pay securely online via credit card.",
      icon: CheckCircle
    },
    {
      number: "3",
      title: "Get Assigned Your Coordinator",
      description: "Within 24 hours, you'll receive an introduction to your assigned transaction coordinator. They'll review your transaction details, establish communication channels, and create a detailed timeline with milestones and deadlines.",
      icon: Users
    },
    {
      number: "4",
      title: "We Coordinate, You Focus",
      description: "Your coordinator manages document collection, schedules meetings, facilitates communication between parties, tracks deadlines, and ensures compliance. You receive regular updates and can focus on the business aspects of your transaction.",
      icon: Handshake
    }
  ];

  const whoNeedsTc = [
    {
      title: "Real Estate Buyers & Sellers",
      description: "Complex real estate transactions with multiple contingencies, inspections, financing requirements, and closing coordination. We ensure all parties stay aligned, deadlines are met, and documents are properly executed.",
      icon: Shield
    },
    {
      title: "Business Owners Selling Companies",
      description: "Selling a business involves numerous parties—buyers, sellers, attorneys, accountants, lenders. Our coordination ensures due diligence flows smoothly, all documentation is complete, and closing happens on schedule.",
      icon: FileText
    },
    {
      title: "Companies Undergoing Mergers",
      description: "Merger transactions require careful coordination of legal, financial, and operational teams. We manage the complex process, track regulatory requirements, coordinate approvals, and ensure all parties meet their obligations.",
      icon: Users
    },
    {
      title: "Parties in Contract Negotiations",
      description: "Complex contract negotiations benefit from neutral coordination. We facilitate communication, manage document versions, track negotiation points, schedule meetings, and ensure all parties have what they need to make informed decisions.",
      icon: Handshake
    }
  ];

  const whatYouGet = [
    {
      title: "Document Collection & Organization",
      description: "We collect all required documents from all parties, organize them systematically, track versions, and ensure nothing is missing. Documents are securely stored and accessible through your client portal.",
      icon: FileText
    },
    {
      title: "Timeline Management & Deadline Tracking",
      description: "Every transaction has critical deadlines—inspection periods, financing contingencies, closing dates. We create a comprehensive timeline, send proactive reminders, and ensure all parties meet their obligations on time.",
      icon: Calendar
    },
    {
      title: "Multi-Party Communication Coordination",
      description: "Complex transactions involve multiple parties with different interests and communication styles. We serve as the central hub, facilitating clear communication, scheduling meetings, and ensuring everyone stays informed.",
      icon: Users
    },
    {
      title: "Meeting Scheduling & Facilitation",
      description: "We coordinate schedules across all parties, set up virtual or in-person meetings, prepare agendas, and ensure productive discussions. For Premium plans, we can facilitate meetings and document key decisions.",
      icon: Clock
    },
    {
      title: "Progress Reporting & Status Updates",
      description: "Stay informed with regular progress reports. You'll know exactly where your transaction stands, what's been completed, what's pending, and any potential issues that need attention. No surprises.",
      icon: Target
    },
    {
      title: "Transaction Completion Support",
      description: "We ensure all final documents are properly executed, all conditions are met, and closing happens smoothly. Post-transaction, we provide a completion certificate and any follow-up documentation needed.",
      icon: CheckCircle
    }
  ];

  return (
    <Layout>
      <SEO
        title="Transaction Coordination Services | Professional Multi-Party Transaction Management | Notroom"
        description="Professional transaction coordination services for real estate, business sales, mergers, and complex multi-party transactions. Expert coordination, document management, deadline tracking. From $299 per transaction."
        keywords="transaction coordination, real estate coordination, business sale coordination, merger coordination, contract negotiation support, multi-party transaction management, Pennsylvania transaction services, Erie PA transaction coordination"
        canonical="https://notroom.com/transaction-coordination"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20 pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0 text-sm px-4 py-1">
              Professional Coordination • Multi-Party Management • Trusted by 50+ Transactions
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Transaction Coordination Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-95 leading-relaxed">
              Expert coordination for complex transactions. We manage documents, deadlines, and communication so you can focus on what matters—closing your deal successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                Start Your Transaction Coordination
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary-foreground/20 hover:border-primary-foreground/40 hover:bg-primary-foreground/10"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                <Phone className="mr-2 w-5 h-5" />
                Schedule a Consultation
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              Transparent pricing • Experienced coordinators • Secure document handling
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

      {/* Who Needs Transaction Coordination */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Needs Transaction Coordination?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Complex transactions involve multiple parties, numerous documents, and critical deadlines. Professional coordination ensures nothing falls through the cracks.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {whoNeedsTc.map((item, index) => (
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
                <strong>When to Consider Coordination:</strong> Transactions with 3+ parties, multiple documents, tight deadlines, regulatory requirements, or when you need a neutral party to manage the process. Our coordinators are experienced professionals who understand the complexities of business and real estate transactions.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Get with Transaction Coordination</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Comprehensive support throughout your entire transaction. From initial intake to successful completion, we're your dedicated coordination partner.
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
                Choose the coordination plan that matches your transaction complexity. All plans include secure document handling and professional coordination.
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
                  <p className="text-muted-foreground mb-4 min-h-[3rem]">{plan.description}</p>
                  <div className="mb-6 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Ideal For:</p>
                    <p className="text-sm text-foreground">{plan.idealFor}</p>
                  </div>
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
                <strong>Note:</strong> Pricing is per transaction. For multiple transactions or ongoing coordination needs, contact us for custom pricing. All plans include secure document storage, deadline tracking, and professional coordination support.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How Transaction Coordination Works</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A straightforward process designed to get your transaction coordinated quickly and efficiently.
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
                Start Your Transaction Coordination
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
                Common questions about our transaction coordination services.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What is transaction coordination?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Transaction coordination is a professional service that manages the complex process of multi-party transactions. Our coordinators handle document collection and organization, deadline tracking, communication between parties, meeting scheduling, progress reporting, and ensure all requirements are met for successful transaction completion. Think of us as your project manager for the transaction.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What types of transactions do you coordinate?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  We coordinate a wide range of transactions including real estate closings (residential and commercial), business sales and acquisitions, mergers and acquisitions, contract negotiations, settlement agreements, partnership formations, and other complex multi-party deals. Our service adapts to your specific transaction needs and can handle transactions with 2-10+ parties.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  How long does transaction coordination take?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Coordination duration depends on your transaction timeline. Simple transactions may take 2-4 weeks, while complex business sales or mergers can take 2-6 months. We work within your timeline and ensure all parties stay on track. Your coordinator will create a detailed timeline during the initial setup phase, and you'll receive regular updates on progress.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Do you provide legal advice or act as an attorney?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  No. Transaction coordination is a non-legal administrative service. We coordinate documents, deadlines, and communication, but we do not provide legal advice, draft legal documents, or represent parties. All parties should have their own legal counsel for legal matters. We work alongside attorneys, accountants, and other professionals to ensure smooth coordination.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  How do you ensure confidentiality?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Confidentiality is paramount. All documents are stored securely in encrypted systems. We require confidentiality agreements from all coordinators. Access to documents is restricted to authorized parties only. We follow strict data protection protocols and comply with applicable privacy laws. Your transaction details are never shared outside the coordination team without your explicit permission.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What happens if a transaction doesn't close?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  If a transaction doesn't close due to circumstances beyond our control (e.g., financing falls through, inspection issues, party withdrawal), coordination services provided up to that point are still billable. However, if a transaction is cancelled within 48 hours of starting coordination and no substantial work has been performed, we'll refund 80% of the fee. We're committed to fair and transparent pricing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  Can I upgrade or downgrade my plan during the transaction?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  Yes. If your transaction complexity changes, you can upgrade to a higher plan (paying the difference) or downgrade (receiving a prorated credit). Changes must be requested before significant work begins on the new plan level. Your coordinator can help assess whether a plan change makes sense for your situation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  What information do I need to provide to get started?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                  To get started, you'll need: transaction type and description, parties involved (names and contact information), key documents already available, target completion date, urgency level, and any special requirements. The intake form guides you through all necessary information. Your coordinator will follow up if additional details are needed.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Coordinate Your Transaction?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Don't let coordination complexity slow down your transaction. Get professional support and ensure everything stays on track.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Start Transaction Coordination
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = "tel:814-480-0989"}
                className="text-lg px-8 py-6"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call (814) 480-0989
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Questions? Email us at <a href="mailto:support@notroom.com" className="text-primary hover:underline">support@notroom.com</a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TransactionCoordination;

