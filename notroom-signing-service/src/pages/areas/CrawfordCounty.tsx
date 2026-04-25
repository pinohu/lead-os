import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Shield, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CrawfordCounty = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cities = [
    "Meadville", "Titusville", "Cambridge Springs", "Linesville", "Conneaut Lake",
    "Saegertown", "Venango", "Townville", "Cochranton", "Conneautville",
    "Hydetown", "Spartansburg", "Riceville", "Blooming Valley"
  ];

  const services = [
    { title: "Remote Online Notary", price: "$60", desc: "Perfect for Crawford County residents - no travel needed ($5 PA notary + $55 platform)" },
    { title: "Mobile Notary Service", price: "$125 + mileage", desc: "We travel throughout Crawford County ($5 PA notary + $120 service + mileage)" },
    { title: "Loan Signing Agent", price: "$175+", desc: "Real estate closing services ($5 PA notary per signature + $170 signing agent service)" },
    { title: "Apostille Assistance", price: "$245+", desc: "Notarization + PA Dept of State processing for international documents" }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Notary Services Crawford County PA",
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
      "name": "Crawford County",
      "containedInPlace": {
        "@type": "State",
        "name": "Pennsylvania"
      }
    },
    "description": "Professional notary services throughout Crawford County, PA. Mobile and remote notarization serving Meadville, Titusville, and all Crawford County communities."
  };

  return (
    <Layout>
      <SEO
        title="Notary Services in Crawford County, PA - Meadville & Titusville"
        description="Professional notary services throughout Crawford County, PA. Serving Meadville, Titusville, Cambridge Springs, and all surrounding areas. Mobile & remote notarization. Call (814) 480-0989."
        keywords="notary crawford county pa, notary meadville pa, mobile notary titusville, notary public cambridge springs pa"
        canonical="https://notroom.com/areas/crawford-county"
        schema={schema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Serving Crawford County
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Notary Services in Crawford County, PA
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Professional mobile and remote notary services throughout Crawford County. From Meadville to Titusville, we bring expert notarization to your location.
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
            <h2 className="text-3xl font-bold text-center mb-12">Crawford County Communities We Serve</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {cities.map((city, index) => {
                const cityLinks: Record<string, string> = {
                  "Meadville": "/areas/meadville-pa",
                  "Titusville": "/areas/titusville-pa",
                  "Cambridge Springs": "/areas/cambridge-springs-pa",
                  "Linesville": "/areas/linesville-pa",
                  "Conneaut Lake": "/areas/conneaut-lake-pa",
                  "Saegertown": "/areas/saegertown-pa",
                  "Venango": "/areas/venango-pa",
                  "Townville": "/areas/townville-pa",
                  "Cochranton": "/areas/cochranton-pa",
                  "Conneautville": "/areas/conneautville-pa",
                  "Hydetown": "/areas/hydetown-pa",
                  "Spartansburg": "/areas/spartansburg-pa",
                  "Riceville": "/areas/riceville-pa",
                  "Blooming Valley": "/areas/blooming-valley-pa"
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
              And all surrounding Crawford County townships and boroughs
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Notary Services for Crawford County</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{service.title}</h3>
                    <span className="text-xl font-bold text-primary whitespace-nowrap ml-4">{service.price}</span>
                  </div>
                  <p className="text-muted-foreground">{service.desc}</p>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Mobile service mileage: $1.50/mile from Erie city limits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Crawford County Chooses Notroom</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <MapPin className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">We Travel to You</h3>
                <p className="text-muted-foreground">
                  Mobile notary service throughout Crawford County - save time and stay local.
                </p>
              </Card>
              <Card className="p-6">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
                <p className="text-muted-foreground">
                  Evening and weekend appointments available to fit your schedule.
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Licensed & Insured</h3>
                <p className="text-muted-foreground">
                  $100,000 E&O insurance and Pennsylvania state licensed notary public.
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
            <h2 className="text-3xl font-bold text-center mb-8">Serving Crawford County's Notary Needs</h2>
            <Card className="p-8">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Crawford County, home to the historic cities of Meadville and Titusville, has a diverse mix of residential, commercial, and agricultural properties that regularly require notary services. Our mobile notary service makes it convenient for Crawford County residents to get documents notarized without lengthy drives.
                </p>
                <p>
                  Whether you're in downtown Meadville, the lakeside community of Conneaut Lake, or the rural townships throughout Crawford County, we bring professional notarization directly to you.
                </p>
                <p className="font-semibold">Common notary services in Crawford County:</p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Real estate transactions and mortgage refinancing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Estate planning documents and wills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Business contracts and agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Farm and agricultural property documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Vehicle titles and registration paperwork</span>
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
          <h2 className="text-3xl font-bold mb-4">Book Your Notary Service in Crawford County</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Professional notary services throughout Crawford County, PA. Mobile appointments and remote online notarization available.
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

export default CrawfordCounty;
