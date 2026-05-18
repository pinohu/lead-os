import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "../ScrollReveal";
import { Button } from "../ui/button";

const ComparisonTable = () => {
  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    { 
      feature: "PA State Licensed & Bonded", 
      us: true, 
      others: "Sometimes",
      impact: "Legal protection & validity"
    },
    { 
      feature: "Certified Signing Agent", 
      us: true, 
      others: false,
      impact: "Professional expertise"
    },
    { 
      feature: "Bonded & E&O Insured", 
      us: true, 
      others: "Varies by provider",
      impact: "Your risk protection"
    },
    { 
      feature: "2-Hour Response Guarantee", 
      us: true, 
      others: "24-48 hours",
      impact: "Speed matters"
    },
    { 
      feature: "Same-Day Availability", 
      us: true, 
      others: "Limited",
      impact: "Urgent situations"
    },
    { 
      feature: "Mobile Service (5 Counties)", 
      us: true, 
      others: "Usually 1-2",
      impact: "Wider coverage"
    },
    { 
      feature: "RON Available 24/7", 
      us: true, 
      others: "Business hours",
      impact: "Your schedule"
    },
    { 
      feature: "6 Services, One Provider", 
      us: true, 
      others: false,
      impact: "Convenience"
    },
    { 
      feature: "Transparent Itemized Pricing", 
      us: true, 
      others: "Varies by provider",
      impact: "No surprises"
    },
    { 
      feature: "100% Satisfaction Guarantee", 
      us: true, 
      others: false,
      impact: "Zero risk"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                What Notroom Offers
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our comprehensive credentials and service features, shown alongside common industry standards in Pennsylvania.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 bg-primary text-primary-foreground p-6 font-bold text-lg">
                  <div className="col-span-5">Feature</div>
                  <div className="col-span-3 text-center">Notroom</div>
                  <div className="col-span-4 text-center opacity-70">Typical Availability</div>
                </div>

                {/* Comparison Rows */}
                {features.map((item, index) => (
                  <div 
                    key={index}
                    className={`grid grid-cols-12 gap-4 p-6 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    } hover:bg-muted/50 transition-colors`}
                  >
                    <div className="col-span-5">
                      <div className="font-semibold mb-1">{item.feature}</div>
                      <div className="text-xs text-muted-foreground">{item.impact}</div>
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      {item.us === true ? (
                        <div className="flex items-center gap-2 text-[hsl(var(--success-green))]">
                          <Check className="w-6 h-6 font-bold" />
                          <span className="font-semibold">Yes</span>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--success-green))] font-semibold">{item.us}</span>
                      )}
                    </div>
                    <div className="col-span-4 flex items-center justify-center">
                      {item.others === false ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <X className="w-6 h-6" />
                          <span>No</span>
                        </div>
                      ) : item.others === true ? (
                        <div className="flex items-center gap-2 text-[hsl(var(--success-green))]">
                          <Check className="w-6 h-6" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{item.others}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="bg-[hsl(var(--success-green))]/10 p-8 text-center border-t-4 border-[hsl(var(--success-green))]">
                  <h3 className="text-2xl font-bold mb-4">
                    Our Commitment to You
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Professional, guaranteed service you can trust for all your important document needs.
                  </p>
                  <Button 
                    size="lg"
                    variant="amber"
                    onClick={scrollToBooking}
                    className="text-xl px-10 py-7 font-bold shadow-2xl"
                  >
                    Choose Professional Service Now →
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    ⚡ 2-Hour Response | 💯 100% Guaranteed | 🔒 Fully Licensed & Insured
                  </p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Trust Statement */}
          <ScrollReveal delay={200}>
            <div className="mt-8 text-center p-6 bg-background rounded-lg border">
              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">PA licensed, NNA certified, and fully insured.</strong> 
                Experience the difference that proper credentials and professional service make.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;