import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  Users, 
  Award, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  MapPin
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Clock,
      title: "Speed",
      description: "3-minute confirmation because your closings can't wait. We built systems that match orders faster than anyone."
    },
    {
      icon: Target,
      title: "Certainty",
      description: "98%+ first-pass funding rate. When we confirm, you can count on it. No surprises, no excuses."
    },
    {
      icon: Shield,
      title: "Quality",
      description: "Zero-defect QA gate on every package. We catch errors before they reach your desk."
    },
    {
      icon: Users,
      title: "Network",
      description: "Elite-scored notaries who earn their position through performance. Top performers get first priority."
    }
  ];

  const milestones = [
    { stat: "50", label: "States Covered", suffix: "" },
    { stat: "3", label: "Minute Avg Confirmation", suffix: "min" },
    { stat: "98", label: "First-Pass Funding", suffix: "%+" },
    { stat: "2-7", label: "Day Vendor Pay", suffix: "" },
  ];

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              About Notroom
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              We Built the Signing Service
              <span className="block text-cyan-400">We Wished Existed</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              After years of dealing with unreliable signing services, missed deadlines, 
              and "directory roulette," we decided to build something better.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Notroom started with a simple frustration: why is it so hard to get a signing confirmed quickly? 
                Title companies were wasting hours calling notary after notary, hoping someone would pick up. 
                Signing services were treating notaries as interchangeable commodities. Quality was inconsistent. 
                First-pass funding rates suffered.
              </p>

              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                We knew there had to be a better way. So we built it.
              </p>

              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                <strong>Notroom is a signing service built around one core principle: certainty.</strong> When we 
                confirm a signing, you can count on it. Our 3-minute confirmation guarantee isn't a marketing 
                gimmick—it's the result of intelligent routing, a deeply vetted notary network, and systems 
                designed for speed.
              </p>

              <p className="text-slate-600 text-lg leading-relaxed">
                We score every notary on performance. Top performers earn priority routing. Those who don't 
                meet standards don't stay in our network. The result? Industry-leading first-pass funding rates 
                and title companies who finally have a signing partner they can trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything we do is guided by four core values
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-0 shadow-lg bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              By the Numbers
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {milestones.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-black text-white mb-2">
                  {item.stat}<span className="text-cyan-400 text-3xl">{item.suffix}</span>
                </div>
                <div className="text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-slate-100 rounded-full">
              <MapPin className="w-5 h-5 text-cyan-600" />
              <span className="text-slate-700 font-medium">Headquartered in Pennsylvania</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              National Reach, Personal Service
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              We're based in Pennsylvania but serve all 50 states. Our operations team is available 
              Monday through Friday, 8am to 8pm ET, with after-hours support for urgent signings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                Start Your Pilot
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/apply")}
              >
                Join Our Network
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
}

