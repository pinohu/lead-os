import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const ValueLadder = () => {
  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLadderClick = (level: string) => {
    trackEvent('value_ladder_clicked', {
      level,
      timestamp: Date.now(),
    });
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Perfect Entry Point
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start where you're comfortable, scale when you're ready. Every level builds on the last.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Level 1: Free Lead Magnet */}
          <Card className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="bg-background border-2">
                <Download className="w-3 h-3 mr-1" />
                FREE
              </Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">Learn</CardTitle>
              <CardDescription>Get educated first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-[hsl(var(--success-green))]">$0</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Free PA Notary Guide
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Service Quiz
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Pricing Calculator
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  handleLadderClick('free');
                  document.getElementById("lead-magnet")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Start Here
              </Button>
            </CardContent>
          </Card>

          {/* Level 2: Tripwire */}
          <Card className="relative border-2 border-[hsl(var(--action-cyan))]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-[hsl(var(--action-cyan))] text-primary-foreground border-none">
                <DollarSign className="w-3 h-3 mr-1" />
                BEST START
              </Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">Test Drive</CardTitle>
              <CardDescription>Low-risk first step</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-[hsl(var(--action-cyan))]">$27</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Document Review
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Expert Consultation
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  $27 Credit Applied
                </li>
              </ul>
              <Button 
                variant="amber" 
                className="w-full"
                onClick={() => {
                  handleLadderClick('tripwire');
                  scrollToBooking();
                }}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Level 3: Core Services */}
          <Card className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="bg-background border-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">Core Services</CardTitle>
              <CardDescription>One-time needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">$60-$245</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Remote Notary ($60)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Mobile Notary ($125+)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Loan Signing ($175)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  Apostille ($245+)
                </li>
              </ul>
              <Button 
                variant="amberOutline" 
                className="w-full"
                onClick={() => {
                  handleLadderClick('core');
                  scrollToBooking();
                }}
              >
                Book Service
              </Button>
            </CardContent>
          </Card>

          {/* Level 4: Premium/Recurring */}
          <Card className="relative bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] border-none text-primary-foreground">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-[hsl(var(--success-green))] text-primary-foreground border-none">
                <Building2 className="w-3 h-3 mr-1" />
                PREMIUM
              </Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl">Business Partner</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Ongoing support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$149-$399/yr</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-foreground/60" />
                  Registered Office
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-foreground/60" />
                  Business Filing
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-foreground/60" />
                  Annual Compliance
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-foreground/60" />
                  Priority Support
                </li>
              </ul>
              <Button 
                variant="amber" 
                className="w-full"
                onClick={() => {
                  handleLadderClick('premium');
                  window.location.href = "/services/business-retainer";
                }}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ⚡ Every level includes our satisfaction guarantee
          </p>
        </div>
      </div>
    </section>
  );
};

export default ValueLadder;
