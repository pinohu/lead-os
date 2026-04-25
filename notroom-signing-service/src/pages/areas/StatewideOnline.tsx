import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Video, Clock, Shield, CheckCircle, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatewideOnline = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const benefits = [
    "Available by appointment - including evenings, weekends, and holidays",
    "Complete notarization in as little as 5 minutes",
    "No travel required - work from home, office, or anywhere",
    "Legally valid in all 50 states",
    "Bank-level 256-bit encryption security",
    "Digital certificate delivered immediately via email",
    "Session recording stored securely for 10 years",
    "Multi-factor authentication and identity verification"
  ];

  const documents = [
    { category: "Real Estate", items: ["Purchase agreements", "Refinance documents", "HELOC applications", "Property disclosures"] },
    { category: "Legal", items: ["Powers of attorney", "Affidavits", "Sworn statements", "Contracts"] },
    { category: "Business", items: ["Operating agreements", "Partnership agreements", "Corporate resolutions", "Vendor contracts"] },
    { category: "Personal", items: ["Healthcare directives", "Living wills", "Permission letters", "Consent forms"] }
  ];

  const regions = [
    "Philadelphia Metro", "Pittsburgh Area", "Harrisburg-York-Lancaster", "Lehigh Valley",
    "Scranton-Wilkes-Barre", "Erie Region", "Reading Area", "State College",
    "Williamsport", "Altoona", "Johnstown", "All Rural Pennsylvania"
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Remote Online Notary Pennsylvania Statewide",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Notroom",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Erie",
        "addressRegion": "PA",
        "addressCountry": "US"
      }
    },
    "areaServed": {
      "@type": "State",
      "name": "Pennsylvania"
    },
    "description": "Statewide remote online notary service (RON) available by appointment anywhere in Pennsylvania. Secure video notarization from home. No travel required.",
    "offers": {
      "@type": "Offer",
      "price": "60",
      "priceCurrency": "USD"
    }
  };

  return (
    <Layout>
      <SEO
        title="Remote Online Notary Pennsylvania Statewide - RON Service PA"
        description="Remote online notary (RON) available by appointment anywhere in Pennsylvania. Get documents notarized via secure video call from home. Fast, convenient, legally valid. $60. Book now!"
        keywords="remote online notary pennsylvania, RON service PA, online notarization pennsylvania, statewide notary PA, virtual notary pennsylvania"
        canonical="https://notroom.com/areas/statewide-online"
        schema={schema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Available Statewide by Appointment
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Remote Online Notary Service Anywhere in Pennsylvania
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Get documents notarized from anywhere in PA via secure video call. No travel, no waiting rooms, no hassle. Available by appointment including evenings, weekends, and holidays.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Book Online Session - $60
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/resources/how-ron-works")}
              >
                How RON Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why RON */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Remote Online Notarization?</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">5-Minute Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Complete notarization faster than driving to a notary office
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Travel Needed</h3>
                <p className="text-sm text-muted-foreground">
                  Connect from home, office, or anywhere with internet
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Flexible Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  By appointment - including evenings, weekends, and holidays
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Ultra Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Bank-level encryption and tamper-evident seals
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Statewide Coverage */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Serving All of Pennsylvania</h2>
            <Card className="p-6 bg-primary/10 border-primary mb-8 max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2 text-primary">Important Location Requirement</h3>
                  <p className="text-sm">
                    RON services are available to individuals physically located anywhere in Pennsylvania during the notarization session. You must be physically present in Pennsylvania at the time of the video session, but we can accommodate appointments from any PA county or municipality.
                  </p>
                </div>
              </div>
            </Card>
            <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
              Remote Online Notary is available to anyone in Pennsylvania with an internet connection. No matter where you are in the state, you have access to professional notarization.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regions.map((region, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                  <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Book Your Session</h3>
                    <p className="text-muted-foreground">
                      Schedule online in seconds. You'll receive immediate confirmation and a link to our secure video platform.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Upload Document</h3>
                    <p className="text-muted-foreground">
                      Securely upload your document to our encrypted platform. We accept PDFs, Word docs, and most common formats.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Verify Identity</h3>
                    <p className="text-muted-foreground">
                      Join the video call with your government-issued ID. Our system performs secure identity verification as required by Pennsylvania law.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Get Notarized</h3>
                    <p className="text-muted-foreground">
                      Meet with a licensed Pennsylvania notary via secure video. The session is recorded and your document is digitally signed and sealed.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Receive Document</h3>
                    <p className="text-muted-foreground">
                      Your notarized document with digital certificate is emailed immediately. The original is stored securely for 10 years.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Documents We Notarize</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {documents.map((category, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-bold mb-4 text-primary">{category.category}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Pennsylvania Residents Choose Our RON Service</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Simple, Transparent Pricing</h2>
            <Card className="p-8">
              <div className="text-5xl font-bold text-primary mb-4">$60</div>
              <div className="text-xl text-muted-foreground mb-2">per notarization session</div>
              <div className="text-sm text-muted-foreground mb-6">$5 notary fee + $55 platform/technology fee</div>
              <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Includes digital certificate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Secure 10-year document storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>No hidden fees or travel charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>Same price for all appointments - no weekend surcharge</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mb-6">
                Pennsylvania law limits notary fees to $15 per signature. Additional fees shown are for technology platform, secure storage, and administrative services.
              </p>
              <Button size="lg" onClick={scrollToBooking}>
                Book Online Session Now
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Remote Online Notary Session</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Discover the convenience of Remote Online Notary. Available by appointment statewide for Pennsylvania residents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Start Your Session - $60
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground opacity-90 hover:opacity-100"
              onClick={() => window.location.href = "tel:814-480-0989"}
            >
              Questions? Call (814) 480-0989
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StatewideOnline;
