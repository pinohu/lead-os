import { Card } from "@/components/ui/card";
import { MapPin, Clock, CheckCircle } from "lucide-react";

interface CaseStudy {
  neighborhood: string;
  date: string;
  service: string;
  details: string;
  arrivalTime?: string;
  completionTime?: string;
  outcome: string;
}

interface LocalCaseStudiesProps {
  cityName: string;
  caseStudies: CaseStudy[];
}

export const LocalCaseStudies = ({ cityName, caseStudies }: LocalCaseStudiesProps) => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recent Work in {cityName}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real notary services we've provided to {cityName} residents and businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {caseStudies.map((study, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">{study.neighborhood}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{study.date}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3">{study.service}</h3>
                <p className="text-muted-foreground mb-4">{study.details}</p>
                
                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  {study.arrivalTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Arrival: {study.arrivalTime}</span>
                    </div>
                  )}
                  {study.completionTime && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Completed: {study.completionTime}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-primary">{study.outcome}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
