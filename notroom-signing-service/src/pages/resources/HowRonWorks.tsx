import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video, 
  FileCheck, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Monitor,
  UserCheck,
  Upload,
  ArrowRight,
  Globe2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowRonWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Order Submitted",
      description: "Title company submits the signing order with borrower details and document package.",
      icon: Upload
    },
    {
      number: 2,
      title: "RON Session Scheduled",
      description: "Borrower receives a secure link to schedule their video notarization session at their convenience.",
      icon: Clock
    },
    {
      number: 3,
      title: "Identity Verification",
      description: "Borrower verifies identity via government ID scan and Knowledge-Based Authentication (KBA) questions.",
      icon: UserCheck
    },
    {
      number: 4,
      title: "Live Video Session",
      description: "Licensed notary guides borrower through document review and electronic signature on secure video call.",
      icon: Video
    },
    {
      number: 5,
      title: "Digital Notarization",
      description: "Notary applies digital seal and signature. Tamper-evident certificate attached to document.",
      icon: Shield
    },
    {
      number: 6,
      title: "Instant Delivery",
      description: "Notarized documents delivered immediately. Recording stored securely for compliance.",
      icon: FileCheck
    }
  ];

  const benefits = [
    { 
      title: "Legally Binding in All 50 States", 
      desc: "RON notarizations are recognized nationwide and accepted by courts, lenders, and government agencies.",
      icon: Globe2
    },
    { 
      title: "Bank-Level Security", 
      desc: "256-bit encryption, identity verification, and tamper-evident audit trails exceed paper security.",
      icon: Shield
    },
    { 
      title: "Borrower Convenience", 
      desc: "No travel, no scheduling hassles. Borrowers complete from home or office on any device.",
      icon: Monitor
    },
    { 
      title: "Faster Closings", 
      desc: "Eliminate scheduling delays. RON sessions typically complete in 15-30 minutes.",
      icon: Clock
    }
  ];

  const ronStates = [
    "AZ", "CO", "FL", "ID", "IN", "KY", "LA", "MD", "MI", "MN",
    "MT", "NE", "NV", "NJ", "NM", "NY", "ND", "OH", "OK", "PA",
    "SD", "TN", "TX", "UT", "VA", "WA", "WI", "WV", "WY"
  ];

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              RON Explained
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              How Remote Online
              <span className="block text-cyan-400">Notarization Works</span>
            </h1>
            <p className="text-xl text-slate-300">
              Secure video notarization for mortgage closings. Faster, more convenient, 
              and accepted nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                The RON Process: Step by Step
              </h2>
              <p className="text-lg text-slate-600">
                How a typical RON closing flows through Notroom
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.number} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {step.number}
                        </div>
                        <Icon className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 text-sm">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Why Title Companies Choose RON
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{benefit.title}</h3>
                      <p className="text-slate-600">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* RON States Coverage */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                RON-Enabled States
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                RON is legally authorized in the majority of states. We route orders to 
                properly commissioned notaries in each jurisdiction.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {ronStates.map(state => (
                <span 
                  key={state}
                  className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                >
                  {state}
                </span>
              ))}
            </div>

            <p className="text-center text-slate-500 text-sm">
              States without permanent RON laws can often use in-person notary or IPEN (In-Person Electronic Notarization).
            </p>
          </div>
        </div>
      </section>

      {/* Legal Info */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Is RON Legally Valid for Mortgage Closings?</h3>
                    <p className="text-slate-600 mb-4">
                      Yes. The SECURE Notarization Act and state-level RON laws have made remote online 
                      notarization fully legal and binding. RON notarizations are accepted by:
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">Fannie Mae & Freddie Mac</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">FHA & VA loans</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">Major title underwriters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">County recorders nationwide</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Offer RON Closings?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              We handle the complexity. You get faster closings and happier borrowers.
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
                onClick={() => navigate("/coverage")}
                className="border-slate-600 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                View Coverage Map
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default HowRonWorks;
