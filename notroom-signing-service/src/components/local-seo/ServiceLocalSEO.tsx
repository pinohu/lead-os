import { Card } from "@/components/ui/card";
import { MapPin, CheckCircle, Star, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalReview {
  text: string;
  author: string;
  city: string;
  rating: number;
}

interface ServiceLocalSEOProps {
  serviceName: string;
  reviews?: LocalReview[];
  counties?: string[];
}

export const ServiceLocalSEO = ({ 
  serviceName,
  reviews = [],
  counties = ["Erie County", "Crawford County", "Warren County", "Mercer County", "Venango County"]
}: ServiceLocalSEOProps) => {
  return (
    <>
      {/* Service Benefits - Educational content about service advantages */}
      {reviews.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Why Choose Professional {serviceName} in Northwestern PA
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">"{review.text}"</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{review.author}</span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{review.city}, PA</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Service Areas */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {serviceName} Throughout Northwestern Pennsylvania
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Licensed to serve all of Pennsylvania. Specialized local knowledge in Erie region.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {counties.map((county, index) => (
                <Card key={index} className="p-4 text-center hover:shadow-lg transition-shadow">
                  <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm">{county}</p>
                </Card>
              ))}
            </div>

            <Card className="p-8 bg-primary/5 border-primary/20">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Same-Day Service</h3>
                  <p className="text-sm text-muted-foreground">Available throughout Erie, Crawford, Warren counties</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">PA Licensed & Bonded</h3>
                  <p className="text-sm text-muted-foreground">Fully compliant with Pennsylvania Department of State</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Local Support</h3>
                  <p className="text-sm text-muted-foreground">Call (814) 480-0989 - we know your community</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Cities Served */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Cities We Serve for {serviceName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              {["Erie", "Millcreek", "Harborcreek", "Fairview", "Meadville", "Warren", "Oil City", "Sharon", "Hermitage", "Grove City", "Titusville", "North East", "Edinboro", "Waterford", "Girard", "Corry", "Franklin", "Greenville", "Mercer", "Youngsville", "Cambridge Springs", "Union City", "Wesleyville", "Lawrence Park"].map((city, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                  <span>{city}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              Don't see your city? We serve all of Northwestern PA.{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="tel:814-480-0989">Call (814) 480-0989</a>
              </Button>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
