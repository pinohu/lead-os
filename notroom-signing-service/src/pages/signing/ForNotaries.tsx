import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign,
  TrendingUp,
  Clock,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Users
} from "lucide-react";
import { VENDOR_TIER_THRESHOLDS } from "@/constants/stateEligibility";

export default function ForNotaries() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: DollarSign,
      title: "Fast Pay",
      description: "Elite tier notaries get paid in 2 days. Standard tier within 7 days. No more waiting 30-60 days."
    },
    {
      icon: TrendingUp,
      title: "Performance Routing",
      description: "Top performers get first offer on all orders. Your score determines your priority in our queue."
    },
    {
      icon: Clock,
      title: "Consistent Volume",
      description: "Build a reliable signing business with steady order flow from our title company clients."
    },
    {
      icon: Award,
      title: "Elite Tier Benefits",
      description: "Hit elite status and unlock premium rates, first-offer priority, and rescue signing opportunities."
    }
  ];

  const tiers = VENDOR_TIER_THRESHOLDS;

  const requirements = [
    "Active notary commission in your state",
    "Background check clearance",
    "E&O insurance ($25,000+ minimum)",
    "Dual-tray laser printer",
    "Reliable transportation",
    "Professional demeanor",
    "< 5 minute response time expectation",
    "98%+ completion rate goal"
  ];

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              For Notaries
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Join the
              <span className="block text-emerald-300">Elite Network</span>
            </h1>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Earn more. Get paid faster. Work with a team that values quality. 
              We're building the most reliable signing network in America.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/apply")}
                className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 font-bold"
              >
                Apply Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Notaries Choose Notroom
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We treat our notaries as partners, not commodities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                    <p className="text-slate-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Performance Tier System
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your performance score determines your tier. Higher tiers unlock better benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tiers.map((tier, index) => (
              <Card 
                key={tier.tier}
                className={`border-2 ${
                  tier.tier === 'elite' 
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-white' 
                    : tier.tier === 'gold'
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-white'
                    : tier.tier === 'silver'
                    ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-white'
                    : 'border-orange-600 bg-gradient-to-br from-orange-50 to-white'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className={`w-6 h-6 ${
                      tier.tier === 'elite' ? 'text-purple-500' :
                      tier.tier === 'gold' ? 'text-yellow-500' :
                      tier.tier === 'silver' ? 'text-gray-400' :
                      'text-orange-600'
                    }`} />
                    <span className="text-xl font-bold capitalize text-slate-900">{tier.tier}</span>
                  </div>
                  <div className="text-sm text-slate-600 mb-4">
                    Score: {tier.minScore}-{tier.maxScore}
                  </div>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Network Requirements
              </h2>
              <p className="text-lg text-slate-600">
                We maintain high standards to ensure quality for our clients
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Elevate Your Signing Business?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join hundreds of notaries who've found a better way to build their signing career.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/apply")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-10 py-6 font-bold"
            >
              Apply to Join Network
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
}

