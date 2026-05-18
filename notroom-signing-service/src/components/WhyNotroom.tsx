import { Zap, Lock, Shield, DollarSign } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import ScrollReveal from "./ScrollReveal";
import { memo } from "react";

const WhyNotroom = memo(() => {
  const advantages = [
    {
      icon: Zap,
      title: "Complete Service Suite",
      description: "6 essential services: notary (remote & mobile), loan signing, apostille, I-9 verification, and business filings—all in one place."
    },
    {
      icon: Lock,
      title: "Fully Licensed & Compliant",
      description: "PA-commissioned notary, registered CROP with PA DOS, NNA-certified signing agent. Compliant with RULONA, Act 97, and 15 Pa.C.S."
    },
    {
      icon: Shield,
      title: "Local Expertise, Statewide Reach",
      description: "Based in Erie with mobile service across PA counties. Remote notarization and business services available statewide."
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Clear, itemized pricing for every service. No hidden fees. Know exactly what you'll pay before booking."
    }
  ];

  const stats = [
    { number: "6", label: "Essential Services" },
    { number: "Same-Day", label: "Availability" },
    { number: "5", label: "Counties Served" },
    { number: "100%", label: "PA Compliant" }
  ];

  return (
    <section id="why-notroom" className="py-20 bg-background" aria-labelledby="why-notroom-heading">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="why-notroom-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Notroom?
          </h2>
          <p className="text-xl text-muted-foreground">
            Your one-stop solution for notary, business filing, compliance, and legal document services in Erie, PA
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16" role="list" aria-label="Why choose Notroom advantages">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="text-center" role="listitem">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300" aria-hidden="true">
                      <Icon className="w-10 h-10 text-primary-foreground" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {advantage.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Stats Bar */}
        <ScrollReveal>
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 shadow-2xl" role="region" aria-label="Company statistics">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8" role="list">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" role="listitem">
                  <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2" aria-label={`${stat.number} ${stat.label}`}>
                    {stat.number.includes('+') ? (
                      <>
                        <AnimatedCounter end={parseInt(stat.number)} />+
                      </>
                    ) : (
                      stat.number
                    )}
                  </div>
                  <div className="text-primary-foreground/90 font-medium" aria-hidden="true">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
});

WhyNotroom.displayName = 'WhyNotroom';

export default WhyNotroom;
