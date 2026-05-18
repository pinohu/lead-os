import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Star, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const Subscriptions = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("booking-form");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const ronPlans = [
    {
      icon: Zap,
      name: "Lite",
      price: "$99",
      period: "/month",
      badge: "Individual",
      description: "Perfect for occasional remote notarization needs",
      features: [
        "5 RON credits included ($25 per session value)",
        "Additional sessions: $15 each",
        "Evening & weekend appointments",
        "Digital certificate & secure storage",
        "10-year record retention",
        "Email support"
      ],
      savings: "Save 58% vs pay-per-use",
      cta: "Start Lite Plan"
    },
    {
      icon: Star,
      name: "Professional",
      price: "$299",
      period: "/month",
      badge: "Most Popular",
      featured: true,
      description: "Ideal for attorneys, real estate agents, and small businesses",
      features: [
        "20 RON credits included ($25 per session value)",
        "Additional sessions: $12 each",
        "Priority scheduling queue",
        "Evening & weekend appointments",
        "Digital certificate & secure storage",
        "Dedicated support phone line",
        "Monthly usage reports",
        "Quarterly compliance review"
      ],
      savings: "Save 65% vs pay-per-use",
      cta: "Start Professional"
    },
    {
      icon: Crown,
      name: "Enterprise",
      price: "Custom",
      period: "",
      badge: "Corporate",
      description: "For law firms, title companies, and high-volume users",
      features: [
        "Unlimited RON sessions",
        "API integration available",
        "White-label option",
        "24/7 priority support",
        "Dedicated account manager",
        "Custom workflow integration",
        "Team training included",
        "Volume pricing for additional services"
      ],
      savings: "Maximum value for teams",
      cta: "Contact Sales"
    }
  ];

  const businessBundles = [
    {
      name: "Remote Docs Pro",
      price: "$199",
      period: "/month",
      description: "Complete remote notarization package",
      features: [
        "8 RON credits per month",
        "Secure document vault",
        "Priority scheduling",
        "Add-ons: Apostille concierge $199 + fees each",
        "Add-ons: I-9 remote verification $39/employee (E-Verify)",
        "10% discount on all additional services"
      ]
    },
    {
      name: "Small Firm Plan",
      price: "$399",
      period: "/month",
      description: "Comprehensive solution for professional practices",
      features: [
        "20 RON credits per month",
        "Quarterly audit reports",
        "10% off apostille concierge services",
        "1 free mobile I-9 visit included",
        "Registered office option available",
        "Compliance calendar & reminders"
      ]
    },
    {
      name: "Business Launch Pack",
      price: "$349",
      period: "one-time + state fees",
      description: "Complete Pennsylvania business formation",
      features: [
        "LLC formation filing",
        "Registered office address (1 year included)",
        "EIN application assistance",
        "Operating agreement template",
        "Compliance calendar setup",
        "2 RON credits included"
      ]
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Notary Subscription Plans Pennsylvania",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Notroom"
    },
    "description": "Subscription plans for remote online notarization and business services in Pennsylvania. Monthly plans with volume discounts.",
    "offers": [
      {
        "@type": "Offer",
        "price": "99",
        "priceCurrency": "USD",
        "name": "RON Lite Plan"
      },
      {
        "@type": "Offer",
        "price": "299",
        "priceCurrency": "USD",
        "name": "RON Professional Plan"
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Subscription Plans - RON & Business Services | PA"
        description="Monthly subscription plans for remote online notarization, business filing, and compliance services in Pennsylvania. Save up to 65% with our professional plans. From $99/month."
        keywords="notary subscription PA, RON monthly plan, business filing subscription, Pennsylvania notary packages"
        canonical="https://notroom.com/subscriptions"
        schema={schema}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Subscription Plans
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Save Time & Money with Monthly Plans
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Predictable pricing, priority access, and significant savings for individuals and businesses that need regular notary and compliance services.
            </p>
          </div>
        </div>
      </section>

      {/* RON Subscription Plans */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Remote Online Notary (RON) Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your notarization volume. All plans include Pennsylvania-authorized RON technology and 10-year secure storage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {ronPlans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={index} 
                  className={`relative p-8 ${plan.featured ? 'border-primary border-4 shadow-2xl' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className={`${plan.featured ? 'bg-primary' : 'bg-muted'} px-4 py-1`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <p className="text-center text-muted-foreground mb-6 min-h-[48px]">
                    {plan.description}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-center text-sm text-primary font-semibold mb-6">
                    {plan.savings}
                  </p>

                  <Button 
                    className={`w-full ${plan.featured ? 'bg-primary' : ''}`}
                    onClick={scrollToBooking}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business Bundles */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Business Service Bundles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive packages combining multiple services for businesses, law firms, and entrepreneurs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {businessBundles.map((bundle, index) => (
              <Card key={index} className="p-8">
                <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">{bundle.price}</span>
                  <span className="text-muted-foreground">{bundle.period}</span>
                </div>

                <p className="text-muted-foreground mb-6">{bundle.description}</p>

                <ul className="space-y-3 mb-6">
                  {bundle.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" onClick={scrollToBooking}>
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Solutions */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Enterprise Solution?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            For title companies, law firms, universities, hospitals, and corporations needing volume notarization, apostille services, or I-9 verification programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={scrollToBooking}
              variant="secondary"
            >
              Request Enterprise Proposal
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.location.href = "tel:814-480-0989"}
            >
              Call (814) 480-0989
            </Button>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <LegalDisclaimer />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Subscriptions;
