import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, Shield, Clock, CheckCircle, Package, Scan, AlertCircle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";

const VirtualMailbox = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const features = [
    { title: "Professional PA Street Address", desc: "Real physical address (not PO Box) for business cards and registrations", icon: MapPin },
    { title: "Mail Scanning & Digital Delivery", desc: "Scan and email your mail within 24 hours of receipt", icon: Scan },
    { title: "Mail Forwarding on Demand", desc: "Forward physical mail anywhere in the US when needed", icon: Package },
    { title: "24/7 Online Portal Access", desc: "View, download, and manage your mail anytime from any device", icon: Clock },
    { title: "Secure Document Vault", desc: "Store scanned documents securely in the cloud for 90 days", icon: Shield },
    { title: "Junk Mail Disposal", desc: "We shred and recycle junk mail so you only see what matters", icon: CheckCircle }
  ];

  const whoNeedsThis = [
    { type: "Remote Businesses", desc: "Work from anywhere while maintaining professional PA business presence" },
    { type: "Home-Based Businesses", desc: "Keep home address private and separate personal from business mail" },
    { type: "Digital Nomads", desc: "Receive important mail no matter where you are in the world" },
    { type: "Privacy-Conscious Professionals", desc: "Avoid publishing home address on public business records" },
    { type: "Multi-Location Companies", desc: "Centralize mail handling for Pennsylvania operations" },
    { type: "Startups & Freelancers", desc: "Professional image without expensive office space" }
  ];

  const faqs = [
    {
      question: "What's the difference between a virtual mailbox and a PO Box?",
      answer: "A virtual mailbox provides a real street address (not PO Box) which is required for most business registrations, bank accounts, and professional licenses. You get digital access to your mail 24/7 through an online portal, and can request forwarding anytime. PO Boxes don't offer scanning or digital access."
    },
    {
      question: "Can I use this address for my LLC or business registration?",
      answer: "Yes! Our service provides a legitimate Pennsylvania street address that's acceptable for Secretary of State business filings, professional licenses, and most other legal purposes. We can also serve as your registered office/agent for an additional fee."
    },
    {
      question: "How quickly do you scan mail after it arrives?",
      answer: "We scan your mail within 24 business hours of receipt. Urgent items can be scanned same-day upon request (additional fee may apply for rush service). You'll receive an email notification when new mail is scanned and available in your portal."
    },
    {
      question: "What happens to mail after you scan it?",
      answer: "After scanning, we hold your physical mail securely for 30 days. During this time, you can request forwarding to any address. After 30 days, we securely shred and dispose of mail unless you've requested forwarding. Scanned images remain in your online vault for 90 days."
    },
    {
      question: "Can you forward packages and larger mail?",
      answer: "Yes! We accept and store packages up to 30 lbs. You'll be notified when a package arrives and can request forwarding. Package forwarding fees are based on actual USPS postage plus a $5 handling fee per shipment."
    },
    {
      question: "Is there a setup fee or long-term contract?",
      answer: "No setup fee. Service is billed monthly at $99/month with no long-term contract required. You can cancel anytime with 30 days notice. First month is prorated based on your start date."
    },
    {
      question: "What if I receive important legal documents or time-sensitive mail?",
      answer: "We flag urgent-looking mail (legal notices, certified mail, etc.) for priority scanning within 4 hours. You can also provide us with a list of important senders to prioritize. We recommend checking your portal daily for time-sensitive matters."
    }
  ];

  const serviceSchema = generateServiceSchema({
    name: "Virtual Mailbox Services Erie, PA",
    description: "Professional virtual mailbox and mail forwarding service in Erie, PA. Digital mail scanning, forwarding, shredding. From $99/month.",
    provider: "Notroom - Virtual Mailbox",
    areaServed: "United States",
    price: "99",
    url: "https://notroom.com/services/virtual-mailbox"
  });

  const faqSchema = generateFAQSchema(faqs.map(f => ({ question: f.question, answer: f.answer })));

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Virtual Mailbox", url: "https://notroom.com/services/virtual-mailbox" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Virtual Mailbox Service Erie, PA | $99/month | Professional PA Business Address"
        description="Virtual mailbox Erie PA - $99/mo. Real PA street address, mail scanning, digital delivery, forwarding. For remote businesses, startups, digital nomads. No PO Box."
        keywords="virtual mailbox Erie PA, mail forwarding Pennsylvania, business mailbox, virtual address Erie, mail scanning service PA"
        canonical="https://notroom.com/services/virtual-mailbox"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Professional PA Business Address
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Virtual Mailbox Service</h1>
            <p className="text-xl mb-8 opacity-90">
              Get a professional Erie, PA street address with mail scanning, digital delivery, and forwarding. Perfect for remote businesses and digital nomads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Start Service - $99/month
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

      {/* Features Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Complete Virtual Mailbox Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6">
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Simple Monthly Pricing</h2>
            <Card className="p-8 border-primary border-2">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-primary mb-2">$99/mo</div>
                <p className="text-xl text-muted-foreground">All-inclusive service - no hidden fees</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">What's Included:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Real PA street address (not PO Box)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Unlimited mail scanning & digital delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>24/7 online portal access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Mail forwarding on request</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Package acceptance & storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Junk mail shredding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>90-day document vault</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Email notifications</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Additional Services:</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between">
                      <span>Mail forwarding</span>
                      <span className="font-semibold">Postage + $5 handling</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Package forwarding</span>
                      <span className="font-semibold">Postage + $5 handling</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Rush scanning (same-day)</span>
                      <span className="font-semibold">$10 per request</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Registered office/agent</span>
                      <span className="font-semibold">+$50/month</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Check deposit service</span>
                      <span className="font-semibold">$5 per check</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>No Setup Fee.</strong> First month prorated. Cancel anytime with 30 days notice. Your Erie, PA address is available for use immediately upon signup.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Who Benefits from Virtual Mailbox Service?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whoNeedsThis.map((item, index) => (
                <Card key={index} className="p-6 border-2">
                  <CheckCircle className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">{item.type}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How Virtual Mailbox Works</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Sign Up & Get Your Address</h3>
                    <p className="text-muted-foreground">
                      Complete Form 1583 (USPS authorization) and provide two forms of ID. You'll receive your Erie, PA street address immediately.
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
                    <h3 className="text-xl font-bold mb-2">Start Using Your Address</h3>
                    <p className="text-muted-foreground">
                      Update your business cards, website, registrations, and subscriptions with your new professional PA address.
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
                    <h3 className="text-xl font-bold mb-2">We Receive & Scan Your Mail</h3>
                    <p className="text-muted-foreground">
                      When mail arrives, we scan the envelope and upload it to your secure online portal within 24 hours. You receive an email notification.
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
                    <h3 className="text-xl font-bold mb-2">You Decide What to Do</h3>
                    <p className="text-muted-foreground">
                      Log in to your portal to view scanned mail. Choose to: (1) Open & scan contents, (2) Forward to any address, (3) Shred & dispose. It's that simple!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection 
        title="Virtual Mailbox FAQs"
        faqs={faqs}
      />

      {/* Local SEO */}
      <ServiceLocalSEO 
        serviceName="Virtual Mailbox Services"
        reviews={[
          { text: "Perfect for my online business. Professional Erie address without renting office space.", author: "Amanda R.", city: "Remote", rating: 5 },
          { text: "Mail scanning is fast and the portal is easy to use. Great for digital nomads.", author: "Carlos M.", city: "Remote", rating: 5 },
          { text: "Keeps my home address private while maintaining PA business presence. Excellent service.", author: "Jennifer K.", city: "Pittsburgh", rating: 5 },
          { text: "Used for my LLC registration. Real street address made everything official.", author: "David S.", city: "Philadelphia", rating: 5 }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready for Your Professional PA Address?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get a real Erie, PA street address with mail scanning and forwarding. Start today for just $99/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8">
                Start Service
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                Questions? Call Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default VirtualMailbox;