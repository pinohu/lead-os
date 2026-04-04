import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Car, Home, Check, Users, Building, Globe, FileCheck, FileText, Fingerprint, UserCheck, Camera, Languages, CarFront, Heart, Scale, Mail, FileInput, Search } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { useNavigate } from "react-router-dom";
import { memo, useState } from "react";
import { siteConfig } from "@/constants/siteConfig";

const Services = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("popular");

  // Core/Popular Services - Most frequently used
  const popularServices = [
    {
      icon: Monitor,
      badge: "Most Popular",
      title: "Remote Online Notary (RON)",
      price: "$60",
      priceDetail: "Standard docs | Real estate $95",
      description: "Notarize from anywhere via secure video call. Perfect for powers of attorney, affidavits, contracts, and most legal documents.",
      features: [
        "Available by appointment, including evenings & weekends",
        "Average 5-minute sessions",
        "Business subscription: $399/mo for 10 acts",
        "Instant digital delivery"
      ],
      ctaText: "Learn More",
      featured: true,
      link: "/services/remote-online-notary"
    },
    {
      icon: Car,
      badge: "Same-Day",
      title: "Mobile Notary Service",
      price: "$125+",
      priceDetail: "$5-15 notary + travel fees",
      description: "We'll come to you anywhere in Erie County. Home, office, hospital, or care facility. Perfect for those who prefer in-person service.",
      features: [
        "Same-day appointments available",
        "Evening & weekend appointments",
        "Serving Erie, Crawford, Warren counties",
        "Itemized pricing (notary + travel + admin)"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/mobile-notary"
    },
    {
      icon: Home,
      badge: "Certified",
      title: "Loan Signing Agent",
      price: "$175",
      priceDetail: "Purchase/refi | Hybrid e-closing $225",
      description: "Certified signing agent for real estate transactions. Working with title companies, lenders, and real estate professionals.",
      features: [
        "Background-checked & certified",
        "Experienced with all loan types",
        "Bonded & E&O insured",
        "Print, scan & ship included"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/loan-signing-agent"
    },
    {
      icon: Globe,
      badge: "International",
      title: "Apostille Services",
      price: "$245",
      priceDetail: "7-10 days | Expedited $395",
      description: "Professional apostille assistance for international documents. We handle PA Department of State submissions.",
      features: [
        "PA state fee $15 included",
        "Document notarization included",
        "Application prep & submission",
        "Full-chain authentication $495"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/apostille"
    },
    {
      icon: Users,
      badge: "Employers",
      title: "I-9 Verification",
      price: "$85",
      priceDetail: "In-person | Remote $125",
      description: "DHS-compliant I-9 employment verification. In-person at your location or remote for E-Verify employers.",
      features: [
        "E-Verify alternative procedure",
        "Authorized representative service",
        "Volume discounts: $65-75 each",
        "Same-day appointments"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/i9-verification"
    },
    {
      icon: FileCheck,
      badge: "Quick",
      title: "Certified Copies",
      price: "$20",
      priceDetail: "Per document | Same-day available",
      description: "Official certified copies of important documents. Birth certificates, diplomas, passports. Accepted for legal and immigration purposes.",
      features: [
        "Official notary seal & signature",
        "Same-day service available",
        "Legally valid worldwide",
        "All document types accepted"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/certified-copies"
    },
    {
      icon: UserCheck,
      badge: "Neutral",
      title: "Professional Witness",
      price: "$60+",
      priceDetail: "$60 + $1.50/mile travel",
      description: "Neutral third-party witness for private agreements and contracts. Lower cost alternative when notarization isn't required.",
      features: [
        "Professional verification",
        "Mobile service available",
        "Private contracts & agreements",
        "Impartial third-party"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/witness-service"
    }
  ];

  // Business & Legal Services
  const businessServices = [
    {
      icon: Building,
      badge: siteConfig.isOfficialCropApproved ? "Approved CROP" : "CROP-Ready",
      title: "Registered Office & CROP (PA)",
      price: "$149/yr",
      priceDetail: siteConfig.isOfficialCropApproved
        ? "Professional PA address | Approved PA CROP"
        : "Professional PA address | CROP-ready services",
      description: siteConfig.isOfficialCropApproved
        ? "Notroom is an approved Commercial Registered Office Provider (CROP) in Pennsylvania. Use our official registered office address for LLCs, corporations, and foreign entities."
        : "Use Notroom as your official Pennsylvania registered office and CROP for LLCs, corporations, and foreign entities. We support businesses that need a PA Commercial Registered Office Provider.",
      features: [
        "Physical PA address for state compliance",
        "Annual compliance reminders & support",
        "Bundle with RON, mobile notary & filings",
        "Professional business presence"
      ],
      ctaText: "Learn More",
      featured: true,
      link: "/crop"
    },
    {
      icon: Users,
      badge: "Coordination",
      title: "Transaction Coordination",
      price: "$299+",
      priceDetail: "Per transaction",
      description: "Expert coordination for complex transactions. We manage documents, deadlines, and communication so you can focus on closing your deal successfully.",
      features: [
        "Multi-party coordination & communication",
        "Document collection & organization",
        "Timeline management & deadline tracking",
        "Progress reporting & status updates"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/transaction-coordination"
    },
    {
      icon: FileCheck,
      badge: "Formation",
      title: "LLC & Entity Setup Support",
      price: "$249",
      priceDetail: "Full formation | Includes EIN",
      description: "Complete business formation services. LLC creation, EIN registration, and ongoing compliance support.",
      features: [
        "LLC/Corporation formation",
        "Federal EIN registration",
        "Operating agreement templates",
        "Ongoing compliance assistance"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/registered-office"
    },
    {
      icon: Users,
      badge: "Volume",
      title: "Business Retainer Plans",
      price: "$399/mo",
      priceDetail: "10 acts | Additional $30-35 each",
      description: "Volume discounts for companies requiring frequent notary services. Perfect for law firms, real estate agencies, and businesses.",
      features: [
        "Dedicated service priority",
        "Volume discounts available",
        "RON & mobile services included",
        "Monthly billing & reporting"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/business-retainer"
    },
    {
      icon: FileInput,
      badge: "Filing",
      title: "UCC Filing",
      price: "$125",
      priceDetail: "Full service including state fees",
      description: "Professional UCC-1 filing assistance. We handle preparation, submission, and confirmation with PA Department of State.",
      features: [
        "UCC-1 preparation",
        "State filing included",
        "Filing confirmation",
        "Expert guidance"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/ucc-filing"
    },
    {
      icon: Mail,
      badge: "Business",
      title: "Virtual Mailbox",
      price: "$50/mo",
      priceDetail: "Monthly subscription",
      description: "Professional business address with mail scanning and forwarding. Perfect for remote businesses and entrepreneurs.",
      features: [
        "PA street address",
        "Mail scanning",
        "Package handling",
        "Forwarding included"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/virtual-mailbox"
    }
  ];

  // Specialized Services
  const specializedServices = [
    {
      icon: Camera,
      badge: "Quick",
      title: "Passport Photos",
      price: "$15",
      priceDetail: "Per session | Digital & print",
      description: "Government-compliant passport and visa photos. Quick turnaround with both digital and print copies provided.",
      features: [
        "Government-compliant photos",
        "Digital & print copies",
        "Same-day service",
        "All visa types accepted"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/passport-photos"
    },
    {
      icon: Languages,
      badge: "Certified",
      title: "Translation Certification",
      price: "$35+",
      priceDetail: "Per page | Multiple languages",
      description: "Notarized certification of translated documents. Perfect for immigration, legal, and business documents.",
      features: [
        "Notarized certification",
        "Immigration documents",
        "Legal translations",
        "Multiple languages"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/translation-certification"
    },
    {
      icon: CarFront,
      badge: "Mobile",
      title: "Vehicle Title Transfer",
      price: "$40+",
      priceDetail: "$40 + $1.50/mile travel",
      description: "PA vehicle title notarization. We can come to you or meet at a convenient location for title transfers.",
      features: [
        "Title notarization",
        "Mobile service available",
        "Fast & convenient",
        "Buyer & seller present"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/vehicle-title-transfer"
    },
    {
      icon: Search,
      badge: "Retrieval",
      title: "Document Retrieval",
      price: "$75+",
      priceDetail: "Base fee + government fees",
      description: "Professional document retrieval from courthouses and government offices. Save time and hassle.",
      features: [
        "Court documents",
        "Vital records",
        "Property records",
        "Fast turnaround"
      ],
      ctaText: "Learn More",
      featured: false,
      link: "/services/document-retrieval"
    }
  ];

  const handleServiceClick = (link: string) => {
    navigate(link);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const renderServiceCard = (service: typeof popularServices[0], index: number) => {
    const Icon = service.icon;
    return (
      <ScrollReveal key={`${service.title}-${index}`} delay={index * 100}>
        <Card 
          className={`relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group h-full ${
            service.featured ? 'border-[hsl(var(--urgency-amber))] border-4' : ''
          }`}
          role="article"
          aria-label={`${service.title} service card`}
        >
          {/* Badge */}
          {service.badge && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-amber text-primary-foreground px-4 py-1 text-sm font-semibold shadow-lg">
                {service.badge}
              </Badge>
            </div>
          )}

          <CardContent className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <Icon className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-3 text-foreground">
              {service.title}
            </h3>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary">{service.price}</div>
              <div className="text-sm text-muted-foreground">{service.priceDetail}</div>
            </div>

            {/* Description */}
            <p className="text-center text-muted-foreground mb-6 leading-relaxed">
              {service.description}
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8" aria-label="Service features">
              {service.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button - Mobile optimized touch target */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 min-h-[56px] shadow-md hover:shadow-lg transition-all touch-manipulation"
              onClick={() => handleServiceClick(service.link)}
              aria-label={`Learn more about ${service.title}`}
            >
              {service.ctaText} →
            </Button>
          </CardContent>
        </Card>
      </ScrollReveal>
    );
  };

  return (
    <section id="services" className="py-20 bg-background" aria-labelledby="services-heading">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-primary font-semibold text-sm">Complete Notary & Business Services</span>
          </div>
          <h2 id="services-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Professional Services in Erie & Surrounding Counties
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our services by category to find exactly what you need
          </p>
        </div>

        {/* Tabbed Service Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 mb-12 h-auto" aria-label="Service categories">
            <TabsTrigger value="popular" className="text-sm md:text-base py-3" aria-label="View most popular services">
              <Monitor className="w-4 h-4 mr-2" aria-hidden="true" />
              Most Popular
            </TabsTrigger>
            <TabsTrigger value="business" className="text-sm md:text-base py-3" aria-label="View business services">
              <Building className="w-4 h-4 mr-2" aria-hidden="true" />
              Business Services
            </TabsTrigger>
            <TabsTrigger value="specialized" className="text-sm md:text-base py-3" aria-label="View specialized services">
              <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
              Specialized
            </TabsTrigger>
          </TabsList>

          {/* Popular Services Tab */}
          <TabsContent value="popular" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {popularServices.map((service, index) => renderServiceCard(service, index))}
            </div>
          </TabsContent>

          {/* Business Services Tab */}
          <TabsContent value="business" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {businessServices.map((service, index) => renderServiceCard(service, index))}
            </div>
          </TabsContent>

          {/* Specialized Services Tab */}
          <TabsContent value="specialized" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {specializedServices.map((service, index) => renderServiceCard(service, index))}
            </div>
          </TabsContent>
        </Tabs>

        {/* View All Services CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need help choosing? View our complete pricing guide or use our calculator.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto min-h-[48px] touch-manipulation"
              onClick={() => navigate("/pricing")}
              aria-label="View complete pricing guide"
            >
              View All Pricing
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto min-h-[48px] touch-manipulation"
              onClick={() => navigate("/calculator")}
              aria-label="Use interactive price calculator"
            >
              Calculate Your Price
            </Button>
            <Button 
              variant="amber" 
              size="lg"
              className="w-full sm:w-auto min-h-[48px] font-bold touch-manipulation hover-lift"
              onClick={scrollToBooking}
              aria-label="Book a service now"
            >
              📅 Book a Service
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

Services.displayName = 'Services';

export default Services;
