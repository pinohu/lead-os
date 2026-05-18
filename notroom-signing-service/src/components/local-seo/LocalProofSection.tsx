import { Card } from "@/components/ui/card";
import { Shield, FileCheck, Building2, MapPin } from "lucide-react";

interface LocalProofProps {
  cityName: string;
  county: string;
  licenseNumber?: string;
  localCompliance?: string[];
  nearbyLandmarks?: string[];
}

export const LocalProofSection = ({ 
  cityName, 
  county,
  licenseNumber = "PA Notary Commission",
  localCompliance = [
    "Pennsylvania Department of State regulations",
    "PA Notary Public Law (57 Pa.C.S. § 301 et seq.)",
    "Pennsylvania Uniform Real Property Electronic Recording Act"
  ],
  nearbyLandmarks = []
}: LocalProofProps) => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Local Knowledge & Pennsylvania Compliance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We understand {cityName} and follow all Pennsylvania notary regulations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Licensed in PA</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {licenseNumber}. Fully bonded and insured, meeting all Pennsylvania Department of State requirements for notary commissions.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">PA Compliant</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {localCompliance.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">We Know {cityName}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Serving {county} with local expertise. Familiar with {cityName} neighborhoods, businesses, and community needs.
              </p>
              {nearbyLandmarks.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Near: {nearbyLandmarks.slice(0, 3).join(', ')}
                </p>
              )}
            </Card>
          </div>
          
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <Building2 className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Working with {county} Offices</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We regularly work with {county} Recorder of Deeds, Prothonotary, and Register of Wills offices. 
                  Our notarizations meet all Pennsylvania county recording requirements and are accepted by all 
                  {county} government offices, courts, and financial institutions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
