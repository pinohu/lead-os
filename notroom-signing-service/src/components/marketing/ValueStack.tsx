import { Check, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "../ScrollReveal";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ValueStackProps {
  service?: "ron" | "mobile" | "loan" | "all";
}

const ValueStack = ({ service = "all" }: ValueStackProps) => {
  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const valueStacks = {
    ron: {
      title: "Remote Online Notary - Everything You Get",
      price: "$60",
      items: [
        { item: "PA Licensed Notary Service", value: "$5" },
        { item: "Secure Video Platform & Recording", value: "$20" },
        { item: "Identity Verification Technology", value: "$15" },
        { item: "Digital Certificate & Audit Trail", value: "$10" },
        { item: "Tamper-Proof Electronic Seal", value: "$10" },
        { item: "Legally Valid in All 50 States", value: "Priceless" },
        { item: "Available 24/7 by Appointment", value: "$30" },
        { item: "Instant Document Delivery", value: "$10" },
      ],
      totalValue: "$100+",
      savings: "$40",
      bonus: "✨ BONUS: Free booking changes up to 2 hours before appointment"
    },
    mobile: {
      title: "Mobile Notary - Complete Service Package",
      price: "$125+",
      items: [
        { item: "PA Licensed Notary Service", value: "$5" },
        { item: "Mobile Service to Your Location", value: "$120" },
        { item: "Professional Notary Supplies", value: "$20" },
        { item: "Same-Day Availability", value: "$30" },
        { item: "Flexible Scheduling", value: "$25" },
        { item: "Document Witness Service Included", value: "$25" },
        { item: "Travel to Erie County Locations", value: "Included" },
        { item: "Follow-Up Support", value: "$15" },
      ],
      totalValue: "$240+",
      savings: "$115+",
      bonus: "✨ BONUS: Free document pre-review to ensure everything is ready"
    },
    loan: {
      title: "Loan Signing Agent - Premium Package",
      price: "$175",
      items: [
        { item: "PA Licensed Notary Service", value: "$5" },
        { item: "NNA Certified Signing Agent", value: "$100" },
        { item: "Professional Liability Insurance", value: "$50" },
        { item: "Document Printing (if needed)", value: "$30" },
        { item: "Mobile Service to Closing Location", value: "$50" },
        { item: "Scan Back Service", value: "$25" },
        { item: "FedEx Overnight Return Shipping", value: "$30" },
        { item: "Pre-Closing Document Review", value: "$40" },
        { item: "Lender Communication", value: "$25" },
      ],
      totalValue: "$355+",
      savings: "$180+",
      bonus: "✨ BONUS: Priority scheduling & 2-hour response guarantee"
    }
  };

  const currentStack = service === "all" ? valueStacks.ron : valueStacks[service];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge className="mb-4 text-base px-6 py-2 bg-amber text-amber-foreground">
                <DollarSign className="w-4 h-4 inline mr-1" />
                COMPLETE VALUE BREAKDOWN
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Here's Everything You're Getting
              </h2>
              <p className="text-xl text-muted-foreground">
                When you book with us, you're not just getting a notary—you're getting a complete, professional service package
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Card className="border-4 border-amber shadow-2xl">
              <CardContent className="p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">{currentStack.title}</h3>
                  <div className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-bold text-primary">
                    <span>Your Price: {currentStack.price}</span>
                  </div>
                </div>

                {/* Value Items */}
                <div className="space-y-4 mb-8">
                  {currentStack.items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Check className="w-6 h-6 text-[hsl(var(--success-green))] flex-shrink-0" />
                        <span className="font-medium">{item.item}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold whitespace-nowrap ml-4">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Value */}
                <div className="border-t-2 border-dashed pt-6 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium">Total Value:</span>
                    <span className="text-2xl font-bold text-muted-foreground line-through">
                      {currentStack.totalValue}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">Your Investment:</span>
                    <span className="text-3xl font-bold text-[hsl(var(--success-green))]">
                      {currentStack.price}
                    </span>
                  </div>
                  <div className="bg-[hsl(var(--success-green))]/10 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-[hsl(var(--success-green))]">
                      <TrendingUp className="w-6 h-6" />
                      <span className="text-2xl font-bold">You Save {currentStack.savings}</span>
                    </div>
                  </div>
                </div>

                {/* Bonus */}
                <div className="bg-amber/10 border-2 border-amber rounded-lg p-6 mb-8">
                  <p className="text-center text-lg font-semibold">
                    {currentStack.bonus}
                  </p>
                </div>

                {/* CTA */}
                <Button 
                  onClick={scrollToBooking}
                  size="lg"
                  variant="amber"
                  className="w-full text-xl py-7 font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  🎯 Claim Your {currentStack.savings} in Value Now →
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  ✅ 100% Satisfaction Guaranteed | ⚡ 2-Hour Response Time | 🔒 Secure & Confidential
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ValueStack;