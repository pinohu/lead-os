import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SigningLayout from "@/components/SigningLayout";
import { 
  Clock, 
  Shield, 
  MapPin, 
  TrendingUp, 
  Users, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Star,
  Phone,
  Building2,
  FileCheck,
  Timer,
  Award,
  Globe2,
  Banknote,
  HeadphonesIcon,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SigningServicesHome = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "3", label: "Minute Confirmation", suffix: "min", icon: Timer },
    { value: "98", label: "First-Pass Funding", suffix: "%+", icon: TrendingUp },
    { value: "50", label: "States Covered", suffix: "", icon: Globe2 },
    { value: "2", label: "Day Fast Pay", suffix: "-7", icon: Banknote },
  ];

  const serviceTiers = [
    {
      name: "Notroom Standard",
      price: "$125-150",
      confirmation: "60 minutes",
      features: [
        "Elite-vetted notaries",
        "Next-day scanbacks",
        "Real-time status updates",
        "Dedicated support line"
      ],
      popular: false
    },
    {
      name: "Notroom Priority",
      price: "$175-225",
      confirmation: "15 minutes",
      features: [
        "Elite-tier notaries only",
        "Same-day scanbacks",
        "Priority routing",
        "Dedicated account manager"
      ],
      popular: true
    },
    {
      name: "Notroom Rescue",
      price: "$250-350",
      confirmation: "3 minutes",
      features: [
        "Immediate dispatch",
        "Failed signing recovery",
        "After-hours & weekend",
        "White-glove service"
      ],
      popular: false
    }
  ];

  const differentiators = [
    {
      icon: Clock,
      title: "3-Minute Confirmation",
      description: "Stop waiting hours for assignment confirmation. Our smart routing engine matches orders in under 3 minutes."
    },
    {
      icon: Shield,
      title: "Zero-Defect QA Gate",
      description: "Every package passes our quality assurance before shipment. We catch errors before they reach your desk."
    },
    {
      icon: TrendingUp,
      title: "98%+ First-Pass Funding",
      description: "Our elite notary network and rigorous training delivers industry-leading first-pass funding rates."
    },
    {
      icon: Users,
      title: "Elite Notary Network",
      description: "Performance-scored, background-checked, certified professionals. Top performers get priority assignments."
    },
    {
      icon: Zap,
      title: "Rescue Capability",
      description: "Last-minute fallout? We have backup notaries on standby in every market for same-day recovery."
    },
    {
      icon: MapPin,
      title: "50-State Coverage",
      description: "From PA to California, in-person and RON. One vendor, nationwide reach, consistent quality."
    }
  ];

  const testimonials = [
    {
      quote: "Notroom's confirmation times are unmatched. We've cut our scheduling headaches by 80%.",
      author: "Sarah M.",
      role: "Operations Director",
      company: "Regional Title Co."
    },
    {
      quote: "Their rescue service saved three closings last month alone. Worth every penny.",
      author: "Michael R.",
      role: "VP Closing Operations",
      company: "National Lender"
    },
    {
      quote: "Finally, a signing service that understands SLAs aren't suggestions.",
      author: "Jennifer L.",
      role: "Settlement Manager",
      company: "Title Agency"
    }
  ];

  return (
    <SigningLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0f1a]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#1a1f3a] to-[#0a0f1a]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="container mx-auto px-4 relative z-10 pt-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Trust badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-sm rounded-full border border-cyan-400/50"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white font-semibold tracking-wide text-sm">
                NATIONAL SIGNING SERVICE OPERATIONS
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tight"
            >
              Closings That
              <span 
                className="block text-cyan-400"
                style={{
                  background: 'linear-gradient(90deg, #22d3ee, #60a5fa, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Never Miss
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-3xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Speed. Certainty. Zero errors. 
              <span className="text-white font-medium"> We guarantee it.</span>
            </motion.p>

            {/* CTA buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button 
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-10 py-7 font-bold shadow-lg shadow-cyan-500/25 border-0 group"
              >
                Start Your Pilot
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/apply")}
                className="border-slate-600 text-white hover:bg-white/10 text-lg px-10 py-7 font-semibold bg-transparent"
              >
                Join Our Network
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                    <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                      <Icon className="w-6 h-6 text-cyan-400 mb-3 mx-auto" />
                      <div className="text-4xl md:text-5xl font-black text-white mb-1">
                        {stat.value}<span className="text-cyan-400">{stat.suffix}</span>
                      </div>
                      <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Problem */}
              <div>
                <Badge className="mb-4 bg-red-100 text-red-700 hover:bg-red-100">The Industry Problem</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                  Directory Roulette Is Killing Your Closings
                </h2>
                <div className="space-y-4 text-lg text-slate-600">
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Hours waiting for assignment confirmation</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Inconsistent notary quality and training</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Missed deadlines and failed first-pass funding</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>No accountability when things go wrong</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Last-minute cancellations with no backup</span>
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-3xl p-10 border border-slate-200">
                <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">The Notroom Difference</Badge>
                <h3 className="text-3xl font-bold text-slate-900 mb-6">
                  Certainty, Not Chance
                </h3>
                <div className="space-y-4 text-lg text-slate-700">
                  <p className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span><strong>3-minute confirmation</strong> with smart routing</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span><strong>Performance-scored</strong> elite notary network</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span><strong>Zero-defect QA gate</strong> before every shipment</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span><strong>Single point of accountability</strong> per file</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span><strong>Rescue team on standby</strong> for every market</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">Why Notroom</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Built for Operations Excellence
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every feature designed to hit your SLAs and protect your borrower experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/25">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-24 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 border-cyan-500/30">Service Tiers</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Service Level
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              From standard signings to emergency rescue - we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {serviceTiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative rounded-3xl p-8 ${
                  tier.popular 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                    : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-400 text-amber-900 font-bold shadow-lg">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-4xl font-black mb-1">{tier.price}</div>
                <div className={`text-sm mb-6 ${tier.popular ? 'text-white/80' : 'text-slate-400'}`}>
                  {tier.confirmation} confirmation
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${tier.popular ? 'text-white' : 'text-cyan-400'}`} />
                      <span className={tier.popular ? 'text-white/90' : 'text-slate-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-6 font-bold ${
                    tier.popular 
                      ? 'bg-white text-blue-600 hover:bg-slate-100' 
                      : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  }`}
                  onClick={() => navigate("/contact")}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Notaries CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20">For Notaries</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join the Elite Network
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Top performers earn first dibs on orders, 2-day fast pay, and premium rates. 
              Our scoring system rewards excellence.
            </p>
            <div className="grid sm:grid-cols-4 gap-6 mb-10">
              {[
                { icon: Banknote, label: "2-7 Day Pay" },
                { icon: Award, label: "Elite Tier Benefits" },
                { icon: TrendingUp, label: "Performance Routing" },
                { icon: HeadphonesIcon, label: "Dedicated Support" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-white font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <Button 
              size="lg"
              onClick={() => navigate("/apply")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-10 py-7 font-bold shadow-lg"
            >
              Apply to Join Network
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-100">Client Success</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Trusted by Title & Lending Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg text-slate-700 mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                    <div className="text-sm text-cyan-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Never Miss a Closing?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Start with a no-risk pilot. First 10 signings free. 
              3-minute confirmation guarantee. Zero-defect QA promise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-10 py-7 font-bold shadow-lg shadow-cyan-500/25 group"
              >
                Start Your Free Pilot
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-slate-600 text-white hover:bg-white/10 text-lg px-10 py-7 font-semibold bg-transparent"
              >
                <Phone className="mr-2 w-5 h-5" />
                Schedule a Call
              </Button>
            </div>
            <p className="mt-8 text-slate-400 text-sm">
              Questions? Call us at <a href="tel:814-480-0989" className="text-cyan-400 hover:underline">(814) 480-0989</a> or email <a href="mailto:closings@notroom.com" className="text-cyan-400 hover:underline">closings@notroom.com</a>
            </p>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default SigningServicesHome;

