import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Video, Shield, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const WarrenCounty = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cities = [
    "Warren", "Youngsville", "Sugar Grove", "Tidioute", "Sheffield",
    "Clarendon", "Bear Lake", "Russell", "North Warren", "Kinzua",
    "Irvine", "Pittsfield", "Chandlers Valley", "Spring Creek"
  ];

  const services = [
    { title: "Remote Online Notary (RON)", price: "$60", highlight: "Best for Warren County", desc: "No travel needed - available by appointment from your home ($5 PA notary + $55 platform)" },
    { title: "Mobile Notary Service", price: "$125+ mileage", desc: "We travel to Warren County locations ($5 PA notary + $120 service + mileage)" },
    { title: "Loan Signing Agent", price: "$175+", desc: "Mortgage and real estate closings ($5 PA notary per signature + $170 signing agent service)" },
    { title: "Apostille Assistance", price: "$245+", desc: "Notarization + PA Dept of State processing for international documents" }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Notary Services Warren County PA",
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
      "name": "Warren County",
      "containedInPlace": {
        "@type": "State",
        "name": "Pennsylvania"
      }
    },
    "description": "Professional remote and mobile notary services throughout Warren County, PA. Serving Warren, Youngsville, and all surrounding communities."
  };

  return (
    <Layout>
      <SEO
        title="Notary Services in Warren County, PA - Remote & Mobile"
        description="Professional notary services in Warren County, PA. Remote online notary (RON) and mobile service available. Serving Warren, Youngsville, Sugar Grove, and all of Warren County. Call (814) 480-0989."
        keywords="notary warren county pa, notary warren pa, remote notary youngsville, mobile notary warren county pennsylvania"
        canonical="https://notroom.com/areas/warren-county"
        schema={schema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Serving Warren County
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Notary Services in Warren County, PA
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Professional remote online notary (RON) and mobile notary services throughout Warren County. Get documents notarized from home or we'll travel to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={scrollToBooking}
                variant="secondary"
              >
                Book Remote Session - $60
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

      {/* Remote Notary Highlight */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-start gap-4">
                <Video className="w-12 h-12 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold mb-3">Remote Online Notary - Perfect for Warren County</h2>
                  <p className="text-muted-foreground mb-4">
                    Warren County is beautiful but rural. Why drive long distances for notarization when you can do it from home? Our Remote Online Notary (RON) service lets you get documents notarized via secure video call - available by appointment including evenings and weekends, legally valid in all 50 states.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Complete in 5 minutes from anywhere in Warren County</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No travel to Warren, Youngsville, or any other location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Available evenings and weekends - $60 ($5 notary + $55 platform)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Warren County Communities We Serve</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {cities.map((city, index) => {
                const cityLinks: Record<string, string> = {
                  "Warren": "/areas/warren-pa",
                  "Youngsville": "/areas/youngsville-pa",
                  "Sheffield": "/areas/sheffield-pa",
                  "Sugar Grove": "/areas/sugar-grove-pa",
                  "Tidioute": "/areas/tidioute-pa",
                  "Clarendon": "/areas/clarendon-pa",
                  "Bear Lake": "/areas/bear-lake-pa",
                  "Russell": "/areas/russell-pa",
                  "North Warren": "/areas/north-warren-pa",
                  "Kinzua": "/areas/kinzua-pa",
                  "Irvine": "/areas/irvine-pa",
                  "Pittsfield": "/areas/pittsfield-pa",
                  "Chandlers Valley": "/areas/chandlers-valley-pa",
                  "Spring Creek": "/areas/spring-creek-pa"
                };
                const cityLink = cityLinks[city];
                
                if (cityLink) {
                  return (
                    <Link key={index} to={cityLink} className="flex items-center gap-2 p-3 bg-background rounded-lg hover:bg-primary/10 transition-colors">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{city}</span>
                    </Link>
                  );
                }
                
                return (
                  <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{city}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-muted-foreground">
              And all surrounding Warren County townships and boroughs
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Notary Services for Warren County</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <Card key={index} className={`p-6 ${service.highlight ? 'border-primary border-2' : ''}`}>
                  {service.highlight && (
                    <Badge className="mb-3 bg-primary">Recommended</Badge>
                  )}
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Warren County Residents Choose Notroom</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Video className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Remote Convenience</h3>
                <p className="text-muted-foreground">
                  Skip the drive to Warren or other towns. Get notarized via video from anywhere in the county.
                </p>
              </Card>
              <Card className="p-6">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
                <p className="text-muted-foreground">
                  Remote online notary available by appointment - including evenings, weekends, and holidays.
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Fully Licensed</h3>
                <p className="text-muted-foreground">
                  Pennsylvania-licensed notary public with $100,000 E&O insurance for your protection.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Local Information */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Notary Services for Warren County</h2>
            <Card className="p-8">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Warren County, known for the Allegheny National Forest and scenic rural landscapes, presents unique challenges for residents needing notary services. With communities spread across the county's 884 square miles, traditional in-person notarization often requires significant travel time.
                </p>
                <p>
                  That's why Remote Online Notary (RON) is ideal for Warren County residents. Whether you're in downtown Warren, the borough of Youngsville, or rural townships like Sugar Grove or Sheffield, you can complete secure video notarization from your home or office.
                </p>
                <p className="font-semibold">Common documents we notarize for Warren County residents:</p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Real estate transactions and refinancing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Powers of attorney for healthcare and finances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Affidavits and sworn statements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Vehicle titles and bill of sale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Business and corporate documents</span>
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
          <h2 className="text-3xl font-bold mb-4">Book Your Notary Service in Warren County</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Get documents notarized from home with Remote Online Notary - available by appointment throughout Warren County, PA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              variant="secondary"
            >
              Start Remote Session
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

export default WarrenCounty;
