import { Award, Shield, Users, TrendingUp, Star, DollarSign, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "../ScrollReveal";
import { COMMISSION_INFO, getRonPlatformsDisplay } from "@/constants/commission";

const AuthorityBuilder = () => {
  const credentials = [
    {
      icon: Shield,
      title: "PA State Commission",
      description: `Commissioned notary public by the Pennsylvania Department of State with authority to notarize throughout Pennsylvania. Commissioned in ${COMMISSION_INFO.county}.`,
      proof: `Commission #${COMMISSION_INFO.commissionNumber} | Expires: ${COMMISSION_INFO.commissionExpires}`
    },
    {
      icon: DollarSign,
      title: "Bonded & Insured",
      description: `${COMMISSION_INFO.bondAmount} surety bond and ${COMMISSION_INFO.eoInsurance} E&O insurance. Exceeds Pennsylvania's statutory requirements and protects every transaction.`,
      proof: `Bonded: ${COMMISSION_INFO.bondAmount} | E&O: ${COMMISSION_INFO.eoInsurance}`
    },
    {
      icon: Award,
      title: "NNA Certified Signing Agent",
      description: "National Notary Association certification for loan documents. Background-screened and tested on proper signing procedures",
      proof: `NNA Account #${COMMISSION_INFO.nnaAccountNumber}`
    },
    {
      icon: Users,
      title: "RON Authorized",
      description: `Authorized for Remote Online Notarization (RON) effective ${COMMISSION_INFO.ronAuthorized}. Fully compliant with PA's Revised Uniform Law on Notarial Acts (57 Pa.C.S. § 321 et seq.).`,
      proof: `RON Authorized: ${COMMISSION_INFO.ronAuthorized} | Platforms: ${getRonPlatformsDisplay()}`
    }
  ];

  const achievements = [
    { metric: "6", label: "Essential Services", icon: Star },
    { metric: "5", label: "Counties Served", icon: Users },
    { metric: "Same-Day", label: "Availability", icon: TrendingUp },
    { metric: "100%", label: "PA Compliant", icon: Award }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-block mb-4 px-6 py-2 bg-[hsl(var(--primary))]/10 rounded-full border border-[hsl(var(--primary))]/20">
                <span className="text-[hsl(var(--primary))] font-bold">CREDENTIALS & EXPERTISE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Licensed, Certified & Trusted
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                You're not just getting a notary—you're getting a fully credentialed professional with proven expertise and comprehensive protection.
              </p>
            </div>
          </ScrollReveal>

          {/* Credentials Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {credentials.map((credential, index) => {
              const Icon = credential.icon;
              return (
                <ScrollReveal key={index} delay={index * 100}>
                  <Card className="border-2 border-[hsl(var(--primary))]/20 hover:border-[hsl(var(--primary))] hover:shadow-xl transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[hsl(var(--primary))]/10 flex-shrink-0">
                          <Icon className="w-8 h-8 text-[hsl(var(--primary))]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{credential.title}</h3>
                          <p className="text-muted-foreground mb-3">{credential.description}</p>
                          <div className="bg-[hsl(var(--success-green))]/5 rounded-lg p-3 border-l-4 border-[hsl(var(--success-green))]">
                            <p className="text-sm font-semibold text-[hsl(var(--success-green))]">
                              ✓ {credential.proof}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Achievements Bar */}
          <ScrollReveal delay={400}>
            <Card className="bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--action-cyan))]/10 border-2 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center mb-8">Proven Track Record</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <div key={index} className="text-center">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-[hsl(var(--primary))]/10 mb-3">
                          <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
                        </div>
                        <p className="text-4xl font-bold text-[hsl(var(--primary))] mb-1">
                          {achievement.metric}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {achievement.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Trust Statement */}
          <ScrollReveal delay={500}>
            <div className="text-center mt-12">
              <Card className="inline-block p-8 bg-muted/30 max-w-3xl">
                <p className="text-lg leading-relaxed">
                  "When you choose Notroom, you're choosing a <strong className="text-foreground">state-licensed, nationally-certified professional</strong> committed to excellence. 
                  We're not a marketplace connecting you to random notaries—we're a dedicated notary business with verified credentials, proper insurance, and full compliance with Pennsylvania law."
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  — Ron Barto, Principal Notary & Owner
                </p>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default AuthorityBuilder;
