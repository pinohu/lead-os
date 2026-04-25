import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Video, Car, FileText, Globe, Users, Building2, CheckCircle, Phone, Mail, Briefcase, Clock, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const MercerCounty = () => {
  const navigate = useNavigate();
  
  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cities = [
    "Sharon", "Hermitage", "Farrell", "Grove City", "Sharpsville",
    "Greenville", "Mercer", "Stoneboro", "Sandy Lake", "Clark"
  ];

  const services = [
    {
      icon: Video,
      title: "Remote Online Notary (RON)",
      price: "$60",
      description: "Get documents notarized online from anywhere in Mercer County via secure video call",
      features: ["Available 24/7", "Complete in 5 minutes", "Legally valid in all 50 states"],
      link: "/services/remote-online-notary"
    },
    {
      icon: Car,
      title: "Mobile Notary Service",
      price: "$125+",
      description: "We travel to your location in Sharon, Hermitage, Grove City, or anywhere in Mercer County",
      features: ["Same-day available", "Home, office, or hospital visits", "After-hours service"],
      link: "/services/mobile-notary"
    },
    {
      icon: FileText,
      title: "Loan Signing Agent",
      price: "$175",
      description: "Certified loan signing services for real estate closings throughout Mercer County",
      features: ["NNA certified", "$100K E&O insurance", "Mobile service to your location"],
      link: "/services/loan-signing-agent"
    },
    {
      icon: Globe,
      title: "Apostille Services",
      price: "$245+",
      description: "International document authentication for Mercer County residents",
      features: ["PA Dept of State processing", "Standard & expedited options", "Full-chain authentication"],
      link: "/services/apostille"
    },
    {
      icon: Users,
      title: "I-9 Verification",
      price: "$85+",
      description: "Employment verification services for Mercer County businesses",
      features: ["In-person verification", "Remote E-Verify option", "Volume discounts available"],
      link: "/services/i9-verification"
    },
    {
      icon: Building2,
      title: "Registered Office & Business Filings",
      price: "$149/yr",
      description: "Pennsylvania business formation and registered office services",
      features: ["LLC & Corporation formation", "Registered agent service", "Compliance management"],
      link: "/services/registered-office"
    },
    {
      icon: Briefcase,
      title: "Business Retainer Plans",
      price: "$399+",
      description: "Monthly plans for Mercer County businesses with ongoing notary needs",
      features: ["Volume discounts", "Priority scheduling", "Dedicated account manager"],
      link: "/services/business-retainer"
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Notroom - Complete Notary & Business Services - Mercer County, PA",
    "description": "Full-service notary and business filing services in Mercer County, PA. Remote online notary, mobile notary, loan signing, apostille, I-9 verification, registered office, and business formation serving Sharon, Hermitage, Grove City, and all surrounding areas.",
    "areaServed": {
      "@type": "State",
      "name": "Pennsylvania",
      "containsPlace": [
        {"@type": "City", "name": "Sharon"},
        {"@type": "City", "name": "Hermitage"},
        {"@type": "City", "name": "Grove City"},
        {"@type": "City", "name": "Mercer County"}
      ]
    },
    "telephone": "814-480-0989",
    "email": "support@notroom.com",
    "priceRange": "$60-$500",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Notary and Business Services",
      "itemListElement": [
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Remote Online Notary"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Mobile Notary"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Loan Signing Agent"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Apostille Services"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "I-9 Verification"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Registered Office"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Business Retainer Plans"}}
      ]
    }
  };

  return (
    <Layout>
      <SEO
        title="Mercer County Notary & Business Services | Sharon, Hermitage, Grove City PA | RON, Mobile, Apostille, I-9, LLC Formation"
        description="Complete notary and business services in Mercer County, PA. Remote online notary (RON), mobile notary, loan signing agent, apostille services, I-9 verification, registered office, LLC formation. Serving Sharon, Hermitage, Grove City, Farrell. Same-day available. Licensed & bonded."
        keywords="Mercer County notary, Sharon PA notary, Hermitage notary, Grove City notary, mobile notary Mercer County, online notary Sharon PA, loan signing agent Hermitage, apostille Mercer County, I-9 verification Grove City, registered agent Mercer County, LLC formation Sharon PA, business filing Mercer County"
        canonical="https://notroom.com/areas/mercer-county"
        schema={schema}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary-dark to-accent overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-primary-foreground/20">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Serving All of Mercer County</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Complete Notary & Business Services<br />for Mercer County
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
              RON, Mobile Notary, Loan Signing, Apostille, I-9 Verification, LLC Formation & More serving Sharon, Hermitage, Grove City, and all surrounding areas
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={scrollToBooking}
                variant="secondary"
                className="text-lg px-8 py-6 h-auto shadow-xl"
              >
                Book Any Service Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 h-auto"
              >
                <Link to="/services/remote-online-notary">View All Services</Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Licensed & Bonded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Same-Day Available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Background Checked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Services */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Services for Mercer County</h2>
            <p className="text-xl text-muted-foreground">From notarization to business formation - everything you need in one place</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <div className="text-2xl font-bold text-primary mb-3">{service.price}</div>
                  <p className="text-muted-foreground mb-4 text-sm">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link to={service.link}>Learn More</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cities Served */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Communities We Serve in Mercer County</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {cities.map((city) => {
                const cityLinks: Record<string, string> = {
                  "Sharon": "/areas/sharon-pa",
                  "Hermitage": "/areas/hermitage-pa",
                  "Grove City": "/areas/grove-city-pa",
                  "Mercer": "/areas/mercer-pa",
                  "Farrell": "/areas/farrell-pa",
                  "Sharpsville": "/areas/sharpsville-pa",
                  "Greenville": "/areas/greenville-pa",
                  "Stoneboro": "/areas/stoneboro-pa",
                  "Sandy Lake": "/areas/sandy-lake-pa",
                  "Clark": "/areas/clark-pa"
                };
                const cityLink = cityLinks[city];
                
                if (cityLink) {
                  return (
                    <Link key={city} to={cityLink} className="text-center p-4 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow hover:border-primary border-2 border-transparent">
                      <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="font-medium">{city}</p>
                    </Link>
                  );
                }
                
                return (
                  <div key={city} className="text-center p-4 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="font-medium">{city}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-muted-foreground mt-6">
              And all surrounding Mercer County communities. Click on a city for location-specific information.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Mercer County Trusts Notroom</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Fast Response</h3>
                <p className="text-muted-foreground">Same-day mobile appointments available throughout Mercer County</p>
              </Card>

              <Card className="p-6 text-center">
                <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Transparent Pricing</h3>
                <p className="text-muted-foreground">No hidden fees. Know the exact cost before booking</p>
              </Card>

              <Card className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Fully Licensed</h3>
                <p className="text-muted-foreground">Pennsylvania-commissioned, bonded, and background-checked</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Book Your Service in Mercer County Today</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            From notarization to business formation - complete services for Sharon, Hermitage, Grove City, and beyond
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={scrollToBooking}
              variant="secondary"
            >
              Book Any Service
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
            <a href="tel:814-480-0989" className="flex items-center gap-2 hover:underline">
              <Phone className="w-4 h-4" />
              814-480-0989
            </a>
            <a href="mailto:support@notroom.com" className="flex items-center gap-2 hover:underline">
              <Mail className="w-4 h-4" />
              support@notroom.com
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MercerCounty;
