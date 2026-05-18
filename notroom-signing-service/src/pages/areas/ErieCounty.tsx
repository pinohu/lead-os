import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Building2, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ErieCounty = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cities = [
    "Erie", "Millcreek", "Harborcreek", "Fairview", "Girard",
    "North East", "Wesleyville", "Lawrence Park", "Edinboro", "Union City",
    "Corry", "Waterford", "Lake City", "Albion", "Wattsburg"
  ];

  const services = [
    { title: "Remote Online Notary", price: "$60", desc: "Online notarization via secure video call ($5 PA notary fee + $55 technology platform)" },
    { title: "Mobile Notary Service", price: "$125+ mileage", desc: "We come to your home, office, or healthcare facility ($5 PA notary + $120 service + mileage)" },
    { title: "Loan Signing Agent", price: "$175-400", desc: "Professional mortgage closing services ($5 PA notary per signature + $170+ signing agent service)" },
    { title: "Healthcare Facility", price: "$150-$240", desc: "Hospital, nursing home, and hospice notary visits" },
    { title: "Apostille Services", price: "$245+", desc: "International document authentication (standard 7-10 days)" }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Notary Services Erie County PA",
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
      "@type": "AdministrativeArea",
      "name": "Erie County",
      "containedInPlace": {
        "@type": "State",
        "name": "Pennsylvania"
      }
    },
    "description": "Professional notary services throughout Erie County, PA. Mobile, remote, and in-office notarization available. Same-day appointments."
  };

  return (
    <Layout>
      <SEO
        title="Notary Services in Erie County, PA - Mobile & Online"
        description="Professional notary services throughout Erie County, PA. Mobile notary, remote online notary, loan signing agent, and apostille services. Serving all Erie County communities. Call (814) 480-0989."
        keywords="notary erie county pa, mobile notary erie county, notary public pennsylvania, notarization services erie pa"
        canonical="https://notroom.com/areas/erie-county"
        schema={schema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Serving Erie County
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Notary Services Throughout Erie County, PA
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Professional notary services for all Erie County residents and businesses. Mobile, remote, and in-office notarization available with same-day appointments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Book Appointment
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Communities We Serve in Erie County</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {cities.map((city, index) => {
                const cityLinks: Record<string, string> = {
                  "Erie": "/areas/erie-pa",
                  "Edinboro": "/areas/edinboro-pa",
                  "North East": "/areas/north-east-pa",
                  "Girard": "/areas/girard-pa",
                  "Corry": "/areas/corry-pa",
                  "Waterford": "/areas/waterford-pa",
                  "Albion": "/areas/albion-pa",
                  "Millcreek": "/areas/millcreek-pa",
                  "Harborcreek": "/areas/harborcreek-pa",
                  "Fairview": "/areas/fairview-pa",
                  "Wesleyville": "/areas/wesleyville-pa",
                  "Lawrence Park": "/areas/lawrence-park-pa",
                  "Union City": "/areas/union-city-pa",
                  "Lake City": "/areas/lake-city-pa",
                  "Wattsburg": "/areas/wattsburg-pa"
                };
                const cityLink = cityLinks[city];
                
                if (cityLink) {
                  return (
                    <Link key={index} to={cityLink} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg hover:bg-primary/10 transition-colors">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{city}</span>
                    </Link>
                  );
                }
                
                return (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{city}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-muted-foreground">
              And all surrounding Erie County communities
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services in Erie County</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{service.title}</h3>
                    <span className="text-2xl font-bold text-primary">{service.price}</span>
                  </div>
                  <p className="text-muted-foreground">{service.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Erie County Trusts Notroom</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Same-Day Service</h3>
                <p className="text-muted-foreground">
                  Most appointments available same-day or next-day throughout Erie County.
                </p>
              </Card>
              <Card className="p-6">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Local Experts</h3>
                <p className="text-muted-foreground">
                  Pennsylvania-licensed notaries who understand local requirements and procedures.
                </p>
              </Card>
              <Card className="p-6">
                <Building2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Business Friendly</h3>
                <p className="text-muted-foreground">
                  Retainer plans available for law firms, real estate offices, and businesses.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Local Information */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">About Notary Services in Erie County</h2>
            <Card className="p-8">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Erie County, Pennsylvania's fourth-most populous county, has a vibrant business community and growing residential population that regularly requires notary services. From real estate transactions in Millcreek to business documents in downtown Erie, we serve the entire county.
                </p>
                <p>
                  Whether you're in the lakefront communities of Erie and North East, the suburban areas of Harborcreek and Fairview, or the rural towns of Edinboro and Waterford, our mobile notary service brings professional notarization to your location.
                </p>
                <p className="font-semibold">Common reasons Erie County residents need notary services:</p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Real estate purchases and refinances throughout Erie County</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Powers of attorney for healthcare and financial matters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Affidavits for court proceedings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Business formation and corporate documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Vehicle title transfers and bill of sale notarization</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Notary Service in Erie County</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Professional, reliable notary services throughout Erie County, PA. Same-day appointments available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Schedule Appointment
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground hover:bg-primary-foreground/10"
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

export default ErieCounty;
