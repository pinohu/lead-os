import { Shield, Award, CheckCircle, Star, Building, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ScrollReveal from "../ScrollReveal";
import nsaBadge from "@/assets/nsa_member_badge.png";
import nnaMemberBadge from "@/assets/nna_member_badge.png";
import panMemberBadge from "@/assets/pan_member_badge.png";
import nngUxcBadge from "@/assets/nng_uxc_badge.png";
import { COMMISSION_INFO } from "@/constants/commission";

const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: "PA State Licensed",
      subtitle: `Commission #${COMMISSION_INFO.commissionNumber}`,
      color: "primary"
    },
    {
      icon: Award,
      title: "NNA Certified NSA",
      subtitle: `Account #${COMMISSION_INFO.nnaAccountNumber}`,
      color: "success-green"
    },
    {
      icon: Building,
      title: "Registered CROP",
      subtitle: "PA Dept of State",
      color: "action-cyan"
    },
    {
      icon: FileCheck,
      title: "$100K E&O",
      subtitle: "Insured & Bonded",
      color: "urgency-amber"
    },
    {
      icon: CheckCircle,
      title: "RULONA Compliant",
      subtitle: "Act 97 of 2020",
      color: "primary"
    }
  ];

  return (
    <section className="py-12 bg-background border-y">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Trusted & Verified</h3>
            <p className="text-muted-foreground">
              Fully licensed, insured, and certified professional services
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-4 rounded-full bg-[hsl(var(--${badge.color}))]/10 mb-3`}>
                    <Icon className={`w-8 h-8 text-[hsl(var(--${badge.color}))]`} />
                  </div>
                  <div className="font-bold text-sm mb-1">{badge.title}</div>
                  <div className="text-xs text-muted-foreground">{badge.subtitle}</div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={300}>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Badge className="px-4 py-2 text-sm">
              ✓ Background Checked
            </Badge>
            <Badge className="px-4 py-2 text-sm">
              ✓ NNA Certified
            </Badge>
            <Badge className="px-4 py-2 text-sm">
              ✓ Same-Day Available
            </Badge>
            <Badge className="px-4 py-2 text-sm">
              ✓ 5 Counties Served
            </Badge>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-8 px-4">
            <a 
              href="https://www.nationalnotary.org/knowledge-center/signing-agent-resources"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img 
                src={nsaBadge}
                alt="Certified NNA Notary Signing Agent 2025" 
                width="140" 
                height="140"
                title="Certified NNA Notary Signing Agent 2025"
                className="object-contain"
              />
            </a>
            <a 
              href="https://www.nationalnotary.org"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img 
                src={nnaMemberBadge}
                alt="National Notary Association Member" 
                width="140" 
                height="140"
                title="National Notary Association Member"
                className="object-contain"
              />
            </a>
            <a 
              href="https://panotary.org"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img 
                src={panMemberBadge}
                alt="Pennsylvania Association of Notaries Member" 
                width="140" 
                height="140"
                title="Pennsylvania Association of Notaries Member"
                className="object-contain"
              />
            </a>
            <a 
              href="https://www.nngroup.com/ux-certification/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img 
                src={nngUxcBadge}
                alt="Nielsen Norman Group UX Certified" 
                width="140" 
                height="140"
                title="Nielsen Norman Group UX Certified"
                className="object-contain"
              />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TrustBadges;