import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Shield, Home, Building, Hospital, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialProof from "@/components/marketing/SocialProof";
import GuaranteeSection from "@/components/marketing/GuaranteeSection";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateFAQSchema, generateBreadcrumbSchema, generateServiceSchema } from "@/utils/schemaGenerator";

const MobileNotary = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const locations = [
    { icon: Home, title: "Your Home", desc: "Convenient home visits throughout Erie County" },
    { icon: Building, title: "Office or Business", desc: "Professional notarization at your workplace" },
    { icon: Hospital, title: "Hospital or Care Facility", desc: "Compassionate service for healthcare settings" },
  ];

  const serviceAreas = [
    "Erie", "Millcreek", "Harborcreek", "Fairview", "Girard",
    "North East", "Wesleyville", "Lawrence Park", "Edinboro", "Union City"
  ];

  const serviceSchema = generateServiceSchema({
    name: "Mobile Notary Service Erie, PA",
    description: "Professional mobile notary service in Erie, Crawford, Warren, Mercer, and Venango counties. We travel to your home, office, hospital, or any location in northwestern Pennsylvania for convenient document notarization.",
    provider: "Notroom - Erie, PA Mobile Notary",
    areaServed: "Northwestern Pennsylvania",
    price: "125",
    url: "https://notroom.com/services/mobile-notary"
  });

  const faqSchema = generateFAQSchema([
    {
      question: "How much does mobile notary service cost in Erie, PA?",
      answer: "Mobile notary service starts at $125 base ($5 PA notary fee per signature + $120 service fee for travel, coordination, and scheduling) plus $1.50 per mile travel from our Erie office. Same-day service is typically available throughout Erie, Crawford, and Warren counties. We provide transparent quotes before every appointment with clear fee breakdown."
    },
    {
      question: "Where do mobile notaries serve in Pennsylvania?",
      answer: "We serve all of Erie County including Erie, Millcreek, Harborcreek, Fairview, North East, Girard. Also Crawford County (Meadville, Titusville), Warren County (Warren, Youngsville), Mercer County (Sharon, Hermitage, Grove City), and Venango County (Oil City, Franklin)."
    },
    {
      question: "How fast can a mobile notary arrive in Erie?",
      answer: "For mobile notary in Erie County, we typically arrive within 30-60 minutes during business hours depending on location and schedule. Same-day appointments are usually available. Emergency service may be available for urgent needs."
    },
    {
      question: "Can mobile notaries visit hospitals and nursing homes in Erie, PA?",
      answer: "Yes! We provide compassionate mobile notary service at all Erie area hospitals, nursing homes, assisted living facilities, and senior care centers. We're experienced with healthcare settings and understand special accommodation needs."
    }
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: "Services", url: "https://notroom.com/#services" },
    { name: "Mobile Notary", url: "https://notroom.com/services/mobile-notary" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Mobile Notary Erie, PA | We Come to You | Crawford, Warren, Mercer Counties | Same-Day Service"
        description="Professional mobile notary in Erie, PA - $125+. We travel to your home, office, hospital anywhere in Erie, Crawford, Warren, Mercer, Venango counties. Same-day available. Licensed & bonded PA notaries. Book now!"
        keywords="mobile notary erie pa, traveling notary pennsylvania, notary service erie county, home notary visit, mobile notarization meadville, mobile notary warren pa, notary crawford county, hospital notary visits erie"
        canonical="https://notroom.com/services/mobile-notary"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Same-Day Available
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Mobile Notary Service in Erie, PA
            </h1>
            <p className="text-xl mb-8 opacity-90">
              We bring professional notary services to your location throughout Erie County and surrounding areas. Convenient, reliable, and professional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Schedule Mobile Visit - $125 + mileage
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
          <div className="max-w-6xl mx-auto space-y-6">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">We Come to Your Location</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {locations.map((location, index) => (
                <Card key={index} className="p-6 text-center">
                  <location.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{location.title}</h3>
                  <p className="text-muted-foreground">{location.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Mobile Notary?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <Clock className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-bold mb-2">Same-Day Service</h3>
                <p className="text-sm text-muted-foreground">
                  Most appointments available same-day or next-day
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-bold mb-2">PA Commissioned</h3>
                <p className="text-sm text-muted-foreground">
                  Pennsylvania-commissioned notary with required state education
                </p>
              </Card>
              <Card className="p-6">
                <MapPin className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-bold mb-2">Wide Service Area</h3>
                <p className="text-sm text-muted-foreground">
                  Serving all of Erie County and surrounding areas
                </p>
              </Card>
              <Card className="p-6">
                <CheckCircle className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-bold mb-2">No Travel Hassle</h3>
                <p className="text-sm text-muted-foreground">
                  We handle the commute so you don't have to
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Service Areas</h2>
            <p className="text-center text-muted-foreground mb-8">
              We proudly serve the following communities in and around Erie County:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {serviceAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{area}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't see your location? <a href="tel:814-480-0989" className="text-primary hover:underline">Call us</a> - we may still be able to help!
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Transparent Pricing</h2>
            <Card className="p-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-bold">Notary Fee (per signature)</h3>
                    <p className="text-sm text-muted-foreground">As allowed by Pennsylvania law</p>
                  </div>
                  <span className="text-xl font-bold">$5-15</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-bold">Travel Service Fee</h3>
                    <p className="text-sm text-muted-foreground">Within Erie city limits</p>
                  </div>
                  <span className="text-2xl font-bold">$100</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-bold">Mileage Fee</h3>
                    <p className="text-sm text-muted-foreground">Outside Erie city limits (per mile)</p>
                  </div>
                  <span className="text-xl font-bold">$1.50</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-bold">Administrative Fee</h3>
                    <p className="text-sm text-muted-foreground">Scheduling and coordination</p>
                  </div>
                  <span className="text-xl font-bold">$10</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">After-Hours Surcharge</h3>
                    <p className="text-sm text-muted-foreground">Evenings after 7 PM or weekends</p>
                  </div>
                  <span className="text-xl font-bold">+$50</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Pennsylvania law (57 Pa. Code § 307.1) limits notary fees to $5 per signature. Additional fees shown are for mobile travel services, scheduling coordination, and administrative overhead—not notarial acts.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Mobile Notary Service"
        reviews={[
          { text: "They came to my home in Millcreek within an hour. So convenient and professional!", author: "Jennifer R.", city: "Millcreek", rating: 5 },
          { text: "Mobile notary visited my dad at nursing home. Very patient and understanding.", author: "Mike S.", city: "Erie", rating: 5 },
          { text: "Perfect for our business. They come to our office whenever we need documents notarized.", author: "David L.", city: "Harborcreek", rating: 5 },
          { text: "Same-day service in Meadville. Great experience, will use again!", author: "Amanda K.", city: "Meadville", rating: 5 }
        ]}
      />

      {/* Professional Commitments */}
      <GuaranteeSection />

      {/* FAQs */}
      <FAQSection 
        faqs={[
          {
            question: "How far will you travel for mobile notary service?",
            answer: "We serve all of Erie County and surrounding areas including Crawford, Warren, Mercer, and Venango counties. Within Erie city limits: $125 base service fee. Outside Erie: add $1.50 per mile round-trip from our Erie office (6238 Cobblestone Dr, Erie, PA 16509). We'll provide exact pricing when you book."
          },
          {
            question: "Do you offer same-day mobile notary service?",
            answer: "Yes! Most mobile appointments are available same-day or next-day throughout Erie County. Call (814) 480-0989 for urgent scheduling. Emergency after-hours service may be available for an additional $50 surcharge."
          },
          {
            question: "How much does mobile notary service cost in Erie PA?",
            answer: "Within Erie city limits: $125 base ($5 PA notary fee per signature + $120 service fee for travel coordination) plus $1.50 per mile round-trip. After-hours (after 7 PM or weekends): add $50 surcharge. Example: 3 signatures in Millcreek = $125 ($15 notary fees + $110 service) + mileage."
          },
          {
            question: "Can you come to a hospital or nursing home?",
            answer: "Absolutely. We provide compassionate mobile notary service at all Erie area hospitals (UPMC Hamot, Saint Vincent, Millcreek Community), nursing homes, assisted living facilities, and senior care centers. We're experienced with healthcare settings and understand special accommodation needs."
          },
          {
            question: "What documents can you notarize during a mobile visit?",
            answer: "We can notarize virtually any document that requires notarization including powers of attorney, healthcare directives, affidavits, contracts, real estate documents (deeds, mortgages), loan modifications, vehicle titles, business agreements, and more. Just let us know what you need when booking."
          },
          {
            question: "What do I need to have ready for a mobile notary appointment?",
            answer: "You need: (1) Valid government-issued photo ID (driver's license, passport, state ID), (2) All unsigned documents ready for review, (3) All signers present and mentally competent, (4) Understanding of what you're signing. Don't sign documents before we arrive - we must witness the signing."
          },
          {
            question: "Can you notarize for someone who can't leave their home?",
            answer: "Yes, that's exactly what our mobile service is for! We serve homebound individuals, seniors, people recovering from surgery, and anyone unable to travel to a notary office. We bring everything needed to your location and work at a pace comfortable for you."
          },
          {
            question: "Are mobile notaries in Pennsylvania required to have special licensing?",
            answer: "Pennsylvania mobile notaries must be commissioned by the PA Department of State and complete required notary education. Our notaries are fully commissioned, bonded, and insured. We maintain professional standards and follow all PA notary laws (57 Pa. Code Chapter 507)."
          },
          {
            question: "How do I schedule a mobile notary appointment?",
            answer: "Book online through our website booking form, call us at (814) 480-0989, or text us. We'll confirm your appointment time, location, document type, and provide a price quote. Most appointments can be scheduled for the same day or next business day."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Mobile Notary Visit Today</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Convenient, professional notary service at your location. Same-day appointments available throughout Erie County.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Schedule Mobile Visit
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

export default MobileNotary;
