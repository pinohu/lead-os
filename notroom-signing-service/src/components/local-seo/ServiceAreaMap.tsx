import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { getNearbyLinks } from "@/data/communityData";

interface ServiceAreaMapProps {
  cityName: string;
  zipCodes: string[];
  nearbyComm: string[];
  county: string;
}

export const ServiceAreaMap = ({ cityName, zipCodes, nearbyComm, county }: ServiceAreaMapProps) => {
  const nearbyLinks = getNearbyLinks(nearbyComm);
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Service Areas & Zip Codes - {cityName}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We proudly serve all neighborhoods throughout {cityName} and nearby {county} communities
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{cityName} Zip Codes</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {zipCodes.map((zip, index) => (
                  <div key={index} className="text-center p-3 bg-muted/50 rounded-lg border">
                    <span className="font-mono font-bold text-primary">{zip}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Mobile notary available same-day to all {cityName} zip codes. 
                Average arrival time: 30-60 minutes.
              </p>
            </Card>
            
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Nearby Communities</h3>
              </div>
              <div className="space-y-2">
                {nearbyLinks.map((nearby, index) => (
                  <Link 
                    key={index} 
                    to={`/areas/${nearby.slug}-pa`}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors group"
                  >
                    <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{nearby.name}</span>
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                We also serve these nearby {county} communities by appointment. 
                Call us to confirm service availability in your area.
              </p>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              <strong>Not listed?</strong> We serve most of {county}. Contact us at{" "}
              <a href="tel:814-480-0989" className="text-primary hover:underline font-semibold">
                (814) 480-0989
              </a>{" "}
              to confirm coverage in your area.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
