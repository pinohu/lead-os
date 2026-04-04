import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Calculator as CalcIcon, 
  DollarSign, 
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  Users,
  Zap
} from "lucide-react";

const Calculator = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      tier: "Standard",
      price: "$125-150",
      confirmation: "60 min",
      features: ["Elite-vetted notaries", "Next-day scanbacks", "Status updates"],
      bestFor: "Routine closings with standard timelines"
    },
    {
      tier: "Priority",
      price: "$175-225",
      confirmation: "15 min",
      features: ["Elite-tier only", "Same-day scanbacks", "Account manager"],
      bestFor: "Time-sensitive transactions",
      popular: true
    },
    {
      tier: "Rescue",
      price: "$250-350",
      confirmation: "3 min",
      features: ["Immediate dispatch", "After-hours", "Backup on standby"],
      bestFor: "Emergency/failed signings"
    }
  ];

  const volumeDiscounts = [
    { volume: "1-50 signings/month", discount: "Standard rates" },
    { volume: "51-100 signings/month", discount: "5% discount" },
    { volume: "101-250 signings/month", discount: "10% discount" },
    { volume: "250+ signings/month", discount: "Custom pricing" },
  ];

  const addOns = [
    { name: "RON Session (Remote)", price: "+$25" },
    { name: "Hybrid eClose", price: "+$35" },
    { name: "Weekend signing", price: "+$50" },
    { name: "After-hours (6pm+)", price: "+$40" },
    { name: "Holiday signing", price: "+$75" },
    { name: "Rush (2-hour notice)", price: "+$50" },
  ];

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              Pricing Calculator
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Transparent
              <span className="block text-cyan-400">Signing Service Pricing</span>
            </h1>
            <p className="text-xl text-slate-300">
              No hidden fees. Volume discounts available. Get an estimate for your signing needs.
            </p>
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Service Tier Pricing
              </h2>
              <p className="text-lg text-slate-600">
                Choose the service level that fits your needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={index}
                  className={`relative ${tier.popular ? 'border-2 border-cyan-500 shadow-lg' : 'border'}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-cyan-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{tier.tier}</CardTitle>
                    <div className="text-3xl font-black text-slate-900 mt-2">{tier.price}</div>
                    <div className="text-sm text-cyan-600 font-medium">
                      {tier.confirmation} confirmation
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-4 text-center">{tier.bestFor}</p>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => navigate("/contact")}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Optional Add-Ons
              </h2>
              <p className="text-slate-600">
                Additional services available with any tier
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {addOns.map((addOn, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                  <span className="text-slate-700">{addOn.name}</span>
                  <span className="font-bold text-slate-900">{addOn.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Volume Discounts */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Volume Discounts
              </h2>
              <p className="text-slate-600">
                The more you sign, the more you save
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {volumeDiscounts.map((tier, index) => (
                    <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">{tier.volume}</div>
                      <div className="font-bold text-cyan-600">{tier.discount}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Included with Every Signing
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="font-medium text-slate-900">Vetted Notaries</div>
                <div className="text-sm text-slate-500">Background-checked</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="font-medium text-slate-900">QA Review</div>
                <div className="text-sm text-slate-500">Zero-defect check</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="font-medium text-slate-900">Status Updates</div>
                <div className="text-sm text-slate-500">Real-time tracking</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="font-medium text-slate-900">No Hidden Fees</div>
                <div className="text-sm text-slate-500">Transparent pricing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get a Custom Quote
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Contact us for volume pricing or enterprise agreements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-lg px-8 py-6"
              >
                Request Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/services")}
                className="border-slate-600 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                View Service Tiers
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default Calculator;
