import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle,
  ArrowRight,
  Clock,
  Zap,
  Shield,
  Star,
  FileCheck,
  Users
} from "lucide-react";

export default function Services() {
  const navigate = useNavigate();

  const serviceTiers = [
    {
      name: "Notroom Standard",
      price: "$125-150",
      confirmation: "60 minutes",
      description: "Our core service for reliable, quality signings",
      features: [
        "Elite-vetted notaries",
        "Next-day scanbacks",
        "Real-time status updates",
        "Dedicated support line",
        "Error-free guarantee",
        "All loan types supported"
      ],
      popular: false
    },
    {
      name: "Notroom Priority",
      price: "$175-225",
      confirmation: "15 minutes",
      description: "For time-sensitive closings that can't wait",
      features: [
        "Elite-tier notaries only",
        "Same-day scanbacks",
        "Priority routing",
        "Dedicated account manager",
        "SMS/email updates",
        "Expedited QA review"
      ],
      popular: true
    },
    {
      name: "Notroom Rescue",
      price: "$250-350",
      confirmation: "3 minutes",
      description: "Emergency dispatch for failed or last-minute signings",
      features: [
        "Immediate dispatch",
        "Failed signing recovery",
        "After-hours & weekend",
        "White-glove service",
        "Backup notary on standby",
        "Direct escalation line"
      ],
      popular: false
    }
  ];

  const includedInAll = [
    { icon: Shield, text: "Background-checked, certified notaries" },
    { icon: FileCheck, text: "Zero-defect QA on every package" },
    { icon: Users, text: "Borrower-friendly, professional approach" },
    { icon: Star, text: "Performance-scored notary network" },
  ];

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              Service Tiers
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Choose Your
              <span className="block text-cyan-400">Service Level</span>
            </h1>
            <p className="text-xl text-slate-300">
              From standard signings to emergency rescue—we have a tier for every situation.
              All backed by our elite notary network and zero-defect guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {serviceTiers.map((tier, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden ${
                  tier.popular 
                    ? 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-105' 
                    : 'border shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-center py-2 text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                <CardContent className={`p-8 ${tier.popular ? 'pt-14' : ''}`}>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-slate-900">{tier.price}</span>
                    <span className="text-slate-500">/signing</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm text-cyan-600 font-medium">{tier.confirmation} confirmation</span>
                  </div>
                  <p className="text-slate-600 mb-6">{tier.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full py-6 font-bold ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                        : ''
                    }`}
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => navigate("/contact")}
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Volume Pricing Note */}
          <div className="text-center mt-12">
            <p className="text-slate-600">
              <strong>Volume discounts available.</strong> Contact us for custom pricing on 100+ signings/month.
            </p>
          </div>
        </div>
      </section>

      {/* Included in All */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Included with Every Signing
              </h2>
              <p className="text-lg text-slate-600">
                No matter which tier you choose, you get the Notroom difference
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {includedInAll.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Signing Types */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Signing Types We Handle
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Purchase Closings",
                "Refinance",
                "HELOC",
                "Reverse Mortgage",
                "Seller Packages",
                "Loan Modifications",
                "VA Loans",
                "Commercial",
                "Hybrid eClose",
                "RON Sessions",
                "After-Hours",
                "Weekend Signings"
              ].map((type, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-4 text-center">
                  <span className="text-slate-700 font-medium text-sm">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience the Difference?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Start with a free pilot. First 10 signings on us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-lg px-8 py-6"
              >
                Start Free Pilot
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/apply")}
                className="border-slate-600 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Join as Notary
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
}

