import { Shield, Clock, ThumbsUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "../ScrollReveal";
import { Button } from "../ui/button";

const GuaranteeSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const guarantees = [
    {
      icon: Shield,
      title: "100% Satisfaction Guarantee",
      description: "If you're not completely satisfied with our service, we'll make it right or provide a full refund. No questions asked."
    },
    {
      icon: Clock,
      title: "2-Hour Response Promise",
      description: "We respond to every booking within 2 hours during business hours, or we credit $25 toward your service."
    },
    {
      icon: CheckCircle,
      title: "Error-Free Guarantee",
      description: "All notarizations are backed by our $100K E&O insurance. If we make a mistake, we fix it free of charge."
    },
    {
      icon: ThumbsUp,
      title: "On-Time or Free",
      description: "For mobile services: If we're more than 15 minutes late without notice, your service fee is waived."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(var(--success-green))]/5 to-[hsl(var(--primary))]/5">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-block mb-4 px-6 py-2 bg-[hsl(var(--success-green))]/10 rounded-full border border-[hsl(var(--success-green))]/20">
                <span className="text-[hsl(var(--success-green))] font-bold">ZERO RISK</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Our Iron-Clad Guarantee
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We're so confident in our service quality that we back every transaction with these guarantees. Your complete satisfaction is our only acceptable outcome.
              </p>
            </div>
          </ScrollReveal>

          {/* Guarantees Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {guarantees.map((guarantee, index) => {
              const Icon = guarantee.icon;
              return (
                <ScrollReveal key={index} delay={index * 100}>
                  <Card className="h-full border-2 border-[hsl(var(--success-green))]/20 hover:border-[hsl(var(--success-green))] hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[hsl(var(--success-green))]/10 flex-shrink-0">
                          <Icon className="w-8 h-8 text-[hsl(var(--success-green))]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">{guarantee.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{guarantee.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Why We Do This */}
          <ScrollReveal>
            <Card className="bg-[hsl(var(--primary))]/5 border-2 border-[hsl(var(--primary))]/20 p-8">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-4">Why We Offer These Guarantees</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  As a fully licensed and insured Pennsylvania notary with NNA certification, we hold ourselves to the highest professional standards. 
                  We can make these promises because we're committed to delivering exceptional service every single time. 
                  <strong className="text-foreground"> Your risk is zero. Your satisfaction is guaranteed.</strong>
                </p>
                <Button 
                  size="lg" 
                  variant="amber"
                  onClick={scrollToBooking}
                  className="font-bold text-lg px-8"
                >
                  Book Risk-Free Now →
                </Button>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default GuaranteeSection;